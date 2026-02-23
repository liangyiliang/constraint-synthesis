import { Model } from '../../Model';

export const BTreeModel: Model = {
  signatures: ['this/Node'],
  predicates: [
    { name: 'left', sigs: ['this/Node', 'this/Node'] },
    { name: 'right', sigs: ['this/Node', 'this/Node'] },
  ],
  sigHierarchy: [],
};
