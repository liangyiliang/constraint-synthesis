import { Instance } from '../model_instance/Instance';
import { Model } from '../model_instance/Model';

export const RailwayModel = (): Model => ({
  signatures: ['Segment', 'Track', 'Transponder'],
  predicates: [
    { name: 'NextSegment', sigs: ['Segment', 'Segment'] },
    { name: 'TrackSegment', sigs: ['Track', 'Segment'] },
    { name: 'TransponderOnSegment', sigs: ['Transponder', 'Segment'] },
  ],
  sigHierarchy: [],
});

export const RailwayInstance = (): Instance => ({
  atoms: [
    { name: 't1', type: 'Track' },
    { name: 't2', type: 'Track' },
    { name: 's1', type: 'Segment' },
    { name: 's2', type: 'Segment' },
    { name: 's3', type: 'Segment' },
    { name: 's4', type: 'Segment' },
    { name: 's5', type: 'Segment' },
    { name: 'tp1', type: 'Transponder' },
    { name: 'tp2', type: 'Transponder' },
    { name: 'tp3', type: 'Transponder' },
  ],
  predicates: [
    { predicateName: 'TrackSegment', args: ['t1', 's1'] },
    { predicateName: 'TrackSegment', args: ['t1', 's2'] },
    { predicateName: 'TrackSegment', args: ['t1', 's3'] },
    { predicateName: 'TrackSegment', args: ['t2', 's4'] },
    { predicateName: 'TrackSegment', args: ['t2', 's5'] },
    { predicateName: 'NextSegment', args: ['s1', 's2'] },
    { predicateName: 'NextSegment', args: ['s2', 's3'] },
    { predicateName: 'NextSegment', args: ['s4', 's5'] },
    { predicateName: 'TransponderOnSegment', args: ['tp1', 's1'] },
    { predicateName: 'TransponderOnSegment', args: ['tp2', 's3'] },
    { predicateName: 'TransponderOnSegment', args: ['tp3', 's4'] },
  ],
});
