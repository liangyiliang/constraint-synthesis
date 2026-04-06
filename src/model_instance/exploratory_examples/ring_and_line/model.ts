import { Model } from '../../Model';

export const RingAndLine: Model = {
  signatures: ['this/Node'],
  predicates: [
    { name: 'lineNext', sigs: ['this/Node', 'this/Node'] },
    { name: 'ringNext', sigs: ['this/Node', 'this/Node'] },
    { name: 'assoc', sigs: ['this/Node', 'this/Node'] },
  ],
  sigHierarchy: [],
};
