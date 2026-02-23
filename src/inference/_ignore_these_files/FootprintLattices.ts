import { AbstractLayout } from '../../constraint_language/abstract/AbstractLayout';
import {
  BinaryLayout,
  BinaryLayoutOption,
  CyclicLayout,
  GroupingLayout,
  UnaryLayout,
  UnboundAtom,
} from '../../constraint_language/concrete/ConcreteLayout';

export type FootprintElement =
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
export type EquivalenceClass = {
  footprint: FootprintElement[]; // Set of footprint strings for comparison
  clauses: AbstractLayout[];
  confidence: number;
};

// Lattice node in the upper/join semi-lattice structure
export type LatticeNode = {
  eclass: EquivalenceClass;
  parents: Set<LatticeNode>; // nodes that are strict supersets
  children: Set<LatticeNode>; // nodes that are strict subsets
};

// Multiple lattices structure
export type LatticesStructure = {
  nodes: LatticeNode[];
  roots: Set<LatticeNode>; // nodes with no parents (top-level)
};
