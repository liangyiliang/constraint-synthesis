import { DiagramBuilder, Renderer, canvas } from '@penrose/bloom';
import * as bloom from '@penrose/bloom';
import React, { ForwardedRef, useCallback, useState } from 'react';
import { Model } from '../model_instance/Model';
import { Instance } from '../model_instance/Instance';
import { isArrayLiteralExpression } from 'typescript';
import { InstanceDiagramBuilder } from '../diagram/InstanceDiagramBuilder';
import {
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/concrete/ConcreteLayout';
import { ConcreteLayoutApplier } from '../constraint_language/concrete/ApplyConcreteLayout';
import { AbstractLayout } from '../constraint_language/abstract/AbstractLayout';
import { compileAbstractLayouts } from '../constraint_language/abstract/ApplyAbstractLayout';
import { disjoint } from '@penrose/bloom/dist/core/constraints';
import { AbstractDiagram } from '../inference/multi_instance/inputs/Inputs';
import { near, notTooClose } from '@penrose/bloom/dist/core/objectives';

export type Var = ReturnType<typeof bloom.DiagramBuilder.prototype.input>;

const buildDiagram = async (
  model: Model,
  instance: Instance,
  layout: AbstractLayout[],
  seed: string = 'instance'
) => {
  const db = new InstanceDiagramBuilder(canvas(500, 400), seed, 5000);
  const { forall, text, forallWhere, circle, line, layer, rectangle, input } =
    db.getBloomBuilder();

  const constraintEnforcement = input({
    name: 'constraintEnforcement',
    optimized: false,
    init: 1,
  });

  rectangle({
    center: [0, 0],
    width: 500,
    height: 400,
    strokeColor: bloom.rgba(0, 0, 0, 1),
    fillColor: bloom.rgba(1, 1, 1, 1),
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
      const xname = `x_${p.name}`;
      const yname = `y_${p.name}`;

      const cx = input({
        name: xname,
        optimized: true,
      });
      const cy = input({
        name: yname,
        optimized: true,
      });
      p.icon = circle({
        center: [cx, cy],
        r: 25,
        fillColor: bloom.rgba(1, 0.8, 0, 1),
        strokeColor: bloom.rgba(0, 0, 0, 1),
        strokeWidth: 2,
        drag: true,
      });
      p.label = text({
        string: p.name,
        center: p.icon.center,
      });
      layer(p.icon, p.label);

      //ensure(bloom.constraints.onCanvas(p.icon, 500, 400));
    });
  }

  for (const substance1 of db.atomSubstanceMap.values()) {
    for (const substance2 of db.atomSubstanceMap.values()) {
      if (substance1 !== substance2) {
        // encourage(
        //   bloom.mul(
        //     disjoint(substance1.icon, substance2.icon, 0.01),
        //     constraintEnforcement
        //   )
        // );
      }
    }
  }

  for (const [predName, bloomPred] of db.predicateMap) {
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
          strokeColor: bloom.rgba(1, 0, 0, 1),
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

  layoutApplier.applyStagedLayouts(constraintEnforcement);

  return db.getBloomBuilder().build();
};

const TheComponent = (
  {
    model,
    instance,
    layoutProgram,
  }: {
    model: Model;
    instance: Instance;
    layoutProgram: AbstractLayout[];
  },
  ref: ForwardedRef<{
    getAbstractDiagram: () => AbstractDiagram;
    setConstraintEnforcement: (enforced: boolean) => void;
    getConstraintEnforcement: () => number | undefined;
  }>
) => {
  const [seed, setSeed] = useState(0);
  console.log('Rendered Diagram Component!');

  const diagram = bloom.useDiagram(
    useCallback(
      () => buildDiagram(model, instance, layoutProgram, `${seed}`),
      [model, instance, layoutProgram, seed]
    )
  );
  const getAbstractDiagram = (): AbstractDiagram => {
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
      console.log('Extracted abstract diagram:', absDiag);
      return absDiag;
    } catch (error) {
      console.error('Error extracting diagram:', error);
      return {};
    }
  };

  const setConstraintEnforcement = (enforced: boolean) => {
    console.log('Setting constraint enforcement to', enforced);
    console.log('Before: ', diagram?.getInput('constraintEnforcement'));
    diagram?.setInput('constraintEnforcement', enforced ? 1 : 0);
    console.log('After: ', diagram?.getInput('constraintEnforcement'));
  };

  const getConstraintEnforcement = (): number | undefined => {
    const value = diagram?.getInput('constraintEnforcement');
    return value;
  };

  React.useImperativeHandle(ref, () => ({
    getAbstractDiagram,
    setConstraintEnforcement,
    getConstraintEnforcement,
  }));

  return (
    <div style={{ width: '100%', height: '90%' }}>
      <Renderer diagram={diagram} />
      <button onClick={() => setSeed(prev => prev + 1)}>Resample</button>
    </div>
  );
};

export const Diagram = React.forwardRef(TheComponent);
