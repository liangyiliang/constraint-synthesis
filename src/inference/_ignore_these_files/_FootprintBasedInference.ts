import {
  AbstractLayout,
  PredSelector,
  prettyAbstractLayout,
  Selector,
  SigSelector,
} from '../../constraint_language/abstract/AbstractLayout';
import {
  AbstractLayoutSubst,
  applySubstitution,
  selectorsToSubsts,
} from '../../constraint_language/abstract/AbstractLayoutSemantics';
import { TypeEnv } from '../../constraint_language/abstract/CheckAbstractLayout';
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
} from '../../constraint_language/concrete/ConcreteLayout';
import { Instance } from '../../model_instance/Instance';
import { Model } from '../../model_instance/Model';
import { cartesianProduct } from '../../utils/utils';
import {
  AbstractDiagram,
  computeConfidence,
  confidenceOfConcrete,
} from '../ConfidenceScore';

// Footprint type - represents atomic constraints
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

// Equivalence class containing clauses with the same footprint
type EquivalenceClass = {
  footprint: Set<string>; // Set of footprint strings for comparison
  clauses: AbstractLayout[];
  representativeClause?: AbstractLayout;
  confidence: number;
};

// Lattice node in the upper/join semi-lattice structure
type LatticeNode = {
  equivalenceClass: EquivalenceClass;
  parents: Set<LatticeNode>; // nodes that are strict supersets
  children: Set<LatticeNode>; // nodes that are strict subsets
};

// Multiple lattices structure
type MultipleLattices = {
  nodes: LatticeNode[];
  roots: Set<LatticeNode>; // nodes with no parents (top-level)
};

// Result type for terminal concrete constraints
type TerminalConcreteResult = {
  inferred: BoundConcrete;
  footprints: Footprint[];
  confidence: number;
};

// Result type for inferred abstract layouts
type InferredAbstractLayout = {
  inferred: AbstractLayout;
  confidence: number;
  footprints: Footprint[];
};

// Convert composite constraints to atomic footprints
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
          option: uC.option,
        },
      ];
    }
  } else {
    return [uC];
  }
};

// Convert footprints to canonical string representation for set operations
const footprintToString = (footprint: Footprint): string => {
  return prettyConcreteLayout(footprint);
};

// Convert array of footprints to sorted set of strings
const footprintsToStringSet = (footprints: Footprint[]): Set<string> => {
  const strings = footprints.map(footprintToString);
  return new Set(strings);
};

// Footprint set comparison operations
enum FootprintRelation {
  EQUAL = 'EQUAL',
  SUBSET = 'SUBSET',
  SUPERSET = 'SUPERSET',
  INCOMPARABLE = 'INCOMPARABLE',
}

// Compare two footprint sets
const compareFootprints = (
  set1: Set<string>,
  set2: Set<string>
): FootprintRelation => {
  if (setsEqual(set1, set2)) {
    return FootprintRelation.EQUAL;
  }

  if (isStrictSubset(set1, set2)) {
    return FootprintRelation.SUBSET;
  }

  if (isStrictSubset(set2, set1)) {
    return FootprintRelation.SUPERSET;
  }

  return FootprintRelation.INCOMPARABLE;
};

// Check if two sets are equal
const setsEqual = <T>(set1: Set<T>, set2: Set<T>): boolean => {
  if (set1.size !== set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
};

// Check if set1 is a strict subset of set2
const isStrictSubset = <T>(set1: Set<T>, set2: Set<T>): boolean => {
  if (set1.size >= set2.size) return false;
  for (const item of set1) {
    if (!set2.has(item)) return false;
  }
  return true;
};

// Check if set1 is a strict superset of set2
const isStrictSuperset = <T>(set1: Set<T>, set2: Set<T>): boolean => {
  return isStrictSubset(set2, set1);
};

// Calculate complexity of an abstract layout (number of nestings)
const abstractLayoutComplexity = (
  l: AbstractLayout | BoundConcrete
): number => {
  if (l.tag === 'AbstractLayout') {
    return 1 + abstractLayoutComplexity(l.layout);
  } else {
    return 1;
  }
};

// Check terminal concrete constraints against diagram
const checkTerminalConcrete = (
  concrete: BoundConcrete,
  substs: AbstractLayoutSubst[],
  diagram: AbstractDiagram
): TerminalConcreteResult | undefined => {
  const THRESHOLD = 0.85;

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

// Get all satisfying bound concrete constraints
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

  // Generate unary layouts
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

  // Generate binary layouts
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

  // TODO: Add cyclic and group layouts when needed

  return results;
};

// Compose abstract layout from selectors and concrete result
const composeAbstractLayout = (
  selectors: Selector[],
  concreteResult: TerminalConcreteResult
): InferredAbstractLayout => {
  const { inferred: concrete, footprints, confidence } = concreteResult;

  const composeHelper = (
    selectors: Selector[],
    concrete: BoundConcrete
  ): AbstractLayout => {
    if (selectors.length > 1) {
      const [selector, ...rest] = selectors;
      return {
        tag: 'AbstractLayout',
        selector,
        layout: composeHelper(rest, concrete),
      };
    } else if (selectors.length === 1) {
      return {
        tag: 'AbstractLayout',
        selector: selectors[0],
        layout: concrete,
      };
    } else {
      throw new Error(
        'composeAbstractLayout called with empty selectors array'
      );
    }
  };

  return {
    inferred: composeHelper(selectors, concrete),
    confidence,
    footprints,
  };
};

// Generate sig selectors
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

// Generate predicate selectors
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

// Create a new equivalence class from an inferred abstract layout
const createEquivalenceClass = (
  inferredLayout: InferredAbstractLayout
): EquivalenceClass => {
  return {
    footprint: footprintsToStringSet(inferredLayout.footprints),
    clauses: [inferredLayout.inferred],
    confidence: inferredLayout.confidence,
  };
};

// Create a new lattice node
const createLatticeNode = (equivalenceClass: EquivalenceClass): LatticeNode => {
  return {
    equivalenceClass,
    parents: new Set(),
    children: new Set(),
  };
};

// Merge two equivalence classes (when they have equal footprints)
const mergeEquivalenceClasses = (
  class1: EquivalenceClass,
  class2: EquivalenceClass
): EquivalenceClass => {
  return {
    footprint: class1.footprint, // They should be equal
    clauses: [...class1.clauses, ...class2.clauses],
    confidence: Math.max(class1.confidence, class2.confidence),
  };
};

// Select representative clause from equivalence class (prefer simpler ones)
const selectRepresentativeClause = (
  equivalenceClass: EquivalenceClass
): AbstractLayout => {
  let best = equivalenceClass.clauses[0];
  let bestComplexity = abstractLayoutComplexity(best);

  for (const clause of equivalenceClass.clauses) {
    const complexity = abstractLayoutComplexity(clause);
    if (complexity < bestComplexity) {
      best = clause;
      bestComplexity = complexity;
    }
  }

  return best;
};

// Position a new equivalence class in the lattice structure
const positionInLattice = (
  lattice: MultipleLattices,
  newEquivalenceClass: EquivalenceClass
): LatticeNode => {
  const newFootprint = newEquivalenceClass.footprint;

  // Find relationships with existing nodes
  const potentialParents: LatticeNode[] = [];
  const potentialChildren: LatticeNode[] = [];

  for (const existingNode of lattice.nodes) {
    const relationship = compareFootprints(
      newFootprint,
      existingNode.equivalenceClass.footprint
    );

    switch (relationship) {
      case FootprintRelation.EQUAL:
        // Merge with existing equivalence class
        existingNode.equivalenceClass = mergeEquivalenceClasses(
          existingNode.equivalenceClass,
          newEquivalenceClass
        );
        return existingNode;

      case FootprintRelation.SUBSET:
        // New node should be child of existing node
        potentialParents.push(existingNode);
        break;

      case FootprintRelation.SUPERSET:
        // New node should be parent of existing node
        potentialChildren.push(existingNode);
        break;

      case FootprintRelation.INCOMPARABLE:
        // No relationship
        break;
    }
  }

  // Filter to direct relationships only (remove transitive connections)
  const directParents = potentialParents.filter(
    parent =>
      !potentialParents.some(
        other =>
          other !== parent &&
          isStrictSuperset(
            other.equivalenceClass.footprint,
            parent.equivalenceClass.footprint
          )
      )
  );

  const directChildren = potentialChildren.filter(
    child =>
      !potentialChildren.some(
        other =>
          other !== child &&
          isStrictSubset(
            other.equivalenceClass.footprint,
            child.equivalenceClass.footprint
          )
      )
  );

  // Create new node
  const newNode = createLatticeNode(newEquivalenceClass);

  // Connect to direct parents
  for (const parent of directParents) {
    newNode.parents.add(parent);
    parent.children.add(newNode);

    // Remove any children of parent that are now children of newNode
    for (const child of Array.from(parent.children)) {
      if (directChildren.includes(child)) {
        parent.children.delete(child);
        child.parents.delete(parent);
      }
    }
  }

  // Connect to direct children
  for (const child of directChildren) {
    newNode.children.add(child);
    child.parents.add(newNode);
  }

  // Update lattice structure
  lattice.nodes.push(newNode);

  // Update roots
  if (newNode.parents.size === 0) {
    lattice.roots.add(newNode);
  }

  // Remove any former roots that are now children of newNode
  for (const child of directChildren) {
    if (lattice.roots.has(child)) {
      lattice.roots.delete(child);
    }
  }

  return newNode;
};

// Generate all abstract layouts and build lattice structure
const genAbstractLayoutsHelper = (
  bound: number,
  sigSelectors: SigSelector[],
  predSelectors: PredSelector[],
  model: Model,
  instance: Instance,
  diag: AbstractDiagram,
  typeEnv: TypeEnv,
  thisSelectorType: 'sig' | 'pred',
  lattice: MultipleLattices,
  numVarsAvailable: number
): void => {
  if (bound === 0) {
    // Only process if we have selectors
    if (sigSelectors.length === 0 && predSelectors.length === 0) {
      return;
    }

    const allSelectors = [...sigSelectors, ...predSelectors];

    try {
      const substs: AbstractLayoutSubst[] = selectorsToSubsts(
        allSelectors,
        model,
        instance
      );

      if (substs.length === 0) {
        console.log('No substitutions found for selectors:', allSelectors);
        return;
      }

      const inferredConcretes = getSatisfyingBoundConcretes(
        typeEnv,
        substs,
        diag
      );

      console.log(
        `Found ${inferredConcretes.length} satisfying concretes for ${allSelectors.length} selectors`
      );

      for (const inferredConcrete of inferredConcretes) {
        const inferredLayout = composeAbstractLayout(
          allSelectors,
          inferredConcrete
        );

        // Create equivalence class and position in lattice
        const equivalenceClass = createEquivalenceClass(inferredLayout);
        positionInLattice(lattice, equivalenceClass);
      }
    } catch (error) {
      console.error('Error in genAbstractLayoutsHelper:', error);
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
          lattice,
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
          lattice,
          numVarsAvailable
        );
      }
    }
  }
};

// Main function to generate abstract layouts using footprint-based lattice approach
export const genFootprintBasedAbstractLayouts = (
  bound: number,
  model: Model,
  instance: Instance,
  diag: AbstractDiagram
): AbstractLayout[] => {
  console.log(`Starting footprint-based generation with bound ${bound}`);
  console.log('Model:', model);
  console.log('Instance:', instance);

  // Initialize lattice structure
  const lattice: MultipleLattices = {
    nodes: [],
    roots: new Set(),
  };

  // Generate all clauses and build lattice (start from 1, not 0)
  for (let i = 1; i <= bound; i++) {
    console.log(`Generating layouts with ${i} selectors`);
    genAbstractLayoutsHelper(
      i,
      [],
      [],
      model,
      instance,
      diag,
      {},
      'sig',
      lattice,
      0
    );
  }

  console.log(
    `Generated lattice with ${lattice.nodes.length} nodes and ${lattice.roots.size} roots`
  );

  // Select representative clauses from top-level equivalence classes
  const result: AbstractLayout[] = [];
  for (const rootNode of lattice.roots) {
    // Set representative clause for the equivalence class
    rootNode.equivalenceClass.representativeClause = selectRepresentativeClause(
      rootNode.equivalenceClass
    );
    result.push(rootNode.equivalenceClass.representativeClause);
  }

  return result;
};

// Utility function to get lattice structure (for debugging/visualization)
export const getFootprintLattice = (
  bound: number,
  model: Model,
  instance: Instance,
  diag: AbstractDiagram
): MultipleLattices => {
  const lattice: MultipleLattices = {
    nodes: [],
    roots: new Set(),
  };

  // Generate all clauses and build lattice (start from 1, not 0)
  for (let i = 1; i <= bound; i++) {
    genAbstractLayoutsHelper(
      i,
      [],
      [],
      model,
      instance,
      diag,
      {},
      'sig',
      lattice,
      0
    );
  }

  // Set representative clauses for all equivalence classes
  for (const node of lattice.nodes) {
    node.equivalenceClass.representativeClause = selectRepresentativeClause(
      node.equivalenceClass
    );
  }

  return lattice;
};

export type {
  EquivalenceClass,
  LatticeNode,
  MultipleLattices,
  InferredAbstractLayout,
};

export { FootprintRelation };
