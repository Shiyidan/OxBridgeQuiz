// 内容块类型（旧格式兼容）
export interface ContentBlock {
  type: 'text' | 'formula' | 'image' | 'svg' | 'break';
  value?: string;
  latex?: string;
  src?: string;
  metadata?: {
    width?: number;
    height?: number;
    alt?: string;
  };
}

// 新版富文本内容块（优先渲染格式）
// paragraph = 题干段落（含 LaTeX），image_ref = 内嵌图片引用（通过 image_id 匹配 images 数组中的 id）
export interface RichContentBlock {
  type: 'paragraph' | 'image_ref'
  text?: string        // paragraph 类型的文本内容
  image_id?: string    // image_ref 类型：匹配 images 数组中某张图片的 id
  alt?: string         // image_ref 类型：图片备用描述
}

// 选项
export interface Option {
  label: string;
  content?: ContentBlock[];  // 旧格式：内容块数组
  text?: string;             // 新格式：LaTeX文本（如 "$x = 5r$")
}

// 图片/SVG
export interface QuestionImage {
  id?: string;          // 唯一标识，用于 content_blocks 中 image_ref 匹配
  type: 'svg' | 'image';
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
  images?: QuestionImage[];     // 新格式：图片/SVG
  content_blocks?: RichContentBlock[] // 优先渲染格式：图文混排
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
