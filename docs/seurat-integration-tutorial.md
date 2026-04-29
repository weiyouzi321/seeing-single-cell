# Seurat Integration 交互式教程

**对应章节**: `/chapters/7-integration`

## 概述

本教程基于 Seurat 的 Integration 工作流（IntegrateData, FindIntegrationAnchors），通过交互式可视化帮助学生理解批次效应的识别与消除。

**核心思想**: 通过 Canonical Correlation Analysis (CCA) 或 Mutual Nearest Neighbors (MNN) 找到不同批次数据的"锚点"（anchors），然后将所有批次投影到同一嵌入空间。

---

## 1. 批次效应可视化

### 目视检查

在整合之前，我们先查看批次对数据分布的影响。

**交互控制**:
- **Color by 下拉**: 选择 `batch` 或 `cell_type`
- 当按 batch 着色时，你应看到两团分离的细胞（蓝色Batch1、红色Batch2）
- 当按 cell_type 着色时，相同细胞类型被批次分割

**学习目标**:
- 认识到批次效应会掩盖生物学信号
- 理解批次效应不是生物学差异

---

## 2. 锚点识别 (FindIntegrationAnchors)

### 算法流程

Seurat 通过以下步骤找到对齐批次的对齐点：

1. **降维**: 对每个批次分别进行 PCA（或使用共同的特征子空间）
2. **邻居搜索**: 在 PCA 空间中，为每个细胞在**同批次**内找 k 个最近邻 (k=20)
3. **互近邻 (MNN)**: 如果细胞 A 的最近邻列表中包含 B，且 B 的最近邻列表中也包含 A → (A,B) 是一对"互近邻"
4. **锚点筛选**: 保留那些跨批次的互近邻对作为锚点

### 交互步骤

```javascript
// 伪代码：展示锚点连线
drawAnchors(projBefore) {
  for each anchor pair (i, j) where i∈batch1, j∈batch2 {
    line(projBefore[i], projBefore[j], color='gray', dashed=true)
  }
}
```

**控制项**:
- **k 值滑块**: 修改近邻数量 (k=10, 20, 50)
  - k 太小 → 太少的锚点，整合不稳定
  - k 太大 → 引入错误匹配，批次混合不足
- **显示锚点连线**: 切换是否可视化锚点对
- **重置**: 随机种子固定，便于复现

**观察**:
- 正确的锚点连接 **相同细胞类型** 跨越批次
- 错误锚点连接 **不同细胞类型**

---

## 3. 校正与整合 (IntegrateData)

### CCA 校正向量

在找到锚点后，Seurat 计算每个细胞的校正向量：

\[
\text{correction}_i = \frac{1}{|\text{anchors to }i|+1} \sum_{j \in \text{anchors to }i} (x_j^{\text{other batch}} - x_i)
\]

简单理解：批量内锚点的平均位移。

### 交互: 投影可视化

我们展示整合前后的 UMAP/t-SNE 对比：

| 整合前 | 整合后 |
|--------|--------|
| 批次分离 | 批次混合 |
| 相同细胞类型散开 | 相同细胞类型聚集 |

**控制**:
- **Step 导航按钮**: ①What→②Before→③After→④Compare
- 第4步显示左右分屏对比

---

## 4. 整合后分析

### 生物学验证

整合后，你应该能够：

1. **聚类**: Louvain/Leiden 聚类结果在两批次间一致
2. **标记基因**: CD4、CD8、MS4A1 (B细胞 marker) 在两批次中表达模式相同
3. **降维可视化**: UMAP/t-SNE 显示基于细胞类型的聚类，而非批次

### 质量评估指标

| 指标 | 公式 | 解释 |
|------|------|------|
| **kBET** | 接受比例 | 批次内细胞类型混合度，接近 1 最佳 |
| **ASW** | 平均轮廓宽度 | 细胞类型分离度，越高越好 |
| **ARI** | Adjusted Rand Index | 与已知标签一致性 |
| **NMI** | Normalized Mutual Info | 批次-类型互信息，越低越好 |

**交互**: 拖动 `k_anchor` 滑块，实时观察上述指标变化。

---

## 5. 常见问题

### Q: 为什么我的整合后数据批次仍分离？

**A**: 
- 批次效应过强（如不同平台、不同物种）
- 尝试增加 `k.anchor` 或使用 `FindIntegrationAnchors` 的 `normalization = FALSE`
- 考虑使用 Harmony 或 scVI 作为替代方法

### Q: 应该保留多少维度 (`dims`)？

**A**:
- 推荐使用 30 维（经验值）
-  scree plot 看拐点：保留拐点前的主成分
- 太少维度 → 丢失生物学信号
- 太多维度 → 批次噪声残留

### Q: 整合后做 UMAP 要用整合前的还是整合后的数据？

**A**:
整合后数据 (`integrated.data`) 用于：
- 降维可视化 (UMAP/t-SNE)
- 聚类 (`FindNeighbors` → `FindClusters`)
- 差异表达分析 (`FindAllMarkers`)

**不要**用整合后数据做：
- 批次特异性的基因表达分析（批次特异的生物学信号也被消除了）

---

## 6. 代码示例 (R / Seurat)

```r
# 1. 加载数据（两个批次）
pbmc1 <- Read10X(data.dir = "batch1_filtered_feature_bc_matrix/")
pbmc2 <- Read10X(data.dir = "batch2_filtered_feature_bc_matrix/")

pbmc1 <- CreateSeuratObject(counts = pbmc1, project = "Batch1")
pbmc2 <- CreateSeuratObject(counts = pbmc2, project = "Batch2")

# 2. 标准流程：归一化 + 高变基因 + 缩放
pbmc1 <- SCTransform(pbmc1) %>% RunPCA()
pbmc2 <- SCTransform(pbmc2) %>% RunPCA()

# 3. 寻找锚点
anchors <- FindIntegrationAnchors(
  object.list = list(pbmc1, pbmc2),
  anchor.features = VariableFeatures(pbmc1),
  normalization.method = "SCT"
)

# 4. 整合
pbmc.combined <- IntegrateData(anchorset = anchors)

# 5. 可视化
DimPlot(pbmc.combined, reduction = "umap", group.by = "orig.ident")
DimPlot(pbmc.combined, reduction = "umap", group.by = "celltype")
```

**关键参数**:
- `anchor.features`: 用于锚点识别的高变基因，通常使用 2000–5000 个
- `dims`: 用于 PCA 的维度数，推荐 30
- `normalization.method`: `"LogNormalize"` 或 `"SCT"`（推荐）

---

## 7. 生物案例：COVID-19 多批次整合

**背景**: 多个实验室的 PBMC 数据合并，研究免疫应答。

**挑战**:
- 不同实验日期 → 批次效应
- 不同供者 → 生物学差异

**解决**:
1. 使用 `SCTransform` 批次校正
2. 识别 ~5000 个锚点
3. 整合后 UMAP 清晰分离：
   - CD4⁺ T 细胞
   - CD8⁺ T 细胞
   - B 细胞
   - NK 细胞
   - 单核细胞

**结论**: 批次效应消除后，COVID-19 患者 vs 健康对照的差异基因分析更可靠。

---

## 8. 延伸阅读

- **Seurat Integration vignette**: https://satijalab.org/seurat/articles/integration_introduction.html
- **Stuart et al. (2019) Cell**: Comprehensive integration of single-cell data
- **Harmony**: Korsunsky et al. (2019) Nature Methods — 快速迭代整合算法
- **scVI**: Lopez et al. (2018) Nature Biotechnology — 深度学习生成模型

---

**下一步**: 请访问 `/chapters/7-integration` 动手实验，调整 k_anchor 观察整合效果变化。
