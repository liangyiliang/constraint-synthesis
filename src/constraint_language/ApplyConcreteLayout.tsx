import { DiagramBuilder } from '@penrose/bloom';
import * as bloom from '@penrose/bloom';
import {
  BinaryLayoutOption,
  ConcreteLayout,
  SeparationOption,
  UnaryLayout,
  UnaryLayoutOption,
  UnboundAtom,
} from './ConcreteLayout';
import { InstanceDiagramBuilder } from '../diagram/InstanceDiagramBuilder';

export const applyConcreteLayout = (
  db: InstanceDiagramBuilder,
  concreteLayout: ConcreteLayout<UnboundAtom>
) => {
  if (concreteLayout.tag === 'UnaryLayout') {
    const { option, separation, op } = concreteLayout;
    unaryLayoutAppliers[option](db, separation, op);
    return;
  } else if (concreteLayout.tag === 'BinaryLayout') {
    const { option, separation, op0, op1 } = concreteLayout;
    binaryLayoutAppliers[option](db, separation, op0, op1);
    return;
  } else if (concreteLayout.tag === 'CyclicLayout') {
    throw new Error('CyclicLayout is not implemented yet');
  } else if (concreteLayout.tag === 'GroupingLayout') {
    throw new Error('GroupingLayout is not implemented yet');
  }
  concreteLayout satisfies never; // Ensure exhaustive checking
};

const getShape = (db: InstanceDiagramBuilder, op: UnboundAtom) => {
  const { atomSubstanceMap } = db;
  const atomName = op.name;
  const bloomShape: bloom.Circle = atomSubstanceMap.get(atomName)?.icon;
  if (bloomShape === undefined) {
    throw new Error(`Shape for atom ${atomName} not found in atomSubstanceMap`);
  }
  return bloomShape;
};

const unaryLayoutAppliers: Record<
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

const binaryLayoutAppliers: Record<
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
            bloom.abs(bloom.sub(bloomShape0.center[1], bloomShape1.center[1])),
            sep.distance
          )
        : bloom.constraints.equal(
            bloom.abs(bloom.sub(bloomShape0.center[1], bloomShape1.center[1])),
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
            bloom.abs(bloom.sub(bloomShape0.center[0], bloomShape1.center[0])),
            sep.distance
          )
        : bloom.constraints.equal(
            bloom.abs(bloom.sub(bloomShape0.center[0], bloomShape1.center[0])),
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
    binaryLayoutAppliers.LeftOf(db, sep, op0, op1);
    binaryLayoutAppliers.HorizontallyAligned(db, sep, op0, op1);
  },
  DirectlyRightOf: (
    db: InstanceDiagramBuilder,
    sep: SeparationOption,
    op0: UnboundAtom,
    op1: UnboundAtom
  ) => {
    binaryLayoutAppliers.RightOf(db, sep, op0, op1);
    binaryLayoutAppliers.HorizontallyAligned(db, sep, op0, op1);
  },
  DirectlyAbove: (
    db: InstanceDiagramBuilder,
    sep: SeparationOption,
    op0: UnboundAtom,
    op1: UnboundAtom
  ) => {
    binaryLayoutAppliers.Above(db, sep, op0, op1);
    binaryLayoutAppliers.VerticallyAligned(db, sep, op0, op1);
  },
  DirectlyBelow: (
    db: InstanceDiagramBuilder,
    sep: SeparationOption,
    op0: UnboundAtom,
    op1: UnboundAtom
  ) => {
    binaryLayoutAppliers.Below(db, sep, op0, op1);
    binaryLayoutAppliers.VerticallyAligned(db, sep, op0, op1);
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
