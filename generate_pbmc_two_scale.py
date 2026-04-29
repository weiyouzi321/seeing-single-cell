#!/usr/bin/env python3
"""
Seeing Single-Cell - PBMC 两套数据集生成器 (v4 - 完整流程)

数据架构:
1. 大数据集 (300×2000): QC、预处理、PCA、KNN、DimRed
   - 2000 基因包含: 40 core + 1976 extended
   - 所有计算 (PCA/KNN) 在 200 HVG 子集上进行以保证性能

2. 小矩阵 (100×50): MatrixViz 表达矩阵可视化

生成文件 (public/data/):
  [大数据 300×2000]
  - pbmc_data.json          - 原始计数
  - pbmc_norm.json          - log1p(TP10K)
  - pbmc_scaled.json        - z-score standardized (2000 genes)

  [HVG 子集 300×200]
  - pbmc_hvg.json           - log-normalized HVG
  - pbmc_hvg_scaled.json    - z-score standardized HVG (KNN/PCA input)
  - pbmc_knn.json           - PCA projection + KNN graph
  - pbmc_pca.json           - PCA results (on HVG scaled)
  - pbmc_dimred.json        - UMAP/t-SNE (on HVG scaled)

  [小矩阵 100×50]
  - pbmc_data_small.json    - 随机降采样的表达矩阵

  [统计]
  - pbmc_stats.json
"""

import json, random, numpy as np
from pathlib import Path
from numpy.linalg import svd
from sklearn.neighbors import NearestNeighbors

# ─── 配置 ──────────────────────────────────────────────────────────────
N_CELLS_BIG = 300
N_CELLS_SMALL = 100
N_GENES_TARGET = 2000
N_HVG = 200
N_PCS = 10
K_NEIGHBORS = 10

output_dir = Path('/Users/yiqi/seeing-single-cell/public/data')
output_dir.mkdir(parents=True, exist_ok=True)

# ─── 基因池 ────────────────────────────────────────────────────────────
# 构建 2000 唯一基因: 40 core + 30 ext marker + 30 ext HK + 770 common + 1130 rare
import string

def make_gene_name():
    return 'GENE_' + ''.join(random.choices(string.ascii_uppercase, k=4))

CORE_GENES_24 = [f"MG{i:03d}" for i in range(40)]  # marker genes
MARKER_GENES = {ct: [] for ct in ['CD4 T','CD8 T','B','Monocyte','NK','DC','Platelet']}

EXT_MARKER = [f"XM{i:03d}" for i in range(30)]   # extended marker
EXT_HOUSEKEEPING = [f"HK{i:03d}" for i in range(30)]  # housekeeping
FAKE_COMMON = [f"CM{i:03d}" for i in range(770)]  # common
FAKE_RARE = [f"RM{i:03d}" for i in range(1130)]   # rare

ALL_GENES = CORE_GENES_24 + EXT_MARKER + EXT_HOUSEKEEPING + FAKE_COMMON + FAKE_RARE
print(f"基因池: {len(ALL_GENES)} 唯一基因")
assert len(ALL_GENES) == N_GENES_TARGET, f"基因数不等于 {N_GENES_TARGET}"

# ─── 生成模拟表达矩阵 ───────────────────────────────────────────────────
np.random.seed(42)
random.seed(42)

cells_big = [f"Cell_{i:03d}" for i in range(N_CELLS_BIG)]
cells_small = random.sample(cells_big, N_CELLS_SMALL)

# 细胞类型分配
cell_types_pool = ['CD4 T', 'CD8 T', 'B', 'Monocyte', 'NK', 'DC', 'Platelet']
cell_types_big = [random.choice(cell_types_pool) for _ in range(N_CELLS_BIG)]

# 构建基因表达模式
gene_params = {}
for gi, gene in enumerate(ALL_GENES):
    base = np.random.gamma(2.5, 4)
    ct_specific = {}
    for ct in cell_types_pool:
        # 前40个基因作为 marker，每个细胞类型偏爱其中一部分
        if gi < 40:
            # 分配 marker: MG00-MG09 → CD4 T, MG10-MG19 → CD8 T, ...
            markers_per_ct = 40 // len(cell_types_pool)
            idx_start = cell_types_pool.index(ct) * markers_per_ct
            idx_end = idx_start + markers_per_ct
            if idx_start <= gi < idx_end:
                ct_specific[ct] = np.random.uniform(8, 15)  # marker high
            else:
                ct_specific[ct] = np.random.uniform(0, 2)
        elif 40 <= gi < 70:  # EXT_MARKER
            ct_specific[ct] = np.random.uniform(4, 10) if random.random() < 0.2 else np.random.uniform(0, 4)
        elif 70 <= gi < 100:  # EXT_HOUSEKEEPING
            ct_specific[ct] = np.random.uniform(3, 8)  # moderately expressed
        elif 100 <= gi < 870:  # COMMON
            ct_specific[ct] = np.random.uniform(0, 4)
        else:  # RARE
            ct_specific[ct] = np.random.uniform(0, 1) if random.random() < 0.1 else 0
    gene_params[gene] = {'base': base, 'ct_specific': ct_specific}

# 生成矩阵
def make_matrix(cell_list):
    mat = np.zeros((len(cell_list), N_GENES_TARGET), dtype=np.float32)
    for i, cell in enumerate(cell_list):
        ct = cell_types_big[cells_big.index(cell)]
        for j, gene in enumerate(ALL_GENES):
            base = gene_params[gene]['base']
            ct_factor = gene_params[gene]['ct_specific'][ct]
            mu = base * ct_factor
            # 负二项式噪声
            phi = np.random.uniform(0.1, 0.5)
            var = mu + mu**2 / phi
            mat[i, j] = max(0, np.random.normal(mu, np.sqrt(var)))
    return mat

matrix_big = make_matrix(cells_big)
matrix_small = make_matrix(cells_small)

# ─── 归一化 ────────────────────────────────────────────────────────────
# CPM → log1p
tpm_big = matrix_big / matrix_big.sum(axis=1, keepdims=True) * 1e4
matrix_norm = np.log1p(tpm_big)

tpm_small = matrix_small / matrix_small.sum(axis=1, keepdims=True) * 1e4
matrix_small_norm = np.log1p(tpm_small)

# z-score standardization
matrix_scaled = (matrix_norm - matrix_norm.mean(axis=0)) / (matrix_norm.std(axis=0) + 1e-8)

matrix_small_scaled = (matrix_small_norm - matrix_norm.mean(axis=0)) / (matrix_norm.std(axis=0) + 1e-8)

# ─── HVG 选择 ──────────────────────────────────────────────────────────
gene_variances = matrix_norm.var(axis=0)
hvg_idx = np.argsort(-gene_variances)[:N_HVG].tolist()
hvg_genes = [ALL_GENES[i] for i in hvg_idx]

# HVG matrices
hvg_matrix_norm = matrix_norm[:, hvg_idx]           # log-normalized
hvg_matrix_scaled = matrix_scaled[:, hvg_idx]       # z-score scaled

# HVG small
hvg_small_norm = matrix_small_norm[:, hvg_idx]
hvg_small_scaled = matrix_small_scaled[:, hvg_idx]

# ─── PCA (on HVG scaled) ───────────────────────────────────────────────
centered = hvg_matrix_scaled - hvg_matrix_scaled.mean(axis=0)
U, S, Vt = svd(centered, full_matrices=False)
projected = U[:, :N_PCS] * S[:N_PCS]
pca_evals = (S**2).tolist()
pca_varexp = (S**2 / np.sum(S**2))[:N_PCS].tolist()

# ─── KNN (on PCA projected) ───────────────────────────────────────────
nbrs = NearestNeighbors(n_neighbors=K_NEIGHBORS+1, algorithm='auto').fit(projected)
distances, indices = nbrs.kneighbors(projected)
knn_adj = []
for i in range(N_CELLS_BIG):
    knn_adj.append([int(indices[i, j]) for j in range(1, K_NEIGHBORS+1)])
knn_edges = []
for i, nbrs_list in enumerate(knn_adj):
    for j in nbrs_list:
        if i < j:
            knn_edges.append([int(i), int(j)])

# ─── DimRed (umap & tsne - 使用预计算投影 + 后处理) ───────────────────
# 简化: 在前2个PC上应用t-SNE风格的扰动
from numpy.random import randn
coords = projected[:, :2] + randn(N_CELLS_BIG, 2) * 0.5
dimred = {'tsne': coords.tolist(), 'umap': coords.tolist()}

# ─── 保存文件 ──────────────────────────────────────────────────────────
def save(name, data):
    with open(output_dir / name, 'w') as f:
        json.dump(data, f, indent=2)
    print(f"   ✓ {name}")

# 1. 大数据 (原始)
save('pbmc_data.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'n_genes': N_GENES_TARGET,
                 'description': 'Extended PBMC (300×2000) - raw counts'},
    'gene_names': ALL_GENES,
    'cell_types': cell_types_big,
    'expression_matrix': matrix_big.astype(int).tolist()
})

# 2. 大数据 (log-normalized)
save('pbmc_norm.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'n_genes': N_GENES_TARGET,
                 'description': 'Log-normalized (log1p(TP10K))'},
    'gene_names': ALL_GENES,
    'cell_types': cell_types_big,
    'expression_matrix': matrix_norm.tolist()
})

# 3. 大数据 (z-score scaled)
save('pbmc_scaled.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'n_genes': N_GENES_TARGET,
                 'description': 'Z-score standardized'},
    'gene_names': ALL_GENES,
    'cell_types': cell_types_big,
    'expression_matrix': matrix_scaled.tolist()
})

# 4. 小矩阵 (原始)
cell_types_small = [cell_types_big[cells_big.index(c)] for c in cells_small]
save('pbmc_data_small.json', {
    'metadata': {'n_cells': N_CELLS_SMALL, 'n_genes': 50,
                 'description': 'Subsampled matrix for MatrixViz (100×50)'},
    'gene_names': ALL_GENES[:50],
    'cell_types': cell_types_small,
    'expression_matrix': matrix_small[:, :50].astype(int).tolist()
})

# 5. HVG (log-normalized)
save('pbmc_hvg.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'n_genes': N_HVG,
                 'description': '200 HVG (log-normalized)'},
    'gene_names': hvg_genes,
    'cell_types': cell_types_big,
    'expression_matrix': hvg_matrix_norm.tolist(),
    'hvg_indices': hvg_idx
})

# 6. HVG scaled (for KNN)
save('pbmc_hvg_scaled.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'n_genes': N_HVG,
                 'description': '200 HVG (z-score scaled) - for KNN/PCA'},
    'gene_names': hvg_genes,
    'cell_types': cell_types_big,
    'expression_matrix': hvg_matrix_scaled.tolist(),
    'hvg_indices': hvg_idx
})

# 7. PCA
save('pbmc_pca.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'n_genes': N_HVG, 'n_components': N_PCS},
    'gene_names': hvg_genes,
    'cell_types': cell_types_big,
    'projected': projected.tolist(),
    'variance_ratio': pca_varexp,
    'evals': pca_evals,
    'loadings': Vt[:N_PCS, :].tolist(),
    'cov': np.cov(centered.T).tolist()
})

# 8. KNN
save('pbmc_knn.json', {
    'metadata': {'n_cells': N_CELLS_BIG, 'k': K_NEIGHBORS},
    'projected': projected.tolist(),
    'knn_adj': knn_adj,
    'knn_edges': knn_edges,
    'cell_types': cell_types_big
})

# 9. DimRed
save('pbmc_dimred.json', {
    'metadata': {'n_cells': N_CELLS_BIG},
    'cell_types': cell_types_big,
    'tsne': coords.tolist(),
    'umap': coords.tolist()
})

# 10. Stats
save('pbmc_stats.json', {
    'statistics': {
        'total_umis': int(matrix_big.sum()),
        'median_umis_per_cell': int(np.median(matrix_big.sum(axis=1))),
        'median_genes_per_cell': int(np.median((matrix_big > 0).sum(axis=1))),
        'pct_mito_median': 5.2  # 模拟值
    }
})

print("\n✅ 所有数据文件生成完成!")
print(f"\n数据源总结:")
print(f"  Ch1 MatrixViz:    pbmc_data_small.json (100×50)")
print(f"  Ch2 QcViz:        pbmc_data.json (300×2000) + qc_metrics")
print(f"  Ch3 Preprocessing: pbmc_data.json → norm/scaled + HVG (200)")
print(f"  Ch4 PCA:          pbmc_scaled.json + pbmc_pca.json")
print(f"  Ch5 KNN:          pbmc_hvg_scaled.json + pbmc_knn.json")
print(f"  Ch6 DimRed:       pbmc_scaled.json + pbmc_dimred.json")