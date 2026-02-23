const configuration = {
  atoms: [
    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$1', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$2', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$0', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$1', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$2', type: 'this/TrackSegment' },
    { name: 'Train$0', type: 'this/Train' },
  ],
  predicates: [
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$0', 'One2TwoSegment$2'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$0', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$1', 'One2TwoSegment$0'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$1', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$2', 'Two2OneSegment$1'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$2', 'Two2OneSegment$2'],
    },
    {
      predicateName: 'nextSeg',
      args: ['Two2OneSegment$0', 'Two2OneSegment$1'],
    },
    {
      predicateName: 'nextSeg',
      args: ['Two2OneSegment$1', 'Two2OneSegment$2'],
    },
  ],
};

const step0 = {
  atoms: [...configuration.atoms],
  predicates: [
    ...configuration.predicates,
    {
      predicateName: 'position',
      args: [`Train$0`, 'One2TwoSegment$1'],
    },
  ],
};

const step1 = {
  atoms: [...configuration.atoms],
  predicates: [
    ...configuration.predicates,
    {
      predicateName: 'position',
      args: [`Train$0`, 'One2TwoSegment$0'],
    },
  ],
};

const step2 = {
  atoms: [...configuration.atoms],
  predicates: [
    ...configuration.predicates,
    {
      predicateName: 'position',
      args: [`Train$0`, 'One2TwoSegment$2'],
    },
  ],
};

const step3 = {
  atoms: [...configuration.atoms],
  predicates: [
    ...configuration.predicates,
    {
      predicateName: 'position',
      args: [`Train$0`, 'Two2OneSegment$2'],
    },
  ],
};

const step4 = {
  atoms: [...configuration.atoms],
  predicates: [
    ...configuration.predicates,
    {
      predicateName: 'position',
      args: [`Train$0`, 'Two2OneSegment$2'],
    },
  ],
};

export const TrainTrace = [step0, step1, step2, step3, step4];
