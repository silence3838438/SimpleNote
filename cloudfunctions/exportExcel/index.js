// 云函数：导出Excel
const cloud = require('wx-server-sdk')
const xlsx = require('node-xlsx')

cloud.init({
  env: 'cloud1-8gxevfq393690dfe'
})

exports.main = async (event, context) => {
  const { bills } = event
  
  try {
    // 准备Excel数据
    const sheetData = [
      // 表头
      ['日期', '类型', '分类', '商家/备注', '金额']
    ]
    
    // 按日期排序
    bills.sort((a, b) => new Date(b.date) - new Date(a.date))
    
    // 添加数据行
    bills.forEach(bill => {
      sheetData.push([
        bill.date,
        bill.type === 'income' ? '收入' : '支出',
        bill.categoryName || '其他',
        bill.merchant || '-',
        bill.type === 'income' ? bill.amount : -bill.amount
      ])
    })
    
    // 添加空行
    sheetData.push([])
    
    // 添加统计汇总
    const totalIncome = bills.filter(b => b.type === 'income').reduce((sum, b) => sum + b.amount, 0)
    const totalExpense = bills.filter(b => b.type === 'expense').reduce((sum, b) => sum + b.amount, 0)
    const balance = totalIncome - totalExpense
    
    sheetData.push(['统计汇总'])
    sheetData.push(['总收入', totalIncome.toFixed(2)])
    sheetData.push(['总支出', totalExpense.toFixed(2)])
    sheetData.push(['结余', balance.toFixed(2)])
    sheetData.push(['账单总数', bills.length])
    sheetData.push(['导出时间', new Date().toLocaleString('zh-CN')])
    
    // 生成Excel文件
    const buffer = xlsx.build([
      {
        name: '账单明细',
        data: sheetData,
        options: {}
      }
    ])
    
    // 上传到云存储
    const fileName = `账单_${new Date().toISOString().split('T')[0]}.xlsx`
    const uploadResult = await cloud.uploadFile({
      cloudPath: `exports/${fileName}`,
      fileContent: buffer
    })
    
    // 获取临时下载链接
    const tempFileURL = await cloud.getTempFileURL({
      fileList: [uploadResult.fileID]
    })
    
    return {
      success: true,
      fileID: uploadResult.fileID,
      tempFileURL: tempFileURL.fileList[0].tempFileURL,
      fileName: fileName
    }
  } catch (error) {
    console.error('生成Excel失败:', error)
    return {
      success: false,
      error: error.message
    }
  }
}
