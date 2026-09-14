"""Generate REAL precomputed dimensionality-reduction data for chapter 6.

Reads pbmc_scaled.json (300 cells x 2000 genes, z-scored) and computes:
  - PCA (10 components) — input space for t-SNE/UMAP, plus PC1/PC2 for display
  - t-SNE (sklearn, perplexity=30, seed 42)
  - UMAP (umap-learn, n_neighbors=15, min_dist=0.1, seed 42)

Output format matches what the DimRedViz component consumes:
  number[][] (arrays of [x, y]), NOT {x, y} objects (which was the old bug).
"""
import json
import numpy as np
from sklearn.decomposition import PCA
from sklearn.manifold import TSNE
import umap

X = np.array(json.load(open('public/data/pbmc_scaled.json'))['expression_matrix'], dtype=np.float64)
cell_types = json.load(open('public/data/pbmc_scaled.json'))['cell_types']
print('matrix:', X.shape)

pca10 = PCA(n_components=10, random_state=42).fit_transform(X)
print('pca10:', pca10.shape, '| explained var:', PCA(n_components=10, random_state=42).fit(X).explained_variance_ratio_[:3].round(3))

tsne = TSNE(n_components=2, perplexity=30, learning_rate='auto', init='pca',
            random_state=42, max_iter=1500).fit_transform(pca10)
print('tsne:', tsne.shape)

emb = umap.UMAP(n_neighbors=15, min_dist=0.1, n_components=2, random_state=42)
umap_xy = emb.fit_transform(pca10)
print('umap:', umap_xy.shape)

def r2(a, nd=4):
    return [[round(float(v), nd) for v in row] for row in a]

out = {
    'metadata': {
        'n_cells': int(X.shape[0]),
        'methods': ['pca', 'tsne', 'umap'],
        'description': 'Real PCA(10) / t-SNE / UMAP computed offline from pbmc_scaled (sklearn 1.9 + umap-learn 0.5), seeded',
        'pca_input': '300x2000 z-scored matrix, 10 PCs',
        'tsne_params': {'perplexity': 30, 'seed': 42},
        'umap_params': {'n_neighbors': 15, 'min_dist': 0.1, 'seed': 42},
    },
    'cell_types': cell_types,
    'pca': r2(pca10),
    'tsne': r2(tsne),
    'umap': r2(umap_xy),
}
json.dump(out, open('public/data/pbmc_dimred.json', 'w'), separators=(',', ':'))
import os
print('written:', os.path.getsize('public/data/pbmc_dimred.json'), 'bytes')

# sanity: separation between methods (must NOT be identical — old bug)
a, b = np.array(out['tsne']), np.array(out['umap'])
print('tsne vs umap identical?', np.allclose(a, b))
print('tsne range:', a.min(0).round(2), a.max(0).round(2))
print('umap range:', b.min(0).round(2), b.max(0).round(2))
