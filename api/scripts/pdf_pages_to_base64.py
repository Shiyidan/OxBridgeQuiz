"""将PDF每页转为base64 PNG，输出JSON给Node.js调用"""
import fitz
import base64
import json
import sys

def main():
    pdf_path = sys.argv[1]
    doc = fitz.open(pdf_path)
    pages = []

    # 只处理首页到有题目的页面（跳过封面空白页）
    processed = 0
    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text().strip()
        # 跳过前两页封面/目录
        if i < 2 and len(text) < 100:
            continue
        pix = page.get_pixmap(matrix=fitz.Matrix(1, 1))
        png = pix.tobytes('png')
        b64 = base64.b64encode(png).decode()
        pages.append({"page": i + 1, "base64": b64})
        processed += 1
        if processed >= 8:  # 最多8页，覆盖前10道题足够
            break

    doc.close()
    print(json.dumps(pages))

if __name__ == '__main__':
    main()
