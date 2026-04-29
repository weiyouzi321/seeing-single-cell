import re, sys
with open(sys.argv[1]) as f:
    c = f.read()

# 段落1
c = c.replace(
    "<strong>批次效应：</strong>由于实验批次、试剂批号或测序t('ch7.platform')不同，t('ch7.batchIntroduced')，t('ch7.batchSeparates')。",
    "<strong>{isZh ? t('ch7.batchIntroduced') + '：' : 'Batch Effect:'}</strong>{isZh ? t('ch7.whyDesc') : 'Batch effects from technical sources cause same cell types to separate.'}"
)
# 段落2
c = c.replace(
    "<li><K math=\"\\text{CCA (Canonical Correlation Analysis)}\" />：寻找两个数据集之间的线性变换，t('ch7.algoCorrelation')。</li>",
    "<li><K math=\"\\text{CCA}\" />：{isZh ? t('ch7.algoLinear') : 'Find linear transformation between datasets to align biological signals.'}</li>"
)
# 段落3
c = c.replace(
    "<li><K math=\"\\text{Harmony}\" />：基于 MixOmics 框架，t('ch7.algoIterative')。</li>",
    "<li><K math=\"\\text{Harmony}\" />：{isZh ? t('ch7.algoIterative') : 'Iterative optimization to remove batch effects.'}</li>"
)
# 段落4
c = c.replace(
    "<p><strong>t('ch7.evalMetrics')：</strong>使用 ARI（Adjusted Rand Index）和 NMI（Normalized Mutual Information）衡量t('ch7.showMetrics')。",
    "<p><strong>{isZh ? t('ch7.evalMetrics') : 'Evaluation Metrics'}:</strong> {isZh ? '使用 ARI（Adjusted Rand Index）和 NMI（Normalized Mutual Information）' : 'Using ARI and NMI'} {isZh ? t('ch7.showMetrics') : 'to measure cell-type consistency'}.</p>"
)

with open(sys.argv[1], 'w') as f:
    f.write(c)
