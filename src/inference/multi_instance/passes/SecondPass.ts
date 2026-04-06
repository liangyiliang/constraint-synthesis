import {
  AbstractLayout,
  PredSelector,
  Selector,
  SigSelector,
} from '../../../constraint_language/abstract/AbstractLayout';
import {
  AbstractLayoutSubst,
  selectorsToSubsts,
} from '../../../constraint_language/abstract/AbstractLayoutSemantics';
import { TypeEnv } from '../../../constraint_language/abstract/CheckAbstractLayout';
import {
  BoundAtom,
  CyclicLayout,
  CyclicLayoutOptions,
} from '../../../constraint_language/concrete/ConcreteLayout';
import { Model } from '../../../model_instance/Model';
import { clauseComplexity, makeClause } from '../clauses/Clauses';
import { genPredSelectors, genSigSelectors } from '../clauses/Selectors';
import { checkCyclicLayout } from '../confidences/CycleConfidence';
import {
  InstancedCycleFootprint,
  prettyInstancedCycleFootprint,
} from '../footprints/CycleFootprint';
import { AbstractDiagram, InstanceDiagramPair } from '../inputs/Inputs';

let clauseIdCounter = 0;
const clauseId = () => {
  const id = clauseIdCounter;
  clauseIdCounter++;
  return id;
};
const resetClauseId = () => {
  clauseIdCounter = 0;
};

const checkOneClause = (
  concrete: CyclicLayout<BoundAtom>,
  substsDiagPairs: { substs: AbstractLayoutSubst[]; diag: AbstractDiagram }[]
) => {
  const THRESHOLD = 0.9;

  const cid = clauseId();

  const allConfs: number[] = [];
  const allFootprints: InstancedCycleFootprint[] = [];

  for (let i = 0; i < substsDiagPairs.length; i++) {
    const { substs, diag } = substsDiagPairs[i];
    const { score, footprints } = checkCyclicLayout(
      substs,
      concrete,
      diag,
      cid,
      i
    );
    allConfs.push(score);
    allFootprints.push(...footprints);
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
    confidence: compoundConf,
    footprints: allFootprints,
  };
};

const check = (
  model: Model,
  pairs: InstanceDiagramPair[],
  selectors: Selector[],
  concretes: CyclicLayout<BoundAtom>[]
): (AbstractLayout & {
  confidence: number;
  footprints: InstancedCycleFootprint[];
})[] => {
  const substsDiagPairs = pairs.map(({ instance, diag }) => ({
    instance,
    substs: selectorsToSubsts(selectors, model, instance),
    diag,
  }));

  const clauses: (AbstractLayout & {
    confidence: number;
    footprints: InstancedCycleFootprint[];
  })[] = [];

  for (const concrete of concretes) {
    // We have selectors and a concrete
    // This "Clause = Selectors + Concrete" should satisfy all the pairs
    const res = checkOneClause(concrete, substsDiagPairs);

    if (res === undefined) {
      continue;
    }

    const { confidence, footprints } = res;

    if (footprints.length === 0) {
      continue;
    }

    const clause = makeClause(selectors, concrete);

    clauses.push({
      ...clause,
      confidence,
      footprints,
    });
  }

  return clauses;
};

const genConcretes = (env: TypeEnv): CyclicLayout<BoundAtom>[] => {
  const vars = Object.keys(env);
  if (vars.length === 0) {
    return [];
  }

  const boundConcretes: CyclicLayout<BoundAtom>[] = [];

  for (const cyclicOption of CyclicLayoutOptions) {
    for (const v0 of vars) {
      for (const v1 of vars) {
        if (v0 !== v1) {
          const concrete: CyclicLayout<BoundAtom> = {
            tag: 'CyclicLayout',
            op0: { tag: 'BoundAtom', name: v0 },
            op1: { tag: 'BoundAtom', name: v1 },
            option: cyclicOption,
            cycleId: undefined,
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
    footprints: InstancedCycleFootprint[];
  }
): void => {
  const { footprints } = clause;
  const footprintStr = new Array(
    ...new Set(footprints.map(prettyInstancedCycleFootprint))
  )
    .toSorted()
    .join('|');

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
  // footprintClauseMap: Map<string, AbstractLayout & { confidence: number }>,
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

export const genSecondPassClauses = (
  bound: number,
  model: Model,
  pairs: InstanceDiagramPair[]
): (AbstractLayout & {
  confidence: number;
})[] => {
  resetClauseId();

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
