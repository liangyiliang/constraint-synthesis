import { useState } from 'react';
import {
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import {
  AbstractLayout,
  prettyAbstractLayout,
} from '../constraint_language/AbstractLayout';

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

export const AbstractLayoutLoader = ({
  layout,
  layoutSetter,
}: {
  layout: AbstractLayout[];
  layoutSetter: (layout: AbstractLayout[]) => void;
}) => {
  const [layoutJson, setLayoutJson] = useState<string>(
    JSON.stringify(layout, null, 2)
  );

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Abstract</strong>
        </label>
        <textarea
          style={editorStyle}
          value={layoutJson}
          onChange={e => setLayoutJson(e.target.value)}
          spellCheck={false}
          rows={5}
        />

        <button
          onClick={() => {
            try {
              const parsedLayout = JSON.parse(layoutJson) as AbstractLayout[];
              layoutSetter(parsedLayout);
            } catch (e) {
              alert('Invalid JSON');
            }
          }}
        >
          Load
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Pretty-printed Abstract Layout</strong>
        </label>
        <pre
          style={{
            ...editorStyle,
            minHeight: '100px',
            background: '#f9f9f9',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}
        >
          {layout.map(prettyAbstractLayout).join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default AbstractLayoutLoader;
