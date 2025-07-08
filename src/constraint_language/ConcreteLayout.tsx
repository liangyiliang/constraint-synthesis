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
  cycleId: T extends BoundAtom ? undefined : string;
};

export type GroupingLayout<T extends AtomInConstraint> = {
  tag: 'GroupingLayout';
  op: T;
  groupId: T extends BoundAtom ? undefined : string;
};

export const simpleConcreteLayout = (): ConcreteLayout<UnboundAtom>[] => [
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
];

export const simpleCycleConcreteLayout = (): ConcreteLayout<UnboundAtom>[] => [
  {
    tag: 'CyclicLayout',
    option: 'Clockwise',
    op0: { tag: 'UnboundAtom', name: 'n0' },
    op1: { tag: 'UnboundAtom', name: 'n1' },
    cycleId: 'cycle1',
  },
  {
    tag: 'CyclicLayout',
    option: 'Clockwise',
    op0: { tag: 'UnboundAtom', name: 'n1' },
    op1: { tag: 'UnboundAtom', name: 'n2' },
    cycleId: 'cycle1',
  },
  {
    tag: 'CyclicLayout',
    option: 'Clockwise',
    op0: { tag: 'UnboundAtom', name: 'n2' },
    op1: { tag: 'UnboundAtom', name: 'n3' },
    cycleId: 'cycle1',
  },
  {
    tag: 'CyclicLayout',
    option: 'Clockwise',
    op0: { tag: 'UnboundAtom', name: 'n3' },
    op1: { tag: 'UnboundAtom', name: 'n4' },
    cycleId: 'cycle1',
  },
];

export const moreComplexCycleConcreteLayout =
  (): ConcreteLayout<UnboundAtom>[] => [
    {
      tag: 'CyclicLayout',
      option: 'Clockwise',
      op0: { tag: 'UnboundAtom', name: 'n0' },
      op1: { tag: 'UnboundAtom', name: 'n1' },
      cycleId: 'cycle1',
    },
    {
      tag: 'CyclicLayout',
      option: 'Clockwise',
      op0: { tag: 'UnboundAtom', name: 'n1' },
      op1: { tag: 'UnboundAtom', name: 'n2' },
      cycleId: 'cycle1',
    },
    {
      tag: 'CyclicLayout',
      option: 'Clockwise',
      op0: { tag: 'UnboundAtom', name: 'n2' },
      op1: { tag: 'UnboundAtom', name: 'n3' },
      cycleId: 'cycle1',
    },
    {
      tag: 'CyclicLayout',
      option: 'Clockwise',
      op0: { tag: 'UnboundAtom', name: 'n3' },
      op1: { tag: 'UnboundAtom', name: 'n4' },
      cycleId: 'cycle1',
    },
    {
      tag: 'CyclicLayout',
      option: 'Counterclockwise',
      op0: { tag: 'UnboundAtom', name: 'n6' },
      op1: { tag: 'UnboundAtom', name: 'n5' },
      cycleId: 'cycle2',
    },
    {
      tag: 'CyclicLayout',
      option: 'Counterclockwise',
      op0: { tag: 'UnboundAtom', name: 'n5' },
      op1: { tag: 'UnboundAtom', name: 'n0' },
      cycleId: 'cycle2',
    },
    {
      tag: 'CyclicLayout',
      option: 'Counterclockwise',
      op0: { tag: 'UnboundAtom', name: 'n0' },
      op1: { tag: 'UnboundAtom', name: 'n1' },
      cycleId: 'cycle2',
    },
    {
      tag: 'CyclicLayout',
      option: 'Counterclockwise',
      op0: { tag: 'UnboundAtom', name: 'n1' },
      op1: { tag: 'UnboundAtom', name: 'n6' },
      cycleId: 'cycle2',
    },
  ];
