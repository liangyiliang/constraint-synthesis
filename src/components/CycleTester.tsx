import { useRef, useState, useMemo } from 'react';
import { Diagram } from './Diagram';
import { AbstractDiagram } from '../inference/multi_instance/confidences/ConfidenceScore';
import { CycleInstance, CycleModel } from '../examples/Cycle';
import { AbstractLayout } from '../constraint_language/abstract/AbstractLayout';
import { confidenceOfCyclicLayout } from '../inference/CycleConfidence';

export const CycleTester = () => {
  const diagramRef = useRef<{
    getAbstractDiagram: () => AbstractDiagram;
    setAbstractDiagram: (absDiag: AbstractDiagram) => void;
    // setOptimized: (optimized: boolean) => void;
  }>(null);

  const model = CycleModel();
  const instance = CycleInstance();

  const abstractLayout: AbstractLayout = {
    tag: 'AbstractLayout',
    selector: {
      tag: 'SigSelector',
      sig: 'Node',
      varname: 'n1',
    },
    layout: {
      tag: 'AbstractLayout',
      selector: {
        tag: 'SigSelector',
        sig: 'Node',
        varname: 'n2',
      },
      layout: {
        tag: 'AbstractLayout',
        selector: {
          tag: 'PredSelector',
          pred: 'Next',
          args: ['n1', 'n2'],
        },
        layout: {
          tag: 'CyclicLayout',
          option: 'Counterclockwise',
          op0: { tag: 'BoundAtom', name: 'n1' },
          op1: { tag: 'BoundAtom', name: 'n2' },
          cycleId: undefined,
        },
      },
    },
  };

  const [conf, setConf] = useState<number>(0);

  const compute = () => {
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};
    console.log('Abstract diagram extracted from Diagram component:', absDiag);
    const confidence = confidenceOfCyclicLayout(
      abstractLayout,
      instance,
      model,
      absDiag
    );
    console.log(confidence);
    setConf(confidence);
  };

  return (
    <div>
      <h1>Cycle Tester</h1>
      <p>This is a tester for the cycle confidence function.</p>
      {useMemo(
        () => (
          <Diagram
            ref={diagramRef}
            model={model}
            instance={instance}
            layoutProgram={[]}
            interactive={true}
            freezeInitially={undefined}
          />
        ),
        []
      )}
      <div>
        <button onClick={compute}>Compute Cycle Confidence</button>
        <div>{conf}</div>
      </div>
    </div>
  );
};
