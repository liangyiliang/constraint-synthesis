import * as bloom from '@penrose/bloom';
import { Canvas } from '@penrose/core';
import { InstanceAtom, InstancePredicate } from '../datamodel/Instance';
import { ModelPredicate } from '../datamodel/Model';

export class InstanceDiagramBuilder {
  private db: bloom.DiagramBuilder;

  public sigTypeMap: Map<string, bloom.Type>;
  public predicateMap: Map<string, bloom.Predicate>;
  public atomSubstanceMap: Map<string, bloom.Substance>;
  public predicateArgumentTypeMap: Map<string, bloom.Type[]>;

  constructor(canvas: Canvas, name: string, maxShapes: number) {
    this.db = new bloom.DiagramBuilder(canvas, name, maxShapes);
    this.atomSubstanceMap = new Map<string, bloom.Substance>();
    this.sigTypeMap = new Map<string, bloom.Type>();
    this.predicateMap = new Map<string, bloom.Predicate>();
    this.predicateArgumentTypeMap = new Map<string, bloom.Type[]>();
  }

  getBloomBuilder(): bloom.DiagramBuilder {
    return this.db;
  }

  addModelSigAsDomainType(sig: string): bloom.Type {
    const { type } = this.db;
    const bloomType = type();
    this.sigTypeMap.set(sig, bloomType);
    return bloomType;
  }
  addModelPredicateAsDomainPredicate(pred: ModelPredicate): bloom.Predicate {
    const { predicate } = this.db;
    const bloomPred = predicate();
    this.predicateMap.set(pred.name, bloomPred);

    const argTypes = pred.sigs.map(sig => {
      const res = this.sigTypeMap.get(sig);
      if (res === undefined) {
        throw new Error(`Type ${sig} not found in sigTypeMap`);
      }
      return res;
    });
    this.predicateArgumentTypeMap.set(pred.name, argTypes);

    return bloomPred;
  }

  addInstanceAtomAsSubstanceAtom(atom: InstanceAtom): bloom.Substance {
    const { type, name } = atom;
    const bloomType = this.sigTypeMap.get(type);
    if (bloomType === undefined) {
      throw new Error(`Type ${type} not found in sigTypeMap`);
    }
    const substance = bloomType();
    substance.name = name;
    this.atomSubstanceMap.set(name, substance);
    return substance;
  }

  addInstancePredicateAsSubstancePredicate(pred: InstancePredicate): void {
    const bloomPred = this.predicateMap.get(pred.predicateName);
    if (bloomPred === undefined) {
      throw new Error(
        `Predicate ${pred.predicateName} not found in predicateMap`
      );
    }

    const args = pred.args.map(arg => {
      const substance = this.atomSubstanceMap.get(arg);
      if (substance === undefined) {
        throw new Error(`Atom ${arg} not found in atomSubstanceMap`);
      }
      return substance;
    });

    // don't do type check for now, need to consider subtyping

    const expectedLength = this.predicateArgumentTypeMap.get(
      pred.predicateName
    )!.length;
    if (args.length !== expectedLength) {
      throw new Error(
        `Predicate ${pred.predicateName} expects ${expectedLength} arguments, but got ${args.length}`
      );
    }

    bloomPred(...args);
  }
}
