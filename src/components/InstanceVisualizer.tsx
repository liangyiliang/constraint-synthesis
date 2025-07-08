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
  moreComplexCycleConcreteLayout,
  simpleConcreteLayout,
  simpleCycleConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import ConcreteLayoutLoader from './ConcreteLayoutLoader';

export const InstanceVisualizer = () => {
  const [model, setModel] = useState<Model>(moreComplexCycleModel());
  const [instance, setInstance] = useState<Instance>(
    moreComplexCycleInstance()
  );
  const [concreteLayout, setConcreteLayout] = useState<
    ConcreteLayout<UnboundAtom>[]
  >(moreComplexCycleConcreteLayout());

  return (
    <div>
      <ModelInstanceLoader
        initialModel={model}
        initialInstance={instance}
        modelSetter={setModel}
        instanceSetter={setInstance}
      />
      <ConcreteLayoutLoader
        initialLayout={concreteLayout}
        layoutSetter={setConcreteLayout}
      />
      <Diagram model={model} instance={instance} layout={concreteLayout} />
    </div>
  );
};
