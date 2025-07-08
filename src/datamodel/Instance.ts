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

export const simpleInstance = (): Instance => ({
  atoms: [
    { name: 'a0', type: 'Apple' },
    { name: 'a1', type: 'Apple' },
    { name: 'a2', type: 'Apple' },
  ],
  predicates: [
    { predicateName: 'redder', args: ['a0', 'a1'] },
    { predicateName: 'bigger', args: ['a1', 'a2'] },
    { predicateName: 'isSweet', args: ['a1'] },
  ],
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
