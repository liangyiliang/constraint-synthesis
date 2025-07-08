import { DiagramBuilder } from '@penrose/bloom';
import * as bloom from '@penrose/bloom';
import {
  BinaryLayout,
  BinaryLayoutOption,
  ConcreteLayout,
  CyclicLayout,
  SeparationOption,
  UnaryLayout,
  UnaryLayoutOption,
  UnboundAtom,
} from './ConcreteLayout';
import { InstanceDiagramBuilder } from '../diagram/InstanceDiagramBuilder';
import * as graphlib from '@dagrejs/graphlib';

export class ConcreteLayoutApplier {
  private db: InstanceDiagramBuilder;
  private binaryLayouts: BinaryLayout<UnboundAtom>[];
  private unaryLayout: UnaryLayout<UnboundAtom>[];
  private cycleGraphs: Map<string, graphlib.Graph>;

  constructor(db: InstanceDiagramBuilder) {
    this.db = db;
    this.binaryLayouts = [];
    this.unaryLayout = [];
    this.cycleGraphs = new Map();
  }

  stageConcreteLayout(l: ConcreteLayout<UnboundAtom>): void {
    if (l.tag === 'BinaryLayout') {
      this.binaryLayouts.push(l);
    } else if (l.tag === 'UnaryLayout') {
      this.unaryLayout.push(l);
    } else if (l.tag === 'CyclicLayout') {
      this.stageCyclicLayout(l);
    } else if (l.tag === 'GroupingLayout') {
      throw new Error('GroupingLayout is not yet implemented');
    }
  }

  private stageCyclicLayout(l: CyclicLayout<UnboundAtom>): void {
    const { cycleId, option, op0, op1 } = l;

    let existingGraph = this.cycleGraphs.get(cycleId);
    if (existingGraph === undefined) {
      existingGraph = new graphlib.Graph({ directed: true });
      this.cycleGraphs.set(cycleId, existingGraph);
    }

    existingGraph.setNode(op0.name);
    existingGraph.setNode(op1.name);

    if (option === 'Counterclockwise') {
      existingGraph.setEdge(op0.name, op1.name);
    } else {
      existingGraph.setEdge(op1.name, op0.name);
    }
  }

  applyStagedLayouts(): void {
    for (const layout of this.binaryLayouts) {
      this.binaryLayoutAppliers[layout.option](
        this.db,
        layout.separation,
        layout.op0,
        layout.op1
      );
    }
    for (const layout of this.unaryLayout) {
      this.unaryLayoutAppliers[layout.option](
        this.db,
        layout.separation,
        layout.op
      );
    }

    for (const [cycleId, graph] of this.cycleGraphs) {
      this.applyCyclicLayout(this.db, cycleId, graph);
    }
  }

  private unaryLayoutAppliers: Record<
    UnaryLayoutOption,
    (db: InstanceDiagramBuilder, sep: SeparationOption, op: UnboundAtom) => void
  > = {
    AboveCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(shapeCenter[1], 0)
          : sep.tag === 'AtLeast'
          ? bloom.constraints.greaterThan(shapeCenter[1], sep.distance)
          : bloom.constraints.equal(shapeCenter[1], sep.distance);
      ensure(constraint);
    },
    BelowCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(shapeCenter[1], 0)
          : sep.tag === 'AtLeast'
          ? bloom.constraints.lessThan(shapeCenter[1], -sep.distance)
          : bloom.constraints.equal(shapeCenter[1], -sep.distance);
      ensure(constraint);
    },
    LeftOfCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(shapeCenter[0], 0)
          : sep.tag === 'AtLeast'
          ? bloom.constraints.lessThan(shapeCenter[0], -sep.distance)
          : bloom.constraints.equal(shapeCenter[0], -sep.distance);
      ensure(constraint);
    },
    RightOfCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(shapeCenter[0], 0)
          : sep.tag === 'AtLeast'
          ? bloom.constraints.greaterThan(shapeCenter[0], sep.distance)
          : bloom.constraints.equal(shapeCenter[0], sep.distance);
      ensure(constraint);
    },
  };

  private binaryLayoutAppliers: Record<
    BinaryLayoutOption,
    (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => void
  > = {
    LeftOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(
              bloomShape0.center[0],
              bloomShape1.center[0]
            )
          : sep.tag === 'AtLeast'
          ? bloom.constraints.lessThan(
              bloomShape0.center[0],
              bloom.sub(bloomShape1.center[0], sep.distance)
            )
          : bloom.constraints.equal(
              bloomShape0.center[0],
              bloom.sub(bloomShape1.center[0], sep.distance)
            );
      ensure(constraint);
    },
    RightOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(
              bloomShape0.center[0],
              bloomShape1.center[0]
            )
          : sep.tag === 'AtLeast'
          ? bloom.constraints.greaterThan(
              bloomShape0.center[0],
              bloom.add(bloomShape1.center[0], sep.distance)
            )
          : bloom.constraints.equal(
              bloomShape0.center[0],
              bloom.add(bloomShape1.center[0], sep.distance)
            );
      ensure(constraint);
    },
    Above: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(
              bloomShape0.center[1],
              bloomShape1.center[1]
            )
          : sep.tag === 'AtLeast'
          ? bloom.constraints.greaterThan(
              bloomShape0.center[1],
              bloom.add(bloomShape1.center[1], sep.distance)
            )
          : bloom.constraints.equal(
              bloomShape0.center[1],
              bloom.add(bloomShape1.center[1], sep.distance)
            );
      ensure(constraint);
    },
    Below: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(
              bloomShape0.center[1],
              bloomShape1.center[1]
            )
          : sep.tag === 'AtLeast'
          ? bloom.constraints.lessThan(
              bloomShape0.center[1],
              bloom.sub(bloomShape1.center[1], sep.distance)
            )
          : bloom.constraints.equal(
              bloomShape0.center[1],
              bloom.sub(bloomShape1.center[1], sep.distance)
            );
      ensure(constraint);
    },
    VerticallyAligned: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);

      ensure(
        bloom.constraints.equal(bloomShape0.center[0], bloomShape1.center[0])
      );

      const separationConstraint =
        sep.tag === 'NoneSpecified'
          ? 0
          : sep.tag === 'AtLeast'
          ? bloom.constraints.greaterThan(
              bloom.abs(
                bloom.sub(bloomShape0.center[1], bloomShape1.center[1])
              ),
              sep.distance
            )
          : bloom.constraints.equal(
              bloom.abs(
                bloom.sub(bloomShape0.center[1], bloomShape1.center[1])
              ),
              sep.distance
            );
      ensure(separationConstraint);
    },
    HorizontallyAligned: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const { ensure } = db.getBloomBuilder();
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);

      ensure(
        bloom.constraints.equal(bloomShape0.center[1], bloomShape1.center[1])
      );

      const separationConstraint =
        sep.tag === 'NoneSpecified'
          ? 0
          : sep.tag === 'AtLeast'
          ? bloom.constraints.greaterThan(
              bloom.abs(
                bloom.sub(bloomShape0.center[0], bloomShape1.center[0])
              ),
              sep.distance
            )
          : bloom.constraints.equal(
              bloom.abs(
                bloom.sub(bloomShape0.center[0], bloomShape1.center[0])
              ),
              sep.distance
            );
      ensure(separationConstraint);
    },
    DirectlyLeftOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      this.binaryLayoutAppliers.LeftOf(db, sep, op0, op1);
      this.binaryLayoutAppliers.HorizontallyAligned(db, sep, op0, op1);
    },
    DirectlyRightOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      this.binaryLayoutAppliers.RightOf(db, sep, op0, op1);
      this.binaryLayoutAppliers.HorizontallyAligned(db, sep, op0, op1);
    },
    DirectlyAbove: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      this.binaryLayoutAppliers.Above(db, sep, op0, op1);
      this.binaryLayoutAppliers.VerticallyAligned(db, sep, op0, op1);
    },
    DirectlyBelow: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      this.binaryLayoutAppliers.Below(db, sep, op0, op1);
      this.binaryLayoutAppliers.VerticallyAligned(db, sep, op0, op1);
    },
    OutsideRingOf: () => {
      throw new Error('OutsideRingOf layout not implemented');
    },
    InsideRingOf: () => {
      throw new Error('InsideRingOf layout not implemented');
    },
    Contains: () => {
      throw new Error('Contains layout not implemented');
    },
  };

  private checkSingleRingOrLine(graph: graphlib.Graph): string {
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
  }

  private applyCyclicLayout(
    db: InstanceDiagramBuilder,
    cycleId: string,
    graph: graphlib.Graph
  ): void {
    const graphType = this.checkSingleRingOrLine(graph);

    if (graphType === 'none') {
      throw new Error(
        'The supposed `cycle` is not a single ring or line: ' + cycleId
      );
    }

    if (graphType === 'ring') {
      // break the ring by removing one edge
      // This allows topsort to work
      const n0 = graph.nodes()[0];
      const n1 = graph.successors(n0)![0];
      graph.removeEdge(n0, n1);
    }

    const cyclableNodes = graphlib.alg.topsort(graph);
    console.log(cyclableNodes);
    this.layoutNodesInCircle(db, cyclableNodes);
  }

  private layoutNodesInCircle(
    db: InstanceDiagramBuilder,
    nodes: string[]
  ): void {
    const shapes = nodes.map(node =>
      getShape(db, { tag: 'UnboundAtom', name: node })
    );

    const bloomBuilder = db.getBloomBuilder();
    const { circle, ensure, encourage, layer, input } = bloomBuilder;

    const makeInput = (init?: number) => input({ optimized: true, init });

    const refCenter: bloom.Vec2 = [makeInput(), makeInput()];
    const refRadius = makeInput();
    const refCircle = circle({
      center: refCenter,
      r: refRadius,
      strokeColor: bloom.rgba(0, 0, 0, 1),
      strokeWidth: 1,
      fillColor: bloom.none(),
      drag: true,
    });

    for (const s of shapes) {
      layer(refCircle, s);
    }

    const offset = makeInput();

    for (let i = 0; i < shapes.length; i++) {
      const desiredAngle = bloom.add(2 * Math.PI * (i / shapes.length), offset);

      const currentAngle = bloom.atan2(
        bloom.sub(shapes[i].center[0], refCenter[0]),
        bloom.sub(shapes[i].center[1], refCenter[1])
      );

      const currentRadius = bloom.vdist(refCenter, shapes[i].center);
      ensure(
        bloom.constraints.equal(
          bloom.sin(currentAngle),
          bloom.sin(desiredAngle)
        )
      );
      ensure(
        bloom.constraints.equal(
          bloom.cos(currentAngle),
          bloom.cos(desiredAngle)
        )
      );
      ensure(bloom.constraints.equal(currentRadius, refRadius));
    }
  }
}

const getShape = (db: InstanceDiagramBuilder, op: UnboundAtom) => {
  const { atomSubstanceMap } = db;
  const atomName = op.name;
  const bloomShape: bloom.Circle = atomSubstanceMap.get(atomName)?.icon;
  if (bloomShape === undefined) {
    throw new Error(`Shape for atom ${atomName} not found in atomSubstanceMap`);
  }
  return bloomShape;
};
