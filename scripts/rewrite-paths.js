#!/usr/bin/env node
/**
 * 静态导出路径重写脚本
 * 将 Next.js export 生成的绝对路径（/chapters, /_next）转换为子路径（/seeing-single-cell/...）
 * 用于 GitHub Pages 子目录部署
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/seeing-single-cell';
const OUT_DIR = process.argv[2] || 'out';

console.log(`\n🔧 重写路径前缀: / → ${BASE_PATH}`);
console.log(`📁 目录: ${OUT_DIR}\n`);

function rewriteFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let changed = 0;

  // 1. 重写 HTML 中的链接和资源路径
  // href="/chapters/..." → href="/seeing-single-cell/chapters/..."
  content = content.replace(/(href=["'])\/([^"'>][^"']*)(["'])/g, (m, p1, p2, p3) => {
    // 排除: /_next/、/data/（这些是绝对路径需要重写）、/ (根)、#、http
    if (p2.startsWith('_next') || p2.startsWith('data/') || p2 === '' || p2.startsWith('#') || p2.startsWith('http')) {
      if (p2.startsWith('_next') || p2.startsWith('data/')) {
        changed++;
        return `${p1}${BASE_PATH}/${p2}${p3}`;
      }
      return m;
    }
    // 其他路径（如 /chapters/...）
    changed++;
    return `${p1}${BASE_PATH}/${p2}${p3}`;
  });

  // 2. 重写 src 属性（图片、脚本、样式）
  content = content.replace(/(src=["'])\/([^"'>][^"']*)(["'])/g, (m, p1, p2, p3) => {
    if (p2.startsWith('_next') || p2.startsWith('data/')) {
      changed++;
      return `${p1}${BASE_PATH}/${p2}${p3}`;
    }
    return m;
  });

  // 3. 重写 fetch 调用中的绝对路径（在 JS 代码中）
  // fetch('/data/...') → fetch('/seeing-single-cell/data/...')
  content = content.replace(/(fetch\(["'])\/([^"']+)(["']\))/g, (m, p1, p2, p3) => {
    if (p2.startsWith('data/') || p2.startsWith('_next/')) {
      changed++;
      return `${p1}${BASE_PATH}/${p2}${p3}`;
    }
    return m;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changed;
  }
  return 0;
}

// 递归处理所有 HTML 文件
let totalFiles = 0;
let totalChanges = 0;

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      // 跳过 _next 和 data（这些路径重写在 HTML 中处理，文件本身不需要改）
      if (!entry.name.startsWith('_') && entry.name !== 'data') {
        walk(full);
      }
    } else if (entry.name.endsWith('.html') || entry.name.endsWith('.js')) {
      totalFiles++;
      const changes = rewriteFile(full);
      if (changes > 0) {
        totalChanges++;
        console.log(`  ✓ ${path.relative(OUT_DIR, full)} (${changes} 处)`);
      }
    }
  }
}

walk(OUT_DIR);

console.log(`\n✅ 完成！`);
console.log(`   处理文件: ${totalFiles}`);
console.log(`   修改文件: ${totalChanges}`);
console.log(`\n📦 现在可以将 out/ 推送到 GitHub Pages`);
console.log(`   (所有 / 前缀已改为 ${BASE_PATH}/ 前缀)\n`);
