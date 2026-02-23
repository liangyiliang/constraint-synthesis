export const RailwayModel = {
  signatures: ['this/TrackSegment', 'this/Train'],
  predicates: [
    { name: 'nextSeg', sigs: ['this/TrackSegment', 'this/TrackSegment'] },
    { name: 'nextSeg1', sigs: ['this/TrackSegment', 'this/TrackSegment'] },
    { name: 'nextSeg2', sigs: ['this/TrackSegment', 'this/TrackSegment'] },
    { name: 'position', sigs: ['this/Train', 'this/TrackSegment'] },
  ],
  sigHierarchy: [],
};
