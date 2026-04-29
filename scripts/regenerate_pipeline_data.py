import json, math, random

# Load new unified data
with open('/Users/yiqi/seeing-single-cell/public/data/pbmc_data.json') as f:
    raw = json.load(f)

expr = raw['expression_matrix']
genes = raw['gene_names']
cells = raw['cell_types']
nC, nG = len(expr), len(genes)

print('Original: %d cells x %d genes' % (nC, nG))

# ============================================
# 1. Generate pbmc_scaled.json (z-score per gene)
# ============================================
means = [sum(expr[i][j] for i in range(nC)) / nC for j in range(nG)]
stds = [math.sqrt(sum((expr[i][j] - means[j])**2 for i in range(nC)) / (nC-1)) if nC > 1 else 1.0 for j in range(nG)]

scaled = []
for i in range(nC):
    row = [(expr[i][j] - means[j]) / stds[j] if stds[j] > 1e-10 else 0.0 for j in range(nG)]
    scaled.append(row)

scaled_obj = {
    'expression_matrix': scaled,
    'gene_names': genes,
    'cell_types': cells
}
with open('/Users/yiqi/seeing-single-cell/public/data/pbmc_scaled.json', 'w') as f:
    json.dump(scaled_obj, f)
print('✓ pbmc_scaled.json written: %d genes' % len(genes))


# ============================================
# 2. Generate pbmc_pca.json (power iteration PCA)
# ============================================
def compute_pca(data, n_comp=10):
    n, p = len(data), len(data[0])
    # Covariance
    cov = [[0.0]*p for _ in range(p)]
    for i in range(p):
        for j in range(i, p):
            s = sum(data[k][i] * data[k][j] for k in range(n))
            c = s / (n-1)
            cov[i][j] = cov[j][i] = c

    evecs, evals = [], []
    mat = [r[:] for r in cov]
    for c in range(min(n_comp, p)):
        vec = [random.random() - 0.5 for _ in range(p)]
        nm = math.sqrt(sum(v*v for v in vec))
        vec = [v/nm for v in vec]
        for it in range(300):
            nv = [0.0]*p
            for i in range(p):
                for j in range(p):
                    nv[i] += mat[i][j] * vec[j]
            nm = math.sqrt(sum(v*v for v in nv))
            if nm < 1e-12: break
            vec = [v/nm for v in nv]
        # Rayleigh quotient
        ev = sum(vec[i] * sum(mat[i][j]*vec[j] for j in range(p)) for i in range(p))
        ev = max(0.0, ev)
        evecs.append(vec)
        evals.append(ev)
        # Deflate
        for i in range(p):
            for j in range(p):
                mat[i][j] -= ev * vec[i] * vec[j]

    # Sort descending
    pairs = sorted(zip(evals, evecs), reverse=True)
    evals_sorted = [p[0] for p in pairs]
    evecs_sorted = [p[1] for p in pairs]

    projected = [[sum(evecs_sorted[pc][j] * row[j] for j in range(p)) for pc in range(len(evecs_sorted))] for row in data]

    return {'projected': projected, 'evals': evals_sorted, 'loadings': evecs_sorted, 'cov': cov}

pca_res = compute_pca(scaled, n_comp=10)
total_var = sum(pca_res['evals'])
pca_obj = {
    'projected': pca_res['projected'],
    'variance_ratio': [v / total_var for v in pca_res['evals']],
    'gene_names': genes,
    'cell_types': cells,
    'cov': pca_res['cov'],
    'loadings': pca_res['loadings'],
    'evals': pca_res['evals']
}
with open('/Users/yiqi/seeing-single-cell/public/data/pbmc_pca.json', 'w') as f:
    json.dump(pca_obj, f)
print('✓ pbmc_pca.json written: %d PCs' % len(pca_res['projected'][0]))


# ============================================
# 3. Generate pbmc_dimred.json
# Use top 2 principal components as t-SNE/UMAP stand-ins
# ============================================
top2_pc = [[row[0], row[1]] for row in pca_res['projected']]
dimred_obj = {
    'tsne': top2_pc,
    'umap': top2_pc,
    'cell_types': cells
}
with open('/Users/yiqi/seeing-single-cell/public/data/pbmc_dimred.json', 'w') as f:
    json.dump(dimred_obj, f)
print('✓ pbmc_dimred.json written: top-2 PC projection')

print('\n✅ All data files synchronized! ✅')
