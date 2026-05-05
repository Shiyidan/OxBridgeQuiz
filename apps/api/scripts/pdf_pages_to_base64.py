"""将PDF每页转为base64 PNG，输出JSON给Node.js调用"""
import fitz
import base64
import json
import sys

def main():
    pdf_path = sys.argv[1]
    doc = fitz.open(pdf_path)
    pages = []

    for i in range(min(len(doc), 10)):
        page = doc[i]
        pix = page.get_pixmap(matrix=fitz.Matrix(1, 1))
        png = pix.tobytes('png')
        b64 = base64.b64encode(png).decode()
        pages.append({"page": i + 1, "base64": b64})

    doc.close()
    print(json.dumps(pages))

if __name__ == '__main__':
    main()
