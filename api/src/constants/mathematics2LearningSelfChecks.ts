// 数学 2 已编写章节叶子节点的固定自测，统一按已审核题源读取原题。
import { maths2AlgebraSelfChecks } from "./maths2Algebra.js";
import { maths2SequencesSelfChecks } from "./maths2Sequences.js";
import { maths2CoordinateSelfChecks } from "./maths2Coordinate.js";
import { maths2TrigonometrySelfChecks } from "./maths2Trigonometry.js";
import { maths2ExponentialsSelfChecks } from "./maths2Exponentials.js";
import { maths2DifferentiationSelfChecks } from "./maths2Differentiation.js";
import type { MathematicsLearningSelection } from "./mathematicsLearningTypes.js";

export const mathematics2LearningSelfChecks: Record<
  string,
  {
    title: string;
    selection: MathematicsLearningSelection | null;
  }
> = {
  ...maths2AlgebraSelfChecks,
  ...maths2SequencesSelfChecks,
  ...maths2CoordinateSelfChecks,
  ...maths2TrigonometrySelfChecks,
  ...maths2ExponentialsSelfChecks,
  ...maths2DifferentiationSelfChecks,
};
