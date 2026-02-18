#!/usr/bin/env node

/**
 * 软著代码生成脚本
 * 生成前60页和后60页的代码文档
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 每页行数（软著要求每页50行）
  linesPerPage: 50,
  // 需要的页数
  frontPages: 60,
  backPages: 60,
  // 输出目录
  outputDir: './软著代码',
  // 需要包含的文件扩展名
  extensions: ['.vue', '.js'],
  // 排除的目录
  excludeDirs: ['node_modules', '.git', 'dist', 'dist-cdn', 'dist-simple', 'unpackage', 'uni_modules'],
  // 优先包含的文件（核心文件）
  priorityFiles: [
    'App.vue',
    'main.js',
    'pages.json',
    'manifest.json',
    'backend/server.js',
    'backend/db.js',
    'backend/routes/bills.js',
    'backend/routes/auth.js',
    'backend/routes/admin.js',
    'pages/tab/index/index.vue',
    'pages/tab/bills/bills.vue',
    'pages/tab/statistics/statistics.vue',
    'pages/tab/profile/profile.vue',
    'pages/record/photo/photo.vue',
    'pages/record/voice/voice.vue',
    'pages/record/confirm/confirm.vue',
    'utils/request.js',
    'utils/security.js',
    'admin/src/main.js',
    'admin/src/App.vue',
    'admin/src/views/Dashboard.vue',
    'admin/src/views/Users.vue',
    'admin/src/views/Bills.vue'
  ]
};

// 获取所有代码文件
function getAllCodeFiles(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // 跳过排除的目录
      if (!CONFIG.excludeDirs.includes(file)) {
        getAllCodeFiles(filePath, fileList);
      }
    } else {
      // 检查文件扩展名
      const ext = path.extname(file);
      if (CONFIG.extensions.includes(ext)) {
        fileList.push(filePath);
      }
    }
  });
  
  return fileList;
}

// 读取文件内容并添加页眉
function readFileWithHeader(filePath, startLine = 1) {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const relativePath = filePath.replace(/^\.\//, '');
  
  return {
    path: relativePath,
    lines: lines,
    totalLines: lines.length
  };
}

// 生成代码文档
function generateCodeDocument(files, startFromBeginning = true) {
  const result = [];
  let currentLine = 0;
  const totalLines = startFromBeginning 
    ? CONFIG.frontPages * CONFIG.linesPerPage 
    : CONFIG.backPages * CONFIG.linesPerPage;
  
  if (startFromBeginning) {
    // 前60页：从头开始
    for (const file of files) {
      if (currentLine >= totalLines) break;
      
      const fileData = readFileWithHeader(file);
      
      // 添加文件头注释
      result.push(`// ========================================`);
      result.push(`// 文件: ${fileData.path}`);
      result.push(`// ========================================`);
      currentLine += 3;
      
      // 添加文件内容
      for (let i = 0; i < fileData.lines.length && currentLine < totalLines; i++) {
        result.push(fileData.lines[i]);
        currentLine++;
      }
      
      // 添加空行分隔
      if (currentLine < totalLines) {
        result.push('');
        currentLine++;
      }
    }
  } else {
    // 后60页：从末尾倒推
    const allLines = [];
    
    // 收集所有文件的所有行
    for (const file of files) {
      const fileData = readFileWithHeader(file);
      allLines.push(`// ========================================`);
      allLines.push(`// 文件: ${fileData.path}`);
      allLines.push(`// ========================================`);
      allLines.push(...fileData.lines);
      allLines.push('');
    }
    
    // 取最后的行数
    const startIndex = Math.max(0, allLines.length - totalLines);
    return allLines.slice(startIndex);
  }
  
  return result;
}

// 格式化输出（添加页码和行号）
function formatOutput(lines, isBack = false) {
  const result = [];
  const totalPages = Math.ceil(lines.length / CONFIG.linesPerPage);
  
  for (let page = 0; page < totalPages; page++) {
    const pageNumber = isBack 
      ? `第 ${totalPages - page} 页（共 ${CONFIG.backPages} 页）`
      : `第 ${page + 1} 页（共 ${CONFIG.frontPages} 页）`;
    
    result.push(`${'='.repeat(80)}`);
    result.push(`${pageNumber.padStart(40 + pageNumber.length / 2)}`);
    result.push(`${'='.repeat(80)}`);
    result.push('');
    
    const startLine = page * CONFIG.linesPerPage;
    const endLine = Math.min(startLine + CONFIG.linesPerPage, lines.length);
    
    for (let i = startLine; i < endLine; i++) {
      const lineNumber = String(i + 1).padStart(4, ' ');
      result.push(`${lineNumber} | ${lines[i]}`);
    }
    
    result.push('');
    result.push('');
  }
  
  return result.join('\n');
}

// 主函数
function main() {
  console.log('开始生成软著代码文档...\n');
  
  // 创建输出目录
  if (!fs.existsSync(CONFIG.outputDir)) {
    fs.mkdirSync(CONFIG.outputDir, { recursive: true });
  }
  
  // 获取所有代码文件
  console.log('1. 扫描代码文件...');
  let allFiles = getAllCodeFiles('.');
  console.log(`   找到 ${allFiles.length} 个代码文件\n`);
  
  // 按优先级排序
  console.log('2. 按优先级排序文件...');
  const priorityFilesSet = new Set(CONFIG.priorityFiles.map(f => './' + f));
  const sortedFiles = [
    ...allFiles.filter(f => priorityFilesSet.has(f)),
    ...allFiles.filter(f => !priorityFilesSet.has(f))
  ];
  console.log(`   优先文件: ${sortedFiles.filter(f => priorityFilesSet.has(f)).length} 个\n`);
  
  // 生成前60页
  console.log('3. 生成前60页代码...');
  const frontLines = generateCodeDocument(sortedFiles, true);
  const frontContent = formatOutput(frontLines, false);
  fs.writeFileSync(path.join(CONFIG.outputDir, '前60页.txt'), frontContent);
  console.log(`   ✓ 已生成: ${CONFIG.outputDir}/前60页.txt (${frontLines.length} 行)\n`);
  
  // 生成后60页
  console.log('4. 生成后60页代码...');
  const backLines = generateCodeDocument(sortedFiles, false);
  const backContent = formatOutput(backLines, true);
  fs.writeFileSync(path.join(CONFIG.outputDir, '后60页.txt'), backContent);
  console.log(`   ✓ 已生成: ${CONFIG.outputDir}/后60页.txt (${backLines.length} 行)\n`);
  
  // 生成说明文件
  const readme = `# 软著代码文档说明

## 文件列表
- 前60页.txt: 代码前60页（每页50行）
- 后60页.txt: 代码后60页（每页50行）

## 生成时间
${new Date().toLocaleString('zh-CN')}

## 代码统计
- 总文件数: ${allFiles.length}
- 总代码行数: ${frontLines.length + backLines.length}
- 前60页行数: ${frontLines.length}
- 后60页行数: ${backLines.length}

## 核心文件
${CONFIG.priorityFiles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

## 使用说明
1. 前60页.txt 和 后60页.txt 已按软著要求格式化
2. 每页包含50行代码
3. 每行都有行号标注
4. 文件之间有明确的分隔标识
5. 可直接用于软著申请材料

## 注意事项
- 请确保代码中不包含敏感信息（密钥、密码等）
- 如需重新生成，运行: node generate-copyright-code.js
`;
  
  fs.writeFileSync(path.join(CONFIG.outputDir, 'README.md'), readme);
  console.log(`   ✓ 已生成: ${CONFIG.outputDir}/README.md\n`);
  
  console.log('✅ 软著代码文档生成完成！');
  console.log(`📁 输出目录: ${CONFIG.outputDir}\n`);
}

// 运行
try {
  main();
} catch (error) {
  console.error('❌ 生成失败:', error.message);
  process.exit(1);
}
