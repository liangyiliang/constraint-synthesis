import {
  PredSelector,
  SigSelector,
} from '../../../constraint_language/abstract/AbstractLayout';
import { TypeEnv } from '../../../constraint_language/abstract/CheckAbstractLayout';
import { Model } from '../../../model_instance/Model';
import { cartesianProduct } from '../../../utils/utils';

export const genSigSelectors = (
  model: Model,
  typeEnv: TypeEnv,
  numVarsAvailable: number
): SigSelector[] => {
  const sss: SigSelector[] = [];
  for (const sig of model.signatures) {
    const varname = `v${numVarsAvailable}`;
    const existing = typeEnv[varname];
    if (existing === undefined) {
      sss.push({
        tag: 'SigSelector',
        sig,
        varname,
      });
    } else if (existing === sig) {
      // okay
    } else {
      throw new Error(
        `Type environment already has ${varname} bound to sig ${existing}, but trying to bind it to sig ${sig}`
      );
    }
  }
  return sss;
};

export const genPredSelectors = (
  model: Model,
  typeEnv: TypeEnv
): PredSelector[] => {
  const sigVarnamesMap: Map<string, string[]> = new Map();
  for (const [varname, sig] of Object.entries(typeEnv)) {
    const existing = sigVarnamesMap.get(sig);
    if (existing === undefined) {
      sigVarnamesMap.set(sig, [varname]);
    } else {
      existing.push(varname);
    }
  }

  const pss: PredSelector[] = [];
  for (const pred of model.predicates) {
    const { name, sigs } = pred;

    const possVarnames = sigs.map(s => sigVarnamesMap.get(s) ?? []);
    const prod = cartesianProduct(possVarnames);

    for (const p of prod) {
      pss.push({
        tag: 'PredSelector',
        pred: name,
        args: p,
      });
    }
  }

  return pss;
};
