import { Model } from '../../Model';

export const RiverCrossingModel: Model = {
  signatures: ['this/Object'],
  predicates: [
    { name: 'left', sigs: ['this/Object'] },
    { name: 'right', sigs: ['this/Object'] },
    { name: 'eats', sigs: ['this/Object', 'this/Object'] },
  ],
  sigHierarchy: [],
};
