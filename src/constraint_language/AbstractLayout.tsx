import {
  BoundAtom,
  ConcreteLayout,
  prettyConcreteLayout,
} from './ConcreteLayout';

type SigSelector = {
  tag: 'SigSelector';
  sig: string;
  varname: string;
};

type PredSelector = {
  tag: 'PredSelector';
  pred: string;
  args: string[];
};

const prettySelector = (selector: SigSelector | PredSelector): string => {
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
  return `IF ${prettySelector(selector)} THEN ${
    inner.tag === 'AbstractLayout'
      ? prettyAbstractLayout(inner)
      : prettyConcreteLayout(inner)
  }`;
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
