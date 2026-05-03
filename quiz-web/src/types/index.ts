// 内容块类型
export interface ContentBlock {
  type: 'text' | 'formula' | 'image' | 'svg' | 'tikz' | 'break';
  value?: string;
  latex?: string;
  src?: string;
  code?: string;  // TikZ 代码
  metadata?: {
    width?: number;
    height?: number;
    alt?: string;
  };
}

// 选项
export interface Option {
  label: string;
  content?: ContentBlock[];  // 旧格式：内容块数组
  text?: string;             // 新格式：LaTeX文本（如 "$x = 5r$")
}

// 图片/SVG/TikZ
export interface QuestionImage {
  type: 'tikz' | 'svg' | 'image';
  src?: string;
  code?: string;
  alt?: string;
}

// 题目
export interface Question {
  id: string;
  number?: number;        // 旧格式：题号
  order?: number;         // 新格式：题号
  title?: string;         // 新格式：题目文本（含LaTeX）
  content?: ContentBlock[]; // 旧格式：内容块数组
  options: Option[];
  correctAnswer?: string; // 旧格式：正确答案
  answer?: string[];      // 新格式：正确答案数组
  explanation?: string;
  marks?: number;
  tags?: string[];
  images?: QuestionImage[]; // 新格式：图片/TikZ
}

// 试卷
export interface Paper {
  title: string;
  year: number;
  duration: number;
  totalQuestions: number;
  questions: Question[];
}

// 答题记录
export interface AnswerRecord {
  questionId: string;
  selectedOption: string;
  answeredAt: number;
}

// 考试状态
export interface ExamState {
  paper: Paper | null;
  answers: Map<string, string>; // questionId -> selectedOption
  submitted: boolean;
  startedAt: number | null;
  submittedAt: number | null;
}
