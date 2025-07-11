import { emptyInstance, Instance } from '../datamodel/Instance';
import { emptyModel, Model } from '../datamodel/Model';
import { InstanceDiagramBuilder } from '../diagram/InstanceDiagramBuilder';
import { AbstractLayout } from './AbstractLayout';
import { ConcreteLayoutApplier } from './ApplyConcreteLayout';
import { BoundAtom, ConcreteLayout, UnboundAtom } from './ConcreteLayout';

class AbstractLayoutEnv {
  private map: Map<string, string[]>;

  constructor() {
    this.map = new Map();
  }

  private toDescriptor(key: string): string;
  private toDescriptor(key: string[]): string;
  private toDescriptor(key: string[] | string): string;
  private toDescriptor(key: string[] | string): string {
    if (Array.isArray(key)) {
      return key.join('::');
    }
    return key;
  }

  private fromDescriptor(desc: string): string[] {
    return desc.split('::');
  }

  add(key: string, value: string): void;
  add(key: string[], value: string[]): void;
  add(key: string | string[], value: string | string[]): void {
    const keyDesc = this.toDescriptor(key);
    if (!this.map.has(keyDesc)) {
      this.map.set(keyDesc, []);
    }
    const valueDesc = this.toDescriptor(value);
    this.map.get(keyDesc)?.push(valueDesc);
  }

  toSubstitutions(): Subst[] {
    const entries = Array.from(this.map.entries()).map(([k, v]) => ({
      varnamesDesc: k,
      possibleMatchesDesc: v,
    }));

    const possibleMatchesDescs = entries.map(e => e.possibleMatchesDesc);
    const prod = this.cartesianProduct(possibleMatchesDescs);

    const varnamesDescs = entries.map(e => e.varnamesDesc);

    const substs: Subst[] = [];
    for (const entry of prod) {
      const subst = this.buildSubst(varnamesDescs, entry);
      if (subst === undefined) {
        continue; // Invalid substitution, skip
      }
      substs.push(subst);
    }

    return substs;
  }

  private buildSubst(
    varnamesDescs: string[],
    matchesDescs: string[]
  ): Subst | undefined {
    if (varnamesDescs.length !== matchesDescs.length) {
      throw new Error(
        `varnamesDescs = ${varnamesDescs}, matchesDescs = ${matchesDescs}, length mismatch`
      );
    }

    const varnames = varnamesDescs.flatMap(desc => this.fromDescriptor(desc));
    const matches = matchesDescs.flatMap(desc => this.fromDescriptor(desc));

    const subst: Subst = {};
    for (let i = 0; i < varnames.length; i++) {
      const varname = varnames[i];
      const match = matches[i];
      if (varname in subst && subst[varname] !== match) {
        return undefined; // Conflict in substitution, invalid substitution
      }
      subst[varnames[i]] = matches[i];
    }
    return subst;
  }

  private cartesianProduct(arrays: string[][]): string[][] {
    return arrays.reduce(
      (acc, curr) => {
        const result: string[][] = [];
        for (const a of acc) {
          for (const b of curr) {
            result.push([...a, b]);
          }
        }
        return result;
      },
      [[]] as string[][]
    );
  }
}

type Subst = Record<string, string>;

export function compileAbstractLayouts(
  layouts: AbstractLayout[],
  model: Model,
  instance: Instance
): ConcreteLayout<UnboundAtom>[] {
  const concretes: ConcreteLayout<UnboundAtom>[] = [];
  for (let i = 0; i < layouts.length; i++) {
    const layout = layouts[i];
    const env = new AbstractLayoutEnv();
    const compiled = compileAbstractLayoutHelper(
      layout,
      model,
      instance,
      env,
      i
    );
    concretes.push(...compiled);
  }
  return concretes;
}

function compileAbstractLayoutHelper(
  layout: AbstractLayout,
  model: Model,
  instance: Instance,
  env: AbstractLayoutEnv,
  layoutNo: number
): ConcreteLayout<UnboundAtom>[] {
  const { selector, layout: inner } = layout;

  if (selector.tag === 'SigSelector') {
    const { sig, varname } = selector;
    const atomNames = instance.atoms
      .filter(atom => atom.type === sig)
      .map(atom => atom.name);
    for (const atomName of atomNames) {
      env.add(varname, atomName);
    }
  } else {
    const { pred, args } = selector;
    const predicates = instance.predicates.filter(
      p => p.predicateName === pred
    );
    const tuples = predicates.map(p => p.args);
    for (const tuple of tuples) {
      if (args.length !== tuple.length) {
        throw new Error(
          `Selector ${pred} expects ${args.length} args, but got ${tuple.length}`
        );
      }
      env.add(args, tuple);
    }
  }

  if (inner.tag === 'AbstractLayout') {
    // Recursive case
    return compileAbstractLayoutHelper(inner, model, instance, env, layoutNo);
  } else {
    // Concrete layout
    const substs = env.toSubstitutions();
    const concretes: ConcreteLayout<UnboundAtom>[] = substs.map(subst =>
      applySubstitution(inner, subst, layoutNo.toString())
    );
    return concretes;
  }
}

function applySubstitution(
  layout: ConcreteLayout<BoundAtom>,
  subst: Subst,
  id: string
): ConcreteLayout<UnboundAtom> {
  if (layout.tag === 'BinaryLayout') {
    return {
      ...layout,
      op0: {
        tag: 'UnboundAtom',
        name: subst[layout.op0.name],
      },
      op1: {
        tag: 'UnboundAtom',
        name: subst[layout.op1.name],
      },
    };
  } else if (layout.tag === 'UnaryLayout') {
    return {
      ...layout,
      op: {
        tag: 'UnboundAtom',
        name: subst[layout.op.name],
      },
    };
  } else if (layout.tag === 'CyclicLayout') {
    return {
      ...layout,
      op0: {
        tag: 'UnboundAtom',
        name: subst[layout.op0.name],
      },
      op1: {
        tag: 'UnboundAtom',
        name: subst[layout.op1.name],
      },
      cycleId: 'cycle-' + id,
    };
  } else {
    return {
      ...layout,
      op: {
        tag: 'UnboundAtom',
        name: subst[layout.op.name],
      },
      groupId: 'group-' + id,
    };
  }
}
