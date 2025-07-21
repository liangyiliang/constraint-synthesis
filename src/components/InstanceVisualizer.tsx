import React, { useState } from 'react';
import { Instance, simpleInstance } from '../model_instance/Instance';
import { Model, simpleModel } from '../model_instance/Model';
import ModelInstanceLoader from './ModelInstanceLoader';
import { Diagram } from './Diagram';
import { AbstractLayout } from '../constraint_language/abstract/AbstractLayout';
import { editorStyle } from './style';
import { AbstractDiagram } from '../inference/ConfidenceScore';
import {
  genAbstractLayouts,
  prettyInferredAbstractLayout,
} from '../inference/SmarterInference';

export const InstanceVisualizer = () => {
  const [model, setModel] = useState<Model>(simpleModel());
  const [instance, setInstance] = useState<Instance>(simpleInstance());
  const [abstractDiagram, setAbstractDiagram] = useState<AbstractDiagram>({});

  return (
    <div>
      <ModelInstanceLoader
        model={model}
        instance={instance}
        modelSetter={setModel}
        instanceSetter={setInstance}
      />
      {React.useMemo(
        () => (
          <Diagram
            model={model}
            instance={instance}
            layout={[]}
            setAbstractDiagram={setAbstractDiagram}
          />
        ),
        [model, instance]
      )}

      <div>
        <button
          onClick={e => {
            try {
              const inferreds = genAbstractLayouts(
                4,
                model,
                instance,
                abstractDiagram
              );
              const str = inferreds
                .map(prettyInferredAbstractLayout)
                .join('\n');
              const panel = document.getElementById('generated-layouts-panel');
              if (panel) {
                panel.innerText = str;
              }
            } catch (error) {
              console.error('Error generating layouts:', error);
            }
          }}
        >
          Infer
        </button>
        <pre
          id="generated-layouts-panel"
          style={{
            ...editorStyle,
            minHeight: '100px',
            background: '#f9f9f9',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        ></pre>
      </div>
    </div>
  );
};
