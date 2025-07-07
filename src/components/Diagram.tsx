import { DiagramBuilder, Renderer, canvas } from '@penrose/bloom';
import * as bloom from '@penrose/bloom';
import { useCallback } from 'react';
import { Model } from '../datamodel/Model';
import { Instance } from '../datamodel/Instance';
import { isArrayLiteralExpression } from 'typescript';
import { InstanceDiagramBuilder } from '../diagram/InstanceDiagramBuilder';
import {
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/ConcreteLayout';
import { applyConcreteLayout } from '../constraint_language/ApplyConcreteLayout';

const buildDiagram = async (
  model: Model,
  instance: Instance,
  layout: ConcreteLayout<UnboundAtom>[]
) => {
  const db = new InstanceDiagramBuilder(canvas(500, 400), 'instance', 5000);
  const { forall, text, forallWhere, circle, line, layer, group, rectangle } =
    db.getBloomBuilder();

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
      p.icon = circle({
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
      p.shape = group({ shapes: [p.icon, p.label] });
    });
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
          ensureOnCanvas: false,
          strokeColor: bloom.rgba(1, 0, 0, 1),
          start: [start[0], start[1]],
          end: [end[0], end[1]],
        });
      }
    );
  }

  for (const concreteLayout of layout) {
    applyConcreteLayout(db, concreteLayout);
  }

  return { diagram: db.getBloomBuilder().build(), db };
};

export const Diagram = ({
  model,
  instance,
  layout,
}: {
  model: Model;
  instance: Instance;
  layout: ConcreteLayout<UnboundAtom>[];
}) => {
  const diagram = bloom.useDiagram(
    useCallback(
      () => buildDiagram(model, instance, layout).then(r => r.diagram),
      [model, instance, layout]
    )
  );
  return (
    <div>
      <Renderer diagram={diagram} />
    </div>
  );
};
