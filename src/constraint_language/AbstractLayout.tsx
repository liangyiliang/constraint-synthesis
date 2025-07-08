import { BoundAtom, ConcreteLayout } from './ConcreteLayout';

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

export type AbstractLayout = {
  tag: 'AbstractLayout';
  selector: SigSelector | PredSelector;
  layout: AbstractLayout | ConcreteLayout<BoundAtom>;
};
