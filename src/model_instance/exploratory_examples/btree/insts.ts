import { Instance } from '../../Instance';

const BTreeInst0 = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'left', args: ['Node$0', 'Node$1'] },
    { predicateName: 'left', args: ['Node$1', 'Node$2'] },
  ],
};

const BTreeInst1 = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Node$4', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'left', args: ['Node$2', 'Node$4'] },
    { predicateName: 'left', args: ['Node$3', 'Node$2'] },
    { predicateName: 'left', args: ['Node$4', 'Node$1'] },
    { predicateName: 'right', args: ['Node$1', 'Node$0'] },
  ],
};

const BTreeInst2 = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Node$4', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'left', args: ['Node$2', 'Node$4'] },
    { predicateName: 'left', args: ['Node$3', 'Node$2'] },
    { predicateName: 'left', args: ['Node$4', 'Node$1'] },

    { predicateName: 'right', args: ['Node$4', 'Node$0'] },
  ],
};

const BTreeInst3 = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Node$4', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'left', args: ['Node$2', 'Node$4'] },
    { predicateName: 'left', args: ['Node$3', 'Node$2'] },
    { predicateName: 'left', args: ['Node$4', 'Node$1'] },

    { predicateName: 'right', args: ['Node$2', 'Node$0'] },
  ],
};

const BTreeInst4 = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Node$4', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'left', args: ['Node$2', 'Node$4'] },
    { predicateName: 'left', args: ['Node$3', 'Node$2'] },
    { predicateName: 'left', args: ['Node$4', 'Node$1'] },

    { predicateName: 'right', args: ['Node$3', 'Node$0'] },
  ],
};

const BTreeInst5 = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Node$4', type: 'this/Node' },
    { name: 'Node$5', type: 'this/Node' },
    { name: 'Node$6', type: 'this/Node' },
    { name: 'Node$7', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'left', args: ['Node$6', 'Node$4'] },

    { predicateName: 'right', args: ['Node$1', 'Node$0'] },
    { predicateName: 'right', args: ['Node$5', 'Node$1'] },
  ],
};

export const BTreeInsts: Instance[] = [BTreeInst0, BTreeInst1, BTreeInst2];
