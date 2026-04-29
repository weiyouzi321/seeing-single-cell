import json
files = {
    'pbmc_scaled.json': '/Users/yiqi/seeing-single-cell/public/data/pbmc_scaled.json',
    'pbmc_pca.json': '/Users/yiqi/seeing-single-cell/public/data/pbmc_pca.json',
    'pbmc_dimred.json': '/Users/yiqi/seeing-single-cell/public/data/pbmc_dimred.json',
}
for name, path in files.items():
    d = json.load(open(path))
    print('\n' + name + ':')
    print('  Keys:', list(d.keys()))
    if 'expression_matrix' in d:
        print('  Shape: %d x %d' % (len(d['expression_matrix']), len(d['expression_matrix'][0])))
    if 'projected' in d:
        print('  Projected: %d x %d' % (len(d['projected']), len(d['projected'][0])))
    if 'gene_names' in d:
        print('  Genes:', len(d['gene_names']), d['gene_names'][:5], '...')
    if 'tsne' in d:
        print('  t-SNE: %d x %d' % (len(d['tsne']), len(d['tsne'][0])))
    if 'umap' in d:
        print('  UMAP: %d x %d' % (len(d['umap']), len(d['umap'][0])))
