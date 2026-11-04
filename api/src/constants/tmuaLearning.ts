// TMUA 各已完成知识点的审核题源与自测映射，统一供学习接口使用。
import {
  tmuaQuadraticSources,
  tmuaQuadraticSelfChecks,
} from "./tmuaQuadratic.js";
import {
  tmuaSimultaneousSources,
  tmuaSimultaneousSelfChecks,
} from "./tmuaSimultaneous.js";
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";
import { tmuaIndicesSources, tmuaIndicesSelfChecks } from "./tmuaIndices.js";
import { tmuaSurdsSources, tmuaSurdsSelfChecks } from "./tmuaSurds.js";
import { tmuaInequalitiesSources, tmuaInequalitiesSelfChecks } from "./tmuaInequalities.js";
import { tmuaPolynomialsSources, tmuaPolynomialsSelfChecks } from "./tmuaPolynomials.js";
import { tmuaFunctionsSources, tmuaFunctionsSelfChecks } from "./tmuaFunctions.js";

export const tmuaLearningSources: Record<string, MathematicsLearningSelection> =
  {
    ...tmuaQuadraticSources,
    ...tmuaSimultaneousSources,
    ...tmuaIndicesSources,
    ...tmuaSurdsSources,
    ...tmuaInequalitiesSources,
    ...tmuaPolynomialsSources,
    ...tmuaFunctionsSources,
  };

export const tmuaLearningSelfChecks: Record<
  string,
  { title: string; selection: MathematicsLearningSelection | null }
> = {
  ...tmuaQuadraticSelfChecks,
  ...tmuaSimultaneousSelfChecks,
  ...tmuaIndicesSelfChecks,
  ...tmuaSurdsSelfChecks,
  ...tmuaInequalitiesSelfChecks,
  ...tmuaPolynomialsSelfChecks,
  ...tmuaFunctionsSelfChecks,
};
