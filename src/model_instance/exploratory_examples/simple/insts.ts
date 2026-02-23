import { Instance } from '../../Instance';

const SimpleInst0 = {
  atoms: [
    { name: 'Node$0', type: 'Node' },
    { name: 'Node$1', type: 'Node' },
  ],
  predicates: [{ predicateName: 'rel', args: ['Node$0', 'Node$1'] }],
};
const SimpleInst1 = {
  atoms: [
    { name: 'Node$0', type: 'Node' },
    { name: 'Node$1', type: 'Node' },
    { name: 'Node$2', type: 'Node' },
  ],
  predicates: [
    { predicateName: 'rel', args: ['Node$0', 'Node$1'] },
    { predicateName: 'rel', args: ['Node$0', 'Node$2'] },
  ],
};

const SimpleInst2 = {
  atoms: [
    { name: 'Node$0', type: 'Node' },
    { name: 'Node$1', type: 'Node' },
    { name: 'Node$2', type: 'Node' },
  ],
  predicates: [
    { predicateName: 'rel', args: ['Node$0', 'Node$1'] },
    { predicateName: 'rel', args: ['Node$1', 'Node$2'] },
  ],
};

const SimpleInst3 = {
  atoms: [
    { name: 'Node$0', type: 'Node' },
    { name: 'Node$1', type: 'Node' },
    { name: 'Node$2', type: 'Node' },
  ],
  predicates: [
    { predicateName: 'rel', args: ['Node$0', 'Node$1'] },
    { predicateName: 'rel1', args: ['Node$0', 'Node$2'] },
  ],
};

export const SimpleInsts: Instance[] = [
  SimpleInst0,
  SimpleInst1,
  SimpleInst2,
  SimpleInst3,
];
