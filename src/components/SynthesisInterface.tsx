import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Diagram } from './Diagram';
import './Panel.css';
import { Model } from '../model_instance/Model';
import { Instance } from '../model_instance/Instance';
import {
  AbstractLayout,
  prettyClause,
} from '../constraint_language/abstract/AbstractLayout';
import { AbstractDiagram } from '../inference/multi_instance/inputs/Inputs';
import { genClauses } from '../inference/multi_instance/Inference';

type InteractionMode =
  | 'ClassificationMode'
  | 'AcceptedMode'
  | 'RevisionMode'
  | 'FinishedRevisionMode';

type UserFeedbackElement = {
  instance: Instance;
  diagram: AbstractDiagram;
  feedback: 'Accept' | 'Reject' | 'Finish Revision' | 'Skip Revision';
};

const loadNextInstance = (currentIndex: number, instances: Instance[]) => {
  if (currentIndex < instances.length - 1) {
    return currentIndex + 1;
  } else {
    return 0;
  }
};

export const SynthesisInterface = ({
  model,
  instances,
  initialMode,
}: {
  model: Model;
  instances: Instance[];
  initialMode: InteractionMode;
}) => {
  const [mode, setMode] = useState<InteractionMode>(initialMode);
  const [currentInstance, setCurrentInstance] = useState<Instance>(
    instances[0]
  );
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState<number>(0);

  const [currentVizspec, setCurrentVizspec] = useState<AbstractLayout[]>([]);

  const userFeedback = useRef<UserFeedbackElement[]>([]);

  const [cachedAbstractDiagram, setCachedAbstractDiagram] = useState<
    AbstractDiagram | undefined
  >(undefined);

  // Handler functions for each button
  const handleNext = () => {
    console.log('Next button clicked');
    const nextIndex = loadNextInstance(currentInstanceIndex, instances);
    setCurrentInstanceIndex(nextIndex);
    setCurrentInstance(instances[nextIndex]);

    console.log('Using existing user feedback:');
    console.log(userFeedback.current);

    const posPairs = userFeedback.current
      .filter(f => f.feedback === 'Accept' || f.feedback === 'Finish Revision')
      .map(f => ({ instance: f.instance, diag: f.diagram }));

    const { pass1Clauses, pass2Clauses } = genClauses(4, model, posPairs);

    const allClauses = [...pass1Clauses, ...pass2Clauses];

    console.log('Generated vizspec:');
    console.log(allClauses.map(l => prettyClause(l)).join('\n'));

    setCurrentVizspec(allClauses);

    setMode('ClassificationMode');

    setCachedAbstractDiagram(undefined);
  };

  const diagramRef = useRef<{
    getAbstractDiagram: () => AbstractDiagram;
    setAbstractDiagram: (absDiag: AbstractDiagram) => void;
    setConstraintEnforcement: (enforce: boolean) => void;
    // setOptimized: (optimized: boolean) => void;
  }>(null);

  const handleAccept = () => {
    console.log('Accept button clicked');
    // TODO: Implement accept functionality
    userFeedback.current.push({
      instance: currentInstance,
      diagram: diagramRef.current?.getAbstractDiagram() || {},
      feedback: 'Accept',
    });
    console.log('User feedback trace updated to:', userFeedback.current);
    setMode('AcceptedMode');
    setCachedAbstractDiagram(undefined);
  };

  const handleReject = () => {
    console.log('Reject button clicked');
    // TODO: Implement reject functionality
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};

    userFeedback.current.push({
      instance: currentInstance,
      diagram: absDiag,
      feedback: 'Reject',
    });

    console.log('User feedback trace updated to:', userFeedback.current);

    setMode('RevisionMode');

    setCachedAbstractDiagram(absDiag);
    // setCurrentVizspec([]);
  };

  const handleFinishRevision = () => {
    console.log('Finish Revision button clicked');
    // TODO: Implement finish revision functionality
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};
    userFeedback.current.push({
      instance: currentInstance,
      diagram: absDiag,
      feedback: 'Finish Revision',
    });
    console.log('User feedback trace updated to:', userFeedback.current);
    setMode('FinishedRevisionMode');
    setCachedAbstractDiagram(absDiag);
  };

  const handleSkipRevision = () => {
    console.log('Skip Revision button clicked');
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};
    userFeedback.current.push({
      instance: currentInstance,
      diagram: absDiag,
      feedback: 'Skip Revision',
    });
    console.log('User feedback trace updated to:', userFeedback.current);
    setMode('FinishedRevisionMode');
    setCachedAbstractDiagram(absDiag);
  };

  return (
    <div className="container">
      <div className="content">
        <Diagram
          ref={diagramRef}
          model={model}
          instance={currentInstance}
          layoutProgram={currentVizspec}
          interactive={
            mode === 'RevisionMode' || mode === 'FinishedRevisionMode'
          }
          freezeInitially={cachedAbstractDiagram}
        />
      </div>
      <div className="next-btn">
        <button className="next_button" onClick={handleNext}>
          Next
        </button>
      </div>
      {(mode === 'ClassificationMode' || mode === 'AcceptedMode') && (
        <div className="bottom-buttons">
          <button
            className="yes_button"
            onClick={handleAccept}
            hidden={mode === 'AcceptedMode'}
          >
            Accept
          </button>
          <button
            className="no_button"
            onClick={handleReject}
            hidden={mode === 'AcceptedMode'}
          >
            Reject
          </button>
        </div>
      )}
      {(mode === 'RevisionMode' || mode === 'FinishedRevisionMode') && (
        <div className="bottom-buttons">
          <button
            className="yes_button"
            onClick={handleFinishRevision}
            hidden={mode === 'FinishedRevisionMode'}
          >
            Finish Revision
          </button>
          <button
            className="no_button"
            onClick={handleSkipRevision}
            hidden={mode === 'FinishedRevisionMode'}
          >
            Skip Revision
          </button>
        </div>
      )}
      <button
        onClick={() => {
          console.log('Generating based on this diagram');
          const absDiag = diagramRef.current?.getAbstractDiagram();

          const { pass1Clauses, pass2Clauses } = genClauses(4, model, [
            {
              instance: currentInstance,
              diag: absDiag || {},
            },
          ]);

          const allClauses = [...pass1Clauses, ...pass2Clauses];

          console.log('Generated vizspec:');
          console.log(allClauses.map(l => prettyClause(l)).join('\n'));
        }}
      >
        Generate VizSpec on this (Debugging)
      </button>
    </div>
  );
};

export default SynthesisInterface;
