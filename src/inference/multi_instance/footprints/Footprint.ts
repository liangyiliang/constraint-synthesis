import {
  BinaryLayout,
  BinaryLayoutOption,
  CyclicLayout,
  CyclicLayoutOption,
  GroupingLayout,
  InstancedUnboundAtom,
  UnaryLayout,
  UnboundAtom,
  UnboundConcrete,
} from '../../../constraint_language/concrete/ConcreteLayout';

export type SingleInstanceFootprint =
  | UnaryLayout<UnboundAtom>
  | (CyclicLayout<UnboundAtom> & {
      option: Exclude<CyclicLayoutOption, 'Counterclockwise'>;
    })
  | GroupingLayout<UnboundAtom>
  | (BinaryLayout<UnboundAtom> & {
      option: Exclude<
        BinaryLayoutOption,
        | 'Below'
        | 'RightOf'
        | 'DirectlyLeftOf'
        | 'DirectlyRightOf'
        | 'DirectlyAbove'
        | 'DirectlyBelow'
      >;
    });

export type InstancedFootprint =
  | UnaryLayout<InstancedUnboundAtom>
  | (CyclicLayout<InstancedUnboundAtom> & {
      option: Exclude<CyclicLayoutOption, 'Counterclockwise'>;
    })
  | GroupingLayout<InstancedUnboundAtom>
  | (BinaryLayout<InstancedUnboundAtom> & {
      option: Exclude<
        BinaryLayoutOption,
        | 'Below'
        | 'RightOf'
        | 'DirectlyLeftOf'
        | 'DirectlyRightOf'
        | 'DirectlyAbove'
        | 'DirectlyBelow'
      >;
    });

const toInstancedAtom = (
  atom: UnboundAtom,
  instanceId: number
): InstancedUnboundAtom => {
  const { name } = atom;
  return { tag: 'InstancedUnboundAtom', name, instanceId };
};

export const toCanonicalizedFootprints = (
  uC: UnboundConcrete,
  instanceId: number
): InstancedFootprint[] => {
  if (uC.tag === 'BinaryLayout') {
    const { option, op0, op1 } = uC;
    const [orderedOp0, orderedOp1] =
      op0.name < op1.name ? [op0, op1] : [op1, op0];
    if (uC.option === 'Below') {
      return [
        {
          ...uC,
          option: 'Above',
          op0: toInstancedAtom(op1, instanceId),
          op1: toInstancedAtom(op0, instanceId),
        },
      ];
    } else if (uC.option === 'RightOf') {
      return [
        {
          ...uC,
          option: 'LeftOf',
          op0: toInstancedAtom(op1, instanceId),
          op1: toInstancedAtom(op0, instanceId),
        },
      ];
    } else if (uC.option === 'HorizontallyAligned') {
      return [
        {
          ...uC,
          option: 'HorizontallyAligned',
          op0: toInstancedAtom(orderedOp0, instanceId),
          op1: toInstancedAtom(orderedOp1, instanceId),
        },
      ];
    } else if (uC.option === 'VerticallyAligned') {
      return [
        {
          ...uC,
          option: 'VerticallyAligned',
          op0: toInstancedAtom(orderedOp0, instanceId),
          op1: toInstancedAtom(orderedOp1, instanceId),
        },
      ];
    } else if (uC.option === 'DirectlyAbove') {
      return [
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'Above',
            op0,
            op1,
          },
          instanceId
        ),
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'VerticallyAligned',
            op0,
            op1,
          },
          instanceId
        ),
      ];
    } else if (uC.option === 'DirectlyBelow') {
      return [
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'Below',
            op0,
            op1,
          },
          instanceId
        ),
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'VerticallyAligned',
            op0,
            op1,
          },
          instanceId
        ),
      ];
    } else if (uC.option === 'DirectlyLeftOf') {
      return [
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'LeftOf',
            op0,
            op1,
          },
          instanceId
        ),
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'HorizontallyAligned',
            op0,
            op1,
          },
          instanceId
        ),
      ];
    } else if (uC.option === 'DirectlyRightOf') {
      return [
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'RightOf',
            op0,
            op1,
          },
          instanceId
        ),
        ...toCanonicalizedFootprints(
          {
            ...uC,
            option: 'HorizontallyAligned',
            op0,
            op1,
          },
          instanceId
        ),
      ];
    } else {
      return [
        {
          ...uC,
          option: uC.option,
          op0: toInstancedAtom(op0, instanceId),
          op1: toInstancedAtom(op1, instanceId),
        },
      ];
    }
  } else if (uC.tag === 'UnaryLayout') {
    const { op } = uC;
    return [
      {
        ...uC,
        option: uC.option,
        op: toInstancedAtom(op, instanceId),
      },
    ];
  } else if (uC.tag === 'CyclicLayout') {
    // Handle cyclic layouts
    const { option, op0, op1 } = uC;
    if (option === 'Clockwise') {
      return [
        {
          ...uC,
          option: 'Clockwise',
          op0: toInstancedAtom(op0, instanceId),
          op1: toInstancedAtom(op1, instanceId),
        },
      ];
    } else {
      return [
        {
          ...uC,
          option: 'Clockwise',
          op0: toInstancedAtom(op1, instanceId),
          op1: toInstancedAtom(op0, instanceId),
        },
      ];
    }
  } else {
    throw new Error('unsupported');
  }
};
