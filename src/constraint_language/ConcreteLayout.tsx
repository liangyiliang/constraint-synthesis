export type BinaryLayoutOption =
  | 'LeftOf'
  | 'RightOf'
  | 'Above'
  | 'Below'
  | 'DirectlyLeftOf'
  | 'DirectlyRightOf'
  | 'DirectlyAbove'
  | 'DirectlyBelow'
  | 'HorizontallyAligned'
  | 'VerticallyAligned'
  | 'OutsideRingOf'
  | 'InsideRingOf'
  | 'Contains';

export type UnaryLayoutOption =
  | 'LeftOfCenter'
  | 'RightOfCenter'
  | 'AboveCenter'
  | 'BelowCenter';

type CyclicLayoutOption = 'Clockwise' | 'Counterclockwise';

export type SeparationOption =
  | NoneSpecifiedSeparationOption
  | AtLeastSeparationOption
  | ExactSeparationOption;

type NoneSpecifiedSeparationOption = {
  tag: 'NoneSpecified';
};

type AtLeastSeparationOption = {
  tag: 'AtLeast';
  distance: number;
};

type ExactSeparationOption = {
  tag: 'Exact';
  distance: number;
};

export type AtomInConstraint = UnboundAtom | BoundAtom;

export type UnboundAtom = {
  tag: 'UnboundAtom';
  name: string;
};

export type BoundAtom = {
  tag: 'BoundAtom';
  name: string;
};

export type ConcreteLayout<T extends AtomInConstraint> =
  | BinaryLayout<T>
  | UnaryLayout<T>
  | CyclicLayout<T>
  | GroupingLayout<T>;

export type BinaryLayout<T extends AtomInConstraint> = {
  tag: 'BinaryLayout';
  option: BinaryLayoutOption;
  separation: SeparationOption;
  op0: T;
  op1: T;
};

export type UnaryLayout<T extends AtomInConstraint> = {
  tag: 'UnaryLayout';
  option: UnaryLayoutOption;
  separation: SeparationOption;
  op: T;
};

export type CyclicLayout<T extends AtomInConstraint> = {
  tag: 'CyclicLayout';
  option: CyclicLayoutOption;
  op0: T;
  op1: T;
};

export type GroupingLayout<T extends AtomInConstraint> = {
  tag: 'GroupingLayout';
  op: T;
  groupId: T extends BoundAtom ? undefined : string;
};

export const simpleConcreteLayout = (): ConcreteLayout<UnboundAtom>[] =>
  [
    {
      tag: 'UnaryLayout',
      option: 'AboveCenter',
      separation: { tag: 'AtLeast', distance: 100 },
      op: { tag: 'UnboundAtom', name: 'a0' },
    },
    {
      tag: 'BinaryLayout',
      option: 'LeftOf',
      separation: { tag: 'Exact', distance: 50 },
      op0: { tag: 'UnboundAtom', name: 'a1' },
      op1: { tag: 'UnboundAtom', name: 'a2' },
    },
  ] as const;
