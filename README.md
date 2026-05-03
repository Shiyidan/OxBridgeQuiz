# 在线试卷解析与答题系统

## 项目概述

这是一个支持PDF试卷自动解析和在线答题的Web应用Demo。

**核心功能**：
1. **PDF解析器**（Python）- 自动提取PDF中的题目、选项、公式，转换为结构化JSON
2. **在线答题**（Vue 3）- 加载JSON试卷，渲染题目（支持公式、图片），支持答题和评分

## 技术栈

- **PDF解析**：Python + PyMuPDF + pix2tex（公式OCR）
- **前端框架**：Vue 3 + TypeScript + Pinia
- **公式渲染**：KaTeX
- **样式**：原生CSS

## 项目结构

```
quiz-demo/
├── parser/                     # PDF解析器
│   ├── pdf_to_json.py         # 主解析脚本
│   └── requirements.txt       # Python依赖
│
├── quiz-web/                   # Vue 3前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   │   ├── FormulaBlock.vue      # 公式渲染
│   │   │   ├── ContentBlock.vue      # 内容块
│   │   │   ├── OptionList.vue        # 选项列表
│   │   │   └── QuestionRenderer.vue  # 题目渲染
│   │   ├── views/
│   │   │   └── ExamView.vue          # 答题页面
│   │   ├── stores/
│   │   │   └── exam.ts               # Pinia状态管理
│   │   └── types/
│   │       └── index.ts              # TypeScript类型定义
│   └── public/data/
│       └── paper.json         # 示例试卷数据
│
└── ENGAA_2023_S1_QuestionPaper.pdf  # 示例PDF
```

## 快速开始

### 1. PDF解析器

```bash
cd parser

# 安装依赖
pip install -r requirements.txt

# 解析PDF
python pdf_to_json.py ../ENGAA_2023_S1_QuestionPaper.pdf -o output

# 启用公式OCR识别（需要GPU，首次运行会下载模型）
python pdf_to_json.py ../ENGAA_2023_S1_QuestionPaper.pdf -o output --formula-ocr
```

解析完成后，会在 `output/paper.json` 生成结构化数据，`output/images/` 存放提取的图片。

### 2. 前端答题

```bash
cd quiz-web

# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

访问 `http://localhost:5173` 即可答题。

## PDF解析器说明

### 功能特性

1. **文本提取**：保留字体信息，识别数学公式
2. **图片提取**：保存页面中的图片
3. **题目分割**：按题号自动分割题目
4. **选项解析**：识别选择题选项（A-F）
5. **公式识别**：
   - 基于字体特征检测公式
   - 支持pix2tex自动OCR识别（可选）
   - 希腊字母、根号、分数等转换

### 使用方法

```python
from pdf_to_json import PDFParser

parser = PDFParser("input.pdf", "output")
result = parser.parse()
parser.save_json(result)
parser.close()
```

### 输出格式

```json
{
  "title": "试卷标题",
  "year": 2023,
  "duration": 60,
  "totalQuestions": 40,
  "questions": [
    {
      "id": "q1",
      "number": 1,
      "content": [
        {"type": "text", "value": "题目文本..."},
        {"type": "break"},
        {"type": "formula", "value": "R = √(...)", "latex": "R = \\sqrt{...}"}
      ],
      "options": [
        {"label": "A", "content": [{"type": "formula", "latex": "..."}]},
        ...
      ],
      "correctAnswer": "C",
      "tags": ["geometry"]
    }
  ]
}
```

## 前端组件说明

### 组件列表

1. **FormulaBlock** - KaTeX公式渲染
2. **ContentBlock** - 内容块渲染（文本/公式/图片/换行）
3. **OptionList** - 选项列表，支持选择反馈
4. **QuestionRenderer** - 完整题目渲染

### 答题功能

- 单选题答题
- 进度显示
- 交卷评分
- 正确答案提示
- 成绩统计

## 数据流

```
PDF → Python解析器 → paper.json → Vue前端 → 答题界面
```

## 注意事项

1. **公式识别**：pix2tex需要PyTorch，首次运行会自动下载模型（约几百MB）
2. **图片路径**：解析器输出的图片路径是相对于输出目录的，需要确保前端能正确访问
3. **正确答案**：解析器无法自动识别正确答案，需要在JSON中手动设置

## 后续优化方向

1. 提高公式识别准确率
2. 支持更多题型（填空、解答）
3. 添加用户系统和答题记录
4. 添加试卷编辑器，支持人工校对
5. 优化复杂图形的渲染

## 许可证

MIT
