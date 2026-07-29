'use client'

import { useState } from 'react'

/**
 * Shared R code block component for the Seurat tutorial.
 * Syntax-highlighted, copyable R code block.
 */

function copyToClipboard(text: string) {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    navigator.clipboard.writeText(text).catch(() => {})
  }
}

/**
 * Lightweight R syntax highlighter
 */
function highlightR(code: string): string {
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .split('\n')
    .map((line) => {
      if (line.trim().startsWith('#')) {
        return `<span class="text-gray-400 dark:text-slate-500">${escapeHtml(line)}</span>`
      }
      let result = line
      result = result.replace(/"([^"\\]*(?:\\.[^"\\]*)*)"/g, (m) =>
        `<span class="text-emerald-600 dark:text-emerald-400">${m}</span>`
      )
      const kw = [
        'library','require','set.seed','data.frame','matrix','array','dim','apply',
        't','sum','mean','sd','median','sort','order','which','c','ifelse','paste',
        'sprintf','length','head','tail','str','summary','names','rownames',
        'colnames','if','else','for','in','while','repeat','break','next','function',
        'return','cat','print','plot','points','lines','text','par','dev.off',
      ]
      const builtins = [
        'Seurat','CreateSeuratObject','NormalizeData','FindVariableFeatures','ScaleData',
        'FindNeighbors','FindClusters','RunPCA','RunUMAP','RunTSNE','FindAllMarkers',
        'FindMarkers','FeaturePlot','DotPlot','VlnPlot','RidgePlot','DimPlot','ElbowPlot',
        'JackStraw','JackStrawPlot','PercentageFeatureSet','RenameCells','Idents','subset',
        'DimReduc','VlnPlot','FeatureScatter','ScatterPlot','RidgelinePlot',
      ]
      result = result.replace(
        new RegExp('\\b(' + kw.join('|') + ')\\b', 'g'),
        (m) => `<span class="text-blue-600 dark:text-blue-400 font-medium">${m}</span>`
      )
      result = result.replace(
        new RegExp('\\b(' + builtins.join('|') + ')\\b', 'g'),
        (m) => `<span class="text-purple-600 dark:text-purple-400 font-medium">${m}</span>`
      )
      result = result.replace(/\b(\d+\.?\d*)\b/g, (m) =>
        `<span class="text-amber-600 dark:text-amber-400">${m}</span>`
      )
      return result
    })
    .join('\n')
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export default function RCode({ code }: { code: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    copyToClipboard(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 shadow-sm">
      <div className="flex items-center justify-between bg-gray-100 dark:bg-slate-800 px-4 py-2 border-b border-gray-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-medium text-gray-500 dark:text-slate-400">R</span>
          <span className="flex gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-red-400/60"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-green-400/60"></span>
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="text-xs text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-300 transition-colors"
        >
          {copied ? '✓ 已复制' : '📋 复制'}
        </button>
      </div>
      <pre className="bg-gray-50 dark:bg-slate-900 p-4 overflow-x-auto">
        <code
          className="text-sm font-mono leading-relaxed text-gray-700 dark:text-slate-300"
          dangerouslySetInnerHTML={{ __html: highlightR(code) }}
        />
      </pre>
    </div>
  )
}
