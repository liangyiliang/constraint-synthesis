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

const prettyAbstractLayout = (layout: AbstractLayout): string => {
  const { selector, layout: inner } = layout;
  return `IF ${prettySelector(selector)} THEN ${
    inner.tag === 'AbstractLayout'
      ? prettyAbstractLayout(inner)
      : prettyConcreteLayout(inner)
  }`;
};
