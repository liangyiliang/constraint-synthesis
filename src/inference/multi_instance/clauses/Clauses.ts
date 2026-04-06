import {
  AbstractLayout,
  Selector,
} from '../../../constraint_language/abstract/AbstractLayout';
import { BoundConcrete } from '../../../constraint_language/concrete/ConcreteLayout';

export const clauseComplexity = (l: AbstractLayout | BoundConcrete): number => {
  if (l.tag === 'AbstractLayout') {
    return 1 + clauseComplexity(l.layout);
  } else {
    return 1;
  }
};

export const makeClause = (
  selectors: Selector[],
  concrete: BoundConcrete
): AbstractLayout => {
  if (selectors.length > 1) {
    const [selector, ...rest] = selectors;
    return {
      tag: 'AbstractLayout',
      selector,
      layout: makeClause(rest, concrete),
    };
  } else if (selectors.length === 1) {
    return {
      tag: 'AbstractLayout',
      selector: selectors[0],
      layout: concrete,
    };
  } else {
    throw new Error('makeClause called with empty selectors array');
  }
};
