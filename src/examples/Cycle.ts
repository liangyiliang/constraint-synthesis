export const CycleModel = () => ({
  signatures: ['Node'],
  predicates: [{ name: 'Next', sigs: ['Node', 'Node'] }],
  sigHierarchy: [],
});

export const CycleInstance = () => ({
  atoms: [
    { name: 'Node$0', type: 'Node' },
    { name: 'Node$1', type: 'Node' },
    { name: 'Node$2', type: 'Node' },
    { name: 'Node$3', type: 'Node' },
    { name: 'Node$4', type: 'Node' },
  ],
  predicates: [
    { predicateName: 'Next', args: ['Node$0', 'Node$1'] },
    { predicateName: 'Next', args: ['Node$1', 'Node$2'] },
    { predicateName: 'Next', args: ['Node$2', 'Node$3'] },
    { predicateName: 'Next', args: ['Node$3', 'Node$4'] },
    { predicateName: 'Next', args: ['Node$4', 'Node$0'] },
  ],
});
