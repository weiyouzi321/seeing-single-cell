#!/usr/bin/env python3
"""Fix Chapter 2 JSX structure by merging content+nav for Step 1 and Step 2."""

import re, sys

path = '/Users/yiqi/seeing-single-cell/src/app/chapters/2-distribution/page.tsx'

with open(path) as f:
    content = f.read()

# Find return block
ret_start = content.find('return (')
if ret_start == -1:
    print('ERROR: no return ( found')
    sys.exit(1)

# The return body includes the opening ( and ends before </div>\n  )\n}
ret_body = content[ret_start + len('return ('):content.rfind('</div>\n  )\n}')]

print('Return body loaded, length:', len(ret_body))

# ---- Step 0 (already correct, trimmable) ----
# Find its end: it ends with </>)\n\n
s0_end_match = re.search(r'\{activeStep === 0 && \([\s\S]*?</>)\s*\n\s*\n', ret_body)
if not s0_end_match:
    print('ERROR: Step 0 not found')
    sys.exit(1)
s0_block = s0_end_match.group(0).rstrip()
print('Step 0 OK')

# ---- Step 1 content (activeStep === 1 && ( <section... </section> )) ----
step1_content_match = re.search(r'\{activeStep === 1 && \(\s*\n\s*<section[\s\S]*?</section>\s*\n\s*\)\}', ret_body)
if not step1_content_match:
    print('ERROR: Step 1 content not found')
    sys.exit(1)

# ---- Step 1 nav (independent) ----
# This nav belongs to step 1 but is placed after step 2 content!
# Find it by its comment or by matching activeStep 1 && ( <div... )
step1_nav_match = re.search(r'\{activeStep === 1 && \(\s*\n\s*<div className="flex justify-between[\s\S]*?</div>\s*\n\s*\)\}', ret_body)
if not step1_nav_match:
    print('ERROR: Step 1 nav not found')
    sys.exit(1)

# ---- Step 2 content (activeStep === 2 && ( <section... </section> )) ----
step2_content_match = re.search(r'\{activeStep === 2 && \(\s*\n\s*<section[\s\S]*?</section>\s*\n\s*\)\}', ret_body)
if not step2_content_match:
    print('ERROR: Step 2 content not found')
    sys.exit(1)

# ---- Step 2 nav (independent) ----
step2_nav_match = re.search(r'\{activeStep === 2 && \(\s*\n\s*<div className="flex justify-between[\s\S]*?</div>\s*\n\s*\)\}', ret_body)
if not step2_nav_match:
    print('ERROR: Step 2 nav not found')
    sys.exit(1)

# ---- Step 3 (already correct) ----
step3_match = re.search(r'\{activeStep === 3 && \(\s*\n\s*<>[\s\S]*?</>)\s*\n\s*\)\}', ret_body)
if not step3_match:
    print('ERROR: Step 3 not found')
    sys.exit(1)
s3_block = step3_match.group(0).rstrip()

print('All blocks identified:')
print('  Step 1 content at', step1_content_match.start(), '-', step1_content_match.end())
print('  Step 1 nav    at', step1_nav_match.start(), '-', step1_nav_match.end())
print('  Step 2 content at', step2_content_match.start(), '-', step2_content_match.end())
print('  Step 2 nav    at', step2_nav_match.start(), '-', step2_nav_match.end())
print('  Step 3        at', step3_match.start(), '-', step3_match.end())

# === BUILD CORRECTED STEP 1 ===
s1_content_inner = step1_content_match.group(0)[len('{activeStep === 1 && ('):].rstrip()[:-1].rstrip()  # drop outer
s1_nav_inner = step1_nav_match.group(0)[len('{activeStep === 1 && ('):].rstrip()[:-1].rstrip()

step1_correct = '      {activeStep === 1 && (\n        <>\n' + \
                s1_content_inner + '\n' + \
                '        ' + s1_nav_inner + '\n' + \
                '        </>\n      )}'

# === BUILD CORRECTED STEP 2 ===
s2_content_inner = step2_content_match.group(0)[len('{activeStep === 2 && ('):].rstrip()[:-1].rstrip()
s2_nav_inner = step2_nav_match.group(0)[len('{activeStep === 2 && ('):].rstrip()[:-1].rstrip()

step2_correct = '      {activeStep === 2 && (\n        <>\n' + \
                s2_content_inner + '\n' + \
                '        ' + s2_nav_inner + '\n' + \
                '        </>\n      )}'

# === BUILD NEW RETURN BODY ===
# Order: Step 0, Step 1, Step 2, Step 3
# Remove all old blocks from ret_body and insert corrected ones
# We'll rebuild by taking segments between blocks

# Build replacement map: replace each OLD block with its corrected counterpart
# Map old block start->new block
# Layer 1 blocks (that we replace):
# - step1_content → step1_correct
# - step1_nav → REMOVED (merged)
# - step2_content → step2_correct
# - step2_nav → REMOVED (merged)
# step3 block stays in place

# Strategy: build new_body by concatenating pieces
pieces = []

# Piece 1: from start to start of step1 content (after step0)
pieces.append(ret_body[:step1_content_match.start()])

# Piece 2: corrected step1
pieces.append(step1_correct)

# Piece 3: between step1 nav end and step2 content start
# That is: step2 content starts after step1 nav in the old body
pieces.append(ret_body[step1_nav_match.end():step2_content_match.start()])

# Piece 4: corrected step2
pieces.append(step2_correct)

# Piece 5: between step2 nav end and step3 start
pieces.append(ret_body[step2_nav_match.end():step3_match.start()])

# Piece 6: step3 (kept as-is)
pieces.append(s3_block)

# Piece 7: rest after step3
pieces.append(ret_body[step3_match.end():])

new_body = '\n\n'.join(pieces)

# Reassemble file
new_file = content[:ret_start + len('return (')] + '\n' + new_body + '\n' + content[content.rfind('</div>\n  )\n}'):]

with open(path, 'w') as f:
    f.write(new_file)

print('✓ Chapter 2 structure rewritten')
print('New body blocks count: step0+step1+step2+step3')

# Verify
c2 = open(path).read()
body2 = c2[c2.find('return ('):c2.rfind('</div>\n  )\n}')]
f_open = body2.count('<>')
f_close = body2.count('</>')
print('Fragment balance: <> = %d, </> = %d %s' % (f_open, f_close,
      '✓' if f_open == f_close else '✗ MISMATCH'))

# Count activeStep conditionals
conditions = re.findall(r'activeStep === \d+ &&', body2)
print('Total activeStep conditionals:', len(conditions))
