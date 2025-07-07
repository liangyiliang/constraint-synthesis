import { useState } from 'react';
import {
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';

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

export const ConcreteLayoutLoader = ({
  initialLayout,
  layoutSetter,
}: {
  initialLayout: ConcreteLayout<UnboundAtom>[];
  layoutSetter: (layout: ConcreteLayout<UnboundAtom>[]) => void;
}) => {
  const [layoutJson, setLayoutJson] = useState<string>(
    JSON.stringify(initialLayout, null, 2)
  );

  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Concrete</strong>
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
              const parsedLayout = JSON.parse(
                layoutJson
              ) as ConcreteLayout<UnboundAtom>[];
              layoutSetter(parsedLayout);
            } catch (e) {
              alert('Invalid JSON');
            }
          }}
        >
          Load
        </button>
      </div>
    </div>
  );
};

export default ConcreteLayoutLoader;
