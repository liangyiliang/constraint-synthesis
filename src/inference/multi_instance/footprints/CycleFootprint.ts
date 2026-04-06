import {
  CyclicLayoutOption,
  InstancedUnboundAtom,
  prettyAtomInConstraint,
} from '../../../constraint_language/concrete/ConcreteLayout';

// canonicize a cycle
//  - consistent ordering (clockwise)
//  - consistent starting point (alphabetically first node)
const toCycleFootprint = (
  orderedNodes: string[],
  option: CyclicLayoutOption
): string[] => {
  if (option === 'Counterclockwise') {
    orderedNodes.reverse();
  }

  // find the index of the alphabetically first node
  const minNode = orderedNodes.reduce((min, node) => (node < min ? node : min));
  const minIndex = orderedNodes.indexOf(minNode);
  return [...orderedNodes.slice(minIndex), ...orderedNodes.slice(0, minIndex)];
};

export type InstancedCycleFootprint = InstancedUnboundAtom[];

export const toInstancedCycleFootprint = (
  orderedNodes: string[],
  option: CyclicLayoutOption,
  instanceId: number
): InstancedUnboundAtom[] => {
  const singleInstanceFootprint = toCycleFootprint(orderedNodes, option);
  // console.log('Single instance footprint:', singleInstanceFootprint);
  return singleInstanceFootprint.map(node => ({
    tag: 'InstancedUnboundAtom',
    name: node,
    instanceId,
  }));
};

export const prettyInstancedCycleFootprint = (
  footprint: InstancedCycleFootprint
): string => {
  return footprint.map(atom => prettyAtomInConstraint(atom)).join(',');
};
