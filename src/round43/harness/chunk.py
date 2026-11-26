# Pull one saved read_file result apart: prints its summary (offset, next_offset) and writes the chunk's text.
import sys, json, re, glob, os
d = '/tmp/claude-tool-results/34dbb022-7c12-5ff5-94bb-6569f461dc94/'
f = sorted(glob.glob(d + 'mcp-claude-artifacts-read_file-*.txt'), key=os.path.getmtime)[-1] if len(sys.argv) < 2 else sys.argv[1]
J = json.load(open(f, encoding='utf-8')); meta = json.loads(J[0]['text']); body = J[1]['text']
m = re.match(r'<(untrusted-document-[0-9a-f]+)>', body); tag = m.group(1); assert body.endswith('</' + tag + '>'), body[-80:]
text = body[len(tag) + 2: -len(tag) - 3]
out = '/home/claude/sr86/work/art41/chunks/c%06d.txt' % meta['offset']; os.makedirs(os.path.dirname(out), exist_ok=True); open(out, 'w', encoding='utf-8', newline='').write(text)
print('offset', meta['offset'], 'next', meta.get('next_offset'), 'lines', text.count('\n') + 1, 'chars', len(text), 'total_lines', meta.get('total_lines'), os.path.basename(f)[-22:])
