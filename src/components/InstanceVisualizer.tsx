import { useState } from 'react';
import { emptyInstance, Instance, simpleInstance } from '../datamodel/Instance';
import { emptyModel, Model, simpleModel } from '../datamodel/Model';
import ModelInstanceLoader from './ModelInstanceLoader';
import { Diagram } from './Diagram';

export const InstanceVisualizer = () => {
  const [model, setModel] = useState<Model>(simpleModel());
  const [instance, setInstance] = useState<Instance>(simpleInstance());

  return (
    <div>
      <ModelInstanceLoader
        initialModel={model}
        initialInstance={instance}
        modelSetter={setModel}
        instanceSetter={setInstance}
      />
      <Diagram model={model} instance={instance} />
    </div>
  );
};
