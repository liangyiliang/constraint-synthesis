import { useState } from 'react';
import {
  ConcreteLayout,
  prettyConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import { editorStyle } from './style';

export const ConcreteLayoutLoader = ({
  layout,
  layoutSetter,
}: {
  layout: ConcreteLayout<UnboundAtom>[];
  layoutSetter: (layout: ConcreteLayout<UnboundAtom>[]) => void;
}) => {
  return (
    <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Concrete</strong>
        </label>
        <textarea
          style={editorStyle}
          value={JSON.stringify(layout, null, 2)}
          spellCheck={false}
          rows={5}
          readOnly
        />

        <button
          onClick={() => {
            layoutSetter(layout);
          }}
        >
          Load
        </button>
      </div>
      <div style={{ flex: 1, minWidth: 300 }}>
        <label>
          <strong>Pretty-printed Concrete Layout</strong>
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
          {layout.map(prettyConcreteLayout).join('\n')}
        </pre>
      </div>
    </div>
  );
};

export default ConcreteLayoutLoader;
