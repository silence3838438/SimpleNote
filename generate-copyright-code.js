#!/usr/bin/env node

/**
 * 软著代码生成脚本
 * 生成60页的代码文档（前30页+后30页合并）
 */

const fs = require('fs');
const path = require('path');

// 配置
const CONFIG = {
  // 每页行数（软著要求每页50行）
  linesPerPage: 50,
  // 需要的页数（合并后总共60页）
  totalPages: 60,
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

// 生成代码文档（前30页+后30页）
function generateCodeDocument(files) {
  const result = [];
  const totalLines = CONFIG.totalPages * CONFIG.linesPerPage; // 60页 * 50行 = 3000行
  const halfLines = totalLines / 2; // 1500行
  
  // 第一部分：前30页（从头开始取1500行）
  let currentLine = 0;
  for (const file of files) {
    if (currentLine >= halfLines) break;
    
    const fileData = readFileWithHeader(file);
    
    // 添加文件头注释
    result.push(`// ========================================`);
    result.push(`// 文件: ${fileData.path}`);
    result.push(`// ========================================`);
    currentLine += 3;
    
    // 添加文件内容
    for (let i = 0; i < fileData.lines.length && currentLine < halfLines; i++) {
      result.push(fileData.lines[i]);
      currentLine++;
    }
    
    // 添加空行分隔
    if (currentLine < halfLines) {
      result.push('');
      currentLine++;
    }
  }
  
  // 第二部分：后30页（从末尾倒推取1500行）
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
  
  // 取最后1500行
  const startIndex = Math.max(0, allLines.length - halfLines);
  const backLines = allLines.slice(startIndex);
  
  // 合并前后两部分
  return [...result, ...backLines];
}

// 格式化输出（不添加页码和行号，纯代码）
function formatOutput(lines) {
  return lines.join('\n');
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
  
  // 生成60页代码（前30页+后30页合并）
  console.log('3. 生成60页代码文档（前30页+后30页）...');
  const allLines = generateCodeDocument(sortedFiles);
  const content = formatOutput(allLines);
  
  // 保存为源代码.txt
  const outputFile = path.join(CONFIG.outputDir, '源代码.txt');
  fs.writeFileSync(outputFile, content);
  console.log(`   ✓ 已生成: ${outputFile}`);
  console.log(`   ✓ 总行数: ${allLines.length} 行`);
  console.log(`   ✓ 总页数: ${Math.ceil(allLines.length / CONFIG.linesPerPage)} 页\n`);
  
  // 生成说明文件
  const readme = `软著代码文档说明

===============================================================================

文件列表

- 源代码.txt: 完整的60页代码（前30页+后30页合并）

===============================================================================

生成时间

${new Date().toLocaleString('zh-CN')}

===============================================================================

代码统计

- 总文件数: ${allFiles.length}
- 总代码行数: ${allLines.length}
- 总页数: ${Math.ceil(allLines.length / CONFIG.linesPerPage)} 页
- 每页行数: ${CONFIG.linesPerPage} 行

===============================================================================

核心文件

${CONFIG.priorityFiles.map((f, i) => `${i + 1}. ${f}`).join('\n')}

===============================================================================

使用说明

1. 源代码.txt 包含前30页和后30页的代码
2. 纯代码格式，无行号和页眉页脚
3. 每页50行，共60页
4. 文件之间有明确的分隔标识
5. 可直接用于软著申请材料

===============================================================================

注意事项

- 请确保代码中不包含敏感信息（密钥、密码等）
- 如需重新生成，运行: node generate-copyright-code.js

===============================================================================
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
