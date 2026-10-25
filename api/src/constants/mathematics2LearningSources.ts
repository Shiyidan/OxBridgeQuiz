// 数学 2 已编写章节例题白名单：只聚合编辑核准题号，正文与答案不进入配置。
import { maths2AlgebraSources } from "./maths2Algebra.js";
import { maths2SequencesSources } from "./maths2Sequences.js";
import { maths2CoordinateSources } from "./maths2Coordinate.js";
import { maths2TrigonometrySources } from "./maths2Trigonometry.js";
import { maths2ExponentialsSources } from "./maths2Exponentials.js";
import { maths2DifferentiationSources } from "./maths2Differentiation.js";
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathematics2LearningSources: Record<
  string,
  MathematicsLearningSelection
> = {
  ...maths2AlgebraSources,
  ...maths2SequencesSources,
  ...maths2CoordinateSources,
  ...maths2TrigonometrySources,
  ...maths2ExponentialsSources,
  ...maths2DifferentiationSources,
};
