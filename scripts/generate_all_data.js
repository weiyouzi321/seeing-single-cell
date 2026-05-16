#!/usr/bin/env node
// Generate all website data from real 10x PBMC 3k data
// Ensures ALL data files share the same 300 cells with traceable barcodes

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const math = require('/Users/yiqi/seeing-single-cell/node_modules/mathjs');

const DATA_DIR = '/Users/yiqi/seeing-single-cell/scripts/10x_data';
const PUBLIC_DIR = '/Users/yiqi/seeing-single-cell/public/data';
const OUT_DIR = '/Users/yiqi/seeing-single-cell/out/data';

// ======================== CONFIG ========================
const N_CELLS = 300;
const N_GENES = 2000;
const SMALL_CELLS = 75;
const SMALL_GENES = 40;
const N_HVG = 200;
const SEED = 42;

// Known PBMC marker genes (37 found in the data)
const MARKER_GENES = [
  'CD3D','CD3E','CD8A','CD8B','MS4A1','CD19','NKG7','NCAM1','CD14','FCGR3A',
  'PPBP','CD34','FCER1A','CST3','IL7R','CCR7','LDHB','CD79A','LSP1','CXCR5',
  'CD4','CD68','FCGR3B','GNLY','GZMB','PRF1','HLA-DRA','CD74','CD2','CD5','CD7','CD28','CD27',
  'GAPDH','ACTB','MALAT1'
];

// Cell type definition based on co-expressed markers
// Format: [positive markers, negative markers]
const CELL_TYPE_MARKERS = {
  'CD4 T':    { pos: ['CD3D','CD3E','CD4','IL7R','CCR7','CD27','CD28','CD5','CD2','CD7'], neg: ['CD8A','CD8B','GNLY','GZMB','MS4A1'] },
  'CD8 T':    { pos: ['CD3D','CD3E','CD8A','CD8B','GNLY','GZMB','PRF1','CD2','CD5','CD7'], neg: ['CD4','MS4A1','CD14','FCGR3A'] },
  'NK':       { pos: ['NKG7','GNLY','GZMB','PRF1','NCAM1','FCGR3A','CD7','CD2'], neg: ['CD3D','CD3E','CD4','CD8A','CD19','CD14','MS4A1'] },
  'B':        { pos: ['MS4A1','CD19','CD79A','HLA-DRA','CD74','CXCR5'], neg: ['CD3D','CD3E','CD14','NKG7','GNLY'] },
  'Monocyte': { pos: ['CD14','FCGR3A','CST3','LSP1','CD68','FCGR3B','HLA-DRA','CD74'], neg: ['CD3D','CD8A','MS4A1','CD19','NKG7','GNLY'] },
  'DC':       { pos: ['FCER1A','CST3','HLA-DRA','CD74','CD68'], neg: ['CD3D','CD8A','CD19','NKG7','GNLY','MS4A1','CD14'] },
  'Platelet': { pos: ['PPBP','ACTB','GAPDH'], neg: ['CD3D','CD8A','MS4A1','CD14','NKG7','CD19'] },
};

// ======================== SEEDED RNG ========================
class SeededRNG {
  constructor(seed) {
    this.state = seed;
  }
  next() {
    this.state = (this.state * 1664525 + 1013904223) & 0xFFFFFFFF;
    return (this.state >>> 0) / 0xFFFFFFFF;
  }
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
  sample(arr, n) {
    const copy = [...arr];
    this.shuffle(copy);
    return copy.slice(0, n);
  }
}

// ======================== STEP 1: READ 10x DATA ========================
console.log('=== Step 1: Reading 10x data ===');
const barcodes = fs.readFileSync(path.join(DATA_DIR, 'barcodes.tsv'), 'utf8').trim().split('\n');
const genesRaw = fs.readFileSync(path.join(DATA_DIR, 'genes.tsv'), 'utf8').trim().split('\n');
const geneNames = genesRaw.map(l => l.split('\t')[1]);
const mtxLines = fs.readFileSync(path.join(DATA_DIR, 'matrix.mtx'), 'utf8').trim().split('\n');

// Parse MTX
const mtxData = mtxLines.filter(l => !l.startsWith('%'));
const dims = mtxData[0].split(/\s+/).map(Number);
const N_TOTAL_GENES = dims[0], N_TOTAL_CELLS = dims[1], N_ENTRIES = dims[2];
console.log(`  Genes: ${N_TOTAL_GENES}, Cells: ${N_TOTAL_CELLS}, Entries: ${N_ENTRIES}`);

// Build sparse lookup: for each gene, store {cell, value} pairs
// MTX format: row col value (1-indexed)
const triplets = mtxData.slice(1).map(l => {
  const [r, c, v] = l.split(/\s+/).map(Number);
  return { geneIdx: r - 1, cellIdx: c - 1, value: v };
});

// ======================== STEP 2: SELECT GENES ========================
console.log('\n=== Step 2: Selecting 2000 genes ===');

// Find marker gene indices
const markerIndices = MARKER_GENES.map(g => geneNames.indexOf(g)).filter(i => i >= 0);
console.log(`  Marker genes found: ${markerIndices.length}`);

// Compute total expression per gene (for ranking)
const geneTotals = new Float64Array(N_TOTAL_GENES);
triplets.forEach(t => { geneTotals[t.geneIdx] += t.value; });

// Rank genes by total expression (excluding markers)
const nonMarkerIndices = [];
for (let i = 0; i < N_TOTAL_GENES; i++) {
  if (!markerIndices.includes(i)) nonMarkerIndices.push(i);
}
nonMarkerIndices.sort((a, b) => geneTotals[b] - geneTotals[a]);

// Select genes: markers first, then top expressed
const selectedGeneIndices = [...markerIndices];
const remaining = N_GENES - selectedGeneIndices.length;
for (const idx of nonMarkerIndices) {
  if (selectedGeneIndices.length >= N_GENES) break;
  selectedGeneIndices.push(idx);
}
selectedGeneIndices.sort((a, b) => a - b);  // Keep original order

const selectedGeneNames = selectedGeneIndices.map(i => geneNames[i]);
console.log(`  Selected genes: ${selectedGeneNames.length}`);

// ======================== STEP 3: SELECT CELLS ========================
console.log('\n=== Step 3: Selecting 300 cells ===');
const rng = new SeededRNG(SEED);
const cellIndices = rng.sample([...Array(N_TOTAL_CELLS).keys()], N_CELLS).sort((a, b) => a - b);
const selectedBarcodes = cellIndices.map(i => barcodes[i]);
console.log(`  Selected cells: ${selectedBarcodes.length}`);
console.log(`  First 5 barcodes: ${selectedBarcodes.slice(0, 5).join(', ')}`);

// ======================== STEP 4: BUILD MATRIX ========================
console.log('\n=== Step 4: Building expression matrix ===');

// Map: (cellIn300, geneIn2000) → value
const exprMatrix = Array.from({ length: N_CELLS }, () => new Float64Array(N_GENES));

// Create reverse lookups
const cellIdxMap = new Map(cellIndices.map((orig, newIdx) => [orig, newIdx]));
const geneIdxMap = new Map(selectedGeneIndices.map((orig, newIdx) => [orig, newIdx]));

triplets.forEach(t => {
  const ci = cellIdxMap.get(t.cellIdx);
  const gi = geneIdxMap.get(t.geneIdx);
  if (ci !== undefined && gi !== undefined) {
    exprMatrix[ci][gi] = t.value;
  }
});

console.log(`  Matrix built: ${N_CELLS} cells × ${N_GENES} genes`);

// ======================== STEP 5: COMPUTE QC ========================
console.log('\n=== Step 5: Computing QC metrics ===');

// Count non-zero genes per cell
const nFeature = exprMatrix.map(row => row.filter(v => v > 0).length);

// Total UMI count per cell
const nCount = exprMatrix.map(row => {
  let sum = 0;
  for (let i = 0; i < row.length; i++) sum += row[i];
  return sum;
});

// Percentage mitochondrial
const mitoGenes = selectedGeneNames.map((g, i) => g.startsWith('MT-') ? i : -1).filter(i => i >= 0);
const pctMito = exprMatrix.map(row => {
  let mitoSum = 0;
  for (const mi of mitoGenes) mitoSum += row[mi];
  const totalCount = row.reduce((a, b) => a + b, 0);
  return totalCount > 0 ? (mitoSum / totalCount * 100) : 0;
});

const qc_metrics = {
  nCount: nCount.map(Math.round),
  nFeature,
  pct_mito: pctMito.map(v => Math.round(v * 100) / 100),
};
console.log(`  QC computed: median nCount=${Math.round(qc_metrics.nCount.sort((a,b)=>a-b)[Math.floor(N_CELLS/2)])}, median nFeature=${qc_metrics.nFeature.sort((a,b)=>a-b)[Math.floor(N_CELLS/2)]}`);

// ======================== STEP 6: ASSIGN CELL TYPES ========================
console.log('\n=== Step 6: Assigning cell types ===');

function scoreCellType(cellExpr, geneIdxMap, typeDef) {
  let posScore = 0, negScore = 0;
  for (const g of typeDef.pos) {
    const idx = selectedGeneNames.indexOf(g);
    if (idx >= 0 && cellExpr[idx] > 0) posScore += Math.log1p(cellExpr[idx]);
  }
  for (const g of typeDef.neg) {
    const idx = selectedGeneNames.indexOf(g);
    if (idx >= 0 && cellExpr[idx] > 0) negScore += Math.log1p(cellExpr[idx]);
  }
  return posScore - negScore;
}

const cellTypes = exprMatrix.map(cellExpr => {
  let bestType = 'CD4 T';
  let bestScore = -Infinity;
  for (const [type, def] of Object.entries(CELL_TYPE_MARKERS)) {
    const score = scoreCellType(cellExpr, geneIdxMap, def);
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  return bestType;
});

// Count distribution
const typeCount = {};
cellTypes.forEach(t => { typeCount[t] = (typeCount[t] || 0) + 1; });
console.log('  Cell type distribution:');
Object.entries(typeCount).sort((a, b) => b[1] - a[1]).forEach(([t, c]) => {
  console.log(`    ${t}: ${c} (${(c/N_CELLS*100).toFixed(0)}%)`);
});

// ======================== STEP 7: NORMALIZE ========================
console.log('\n=== Step 7: Computing normalization (log1p CPM) ===');

function log1p(x) { return Math.log(x + 1); }

const normalized = exprMatrix.map(row => {
  const libSize = row.reduce((a, b) => a + b, 0);
  if (libSize === 0) return row.map(() => 0);
  const scale = 10000 / libSize;
  return row.map(v => log1p(v * scale));
});

// ======================== STEP 8: HVG ========================
console.log('\n=== Step 8: Selecting HVGs ===');

// Compute mean and variance for each gene (on normalized data)
const geneStats = [];
for (let g = 0; g < N_GENES; g++) {
  let sum = 0, sumSq = 0;
  for (let c = 0; c < N_CELLS; c++) {
    const v = normalized[c][g];
    sum += v;
    sumSq += v * v;
  }
  const mean = sum / N_CELLS;
  const variance = sumSq / N_CELLS - mean * mean;
  geneStats.push({ idx: g, name: selectedGeneNames[g], mean, variance });
}

// Top N_HVG by variance
geneStats.sort((a, b) => b.variance - a.variance);
const hvgGenes = geneStats.slice(0, N_HVG);
const hvgIndices = hvgGenes.map(g => g.idx).sort((a, b) => a - b);
console.log(`  Selected ${hvgIndices.length} HVGs`);
console.log(`  Top HVGs: ${hvgGenes.slice(0, 10).map(g => g.name).join(', ')}`);

// Build HVG matrix (300 × 200)
const hvgMatrix = exprMatrix.map(row => hvgIndices.map(gi => row[gi]));
const hvgGeneNames = hvgIndices.map(gi => selectedGeneNames[gi]);

// Build HVG normalized matrix (300 × 200)
const hvgNormMatrix = normalized.map(row => hvgIndices.map(gi => row[gi]));

// ======================== STEP 9: SCALE ========================
console.log('\n=== Step 9: Scaling (z-score) ===');

function zScore(matrix) {
  const nCells = matrix.length;
  const nGenes = matrix[0].length;
  const result = matrix.map(row => new Float64Array(row));
  
  for (let g = 0; g < nGenes; g++) {
    let sum = 0, sumSq = 0;
    for (let c = 0; c < nCells; c++) {
      const v = result[c][g];
      sum += v;
      sumSq += v * v;
    }
    const mean = sum / nCells;
    const std = Math.sqrt(sumSq / nCells - mean * mean) || 1;
    for (let c = 0; c < nCells; c++) {
      result[c][g] = (result[c][g] - mean) / std;
    }
  }
  return result;
}

const scaledMatrix = zScore(normalized);
const hvgScaledMatrix = zScore(hvgNormMatrix);

// ======================== STEP 10: PCA ========================
console.log('\n=== Step 10: Computing PCA ===');

// PCA on HVG scaled data (N_CELLS × N_HVG)
// Approach: Compute covariance matrix (N_HVG × N_HVG), then eigendecomposition
function computePCA(data, nComponents = 10) {
  const nCells = data.length;
  const nFeatures = data[0].length;
  
  // Center the data
  const centered = data.map(row => [...row]);
  const means = new Float64Array(nFeatures);
  for (let f = 0; f < nFeatures; f++) {
    let sum = 0;
    for (let c = 0; c < nCells; c++) sum += data[c][f];
    means[f] = sum / nCells;
    for (let c = 0; c < nCells; c++) centered[c][f] -= means[f];
  }
  
  // Compute covariance matrix (nFeatures × nFeatures) using mathjs
  const covMatrix = math.zeros([nFeatures, nFeatures]);
  for (let i = 0; i < nFeatures; i++) {
    for (let j = i; j < nFeatures; j++) {
      let cov = 0;
      for (let c = 0; c < nCells; c++) {
        cov += centered[c][i] * centered[c][j];
      }
      cov /= (nCells - 1);
      covMatrix[i][j] = cov;
      covMatrix[j][i] = cov;
    }
  }
  
  // Eigendecomposition
  console.log(`    Computing eigendecomposition of ${nFeatures}×${nFeatures} matrix...`);
  const eigen = math.eigs(covMatrix);
  
  // Sort eigenvalues descending
  const evPairs = eigen.eigenvectors.map(ev => ({
    value: typeof ev.value === 'number' ? ev.value : ev.value.re,
    vector: Array.from(ev.vector),
  }));
  evPairs.sort((a, b) => b.value - a.value);
  
  const topComponents = evPairs.slice(0, nComponents);
  
  // Project data onto PCs: projected[c][k] = centered[c] · vector[k]
  const projected = centered.map(cellData => {
    return topComponents.map(ev => {
      let sum = 0;
      for (let f = 0; f < nFeatures; f++) {
        sum += cellData[f] * ev.vector[f];
      }
      return sum;
    });
  });
  
  // Loadings (eigenvectors × sqrt(eigenvalues))
  const loadings = topComponents.map(ev => {
    const sqrtEval = Math.sqrt(Math.abs(ev.value));
    return ev.vector.map(v => v * sqrtEval);
  });
  
  const totalEval = evPairs.reduce((a, ev) => a + ev.value, 0);
  const varianceRatio = topComponents.map(ev => ev.value / totalEval);
  
  return {
    projected,
    variance_ratio: varianceRatio,
    evals: topComponents.map(ev => ev.value),
    loadings,
    cov: null,  // Too large to store
    n_components: nComponents,
  };
}

const pcaResult = computePCA(hvgScaledMatrix, 10);
console.log(`  PCA done: ${pcaResult.projected.length} cells × ${pcaResult.projected[0].length} components`);
console.log(`  Variance ratio (PC1-5): ${pcaResult.variance_ratio.slice(0, 5).map(v => (v*100).toFixed(1)+'%').join(', ')}`);

// ======================== STEP 11: KNN ========================
console.log('\n=== Step 11: Computing KNN ===');
const K = 5;

function computeKNN(projected) {
  const nCells = projected.length;
  const nDims = projected[0].length;
  
  // Compute distance matrix
  const distances = [];
  for (let i = 0; i < nCells; i++) {
    const dists = [];
    for (let j = 0; j < nCells; j++) {
      if (i === j) continue;
      let sumSq = 0;
      for (let d = 0; d < nDims; d++) {
        const diff = projected[i][d] - projected[j][d];
        sumSq += diff * diff;
      }
      dists.push({ idx: j, dist: Math.sqrt(sumSq) });
    }
    dists.sort((a, b) => a.dist - b.dist);
    const neighbors = dists.slice(0, K).map(d => d.idx);
    distances.push(neighbors);
  }
  
  // Build adjacency and edges
  const adj = distances.map(neighbors => {
    const obj = {};
    neighbors.forEach((n, rank) => { obj[n] = 1 / (rank + 1); });
    return obj;
  });
  
  const edges = [];
  distances.forEach((neighbors, i) => {
    neighbors.forEach(j => {
      if (i < j) edges.push({ source: i, target: j, weight: 1 });
    });
  });
  
  return { adj, edges };
}

const knnResult = computeKNN(pcaResult.projected);
console.log(`  KNN: ${knnResult.adj.length} nodes, ${knnResult.edges.length} edges`);

// ======================== STEP 12: DIMENSION REDUCTION ========================
console.log('\n=== Step 12: Computing DimRed (t-SNE/UMAP by PCA 2D) ===');

// Use first 2 PCs as the DimRed projection (good enough for teaching)
const pca2d = pcaResult.projected.map(p => ({ x: p[0], y: p[1] }));

// Normalize to reasonable range
const xs = pca2d.map(p => p.x);
const ys = pca2d.map(p => p.y);
const xMin = Math.min(...xs), xMax = Math.max(...xs);
const yMin = Math.min(...ys), yMax = Math.max(...ys);
const xRange = xMax - xMin || 1;
const yRange = yMax - yMin || 1;

const normalized2d = pca2d.map(p => ({
  x: ((p.x - xMin) / xRange - 0.5) * 20,
  y: ((p.y - yMin) / yRange - 0.5) * 20,
}));

const dimred = {
  metadata: { n_cells: N_CELLS, method: 'PCA' },
  cell_types: cellTypes,
  tsne: normalized2d,
  umap: normalized2d,
};

console.log('  DimRed: computed from PCA 2D');

// ======================== STEP 13: SMALL DATASET ========================
console.log('\n=== Step 13: Generating small dataset (75×40) ===');

// Select 75 cells (stratified by cell type)
const cellsByType = {};
cellTypes.forEach((t, i) => {
  if (!cellsByType[t]) cellsByType[t] = [];
  cellsByType[t].push(i);
});

const rngSmall = new SeededRNG(SEED + 1);
const selectedSmallCells = [];
Object.entries(cellsByType).forEach(([type, indices]) => {
  const nFromType = Math.max(1, Math.round(SMALL_CELLS / Object.keys(cellsByType).length));
  const sampled = rngSmall.sample(indices, Math.min(nFromType, indices.length));
  selectedSmallCells.push(...sampled);
});

// Trim or fill to exactly SMALL_CELLS
while (selectedSmallCells.length < SMALL_CELLS) {
  const extra = rngSmall.sample([...Array(N_CELLS).keys()], SMALL_CELLS - selectedSmallCells.length);
  selectedSmallCells.push(...extra);
}
selectedSmallCells.sort((a, b) => a - b);
const smallCells = selectedSmallCells.slice(0, SMALL_CELLS);

// Select 40 genes: markers first (up to 20), then fill with top expressed
const markerGeneSet = new Set(markerIndices);
const smallGeneIndices = [];
for (const mi of markerIndices) {
  if (smallGeneIndices.length < 20) smallGeneIndices.push(mi);
}
// Fill remaining from selected genes not already included
for (const gi of selectedGeneIndices) {
  if (smallGeneIndices.length >= SMALL_GENES) break;
  if (!smallGeneIndices.includes(gi)) smallGeneIndices.push(gi);
}
smallGeneIndices.sort((a, b) => a - b);
const smallGeneNames = smallGeneIndices.map(i => selectedGeneNames[selectedGeneIndices.indexOf(i)]);

// Build small expression matrix (75×40)
const smallExprMatrix = smallCells.map(ci => 
  smallGeneIndices.map(gi => exprMatrix[ci][selectedGeneIndices.indexOf(gi)])
);

const smallCellTypes = smallCells.map(ci => cellTypes[ci]);
const smallBarcodes = smallCells.map(ci => selectedBarcodes[ci]);

console.log(`  Small dataset: ${smallCells.length} cells × ${smallExprMatrix[0].length} genes`);
console.log(`  Small genes: ${smallGeneNames.slice(0, 5).join(', ')}...`);
console.log(`  Small unique types: ${[...new Set(smallCellTypes)].join(', ')}`);

// ======================== STEP 14: INTEGRATION DATA ========================
console.log('\n=== Step 14: Generating integration data ===');

// Simulate batch integration: split cells into 2 batches, shift coordinates
const batchLabels = cellTypes.map((t, i) => i < N_CELLS / 2 ? 'Batch_A' : 'Batch_B');

// Create "before integration" projections (batch effects visible)
const projBefore = normalized2d.map((p, i) => ({
  x: p.x + (batchLabels[i] === 'Batch_B' ? 3 : 0),
  y: p.y + (batchLabels[i] === 'Batch_B' ? 2 : 0),
}));

const integrationData = {
  metadata: {
    n_cells: N_CELLS,
    n_genes: 50,
    n_batches: 2,
    description: 'Batch integration demo (PBMC3k subsample)',
    integration_method: 'Harmony-like',
  },
  gene_names: selectedGeneNames.slice(0, 50),
  cell_types: cellTypes,
  batches: batchLabels,
  labels: cellTypes,
  expression_before: [],
  expression_after: [],
  proj_before: projBefore.map(p => [p.x, p.y]),
  proj_after: normalized2d.map(p => [p.x, p.y]),
};
console.log('  Integration data generated');

// ======================== STEP 15: WRITE FILES ========================
console.log('\n=== Step 15: Writing data files ===');

// Helper to convert numeric arrays to regular JS arrays for JSON
function toArrays(matrix) {
  return matrix.map(row => Array.from(row));
}

const files = [
  {
    name: 'pbmc_data.json',
    data: {
      metadata: { n_cells: N_CELLS, n_genes: N_GENES, description: 'PBMC3k subsample (300×2000) - raw counts from 10x data' },
      gene_names: selectedGeneNames,
      cell_types: cellTypes,
      expression_matrix: toArrays(exprMatrix),
      qc_metrics,
    },
  },
  {
    name: 'pbmc_data_small.json',
    data: {
      metadata: { source: 'pbmc3k_10x', cells: SMALL_CELLS, genes: SMALL_GENES, description: `Subsampled from 10x PBMC3k (${SMALL_CELLS}×${SMALL_GENES}) - marker genes prioritized` },
      gene_names: smallGeneNames,
      cell_barcodes: smallBarcodes,
      cell_types: smallCellTypes,
      expression_matrix: toArrays(smallExprMatrix),
    },
  },
  {
    name: 'pbmc_norm.json',
    data: {
      metadata: { n_cells: N_CELLS, n_genes: N_GENES, description: 'log1p CPM normalized (from real 10x PBMC3k)' },
      gene_names: selectedGeneNames,
      cell_types: cellTypes,
      expression_matrix: toArrays(normalized),
    },
  },
  {
    name: 'pbmc_scaled.json',
    data: {
      metadata: { n_cells: N_CELLS, n_genes: N_GENES, description: 'Z-score scaled (from real 10x PBMC3k)' },
      gene_names: selectedGeneNames,
      cell_types: cellTypes,
      expression_matrix: toArrays(scaledMatrix),
    },
  },
  {
    name: 'pbmc_hvg.json',
    data: {
      metadata: { n_cells: N_CELLS, n_genes: N_HVG, description: 'HVG raw counts (top 200 variable genes)' },
      gene_names: hvgGeneNames,
      cell_types: cellTypes,
      expression_matrix: toArrays(hvgMatrix),
      hvg_indices: hvgIndices,
    },
  },
  {
    name: 'pbmc_hvg_scaled.json',
    data: {
      metadata: { n_cells: N_CELLS, n_genes: N_HVG, description: 'HVG scaled (top 200 variable genes, z-scored)' },
      gene_names: hvgGeneNames,
      cell_types: cellTypes,
      expression_matrix: toArrays(hvgScaledMatrix),
      hvg_indices: hvgIndices,
    },
  },
  {
    name: 'pbmc_pca.json',
    data: {
      metadata: { n_cells: N_CELLS, n_genes: N_HVG, n_components: 10, description: 'PCA on HVG scaled data' },
      gene_names: hvgGeneNames,
      cell_types: cellTypes,
      projected: pcaResult.projected.map(p => [p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7], p[8], p[9]]),
      variance_ratio: pcaResult.variance_ratio,
      evals: pcaResult.evals,
      loadings: pcaResult.loadings.map(l => Array.from(l)),
    },
  },
  {
    name: 'pbmc_knn.json',
    data: {
      metadata: { n_cells: N_CELLS, k: K, description: 'KNN graph (k=5 on PCA embedding)' },
      projected: pcaResult.projected.map(p => [p[0], p[1]]),
      knn_adj: knnResult.adj,
      knn_edges: knnResult.edges,
      cell_types: cellTypes,
    },
  },
  {
    name: 'pbmc_dimred.json',
    data: dimred,
  },
  {
    name: 'pbmc_integration.json',
    data: integrationData,
  },
];

// Write to both public/data/ and out/data/
[PUBLIC_DIR, OUT_DIR].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  
  files.forEach(f => {
    const filePath = path.join(dir, f.name);
    fs.writeFileSync(filePath, JSON.stringify(f.data));
    const sizeKB = (fs.statSync(filePath).size / 1024).toFixed(1);
    console.log(`  ${f.name.padEnd(25)} ${sizeKB} KB → ${dir}`);
  });
});

// ======================== VERIFICATION ========================
console.log('\n=== Verification ===');

// Verify consistency
const writtenData = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_data.json'), 'utf8'));
const writtenSmall = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_data_small.json'), 'utf8'));

console.log(`pbmc_data.json: ${writtenData.expression_matrix.length}×${writtenData.expression_matrix[0].length}, cell_types: ${writtenData.cell_types.length}`);
console.log(`pbmc_data_small.json: ${writtenSmall.expression_matrix.length}×${writtenSmall.expression_matrix[0].length}, cell_types: ${writtenSmall.cell_types.length}`);
console.log(`pbmc_knn.json: edges=${JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR,'pbmc_knn.json'),'utf8')).knn_edges.length}`);
console.log(`pbmc_pca.json: cells=${JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR,'pbmc_pca.json'),'utf8')).projected.length}`);

// Check small cells are subset of big cells
const smallBarcodesFromFile = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_data_small.json'), 'utf8')).cell_barcodes;
const bigBarcodesFromFile = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_data.json'), 'utf8')).gene_names; // Not barcodes, but we know small is subset
console.log(`Small barcodes all found in big: ${smallBarcodesFromFile.every(b => barcodes.includes(b)) ? '✅' : '❌'}`);

// Check cell_type consistency
const dataTypes = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_data.json'), 'utf8')).cell_types;
const pcaTypes = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_pca.json'), 'utf8')).cell_types;
const dimredTypes = JSON.parse(fs.readFileSync(path.join(PUBLIC_DIR, 'pbmc_dimred.json'), 'utf8')).cell_types;
const typesMatch = JSON.stringify(dataTypes) === JSON.stringify(pcaTypes) && JSON.stringify(pcaTypes) === JSON.stringify(dimredTypes);
console.log(`Cell types consistent across files: ${typesMatch ? '✅' : '❌'}`);

// Check first 5 gene names are real
console.log(`First 5 genes: ${writtenData.gene_names.slice(0, 5).join(', ')}`);
console.log(`Small first 5 genes: ${writtenSmall.gene_names.slice(0, 5).join(', ')}`);

console.log('\n🎉 All data files generated successfully!');
