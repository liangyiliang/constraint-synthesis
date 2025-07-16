import React, { useState } from 'react';
import { Instance } from '../model_instance/Instance';
import { Model } from '../model_instance/Model';

const editorStyle: React.CSSProperties = {
  width: '100%',
  minHeight: '100px',
  fontFamily: 'monospace',
  fontSize: '14px',
  padding: '10px',
  border: '1px solid #ccc',
  borderRadius: '4px',
  resize: 'vertical',
  boxSizing: 'border-box',
};

export const ModelInstanceLoader = ({
  model: initialModel,
  instance: initialInstance,
  modelSetter,
  instanceSetter,
}: {
  model: Model;
  instance: Instance;
  modelSetter: (model: Model) => void;
  instanceSetter: (instance: Instance) => void;
}) => {
  const [modelJson, setModelJson] = useState<string>(
    JSON.stringify(initialModel, null, 2)
  );
  const [instanceJson, setInstanceJson] = useState<string>(
    JSON.stringify(initialInstance, null, 2)
  );

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Model JSON</strong>
        </label>
        <textarea
          style={editorStyle}
          value={modelJson}
          onChange={e => setModelJson(e.target.value)}
          spellCheck={false}
          rows={5}
        />
      </div>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Instance JSON</strong>
        </label>
        <textarea
          style={editorStyle}
          value={instanceJson}
          onChange={e => setInstanceJson(e.target.value)}
          spellCheck={false}
          rows={5}
        />
        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button
            onClick={() => {
              try {
                const parsedModel = JSON.parse(modelJson) as Model;
                const parsedInstance = JSON.parse(instanceJson) as Instance;
                modelSetter(parsedModel);
                instanceSetter(parsedInstance);
              } catch (e) {
                alert('Invalid JSON');
              }
            }}
          >
            Load
          </button>
        </div>
      </div>
    </div>
  );
};

export default ModelInstanceLoader;
