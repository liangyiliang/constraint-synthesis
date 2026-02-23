import React, { useState, useMemo } from 'react';
import { Instance } from '../model_instance/Instance';
import { Model } from '../model_instance/Model';
import { Diagram } from './Diagram';
import { AbstractLayout } from '../constraint_language/abstract/AbstractLayout';
import { editorStyle } from './style';
import { AbstractDiagram } from '../inference/ConfidenceScore';
import {
  genAbstractLayouts,
  prettyInferredAbstractLayout,
} from '../inference/SmarterInference';
import { InferredAbstractLayout } from '../inference/_ignore_these_files/_FootprintBasedInference';
import {
  ConcreteLayout,
  UnboundConcrete,
} from '../constraint_language/concrete/ConcreteLayout';
import { compileAbstractLayouts } from '../constraint_language/abstract/ApplyAbstractLayout';
import { BTreeModel } from '../model_instance/exploratory_examples/btree/model';
import { BTreeInsts } from '../model_instance/exploratory_examples/btree/insts';
import { SimpleModel } from '../model_instance/exploratory_examples/simple/model';
import { SimpleInsts } from '../model_instance/exploratory_examples/simple/insts';
import { RailwayModel } from '../model_instance/exploratory_examples/railway/model';
import { RailwayInsts } from '../model_instance/exploratory_examples/railway/insts';
import { RingModel } from '../model_instance/exploratory_examples/ring/model';
import { RingInsts } from '../model_instance/exploratory_examples/ring/insts';
import { RiverCrossingModel } from '../model_instance/exploratory_examples/river-crossing/model';
import { RiverCrossingInstances } from '../model_instance/exploratory_examples/river-crossing/insts';

export const MultiInstanceSynthesis = () => {
  const [currentInstanceIndex, setCurrentInstanceIndex] = useState<number>(0);
  const [synthesizedProgram, setSynthesizedProgram] = useState<
    InferredAbstractLayout[]
  >([]);
  const [programEnforced, setProgramEnforced] = useState<boolean>(false);
  const [constraintEnabledState, setConstraintEnabledState] = useState<
    boolean[]
  >([]);
  const [currentAbstractDiagram, setCurrentAbstractDiagram] =
    useState<AbstractDiagram>({});

  const model: Model = BTreeModel;
  const instances: Instance[] = BTreeInsts;
  const currentInstance = instances[currentInstanceIndex];

  // Navigation handlers
  const handlePreviousInstance = () => {
    if (currentInstanceIndex > 0) {
      setCurrentInstanceIndex(currentInstanceIndex - 1);
    }
  };

  const handleNextInstance = () => {
    if (currentInstanceIndex < instances.length - 1) {
      setCurrentInstanceIndex(currentInstanceIndex + 1);
    }
  };

  // Process control handlers
  const handleGenerateProgram = () => {
    try {
      const inferreds = genAbstractLayouts(
        4,
        model,
        currentInstance,
        currentAbstractDiagram
      );

      setSynthesizedProgram(inferreds);
      // Initialize all constraints as enabled by default
      setConstraintEnabledState(new Array(inferreds.length).fill(true));
    } catch (error) {
      console.error('Error generating program:', error);
    }
  };

  const handleReset = () => {
    setCurrentInstanceIndex(0);
    setSynthesizedProgram([]);
    setProgramEnforced(false);
    setConstraintEnabledState([]);
  };

  // Helper function to get enabled constraints
  const getEnabledConstraints = (): AbstractLayout[] => {
    return synthesizedProgram
      .filter((_, index) => constraintEnabledState[index])
      .map(p => p.inferred);
  };

  // Handler for toggling individual constraints
  const handleConstraintToggle = (index: number) => {
    setConstraintEnabledState(prev =>
      prev.map((enabled, i) => (i === index ? !enabled : enabled))
    );
  };

  // Handler for selecting all constraints
  const handleSelectAll = () => {
    setConstraintEnabledState(new Array(synthesizedProgram.length).fill(true));
  };

  // Handler for deselecting all constraints
  const handleDeselectAll = () => {
    setConstraintEnabledState(new Array(synthesizedProgram.length).fill(false));
  };

  return (
    <div style={{ padding: '20px' }}>
      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h2>Multi-Instance Synthesis</h2>
        <p>
          Instance {currentInstanceIndex + 1} of {instances.length}
        </p>
      </div>

      {/* Instance Navigation */}
      <div
        style={{
          marginBottom: '20px',
          display: 'flex',
          gap: '10px',
          alignItems: 'center',
        }}
      >
        <button
          onClick={handlePreviousInstance}
          disabled={currentInstanceIndex === 0}
        >
          Previous Instance
        </button>
        <button
          onClick={handleNextInstance}
          disabled={currentInstanceIndex === instances.length - 1}
        >
          Next Instance
        </button>
        <button onClick={handleReset}>Reset</button>
      </div>

      {/* Current Instance Visualization */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Current Instance ({currentInstanceIndex})</h3>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '4px',
          }}
        >
          {React.useMemo(
            () => (
              <Diagram
                model={model}
                instance={currentInstance}
                layoutProgram={programEnforced ? getEnabledConstraints() : []}
                setAbstractDiagram={setCurrentAbstractDiagram}
              />
            ),
            [
              model,
              currentInstance,
              synthesizedProgram,
              programEnforced,
              constraintEnabledState,
            ]
          )}
        </div>
      </div>

      {/* Process Control Section */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Synthesis Process Controls</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button onClick={handleGenerateProgram}>Generate Program</button>
          <button
            onClick={() => setProgramEnforced(!programEnforced)}
            disabled={synthesizedProgram.length === 0}
            style={{
              backgroundColor: programEnforced ? '#4CAF50' : '#f0f0f0',
              color: programEnforced ? 'white' : 'black',
            }}
          >
            Apply Synthesized Program to Diagram
          </button>
        </div>
      </div>

      {/* Program Display Area */}
      <div style={{ marginBottom: '20px' }}>
        <h3>Currently Synthesized Programs</h3>
        {/* Select All / Deselect All Buttons */}
        {synthesizedProgram.length > 0 && (
          <div style={{ marginBottom: '10px', display: 'flex', gap: '10px' }}>
            <button
              onClick={handleSelectAll}
              style={{
                padding: '8px 16px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Select All
            </button>
            <button
              onClick={handleDeselectAll}
              style={{
                padding: '8px 16px',
                backgroundColor: '#f44336',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Deselect All
            </button>
          </div>
        )}
        <div
          style={{
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '15px',
            background: '#f9f9f9',
            minHeight: '150px',
            maxHeight: '400px',
            overflow: 'auto',
          }}
        >
          {synthesizedProgram.length > 0 ? (
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
            >
              {synthesizedProgram.map((program, index) => (
                <div
                  key={index}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '10px',
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    backgroundColor: constraintEnabledState[index]
                      ? '#fff'
                      : '#f0f0f0',
                    opacity: constraintEnabledState[index] ? 1 : 0.6,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={constraintEnabledState[index] || false}
                    onChange={() => handleConstraintToggle(index)}
                    style={{
                      marginTop: '2px',
                      transform: 'scale(1.2)',
                    }}
                  />
                  <div
                    style={{
                      flex: 1,
                      fontFamily: 'monospace',
                      fontSize: '14px',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {prettyInferredAbstractLayout(program, true)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                color: '#666',
                fontStyle: 'italic',
                padding: '40px',
              }}
            >
              No program generated yet. Click "Generate Program" to synthesize
              layouts for the current instance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
