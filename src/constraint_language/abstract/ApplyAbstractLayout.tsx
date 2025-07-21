import { emptyInstance, Instance } from '../../model_instance/Instance';
import { emptyModel, Model } from '../../model_instance/Model';
import { InstanceDiagramBuilder } from '../../diagram/InstanceDiagramBuilder';
import { AbstractLayout, Selector } from './AbstractLayout';
import { ConcreteLayoutApplier } from '../concrete/ApplyConcreteLayout';
import {
  BinaryLayout,
  BoundAtom,
  BoundConcrete,
  ConcreteLayout,
  UnaryLayout,
  UnboundAtom,
  UnboundConcrete,
} from '../concrete/ConcreteLayout';
import {
  AbstractLayoutSubst,
  applySubstitution,
  SelectorEnv,
  selectorsToSubsts,
} from './AbstractLayoutSemantics';

export function compileAbstractLayouts(
  layouts: AbstractLayout[],
  model: Model,
  instance: Instance
): ConcreteLayout<UnboundAtom>[] {
  const unbounds: ConcreteLayout<UnboundAtom>[] = [];
  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    const compiled = compileAbstractLayoutHelper(layout, model, instance, i);
    unbounds.push(...compiled);
  }
  return unbounds;
}

function compileAbstractLayoutHelper(
  layout: AbstractLayout,
  model: Model,
  instance: Instance,
  layoutNo: number
): UnboundConcrete[] {
  const getSelectors = (layout: AbstractLayout): Selector[] => {
    const { selector, layout: inner } = layout;
    if (inner.tag === 'AbstractLayout') {
      return [selector, ...getSelectors(inner)];
    } else {
      return [selector];
    }
  };

  const getConcrete = (layout: AbstractLayout): BoundConcrete => {
    const { layout: inner } = layout;
    if (inner.tag === 'AbstractLayout') {
      return getConcrete(inner);
    } else {
      return inner;
    }
  };

  const selectors = getSelectors(layout);
  const concrete = getConcrete(layout);
  const substs = selectorsToSubsts(selectors, model, instance);
  const unbounds = substs.map(s =>
    applySubstitution(concrete, s, layoutNo.toString())
  );
  return unbounds;
}
