# Seeing Single-Cell Chapters


## Chapter 7: Batch Integration (批次整合)

**Chapter Card**: Homepage 上的第 07 章卡片
**Route**: `/chapters/7-integration`
**Viz Component**: `IntegrationViz` (side-by-side before/after projection)

### Features
- 4-step interactive tutorial (What → Before → After → Compare)
- Uses pbmc_integration.json (synthetic 100-cell × 50-gene dataset with two batches)
- Real-time anchor strength simulation (k-slider)
- Bilingual (EN/ZH) with KaTeX formulas

### Data File
`public/data/pbmc_integration.json` structure:
- `batches`: ["Batch1", "Batch2", ...]
- `labels`: cell type annotations
- `proj_before`: 2D coords (batch effect present)
- `proj_after`: 2D coords (integration aligned)

### To Modify
Edit `src/components/visualizations/IntegrationViz.tsx` to adjust:
- COLOR_SCHEME: batch colors (line 16-19)
- SCALE: coordinate zoom factor (line 51)
- textZh/textEn arrays (lines 26-37)
