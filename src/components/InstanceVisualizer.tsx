import { useState } from 'react';
import {
  emptyInstance,
  Instance,
  moreComplexCycleInstance,
  multipleSigsInstance,
  simpleCycleInstance,
  simpleInstance,
} from '../model_instance/Instance';
import {
  emptyModel,
  Model,
  moreComplexCycleModel,
  multipleSigsModel,
  simpleCycleModel,
  simpleModel,
} from '../model_instance/Model';
import ModelInstanceLoader from './ModelInstanceLoader';
import { Diagram } from './Diagram';
import {
  ConcreteLayout,
  prettyConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import ConcreteLayoutLoader from './ConcreteLayoutLoader';
import AbstractLayoutLoader from './AbstractLayoutLoader';
import {
  AbstractLayout,
  moreComplexCycleAbstractLayout,
  moreComplexCycleAbstractLayout2,
  multipleSigsAbstractLayout,
  prettyAbstractLayout,
  simpleAbstractLayout,
} from '../constraint_language/AbstractLayout';
import { compileAbstractLayouts } from '../constraint_language/ApplyAbstractLayout';
import { generateAllAbstractLayouts } from '../inference/NaiveInference';
import { editorStyle } from './style';
import { AbstractDiagram } from '../inference/ConstraintConfidence';

export const InstanceVisualizer = () => {
  const [model, setModel] = useState<Model>(simpleModel());
  const [instance, setInstance] = useState<Instance>(simpleInstance());
  const [abstractLayout, setAbstractLayout] = useState<AbstractLayout[]>(
    simpleAbstractLayout()
  );
  const [concreteLayout, setConcreteLayout] = useState<
    ConcreteLayout<UnboundAtom>[]
  >([]);
  const [inferredAbstractLayout, setInferredAbstractLayout] = useState<
    AbstractLayout[]
  >([]);

  const [abstractDiagram, setAbstractDiagram] = useState<AbstractDiagram>({});

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
      <Diagram
        model={model}
        instance={instance}
        layout={concreteLayout}
        setAbstractDiagram={setAbstractDiagram}
      />

      <div>
        <button
          onClick={() => {
            const abs = generateAllAbstractLayouts(
              model,
              instance,
              abstractDiagram,
              1
            );
            setInferredAbstractLayout(abs);
          }}
        >
          Infer
        </button>
        <pre
          style={{
            ...editorStyle,
            minHeight: '100px',
            background: '#f9f9f9',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {inferredAbstractLayout.map(prettyAbstractLayout).join('\n')}
        </pre>
      </div>
    </div>
  );
};
