"""
PDF试卷解析器
将PDF试卷转换为结构化JSON，自动识别公式
"""

import fitz  # PyMuPDF
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Tuple
from PIL import Image
import io


class PDFParser:
    """PDF试卷解析器"""

    def __init__(self, pdf_path: str, output_dir: str):
        self.pdf_path = Path(pdf_path)
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # 创建图片目录
        self.image_dir = self.output_dir / "images"
        self.image_dir.mkdir(exist_ok=True)

        # 初始化OCR（延迟加载）
        self.ocr = None

        # 打开PDF
        self.doc = fitz.open(pdf_path)

    def _init_ocr(self):
        """延迟初始化OCR模型"""
        if self.ocr is None:
            print("正在加载公式识别模型（首次运行需要下载，请耐心等待）...")
            try:
                from pix2tex.cli import LatexOCR
                self.ocr = LatexOCR()
                print("公式识别模型加载完成")
            except Exception as e:
                print(f"加载pix2tex失败: {e}")
                print("将使用图片方式展示公式")
                self.ocr = None

    def extract_text_with_font_info(self, page: fitz.Page) -> List[Dict]:
        """提取文本并保留字体信息"""
        text_blocks = []

        # 获取文本块
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if "lines" not in block:
                continue

            for line in block["lines"]:
                for span in line["spans"]:
                    text_blocks.append({
                        "text": span["text"],
                        "font": span["font"],
                        "size": span["size"],
                        "flags": span["flags"],  # 字体样式（粗体、斜体等）
                        "bbox": span["bbox"],
                        "color": span["color"],
                    })

        return text_blocks

    def is_likely_formula(self, text: str, font: str, size: float) -> bool:
        """判断文本块是否可能是公式"""
        # 基于字体特征判断
        formula_indicators = [
            "CMMI", "CMEX", "CMSY", "CMR",  # Computer Modern 数学字体
            "Math", "Symbol", "Times-Italic",
        ]

        font_upper = font.upper()
        for indicator in formula_indicators:
            if indicator in font_upper:
                return True

        # 基于内容特征判断
        formula_chars = set("∫∑∏√∞∂∆παβγδεθλμσφωΩ≤≥≠≈±×÷→←↑↓∈∉⊂⊃∩∪")
        if any(c in text for c in formula_chars):
            return True

        # 基于上下标特征判断
        if re.search(r'[a-zA-Z]_\{[^}]+\}|\^[\{\d]', text):
            return True

        return False

    def extract_images(self, page: fitz.Page, page_num: int) -> List[Dict]:
        """提取页面中的图片"""
        images = []
        image_list = page.get_images(full=True)

        for img_index, img in enumerate(image_list):
            xref = img[0]
            base_image = self.doc.extract_image(xref)
            image_bytes = base_image["image"]
            image_ext = base_image["ext"]

            # 生成图片文件名
            image_filename = f"page_{page_num + 1}_img_{img_index + 1}.{image_ext}"
            image_path = self.image_dir / image_filename

            # 保存图片
            with open(image_path, "wb") as f:
                f.write(image_bytes)

            # 获取图片在页面中的位置
            for img_rect in page.get_image_rects(xref):
                images.append({
                    "filename": image_filename,
                    "path": str(image_path.relative_to(self.output_dir)),
                    "bbox": list(img_rect),
                    "page": page_num + 1,
                })

        return images

    def recognize_formula(self, image_path: Path) -> str:
        """使用pix2tex识别公式图片"""
        if self.ocr is None:
            self._init_ocr()

        if self.ocr is None:
            return None

        try:
            latex = self.ocr(str(image_path))
            return latex
        except Exception as e:
            print(f"公式识别失败: {e}")
            return None

    def detect_formula_regions(self, page: fitz.Page, page_num: int) -> List[Dict]:
        """检测页面中的公式区域"""
        formula_regions = []

        # 方法1: 基于文本特征检测
        text_blocks = self.extract_text_with_font_info(page)

        for block in text_blocks:
            if self.is_likely_formula(block["text"], block["font"], block["size"]):
                formula_regions.append({
                    "type": "formula",
                    "text": block["text"],
                    "bbox": block["bbox"],
                    "source": "text",
                })

        # 方法2: 提取可能包含公式的图片区域
        # 将页面渲染为图片，识别独立公式块
        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))  # 2倍分辨率
        img = Image.frombytes("RGB", [pix.width, pix.height], pix.samples)

        # 保存页面图片（用于调试）
        page_image_path = self.image_dir / f"page_{page_num + 1}.png"
        img.save(page_image_path)

        return formula_regions

    def parse_page(self, page_num: int) -> Dict:
        """解析单页内容"""
        page = self.doc[page_num]

        print(f"正在解析第 {page_num + 1} 页...")

        # 提取文本
        text = page.get_text()

        # 提取图片
        images = self.extract_images(page, page_num)

        # 检测公式区域
        formulas = self.detect_formula_regions(page, page_num)

        return {
            "page_number": page_num + 1,
            "text": text,
            "images": images,
            "formulas": formulas,
        }

    def split_questions(self, text: str) -> List[Dict]:
        """按题号分割题目"""
        questions = []

        # 匹配题号模式：数字后跟点或空格
        # 支持："1.", "1 ", "1)" 等
        pattern = r'(?:^|\n)\s*(\d+)\s*[\.\)\s]\s*(?=[A-Z])'

        matches = list(re.finditer(pattern, text))

        for i, match in enumerate(matches):
            question_num = int(match.group(1))
            start_pos = match.start()

            # 确定题目结束位置
            if i + 1 < len(matches):
                end_pos = matches[i + 1].start()
            else:
                end_pos = len(text)

            question_text = text[start_pos:end_pos].strip()

            # 解析选项
            options = self.parse_options(question_text)

            # 提取题目正文（去掉选项部分）
            content_text = question_text
            if options:
                # 找到第一个选项的位置
                first_option_pos = question_text.find(options[0]["label"] + ".")
                if first_option_pos > 0:
                    content_text = question_text[:first_option_pos].strip()

            questions.append({
                "number": question_num,
                "raw_text": question_text,
                "content_text": content_text,
                "options": options,
            })

        return questions

    def parse_options(self, text: str) -> List[Dict]:
        """解析选择题选项"""
        options = []

        # 匹配选项：A. B. C. D. 等
        option_pattern = r'([A-F])\s*[\.\)]\s*([^\n]*)'
        matches = re.findall(option_pattern, text)

        for label, content in matches:
            options.append({
                "label": label,
                "content": content.strip(),
            })

        return options

    def build_content_blocks(self, text: str) -> List[Dict]:
        """将文本转换为内容块"""
        blocks = []

        # 按行分割
        lines = text.split('\n')

        for line in lines:
            line = line.strip()
            if not line:
                blocks.append({"type": "break"})
                continue

            # 检测是否包含公式特征
            # 简化处理：将包含数学符号的行标记为公式
            if self.contains_formula_features(line):
                # 尝试识别公式
                latex = self.text_to_latex(line)
                blocks.append({
                    "type": "formula",
                    "value": line,
                    "latex": latex,
                })
            else:
                blocks.append({
                    "type": "text",
                    "value": line,
                })

        return blocks

    def contains_formula_features(self, text: str) -> bool:
        """检测文本是否包含公式特征"""
        # 数学符号
        math_symbols = r'[=+\-*/^_{}\[\]√∞∫∑∏αβγδεθλμπσφωΩ≤≥≠≈±×÷→←↑↓∈∉]'

        # LaTeX风格
        latex_patterns = [
            r'\\[a-zA-Z]+',  # \command
            r'\$\$',  # $$
            r'_{', r'^{',  # 上下标
            r'\\frac', r'\\sqrt', r'\\sum', r'\\int',
        ]

        if re.search(math_symbols, text):
            return True

        for pattern in latex_patterns:
            if re.search(pattern, text):
                return True

        return False

    def text_to_latex(self, text: str) -> str:
        """将文本转换为LaTeX（简化版）"""
        latex = text

        # 处理上标（简化）
        latex = re.sub(r'(\w)\^(\d)', r'\1^{\2}', latex)

        # 处理下标
        latex = re.sub(r'(\w)_(\w)', r'\1_{\2}', latex)

        # 处理根号
        latex = re.sub(r'√(\w+)', r'\\sqrt{\1}', latex)
        latex = re.sub(r'√\{(\w+)\}', r'\\sqrt{\1}', latex)

        # 处理分数（简化）
        latex = re.sub(r'(\w+)/(\w+)', r'\\frac{\1}{\2}', latex)

        # 处理希腊字母
        greek_map = {
            'π': '\\pi', 'α': '\\alpha', 'β': '\\beta', 'γ': '\\gamma',
            'δ': '\\delta', 'ε': '\\epsilon', 'θ': '\\theta', 'λ': '\\lambda',
            'μ': '\\mu', 'σ': '\\sigma', 'φ': '\\phi', 'ω': '\\omega',
            'Ω': '\\Omega', 'Δ': '\\Delta',
        }
        for char, cmd in greek_map.items():
            latex = latex.replace(char, cmd)

        return latex

    def parse(self) -> Dict:
        """解析整个PDF"""
        print(f"开始解析: {self.pdf_path}")
        print(f"总页数: {len(self.doc)}")

        all_questions = []

        # 解析每一页
        for page_num in range(len(self.doc)):
            page_data = self.parse_page(page_num)

            # 分割题目
            questions = self.split_questions(page_data["text"])

            for q in questions:
                # 构建内容块
                content_blocks = self.build_content_blocks(q["content_text"])
                option_blocks = []

                for opt in q["options"]:
                    opt_content = self.build_content_blocks(opt["content"])
                    option_blocks.append({
                        "label": opt["label"],
                        "content": opt_content,
                    })

                all_questions.append({
                    "id": f"q{q['number']}",
                    "number": q["number"],
                    "content": content_blocks,
                    "options": option_blocks,
                    "correctAnswer": None,  # 需要人工设置或从答案页提取
                    "tags": [],
                })

        # 构建最终结果
        result = {
            "title": self.extract_title(),
            "year": self.extract_year(),
            "duration": 60,  # 默认值
            "totalQuestions": len(all_questions),
            "questions": all_questions,
        }

        return result

    def extract_title(self) -> str:
        """从PDF中提取标题"""
        # 默认使用文件名
        return self.pdf_path.stem.replace("_", " ").title()

    def extract_year(self) -> int:
        """从文件名或内容中提取年份"""
        # 尝试从文件名提取
        match = re.search(r'20\d{2}', self.pdf_path.name)
        if match:
            return int(match.group())
        return 2023

    def save_json(self, data: Dict, filename: str = "paper.json"):
        """保存为JSON文件"""
        output_path = self.output_dir / filename
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"JSON已保存: {output_path}")
        return output_path

    def close(self):
        """关闭PDF文档"""
        self.doc.close()


def main():
    """主函数"""
    import argparse

    parser = argparse.ArgumentParser(description='PDF试卷解析器')
    parser.add_argument('pdf', help='PDF文件路径')
    parser.add_argument('-o', '--output', default='output', help='输出目录')
    parser.add_argument('--formula-ocr', action='store_true', help='启用公式OCR识别')

    args = parser.parse_args()

    # 创建解析器
    pdf_parser = PDFParser(args.pdf, args.output)

    try:
        # 如果需要公式OCR，初始化OCR
        if args.formula_ocr:
            pdf_parser._init_ocr()

        # 解析PDF
        result = pdf_parser.parse()

        # 保存JSON
        pdf_parser.save_json(result)

        print(f"\n解析完成!")
        print(f"共解析 {result['totalQuestions']} 道题目")
        print(f"输出目录: {pdf_parser.output_dir}")

    finally:
        pdf_parser.close()


if __name__ == "__main__":
    main()
