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
