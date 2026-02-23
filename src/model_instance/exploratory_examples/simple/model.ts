import { Model } from '../../Model';

export const SimpleModel: Model = {
  signatures: ['Node'],
  predicates: [
    { name: 'rel', sigs: ['Node', 'Node'] },
    { name: 'rel1', sigs: ['Node', 'Node'] },
  ],
  sigHierarchy: [],
};
