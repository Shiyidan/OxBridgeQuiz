// 数学 1 全七章例题白名单：只聚合编辑核准题号，正文与答案不进入配置。
import { mathsUnitsNumberSources } from "./mathsUnitsNumber.js";
import { mathsRatioSources } from "./mathsRatio.js";
import { mathsAlgebraSources } from "./mathsAlgebra.js";
import { mathsGeometrySources } from "./mathsGeometry.js";
import { mathsStatisticsSources } from "./mathsStatistics.js";
import { mathsProbabilitySources } from "./mathsProbability.js";
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathematicsLearningSources: Record<
  string,
  MathematicsLearningSelection
> = {
  ...mathsUnitsNumberSources,
  ...mathsRatioSources,
  ...mathsAlgebraSources,
  ...mathsGeometrySources,
  ...mathsStatisticsSources,
  ...mathsProbabilitySources,
};
