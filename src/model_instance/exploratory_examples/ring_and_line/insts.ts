import { Instance } from '../../Instance';

const RingAndLineInst0: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
  ],
  predicates: [{ predicateName: 'lineNext', args: ['Node$0', 'Node$1'] }],
};
const RingAndLineInst1: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'lineNext', args: ['Node$0', 'Node$1'] },
    { predicateName: 'lineNext', args: ['Node$1', 'Node$2'] },
  ],
};
const RingAndLineInst2: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'ringNext', args: ['Node$0', 'Node$1'] },
    { predicateName: 'ringNext', args: ['Node$1', 'Node$2'] },
    { predicateName: 'ringNext', args: ['Node$2', 'Node$0'] },
  ],
};
const RingAndLineInst3: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'ringNext', args: ['Node$0', 'Node$1'] },
    { predicateName: 'ringNext', args: ['Node$1', 'Node$2'] },
    { predicateName: 'ringNext', args: ['Node$2', 'Node$3'] },
    { predicateName: 'ringNext', args: ['Node$3', 'Node$0'] },
  ],
};
const RingAndLineInst4: Instance = {
  atoms: [
    { name: 'Node$0', type: 'this/Node' },
    { name: 'Node$1', type: 'this/Node' },
    { name: 'Node$2', type: 'this/Node' },
    { name: 'Node$3', type: 'this/Node' },
    { name: 'Node$4', type: 'this/Node' },
    { name: 'Node$5', type: 'this/Node' },
  ],
  predicates: [
    { predicateName: 'ringNext', args: ['Node$0', 'Node$1'] },
    { predicateName: 'ringNext', args: ['Node$1', 'Node$2'] },
    { predicateName: 'ringNext', args: ['Node$2', 'Node$0'] },
    { predicateName: 'lineNext', args: ['Node$3', 'Node$4'] },
    { predicateName: 'lineNext', args: ['Node$4', 'Node$5'] },
    { predicateName: 'assoc', args: ['Node$0', 'Node$3'] },
    { predicateName: 'assoc', args: ['Node$1', 'Node$4'] },
    { predicateName: 'assoc', args: ['Node$2', 'Node$5'] },
  ],
};
const RingAndLineInst5: Instance = {
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
    { predicateName: 'ringNext', args: ['Node$0', 'Node$1'] },
    { predicateName: 'ringNext', args: ['Node$1', 'Node$2'] },
    { predicateName: 'ringNext', args: ['Node$2', 'Node$3'] },
    { predicateName: 'ringNext', args: ['Node$3', 'Node$0'] },
    { predicateName: 'lineNext', args: ['Node$4', 'Node$5'] },
    { predicateName: 'lineNext', args: ['Node$5', 'Node$6'] },
    { predicateName: 'lineNext', args: ['Node$6', 'Node$7'] },
    { predicateName: 'assoc', args: ['Node$0', 'Node$4'] },
    { predicateName: 'assoc', args: ['Node$1', 'Node$5'] },
    { predicateName: 'assoc', args: ['Node$2', 'Node$6'] },
    { predicateName: 'assoc', args: ['Node$3', 'Node$7'] },
  ],
};
export const RingANdLineInsts: Instance[] = [
  //RingAndLineInst0,
  RingAndLineInst1,
  RingAndLineInst2,
  RingAndLineInst3,
  RingAndLineInst4,
  RingAndLineInst5,
];
