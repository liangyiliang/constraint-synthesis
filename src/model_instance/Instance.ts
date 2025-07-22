export interface Instance {
  atoms: InstanceAtom[];
  predicates: InstancePredicate[];
}

export type InstanceAtom = {
  name: string;
  type: string;
};

export type InstancePredicate = {
  predicateName: string;
  args: string[];
};

export const emptyInstance = (): Instance => ({
  atoms: [],
  predicates: [],
});

export const simpleCycleInstance = (): Instance => ({
  atoms: [
    { name: 'n0', type: 'Node' },
    { name: 'n1', type: 'Node' },
    { name: 'n2', type: 'Node' },
    { name: 'n3', type: 'Node' },
    { name: 'n4', type: 'Node' },
  ],
  predicates: [
    { predicateName: 'red', args: ['n0', 'n1'] },
    { predicateName: 'red', args: ['n1', 'n2'] },
    { predicateName: 'red', args: ['n2', 'n3'] },
    { predicateName: 'red', args: ['n3', 'n4'] },
  ],
});

export const moreComplexCycleInstance = (): Instance => ({
  atoms: [
    { name: 'n0', type: 'Node' },
    { name: 'n1', type: 'Node' },
    { name: 'n2', type: 'Node' },
    { name: 'n3', type: 'Node' },
    { name: 'n4', type: 'Node' },
    { name: 'n5', type: 'Node' },
    { name: 'n6', type: 'Node' },
  ],
  predicates: [
    { predicateName: 'red', args: ['n0', 'n1'] },
    { predicateName: 'red', args: ['n1', 'n2'] },
    { predicateName: 'red', args: ['n2', 'n3'] },
    { predicateName: 'red', args: ['n3', 'n4'] },
    { predicateName: 'red', args: ['n4', 'n0'] },
    { predicateName: 'blue', args: ['n5', 'n0'] },
    { predicateName: 'blue', args: ['n0', 'n1'] },
    { predicateName: 'blue', args: ['n1', 'n6'] },
    { predicateName: 'blue', args: ['n6', 'n5'] },
  ],
});

export const multipleSigsInstance = (): Instance => ({
  atoms: [
    { name: 'n0', type: 'Apple' },
    { name: 'n1', type: 'Banana' },
    { name: 'n2', type: 'Apple' },
    { name: 'n3', type: 'Banana' },
    { name: 'n4', type: 'Apple' },
    { name: 'n5', type: 'Banana' },
  ],
  predicates: [],
});
