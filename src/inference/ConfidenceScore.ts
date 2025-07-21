import { log } from '@penrose/bloom';
import { AbstractLayout } from '../constraint_language/abstract/AbstractLayout';
import { compileAbstractLayouts } from '../constraint_language/abstract/ApplyAbstractLayout';
import {
  BinaryLayoutOption,
  ConcreteLayout,
  UnboundAtom,
} from '../constraint_language/concrete/ConcreteLayout';
import { Instance } from '../model_instance/Instance';
import { Model } from '../model_instance/Model';

type Pos = {
  x: number;
  y: number;
};

export type AbstractDiagram = Record<string, Pos>;

const sigmoid = (x: number) => {
  return 1 / (1 + Math.exp(-x));
};

/**
 * inflection point at OFFSET
 * SCALE is the steepness of the curve -- larger = steeper
 * FLIP is a boolean that flips the curve around the x-axis
 */
const modifiedSigmoid = (
  x: number,
  offset: number,
  scale: number,
  flip: boolean
) => {
  let intermediate = scale * (x - offset);
  if (flip) intermediate = -intermediate;
  return sigmoid(intermediate);
};

const unnormalizedGaussian = (x: number, mean: number, variance: number) => {
  return Math.exp((-(x - mean) * (x - mean)) / (2 * variance));
};

const binaryConcreteConfidenceFn: Record<
  BinaryLayoutOption,
  (pos0: Pos, pos1: Pos) => number
> = {
  LeftOf: (pos0, pos1) => {
    // 0 is to the left of 1
    const { x: x0, y: y0 } = pos0;
    const { x: x1, y: y1 } = pos1;
    const diff = x0 - x1;
    // diff < 0 => x0 - x1 < 0 => x0 < x1 => good
    return modifiedSigmoid(diff, -50, 0.1, true);
  },
  RightOf: (pos0, pos1) => {
    // 0 is to the right of 1
    const { x: x0, y: y0 } = pos0;
    const { x: x1, y: y1 } = pos1;
    const diff = x0 - x1;
    // diff > 0 => x0 - x1 > 0 => x0 > x1 => good
    return modifiedSigmoid(diff, 50, 0.1, false);
  },
  Above: (pos0, pos1) => {
    // 0 is above 1
    const { x: x0, y: y0 } = pos0;
    const { x: x1, y: y1 } = pos1;
    const diff = y0 - y1;
    // diff > 0 => y0 - y1 > 0 => y0 > y1 => good
    return modifiedSigmoid(diff, 25, 0.1, false);
  },
  Below: (pos0, pos1) => {
    // 0 is below 1
    const { x: x0, y: y0 } = pos0;
    const { x: x1, y: y1 } = pos1;
    const diff = y0 - y1;
    // diff < 0 => y0 - y1 < 0 => y0 < y1 => good
    return modifiedSigmoid(diff, -25, 0.1, true);
  },
  DirectlyLeftOf: (pos0, pos1) => {
    return (
      binaryConcreteConfidenceFn.LeftOf(pos0, pos1) *
      binaryConcreteConfidenceFn.HorizontallyAligned(pos0, pos1)
    );
  },
  DirectlyRightOf: (pos0, pos1) => {
    return (
      binaryConcreteConfidenceFn.RightOf(pos0, pos1) *
      binaryConcreteConfidenceFn.HorizontallyAligned(pos0, pos1)
    );
  },
  DirectlyAbove: (pos0, pos1) => {
    return (
      binaryConcreteConfidenceFn.Above(pos0, pos1) *
      binaryConcreteConfidenceFn.VerticallyAligned(pos0, pos1)
    );
  },
  DirectlyBelow: (pos0, pos1) => {
    return (
      binaryConcreteConfidenceFn.Below(pos0, pos1) *
      binaryConcreteConfidenceFn.VerticallyAligned(pos0, pos1)
    );
  },
  HorizontallyAligned: (pos0, pos1) => {
    // 0 is horizontally aligned with 1
    const { x: x0, y: y0 } = pos0;
    const { x: x1, y: y1 } = pos1;
    const diff = y0 - y1;
    // diff = 0 => good
    return unnormalizedGaussian(diff, 0, 1600);
  },
  VerticallyAligned: (pos0, pos1) => {
    // 0 is vertically aligned with 1
    const { x: x0, y: y0 } = pos0;
    const { x: x1, y: y1 } = pos1;
    const diff = x0 - x1;
    // diff = 0 => good
    return unnormalizedGaussian(diff, 0, 1600);
  },

  // below are unimplemented for now
  Contains: (pos0, pos1) => {
    return 0;
  },
  InsideRingOf: (pos0, pos1) => {
    return 0;
  },
  OutsideRingOf: (pos0, pos1) => {
    return 0;
  },
};

export const confidenceOfConcrete = (
  concrete: ConcreteLayout<UnboundAtom>,
  diagram: AbstractDiagram
): number => {
  if (concrete.tag === 'BinaryLayout') {
    const { op0, op1, separation, option } = concrete;
    // don't care about separation for now
    const pos0 = diagram[op0.name];
    const pos1 = diagram[op1.name];
    return binaryConcreteConfidenceFn[option](pos0, pos1);
  } else if (concrete.tag === 'UnaryLayout') {
    const { op, separation, option } = concrete;
    // don't care about separation for now
    const pos = diagram[op.name];

    if (option === 'AboveCenter') {
      return binaryConcreteConfidenceFn.Above(pos, { x: 0, y: 0 });
    } else if (option === 'BelowCenter') {
      return binaryConcreteConfidenceFn.Below(pos, { x: 0, y: 0 });
    } else if (option === 'LeftOfCenter') {
      return binaryConcreteConfidenceFn.LeftOf(pos, { x: 0, y: 0 });
    } else {
      return binaryConcreteConfidenceFn.RightOf(pos, { x: 0, y: 0 });
    }
  } else if (concrete.tag === 'CyclicLayout') {
    // not implemented yet
    return 0;
  } else {
    // not implemented yet
    return 0;
  }
};

export const computeConfidence = (
  abstractLayout: AbstractLayout,
  instance: Instance,
  model: Model,
  diagram: AbstractDiagram
): number => {
  // This function should analyze the abstract layout and instance to compute confidence

  const concretes = compileAbstractLayouts([abstractLayout], model, instance);

  if (concretes.length === 0) {
    return 0;
  }

  // now check if the diagram satisfies these concretes

  const confs = concretes.map(concrete =>
    confidenceOfConcrete(concrete, diagram)
  );
  const logConfs = confs.map(c => Math.log(c));
  const sumLogConfs = logConfs.reduce((acc, c) => acc + c, 0);
  const avgLogConf = sumLogConfs / logConfs.length;
  const conf = Math.exp(avgLogConf);

  return conf;
};
