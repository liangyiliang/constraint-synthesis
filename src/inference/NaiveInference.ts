import {
  AbstractLayout,
  PredSelector,
  prettyAbstractLayout,
  SigSelector,
} from '../constraint_language/AbstractLayout';
import { checkAbstractLayout } from '../constraint_language/CheckAbstractLayout';
import {
  BinaryLayoutOption,
  BoundAtom,
  ConcreteLayout,
  prettyConcreteLayout,
  SeparationOption,
  UnaryLayoutOption,
} from '../constraint_language/ConcreteLayout';
import { Instance } from '../model_instance/Instance';
import { Model, simpleCycleModel, simpleModel } from '../model_instance/Model';
import { AbstractDiagram, computeConfidence } from './ConstraintConfidence';

export const BOUND = 2;

/**
 * Generates all possible variable names up to a certain count
 */
const generateVariableNames = (count: number): string[] => {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    names.push(`v${i}`);
  }
  return names;
};

/**
 * Generates all possible sig selectors for a given model
 */
const generateSigSelectors = (model: Model): SigSelector[] => {
  const selectors: SigSelector[] = [];
  const varNames = generateVariableNames(BOUND);

  for (const sig of model.signatures) {
    for (const varname of varNames) {
      selectors.push({
        tag: 'SigSelector',
        sig,
        varname,
      });
    }
  }

  return selectors;
};

/**
 * Generates all possible predicate selectors for a given model
 */
const generatePredSelectors = (model: Model): PredSelector[] => {
  const selectors: PredSelector[] = [];
  const varNames = generateVariableNames(BOUND);

  for (const predicate of model.predicates) {
    const { name, sigs } = predicate;
    const arity = sigs.length;

    // Generate all combinations of variable names for this predicate's arity
    const generateArgCombinations = (argCount: number): string[][] => {
      if (argCount === 0) return [[]];
      if (argCount === 1) return varNames.map(name => [name]);

      const combinations: string[][] = [];
      for (let i = 0; i < varNames.length; i++) {
        for (let j = 0; j < varNames.length; j++) {
          if (argCount === 2) {
            combinations.push([varNames[i], varNames[j]]);
          } else {
            // For higher arity, we can extend this
            const subCombinations = generateArgCombinations(argCount - 1);
            for (const subComb of subCombinations) {
              combinations.push([varNames[i], ...subComb]);
            }
          }
        }
      }
      return combinations;
    };

    const argCombinations = generateArgCombinations(arity);

    for (const args of argCombinations) {
      selectors.push({
        tag: 'PredSelector',
        pred: name,
        args,
      });
    }
  }

  return selectors;
};

/**
 * Generates all possible concrete layouts using bound atoms
 */
const generateConcreteLayouts = (model: Model): ConcreteLayout<BoundAtom>[] => {
  const layouts: ConcreteLayout<BoundAtom>[] = [];
  const varNames = generateVariableNames(BOUND);
  const boundAtoms = varNames.map(name => ({
    tag: 'BoundAtom' as const,
    name,
  }));

  // Binary layout options
  const binaryOptions: BinaryLayoutOption[] = [
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
    'OutsideRingOf',
    'InsideRingOf',
    'Contains',
  ];

  // Unary layout options
  const unaryOptions: UnaryLayoutOption[] = [
    'LeftOfCenter',
    'RightOfCenter',
    'AboveCenter',
    'BelowCenter',
  ];

  // Separation options
  // const separationOptions: SeparationOption[] = [
  //   { tag: 'NoneSpecified' },
  //  { tag: 'AtLeast', distance: 50 },
  //  { tag: 'AtLeast', distance: 100 },
  //  { tag: 'Exact', distance: 50 },
  //  { tag: 'Exact', distance: 100 },
  //];

  // Generate binary layouts
  for (const option of binaryOptions) {
    for (let i = 0; i < boundAtoms.length; i++) {
      for (let j = 0; j < boundAtoms.length; j++) {
        if (i !== j) {
          layouts.push({
            tag: 'BinaryLayout',
            option,
            separation: {
              tag: 'NoneSpecified',
            },
            op0: boundAtoms[i],
            op1: boundAtoms[j],
          });
        }
      }
    }
  }

  // Generate unary layouts
  for (const option of unaryOptions) {
    for (const atom of boundAtoms) {
      layouts.push({
        tag: 'UnaryLayout',
        option,
        separation: { tag: 'NoneSpecified' },
        op: atom,
      });
    }
  }

  // Generate cyclic layouts
  const cyclicOptions = ['Clockwise', 'Counterclockwise'] as const;
  for (const option of cyclicOptions) {
    for (let i = 0; i < boundAtoms.length; i++) {
      for (let j = 0; j < boundAtoms.length; j++) {
        if (i !== j) {
          layouts.push({
            tag: 'CyclicLayout',
            option,
            op0: boundAtoms[i],
            op1: boundAtoms[j],
            cycleId: undefined,
          });
        }
      }
    }
  }

  // Generate grouping layouts
  for (const atom of boundAtoms) {
    layouts.push({
      tag: 'GroupingLayout',
      op: atom,
      groupId: undefined,
    });
  }

  return layouts;
};

export type AbstractLayoutWithConfidence = AbstractLayout & {
  confidence: number;
};

/**
 * Generates all possible abstract layouts up to a given bound
 */
export const generateAllAbstractLayouts = (
  model: Model,
  instance: Instance,
  diagram: AbstractDiagram,
  bound: number = BOUND
): AbstractLayout[] => {
  // Generate all possible selectors
  const sigSelectors = generateSigSelectors(model);
  const predSelectors = generatePredSelectors(model);
  const allSelectors = [...sigSelectors, ...predSelectors];

  // Generate all possible concrete layouts (base case)
  const concreteLayouts = generateConcreteLayouts(model);
  // layouts.push(...concreteLayouts);

  // Recursive function to generate abstract layouts
  const generateAbstractLayoutsRecursive = (
    currentBound: number
  ): (AbstractLayout | ConcreteLayout<BoundAtom>)[] => {
    if (currentBound <= 0) {
      return concreteLayouts;
    }

    const currentLayouts: (AbstractLayout | ConcreteLayout<BoundAtom>)[] = [];
    const innerLayouts = generateAbstractLayoutsRecursive(currentBound - 1);

    // For each selector, create abstract layouts with each inner layout
    for (const selector of allSelectors) {
      for (const innerLayout of innerLayouts) {
        currentLayouts.push({
          tag: 'AbstractLayout',
          selector,
          layout: innerLayout,
        });
      }
    }

    return currentLayouts;
  };

  // Generate abstract layouts up to the bound

  const layouts: AbstractLayoutWithConfidence[] = [];
  for (let i = 1; i <= bound; i++) {
    const abstractLayouts = generateAbstractLayoutsRecursive(i);
    for (const abs of abstractLayouts) {
      if (abs.tag === 'AbstractLayout' && checkAbstractLayout(abs, model)) {
        const conf = computeConfidence(abs, instance, model, diagram);
        if (conf > 0.5) {
          layouts.push({
            ...abs,
            confidence: conf,
          });
        }
      }
    }
  }

  return layouts;
};
