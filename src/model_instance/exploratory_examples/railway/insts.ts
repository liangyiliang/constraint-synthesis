const RailwayInst0 = {
  atoms: [
    { name: 'One2OneSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
  ],
  predicates: [
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$0', 'One2OneSegment$0'],
    },
  ],
};

const RailwayInst1 = {
  atoms: [
    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$1', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$0', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$1', type: 'this/TrackSegment' },
  ],
  predicates: [
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$0', 'One2TwoSegment$1'],
    },
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$1', 'Two2OneSegment$1'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$0', 'Two2OneSegment$1'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$1', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg',
      args: ['Two2OneSegment$1', 'Two2OneSegment$0'],
    },
  ],
};

const RailwayInst2 = {
  atoms: [
    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$1', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$2', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$3', type: 'this/TrackSegment' },
  ],
  predicates: [
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$3', 'One2TwoSegment$2'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$1', 'One2TwoSegment$3'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$2', 'One2TwoSegment$1'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$3', 'One2TwoSegment$0'],
    },
  ],
};

const RailwayInst3 = {
  atoms: [
    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$1', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$2', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$3', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$0', type: 'this/TrackSegment' },
  ],
  predicates: [
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$2', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$3', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$0', 'One2TwoSegment$3'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$1', 'One2TwoSegment$2'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$2', 'One2TwoSegment$0'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$3', 'One2TwoSegment$1'],
    },
  ],
};

const RailwayInst4 = {
  atoms: [
    { name: 'One2OneSegment$0', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$1', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$2', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$3', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$4', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$5', type: 'this/TrackSegment' },

    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$1', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$2', type: 'this/TrackSegment' },

    { name: 'Two2OneSegment$0', type: 'this/TrackSegment' },
  ],

  predicates: [
    {
      predicateName: 'nextSeg',
      args: ['One2OneSegment$1', 'One2OneSegment$5'],
    },
    {
      predicateName: 'nextSeg',
      args: ['One2OneSegment$2', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg',
      args: ['One2OneSegment$3', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg',
      args: ['One2OneSegment$4', 'One2TwoSegment$2'],
    },

    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$1', 'One2OneSegment$4'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$0', 'One2OneSegment$0'],
    },
  ],
};

const RailwayInst5 = {
  atoms: [
    { name: 'One2OneSegment$0', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$1', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$2', type: 'this/TrackSegment' },
    { name: 'One2OneSegment$3', type: 'this/TrackSegment' },

    { name: 'One2TwoSegment$0', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$1', type: 'this/TrackSegment' },
    { name: 'One2TwoSegment$2', type: 'this/TrackSegment' },

    { name: 'Two2OneSegment$0', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$1', type: 'this/TrackSegment' },
    { name: 'Two2OneSegment$2', type: 'this/TrackSegment' },
  ],

  predicates: [
    {
      predicateName: 'nextSeg',
      args: ['One2OneSegment$0', 'One2TwoSegment$1'],
    },
    {
      predicateName: 'nextSeg',
      args: ['One2OneSegment$1', 'One2OneSegment$2'],
    },

    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$0', 'Two2OneSegment$0'],
    },
    {
      predicateName: 'nextSeg1',
      args: ['One2TwoSegment$2', 'One2OneSegment$1'],
    },

    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$0', 'Two2OneSegment$1'],
    },
    {
      predicateName: 'nextSeg2',
      args: ['One2TwoSegment$1', 'Two2OneSegment$0'],
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
    {
      predicateName: 'nextSeg',
      args: ['Two2OneSegment$2', 'One2OneSegment$3'],
    },
  ],
};

export const RailwayInsts = [
  RailwayInst0,
  RailwayInst1,
  RailwayInst2,
  RailwayInst3,
  RailwayInst4,
  RailwayInst5,
];
