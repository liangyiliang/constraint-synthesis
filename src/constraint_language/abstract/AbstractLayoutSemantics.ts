import { Instance } from '../../model_instance/Instance';
import { Model } from '../../model_instance/Model';
import { cartesianProduct } from '../../utils/utils';
import {
  BinaryLayout,
  BoundAtom,
  ConcreteLayout,
  UnaryLayout,
  UnboundAtom,
} from '../concrete/ConcreteLayout';
import { Selector } from './AbstractLayout';

/**
 * Maps (tuples of) selector varnames into (tuples of) atom.
 */
export class SelectorEnv {
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

  toSubstitutions(): AbstractLayoutSubst[] {
    const entries = Array.from(this.map.entries()).map(([k, v]) => ({
      varnamesDesc: k,
      possibleMatchesDesc: v,
    }));

    const possibleMatchesDescs = entries.map(e => e.possibleMatchesDesc);
    const prod = cartesianProduct(possibleMatchesDescs);

    const varnamesDescs = entries.map(e => e.varnamesDesc);

    const substs: AbstractLayoutSubst[] = [];
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
  ): AbstractLayoutSubst | undefined {
    if (varnamesDescs.length !== matchesDescs.length) {
      throw new Error(
        `varnamesDescs = ${varnamesDescs}, matchesDescs = ${matchesDescs}, length mismatch`
      );
    }

    const varnames = varnamesDescs.flatMap(desc => this.fromDescriptor(desc));
    const matches = matchesDescs.flatMap(desc => this.fromDescriptor(desc));

    const subst: AbstractLayoutSubst = {};
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
}

export type AbstractLayoutSubst = Record<string, string>;

export const selectorsToSubsts = (
  selectors: Selector[],
  model: Model,
  instance: Instance
): AbstractLayoutSubst[] => {
  const env = new SelectorEnv();
  const substs = selectorsToSubstsHelper(selectors, model, instance, env);
  return substs;
};

const selectorsToSubstsHelper = (
  selectors: Selector[],
  model: Model,
  instance: Instance,
  env: SelectorEnv
): AbstractLayoutSubst[] => {
  if (selectors.length === 0) {
    return env.toSubstitutions();
  }

  const [selector, ...rest] = selectors;

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

  return selectorsToSubstsHelper(rest, model, instance, env);
};

export function applySubstitution(
  layout: BinaryLayout<BoundAtom>,
  subst: AbstractLayoutSubst,
  id: string
): BinaryLayout<UnboundAtom>;
export function applySubstitution(
  layout: UnaryLayout<BoundAtom>,
  subst: AbstractLayoutSubst,
  id: string
): UnaryLayout<UnboundAtom>;
export function applySubstitution(
  layout: UnaryLayout<BoundAtom> | BinaryLayout<BoundAtom>,
  subst: AbstractLayoutSubst,
  id: string
): UnaryLayout<UnboundAtom> | BinaryLayout<UnboundAtom>;
export function applySubstitution(
  layout: ConcreteLayout<BoundAtom>,
  subst: AbstractLayoutSubst,
  id: string
): ConcreteLayout<UnboundAtom>;
export function applySubstitution(
  layout: ConcreteLayout<BoundAtom>,
  subst: AbstractLayoutSubst,
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
