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
  private map: [string, string[]][];

  constructor() {
    this.map = [];
  }

  add(varnames: string[], atoms: string[][]): void {
    const varnamesDesc = this.toDescriptor(varnames);
    const atomsDescs = atoms.map(this.toDescriptor);
    this.map.push([varnamesDesc, atomsDescs]);
  }

  private toDescriptor(v: string[]): string {
    return v.join('::');
  }
  private fromDescriptor(desc: string): string[] {
    return desc.split('::');
  }

  toSubstitutions(): AbstractLayoutSubst[] {
    const varnames = this.map.map(([k]) => this.fromDescriptor(k));
    const matches = this.map.map(([, v]) => v.map(this.fromDescriptor));
    const prod = cartesianProduct(matches);

    const substs: AbstractLayoutSubst[] = [];
    for (const entry of prod) {
      const subst = this.buildSubst(varnames, entry);
      if (subst === undefined) {
        continue; // Invalid substitution, skip
      }
      substs.push(subst);
    }

    return substs;
  }

  private buildSubst(
    varnames: string[][],
    potentialMatch: string[][]
  ): AbstractLayoutSubst | undefined {
    if (varnames.length !== potentialMatch.length) {
      throw new Error(
        `varnames = ${varnames}, potentialMatch = ${potentialMatch}, length mismatch`
      );
    }

    const subst: AbstractLayoutSubst = {};
    for (let i = 0; i < varnames.length; i++) {
      const vars = varnames[i];
      const atoms = potentialMatch[i];
      if (vars.length !== atoms.length) {
        throw new Error(`vars = ${vars}, atoms = ${atoms}, length mismatch`);
      }
      for (let j = 0; j < vars.length; j++) {
        const v = vars[j];
        const a = atoms[j];
        if (v in subst) {
          if (subst[v] !== a) {
            // Conflict in substitution
            return undefined;
          }
        } else {
          subst[v] = a;
        }
      }
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
    const res = env.toSubstitutions();
    return res;
  }

  const [selector, ...rest] = selectors;

  if (selector.tag === 'SigSelector') {
    const { sig, varname } = selector;
    const atomNames = instance.atoms
      .filter(atom => atom.type === sig)
      .map(atom => atom.name);
    if (atomNames.length === 0) {
      return [];
    } else {
      env.add(
        [varname],
        atomNames.map(name => [name])
      );
    }
  } else {
    const { pred, args } = selector;
    const predicates = instance.predicates.filter(
      p => p.predicateName === pred
    );
    const tuples = predicates.map(p => p.args);
    if (tuples.length === 0) {
      return [];
    } else {
      env.add(args, tuples);
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
