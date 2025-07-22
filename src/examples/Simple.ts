import { Instance } from '../model_instance/Instance';
import { Model } from '../model_instance/Model';
import * as bloom from '@penrose/bloom';
export const SimpleModel = (): Model => ({
  signatures: ['Apple'],
  predicates: [{ name: 'redder', sigs: ['Apple', 'Apple'] }],
  sigHierarchy: [],
});

export const SimpleInstance = (): Instance => ({
  atoms: [
    { name: 'a0', type: 'Apple' },
    { name: 'a1', type: 'Apple' },
    { name: 'a2', type: 'Apple' },
  ],
  predicates: [
    { predicateName: 'redder', args: ['a0', 'a1'] },
    { predicateName: 'redder', args: ['a1', 'a2'] },
  ],
});

export const SimplePalette =
  (): ((name: string) => bloom.Color) => (name: string) => {
    switch (name) {
      case 'redder':
        return bloom.rgba(1, 0, 0, 1); // red
      default:
        return bloom.rgba(0, 0, 0, 1); // black
    }
  };
