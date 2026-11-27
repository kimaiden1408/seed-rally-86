# tile pictures into one sheet: sheet.py OUT.jpg COLS W H file...
import sys
from PIL import Image
out, cols, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), int(sys.argv[4]); files = sys.argv[5:]
rows = (len(files) + cols - 1) // cols; S = Image.new('RGB', (cols * w, rows * h), 'white')
for k, f in enumerate(files): S.paste(Image.open(f).resize((w, h)), ((k % cols) * w, (k // cols) * h))
S.save(out, quality=86)
