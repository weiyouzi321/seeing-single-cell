import subprocess

# Restore
subprocess.run(['git', 'checkout', 'HEAD', '--', 
                '/Users/yiqi/seeing-single-cell/src/app/chapters/2-distribution/page.tsx'],
               capture_output=True, cwd='/Users/yiqi/seeing-single-cell')

path = '/Users/yiqi/seeing-single-cell/src/app/chapters/2-distribution/page.tsx'
with open(path) as f:
    c = f.read()

# Fix 1: Step 2 opening - add <> right after (
old = '      {activeStep === 1 && (\n        <section'
new = '      {activeStep === 1 && (\n        <>\n        <section'
c = c.replace(old, new, 1)

# Fix 2: Step 2 closing - insert </> before the close paren of step2 block
# The pattern is: after QcViz ends, we have:
# ...</div>\n        </section>\n      )}
# We want: ...</div>\n        </section>\n        </>\n      )}
old2 = '          </div>\n        </section>\n      )}\n\n      {/* Step 2 nav buttons */}'
new2 = '          </div>\n        </section>\n        </>\n      )}\n\n      {/* Step 2 nav buttons */}'
c = c.replace(old2, new2, 1)

# Fix 3: Step 3 opening
old3 = '      {activeStep === 2 && (\n        <section'
new3 = '      {activeStep === 2 && (\n        <>\n        <section'
c = c.replace(old3, new3, 1)

# Fix 4: Step 3 closing - insert </> before close paren
old4 = '          </div>\n        </section>\n      )}\n\n      {/* Step 3 nav buttons */}'
new4 = '          </div>\n        </section>\n        </>\n      )}\n\n      {/* Step 3 nav buttons */}'
c = c.replace(old4, new4, 1)

with open(path, 'w') as f:
    f.write(c)

print('✓ Applied 4 fixes to chapter 2')
print('  Fix1: Step 2 opening <>')
print('  Fix2: Step 2 closing </>')
print('  Fix3: Step 3 opening <>')
print('  Fix4: Step 3 closing </>')

# Verify
c2 = open(path).read()
import re
body = c2[c2.find('return ('):c2.rfind('</div>\n  )\n}')]
open_f = body.count('<>')
close_f = body.count('</>')
print('\nFragment tags: <>=%d, </>=%d' % (open_f, close_f))
print('Balance:', 'OK' if open_f == close_f else 'MISMATCH')

blocks = re.findall(r'activeStep === \d+ && \([^)]+\)', body)
print('activeStep conditionals:', len(blocks))
