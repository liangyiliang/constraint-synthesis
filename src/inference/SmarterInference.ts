import {
  AbstractLayout,
  PredSelector,
  prettyAbstractLayout,
  prettySelector,
  Selector,
  SigSelector,
} from '../constraint_language/abstract/AbstractLayout';
import {
  AbstractLayoutSubst,
  applySubstitution,
  selectorsToSubsts,
} from '../constraint_language/abstract/AbstractLayoutSemantics';

import { TypeEnv } from '../constraint_language/abstract/CheckAbstractLayout';
import {
  AtomInConstraint,
  BinaryLayout,
  BinaryLayoutOption,
  BinaryLayoutOptions,
  BoundAtom,
  BoundConcrete,
  ConcreteLayout,
  CyclicLayout,
  CyclicLayoutOption,
  CyclicLayoutOptions,
  GroupingLayout,
  prettyConcreteLayout,
  UnaryLayout,
  UnaryLayoutOption,
  UnaryLayoutOptions,
  UnboundAtom,
  UnboundConcrete,
} from '../constraint_language/concrete/ConcreteLayout';
import { Instance } from '../model_instance/Instance';
import { Model } from '../model_instance/Model';
import { cartesianProduct } from '../utils/utils';
import {
  AbstractDiagram,
  computeConfidence,
  confidenceOfConcrete,
} from './ConfidenceScore';

type Footprint =
  | UnaryLayout<UnboundAtom>
  | CyclicLayout<UnboundAtom>
  | GroupingLayout<UnboundAtom>
  | (BinaryLayout<UnboundAtom> & {
      option: Exclude<
        BinaryLayoutOption,
        | 'Below'
        | 'RightOf'
        | 'DirectlyLeftOf'
        | 'DirectlyRightOf'
        | 'DirectlyAbove'
        | 'DirectlyBelow'
      >;
    });

const toFootprints = (uC: UnboundConcrete): Footprint[] => {
  if (uC.tag === 'BinaryLayout') {
    const { option, op0, op1 } = uC;
    const [orderedOp0, orderedOp1] =
      op0.name < op1.name ? [op0, op1] : [op1, op0];
    if (uC.option === 'Below') {
      return [
        {
          ...uC,
          option: 'Above',
          op0: op1,
          op1: op0,
        },
      ];
    } else if (uC.option === 'RightOf') {
      return [
        {
          ...uC,
          option: 'LeftOf',
          op0: op1,
          op1: op0,
        },
      ];
    } else if (uC.option === 'HorizontallyAligned') {
      return [
        {
          ...uC,
          option: 'HorizontallyAligned',
          op0: orderedOp0,
          op1: orderedOp1,
        },
      ];
    } else if (uC.option === 'VerticallyAligned') {
      return [
        {
          ...uC,
          option: 'VerticallyAligned',
          op0: orderedOp0,
          op1: orderedOp1,
        },
      ];
    } else if (uC.option === 'DirectlyAbove') {
      return [
        ...toFootprints({
          ...uC,
          option: 'Above',
          op0,
          op1,
        }),
        ...toFootprints({
          ...uC,
          option: 'VerticallyAligned',
          op0,
          op1,
        }),
      ];
    } else if (uC.option === 'DirectlyBelow') {
      return [
        ...toFootprints({
          ...uC,
          option: 'Below',
          op0,
          op1,
        }),
        ...toFootprints({
          ...uC,
          option: 'VerticallyAligned',
          op0,
          op1,
        }),
      ];
    } else if (uC.option === 'DirectlyLeftOf') {
      return [
        ...toFootprints({
          ...uC,
          option: 'LeftOf',
          op0,
          op1,
        }),
        ...toFootprints({
          ...uC,
          option: 'HorizontallyAligned',
          op0,
          op1,
        }),
      ];
    } else if (uC.option === 'DirectlyRightOf') {
      return [
        ...toFootprints({
          ...uC,
          option: 'RightOf',
          op0,
          op1,
        }),
        ...toFootprints({
          ...uC,
          option: 'HorizontallyAligned',
          op0,
          op1,
        }),
      ];
    } else {
      return [
        {
          ...uC,
          option: uC.option, // hack, why?
        },
      ];
    }
  } else {
    return [uC];
  }
};

type TerminalConcreteResult = {
  inferred: BoundConcrete;
  footprints: Footprint[];
  confidence: number;
};

const checkTerminalConcrete = (
  concrete: BoundConcrete,
  substs: AbstractLayoutSubst[],
  diagram: AbstractDiagram
): TerminalConcreteResult | undefined => {
  const THRESHOLD = 0.9;
  const unboundConcretes: UnboundConcrete[] = substs.map(s => {
    return applySubstitution(concrete, s, 'not-used');
  });

  const confs: number[] = unboundConcretes.map(uC =>
    confidenceOfConcrete(uC, diagram)
  );

  const logConfs = confs.map(c => Math.log(c));
  const sumLogConfs = logConfs.reduce((acc, c) => acc + c, 0);
  const avgLogConf = sumLogConfs / logConfs.length;
  const compoundConf = Math.exp(avgLogConf);

  const satisfied = compoundConf > THRESHOLD;

  if (satisfied) {
    return {
      inferred: concrete,
      footprints: unboundConcretes.map(toFootprints).flat(),
      confidence: compoundConf,
    };
  } else {
    return undefined;
  }
};

const getSatisfyingBoundConcretes = (
  env: TypeEnv,
  substs: AbstractLayoutSubst[],
  diagram: AbstractDiagram
): TerminalConcreteResult[] => {
  const vars = Object.keys(env);
  if (vars.length === 0) {
    return [];
  }

  const results: TerminalConcreteResult[] = [];

  for (const unaryOption of UnaryLayoutOptions) {
    for (const varname of vars) {
      const concrete: ConcreteLayout<BoundAtom> = {
        tag: 'UnaryLayout',
        op: { tag: 'BoundAtom', name: varname },
        separation: { tag: 'NoneSpecified' },
        option: unaryOption,
      };

      const checked = checkTerminalConcrete(concrete, substs, diagram);
      if (checked !== undefined) {
        results.push(checked);
      }
    }
  }
  for (const binaryOption of BinaryLayoutOptions) {
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
          const checked = checkTerminalConcrete(concrete, substs, diagram);
          if (checked !== undefined) {
            results.push(checked);
          }
        }
      }
    }
  }

  // ignore cyclic layouts for now
  // ignore group layouts for now

  return results;
};

type InferredAbstractLayout = {
  inferred: AbstractLayout;
  confidence: number;
  footprints: Footprint[];
};

export const prettyInferredAbstractLayout = (
  inferred: InferredAbstractLayout,
  withConfidence: boolean = true
) => {
  const { inferred: abstractLayout, confidence } = inferred;
  const str = prettyAbstractLayout(abstractLayout);
  if (withConfidence) {
    return str + '; confidence = ' + confidence;
  } else {
    return str;
  }
};

const composeAbstractLayoutHelper = (
  selectors: Selector[],
  concrete: BoundConcrete
): AbstractLayout => {
  if (selectors.length > 1) {
    const [selector, ...rest] = selectors;
    return {
      tag: 'AbstractLayout',
      selector,
      layout: composeAbstractLayoutHelper(rest, concrete),
    };
  } else if (selectors.length === 1) {
    return {
      tag: 'AbstractLayout',
      selector: selectors[0],
      layout: concrete,
    };
  } else {
    throw new Error(
      'composeAbstractLayoutHelper called with empty selectors array'
    );
  }
};

const composeAbstractLayout = (
  selectors: Selector[],
  concreteResult: TerminalConcreteResult
): InferredAbstractLayout => {
  const { inferred: concrete, footprints, confidence } = concreteResult;
  return {
    inferred: composeAbstractLayoutHelper(selectors, concrete),
    confidence,
    footprints,
  };
};

const genSigSelectors = (
  model: Model,
  typeEnv: TypeEnv,
  numVarsAvailable: number
): SigSelector[] => {
  const sss: SigSelector[] = [];
  for (const sig of model.signatures) {
    const varname = `v${numVarsAvailable}`;
    const existing = typeEnv[varname];
    if (existing === undefined) {
      sss.push({
        tag: 'SigSelector',
        sig,
        varname,
      });
    } else if (existing === sig) {
      // okay
    } else {
      throw new Error(
        `Type environment already has ${varname} bound to sig ${existing}, but trying to bind it to sig ${sig}`
      );
    }
  }
  return sss;
};

const genPredSelectors = (model: Model, typeEnv: TypeEnv): PredSelector[] => {
  const sigVarnamesMap: Map<string, string[]> = new Map();
  for (const [varname, sig] of Object.entries(typeEnv)) {
    const existing = sigVarnamesMap.get(sig);
    if (existing === undefined) {
      sigVarnamesMap.set(sig, [varname]);
    } else {
      existing.push(varname);
    }
  }

  const pss: PredSelector[] = [];
  for (const pred of model.predicates) {
    const { name, sigs } = pred;

    const possVarnames = sigs.map(s => sigVarnamesMap.get(s) ?? []);
    const prod = cartesianProduct(possVarnames);

    for (const p of prod) {
      pss.push({
        tag: 'PredSelector',
        pred: name,
        args: p,
      });
    }
  }

  return pss;
};

export const genAbstractLayouts = (
  bound: number,
  model: Model,
  instance: Instance,
  diag: AbstractDiagram
): InferredAbstractLayout[] => {
  const footprintAbstractLayoutMap: Map<string, InferredAbstractLayout> =
    new Map();
  for (let i = 0; i < bound; i++) {
    genAbstractLayoutsHelper(
      i,
      [],
      [],
      model,
      instance,
      diag,
      {},
      'sig',
      footprintAbstractLayoutMap,
      0
    );
  }
  return [...footprintAbstractLayoutMap.values()];
};

const abstractLayoutComplexity = (
  l: AbstractLayout | BoundConcrete
): number => {
  if (l.tag === 'AbstractLayout') {
    return 1 + abstractLayoutComplexity(l.layout);
  } else {
    return 1;
  }
};

const addAbstractLayout = (
  abstractLayouts: Map<string, InferredAbstractLayout>,
  a: InferredAbstractLayout
): void => {
  const { footprints } = a;
  const effectsStr = new Array(...new Set(footprints.map(prettyConcreteLayout)))
    .toSorted()
    .join(', ');

  const curr = abstractLayouts.get(effectsStr);
  if (curr === undefined) {
    abstractLayouts.set(effectsStr, a);
  } else {
    // prefer the one with lower complexity
    if (
      abstractLayoutComplexity(a.inferred) <
      abstractLayoutComplexity(curr.inferred)
    ) {
      abstractLayouts.set(effectsStr, a);
    }
  }
};

const genAbstractLayoutsHelper = (
  bound: number,
  sigSelectors: SigSelector[],
  predSelectors: PredSelector[],
  model: Model,
  instance: Instance,
  diag: AbstractDiagram,
  typeEnv: TypeEnv,
  thisSelectorType: 'sig' | 'pred',
  footprintAbstractLayoutMap: Map<string, InferredAbstractLayout>,
  numVarsAvailable: number
): void => {
  if (bound === 0) {
    const substs: AbstractLayoutSubst[] = selectorsToSubsts(
      [...sigSelectors, ...predSelectors],
      model,
      instance
    );

    const inferredConcretes = getSatisfyingBoundConcretes(
      typeEnv,
      substs,
      diag
    );

    for (const inferredConcrete of inferredConcretes) {
      const a = composeAbstractLayout(
        [...sigSelectors, ...predSelectors],
        inferredConcrete
      );

      let b = a;
      addAbstractLayout(footprintAbstractLayoutMap, b);
    }
    return;
  }

  const nextSelectorTypes =
    thisSelectorType === 'sig'
      ? (['pred', 'sig'] as const)
      : (['pred'] as const);

  const thisGeneratedSelectors =
    thisSelectorType === 'sig'
      ? genSigSelectors(model, typeEnv, numVarsAvailable)
      : genPredSelectors(model, typeEnv);

  for (const s of thisGeneratedSelectors) {
    for (const next of nextSelectorTypes) {
      if (s.tag === 'SigSelector') {
        const newTypeEnv: TypeEnv = { ...typeEnv, [s.varname]: s.sig };
        genAbstractLayoutsHelper(
          bound - 1,
          [...sigSelectors, s],
          predSelectors,
          model,
          instance,
          diag,
          newTypeEnv,
          next,
          footprintAbstractLayoutMap,
          numVarsAvailable + 1
        );
      } else {
        genAbstractLayoutsHelper(
          bound - 1,
          sigSelectors,
          [...predSelectors, s],
          model,
          instance,
          diag,
          typeEnv,
          next,
          footprintAbstractLayoutMap,
          numVarsAvailable
        );
      }
    }
  }
};
