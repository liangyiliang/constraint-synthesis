import { DiagramBuilder, Renderer, canvas } from '@penrose/bloom';
import * as bloom from '@penrose/bloom';
import { useCallback, useState } from 'react';
import { Model } from '../model_instance/Model';
import { Instance } from '../model_instance/Instance';
import { isArrayLiteralExpression } from 'typescript';
import { InstanceDiagramBuilder } from '../diagram/InstanceDiagramBuilder';
import {
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/concrete/ConcreteLayout';
import { ConcreteLayoutApplier } from '../constraint_language/concrete/ApplyConcreteLayout';
import { AbstractDiagram } from '../inference/ConfidenceScore';
import { AbstractLayout } from '../constraint_language/abstract/AbstractLayout';
import { compileAbstractLayouts } from '../constraint_language/abstract/ApplyAbstractLayout';
import { disjoint } from '@penrose/bloom/dist/core/constraints';

const buildDiagram = async (
  model: Model,
  instance: Instance,
  layout: AbstractLayout[]
) => {
  const db = new InstanceDiagramBuilder(canvas(500, 400), 'instance', 5000);
  const {
    forall,
    text,
    forallWhere,
    circle,
    line,
    layer,
    group,
    rectangle,
    input,
    ensure,
  } = db.getBloomBuilder();

  rectangle({
    center: [0, 0],
    width: 500,
    height: 400,
    strokeColor: bloom.rgba(0, 0, 0, 1),
    strokeWidth: 1,
  });

  for (const sig of model.signatures) {
    db.addModelSigAsDomainType(sig);
  }

  for (const pred of model.predicates) {
    db.addModelPredicateAsDomainPredicate(pred);
  }

  for (const instanceAtom of instance.atoms) {
    db.addInstanceAtomAsSubstanceAtom(instanceAtom);
  }

  for (const instancePredicate of instance.predicates) {
    db.addInstancePredicateAsSubstancePredicate(instancePredicate);
  }

  for (const [sig, bloomType] of db.sigTypeMap) {
    forall({ p: bloomType }, ({ p }) => {
      const cx = input({
        name: `x_${p.name}`,
        optimized: true,
      });
      const cy = input({
        name: `y_${p.name}`,
        optimized: true,
      });
      p.icon = circle({
        center: [cx, cy],
        r: 25,
        drag: true,
        fillColor: bloom.rgba(1, 0.8, 0, 1),
        strokeColor: bloom.rgba(0, 0, 0, 1),
        strokeWidth: 2,
      });
      p.label = text({
        string: p.name,
        center: p.icon.center,
      });
      layer(p.icon, p.label);
      // p.shape = group({ shapes: [p.icon, p.label] });
    });
  }

  for (const substance1 of db.atomSubstanceMap.values()) {
    for (const substance2 of db.atomSubstanceMap.values()) {
      if (substance1 !== substance2) {
        ensure(disjoint(substance1.icon, substance2.icon));
      }
    }
  }

  for (const [predName, bloomPred] of db.predicateMap) {
    // hack for demo
    const col =
      predName === 'NextSegment'
        ? bloom.rgba(1, 0, 0, 1) // red
        : predName === 'TrackSegment'
          ? bloom.rgba(0, 0, 1, 1) // blue
          : predName === 'TransponderOnSegment'
            ? bloom.rgba(0, 0.6, 0, 1) // green
            : predName === 'TrainOnSegment'
              ? bloom.rgba(0.6, 0.8, 0.2, 1) // yellow
              : bloom.rgba(0, 0, 0, 1); // black

    const sigs = model.predicates.find(pred => pred.name === predName)!.sigs;
    const bloomTypesOfSigs = sigs.map(sig => db.sigTypeMap.get(sig)!);
    if (bloomTypesOfSigs.length <= 1) {
      continue;
    }

    const selectorVarIndices = Array.from(
      Array(bloomTypesOfSigs.length).keys()
    );

    const selectorVars = selectorVarIndices.map(i => 'v_' + i);
    const selectorTypes = bloomTypesOfSigs;

    const selectorVarsDict = Object.fromEntries(
      selectorVars.map((v, i) => [v, selectorTypes[i]]) // zipping selectorVars and selectorTypes
    );

    const varFrom = 'v_0';
    const varTo = 'v_' + (bloomTypesOfSigs.length - 1);
    forallWhere(
      selectorVarsDict,
      selectorVarsInstantiated => {
        // VVV these are the instantiated selector variables
        const args = selectorVars.map(v => selectorVarsInstantiated[v]);
        return bloomPred.test(...args);
      },
      selectorVarsInstantiated => {
        const substanceFrom = selectorVarsInstantiated[varFrom];
        const substanceTo = selectorVarsInstantiated[varTo];

        // draw an arrow between From and To
        const shapeFrom: bloom.Circle = substanceFrom.icon;
        const shapeTo: bloom.Circle = substanceTo.icon;

        const fromCenter = shapeFrom.center;
        const toCenter = shapeTo.center;
        const diff = bloom.ops.vsub(toCenter, fromCenter);
        const udiff = bloom.ops.vnormalize(diff);
        const start = bloom.ops.vadd(
          fromCenter,
          bloom.ops.vmul(bloom.add(25, 0), udiff)
        );
        const end = bloom.ops.vsub(
          toCenter,
          bloom.ops.vmul(bloom.add(25, 0), udiff)
        );
        line({
          endArrowhead: 'straight',
          ensureOnCanvas: false,
          strokeColor: col,
          start: [start[0], start[1]],
          end: [end[0], end[1]],
        });
        const middle = bloom.ops.vdiv(bloom.ops.vadd(start, end), 2);
        text({
          string: predName,
          center: [middle[0], middle[1]],
          fillColor: bloom.rgba(1, 0, 0, 1),
        });
      }
    );
  }

  const concreteLayouts = compileAbstractLayouts(layout, model, instance);

  const layoutApplier = new ConcreteLayoutApplier(db);
  for (const concreteLayout of concreteLayouts) {
    layoutApplier.stageConcreteLayout(concreteLayout);
  }

  layoutApplier.applyStagedLayouts();

  return db.getBloomBuilder().build();
};

export const Diagram = ({
  model,
  instance,
  layoutProgram,
  setAbstractDiagram,
}: {
  model: Model;
  instance: Instance;
  layoutProgram: AbstractLayout[];
  setAbstractDiagram: (d: AbstractDiagram) => void;
}) => {
  const diagram = bloom.useDiagram(
    useCallback(
      () => buildDiagram(model, instance, layoutProgram),
      [model, instance, layoutProgram]
    )
  );

  return (
    <div>
      <Renderer diagram={diagram} />
      <button
        onClick={e => {
          try {
            const absDiag: AbstractDiagram = {};
            for (const atom of instance.atoms) {
              const cx = diagram?.getInput(`x_${atom.name}`);
              const cy = diagram?.getInput(`y_${atom.name}`);
              if (cx === undefined || cy === undefined) {
                throw new Error(
                  `Could not find inputs for atom ${atom.name}: cx=${cx}, cy=${cy}`
                );
              }
              absDiag[atom.name] = {
                x: cx,
                y: cy,
              };
            }
            setAbstractDiagram(absDiag);
          } catch (error) {
            console.error('Error setting diagram:', error);
          }
        }}
      >
        Set Diagram
      </button>
    </div>
  );
};
