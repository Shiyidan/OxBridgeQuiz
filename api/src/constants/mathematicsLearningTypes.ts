// 数学 1 讲义的固定题源契约，区分年度真题与已发布独立题库。
export interface MathematicsLearningSelection {
  kind: "annual" | "bank";
  questionCode: string;
  year?: number;
  exam?: string;
  paper?: string;
  questionNumber?: number;
  reason: string;
}
