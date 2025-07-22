import {
  AbstractLayout,
  PredSelector,
  prettyAbstractLayout,
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

const binaryDescriptor = (
  op0: BoundAtom,
  option: BinaryLayoutOption,
  op1: BoundAtom
): string => {
  return `${op0.name} ${option} ${op1.name}`;
};

const cyclicDescriptor = (
  op0: BoundAtom,
  option: CyclicLayoutOption,
  op1: BoundAtom
): string => {
  return `${op0.name} ${option} ${op1.name}`;
};

const binaryEquivalentExisting = (
  concrete: BinaryLayout<BoundAtom>,
  existingDescriptors: string[]
): boolean => {
  const { op0, op1, option } = concrete;

  const oppositePairs: [BinaryLayoutOption, BinaryLayoutOption][] = [
    ['Above', 'Below'],
    ['Below', 'Above'],
    ['DirectlyAbove', 'DirectlyBelow'],
    ['DirectlyBelow', 'DirectlyAbove'],
    ['LeftOf', 'RightOf'],
    ['RightOf', 'LeftOf'],
    ['DirectlyLeftOf', 'DirectlyRightOf'],
    ['DirectlyRightOf', 'DirectlyLeftOf'],
    ['HorizontallyAligned', 'HorizontallyAligned'],
    ['VerticallyAligned', 'VerticallyAligned'],
  ];

  for (const [opposite0, opposite1] of oppositePairs) {
    if (
      option === opposite0 &&
      existingDescriptors.includes(binaryDescriptor(op1, opposite1, op0))
    ) {
      return true;
    }
  }

  return false;
};

type Footprint = UnboundConcrete;

const toFootprint = (uC: UnboundConcrete): Footprint => {
  if (uC.tag === 'BinaryLayout') {
    const { option, op0, op1 } = uC;
    const [orderedOp0, orderedOp1] =
      op0.name < op1.name ? [op0, op1] : [op1, op0];
    if (uC.option === 'Below') {
      return {
        ...uC,
        option: 'Above',
        op0: op1,
        op1: op0,
      };
    } else if (uC.option === 'RightOf') {
      return {
        ...uC,
        option: 'LeftOf',
        op0: op1,
        op1: op0,
      };
    } else if (uC.option === 'DirectlyBelow') {
      return {
        ...uC,
        option: 'DirectlyAbove',
        op0: op1,
        op1: op0,
      };
    } else if (uC.option === 'DirectlyRightOf') {
      return {
        ...uC,
        option: 'DirectlyLeftOf',
        op0: op1,
        op1: op0,
      };
    } else if (uC.option === 'HorizontallyAligned') {
      return {
        ...uC,
        option: 'HorizontallyAligned',
        op0: orderedOp0,
        op1: orderedOp1,
      };
    } else if (uC.option === 'VerticallyAligned') {
      return {
        ...uC,
        option: 'VerticallyAligned',
        op0: orderedOp0,
        op1: orderedOp1,
      };
    } else {
      return uC;
    }
  } else {
    return uC;
  }
};

type InferredConcrete = {
  inferred: BoundConcrete;
  footprints: Footprint[];
  confidence: number;
};

const checkTerminalConcrete = (
  concrete: UnaryLayout<BoundAtom> | BinaryLayout<BoundAtom>,
  substs: AbstractLayoutSubst[],
  diagram: AbstractDiagram
): InferredConcrete | undefined => {
  const THRESHOLD = 0.85;

  const unboundConcretes: ConcreteLayout<UnboundAtom>[] = substs.map(s =>
    applySubstitution(concrete, s, 'not-used')
  );

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
      footprints: unboundConcretes.map(toFootprint),
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
): InferredConcrete[] => {
  const vars = Object.keys(env);
  if (vars.length === 0) {
    return [];
  }

  const concretes: InferredConcrete[] = [];

  // unaries
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
        concretes.push(checked);
      }
    }
  }

  const consideredBinaryDescriptors: string[] = [];
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
          if (
            !binaryEquivalentExisting(concrete, consideredBinaryDescriptors)
          ) {
            const checked = checkTerminalConcrete(concrete, substs, diagram);
            if (checked !== undefined) {
              concretes.push(checked);
            }
          }
          consideredBinaryDescriptors.push(
            binaryDescriptor(concrete.op0, concrete.option, concrete.op1)
          );
        }
      }
    }
  }

  // ignore cyclic layouts for now
  // ignore group layouts for now

  return concretes;
};

type InferredAbstractLayout = {
  inferred: AbstractLayout;
  confidence: number;
  footprints: Footprint[];
};

export const prettyInferredAbstractLayout = (
  inferred: InferredAbstractLayout
) => {
  const { inferred: abstractLayout, confidence, footprints } = inferred;
  return prettyAbstractLayout(abstractLayout) + '; confidence = ' + confidence;
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
  inferredConcrete: InferredConcrete
): InferredAbstractLayout => {
  const { inferred: concrete, footprints, confidence } = inferredConcrete;
  return {
    inferred: composeAbstractLayoutHelper(selectors, concrete),
    confidence,
    footprints,
  };
};

const genVarnames = (bound: number): string[] => {
  return Array.from({ length: bound }, (_, i) => `v${i}`);
};

const genSigSelectors = (
  model: Model,
  typeEnv: TypeEnv,
  bound: number
): SigSelector[] => {
  const sss: SigSelector[] = [];
  for (const sig of model.signatures) {
    for (const varname of genVarnames(bound)) {
      if (typeEnv[varname] === sig) {
        // skip, already exists
      } else {
        sss.push({
          tag: 'SigSelector',
          sig,
          varname,
        });
      }
    }
  }
  return sss;
};

const genPredSelectors = (
  model: Model,
  typeEnv: TypeEnv,
  bound: number
): PredSelector[] => {
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
  const abstractLayouts: Map<string, InferredAbstractLayout> = new Map();
  for (let i = 0; i < bound; i++) {
    const thisResults = genAbstractLayoutsHelper(
      i,
      [],
      [],
      model,
      instance,
      diag,
      {},
      'sig'
    );
    for (const a of thisResults) {
      const { footprints } = a;

      const effectsStr = new Array(
        ...new Set(footprints.map(prettyConcreteLayout))
      )
        .toSorted()
        .join(', ');
      console.log(effectsStr);

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
    }
  }
  return [...abstractLayouts.values()];
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

const genAbstractLayoutsHelper = (
  bound: number,
  sigSelectors: SigSelector[],
  predSelectors: PredSelector[],
  model: Model,
  instance: Instance,
  diag: AbstractDiagram,
  typeEnv: TypeEnv,
  thisSelectorType: 'sig' | 'pred'
): InferredAbstractLayout[] => {
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

    return inferredConcretes.map(c =>
      composeAbstractLayout([...sigSelectors, ...predSelectors], c)
    );
  }

  const nextSelectorTypes =
    thisSelectorType === 'sig'
      ? (['pred', 'sig'] as const)
      : (['pred'] as const);

  const thisGeneratedSelectors =
    thisSelectorType === 'sig'
      ? genSigSelectors(model, typeEnv, bound)
      : genPredSelectors(model, typeEnv, bound);

  const abstractLayouts: Map<string, InferredAbstractLayout> = new Map();

  for (const s of thisGeneratedSelectors) {
    for (const next of nextSelectorTypes) {
      let generated;
      if (s.tag === 'SigSelector') {
        const newTypeEnv: TypeEnv = { ...typeEnv, [s.varname]: s.sig };
        generated = genAbstractLayoutsHelper(
          bound - 1,
          [...sigSelectors, s],
          predSelectors,
          model,
          instance,
          diag,
          newTypeEnv,
          next
        );
      } else {
        generated = genAbstractLayoutsHelper(
          bound - 1,
          sigSelectors,
          [...predSelectors, s],
          model,
          instance,
          diag,
          typeEnv,
          next
        );
      }

      for (const a of generated) {
        const { footprints } = a;
        const effectsStr = footprints
          .map(prettyConcreteLayout)
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
      }
    }
  }

  return [...abstractLayouts.values()];
};
