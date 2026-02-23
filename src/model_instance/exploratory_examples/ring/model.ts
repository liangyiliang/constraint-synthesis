import { Model } from '../../Model';

export const RingModel: Model = {
  signatures: ['this/Node', 'this/Data'],
  predicates: [
    { name: 'succ', sigs: ['this/Node', 'this/Node'] },
    { name: 'node_data', sigs: ['this/Node', 'this/Data'] },
  ],
  sigHierarchy: [],
};
