// 物理讲义的固定题源契约，年度真题与已发布题库题分别限定读取范围。
export interface PhysicsLearningSelection {
  kind: "annual" | "bank";
  questionCode: string;
  year?: number;
  exam?: string;
  paper?: string;
  questionNumber?: number;
  reason: string;
}
