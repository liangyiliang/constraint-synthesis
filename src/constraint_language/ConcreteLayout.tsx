type BinaryLayoutOption =
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

type UnaryLayoutOption =
  | 'LeftOfCenter'
  | 'RightOfCenter'
  | 'AboveCenter'
  | 'BelowCenter';

type CyclicLayoutOption = 'Clockwise' | 'Counterclockwise';

type SeparationOption =
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

type ConstrainedShape = ConcreteShape | AbstractShape;

type ConcreteShape = {
  tag: 'ConcreteShape';
  name: string;
};

type AbstractShape = {
  tag: 'AbstractShape';
  name: string;
};

export type ConcreteLayoutOption<T extends ConstrainedShape> =
  | BinaryLayout<T>
  | UnaryLayout<T>
  | CyclicLayout<T>
  | GroupingLayout<T>;

type BinaryLayout<T extends ConstrainedShape> = {
  tag: 'BinaryLayout';
  option: BinaryLayoutOption;
  separation: SeparationOption;
  op0: T;
  op1: T;
};

type UnaryLayout<T extends ConstrainedShape> = {
  tag: 'UnaryLayout';
  option: UnaryLayoutOption;
  separation: SeparationOption;
  op: T;
};

type CyclicLayout<T extends ConstrainedShape> = {
  tag: 'CyclicLayout';
  option: CyclicLayoutOption;
  op0: T;
  op1: T;
};

type GroupingLayout<T extends ConstrainedShape> = {
  tag: 'GroupingLayout';
  op: T;
  groupId: T extends AbstractShape ? undefined : string;
};
