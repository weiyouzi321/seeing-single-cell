import json

def check(name, path, expected_genes=24, expected_cells=300):
    d = json.load(open(path))
    genes = d.get('gene_names', [])
    em = d.get('expression_matrix', []) or d.get('projected', []) or []
    ng = len(genes)
    nc = len(em)
    ok = 'OK' if ng == expected_genes and nc == expected_cells else 'FAIL'
    print('%s %s: genes=%d cells=%d (expected genes=%d cells=%d)' % (ok, name, ng, nc, expected_genes, expected_cells))
    if ng != expected_genes:
        print('  Gene mismatch! Got:', genes[:5])

base = '/Users/yiqi/seeing-single-cell/public/data'
check('pbmc_data', base + '/pbmc_data.json')
check('pbmc_scaled', base + '/pbmc_scaled.json')
check('pbmc_pca', base + '/pbmc_pca.json')
check('pbmc_dimred', base + '/pbmc_dimred.json')

g_sets = []
for fname in ['pbmc_data.json', 'pbmc_scaled.json', 'pbmc_pca.json']:
    d = json.load(open(base + '/' + fname))
    g_sets.append(set(d.get('gene_names', [])))

if g_sets[0] == g_sets[1] == g_sets[2]:
    print('\nOK All gene sets identical across data files!')
    print('  Genes:', sorted(g_sets[0]))
else:
    print('\nFAIL GENE SET MISMATCH!')
    for i, s in enumerate(g_sets):
        print('  File %d unique: %s' % (i+1, s - g_sets[(i+1)%len(g_sets)]))
