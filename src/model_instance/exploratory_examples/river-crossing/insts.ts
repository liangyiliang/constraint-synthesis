import { Instance } from '../../Instance';

const RiverCrossingInst0: Instance = {
  atoms: [
    { name: 'LeftFox', type: 'this/Object' },
    { name: 'LeftChicken', type: 'this/Object' },
    { name: 'LeftGrain', type: 'this/Object' },
    { name: 'LeftFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'left', args: ['LeftFox'] },
    { predicateName: 'left', args: ['LeftChicken'] },
    { predicateName: 'left', args: ['LeftGrain'] },
    { predicateName: 'left', args: ['LeftFarmer'] },
    { predicateName: 'eats', args: ['LeftFox', 'LeftChicken'] },
    { predicateName: 'eats', args: ['LeftChicken', 'LeftGrain'] },
  ],
};

const RiverCrossingInst1: Instance = {
  atoms: [
    { name: 'LeftFox', type: 'this/Object' },
    { name: 'RightChicken', type: 'this/Object' },
    { name: 'LeftGrain', type: 'this/Object' },
    { name: 'RightFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'left', args: ['LeftFox'] },
    { predicateName: 'right', args: ['RightChicken'] },
    { predicateName: 'left', args: ['LeftGrain'] },
    { predicateName: 'right', args: ['RightFarmer'] },
    { predicateName: 'eats', args: ['LeftFox', 'RightChicken'] },
    { predicateName: 'eats', args: ['RightChicken', 'LeftGrain'] },
  ],
};

// farmer goes back to the left
const RiverCrossingInst2: Instance = {
  atoms: [
    { name: 'LeftFox', type: 'this/Object' },
    { name: 'RightChicken', type: 'this/Object' },
    { name: 'LeftGrain', type: 'this/Object' },
    { name: 'LeftFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'left', args: ['LeftFox'] },
    { predicateName: 'right', args: ['RightChicken'] },
    { predicateName: 'left', args: ['LeftGrain'] },
    { predicateName: 'left', args: ['LeftFarmer'] },
    { predicateName: 'eats', args: ['LeftFox', 'RightChicken'] },
    { predicateName: 'eats', args: ['RightChicken', 'LeftGrain'] },
  ],
};

// farmer and grain both go to the right
const RiverCrossingInst3: Instance = {
  atoms: [
    { name: 'LeftFox', type: 'this/Object' },
    { name: 'RightChicken', type: 'this/Object' },
    { name: 'RightGrain', type: 'this/Object' },
    { name: 'RightFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'left', args: ['LeftFox'] },
    { predicateName: 'right', args: ['RightChicken'] },
    { predicateName: 'right', args: ['RightGrain'] },
    { predicateName: 'right', args: ['RightFarmer'] },
    { predicateName: 'eats', args: ['LeftFox', 'RightChicken'] },
    { predicateName: 'eats', args: ['RightChicken', 'RightGrain'] },
  ],
};

// farmer and chicken go back to the left
const RiverCrossingInst4: Instance = {
  atoms: [
    { name: 'LeftFox', type: 'this/Object' },
    { name: 'LeftChicken', type: 'this/Object' },
    { name: 'RightGrain', type: 'this/Object' },
    { name: 'LeftFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'left', args: ['LeftFox'] },
    { predicateName: 'left', args: ['LeftChicken'] },
    { predicateName: 'right', args: ['RightGrain'] },
    { predicateName: 'left', args: ['LeftFarmer'] },
    { predicateName: 'eats', args: ['LeftFox', 'LeftChicken'] },
    { predicateName: 'eats', args: ['LeftChicken', 'RightGrain'] },
  ],
};

// farmer and fox go to the right
const RiverCrossingInst5: Instance = {
  atoms: [
    { name: 'RightFox', type: 'this/Object' },
    { name: 'LeftChicken', type: 'this/Object' },
    { name: 'RightGrain', type: 'this/Object' },
    { name: 'RightFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'right', args: ['RightFox'] },
    { predicateName: 'left', args: ['LeftChicken'] },
    { predicateName: 'right', args: ['RightGrain'] },
    { predicateName: 'right', args: ['RightFarmer'] },
    { predicateName: 'eats', args: ['RightFox', 'LeftChicken'] },
    { predicateName: 'eats', args: ['LeftChicken', 'RightGrain'] },
  ],
};

// farmer and chicken go back to the left
const RiverCrossingInst6: Instance = {
  atoms: [
    { name: 'RightFox', type: 'this/Object' },
    { name: 'LeftChicken', type: 'this/Object' },
    { name: 'RightGrain', type: 'this/Object' },
    { name: 'LeftFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'right', args: ['RightFox'] },
    { predicateName: 'left', args: ['LeftChicken'] },
    { predicateName: 'right', args: ['RightGrain'] },
    { predicateName: 'left', args: ['LeftFarmer'] },
    { predicateName: 'eats', args: ['RightFox', 'LeftChicken'] },
    { predicateName: 'eats', args: ['LeftChicken', 'RightGrain'] },
  ],
};

// farmer and chicken go to the right again
const RiverCrossingInst7: Instance = {
  atoms: [
    { name: 'RightFox', type: 'this/Object' },
    { name: 'RightChicken', type: 'this/Object' },
    { name: 'RightGrain', type: 'this/Object' },
    { name: 'RightFarmer', type: 'this/Object' },
  ],
  predicates: [
    { predicateName: 'right', args: ['RightFox'] },
    { predicateName: 'right', args: ['RightChicken'] },
    { predicateName: 'right', args: ['RightGrain'] },
    { predicateName: 'right', args: ['RightFarmer'] },
    { predicateName: 'eats', args: ['RightFox', 'RightChicken'] },
    { predicateName: 'eats', args: ['RightChicken', 'RightGrain'] },
  ],
};

export const RiverCrossingInstances: Instance[] = [
  RiverCrossingInst0,
  RiverCrossingInst1,
  RiverCrossingInst2,
  RiverCrossingInst3,
  RiverCrossingInst4,
  RiverCrossingInst5,
  RiverCrossingInst6,
  RiverCrossingInst7,
];
