import { AbstractLayout } from '../../constraint_language/abstract/AbstractLayout';
import { Model } from '../../model_instance/Model';
import { InstanceDiagramPair } from './inputs/Inputs';
import { genFirstPassClauses } from './passes/FirstPass';
import { genSecondPassClauses } from './passes/SecondPass';

export const genClauses = (
  bound: number,
  model: Model,
  pairs: InstanceDiagramPair[]
): {
  pass1Clauses: (AbstractLayout & { confidence: number })[];
  pass2Clauses: (AbstractLayout & { confidence: number })[];
} => {
  const pass1Clauses = genFirstPassClauses(bound, model, pairs);
  const pass2Clauses = genSecondPassClauses(bound, model, pairs);
  console.log('Pass 2 results:');
  console.log(pass2Clauses);
  return { pass1Clauses, pass2Clauses };
};
