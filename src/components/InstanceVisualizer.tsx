import { useState } from 'react';
import {
  emptyInstance,
  Instance,
  moreComplexCycleInstance,
  simpleCycleInstance,
  simpleInstance,
} from '../datamodel/Instance';
import {
  emptyModel,
  Model,
  moreComplexCycleModel,
  simpleCycleModel,
  simpleModel,
} from '../datamodel/Model';
import ModelInstanceLoader from './ModelInstanceLoader';
import { Diagram } from './Diagram';
import {
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import ConcreteLayoutLoader from './ConcreteLayoutLoader';
import AbstractLayoutLoader from './AbstractLayoutLoader';
import {
  AbstractLayout,
  moreComplexCycleAbstractLayout,
  moreComplexCycleAbstractLayout2,
} from '../constraint_language/AbstractLayout';
import { compileAbstractLayouts } from '../constraint_language/ApplyAbstractLayout';

export const InstanceVisualizer = () => {
  const [model, setModel] = useState<Model>(moreComplexCycleModel());
  const [instance, setInstance] = useState<Instance>(
    moreComplexCycleInstance()
  );
  const [abstractLayout, setAbstractLayout] = useState<AbstractLayout[]>(
    moreComplexCycleAbstractLayout()
  );
  const [concreteLayout, setConcreteLayout] = useState<
    ConcreteLayout<UnboundAtom>[]
  >([]);

  return (
    <div>
      <ModelInstanceLoader
        model={model}
        instance={instance}
        modelSetter={setModel}
        instanceSetter={setInstance}
      />

      <AbstractLayoutLoader
        layout={abstractLayout}
        layoutSetter={ls => {
          setAbstractLayout(ls);
          setConcreteLayout(compileAbstractLayouts(ls, model, instance));
        }}
      />

      <ConcreteLayoutLoader
        layout={concreteLayout}
        layoutSetter={setConcreteLayout}
      />

      <Diagram model={model} instance={instance} layout={concreteLayout} />
    </div>
  );
};
