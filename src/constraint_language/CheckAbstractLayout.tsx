import { Model } from '../model_instance/Model';
import { AbstractLayout, Selector } from './AbstractLayout';

export function checkAbstractLayout(
  layout: AbstractLayout,
  model: Model
): boolean {
  return checkAbstractLayoutHelper(layout, model, {});
}

type CheckerEnv = Record<string, string>;

function checkSelector(
  sel: Selector,
  model: Model,
  env: CheckerEnv
): CheckerEnv | undefined {
  if (sel.tag === 'SigSelector') {
    const { varname, sig } = sel;
    if (varname in env) {
      if (env[varname] === sig) {
        return env;
      } else {
        return undefined;
      }
    } else {
      env[varname] = sig; // Add the variable to the environment
      return env;
    }
  } else {
    const { pred, args } = sel;

    const modelPred = model.predicates.find(p => p.name === pred);
    if (modelPred === undefined) {
      return undefined;
    } else {
      if (modelPred.sigs.length !== args.length) {
        return undefined;
      }
      for (let i = 0; i < args.length; i++) {
        const argInSelector = args[i];
        const argSigInModel = modelPred.sigs[i];
        if (!(argInSelector in env)) {
          env[argInSelector] = argSigInModel; // okay, no conflict
        } else if (env[argInSelector] !== argSigInModel) {
          return undefined; // Conflict in argument signature
        }
      }
      return env; // All arguments are valid
    }
  }
}

function checkAbstractLayoutHelper(
  layout: AbstractLayout,
  model: Model,
  env: CheckerEnv
): boolean {
  const { selector, layout: inner } = layout;

  const afterSelector = checkSelector(selector, model, env);
  if (afterSelector === undefined) {
    return false;
  }

  if (inner.tag === 'AbstractLayout') {
    return checkAbstractLayoutHelper(inner, model, afterSelector);
  } else {
    const concrete = inner;
    if (concrete.tag === 'CyclicLayout' || concrete.tag === 'BinaryLayout') {
      if (
        concrete.option === 'OutsideRingOf' ||
        concrete.option === 'InsideRingOf' ||
        concrete.option === 'Contains'
      ) {
        return false; // Unsupported options for now
      }

      const { op0, op1 } = concrete;
      const sig0 = afterSelector[op0.name];
      const sig1 = afterSelector[op1.name];
      if (sig0 === undefined || sig1 === undefined) {
        return false; // Bound atoms not found in environment
      }
      return true;
    } else if (concrete.tag === 'UnaryLayout') {
      const { op } = concrete;
      const sig = afterSelector[op.name];
      if (sig === undefined) {
        return false; // Bound atoms not found in environment
      }
      return true;
    } else {
      // Handle other concrete layout types if necessary
      return false; // Unsupported layout type for now
    }
  }
}
