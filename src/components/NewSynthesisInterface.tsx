import React, { useEffect, useRef, useState } from 'react';
import { Diagram } from './Diagram';
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
  return currentIndex < instances.length - 1 ? currentIndex + 1 : null;
};

const MODE_LABELS: Record<InteractionMode, string> = {
  ClassificationMode: 'Classify',
  AcceptedMode: 'Accepted',
  RevisionMode: 'Revising',
  FinishedRevisionMode: 'Revision Done',
};

const MODE_COLORS: Record<InteractionMode, string> = {
  ClassificationMode: '#3b82f6',
  AcceptedMode: '#22c55e',
  RevisionMode: '#f59e0b',
  FinishedRevisionMode: '#8b5cf6',
};

// Constraint enforcement should be disabled when the user is actively editing the diagram and right after
const shouldEnforceConstraints = (mode: InteractionMode): boolean =>
  mode !== 'RevisionMode' && mode !== 'FinishedRevisionMode';

export const NewSynthesisInterface = ({
  model,
  instances,
  initialMode,
}: {
  model: Model;
  instances: Instance[];
  initialMode: InteractionMode;
}) => {
  const [mode, setMode] = useState<InteractionMode>(initialMode);
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState<number>(0);
  const currentInstance = instances[currentInstanceIndex];

  const [currentVizspec, setCurrentVizspec] = useState<AbstractLayout[]>([]);
  const [showVizSpec, setShowVizSpec] = useState(false);

  const userFeedback = useRef<UserFeedbackElement[]>([]);
  const diagramRef = useRef<{
    getAbstractDiagram: () => AbstractDiagram;
    setConstraintEnforcement: (enforce: boolean) => void;
    getConstraintEnforcement: () => number | undefined;
  }>(null);

  // Sync constraint enforcement with mode
  useEffect(() => {
    diagramRef.current?.setConstraintEnforcement(
      shouldEnforceConstraints(mode)
    );
  });

  const isLastInstance = currentInstanceIndex === instances.length - 1;

  const handleNext = () => {
    const nextIndex = loadNextInstance(currentInstanceIndex, instances);
    if (nextIndex === null) return;
    setCurrentInstanceIndex(nextIndex);

    const posPairs = userFeedback.current
      .filter(f => f.feedback === 'Accept' || f.feedback === 'Finish Revision')
      .map(f => ({ instance: f.instance, diag: f.diagram }));

    const { pass1Clauses, pass2Clauses } = genClauses(4, model, posPairs);
    setCurrentVizspec([...pass1Clauses, ...pass2Clauses]);
    setMode('ClassificationMode');
  };

  const handleAccept = () => {
    userFeedback.current.push({
      instance: currentInstance,
      diagram: diagramRef.current?.getAbstractDiagram() || {},
      feedback: 'Accept',
    });
    setMode('AcceptedMode');
  };

  const handleReject = () => {
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};
    userFeedback.current.push({
      instance: currentInstance,
      diagram: absDiag,
      feedback: 'Reject',
    });
    setMode('RevisionMode');
  };

  const handleFinishRevision = () => {
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};
    userFeedback.current.push({
      instance: currentInstance,
      diagram: absDiag,
      feedback: 'Finish Revision',
    });
    setMode('FinishedRevisionMode');
  };

  const handleSkipRevision = () => {
    const absDiag = diagramRef.current?.getAbstractDiagram() || {};
    userFeedback.current.push({
      instance: currentInstance,
      diagram: absDiag,
      feedback: 'Skip Revision',
    });
    setMode('FinishedRevisionMode');
  };

  const isRevising = mode === 'RevisionMode';
  const isClassifying = mode === 'ClassificationMode';
  const isDone = mode === 'AcceptedMode' || mode === 'FinishedRevisionMode';

  return (
    <div style={styles.root}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.headerTitle}>Constraint Synthesis</span>
        <div style={styles.headerRight}>
          <span
            style={{
              ...styles.modeBadge,
              background: MODE_COLORS[mode],
            }}
          >
            {MODE_LABELS[mode]}
          </span>
          <span style={styles.instanceCounter}>
            {currentInstanceIndex + 1} / {instances.length}
          </span>
        </div>
      </div>

      {/* Body */}
      <div style={styles.body}>
        {/* Diagram panel */}
        <div style={styles.diagramPanel}>
          {!isRevising && (
            <div
              style={styles.diagramOverlay}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLDivElement).style.background =
                  'rgba(255, 255, 255, 0.5)')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLDivElement).style.background = '')
              }
            />
          )}
          {React.useMemo(
            () => (
              <Diagram
                ref={diagramRef}
                model={model}
                instance={currentInstance}
                layoutProgram={currentVizspec}
              />
            ),
            [model, currentInstance, currentVizspec]
          )}
        </div>

        {/* Side panel */}
        <div style={styles.sidePanel}>
          {/* VizSpec toggle */}
          <button
            style={{
              ...styles.vizSpecToggle,
              background: showVizSpec ? '#1e293b' : '#334155',
            }}
            onClick={() => setShowVizSpec(v => !v)}
          >
            {showVizSpec ? '▲ Hide VizSpec' : '▼ Show VizSpec'}
          </button>

          {showVizSpec && (
            <div style={styles.vizSpecPanel}>
              <div style={styles.vizSpecHeader}>
                Visualization Specification
                <span style={styles.vizSpecCount}>
                  {currentVizspec.length} clause
                  {currentVizspec.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={styles.vizSpecBody}>
                {currentVizspec.length === 0 ? (
                  <span style={styles.vizSpecEmpty}>
                    No clauses yet. Accept or revise diagrams to synthesize a
                    spec.
                  </span>
                ) : (
                  currentVizspec.map((clause, i) => (
                    <div key={i} style={styles.vizSpecClause}>
                      <span style={styles.vizSpecIndex}>{i + 1}</span>
                      <code style={styles.vizSpecCode}>
                        {prettyClause(clause)}
                      </code>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Feedback summary */}
          <div style={styles.feedbackSummary}>
            <div style={styles.feedbackSummaryTitle}>Session feedback</div>
            {(
              ['Accept', 'Finish Revision', 'Reject', 'Skip Revision'] as const
            ).map(kind => {
              const count = userFeedback.current.filter(
                f => f.feedback === kind
              ).length;
              return (
                <div key={kind} style={styles.feedbackRow}>
                  <span style={styles.feedbackLabel}>{kind}</span>
                  <span style={styles.feedbackCount}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer actions */}
      <div style={styles.footer}>
        {isClassifying && (
          <>
            <button
              style={{ ...styles.btn, ...styles.btnAccept }}
              onClick={handleAccept}
            >
              ✓ Accept
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnReject }}
              onClick={handleReject}
            >
              ✗ Revise
            </button>
          </>
        )}

        {isRevising && (
          <>
            <button
              style={{ ...styles.btn, ...styles.btnAccept }}
              onClick={handleFinishRevision}
            >
              ✓ Finish Revision
            </button>
            <button
              style={{ ...styles.btn, ...styles.btnNeutral }}
              onClick={handleSkipRevision}
            >
              Skip Revision
            </button>
          </>
        )}

        {isDone && (
          <span style={styles.doneHint}>
            {mode === 'AcceptedMode' ? 'Accepted.' : 'Revision recorded.'} Press
            Next to continue.
          </span>
        )}

        {isLastInstance ? (
          <span style={styles.exhaustedHint}>No more instances.</span>
        ) : (
          <button
            style={{ ...styles.btn, ...styles.btnNext }}
            onClick={handleNext}
          >
            Next →
          </button>
        )}
        <button
          onClick={() => {
            console.log(
              'Current constraint enforcement input value:',
              diagramRef.current?.getConstraintEnforcement()
            );
          }}
        >
          GCE
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  root: {
    display: 'flex',
    flexDirection: 'column',
    width: '92vw',
    height: '92vh',
    margin: '4vh auto',
    borderRadius: 12,
    border: '1px solid #cbd5e1',
    background: '#f8fafc',
    boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
    fontFamily: "'Inter', 'Segoe UI', Arial, sans-serif",
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 20px',
    background: '#1e293b',
    color: '#f1f5f9',
    flexShrink: 0,
  },
  headerTitle: {
    fontWeight: 700,
    fontSize: 16,
    letterSpacing: 0.5,
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  modeBadge: {
    padding: '3px 12px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 600,
    color: '#fff',
    letterSpacing: 0.3,
  },
  instanceCounter: {
    fontSize: 13,
    color: '#94a3b8',
    fontVariantNumeric: 'tabular-nums',
  },
  body: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    gap: 0,
  },
  diagramPanel: {
    flex: 1,
    background: '#e2e8f0',
    borderRight: '1px solid #cbd5e1',
    overflow: 'hidden',
    display: 'flex',
    alignItems: 'stretch',
    justifyContent: 'stretch',
    position: 'relative',
  },
  diagramOverlay: {
    position: 'absolute',
    inset: 0,
    zIndex: 10,
    cursor: 'default',
  },
  sidePanel: {
    width: 280,
    display: 'flex',
    flexDirection: 'column',
    background: '#f1f5f9',
    overflow: 'hidden',
    flexShrink: 0,
  },
  vizSpecToggle: {
    border: 'none',
    color: '#e2e8f0',
    padding: '10px 16px',
    fontSize: 12,
    fontWeight: 600,
    cursor: 'pointer',
    textAlign: 'left',
    letterSpacing: 0.3,
    flexShrink: 0,
  },
  vizSpecPanel: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    overflow: 'hidden',
    borderBottom: '1px solid #cbd5e1',
  },
  vizSpecHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 14px',
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    background: '#e2e8f0',
    borderBottom: '1px solid #cbd5e1',
    flexShrink: 0,
  },
  vizSpecCount: {
    fontWeight: 400,
    color: '#94a3b8',
    textTransform: 'none',
    letterSpacing: 0,
  },
  vizSpecBody: {
    flex: 1,
    overflowY: 'auto',
    padding: '8px 0',
  },
  vizSpecEmpty: {
    display: 'block',
    padding: '16px 14px',
    fontSize: 12,
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  vizSpecClause: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 14px',
    borderBottom: '1px solid #e2e8f0',
  },
  vizSpecIndex: {
    fontSize: 10,
    color: '#94a3b8',
    fontVariantNumeric: 'tabular-nums',
    paddingTop: 2,
    flexShrink: 0,
    minWidth: 16,
  },
  vizSpecCode: {
    fontSize: 11,
    fontFamily: "'Fira Code', 'JetBrains Mono', monospace",
    color: '#1e293b',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-all',
    lineHeight: 1.5,
  },
  feedbackSummary: {
    padding: '12px 14px',
    marginTop: 'auto',
    borderTop: '1px solid #cbd5e1',
    flexShrink: 0,
  },
  feedbackSummaryTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  feedbackRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
    color: '#64748b',
    padding: '2px 0',
  },
  feedbackLabel: {},
  feedbackCount: {
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
    color: '#334155',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 20px',
    background: '#f1f5f9',
    borderTop: '1px solid #cbd5e1',
    flexShrink: 0,
  },
  btn: {
    padding: '9px 24px',
    borderRadius: 7,
    border: 'none',
    fontSize: 14,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: 0.2,
    transition: 'opacity 0.15s',
  },
  btnAccept: {
    background: '#22c55e',
    color: '#fff',
  },
  btnReject: {
    background: '#ef4444',
    color: '#fff',
  },
  btnNeutral: {
    background: '#94a3b8',
    color: '#fff',
  },
  btnNext: {
    background: '#3b82f6',
    color: '#fff',
    marginLeft: 'auto',
  },
  doneHint: {
    fontSize: 13,
    color: '#64748b',
    fontStyle: 'italic',
  },
  exhaustedHint: {
    marginLeft: 'auto',
    fontSize: 13,
    fontWeight: 600,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
};

export default NewSynthesisInterface;
