import {
  BoundAtom,
  ConcreteLayout,
  prettyConcreteLayout,
  BinaryLayoutOption,
  UnaryLayoutOption,
  SeparationOption,
  BinaryLayout,
  UnaryLayout,
  CyclicLayout,
  GroupingLayout,
} from '../concrete/ConcreteLayout';
import { Model, simpleCycleModel } from '../../model_instance/Model';
import { BOUND } from '../../inference/NaiveInference';

export type Selector = SigSelector | PredSelector;

export type SigSelector = {
  tag: 'SigSelector';
  sig: string;
  varname: string;
};

export type PredSelector = {
  tag: 'PredSelector';
  pred: string;
  args: string[];
};

export const prettySelector = (
  selector: SigSelector | PredSelector
): string => {
  if (selector.tag === 'SigSelector') {
    const { varname, sig } = selector;
    return `${varname} : ${sig}`;
  } else {
    const { pred, args } = selector;
    return `${pred}(${args.join(', ')})`;
  }
};

export type AbstractLayout = {
  tag: 'AbstractLayout';
  selector: SigSelector | PredSelector;
  layout: AbstractLayout | ConcreteLayout<BoundAtom>;
};

export const prettyAbstractLayout = (layout: AbstractLayout): string => {
  const { selector, layout: inner } = layout;
  const str = `IF ${prettySelector(selector)} THEN ${
    inner.tag === 'AbstractLayout'
      ? prettyAbstractLayout(inner)
      : prettyConcreteLayout(inner)
  }`;

  if ('confidence' in layout) {
    return `${str} (confidence: ${layout.confidence})`;
  } else {
    return str;
  }
};

export const simpleAbstractLayout = (): AbstractLayout[] => {
  return [
    {
      tag: 'AbstractLayout',
      selector: {
        tag: 'SigSelector',
        sig: 'Apple',
        varname: 'a0',
      },
      layout: {
        tag: 'AbstractLayout',
        selector: {
          tag: 'SigSelector',
          sig: 'Apple',
          varname: 'a1',
        },
        layout: {
          tag: 'BinaryLayout',
          option: 'LeftOf',
          op0: { tag: 'BoundAtom', name: 'a0' },
          op1: { tag: 'BoundAtom', name: 'a1' },
          separation: { tag: 'NoneSpecified' },
        },
      },
    },
  ];
};

export const moreComplexCycleAbstractLayout = (): AbstractLayout[] => [
  {
    tag: 'AbstractLayout',
    selector: {
      tag: 'PredSelector',
      pred: 'red',
      args: ['n0', 'n1'],
    },
    layout: {
      tag: 'CyclicLayout',
      option: 'Clockwise',
      op0: { tag: 'BoundAtom', name: 'n0' },
      op1: { tag: 'BoundAtom', name: 'n1' },
      cycleId: undefined,
    },
  },
  {
    tag: 'AbstractLayout',
    selector: {
      tag: 'PredSelector',
      pred: 'blue',
      args: ['n0', 'n1'],
    },
    layout: {
      tag: 'CyclicLayout',
      option: 'Counterclockwise',
      op0: { tag: 'BoundAtom', name: 'n0' },
      op1: { tag: 'BoundAtom', name: 'n1' },
      cycleId: undefined,
    },
  },
];

export const moreComplexCycleAbstractLayout2 = (): AbstractLayout[] => [
  {
    tag: 'AbstractLayout',
    selector: {
      tag: 'PredSelector',
      pred: 'red',
      args: ['n0', 'n1'],
    },
    layout: {
      tag: 'BinaryLayout',
      option: 'DirectlyLeftOf',
      op0: { tag: 'BoundAtom', name: 'n0' },
      op1: { tag: 'BoundAtom', name: 'n1' },
      separation: { tag: 'AtLeast', distance: 90 },
    },
  },
  {
    tag: 'AbstractLayout',
    selector: {
      tag: 'PredSelector',
      pred: 'blue',
      args: ['n0', 'n1'],
    },
    layout: {
      tag: 'BinaryLayout',
      option: 'DirectlyBelow',
      op0: { tag: 'BoundAtom', name: 'n0' },
      op1: { tag: 'BoundAtom', name: 'n1' },
      separation: { tag: 'AtLeast', distance: 90 },
    },
  },
];

export const multipleSigsAbstractLayout = (): AbstractLayout[] => [
  {
    tag: 'AbstractLayout',
    selector: {
      tag: 'SigSelector',
      sig: 'Apple',
      varname: 'a0',
    },
    layout: {
      tag: 'AbstractLayout',
      selector: {
        tag: 'SigSelector',
        sig: 'Banana',
        varname: 'a1',
      },
      layout: {
        tag: 'BinaryLayout',
        option: 'LeftOf',
        op0: { tag: 'BoundAtom', name: 'a0' },
        op1: { tag: 'BoundAtom', name: 'a1' },
        separation: { tag: 'AtLeast', distance: 50 },
      },
    },
  },
];
