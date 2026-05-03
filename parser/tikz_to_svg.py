"""
TikZ → SVG 自动编译工具
将JSON中所有TikZ代码编译为高清SVG，1:1还原
"""

import json
import subprocess
import tempfile
import os
from pathlib import Path
import shutil
import argparse


# TikZ 包装模板
TIKZ_TEMPLATE = r"""\documentclass[tikz, border=5pt]{{standalone}}
{packages}
\begin{{document}}
{tikz_code}
\end{{document}}
"""


def check_latex():
    """检查LaTeX环境"""
    required = ['lualatex', 'dvisvgm']
    for cmd in required:
        if shutil.which(cmd) is None:
            raise RuntimeError(f"未找到 {cmd}，请先安装 LaTeX（推荐MiKTeX或TeX Live）")


def extract_tikz_code(code: str) -> str:
    """提取纯TikZ代码"""
    # 提取 tikzpicture 环境
    import re
    match = re.search(r'\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}', code)
    if match:
        return f"\\begin{{tikzpicture}}{match.group(1)}\\end{{tikzpicture}}"

    # 提取 circuitikz 环境
    match = re.search(r'\\begin\{circuitikz\}([\s\S]*?)\\end\{circuitikz\}', code)
    if match:
        return f"\\begin{{circuitikz}}{match.group(1)}\\end{{circuitikz}}"

    return code


def detect_packages(code: str) -> str:
    """检测需要的宏包"""
    packages = [r'\usepackage{tikz}']

    if 'circuitikz' in code or 'circuit' in code:
        packages.append(r'\usepackage{circuitikz}')

    if 'pgfplots' in code:
        packages.append(r'\usepackage{pgfplots}')

    if 'tikz-3dplot' in code:
        packages.append(r'\usepackage{tikz-3dplot}')

    return '\n'.join(packages)


def tikz_to_svg(tikz_code: str, output_path: Path, dpi: int = 300) -> bool:
    """
    将TikZ代码编译为SVG

    流程：TikZ代码 → .tex → lualatex → .dvi → dvisvgm → .svg
    """
    print(f"编译 TikZ → SVG ...")

    # 提取纯TikZ代码
    pure_code = extract_tikz_code(tikz_code)
    packages = detect_packages(tikz_code)

    # 生成完整LaTeX文档
    tex_content = TIKZ_TEMPLATE.format(
        packages=packages,
        tikz_code=pure_code
    )

    # 创建临时目录
    with tempfile.TemporaryDirectory() as tmpdir:
        tmp = Path(tmpdir)

        # 写入 .tex 文件
        tex_file = tmp / 'tikz.tex'
        tex_file.write_text(tex_content, encoding='utf-8')

        try:
            # Step 1: lualatex → dvi
            # 使用 standalone 模式，输出为 dvi
            result = subprocess.run(
                ['lualatex', '--output-format=dvi',
                 '--interaction=nonstopmode',
                 '--halt-on-error',
                 str(tex_file)],
                cwd=str(tmp),
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode != 0:
                # 提取错误信息
                log_file = tmp / 'tikz.log'
                if log_file.exists():
                    log_content = log_file.read_text()
                    # 查找第一个错误
                    for line in log_content.split('\n'):
                        if line.startswith('!'):
                            print(f"  LaTeX 错误: {line.strip()}")
                            break

                # 尝试 dvisvgm 方式（有些TikZ可能失败但DVI已生成）
                dvi_file = tmp / 'tikz.dvi'
                if not dvi_file.exists():
                    print(f"  编译失败")
                    print(f"  {result.stderr[-500:]}")
                    return False

            # Step 2: dvisvgm → svg
            dvi_file = tmp / 'tikz.dvi'
            if dvi_file.exists():
                result = subprocess.run(
                    ['dvisvgm', '--no-fonts', '--exact',
                     f'--output={output_path}',
                     str(dvi_file)],
                    capture_output=True,
                    text=True,
                    timeout=30
                )

                if result.returncode == 0 and output_path.exists():
                    print(f"  成功: {output_path}")
                    return True
                else:
                    print(f"  dvisvgm 失败: {result.stderr[-200:]}")
                    return False
            else:
                print(f"  DVI文件未生成")
                return False

        except subprocess.TimeoutExpired:
            print(f"  编译超时")
            return False


def process_json(json_path: str, output_dir: str):
    """处理JSON文件，编译所有TikZ代码为SVG"""
    json_path = Path(json_path)
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    # 加载JSON
    with open(json_path, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 统计
    total = 0
    success = 0

    # 遍历所有题目
    for question in data.get('questions', []):
        images = question.get('images', [])

        for i, img in enumerate(images):
            if img.get('type') == 'tikz':
                total += 1
                code = img.get('code', '')

                # 生成输出文件名
                qid = question.get('id', 'unknown')
                svg_name = f'{qid}_fig{i}.svg'
                svg_path = output_dir / svg_name

                if tikz_to_svg(code, svg_path):
                    # 更新JSON，将tikz改为svg引用
                    img['type'] = 'svg'
                    img['code'] = svg_path.read_text(encoding='utf-8')
                    success += 1
                    print(f"  [{success}/{total}] {qid} -> {svg_name}")

    # 保存更新后的JSON
    output_json = json_path.parent / f'{json_path.stem}_with_svg.json'
    with open(output_json, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"\n完成: {success}/{total} 个TikZ图形已转换为SVG")
    print(f"输出JSON: {output_json}")
    print(f"SVG文件: {output_dir}")


def main():
    parser = argparse.ArgumentParser(description='TikZ → SVG 编译器')
    parser.add_argument('json', help='包含TikZ代码的JSON文件')
    parser.add_argument('-o', '--output', default='output/svg', help='SVG输出目录')

    args = parser.parse_args()

    check_latex()
    process_json(args.json, args.output)


if __name__ == '__main__':
    main()
