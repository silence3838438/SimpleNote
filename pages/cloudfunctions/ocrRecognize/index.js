// 云函数：OCR识别
const cloud = require('wx-server-sdk')
const request = require('request-promise')

cloud.init({
  env: 'cloud1-8gxevfq393690dfe'
})

exports.main = async (event, context) => {
  const { fileID } = event
  
  try {
    // 获取图片临时链接
    const res = await cloud.getTempFileURL({
      fileList: [fileID]
    })
    
    const imageUrl = res.fileList[0].tempFileURL
    console.log('图片临时链接:', imageUrl)
    
    // 下载图片并转为base64
    let imageBase64 = await downloadImageAsBase64(imageUrl)
    console.log('图片已转为base64，原始长度:', imageBase64.length)
    
    // 检查图片大小，如果超过4MB则压缩（百度OCR限制）
    const imageSizeInMB = (imageBase64.length * 0.75) / (1024 * 1024) // base64转实际大小
    console.log('图片大小:', imageSizeInMB.toFixed(2), 'MB')
    
    if (imageSizeInMB > 4) {
      console.log('图片过大，需要压缩')
      throw new Error('图片过大，请重新拍照或选择较小的图片')
    }
    
    // 优先使用票据识别API（专门针对小票优化）
    let ocrResult = null
    try {
      ocrResult = await callBaiduReceiptOCR(imageBase64)
      console.log('票据识别成功')
    } catch (error) {
      console.log('票据识别失败，降级到通用OCR:', error.message)
      // 降级到高精度通用OCR
      ocrResult = await callBaiduOCR(imageBase64, true)
    }
    
    // 获取OCR识别的原始文本
    const words = ocrResult.words_result || []
    const rawText = words.map(item => item.words).join('\n')
    console.log('OCR原始文本（完整）:', rawText)
    console.log('OCR原始文本长度:', rawText.length)
    
    // 直接使用正则表达式解析（稳定可靠）
    console.log('使用正则表达式解析')
    const billInfo = parseOCRResult(ocrResult)
    
    // ✅ OCR识别成功后，立即删除云存储中的图片（节省存储空间）
    try {
      await cloud.deleteFile({
        fileList: [fileID]
      })
      console.log('✅ OCR图片已自动删除:', fileID)
    } catch (deleteError) {
      // 删除失败不影响识别结果，只记录日志
      console.log('⚠️ 删除OCR图片失败（不影响识别）:', deleteError.message)
    }
    
    return {
      success: true,
      text: rawText,  // 添加 text 字段供 AI 使用
      data: billInfo
    }
  } catch (error) {
    console.error('OCR识别失败:', error)
    
    // ✅ 识别失败时也删除图片（避免累积无用图片）
    try {
      await cloud.deleteFile({
        fileList: [fileID]
      })
      console.log('✅ 识别失败，已删除OCR图片:', fileID)
    } catch (deleteError) {
      console.log('⚠️ 删除OCR图片失败:', deleteError.message)
    }
    
    // 根据错误类型返回不同的提示
    let errorMsg = '识别失败，请重试'
    if (error.message && error.message.includes('qps')) {
      errorMsg = '请求过于频繁，请稍后再试'
    } else if (error.message && error.message.includes('limit')) {
      errorMsg = '今日识别次数已用完'
    } else if (error.message && error.message.includes('过大')) {
      errorMsg = error.message
    } else if (error.message && error.message.includes('超时')) {
      errorMsg = '识别超时，请确保小票清晰完整'
    }
    
    return {
      success: false,
      error: errorMsg,
      data: {
        amount: 0,
        merchant: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: 12,
        categoryName: '其他'
      }
    }
  }
}

// 使用微信云开发AI Agent智能提取（新增）
async function extractWithAI(ocrText) {
  try {
    console.log('调用AI Agent云函数...')
    
    // 构建完整的提示消息（将 systemPrompt 和用户消息合并）
    const fullMessage = `你是一个专业的小票识别助手。你的任务是从OCR识别的文本中提取关键信息。

提取规则：
1. 金额：优先识别"实付"、"实结金额"、"金别"、"实际支付"、"应付"等字段，忽略"数量合计"
2. 商家：优先识别发票抬头、销售方名称、店铺名称、外卖平台名称（如淘宝闪购、美团外卖、饿了么等）
3. 日期：识别开票日期、消费日期、下单时间等
4. 分类：根据商家和商品内容智能判断（餐饮店→餐饮，超市→购物，出租车/地铁→交通，医院→医疗）
5. 类型：如果包含"工资"、"薪资"、"退款"、"收入"等关键词，返回income，否则返回expense

返回格式：
严格按照JSON格式返回，不要添加markdown代码块标记，不要添加任何其他文字：
{
  "amount": 数字,
  "merchant": "字符串",
  "date": "YYYY-MM-DD",
  "category": "餐饮|购物|交通|医疗|娱乐|住房|通讯|服饰|美容|学习|社交|其他",
  "type": "expense|income"
}

如果某个字段识别不出来，返回空字符串或0，不要使用兜底值。

请从以下OCR识别的文本中提取小票信息：

${ocrText}`
    
    // 调用 Agent 云函数
    const result = await cloud.callFunction({
      name: 'agent-xiaopiaoshi-2end0lcd9c419f',
      data: {
        msg: fullMessage
      }
    })
    
    console.log('Agent云函数返回:', JSON.stringify(result).substring(0, 500))
    
    // 解析AI返回的内容
    if (result.errMsg && result.errMsg !== 'cloud.callFunction:ok') {
      throw new Error('Agent云函数调用失败: ' + result.errMsg)
    }
    
    // Agent 返回的内容可能在不同的字段中
    let content = ''
    if (result.result) {
      // 可能的返回格式
      content = result.result.content || 
                result.result.message?.content || 
                result.result.reply ||
                result.result.text ||
                JSON.stringify(result.result)
    }
    
    console.log('Agent返回内容:', content)
    
    // 提取JSON
    let jsonStr = content.trim()
    // 移除可能的markdown代码块标记
    jsonStr = jsonStr.replace(/```json\n?/g, '').replace(/```\n?/g, '')
    
    const jsonMatch = jsonStr.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('Agent返回格式错误')
    }
    
    const extracted = JSON.parse(jsonMatch[0])
    console.log('解析后的JSON:', extracted)
    
    // 数据清洗和验证
    return {
      type: extracted.type || 'expense',
      amount: extracted.amount || 0,
      merchant: extracted.merchant || '',
      date: extracted.date || new Date().toISOString().split('T')[0],
      categoryId: getCategoryId(extracted.category),
      categoryName: extracted.category || '',
      rawText: ocrText
    }
    
  } catch (error) {
    console.error('Agent提取失败:', error)
    throw error
  }
}

// 根据分类名称获取分类ID
function getCategoryId(categoryName) {
  const categoryMap = {
    '餐饮': 1,
    '交通': 2,
    '购物': 3,
    '娱乐': 4,
    '住房': 5,
    '医疗': 6,
    '通讯': 7,
    '服饰': 8,
    '美容': 9,
    '学习': 10,
    '社交': 11,
    '其他': 12
  }
  return categoryMap[categoryName] || null
}

// 下载图片并转为base64
async function downloadImageAsBase64(imageUrl) {
  const imageBuffer = await request({
    url: imageUrl,
    method: 'GET',
    encoding: null, // 返回Buffer
    timeout: 30000  // 30秒超时，适应长小票下载
  })
  
  return imageBuffer.toString('base64')
}

// 调用百度票据识别API（专门针对小票、发票优化）
async function callBaiduReceiptOCR(imageBase64) {
  const API_KEY = 'fJ57RtJLbFg8OEf2N5CFTXCl'
  const SECRET_KEY = 'PMvOQF5k2XCQcrI8lptKx9DGtknqpjKk'
  
  console.log('开始调用百度票据识别API')
  
  try {
    // 获取access_token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`
    
    const tokenRes = await request({
      url: tokenUrl,
      method: 'POST',
      json: true,
      timeout: 10000
    })
    
    if (tokenRes.error) {
      throw new Error('认证失败: ' + tokenRes.error_description)
    }
    
    const accessToken = tokenRes.access_token
    if (!accessToken) {
      throw new Error('access_token为空')
    }
    
    // 调用票据识别接口
    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/receipt?access_token=${accessToken}`
    console.log('正在调用票据识别接口...')
    
    const ocrRes = await request({
      url: ocrUrl,
      method: 'POST',
      form: {
        image: imageBase64,
        recognize_granularity: 'big', // 定位单字符位置
        probability: 'true',           // 返回识别结果的置信度
        detect_direction: 'true'       // 自动检测图片方向
      },
      json: true,
      timeout: 30000
    })
    
    console.log('票据识别接口返回:', JSON.stringify(ocrRes).substring(0, 200))
    
    // 检查错误
    if (ocrRes.error_code) {
      console.error('百度票据识别返回错误码:', ocrRes.error_code, '错误信息:', ocrRes.error_msg)
      throw new Error(ocrRes.error_msg || '票据识别失败')
    }
    
    const wordsCount = ocrRes.words_result_num || 0
    console.log('票据识别成功，识别到', wordsCount, '行文字')
    
    if (wordsCount < 3) {
      throw new Error('识别到的文字太少')
    }
    
    return ocrRes
    
  } catch (error) {
    console.error('callBaiduReceiptOCR异常:', error.message)
    throw error
  }
}

// 调用百度OCR API
async function callBaiduOCR(imageBase64, useHighAccuracy = false) {
  // 配置百度OCR的API Key和Secret Key
  const API_KEY = 'fJ57RtJLbFg8OEf2N5CFTXCl'
  const SECRET_KEY = 'PMvOQF5k2XCQcrI8lptKx9DGtknqpjKk'
  
  console.log('开始调用百度OCR，API_KEY:', API_KEY.substring(0, 10) + '...', '高精度模式:', useHighAccuracy)
  
  try {
    // 获取access_token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${API_KEY}&client_secret=${SECRET_KEY}`
    console.log('正在获取access_token...')
    
    const tokenRes = await request({
      url: tokenUrl,
      method: 'POST',
      json: true,
      timeout: 10000
    })
    
    if (tokenRes.error) {
      console.error('获取access_token失败:', tokenRes.error_description)
      throw new Error('认证失败: ' + tokenRes.error_description)
    }
    
    const accessToken = tokenRes.access_token
    console.log('获取access_token成功，token长度:', accessToken?.length)
    
    if (!accessToken) {
      throw new Error('access_token为空')
    }
    
    // 选择OCR接口：高精度版本更适合长小票和复杂场景
    const ocrEndpoint = useHighAccuracy ? 'accurate_basic' : 'general_basic'
    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/${ocrEndpoint}?access_token=${accessToken}`
    console.log('正在调用OCR识别接口:', ocrEndpoint)
    
    const ocrRes = await request({
      url: ocrUrl,
      method: 'POST',
      form: {
        image: imageBase64,
        detect_direction: 'true',  // 自动检测图片方向
        probability: 'true'        // 返回识别结果的置信度
      },
      json: true,
      timeout: 30000  // 30秒超时，适应长小票识别
    })
    
    console.log('OCR接口返回:', JSON.stringify(ocrRes).substring(0, 200))
    
    // 检查是否有错误
    if (ocrRes.error_code) {
      console.error('百度OCR返回错误码:', ocrRes.error_code, '错误信息:', ocrRes.error_msg)
      
      // QPS限制错误
      if (ocrRes.error_code === 18) {
        throw new Error('请求过于频繁，请等待3秒后再试')
      }
      
      // 图片格式错误
      if (ocrRes.error_code === 216201) {
        throw new Error('图片格式错误，请重新拍照')
      }
      
      // 图片过大
      if (ocrRes.error_code === 216202) {
        throw new Error('图片过大，请压缩后重试')
      }
      
      // 识别错误
      if (ocrRes.error_code === 216630) {
        throw new Error('识别错误，请确保图片清晰')
      }
      
      // 图片中没有文字
      if (ocrRes.error_code === 216631) {
        throw new Error('未识别到文字，请确保小票清晰可见')
      }
      
      throw new Error(ocrRes.error_msg || '识别失败')
    }
    
    const wordsCount = ocrRes.words_result?.length || 0
    console.log('百度OCR识别成功，识别到', wordsCount, '行文字')
    
    // 如果识别结果太少，可能是图片问题
    if (wordsCount < 3) {
      console.warn('识别结果过少，可能图片不清晰')
      throw new Error('识别到的文字太少，请确保小票清晰完整')
    }
    
    return ocrRes
    
  } catch (error) {
    console.error('callBaiduOCR异常:', error.message)
    
    // 如果是超时错误，给出更友好的提示
    if (error.message && error.message.includes('timeout')) {
      throw new Error('识别超时，小票可能过长，请尝试分段拍照')
    }
    
    throw error
  }
}

// 延迟函数
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

// 解析OCR结果
function parseOCRResult(ocrResult) {
  const words = ocrResult.words_result || []
  const allText = words.map(item => item.words).join(' ')
  
  console.log('OCR识别原始文本:', allText)
  
  // 判断是收入还是支出
  // 排除关键词：如果包含这些词，一定是支出
  const expenseKeywords = ['购买', '消费', '支付', '实付', '应付', '合计', '小票', '订单', '商品', '数量', '单据号', '门店', '零食', '超市', '便利店']
  let isDefinitelyExpense = false
  for (const keyword of expenseKeywords) {
    if (allText.includes(keyword)) {
      isDefinitelyExpense = true
      console.log('确认为支出类型，关键词:', keyword)
      break
    }
  }
  
  // 收入关键词（移除"收款"，因为小票上也有收款码）
  const incomeKeywords = ['工资', '薪资', '薪水', '奖金', '红包', '退款', '收入', '报销', '兼职', '分红', '利息', '收到转账', '转账收入', '到账']
  let type = 'expense' // 默认支出
  
  if (!isDefinitelyExpense) {
    for (const keyword of incomeKeywords) {
      if (allText.includes(keyword)) {
        type = 'income'
        console.log('识别为收入类型，关键词:', keyword)
        break
      }
    }
  }
  
  // 提取金额 - 按优先级匹配
  let amount = 0
  let foundWithKeyword = false // 标记是否通过关键词找到金额
  
  // 【优先级1】关键词金额（最高优先）
  const keywordPatterns = [
    // 最高优先：实付/实收
    /实付[金额款：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /实收[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /实结[金额款：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /实际支付[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 次优先：合计/总计/小计
    /合计[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /总计[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /小计[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /支付金额[：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /订单金额[：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 再次：应付/应收
    /应付[金额款：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /应收[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 其他常见关键词
    /在线支付[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /金别[：:]\s*[¥￥$]?\s*(\d+\.?\d*)/,  // OCR识别错误
    /金额[：:]\s*[¥￥$]?\s*(\d+\.?\d*)/,
    /价税合计[（(]大写[）)]\s*[^(]*\(小写[）)]\s*[¥￥$]?(\d+\.?\d*)/,
    /[（(]小写[）)]\s*[¥￥$]?(\d+\.?\d*)/,
    /小写[）\)]\s*[¥￥$]?(\d+\.?\d*)/,
    /总额[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /收费[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /支付[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /[¥￥$]\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*元/
  ]
  
  for (const pattern of keywordPatterns) {
    const match = allText.match(pattern)
    if (match && match[1]) {
      const parsedAmount = parseFloat(match[1])
      // 验证金额的合理性
      if (parsedAmount > 0 && parsedAmount < 100000) {
        // 如果有小数点，直接认为是金额
        if (match[1].includes('.')) {
          amount = parsedAmount
          foundWithKeyword = true
          console.log('【优先级1】匹配到关键词金额（有小数点）:', amount, '使用模式:', pattern)
          break
        }
        // 如果没有小数点，需要进一步验证
        else {
          // 排除明显是日期时间的数字（如3112、1127等）
          const numStr = match[1]
          // 如果数字是4位且在0-2400之间，可能是时间，跳过
          if (numStr.length === 4 && parsedAmount <= 2400) {
            console.log('跳过可能是时间的数字:', parsedAmount)
            continue
          }
          // 如果数字>=10，认为是金额
          if (parsedAmount >= 10) {
            amount = parsedAmount
            foundWithKeyword = true
            console.log('【优先级1】匹配到关键词金额（>=10）:', amount, '使用模式:', pattern)
            break
          }
        }
      }
    }
  }
  
  // 【优先级2】商品列表识别（如果没有找到关键词金额）
  if (!foundWithKeyword) {
    console.log('【优先级2】未通过关键词找到金额，尝试识别商品列表')
    
    // OCR错误修正：处理空格丢失问题
    // 例如：*1  15.89 被识别成 *115.89
    // 修正策略：如果识别到 *1XX.XX 或 *1XXX.XX 格式，可能是 *1 XX.XX
    let correctedText = allText
    const ocrErrorPattern = /\*1(\d{2,3}\.\d+)/g
    let ocrMatch
    const corrections = []
    
    while ((ocrMatch = ocrErrorPattern.exec(allText)) !== null) {
      const fullMatch = ocrMatch[0]  // 例如：*115.89
      const priceStr = ocrMatch[1]   // 例如：15.89
      const price = parseFloat(priceStr)
      
      // 只修正合理的价格范围（0.01-999.99）
      if (price > 0 && price < 1000) {
        const corrected = `*1 ${priceStr}`  // 修正为：*1 15.89
        corrections.push({ original: fullMatch, corrected, price })
        console.log(`OCR错误修正: ${fullMatch} → ${corrected}（提取价格: ${price}）`)
      }
    }
    
    // 应用修正
    if (corrections.length > 0) {
      for (const correction of corrections) {
        correctedText = correctedText.replace(correction.original, correction.corrected)
      }
      console.log('应用OCR修正后的文本（部分）:', correctedText.substring(0, 200))
    }
    
    // 格式1：*数量 单价 小计（累加所有小计）
    const itemWithSubtotalPattern = /\*(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/g
    let subtotals = []
    let match
    while ((match = itemWithSubtotalPattern.exec(correctedText)) !== null) {
      const quantity = parseInt(match[1])
      const unitPrice = parseFloat(match[2])
      const subtotal = parseFloat(match[3])
      
      // 验证：小计应该约等于数量×单价
      if (subtotal > 0 && subtotal < 10000 && Math.abs(subtotal - quantity * unitPrice) < 0.1) {
        subtotals.push(subtotal)
        console.log(`找到商品小计: *${quantity} ${unitPrice} ${subtotal}`)
      }
    }
    
    if (subtotals.length > 0) {
      amount = subtotals.reduce((sum, val) => sum + val, 0)
      foundWithKeyword = true
      console.log('【优先级2】累加商品小计作为金额:', amount, '（共', subtotals.length, '个商品）')
    } else {
      // 格式2：*数量 单价（无小计，计算数量×单价）
      console.log('未找到小计格式，尝试识别 *数量 单价 格式')
      const itemPattern = /\*(\d+)\s+(\d+\.?\d*)/g
      let calculatedAmounts = []
      while ((match = itemPattern.exec(correctedText)) !== null) {
        const quantity = parseInt(match[1])
        const unitPrice = parseFloat(match[2])
        const calculated = quantity * unitPrice
        
        if (calculated > 0 && calculated < 10000) {
          calculatedAmounts.push(calculated)
          console.log(`计算商品金额: *${quantity} × ${unitPrice} = ${calculated}`)
        }
      }
      
      if (calculatedAmounts.length > 0) {
        amount = calculatedAmounts.reduce((sum, val) => sum + val, 0)
        foundWithKeyword = true
        console.log('【优先级2】累加计算金额:', amount, '（共', calculatedAmounts.length, '个商品）')
      }
    }
  }
  
  // 【优先级3】过滤无效金额后取最大值
  if (!foundWithKeyword) {
    console.log('【优先级3】尝试从所有数字中过滤并取最大值')
    const allNumbers = allText.match(/\d+\.?\d*/g) || []
    const validNumbers = []
    
    for (const numStr of allNumbers) {
      const num = parseFloat(numStr)
      if (num <= 0 || num >= 100000) continue  // 异常值
      
      const numIndex = allText.indexOf(numStr)
      const beforeText = allText.substring(Math.max(0, numIndex - 10), numIndex)
      const afterText = allText.substring(numIndex + numStr.length, numIndex + numStr.length + 10)
      
      // 过滤负数金额（优惠/折扣）
      if (beforeText.includes('-') || beforeText.includes('优惠') || beforeText.includes('折扣') || beforeText.includes('减免')) {
        console.log('过滤优惠/折扣金额:', num)
        continue
      }
      
      // 过滤转账号码
      if (beforeText.includes('转')) {
        console.log('过滤转账号码:', num)
        continue
      }
      
      // 过滤订单号、会员号
      if (/(?:ID|订单号|会员号|流水号)[：:]\s*$/.test(beforeText)) {
        console.log('过滤订单号/会员号:', num)
        continue
      }
      
      // 过滤手机号码
      if (/(?:手机|电话|号码|尾号|联系)[^0-9]{0,5}$/.test(beforeText)) {
        console.log('过滤手机号码:', num)
        continue
      }
      
      // 过滤时间格式
      if (numStr.length === 4 && num <= 2400) {
        console.log('过滤时间格式:', num)
        continue
      }
      
      validNumbers.push(num)
    }
    
    if (validNumbers.length > 0) {
      amount = Math.max(...validNumbers)
      console.log('【优先级3】使用最大正数金额:', amount)
    }
  }
  
  // 提取商家名/备注 - 优先匹配销方（电子发票）和商家名称（外卖小票）
  let merchant = ''  // 默认为空，识别不出来就让用户自己填
  
  if (type === 'income') {
    // 收入类型：提取备注信息
    const incomeNotePatterns = [
      /备注[：:]\s*(.+?)(?:\s|$)/,
      /说明[：:]\s*(.+?)(?:\s|$)/,
      /用途[：:]\s*(.+?)(?:\s|$)/,
      /项目[：:]\s*(.+?)(?:\s|$)/
    ]
    
    for (const pattern of incomeNotePatterns) {
      const match = allText.match(pattern)
      if (match && match[1]) {
        merchant = match[1].trim()
        console.log('匹配到收入备注:', merchant)
        break
      }
    }
    
    // 如果没有备注，使用收入类型关键词
    if (!merchant) {
      for (const keyword of incomeKeywords) {
        if (allText.includes(keyword)) {
          merchant = keyword
          break
        }
      }
    }
  } else {
    // 支出类型：按优先级顺序识别商家
    let tempMerchant = '未知商家'  // 临时变量用于判断
    
    // 1. 电子发票：销售方名称识别（最高优先级）
    if (tempMerchant === '未知商家') {
      // 方案1：匹配"售名称:"后面的内容（处理空格）
      const sellerMatch1 = allText.match(/售\s*名\s*称\s*[：:]\s*([^统一社会信用代码纳税人识别号方信息]+)/)
      if (sellerMatch1 && sellerMatch1[1]) {
        const name = sellerMatch1[1].trim()
        // 过滤掉一些无效内容
        if (name.length > 2 && !name.includes('买') && !name.includes('单价') && !name.includes('数量') && !name.includes('项目')) {
          tempMerchant = name
          console.log('匹配到销售方名称（方案1）:', tempMerchant)
        }
      }
    }
    
    // 2. 电子发票：销方名称
    if (tempMerchant === '未知商家') {
      const sellerMatch2 = allText.match(/销\s*方[^名]*名\s*称\s*[：:]\s*([^统一社会信用代码纳税人识别号方信息]+)/)
      if (sellerMatch2 && sellerMatch2[1]) {
        const name = sellerMatch2[1].trim()
        if (name.length > 2 && !name.includes('买') && !name.includes('单价') && !name.includes('数量') && !name.includes('项目')) {
          tempMerchant = name
          console.log('匹配到销方名称（方案2）:', tempMerchant)
        }
      }
    }
    
    // 3. 销售方名称（无空格版本）
    if (tempMerchant === '未知商家') {
      const sellerMatch3 = allText.match(/销售方名称[：:]\s*([^统一社会信用代码纳税人识别号\s]+)/)
      if (sellerMatch3 && sellerMatch3[1]) {
        const name = sellerMatch3[1].trim()
        if (name.length > 2 && !name.includes('买方') && !name.includes('单价') && !name.includes('数量')) {
          tempMerchant = name
          console.log('匹配到销售方名称（方案3）:', tempMerchant)
        }
      }
    }
    
    // 3. 外卖小票：商家名称字段
    if (tempMerchant === '未知商家') {
      const takeoutMatch = allText.match(/(?:商家名称|门店名称|店铺名称)[：:]\s*([^\n\r]+?)(?:\s|订单编号|下单时间|联系电话|$)/)
      if (takeoutMatch && takeoutMatch[1]) {
        tempMerchant = takeoutMatch[1].trim()
        console.log('匹配到外卖商家:', tempMerchant)
      }
    }
    
    // 4. 平台+商家组合（淘宝闪购、美团外卖等）- 优先匹配完整平台名
    if (tempMerchant === '未知商家') {
      // 先匹配完整的外卖平台名称
      const fullPlatforms = [
        '淘宝闪购',
        '美团外卖', 
        '饿了么外卖',
        '饿了么',
        '京东到家',
        '盒马鲜生',
        '叮咚买菜'
      ]
      for (const platform of fullPlatforms) {
        if (allText.includes(platform)) {
          tempMerchant = platform
          console.log('匹配到完整平台名称:', tempMerchant)
          break
        }
      }
      
      // 如果没匹配到完整平台名，再尝试匹配部分平台名
      if (tempMerchant === '未知商家') {
        const partialPlatforms = ['闪购', '美团', '京东']
        for (const platform of partialPlatforms) {
          if (allText.includes(platform)) {
            // 尝试提取平台前面的完整名称（如"淘宝闪购"）
            const regex = new RegExp(`([^\\s]{0,4}${platform})`)
            const match = allText.match(regex)
            if (match && match[1]) {
              tempMerchant = match[1].trim()
              console.log('匹配到部分平台名称:', tempMerchant)
              break
            }
          }
        }
      }
    }
    
    // 5. 超市小票 - 优先匹配知名超市品牌
    if (tempMerchant === '未知商家') {
      // 先匹配知名超市品牌
      const supermarketBrands = [
        '沃尔玛', '家乐福', '大润发', '永辉', '华润万家', '物美',
        '盒马', '盒马鲜生', '7-11', '全家', '罗森', '便利蜂',
        '苏宁', '国美', '山姆会员店', '麦德龙', '欧尚', '卜蜂莲花',
        '好想来'  // 添加好想来零食店
      ]
      
      for (const brand of supermarketBrands) {
        if (allText.includes(brand)) {
          // 尝试提取完整店名（如"沃尔玛南京店"）
          // 只匹配品牌名+地址+店/超市/购物中心/商场，避免提取过多内容
          const regex = new RegExp(`(${brand}[\\u4e00-\\u9fa5]{0,15}(?:店|超市|购物中心|商场))`)
          const match = allText.match(regex)
          if (match && match[1]) {
            tempMerchant = match[1].trim()
            console.log('匹配到超市品牌（完整）:', tempMerchant)
            break
          } else {
            // 如果没有完整店名，就用品牌名
            tempMerchant = brand
            console.log('匹配到超市品牌:', tempMerchant)
            break
          }
        }
      }
    }
    
    // 6. 超市小票 - 通过字段识别
    if (tempMerchant === '未知商家') {
      const supermarketMatch = allText.match(/(?:店名|门店|商店|超市)[：:]\s*(.+?)(?:\s|电话|地址|$)/)
      if (supermarketMatch && supermarketMatch[1]) {
        tempMerchant = supermarketMatch[1].trim()
        console.log('匹配到超市门店:', tempMerchant)
      }
    }
    
    // 7. 医院票据
    if (tempMerchant === '未知商家') {
      const hospitalMatch = allText.match(/([\u4e00-\u9fa5]+(?:医院|诊所|卫生院|医疗|门诊)[\u4e00-\u9fa5]*)/)
      if (hospitalMatch && hospitalMatch[1]) {
        tempMerchant = hospitalMatch[1].trim()
        console.log('匹配到医院名称:', tempMerchant)
      }
    }
    
    // 8. 其他商家模式
    if (tempMerchant === '未知商家') {
      const merchantPatterns = [
        /商家[：:]\s*(.+?)(?:\s|统一社会信用|$)/,
        /商户[：:]\s*(.+?)(?:\s|统一社会信用|$)/,
        /收款方[：:]\s*(.+?)(?:\s|$)/
      ]
      
      for (const pattern of merchantPatterns) {
        const match = allText.match(pattern)
        if (match && match[1]) {
          const name = match[1].trim()
          if (!name.includes('电子商务') && !name.includes('买方') && name.length > 1) {
            tempMerchant = name
            console.log('匹配到商家:', tempMerchant)
            break
          }
        }
      }
    }
    
    // 9. 项目名称
    if (tempMerchant === '未知商家') {
      const itemMatch = allText.match(/项目名称\s*(.+?)(?:\s|单价|数量|金额|$)/)
      if (itemMatch && itemMatch[1]) {
        tempMerchant = itemMatch[1].trim()
        console.log('从项目名称提取商家:', tempMerchant)
      }
    }
    
    // 10. 旅客运输服务
    if (tempMerchant === '未知商家') {
      if (allText.includes('旅客运输服务') || allText.includes('客运服务')) {
        const transportMatch = allText.match(/([\u4e00-\u9fa5]+(?:出行|运输|客运|交通)[\u4e00-\u9fa5（）()]*(?:科技)?(?:股份)?(?:有限)?(?:公司)?)/)
        if (transportMatch && transportMatch[1]) {
          tempMerchant = transportMatch[1].trim()
          console.log('从运输服务关键词提取商家:', tempMerchant)
        }
      }
    }
    
    // 11. 超市关键词（通用匹配）
    if (tempMerchant === '未知商家') {
      const supermarketKeywords = ['超市', '便利店', '商场', '购物中心', '百货']
      for (const keyword of supermarketKeywords) {
        if (allText.includes(keyword)) {
          const regex = new RegExp(`([\\u4e00-\\u9fa5A-Za-z0-9]+${keyword}[\\u4e00-\\u9fa5A-Za-z0-9]*)`)
          const match = allText.match(regex)
          if (match && match[1]) {
            tempMerchant = match[1].trim()
            console.log('从超市关键词提取商家:', tempMerchant)
            break
          }
        }
      }
    }
    
    // 12. 外卖平台关键词（降低优先级，避免干扰）
    if (tempMerchant === '未知商家') {
      const takeoutPlatforms = ['外卖', '美团', '饿了么', '淘宝']
      for (const platform of takeoutPlatforms) {
        if (allText.includes(platform)) {
          // 先尝试找平台后面的商家名称
          const regex = new RegExp(`${platform}[^\\n]{0,30}`)
          const match = allText.match(regex)
          if (match && match[0]) {
            const fullText = match[0].trim()
            // 提取商家名（排除一些无意义的词）
            const cleanText = fullText.replace(/顾客|小票|订单|编号|时间|电话/g, '').trim()
            // 如果提取到的内容有意义（长度>平台名称长度），使用它
            if (cleanText.length > platform.length + 2) {
              tempMerchant = cleanText
              console.log('从外卖平台提取商家:', tempMerchant)
              break
            }
          }
          // 如果没提取到有效商家名，只保留平台名称
          if (tempMerchant === '未知商家') {
            tempMerchant = platform
            console.log('使用平台名称作为商家:', tempMerchant)
            break
          }
        }
      }
    }
    
    // 13. 使用第一行（最后的兜底方案） - 不再使用，识别不出来就返回空
    // 如果识别到了商家，赋值给merchant
    if (tempMerchant !== '未知商家') {
      merchant = tempMerchant
    }
    console.log('最终商家识别结果:', merchant || '(空)')
  }
  
  // 提取日期
  const dateMatch = allText.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/)
  let date = new Date().toISOString().split('T')[0]
  if (dateMatch) {
    let year = parseInt(dateMatch[1])
    let month = parseInt(dateMatch[2])
    let day = parseInt(dateMatch[3])
    
    const currentYear = new Date().getFullYear()
    const currentMonth = new Date().getMonth() + 1
    const currentDay = new Date().getDate()
    
    // 修正月份：只修正明显错误的情况（>12）
    if (month > 12) {
      console.log('月份>12，明显错误，使用当前月份:', dateMatch[2], '->', currentMonth)
      month = currentMonth
    }
    
    // 修正日期：只修正明显错误的情况（>31）
    if (day > 31) {
      console.log('日期>31，明显错误，使用当前日期:', dateMatch[3], '->', currentDay)
      day = currentDay
    }
    
    // 验证日期合理性：不能是未来日期
    const parsedDate = new Date(year, month - 1, day)
    const today = new Date()
    today.setHours(23, 59, 59, 999) // 设置为今天结束时间
    
    if (parsedDate > today) {
      // 如果是未来日期，说明年份或月份识别错误，使用今天
      console.log('日期在未来，使用今天。原始:', `${year}-${month}-${day}`, '今天:', date)
      date = new Date().toISOString().split('T')[0]
    } else {
      const monthStr = month.toString().padStart(2, '0')
      const dayStr = day.toString().padStart(2, '0')
      date = `${year}-${monthStr}-${dayStr}`
      console.log('匹配到日期:', date, '(原始:', dateMatch[0], ')')
    }
  }
  
  // 智能分类
  const categoryInfo = smartClassify(allText, merchant, type)
  
  console.log('最终解析结果:', { type, amount, merchant, date, categoryInfo })
  
  // 构建返回结果，如果没有识别到分类，不返回 categoryId 和 categoryName
  const result = {
    type,
    amount,
    merchant,
    date,
    rawText: allText
  }
  
  // 只有识别到分类时才添加分类信息
  if (categoryInfo.id !== null && categoryInfo.name) {
    result.categoryId = categoryInfo.id
    result.categoryName = categoryInfo.name
  }
  
  return result
}

// 智能分类
function smartClassify(text, merchant, type) {
  if (type === 'income') {
    // 收入分类
    const incomeCategories = [
      { id: 101, name: '工资', keywords: ['工资', '薪水', '薪资', '月薪', '年薪', '发工资', '工资收入'] },
      { id: 102, name: '兼职', keywords: ['兼职', '外快', '副业', '临时工', '兼职收入', '美团众包', '饿了么', '闪送', '接单', '设计', '写作', '咨询'] },
      { id: 103, name: '奖金', keywords: ['奖金', '年终奖', '提成', '绩效', '奖励', '季度奖', '项目奖'] },
      { id: 104, name: '红包', keywords: ['红包', '压岁钱'] },
      { id: 105, name: '退款', keywords: ['退款', '退货', '退费', '返现', '退税'] },
      { id: 106, name: '报销', keywords: ['报销', '补贴', '津贴', '餐补', '交通补贴'] },
      { id: 107, name: '投资', keywords: ['利息', '分红', '股息', '理财', '投资', '股票', '基金', '收益', '投资收益', '支付宝', '微信理财通', '天天基金', '雪球'] },
      { id: 109, name: '礼金', keywords: ['礼金', '份子钱', '收礼', '随礼'] },
      { id: 110, name: '出售', keywords: ['出售', '卖', '二手', '闲置', '转让', '闲鱼', '转转'] },
      { id: 108, name: '其他', keywords: ['收入', '赚', '挣', '收到', '到账', '其他收入'] }
    ]
    
    const searchText = (text + ' ' + merchant).toLowerCase()
    
    for (const category of incomeCategories) {
      for (const keyword of category.keywords) {
        if (searchText.includes(keyword)) {
          console.log('匹配到收入分类:', category.name, '关键词:', keyword)
          return { id: category.id, name: category.name }
        }
      }
    }
    
    console.log('未匹配到收入分类，返回空')
    return { id: null, name: '' }
  } else {
    // 支出分类
    const categories = [
      { id: 1, name: '餐饮', keywords: ['餐厅', '饭店', '食堂', '外卖', '麦当劳', '肯德基', '星巴克', '咖啡', '火锅', '烧烤', '美食', '小吃', '茶饮', '奶茶', '快餐', '早餐', '午餐', '晚餐', '宵夜', '闪购', '淘宝闪购', '美团外卖', '美团', '饿了么', '京东到家', '盒马', '叮咚', '饿了么外卖'] },
      { id: 2, name: '交通', keywords: ['滴滴', '出租', '地铁', '公交', '加油', '停车', '打车', '运输', '客运', '旅客', '票务', '车费', '出行', '享道', '曹操', '高德', '高铁', '飞机', '火车', '动车', '汽车', '船票', '哈啰', '青桔', '美团单车'] },
      { id: 3, name: '购物', keywords: ['超市', '商场', '淘宝', '京东', '拼多多', '便利店', '电商', '网购', '商务', '百货', '购物中心', '沃尔玛', '家乐福', '大润发', '永辉', '华润', '7-11', '全家', '罗森', '买', '购', '物美', '苏宁', '国美', '山姆', '麦德龙', '欧尚', '卜蜂莲花', '便利蜂', '盒马鲜生', '叮咚买菜'] },
      { id: 4, name: '娱乐', keywords: ['电影', '游戏', 'KTV', '健身', '娱乐', '影院', '网吧', '台球', '保龄球', '旅游', '景点', '唱歌', '玩', '看电影', '运动', '球类', '乐刻', '超级猩猩', 'Keep'] },
      { id: 5, name: '住房', keywords: ['房租', '物业', '水电', '燃气', '水费', '电费', '宽带', '房贷', '租房', '房屋', '维修', '装修'] },
      { id: 6, name: '医疗', keywords: ['医院', '药店', '体检', '诊所', '卫生院', '医疗', '门诊', '挂号', '药房', '医药', '就诊', '治疗', '检查', '化验', '看病', '买药', '配药', '平安好医生', '微医', '丁香医生', '美年大健康', '爱康国宾'] },
      { id: 7, name: '通讯', keywords: ['话费', '流量', '移动', '联通', '电信', '充值', '套餐', '网费'] },
      { id: 8, name: '服饰', keywords: ['衣服', '鞋子', '包包', '服装', '优衣库', 'ZARA', 'H&M', '裤子', '裙子', '外套', '内衣', '袜子', '帽子', '围巾', '手表', '眼镜', 'GAP', 'UR', '海澜之家', '太平鸟'] },
      { id: 9, name: '美容', keywords: ['美发', '美甲', '化妆品', '理发', '美容院', '护肤', '美容', '化妆', '洗头', '染发', '烫发', '面膜', '口红', '香水', '屈臣氏', '丝芙兰', '娇兰佳人', '快剪', '文峰', '永琪'] },
      { id: 10, name: '学习', keywords: ['书籍', '课程', '培训', '教育', '书店', '文具', '学习', '考试', '报名', '辅导', '补习', '网课', '教材', '学而思', '猿辅导', '作业帮', '新东方', '英孚', '达内'] },
      { id: 11, name: '社交', keywords: ['聚餐', '礼物', '红包', '送礼', '份子钱', '婚礼', '生日', '聚会', '宴请'] },
      { id: 13, name: '零食', keywords: ['零食', '饮料', '水果', '小食', '坚果', '薯片', '饼干', '糖果', '巧克力', '果汁', '可乐', '雪碧', '矿泉水', '苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓', '好想来'] },
      { id: 14, name: '数码', keywords: ['手机', '电脑', '平板', '相机', '耳机', '音箱', '键盘', '鼠标', '充电器', '数据线', '移动硬盘', 'U盘', '苹果', 'iPhone', 'iPad', 'Mac', '华为', '小米', '戴尔', '联想'] },
      { id: 15, name: '家居', keywords: ['家具', '家电', '日用品', '厨具', '床上用品', '沙发', '桌椅', '冰箱', '洗衣机', '空调', '电视', '微波炉', '电饭煲', '宜家', '无印良品', 'MUJI', '名创优品'] },
      { id: 16, name: '汽车', keywords: ['车贷', '保养', '维修', '保险', '洗车', '年检', '违章', '车险', '4S店', '汽修', '换油', '轮胎', '中石油', '中石化', '壳牌'] },
      { id: 17, name: '宠物', keywords: ['宠物', '猫粮', '狗粮', '宠物医院', '宠物店', '宠物美容', '猫砂', '宠物用品', '疫苗', '驱虫', '绝育', '瑞鹏', '芭比堂', '波奇', 'E宠'] }
    ]
    
    const searchText = (text + ' ' + merchant).toLowerCase()
    
    for (const category of categories) {
      for (const keyword of category.keywords) {
        if (searchText.includes(keyword)) {
          console.log('匹配到支出分类:', category.name, '关键词:', keyword)
          return { id: category.id, name: category.name }
        }
      }
    }
    
    console.log('未匹配到支出分类，返回空')
    return { id: null, name: '' }
  }
}
