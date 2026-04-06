import {
  AbstractLayout,
  PredSelector,
  Selector,
  SigSelector,
} from '../../../constraint_language/abstract/AbstractLayout';
import {
  AbstractLayoutSubst,
  applySubstitution,
  selectorsToSubsts,
} from '../../../constraint_language/abstract/AbstractLayoutSemantics';
import { TypeEnv } from '../../../constraint_language/abstract/CheckAbstractLayout';
import {
  BinaryLayout,
  BoundAtom,
  BoundConcrete,
  prettyConcreteLayout,
  UnaryLayout,
  UnaryLayoutOptions,
} from '../../../constraint_language/concrete/ConcreteLayout';
import { Model } from '../../../model_instance/Model';
import { clauseComplexity, makeClause } from '../clauses/Clauses';
import { genPredSelectors, genSigSelectors } from '../clauses/Selectors';
import { confidenceOfConcrete } from '../confidences/ConfidenceScore';
import {
  InstancedFootprint,
  toCanonicalizedFootprints,
} from '../footprints/Footprint';
import { AbstractDiagram, InstanceDiagramPair } from '../inputs/Inputs';

export const FirstPassBinaryLayoutOptions = [
  'LeftOf',
  'RightOf',
  'Above',
  'Below',
  'DirectlyLeftOf',
  'DirectlyRightOf',
  'DirectlyAbove',
  'DirectlyBelow',
  'HorizontallyAligned',
  'VerticallyAligned',
  'Contains',
] as const;

type ConcreteSatisfaction = {
  footprints: InstancedFootprint[];
  confidence: number;
};

const checkConcreteSatisfaction = (
  concrete: BoundConcrete,
  substsDiagPairs: { substs: AbstractLayoutSubst[]; diag: AbstractDiagram }[]
): ConcreteSatisfaction | undefined => {
  const THRESHOLD = 0.9;

  // I have a concrete layout with no variables.
  // I need to check whether or not it applies to every (instance, diagram) pairs.

  const allConfs: number[] = [];
  const allFootprints: InstancedFootprint[] = [];

  for (let i = 0; i < substsDiagPairs.length; i++) {
    const { substs, diag } = substsDiagPairs[i];

    const unboundConcretes = substs.map(s => ({
      uC: applySubstitution(concrete, s, 'not-used'),
      instanceId: i,
    }));

    const confs: number[] = unboundConcretes.map(uC =>
      confidenceOfConcrete(uC.uC, diag)
    );

    allConfs.push(...confs);

    allFootprints.push(
      ...unboundConcretes
        .map(uc => toCanonicalizedFootprints(uc.uC, uc.instanceId))
        .flat()
    );
  }

  if (allConfs.length === 0) {
    return undefined;
  }

  const logConfs = allConfs.map(c => Math.log(c));
  const sumLogConfs = logConfs.reduce((acc, c) => acc + c, 0);
  const avgLogConf = sumLogConfs / logConfs.length;
  const compoundConf = Math.exp(avgLogConf);

  if (compoundConf < THRESHOLD) {
    return undefined;
  }

  return {
    // inferred: concrete,
    footprints: allFootprints,
    confidence: compoundConf,
  };
};

const check = (
  model: Model,
  pairs: InstanceDiagramPair[],
  selectors: Selector[],
  concretes: BoundConcrete[]
): (AbstractLayout & {
  confidence: number;
  footprints: InstancedFootprint[];
})[] => {
  const substsDiagPairs = pairs.map(({ instance, diag }) => ({
    instance,
    substs: selectorsToSubsts(selectors, model, instance),
    diag,
  }));

  const clauses: (AbstractLayout & {
    confidence: number;
    footprints: InstancedFootprint[];
  })[] = [];

  for (const concrete of concretes) {
    // check if this concrete is satisfied by every instance, diagram pair
    const res = checkConcreteSatisfaction(concrete, substsDiagPairs);
    if (res !== undefined) {
      const { confidence, footprints } = res;
      const clause = makeClause(selectors, concrete);
      clauses.push({
        ...clause,
        confidence,
        footprints,
      });
    }
  }

  return clauses;
};

const genConcretes = (env: TypeEnv): BoundConcrete[] => {
  const vars = Object.keys(env);
  if (vars.length === 0) {
    return [];
  }

  const boundConcretes: BoundConcrete[] = [];
  for (const unaryOption of UnaryLayoutOptions) {
    for (const varname of vars) {
      const concrete: UnaryLayout<BoundAtom> = {
        tag: 'UnaryLayout',
        op: { tag: 'BoundAtom', name: varname },
        separation: { tag: 'NoneSpecified' },
        option: unaryOption,
      };

      boundConcretes.push(concrete);
    }
  }

  for (const binaryOption of FirstPassBinaryLayoutOptions) {
    for (const v0 of vars) {
      for (const v1 of vars) {
        if (v0 !== v1) {
          const concrete: BinaryLayout<BoundAtom> = {
            tag: 'BinaryLayout',
            op0: { tag: 'BoundAtom', name: v0 },
            op1: { tag: 'BoundAtom', name: v1 },
            separation: { tag: 'NoneSpecified' },
            option: binaryOption,
          };

          boundConcretes.push(concrete);
        }
      }
    }
  }

  return boundConcretes;
};

const addClauseToMap = (
  clauses: Map<string, AbstractLayout & { confidence: number }>,
  clause: AbstractLayout & {
    confidence: number;
    footprints: InstancedFootprint[];
  }
): void => {
  const { footprints } = clause;
  const footprintStr = new Array(
    ...new Set(footprints.map(prettyConcreteLayout))
  )
    .toSorted()
    .join(', ');

  const curr = clauses.get(footprintStr);
  if (curr === undefined) {
    clauses.set(footprintStr, clause);
  } else {
    if (clauseComplexity(clause) < clauseComplexity(curr)) {
      clauses.set(footprintStr, clause);
    }
  }
};

const genHelper = (
  bound: number,
  sigSelectors: SigSelector[],
  predSelectors: PredSelector[],
  model: Model,
  pairs: InstanceDiagramPair[],
  typeEnv: TypeEnv,
  thisPartType: 'sig' | 'pred' | 'concrete',
  footprintClauseMap: Map<string, AbstractLayout & { confidence: number }>,
  numVarsAvailable: number
) => {
  if (bound === 0 || thisPartType === 'concrete') {
    const selectors = [...sigSelectors, ...predSelectors];

    const concretes = genConcretes(typeEnv);
    const clauses = check(model, pairs, selectors, concretes);

    for (const clause of clauses) {
      addClauseToMap(footprintClauseMap, clause);
    }
    return;
  }

  // thisPartType is either 'sig' or 'pred' now

  const nextPartTypes =
    thisPartType === 'sig'
      ? (['sig', 'pred', 'concrete'] as const)
      : (['pred', 'concrete'] as const);

  const thisGeneratedSelectors =
    thisPartType === 'sig'
      ? genSigSelectors(model, typeEnv, numVarsAvailable)
      : genPredSelectors(model, typeEnv);

  for (const thisGeneratedSelector of thisGeneratedSelectors) {
    for (const nextPartType of nextPartTypes) {
      if (thisGeneratedSelector.tag === 'SigSelector') {
        const newTypeEnv: TypeEnv = {
          ...typeEnv,
          [thisGeneratedSelector.varname]: thisGeneratedSelector.sig,
        };

        genHelper(
          bound - 1,
          [...sigSelectors, thisGeneratedSelector],
          predSelectors,
          model,
          pairs,
          newTypeEnv,
          nextPartType,
          footprintClauseMap,
          numVarsAvailable + 1
        );
      } else {
        genHelper(
          bound - 1,
          sigSelectors,
          [...predSelectors, thisGeneratedSelector],
          model,
          pairs,
          typeEnv,
          nextPartType,
          footprintClauseMap,
          numVarsAvailable
        );
      }
    }
  }
};

export const genFirstPassClauses = (
  bound: number,
  model: Model,
  pairs: InstanceDiagramPair[]
): (AbstractLayout & { confidence: number })[] => {
  if (pairs.length === 0) {
    return [];
  }

  const footprintClauseMap: Map<
    string,
    AbstractLayout & { confidence: number }
  > = new Map();

  genHelper(bound, [], [], model, pairs, {}, 'sig', footprintClauseMap, 0);

  return [...footprintClauseMap.values()];
};
