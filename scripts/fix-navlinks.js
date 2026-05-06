#!/usr/bin/env node
/**
 * 修复 Next.js 静态导出中未带 basePath 的硬编码链接
 * 问题：'use client' 组件在静态导出时，<Link href="/chapters/..."> 不会自动加 basePath
 */

const fs = require('fs');
const path = require('path');

const BASE_PATH = '/seeing-single-cell';
const OUT_DIR = process.argv[2] || 'out';

console.log(`\n🔧 修复硬编码链接 -> ${BASE_PATH}`);

let totalFixed = 0;

function fixFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let changes = 0;

  // 修复 1: href="/chapters/..." → href="/seeing-single-cell/chapters/..."
  // 排除已经带前缀的
  content = content.replace(/(href=")\/(?!seeing-single-cell)(chapters\/[^"]+)("/g, (m, p1, p2, p3) => {
    if (!p2.startsWith('_next') && !p2.startsWith('data/')) {
      changes++;
      return `${p1}${BASE_PATH}/${p2}${p3}`;
    }
    return m;
  });

  // 修复 2: NavLinks 下拉菜单中的链接（可能带有引号）
  content = content.replace(/"(\/chapters\/[^"]+)"/g, (m, p1) => {
    if (!p1.startsWith('/seeing-single-cell/')) {
      changes++;
      return `"${BASE_PATH}${p1}"`;
    }
    return m;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    return changes;
  }
  return 0;
}

// 处理所有 HTML 文件
let files = 0;
for (const root of [OUT_DIR]) {
  for (const dir of ['chapters', '']) {
    const dirPath = path.join(root, dir || '');
    if (!fs.existsSync(dirPath)) continue;
    for (const file of fs.readdirSync(dirPath)) {
      if (file.endsWith('.html')) {
        const full = path.join(dirPath, file);
        const changed = fixFile(full);
        if (changed > 0) {
          files++;
          console.log(`  ✓ ${path.relative(OUT_DIR, full)} (${changed})`);
        }
      }
    }
  }
}

console.log(`\n✅ 修复完成: ${files} 个文件`);
