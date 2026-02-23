import { Instance } from '../../Instance';

const RingInst0: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'succ', args: ['Node$0', 'Node$1'] },
    { predicateName: 'succ', args: ['Node$1', 'Node$0'] },
  ],
};

const RingInst1: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'succ', args: ['Node$0', 'Node$1'] },
    { predicateName: 'succ', args: ['Node$1', 'Node$2'] },
    { predicateName: 'succ', args: ['Node$2', 'Node$0'] },
  ],
};

const RingInst2: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Data$0', type: 'this/Data' },
    { name: 'Data$1', type: 'this/Data' },
  ],
  predicates: [
    { predicateName: 'succ', args: ['Node$0', 'Node$1'] },
    { predicateName: 'succ', args: ['Node$1', 'Node$0'] },
    { predicateName: 'node_data', args: ['Node$0', 'Data$0'] },
    { predicateName: 'node_data', args: ['Node$1', 'Data$1'] },
  ],
};

const RingInst3: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Data$0', type: 'this/Data' },
    { name: 'Data$1', type: 'this/Data' },
  ],
  predicates: [
    { predicateName: 'succ', args: ['Node$0', 'Node$1'] },
    { predicateName: 'succ', args: ['Node$1', 'Node$0'] },
    { predicateName: 'node_data', args: ['Node$0', 'Data$0'] },
    { predicateName: 'node_data', args: ['Node$1', 'Data$0'] },
    { predicateName: 'node_data', args: ['Node$0', 'Data$1'] },
    { predicateName: 'node_data', args: ['Node$1', 'Data$1'] },
  ],
};

const RingInst4: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Data$0', type: 'this/Data' },
    { name: 'Data$1', type: 'this/Data' },
    { name: 'Data$2', type: 'this/Data' },
    { name: 'Data$3', type: 'this/Data' },
  ],
  predicates: [
    { predicateName: 'succ', args: ['Node$0', 'Node$1'] },
    { predicateName: 'succ', args: ['Node$1', 'Node$2'] },
    { predicateName: 'succ', args: ['Node$2', 'Node$3'] },
    { predicateName: 'succ', args: ['Node$3', 'Node$0'] },
    { predicateName: 'node_data', args: ['Node$3', 'Data$0'] },
    { predicateName: 'node_data', args: ['Node$1', 'Data$3'] },
    { predicateName: 'node_data', args: ['Node$2', 'Data$3'] },
    { predicateName: 'node_data', args: ['Node$2', 'Data$1'] },
    { predicateName: 'node_data', args: ['Node$2', 'Data$2'] },
  ],
};

const RingInst5: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Data$0', type: 'this/Data' },
    { name: 'Data$1', type: 'this/Data' },
  ],
  predicates: [
    { predicateName: 'succ', args: ['Node$0', 'Node$1'] },
    { predicateName: 'succ', args: ['Node$1', 'Node$2'] },
    { predicateName: 'succ', args: ['Node$2', 'Node$0'] },
    { predicateName: 'node_data', args: ['Node$0', 'Data$0'] },
    { predicateName: 'node_data', args: ['Node$0', 'Data$1'] },
  ],
};

export const RingInsts: Instance[] = [
  //RingInst0,
  //RingInst1,
  RingInst2,
  //RingInst3,
  //RingInst4,
  RingInst5,
];
