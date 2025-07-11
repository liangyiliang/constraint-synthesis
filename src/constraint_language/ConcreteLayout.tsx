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

const prettySeparation = (s: SeparationOption): string => {
  switch (s.tag) {
    case 'NoneSpecified':
      return '';
    case 'AtLeast':
      return ` (separation at least ${s.distance})`;
    case 'Exact':
      return ` (separation exactly ${s.distance})`;
  }
};

export const prettyConcreteLayout = <T extends AtomInConstraint>(
  l: ConcreteLayout<T>
): string => {
  if (l.tag === 'BinaryLayout') {
    return (
      `${l.op0.name} ${l.option} ${l.op1.name}` + prettySeparation(l.separation)
    );
  } else if (l.tag === 'UnaryLayout') {
    return `${l.op.name} ${l.option}` + prettySeparation(l.separation);
  } else if (l.tag === 'CyclicLayout') {
    return (
      `Cycle ${l.op0.name} ${l.option} ${l.op1.name}` +
      (l.cycleId === undefined ? '' : ` (id ${l.cycleId})`)
    );
  } else {
    return `Group ${l.op.name} (id ${l.groupId})`;
  }
};
