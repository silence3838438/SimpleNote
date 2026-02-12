/**
 * 语音识别流程测试
 * 
 * 测试场景：
 * 1. 语音识别 -> 提取信息 -> 跳转确认页面
 * 2. 确认页面接收数据 -> 显示信息
 * 3. AI增强 -> 更新信息
 */

// 模拟 extractBillInfo 函数的测试用例
const testCases = [
  {
    input: '今天滴滴打车花了24元',
    expected: {
      type: 'expense',
      amount: 24,
      merchant: '滴滴',
      categoryName: '交通',
      remark: '' // 应该为空或简短
    }
  },
  {
    input: '午餐35元',
    expected: {
      type: 'expense',
      amount: 35,
      categoryName: '餐饮',
      remark: '' // 应该为空或简短
    }
  },
  {
    input: '收到工资8000元',
    expected: {
      type: 'income',
      amount: 8000,
      categoryName: '工资',
      merchant: '公司',
      remark: ''
    }
  },
  {
    input: '在星巴克买了咖啡30元',
    expected: {
      type: 'expense',
      amount: 30,
      merchant: '星巴克',
      categoryName: '餐饮',
      remark: '星巴克' // 地点信息
    }
  }
];

console.log('=== 语音识别流程测试 ===\n');

testCases.forEach((testCase, index) => {
  console.log(`测试用例 ${index + 1}: ${testCase.input}`);
  console.log('期望结果:', testCase.expected);
  console.log('---');
});

console.log('\n=== 测试说明 ===');
console.log('1. 语音识别后，extractBillInfo 应该提取出：');
console.log('   - type: 收入/支出类型');
console.log('   - amount: 金额');
console.log('   - merchant: 商家/来源');
console.log('   - categoryId: 分类ID');
console.log('   - categoryName: 分类名称');
console.log('   - date: 日期');
console.log('   - remark: 备注（应该简短或为空，让AI增强来处理）');
console.log('');
console.log('2. 数据通过 URL 参数传递到确认页面：');
console.log('   url: `/pages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(quickResult))}`');
console.log('');
console.log('3. 确认页面接收数据：');
console.log('   const parsedData = JSON.parse(decodeURIComponent(options.data))');
console.log('');
console.log('4. 确认页面显示数据：');
console.log('   - 金额: data.billData.amount');
console.log('   - 商家: data.billData.merchant');
console.log('   - 分类: data.selectedCategory.name');
console.log('   - 日期: data.billData.date');
console.log('   - 备注: data.billData.remark');
console.log('');
console.log('5. AI增强异步执行，完成后通过事件通知确认页面更新');
console.log('');
console.log('=== 可能的问题 ===');
console.log('1. extractBillInfo 提取的备注过长，导致 URL 参数过长');
console.log('2. 分类ID和分类名称不匹配，导致确认页面无法显示分类');
console.log('3. 商家名称提取不准确');
console.log('4. AI增强失败，导致信息不完整');
console.log('');
console.log('=== 修复方案 ===');
console.log('1. 优化 extractBillInfo 函数，限制备注长度');
console.log('2. 确保分类ID和分类名称匹配');
console.log('3. 优化商家名称提取逻辑');
console.log('4. 改进AI增强的错误处理');
