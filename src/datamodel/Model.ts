export interface Model {
  signatures: string[];
  predicates: ModelPredicate[];
  sigHierarchy: [string, string][];
}
export type ModelPredicate = {
  name: string;
  sigs: string[];
};
export const emptyModel = (): Model => ({
  signatures: [],
  predicates: [],
  sigHierarchy: [],
});
export const simpleModel = (): Model => ({
  signatures: ['Apple'],
  predicates: [
    { name: 'redder', sigs: ['Apple', 'Apple'] },
    { name: 'bigger', sigs: ['Apple', 'Apple'] },
    { name: 'isSweet', sigs: ['Apple'] },
  ],
  sigHierarchy: [],
});
