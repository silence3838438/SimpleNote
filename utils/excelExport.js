// Excel导出工具
// 使用 xlsx 库生成Excel文件

/**
 * 导出账单为Excel
 * @param {Array} bills - 账单数组
 * @returns {Promise} - 返回文件路径
 */
export const exportBillsToExcel = async (bills) => {
  // 由于小程序环境限制，我们使用云函数来生成Excel
  // 这里先返回数据，由云函数处理
  
  // 准备数据
  const data = bills.map(bill => ({
    日期: bill.date,
    类型: bill.type === 'income' ? '收入' : '支出',
    分类: bill.categoryName || '其他',
    商家备注: bill.merchant || '-',
    金额: bill.type === 'income' ? bill.amount : -bill.amount
  }))
  
  // 计算统计
  const totalIncome = bills.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0)
  const totalExpense = bills.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0)
  const balance = totalIncome - totalExpense
  
  return {
    data,
    summary: {
      totalIncome,
      totalExpense,
      balance,
      count: bills.length
    }
  }
}
