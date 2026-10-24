// 数学 1 全七章76个叶子节点的固定自测，统一按已审核题源读取原题。
import { mathsUnitsNumberSelfChecks } from "./mathsUnitsNumber.js";
import { mathsRatioSelfChecks } from "./mathsRatio.js";
import { mathsAlgebraSelfChecks } from "./mathsAlgebra.js";
import { mathsGeometrySelfChecks } from "./mathsGeometry.js";
import { mathsStatisticsSelfChecks } from "./mathsStatistics.js";
import { mathsProbabilitySelfChecks } from "./mathsProbability.js";
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathematicsLearningSelfChecks: Record<
  string,
  {
    title: string;
    selection: MathematicsLearningSelection | null;
  }
> = {
  ...mathsUnitsNumberSelfChecks,
  ...mathsRatioSelfChecks,
  ...mathsAlgebraSelfChecks,
  ...mathsGeometrySelfChecks,
  ...mathsStatisticsSelfChecks,
  ...mathsProbabilitySelfChecks,
};
