import { useState } from 'react';
import { emptyInstance, Instance, simpleInstance } from '../datamodel/Instance';
import { emptyModel, Model, simpleModel } from '../datamodel/Model';
import ModelInstanceLoader from './ModelInstanceLoader';
import { Diagram } from './Diagram';
import {
  ConcreteLayout,
  simpleConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import ConcreteLayoutLoader from './ConcreteLayoutLoader';

export const InstanceVisualizer = () => {
  const [model, setModel] = useState<Model>(simpleModel());
  const [instance, setInstance] = useState<Instance>(simpleInstance());
  const [concreteLayout, setConcreteLayout] = useState<
    ConcreteLayout<UnboundAtom>[]
  >(simpleConcreteLayout());

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
