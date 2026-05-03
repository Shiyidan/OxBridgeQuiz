"""
从PDF中提取图形区域为高分辨率图片
PyMuPDF 按坐标区域渲染，与原图1:1还原
"""

import fitz
from pathlib import Path
import argparse


def extract_images_from_pdf(pdf_path: str, output_dir: str, dpi: int = 300):
    """从PDF中提取所有图片（包括图形）"""
    doc = fitz.open(pdf_path)
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    result = []
    scale = dpi / 72  # PDF默认72dpi，转换到目标dpi

    for page_num in range(len(doc)):
        page = doc[page_num]

        # 方法1：提取嵌入的图片对象
        images = page.get_images(full=True)
        for img_idx, img in enumerate(images):
            xref = img[0]
            base = doc.extract_image(xref)
            if base:
                name = f"p{page_num+1}_img{img_idx+1}.{base['ext']}"
                path = output / name
                with open(path, 'wb') as f:
                    f.write(base['image'])
                result.append({
                    'page': page_num + 1,
                    'file': name,
                    'path': str(path),
                    'size': base['width'],
                    'type': 'embedded'
                })

        # 方法2：检测图形区域并截图
        drawings = page.get_drawings()
        if drawings:
            # 找到所有绘图的包围盒
            for draw_idx, drawing in enumerate(drawings):
                rect = drawing['rect']
                # 扩大一点边距
                margin = 10
                clip = fitz.Rect(
                    rect.x0 - margin,
                    rect.y0 - margin,
                    rect.x1 + margin,
                    rect.y1 + margin
                )
                # 确保裁剪区域在页面内
                clip.intersect(page.rect)

                if clip.width > 20 and clip.height > 20:  # 过滤太小的
                    mat = fitz.Matrix(scale, scale)
                    pix = page.get_pixmap(matrix=mat, clip=clip)
                    name = f"p{page_num+1}_draw{draw_idx+1}.png"
                    path = output / name
                    pix.save(str(path))

                    result.append({
                        'page': page_num + 1,
                        'file': name,
                        'path': str(path),
                        'width': pix.width,
                        'height': pix.height,
                        'type': 'drawing_screenshot',
                        'bbox': [clip.x0, clip.y0, clip.x1, clip.y1]
                    })

        # 方法3：整页渲染（用于备份）
        mat = fitz.Matrix(scale, scale)
        pix = page.get_pixmap(matrix=mat)
        name = f"p{page_num+1}_full.png"
        path = output / name
        pix.save(str(path))
        result.append({
            'page': page_num + 1,
            'file': name,
            'path': str(path),
            'type': 'full_page'
        })

    doc.close()

    # 打印结果
    embedded = [r for r in result if r['type'] == 'embedded']
    drawings = [r for r in result if r['type'] == 'drawing_screenshot']
    full = [r for r in result if r['type'] == 'full_page']

    print(f"提取完成：")
    print(f"  嵌入图片: {len(embedded)} 个")
    print(f"  图形截图: {len(drawings)} 个")
    print(f"  整页渲染: {len(full)} 个")
    print(f"  输出目录: {output}")

    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='从PDF提取图形为高清图片')
    parser.add_argument('pdf', help='PDF文件路径')
    parser.add_argument('-o', '--output', default='output/images', help='输出目录')
    parser.add_argument('--dpi', type=int, default=300, help='输出DPI (默认300)')

    args = parser.parse_args()
    extract_images_from_pdf(args.pdf, args.output, args.dpi)
