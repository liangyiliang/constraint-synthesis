import { DiagramBuilder, Renderer, canvas } from '@penrose/bloom';
import * as bloom from '@penrose/bloom';
import { useCallback } from 'react';
import { Model } from '../datamodel/Model';
import { Instance } from '../datamodel/Instance';
import { isArrayLiteralExpression } from 'typescript';

const buildDiagram = async (model: Model, instance: Instance) => {
  const db = new DiagramBuilder(canvas(500, 400), 'instance', 5000);
  const {
    type,
    predicate,
    forall,
    text,
    forallWhere,
    ensure,
    circle,
    line,
    layer,
    group,
  } = db;

  const types = new Map(model.signatures.map(sig => [sig, type()]));
  const predicates = new Map(
    model.predicates.map(pred => [pred.name, predicate()])
  );

  const atomSubstances = new Map(
    instance.atoms.map(atom => {
      const substance = types.get(atom.type)!();
      substance.name = atom.name;
      return [atom.name, substance];
    })
  );
  const predicateSubstances = new Array(
    ...instance.predicates.map(pred => {
      const args = pred.args.map(arg => atomSubstances.get(arg)!);
      return predicates.get(pred.predicateName)!(...args);
    })
  );

  for (const [sig, bloomType] of types) {
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

  for (const [predName, bloomPred] of predicates) {
    const sigs = model.predicates.find(pred => pred.name === predName)!.sigs;
    const bloomTypesOfSigs = sigs.map(sig => types.get(sig)!);
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

  return db.build();
};

export const Diagram = ({
  model,
  instance,
}: {
  model: Model;
  instance: Instance;
}) => {
  const diagram = bloom.useDiagram(
    useCallback(() => buildDiagram(model, instance), [model, instance])
  );
  return (
    <div>
      <Renderer diagram={diagram} />
    </div>
  );
};
