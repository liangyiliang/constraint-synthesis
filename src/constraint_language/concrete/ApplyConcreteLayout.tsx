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
import { InstanceDiagramBuilder } from '../../diagram/InstanceDiagramBuilder';
import * as graphlib from '@dagrejs/graphlib';
import { Var } from '../../components/Diagram';
import { Num } from '@penrose/core';

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

  applyStagedLayouts(constraintEnforcement: Var): void {
    const { ensure } = this.db.getBloomBuilder();

    for (const [cycleId, graph] of this.cycleGraphs) {
      this.applyCyclicLayout(this.db, cycleId, graph, constraintEnforcement);
    }

    for (const layout of this.binaryLayouts) {
      const constraints = this.binaryLayoutConstraints[layout.option](
        this.db,
        layout.separation,
        layout.op0,
        layout.op1
      );
      for (const constraint of constraints) {
        ensure(bloom.mul(constraint, constraintEnforcement));
      }
    }
    for (const layout of this.unaryLayout) {
      const constraints = this.unaryLayoutConstraints[layout.option](
        this.db,
        layout.separation,
        layout.op
      );
      for (const constraint of constraints) {
        ensure(bloom.mul(constraint, constraintEnforcement));
      }
    }
  }

  private unaryLayoutConstraints: Record<
    UnaryLayoutOption,
    (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => Num[]
  > = {
    AboveCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(shapeCenter[1], 0)
          : sep.tag === 'AtLeast'
            ? bloom.constraints.greaterThan(shapeCenter[1], sep.distance)
            : bloom.constraints.equal(shapeCenter[1], sep.distance);
      return [constraint];
    },
    BelowCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(shapeCenter[1], 0)
          : sep.tag === 'AtLeast'
            ? bloom.constraints.lessThan(shapeCenter[1], -sep.distance)
            : bloom.constraints.equal(shapeCenter[1], -sep.distance);
      return [constraint];
    },
    LeftOfCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(shapeCenter[0], 0)
          : sep.tag === 'AtLeast'
            ? bloom.constraints.lessThan(shapeCenter[0], -sep.distance)
            : bloom.constraints.equal(shapeCenter[0], -sep.distance);
      return [constraint];
    },
    RightOfCenter: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op: UnboundAtom
    ) => {
      const bloomShape = getShape(db, op);
      const shapeCenter = bloomShape.center;
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(shapeCenter[0], 0)
          : sep.tag === 'AtLeast'
            ? bloom.constraints.greaterThan(shapeCenter[0], sep.distance)
            : bloom.constraints.equal(shapeCenter[0], sep.distance);
      return [constraint];
    },
  };

  private binaryLayoutConstraints: Record<
    BinaryLayoutOption,
    (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => Num[]
  > = {
    LeftOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(
              bloomShape0.center[0],
              bloom.sub(bloomShape1.center[0], 50)
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
      return [constraint];
    },
    RightOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(
              bloomShape0.center[0],
              bloom.add(bloomShape1.center[0], 50)
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
      return [constraint];
    },
    Above: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.greaterThan(
              bloomShape0.center[1],
              bloom.add(bloomShape1.center[1], 50)
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
      return [constraint];
    },
    Below: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);
      const constraint =
        sep.tag === 'NoneSpecified'
          ? bloom.constraints.lessThan(
              bloomShape0.center[1],
              bloom.sub(bloomShape1.center[1], 50)
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
      return [constraint];
    },
    VerticallyAligned: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);

      const alignmentConstraint = bloom.constraints.equal(
        bloomShape0.center[0],
        bloomShape1.center[0]
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
      return [alignmentConstraint, separationConstraint];
    },

    HorizontallyAligned: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      const bloomShape0 = getShape(db, op0);
      const bloomShape1 = getShape(db, op1);

      const alignmentConstraint = bloom.constraints.equal(
        bloomShape0.center[1],
        bloomShape1.center[1]
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
      return [alignmentConstraint, separationConstraint];
    },
    DirectlyLeftOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      return [
        ...this.binaryLayoutConstraints.LeftOf(db, sep, op0, op1),
        ...this.binaryLayoutConstraints.HorizontallyAligned(db, sep, op0, op1),
      ];
    },
    DirectlyRightOf: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      return [
        ...this.binaryLayoutConstraints.RightOf(db, sep, op0, op1),
        ...this.binaryLayoutConstraints.HorizontallyAligned(db, sep, op0, op1),
      ];
    },
    DirectlyAbove: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      return [
        ...this.binaryLayoutConstraints.Above(db, sep, op0, op1),
        ...this.binaryLayoutConstraints.VerticallyAligned(db, sep, op0, op1),
      ];
    },
    DirectlyBelow: (
      db: InstanceDiagramBuilder,
      sep: SeparationOption,
      op0: UnboundAtom,
      op1: UnboundAtom
    ) => {
      return [
        ...this.binaryLayoutConstraints.Below(db, sep, op0, op1),
        ...this.binaryLayoutConstraints.VerticallyAligned(db, sep, op0, op1),
      ];
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
    graph: graphlib.Graph,
    constraintEnforcement: Var
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

    if (cyclableNodes.length >= 3) {
      this.layoutNodesInCircle(db, cyclableNodes, constraintEnforcement);
    }
  }

  private layoutNodesInCircle(
    db: InstanceDiagramBuilder,
    nodes: string[],
    constraintEnforcement: Var
  ): void {
    const shapes = nodes.map(node =>
      getShape(db, { tag: 'UnboundAtom', name: node })
    );

    const bloomBuilder = db.getBloomBuilder();
    const { circle, layer, input, encourage, ensure } = bloomBuilder;

    const makeInput = (init?: number) => input({ optimized: true, init });

    const refCenter: bloom.Vec2 = [makeInput(), makeInput()];
    const refRadius = bloom.mul(makeInput(), constraintEnforcement);
    const refCircle = circle({
      center: refCenter,
      r: refRadius,
      strokeColor: bloom.rgba(0, 0, 0, 0.2),
      strokeStyle: 'dashed',
      strokeWidth: 1,
      fillColor: bloom.none(),
      drag: true,
    });

    ensure(
      bloom.mul(
        bloom.constraints.greaterThan(refRadius, 100),
        constraintEnforcement
      )
    );

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

      // encourage(
      //   bloom.mul(
      //     bloom.objectives.equal(currentAngle, desiredAngle),
      //     constraintEnforcement
      //   )
      // );
      encourage(
        bloom.mul(
          bloom.objectives.equal(
            bloom.sin(currentAngle),
            bloom.sin(desiredAngle)
          ),
          constraintEnforcement
        )
      );
      encourage(
        bloom.mul(
          bloom.objectives.equal(
            bloom.cos(currentAngle),
            bloom.cos(desiredAngle)
          ),
          constraintEnforcement
        )
      );
      encourage(
        bloom.mul(
          bloom.objectives.equal(currentRadius, refRadius),
          constraintEnforcement
        )
      );
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
