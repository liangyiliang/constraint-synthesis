import * as graphlib from '@dagrejs/graphlib';
import { greaterThan } from './ConfidenceScore';
import {
  BoundAtom,
  CyclicLayout,
  UnboundAtom,
} from '../../../constraint_language/concrete/ConcreteLayout';
import { AbstractDiagram, Pos } from '../inputs/Inputs';
import {
  AbstractLayoutSubst,
  applySubstitution,
} from '../../../constraint_language/abstract/AbstractLayoutSemantics';
import {
  InstancedCycleFootprint,
  toInstancedCycleFootprint,
} from '../footprints/CycleFootprint';

// (substs, concrete) represents a single clause on a single diagram
export const checkCyclicLayout = (
  substs: AbstractLayoutSubst[],
  concrete: CyclicLayout<BoundAtom>,
  diagram: AbstractDiagram,
  clauseId: number,
  instanceId: number
): {
  score: number;
  footprints: InstancedCycleFootprint[];
} => {
  // The clause doesn't even apply to this diagram,
  // so we consider it vacuously satisfied and give it confidence 1
  // (and no footprint since it doesn't actually apply)
  if (substs.length === 0) {
    return { score: 1, footprints: [] };
  }

  const cycleLayouts: CyclicLayout<UnboundAtom>[] = substs.map(subst =>
    applySubstitution(
      concrete,
      subst,
      `clause-${clauseId}-instance-${instanceId}`
    )
  );

  // check that the "option" field of cycleLayouts are pairwise consistent, i.e. all clockwise or all counterclockwise
  const allClockwise = cycleLayouts.every(
    layout => layout.option === 'Clockwise'
  );
  const allCounterclockwise = cycleLayouts.every(
    layout => layout.option === 'Counterclockwise'
  );

  if (!allClockwise && !allCounterclockwise) {
    throw new Error(
      'Inconsistent cyclic layout options when computing confidence of cyclic layout'
    );
  }

  const option = allClockwise ? 'Clockwise' : 'Counterclockwise';

  const cycleGraph = new graphlib.Graph({ directed: true });
  for (const concrete of cycleLayouts) {
    const { op0, op1 } = concrete;
    cycleGraph.setNode(op0.name);
    cycleGraph.setNode(op1.name);
    cycleGraph.setEdge(op0.name, op1.name);
  }
  const graphType = checkSingleRingOrLine(cycleGraph);
  if (graphType === 'none') {
    return { score: 0, footprints: [] }; // not a valid cyclic layout, so confidence is 0
  }

  if (graphType === 'ring') {
    // break the ring by removing one edge
    // this allows topsort to work
    const n0 = cycleGraph.nodes()[0];
    const n1 = cycleGraph.successors(n0)![0];
    cycleGraph.removeEdge(n0, n1);
  }

  const cyclableNodes = graphlib.alg.topsort(cycleGraph);

  const score = confidenceOfCyclicLayoutHelper(cyclableNodes, diagram, option);

  const footprint = toInstancedCycleFootprint(
    cyclableNodes,
    option,
    instanceId
  );
  // console.log('Footprint:');
  // console.log(footprint);

  return {
    score: score === undefined ? 1 : score,
    footprints: score === undefined ? [] : [footprint],
  };
};

const checkSingleRingOrLine = (graph: graphlib.Graph) => {
  const nodes = graph.nodes();
  let inOneComponent = true;
  // Check weak connectivity (for line) or strong connectivity (for ring)
  if (graphlib.alg.components(graph).length !== 1) {
    inOneComponent = false;
  }

  // Count in/out degrees
  let inOnes = 0,
    outOnes = 0,
    inZeros = 0,
    outZeros = 0,
    allOnes = true;
  for (const node of nodes) {
    const inDeg = graph.inEdges(node)!.length;
    const outDeg = graph.outEdges(node)!.length;
    // if (inDeg === 1 && outDeg === 1) continue;
    if (inDeg !== 1 || outDeg !== 1) allOnes = false;
    if (inDeg === 0) inZeros++;
    if (outDeg === 0) outZeros++;
    if (inDeg === 1) inOnes++;
    if (outDeg === 1) outOnes++;
  }

  // Check for ring
  if (allOnes && inOneComponent) {
    return 'ring';
  }
  // Check for line: exactly one node with in-degree 0 (start), one with out-degree 0 (end), rest have in/out degree 1
  if (
    inZeros === 1 &&
    outZeros === 1 &&
    inOnes - 1 + (outOnes - 1) === (nodes.length - 2) * 2 &&
    inOneComponent
  ) {
    return 'line';
  }
  return 'none';
};

const confidenceOfCyclicLayoutHelper = (
  nodes: string[],
  poss: AbstractDiagram,
  option: 'Clockwise' | 'Counterclockwise'
): number | undefined => {
  const points: Pos[] = nodes.map(n => poss[n]);
  const n = points.length;

  if (n < 3) {
    return undefined;
  }

  const dist = (pos0: Pos, pos1: Pos) => {
    const dx = pos0.x - pos1.x;
    const dy = pos0.y - pos1.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const sumCenter = points.reduce(
    (acc, p) => ({ x: acc.x + p.x, y: acc.y + p.y }),
    { x: 0, y: 0 }
  );
  const avgCenter = { x: sumCenter.x / n, y: sumCenter.y / n };

  const distancesToCenter = points.map(p => dist(p, avgCenter));
  const minDistToCenter = Math.min(...distancesToCenter);
  const maxDistToCenter = Math.max(...distancesToCenter);
  const avgDistToCenter = distancesToCenter.reduce((a, b) => a + b, 0) / n;
  console.log('minDistToCenter', minDistToCenter);
  console.log('maxDistToCenter', maxDistToCenter);
  console.log('avgDistToCenter', avgDistToCenter);

  const bigEnoughCycle = greaterThan(minDistToCenter, 50);
  // Deviation from a perfect circle should be small
  // all points should be roughly equidistant from the center
  const equidistantFromCenter = greaterThan(
    minDistToCenter,
    0.7 * maxDistToCenter
  );

  // Needs to be a simple polygon
  const cross = (o: Pos, a: Pos, b: Pos): number =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const orient = (a: Pos, b: Pos, c: Pos): number => cross(a, b, c);

  const segmentsIntersect = (p1: Pos, q1: Pos, p2: Pos, q2: Pos): boolean => {
    const o1 = orient(p1, q1, p2);
    const o2 = orient(p1, q1, q2);
    const o3 = orient(p2, q2, p1);
    const o4 = orient(p2, q2, q1);

    return o1 * o2 < 0 && o3 * o4 < 0;
  };

  // intersection check (cycle validity)

  let noIntersection = 1;
  const edges: Array<[Pos, Pos]> = [];
  for (let i = 0; i < n; i++) {
    edges.push([points[i], points[(i + 1) % n]]);
  }

  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      // skip adjacent edges
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;

      if (
        segmentsIntersect(edges[i][0], edges[i][1], edges[j][0], edges[j][1])
      ) {
        noIntersection = 0; // violates "cycle" spec
      }
    }
  }

  // signed area (global orientation)

  let A = 0;
  for (let i = 0; i < n; i++) {
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    A += p1.x * p2.y - p2.x * p1.y;
  }
  A *= 0.5;

  const expectedSign = option === 'Counterclockwise' ? 1 : -1;

  // smooth orientation confidence
  const goodOrientation = greaterThan(expectedSign * A, 0);

  console.log('bigEnoughCycle', bigEnoughCycle);
  console.log('equidistantFromCenter', equidistantFromCenter);
  console.log('noIntersection', noIntersection);
  console.log('goodOrientation', goodOrientation);

  const totalScore =
    bigEnoughCycle * equidistantFromCenter * noIntersection * goodOrientation;

  // console.log('confidence score of cyclic layout:', totalScore);
  return totalScore;
};
