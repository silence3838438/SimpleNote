const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// 简单的速率限制（内存存储，生产环境建议用 Redis）
const rateLimitMap = new Map();
const RATE_LIMIT = {
  maxRequests: 20,              // 登录用户：每小时 20 次
  windowMs: 60 * 60 * 1000,
  aiEnabled: true               // 登录用户启用 AI
};

// 速率限制检查
function checkRateLimit(userId) {
  const now = Date.now();
  const key = userId;
  
  if (!rateLimitMap.has(key)) {
    rateLimitMap.set(key, { count: 1, resetTime: now + RATE_LIMIT.windowMs });
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }
  
  const record = rateLimitMap.get(key);
  
  // 重置计数器
  if (now > record.resetTime) {
    record.count = 1;
    record.resetTime = now + RATE_LIMIT.windowMs;
    return { allowed: true, remaining: RATE_LIMIT.maxRequests - 1 };
  }
  
  // 检查是否超限
  if (record.count >= RATE_LIMIT.maxRequests) {
    return { 
      allowed: false, 
      remaining: 0,
      resetTime: record.resetTime 
    };
  }
  
  record.count++;
  return { allowed: true, remaining: RATE_LIMIT.maxRequests - record.count };
}

// 百度OCR识别
router.post('/', async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!userId) {
      return res.json({
        success: false,
        error: '请先登录后再使用此功能',
        needLogin: true
      });
    }
    
    // 速率限制检查
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      const resetDate = new Date(rateLimit.resetTime);
      return res.json({
        success: false,
        error: `请求过于频繁，请稍后再试（重置时间：${resetDate.toLocaleTimeString()})`
      });
    }
    
    let { fileID, imageBase64, imageUrl, useAI = false } = req.body;
    
    // 如果传的是图片 URL，转换为 base64
    if (imageUrl && !imageBase64) {
      try {
        let imagePath;
        
        // 判断是完整URL还是相对路径
        if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
          // 完整URL: 提取路径部分 (如 /uploads/xxx.jpg)
          const urlObj = new URL(imageUrl);
          // urlObj.pathname 是 /uploads/xxx.jpg
          // 需要转换为 ./uploads/xxx.jpg
          imagePath = path.join(__dirname, '..', urlObj.pathname);
        } else if (imageUrl.startsWith('/uploads/')) {
          // 绝对路径: /uploads/xxx.jpg
          imagePath = path.join(__dirname, '..', imageUrl);
        } else {
          // 相对路径: uploads/xxx.jpg
          imagePath = path.join(__dirname, '..', imageUrl);
        }
        
        console.log('原始URL:', imageUrl);
        console.log('解析后的本地路径:', imagePath);
        
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          imageBase64 = imageBuffer.toString('base64');
          console.log('✅ 图片读取成功，大小:', imageBuffer.length, 'bytes');
        } else {
          console.error('❌ 图片文件不存在:', imagePath);
          // 列出uploads目录的文件帮助调试
          const uploadsDir = path.join(__dirname, '..', 'uploads');
          if (fs.existsSync(uploadsDir)) {
            const files = fs.readdirSync(uploadsDir);
            console.log('uploads目录现有文件:', files.slice(0, 5));
          }
          return res.json({
            success: false,
            error: '图片文件不存在'
          });
        }
      } catch (error) {
        console.error('❌ 图片转换失败:', error);
        return res.json({
          success: false,
          error: '图片转换失败: ' + error.message
        });
      }
    }
    
    if (!imageBase64 && !fileID) {
      return res.json({
        success: false,
        error: '缺少图片数据'
      });
    }

    // 获取百度access_token
    const tokenUrl = `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${process.env.BAIDU_OCR_API_KEY}&client_secret=${process.env.BAIDU_OCR_SECRET_KEY}`;
    
    const tokenRes = await axios.post(tokenUrl);
    const accessToken = tokenRes.data.access_token;

    // 调用票据识别API
    const ocrUrl = `https://aip.baidubce.com/rest/2.0/ocr/v1/receipt?access_token=${accessToken}`;
    
    const ocrRes = await axios.post(ocrUrl, 
      `image=${encodeURIComponent(imageBase64)}&recognize_granularity=big&probability=true&detect_direction=true`,
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );

    if (ocrRes.data.error_code) {
      return res.json({
        success: false,
        error: ocrRes.data.error_msg || '识别失败'
      });
    }

    // 解析OCR结果
    const billInfo = parseOCRResult(ocrRes.data);
    
    // AI 增强已移至前端，后端只做正则解析
    console.log('后端正则解析完成，AI 增强由前端处理');

    res.json({
      success: true,
      text: billInfo.rawText,
      data: billInfo
    });

  } catch (error) {
    console.error('OCR识别失败:', error);
    res.json({
      success: false,
      error: error.message || '识别失败，请重试',
      data: {
        amount: 0,
        merchant: '',
        date: new Date().toISOString().split('T')[0],
        categoryId: 12,
        categoryName: '其他'
      }
    });
  }
});

// 解析OCR结果（使用旧项目完整识别规则）
function parseOCRResult(ocrResult) {
  const words = ocrResult.words_result || [];
  const allText = words.map(item => item.words).join(' ');
  
  console.log('========== OCR 识别原始文本 ==========');
  console.log(allText);
  console.log('========== 文本长度:', allText.length, '==========');
  
  // 判断收入还是支出
  const expenseKeywords = ['购买', '消费', '支付', '实付', '应付', '合计', '小票', '订单', '商品', '数量', '单据号', '门店', '零食', '超市', '便利店'];
  let isDefinitelyExpense = false;
  for (const keyword of expenseKeywords) {
    if (allText.includes(keyword)) {
      isDefinitelyExpense = true;
      console.log('确认为支出类型，关键词:', keyword);
      break;
    }
  }
  
  const incomeKeywords = ['工资', '薪资', '薪水', '奖金', '红包', '退款', '收入', '报销', '兼职', '分红', '利息', '收到转账', '转账收入', '到账'];
  let type = 'expense';
  
  if (!isDefinitelyExpense) {
    for (const keyword of incomeKeywords) {
      if (allText.includes(keyword)) {
        type = 'income';
        console.log('识别为收入类型，关键词:', keyword);
        break;
      }
    }
  }
  
  // 提取金额 - 按优先级匹配
  let amount = 0;
  let foundWithKeyword = false;
  
  console.log('========== 开始提取金额 ==========');
  
  // 【优先级1】关键词金额（最高优先）
  const keywordPatterns = [
    // 最高优先：价税合计（电子发票的实付金额）
    /价税合计[^¥￥$]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 次高优先：实付/实收（排除税后、优惠等负面关键词）
    /(?<!税后|优惠|折扣|减免|抵扣)实付[金额款：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后|优惠|折扣|减免|抵扣)实收[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后|优惠|折扣|减免|抵扣)实结[金额款：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后|优惠|折扣|减免|抵扣)实际支付[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 次优先：合计/总计/小计（排除税后）
    /(?<!税后)合计[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后)总计[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后)小计[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后)支付金额[：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后)订单金额[：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 再次：应付/应收（排除税后）
    /(?<!税后)应付[金额款：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后)应收[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    
    // 其他常见关键词（排除税后）
    /(?<!税后)在线支付[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后|税前|税额|税率)金额[：:]\s*[¥￥$]?\s*(\d+\.?\d*)/,
    /(?<!税后)总额[金额：:\s]*[¥￥$]?\s*(\d+\.?\d*)/,
    /[¥￥$]\s*(\d+\.?\d*)/,
    /(\d+\.?\d*)\s*元/
  ];
  
  for (const pattern of keywordPatterns) {
    const match = allText.match(pattern);
    if (match && match[1]) {
      const parsedAmount = parseFloat(match[1]);
      if (parsedAmount > 0 && parsedAmount < 100000) {
        // 检查金额前后文，排除无关金额
        const matchIndex = allText.indexOf(match[0]);
        const beforeText = allText.substring(Math.max(0, matchIndex - 15), matchIndex);
        const afterText = allText.substring(matchIndex + match[0].length, Math.min(allText.length, matchIndex + match[0].length + 15));
        
        // 排除：门禁密码、放XX元、存XX元等无关金额
        if (beforeText.includes('门禁') || beforeText.includes('密码') || 
            beforeText.includes('放') || beforeText.includes('存') ||
            beforeText.includes('输入') || beforeText.includes('开门')) {
          console.log('跳过无关金额（门禁/密码相关）:', parsedAmount);
          continue;
        }
        
        if (match[1].includes('.')) {
          amount = parsedAmount;
          foundWithKeyword = true;
          console.log('【优先级1】匹配到关键词金额（有小数点）:', amount);
          break;
        } else {
          const numStr = match[1];
          if (numStr.length === 4 && parsedAmount <= 2400) {
            console.log('跳过可能是时间的数字:', parsedAmount);
            continue;
          }
          if (parsedAmount >= 10) {
            amount = parsedAmount;
            foundWithKeyword = true;
            console.log('【优先级1】匹配到关键词金额（>=10）:', amount);
            break;
          }
        }
      }
    }
  }
  
  // 【优先级2】商品列表识别
  if (!foundWithKeyword) {
    console.log('【优先级2】未通过关键词找到金额，尝试识别商品列表');
    
    // OCR错误修正：*115.89 可能是 *1 15.89
    let correctedText = allText;
    const ocrErrorPattern = /\*1(\d{2,3}\.\d+)/g;
    let ocrMatch;
    const corrections = [];
    
    while ((ocrMatch = ocrErrorPattern.exec(allText)) !== null) {
      const fullMatch = ocrMatch[0];
      const priceStr = ocrMatch[1];
      const price = parseFloat(priceStr);
      
      if (price > 0 && price < 1000) {
        const corrected = `*1 ${priceStr}`;
        corrections.push({ original: fullMatch, corrected, price });
        console.log(`OCR错误修正: ${fullMatch} → ${corrected}`);
      }
    }
    
    if (corrections.length > 0) {
      for (const correction of corrections) {
        correctedText = correctedText.replace(correction.original, correction.corrected);
      }
      
      // 如果只有一个商品且修正成功，直接使用修正后的价格
      if (corrections.length === 1) {
        amount = corrections[0].price;
        foundWithKeyword = true;
        console.log('【优先级2】使用OCR修正后的单商品价格:', amount);
      }
    }
    
    // 格式1：*数量 单价 小计
    if (!foundWithKeyword) {
      const itemWithSubtotalPattern = /\*(\d+)\s+(\d+\.?\d*)\s+(\d+\.?\d*)/g;
      let subtotals = [];
      let match;
      while ((match = itemWithSubtotalPattern.exec(correctedText)) !== null) {
        const quantity = parseInt(match[1]);
        const unitPrice = parseFloat(match[2]);
        const subtotal = parseFloat(match[3]);
        
        if (subtotal > 0 && subtotal < 10000 && Math.abs(subtotal - quantity * unitPrice) < 0.1) {
          subtotals.push(subtotal);
          console.log(`找到商品小计: *${quantity} ${unitPrice} ${subtotal}`);
        }
      }
      
      if (subtotals.length > 0) {
        amount = subtotals.reduce((sum, val) => sum + val, 0);
        foundWithKeyword = true;
        console.log('【优先级2】累加商品小计作为金额:', amount);
      }
    }
    
    // 格式2：*数量 单价
    if (!foundWithKeyword) {
      const itemPattern = /\*(\d+)\s+(\d+\.?\d*)/g;
      let calculatedAmounts = [];
      let match;
      while ((match = itemPattern.exec(correctedText)) !== null) {
        const quantity = parseInt(match[1]);
        const unitPrice = parseFloat(match[2]);
        const calculated = quantity * unitPrice;
        
        if (calculated > 0 && calculated < 10000) {
          calculatedAmounts.push(calculated);
          console.log(`计算商品金额: *${quantity} × ${unitPrice} = ${calculated}`);
        }
      }
      
      if (calculatedAmounts.length > 0) {
        amount = calculatedAmounts.reduce((sum, val) => sum + val, 0);
        foundWithKeyword = true;
        console.log('【优先级2】累加计算金额:', amount);
      }
    }
  }
  
  // 【优先级3】过滤无效金额后取最大值
  if (!foundWithKeyword) {
    console.log('【优先级3】尝试从所有数字中过滤并取最大值');
    const allNumbers = allText.match(/\d+\.?\d*/g) || [];
    const validNumbers = [];
    
    for (const numStr of allNumbers) {
      const num = parseFloat(numStr);
      if (num <= 0 || num >= 100000) continue;
      
      const numIndex = allText.indexOf(numStr);
      const beforeText = allText.substring(Math.max(0, numIndex - 10), numIndex);
      
      // 过滤负数金额、转账号码、订单号、手机号、时间、税后金额
      if (beforeText.includes('-') || beforeText.includes('优惠') || beforeText.includes('折扣') ||
          beforeText.includes('税后') || beforeText.includes('税额') || beforeText.includes('税金') ||
          beforeText.includes('转') || /(?:ID|订单号|会员号|流水号)[：:]\s*$/.test(beforeText) ||
          /(?:手机|电话|号码|尾号|联系)[^0-9]{0,5}$/.test(beforeText) ||
          (numStr.length === 4 && num <= 2400)) {
        continue;
      }
      
      validNumbers.push(num);
    }
    
    if (validNumbers.length > 0) {
      amount = Math.max(...validNumbers);
      console.log('【优先级3】使用最大正数金额:', amount);
    }
  }

  // 提取商家名/备注 - 按优先级顺序识别
  let merchant = '';
  
  if (type === 'income') {
    // 收入类型：提取来源信息（更详细的识别规则）
    let tempMerchant = '';
    
    // 1. 工资类 - 识别公司名称
    if (!tempMerchant && (allText.includes('工资') || allText.includes('薪资') || allText.includes('薪水'))) {
      // 匹配公司名称模式
      const companyPatterns = [
        /(?:公司|企业|集团|科技|有限)[：:]\s*([^\s\n]{2,20})/,
        /([^\s\n]{2,20}(?:公司|企业|集团|科技|有限公司))/,
        /付款方[：:]\s*([^\s\n]{2,20})/,
        /单位[：:]\s*([^\s\n]{2,20})/
      ];
      
      for (const pattern of companyPatterns) {
        const match = allText.match(pattern);
        if (match && match[1]) {
          tempMerchant = match[1].trim();
          console.log('匹配到工资来源（公司）:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '公司工资';
      }
    }
    
    // 2. 兼职类 - 识别平台或项目
    if (!tempMerchant && (allText.includes('兼职') || allText.includes('外快') || allText.includes('副业'))) {
      const freelancePatterns = [
        // 外卖配送平台
        /美团众包|美团跑腿|饿了么蜂鸟|闪送|达达|UU跑腿|顺丰同城/,
        // 网约车平台
        /滴滴|T3出行|首汽|曹操|高德打车/,
        // 自由职业平台
        /猪八戒|威客|自由职客|upwork|fiverr/,
        // 通用模式
        /平台[：:]\s*([^\s\n]{2,15})/,
        /项目[：:]\s*([^\s\n]{2,15})/
      ];
      
      for (const pattern of freelancePatterns) {
        const match = allText.match(pattern);
        if (match) {
          tempMerchant = match[0] || match[1];
          console.log('匹配到兼职来源:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '兼职收入';
      }
    }
    
    // 3. 投资理财类 - 识别平台
    if (!tempMerchant && (allText.includes('收益') || allText.includes('利息') || allText.includes('分红') || allText.includes('理财'))) {
      const investmentPlatforms = [
        '支付宝', '余额宝', '微信理财通', '理财通', '蚂蚁财富', '天天基金',
        '雪球', '东方财富', '同花顺', '京东金融', '度小满'
      ];
      
      for (const platform of investmentPlatforms) {
        if (allText.includes(platform)) {
          tempMerchant = platform;
          console.log('匹配到投资理财平台:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '投资收益';
      }
    }
    
    // 4. 退款类 - 识别电商平台
    if (!tempMerchant && (allText.includes('退款') || allText.includes('退货'))) {
      const ecommercePlatforms = [
        '淘宝', '天猫', '京东', '拼多多', '唯品会', '苏宁', '国美', '当当', '亚马逊',
        '美团', '饿了么', '抖音', '快手'
      ];
      
      for (const platform of ecommercePlatforms) {
        if (allText.includes(platform)) {
          tempMerchant = platform + '退款';
          console.log('匹配到退款平台:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '退款';
      }
    }
    
    // 5. 报销类 - 识别公司或项目
    if (!tempMerchant && (allText.includes('报销') || allText.includes('补贴') || allText.includes('津贴'))) {
      const reimbursementTypes = [
        '餐补', '交通补贴', '通讯补贴', '房补', '差旅费', '加班费'
      ];
      
      for (const type of reimbursementTypes) {
        if (allText.includes(type)) {
          tempMerchant = '公司' + type;
          console.log('匹配到报销类型:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '公司报销';
      }
    }
    
    // 6. 红包类 - 识别平台或场景
    if (!tempMerchant && allText.includes('红包')) {
      if (allText.includes('微信')) {
        tempMerchant = '微信红包';
      } else if (allText.includes('支付宝')) {
        tempMerchant = '支付宝红包';
      } else if (allText.includes('压岁钱') || allText.includes('过年')) {
        tempMerchant = '压岁钱';
      } else if (allText.includes('生日')) {
        tempMerchant = '生日红包';
      } else if (allText.includes('结婚')) {
        tempMerchant = '结婚红包';
      } else {
        tempMerchant = '红包';
      }
      console.log('匹配到红包来源:', tempMerchant);
    }
    
    // 7. 借入类 - 识别借款平台或人
    if (!tempMerchant && (allText.includes('借入') || allText.includes('借款') || allText.includes('贷款'))) {
      const loanPlatforms = [
        '花呗', '借呗', '微粒贷', '白条', '京东白条', '信用贷',
        '银行', '朋友', '亲戚', '家人', '同事'
      ];
      
      for (const platform of loanPlatforms) {
        if (allText.includes(platform)) {
          tempMerchant = platform;
          console.log('匹配到借款来源:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '借入';
      }
    }
    
    // 8. 出售类 - 识别平台
    if (!tempMerchant && (allText.includes('出售') || allText.includes('转卖') || allText.includes('二手'))) {
      const secondhandPlatforms = [
        '闲鱼', '转转', '拍拍', '爱回收', '找靓机'
      ];
      
      for (const platform of secondhandPlatforms) {
        if (allText.includes(platform)) {
          tempMerchant = platform;
          console.log('匹配到二手平台:', tempMerchant);
          break;
        }
      }
      
      if (!tempMerchant) {
        tempMerchant = '二手出售';
      }
    }
    
    // 9. 租金类 - 识别租客或平台
    if (!tempMerchant && (allText.includes('租金') || allText.includes('房租收入'))) {
      tempMerchant = '房租收入';
      console.log('匹配到租金来源:', tempMerchant);
    }
    
    // 10. 中奖类
    if (!tempMerchant && (allText.includes('中奖') || allText.includes('彩票') || allText.includes('抽奖'))) {
      tempMerchant = '中奖';
      console.log('匹配到中奖来源:', tempMerchant);
    }
    
    // 11. 通用备注字段提取
    if (!tempMerchant) {
      const incomeNotePatterns = [
        /备注[：:]\s*(.+?)(?:\s|$)/,
        /说明[：:]\s*(.+?)(?:\s|$)/,
        /用途[：:]\s*(.+?)(?:\s|$)/,
        /项目[：:]\s*(.+?)(?:\s|$)/,
        /来源[：:]\s*(.+?)(?:\s|$)/,
        /付款方[：:]\s*(.+?)(?:\s|$)/
      ];
      
      for (const pattern of incomeNotePatterns) {
        const match = allText.match(pattern);
        if (match && match[1]) {
          tempMerchant = match[1].trim();
          console.log('从备注字段提取来源:', tempMerchant);
          break;
        }
      }
    }
    
    // 12. 根据关键词推断来源
    if (!tempMerchant) {
      for (const keyword of incomeKeywords) {
        if (allText.includes(keyword)) {
          // 根据关键词生成更友好的来源名称
          if (keyword === '工资' || keyword === '薪资' || keyword === '薪水') {
            tempMerchant = '公司工资';
          } else if (keyword === '奖金' || keyword === '年终奖') {
            tempMerchant = '公司奖金';
          } else if (keyword === '兼职') {
            tempMerchant = '兼职收入';
          } else if (keyword === '红包') {
            tempMerchant = '红包';
          } else if (keyword === '退款') {
            tempMerchant = '退款';
          } else if (keyword === '报销') {
            tempMerchant = '公司报销';
          } else if (keyword === '利息' || keyword === '收益') {
            tempMerchant = '投资收益';
          } else {
            tempMerchant = keyword;
          }
          console.log('根据关键词推断来源:', tempMerchant);
          break;
        }
      }
    }
    
    // 13. 兜底：使用"其他来源"
    if (!tempMerchant) {
      tempMerchant = '其他来源';
      console.log('使用默认来源:', tempMerchant);
    }
    
    merchant = tempMerchant;
    console.log('最终收入来源:', merchant);
  } else {
    // 支出类型：按优先级顺序识别商家
    let tempMerchant = '未知商家';
    
    // 1. 电子发票：销售方名称识别（最高优先级）
    if (tempMerchant === '未知商家') {
      const sellerMatch1 = allText.match(/售\s*名\s*称\s*[：:]\s*([^统一社会信用代码纳税人识别号方信息]+)/);
      if (sellerMatch1 && sellerMatch1[1]) {
        const name = sellerMatch1[1].trim();
        if (name.length > 2 && !name.includes('买') && !name.includes('单价') && !name.includes('数量') && !name.includes('项目')) {
          tempMerchant = name;
          console.log('匹配到销售方名称（方案1）:', tempMerchant);
        }
      }
    }
    
    // 2. 电子发票：销方名称
    if (tempMerchant === '未知商家') {
      const sellerMatch2 = allText.match(/销\s*方[^名]*名\s*称\s*[：:]\s*([^统一社会信用代码纳税人识别号方信息]+)/);
      if (sellerMatch2 && sellerMatch2[1]) {
        const name = sellerMatch2[1].trim();
        if (name.length > 2 && !name.includes('买') && !name.includes('单价') && !name.includes('数量') && !name.includes('项目')) {
          tempMerchant = name;
          console.log('匹配到销方名称（方案2）:', tempMerchant);
        }
      }
    }
    
    // 3. 销售方名称（无空格版本）
    if (tempMerchant === '未知商家') {
      const sellerMatch3 = allText.match(/销售方名称[：:]\s*([^统一社会信用代码纳税人识别号\s]+)/);
      if (sellerMatch3 && sellerMatch3[1]) {
        const name = sellerMatch3[1].trim();
        if (name.length > 2 && !name.includes('买方') && !name.includes('单价') && !name.includes('数量')) {
          tempMerchant = name;
          console.log('匹配到销售方名称（方案3）:', tempMerchant);
        }
      }
    }
    
    // 4. 外卖小票：商家名称字段
    if (tempMerchant === '未知商家') {
      const takeoutMatch = allText.match(/(?:商家名称|门店名称|店铺名称)[：:]\s*([^\n\r]+?)(?:\s|订单编号|下单时间|联系电话|$)/);
      if (takeoutMatch && takeoutMatch[1]) {
        tempMerchant = takeoutMatch[1].trim();
        console.log('匹配到外卖商家:', tempMerchant);
      }
    }
    
    // 4.5. 小票开头的商家名（新增）
    if (tempMerchant === '未知商家') {
      // 匹配开头的中文商家名（排除数字、符号开头）
      const headerMatch = allText.match(/^[\d\s。.]*([^\d\s。.][^\n\r收银员牌号单据号订单编号]{2,20}?)(?:\s|收银员|牌号|单据号|订单|门店|$)/);
      if (headerMatch && headerMatch[1]) {
        const name = headerMatch[1].trim();
        // 过滤掉一些无效的匹配（包括小票标识）
        if (!name.includes('欢迎') && !name.includes('谢谢') && !name.includes('光临') && 
            !name.includes('消费') && !name.includes('小票') && 
            !name.includes('顾客联') && !name.includes('商家联') && !name.includes('存根联') &&
            !name.includes('#') && name.length >= 2) {
          tempMerchant = name;
          console.log('从小票开头提取商家:', tempMerchant);
        }
      }
    }
    
    // 5. 平台+商家组合
    if (tempMerchant === '未知商家') {
      const fullPlatforms = ['淘宝闪购', '美团外卖', '饿了么外卖', '饿了么', '京东到家', '盒马鲜生', '叮咚买菜'];
      for (const platform of fullPlatforms) {
        if (allText.includes(platform)) {
          tempMerchant = platform;
          console.log('匹配到完整平台名称:', tempMerchant);
          break;
        }
      }
      
      if (tempMerchant === '未知商家') {
        const partialPlatforms = ['闪购', '美团', '京东'];
        for (const platform of partialPlatforms) {
          if (allText.includes(platform)) {
            const regex = new RegExp(`([^\\s]{0,4}${platform})`);
            const match = allText.match(regex);
            if (match && match[1]) {
              tempMerchant = match[1].trim();
              console.log('匹配到部分平台名称:', tempMerchant);
              break;
            }
          }
        }
      }
    }
    
    // 6. 超市小票 - 优先匹配知名超市品牌（扩展版）
    if (tempMerchant === '未知商家') {
      const supermarketBrands = [
        // 大型超市
        '沃尔玛', '家乐福', '大润发', '永辉', '华润万家', '物美', '苏宁', '国美', 
        '山姆会员店', '麦德龙', '欧尚', '卜蜂莲花', '世纪联华', '联华超市', '华联',
        // 便利店
        '7-11', '全家', '罗森', '便利蜂', '好邻居', '快客', '喜士多', '美宜佳', '天福',
        // 新零售
        '盒马', '盒马鲜生', '叮咚买菜', '每日优鲜', '朴朴超市', '京东到家',
        // 区域超市
        '苏果', '好想来', '华冠', '北京华联', '上海联华', '广州百佳', '深圳天虹',
        '武商', '中百', '家家悦', '胖东来', '步步高'
      ];
      
      for (const brand of supermarketBrands) {
        if (allText.includes(brand)) {
          // 尝试匹配完整店名
          const regex = new RegExp(`(${brand}[\\u4e00-\\u9fa5]{0,15}(?:店|超市|购物中心|商场|便利店)?)`);
          const match = allText.match(regex);
          if (match && match[1]) {
            tempMerchant = match[1].trim();
            console.log('匹配到超市品牌（完整）:', tempMerchant);
            break;
          } else {
            tempMerchant = brand;
            console.log('匹配到超市品牌:', tempMerchant);
            break;
          }
        }
      }
    }
    
    // 7. 超市小票 - 通过字段识别
    if (tempMerchant === '未知商家') {
      const supermarketMatch = allText.match(/(?:店名|门店|商店|超市)[：:]\s*(.+?)(?:\s|电话|地址|$)/);
      if (supermarketMatch && supermarketMatch[1]) {
        tempMerchant = supermarketMatch[1].trim();
        console.log('匹配到超市门店:', tempMerchant);
      }
    }
    
    // 8. 医院票据
    if (tempMerchant === '未知商家') {
      const hospitalMatch = allText.match(/([\u4e00-\u9fa5]+(?:医院|诊所|卫生院|医疗|门诊)[\u4e00-\u9fa5]*)/);
      if (hospitalMatch && hospitalMatch[1]) {
        tempMerchant = hospitalMatch[1].trim();
        console.log('匹配到医院名称:', tempMerchant);
      }
    }
    
    // 9. 其他商家模式
    if (tempMerchant === '未知商家') {
      const merchantPatterns = [
        /商家[：:]\s*(.+?)(?:\s|统一社会信用|$)/,
        /商户[：:]\s*(.+?)(?:\s|统一社会信用|$)/,
        /收款方[：:]\s*(.+?)(?:\s|$)/
      ];
      
      for (const pattern of merchantPatterns) {
        const match = allText.match(pattern);
        if (match && match[1]) {
          const name = match[1].trim();
          if (!name.includes('电子商务') && !name.includes('买方') && name.length > 1) {
            tempMerchant = name;
            console.log('匹配到商家:', tempMerchant);
            break;
          }
        }
      }
    }
    
    // 10. 项目名称
    if (tempMerchant === '未知商家') {
      const itemMatch = allText.match(/项目名称\s*(.+?)(?:\s|单价|数量|金额|$)/);
      if (itemMatch && itemMatch[1]) {
        tempMerchant = itemMatch[1].trim();
        console.log('从项目名称提取商家:', tempMerchant);
      }
    }
    
    // 11. 旅客运输服务
    if (tempMerchant === '未知商家') {
      if (allText.includes('旅客运输服务') || allText.includes('客运服务')) {
        const transportMatch = allText.match(/([\u4e00-\u9fa5]+(?:出行|运输|客运|交通)[\u4e00-\u9fa5（）()]*(?:科技)?(?:股份)?(?:有限)?(?:公司)?)/);
        if (transportMatch && transportMatch[1]) {
          tempMerchant = transportMatch[1].trim();
          console.log('从运输服务关键词提取商家:', tempMerchant);
        }
      }
    }
    
    // 12. 超市关键词（通用匹配）
    if (tempMerchant === '未知商家') {
      const supermarketKeywords = ['超市', '便利店', '商场', '购物中心', '百货'];
      for (const keyword of supermarketKeywords) {
        if (allText.includes(keyword)) {
          const regex = new RegExp(`([\\u4e00-\\u9fa5A-Za-z0-9]+${keyword}[\\u4e00-\\u9fa5A-Za-z0-9]*)`);
          const match = allText.match(regex);
          if (match && match[1]) {
            tempMerchant = match[1].trim();
            console.log('从超市关键词提取商家:', tempMerchant);
            break;
          }
        }
      }
    }
    
    // 13. 外卖平台关键词（降低优先级）
    if (tempMerchant === '未知商家') {
      const takeoutPlatforms = ['外卖', '美团', '饿了么', '淘宝'];
      for (const platform of takeoutPlatforms) {
        if (allText.includes(platform)) {
          const regex = new RegExp(`${platform}[^\\n]{0,30}`);
          const match = allText.match(regex);
          if (match && match[0]) {
            const fullText = match[0].trim();
            const cleanText = fullText.replace(/顾客|小票|订单|编号|时间|电话/g, '').trim();
            if (cleanText.length > platform.length + 2) {
              tempMerchant = cleanText;
              console.log('从外卖平台提取商家:', tempMerchant);
              break;
            }
          }
          if (tempMerchant === '未知商家') {
            tempMerchant = platform;
            console.log('使用平台名称作为商家:', tempMerchant);
            break;
          }
        }
      }
    }
    
    // 如果识别到了商家，赋值给merchant
    if (tempMerchant !== '未知商家') {
      merchant = tempMerchant;
    }
    console.log('最终商家识别结果:', merchant || '(空)');
  }

  // 提取日期
  const dateMatch = allText.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/);
  let date = new Date().toISOString().split('T')[0];
  if (dateMatch) {
    let year = parseInt(dateMatch[1]);
    let month = parseInt(dateMatch[2]);
    let day = parseInt(dateMatch[3]);
    
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const currentDay = new Date().getDate();
    
    // 修正月份：只修正明显错误的情况（>12）
    if (month > 12) {
      console.log('月份>12，明显错误，使用当前月份:', dateMatch[2], '->', currentMonth);
      month = currentMonth;
    }
    
    // 修正日期：只修正明显错误的情况（>31）
    if (day > 31) {
      console.log('日期>31，明显错误，使用当前日期:', dateMatch[3], '->', currentDay);
      day = currentDay;
    }
    
    // 验证日期合理性：不能是未来日期
    const parsedDate = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    
    if (parsedDate > today) {
      console.log('日期在未来，使用今天。原始:', `${year}-${month}-${day}`, '今天:', date);
      date = new Date().toISOString().split('T')[0];
    } else {
      const monthStr = month.toString().padStart(2, '0');
      const dayStr = day.toString().padStart(2, '0');
      date = `${year}-${monthStr}-${dayStr}`;
      console.log('匹配到日期:', date);
    }
  }
  
  // 智能分类
  const categoryInfo = smartClassify(allText, merchant, type);
  console.log('智能分类结果:', categoryInfo);
  
  // 提取备注 - 全面优化版
  let remark = '';
  
  console.log('========== 开始提取备注 ==========');
  console.log('商家名称:', merchant);
  console.log('账单类型:', type);
  
  if (type === 'expense') {
    // 策略1: 从商品列表中提取（超市小票、外卖订单）
    const itemPatterns = [
      // 格式: 数字.商品名 数量金额（外卖常见格式）
      /\d+\.([^\d\n\r]{2,20}?)\s*\d+[\d.]+/g,
      // 格式: 商品名+商品名+商品名（美团格式）
      /(\d+号口袋|袋)\s+([^\n\r*]{3,30}?)(?:\s+默认|\s+\*)/g,
      // 格式: 商品名 *数量 单价 小计
      /([^\d\s*¥￥$]{2,15})\s*\*\d+\s+[\d.]+\s+[\d.]+/g,
      // 格式: 商品名 数量 单价
      /([^\d\s*¥￥$]{2,15})\s*\*\d+\s+[\d.]+/g,
      // 格式: 商品名(规格)数字g（苏果格式1 - 有括号）
      /([\u4e00-\u9fa5]{2,6})\([\u4e00-\u9fa5]+\)\d+g/g,
      // 格式: 商品名数字g（苏果格式2 - 无括号）
      /([\u4e00-\u9fa5]{2,6})\d+g/g,
      // 格式: 品名后直接跟商品名+系列（好想来格式1 - 最精确）
      /([\u4e00-\u9fa5]{2,10})系列\s+[\d.\/]+/g,
      // 格式: 品名 商品名 价格（好想来格式2 - 允许品名和商品名之间有干扰字符）
      /品名[^\u4e00-\u9fa5]{0,50}([\u4e00-\u9fa5]{3,10})(?:系列)?\s+[\d.\/]+/g,
      // 格式: 商品名称: xxx
      /商品名称[：:]\s*([^\d\n\r]{2,20})/g,
      // 格式: 项目名称: xxx
      /项目名称[：:]\s*([^\d\n\r]{2,20})/g
    ];
    
    const items = [];
    for (const pattern of itemPatterns) {
      const matches = allText.matchAll(pattern);
      for (const match of matches) {
        // 对于美团格式，使用第2个捕获组
        const itemText = match[2] || match[1];
        if (itemText) {
          let item = itemText.trim();
          // 清理无效字符和多余空格
          item = item.replace(/[()（）\[\]【】]/g, '').replace(/\s+/g, '').trim();
          // 过滤掉无效词和过长的商品名
          if (item.length >= 2 && item.length <= 30 &&
              !item.includes('收银') && !item.includes('流水') && 
              !item.includes('机号') && !item.includes('单据') &&
              !item.includes('数量') && !item.includes('单价') &&
              !item.includes('金额') && !item.includes('合计') &&
              !item.includes('原价') && !item.includes('折后') &&
              !item.includes('重量') && !item.includes('商品书')) {
            // 移除"系列"后缀
            item = item.replace(/系列$/g, '');
            // 对于美团格式，拆分多个菜品
            if (item.includes('+')) {
              const dishes = item.split('+').map(d => d.replace(/\d+个/g, '').trim()).filter(d => d.length >= 2);
              items.push(...dishes);
            } else {
              items.push(item);
            }
          }
        }
      }
      // 删除break，让所有正则都尝试匹配，收集所有商品后再去重
    }
    
    if (items.length > 0) {
      // 去重并限制数量
      const uniqueItems = [...new Set(items)];
      remark = uniqueItems.slice(0, 3).join('、');
      console.log('从商品列表提取备注:', remark);
    }
    
    // 策略2: 餐饮类 - 识别菜品名称
    if (!remark && (merchant.includes('餐') || merchant.includes('饭') || 
                     merchant.includes('食') || merchant.includes('厨') ||
                     allText.includes('菜品') || allText.includes('点餐'))) {
      const dishKeywords = [
        // 主食类
        '米饭', '面条', '拉面', '炒面', '炒饭', '盖饭', '烩饭', '粥', '馒头', '包子', '饺子', '馄饨', '汤面', '干面',
        // 肉类
        '鸡肉', '牛肉', '猪肉', '羊肉', '鱼肉', '虾', '蟹', '鸭肉', '排骨', '肉片', '肉丝', '肉丁',
        // 蔬菜类
        '青菜', '白菜', '菠菜', '生菜', '油菜', '芹菜', '豆角', '茄子', '土豆', '番茄', '黄瓜', '萝卜',
        // 豆制品
        '豆腐', '豆皮', '豆干', '腐竹',
        // 汤类
        '汤', '羹', '煲',
        // 常见菜品
        '宫保鸡丁', '鱼香肉丝', '麻婆豆腐', '回锅肉', '青椒肉丝', '西红柿炒蛋', '酸辣土豆丝',
        // 快餐
        '汉堡', '薯条', '鸡翅', '鸡块', '披萨', '三明治', '热狗', '沙拉'
      ];
      
      const foundDishes = [];
      for (const dish of dishKeywords) {
        if (allText.includes(dish)) {
          foundDishes.push(dish);
        }
      }
      
      if (foundDishes.length > 0) {
        remark = foundDishes.slice(0, 3).join('、');
        console.log('从菜品关键词提取备注:', remark);
      }
    }
    
    // 策略3: 零食饮料类
    if (!remark && (merchant.includes('便利') || merchant.includes('超市') || 
                     allText.includes('零食') || allText.includes('饮料'))) {
      const snackKeywords = [
        // 饮料
        '可乐', '雪碧', '芬达', '果汁', '奶茶', '咖啡', '矿泉水', '纯净水', '茶', '酸奶', '牛奶', '豆奶',
        // 零食
        '薯片', '饼干', '巧克力', '糖果', '口香糖', '瓜子', '花生', '坚果', '果冻', '布丁',
        // 水果
        '苹果', '香蕉', '橙子', '橘子', '葡萄', '西瓜', '草莓', '芒果', '梨', '桃子', '樱桃',
        // 面包糕点
        '面包', '蛋糕', '饼', '包', '卷'
      ];
      
      const foundSnacks = [];
      for (const snack of snackKeywords) {
        if (allText.includes(snack)) {
          foundSnacks.push(snack);
        }
      }
      
      if (foundSnacks.length > 0) {
        remark = foundSnacks.slice(0, 3).join('、');
        console.log('从零食饮料关键词提取备注:', remark);
      }
    }
    
    // 策略4: 日用品类
    if (!remark && (merchant.includes('超市') || merchant.includes('商场'))) {
      const dailyKeywords = [
        '纸巾', '卫生纸', '洗发水', '沐浴露', '牙膏', '牙刷', '洗衣液', '洗洁精', 
        '垃圾袋', '保鲜膜', '电池', '灯泡', '拖鞋', '毛巾', '香皂', '肥皂'
      ];
      
      const foundDaily = [];
      for (const item of dailyKeywords) {
        if (allText.includes(item)) {
          foundDaily.push(item);
        }
      }
      
      if (foundDaily.length > 0) {
        remark = foundDaily.slice(0, 3).join('、');
        console.log('从日用品关键词提取备注:', remark);
      }
    }
    
    // 策略5: 医疗类
    if (!remark && (merchant.includes('医院') || merchant.includes('药店') || 
                     merchant.includes('诊所') || allText.includes('药品'))) {
      const medicalKeywords = [
        '挂号', '检查', '化验', '治疗', '手术', '住院', '门诊', '急诊',
        '感冒药', '消炎药', '止痛药', '退烧药', '创可贴', '纱布', '口罩', '体温计'
      ];
      
      const foundMedical = [];
      for (const item of medicalKeywords) {
        if (allText.includes(item)) {
          foundMedical.push(item);
        }
      }
      
      if (foundMedical.length > 0) {
        remark = foundMedical.slice(0, 2).join('、');
        console.log('从医疗关键词提取备注:', remark);
      }
    }
    
    // 策略6: 交通类
    if (!remark && (merchant.includes('出行') || merchant.includes('交通') || 
                     merchant.includes('滴滴') || merchant.includes('地铁') ||
                     allText.includes('车费') || allText.includes('票价'))) {
      // 先尝试从备注字段提取（支持两种格式）
      // 格式1: 备注: 内容
      let remarkMatch = allText.match(/备\s*注[：:]\s*([^\n\r开票人]{2,30})/);
      // 格式2: 内容 备 注（电子发票常见格式，排除价税合计等无关内容）
      if (!remarkMatch) {
        // 匹配"备 注"前面的内容，但排除包含"价税合计"、"大写"、"小写"、"￥"等的行
        const lines = allText.split(/\s+/);
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].includes('备') && lines[i + 1] && lines[i + 1].includes('注')) {
            // 找到"备 注"，向前查找备注内容
            let remarkContent = '';
            for (let j = i - 1; j >= 0 && j >= i - 10; j--) {
              const line = lines[j];
              // 跳过价税合计相关内容
              if (line.includes('价税') || line.includes('大写') || line.includes('小写') || 
                  line.includes('￥') || line.includes('元整') || /^\d+\.?\d*$/.test(line)) {
                continue;
              }
              // 找到有效内容
              if (line.length >= 2 && line.length <= 30 && 
                  !line.includes('出行人') && !line.includes('证件') && 
                  !line.includes('出发地') && !line.includes('到达地')) {
                remarkContent = line;
                break;
              }
            }
            if (remarkContent) {
              remarkMatch = [null, remarkContent];
              break;
            }
          }
        }
      }
      
      if (remarkMatch && remarkMatch[1]) {
        remark = remarkMatch[1].trim();
        console.log('从备注字段提取交通备注:', remark);
      } else {
        // 如果没有备注字段，使用关键词或简化商家名
        const transportKeywords = [
          '打车', '出租车', '网约车', '地铁', '公交', '高铁', '火车', '飞机', 
          '停车', '加油', '过路费', '洗车', '保养'
        ];
        
        let foundKeyword = false;
        for (const item of transportKeywords) {
          if (allText.includes(item)) {
            remark = item;
            foundKeyword = true;
            console.log('从交通关键词提取备注:', remark);
            break;
          }
        }
        
        // 如果没有关键词，尝试简化商家名
        if (!foundKeyword && merchant) {
          // 提取打车平台名称
          if (merchant.includes('享道')) {
            remark = '享道出行';
          } else if (merchant.includes('滴滴')) {
            remark = '滴滴出行';
          } else if (merchant.includes('曹操')) {
            remark = '曹操出行';
          } else if (merchant.includes('T3')) {
            remark = 'T3出行';
          } else if (merchant.includes('首汽')) {
            remark = '首汽约车';
          } else if (merchant.includes('高德')) {
            remark = '高德打车';
          } else if (merchant.includes('美团')) {
            remark = '美团打车';
          } else if (merchant.includes('出行') || merchant.includes('交通')) {
            // 提取公司名称的前几个字
            const companyMatch = merchant.match(/^([^\(（]{2,8})/);
            if (companyMatch) {
              remark = companyMatch[1];
            }
          }
          
          if (remark) {
            console.log('从商家名简化提取备注:', remark);
          }
        }
      }
    }
    
    // 策略7: 如果还是没有，使用商家名（但要简化）
    if (!remark && merchant && merchant.length <= 10) {
      remark = merchant;
      console.log('使用商家名作为备注:', remark);
    }
    
    // 最终清理：限制长度
    if (remark && remark.length > 30) {
      remark = remark.substring(0, 30) + '...';
    }
    
    console.log('最终备注:', remark || '(空)');
  }
  
  console.log('最终解析结果:', { type, amount, merchant, date, categoryInfo, remark });
  
  // 构建返回结果
  const result = {
    type,
    amount,
    merchant,
    date,
    rawText: allText,
    remark
  };
  
  // 只有识别到分类时才添加分类信息
  if (categoryInfo.id !== null && categoryInfo.name) {
    result.categoryId = categoryInfo.id;
    result.categoryName = categoryInfo.name;
  }
  
  return result;
}

// 智能分类函数
function smartClassify(text, merchant, type) {
  if (type === 'income') {
    // 收入分类（扩展版 - 参考主流记账应用）
    const incomeCategories = [
      { 
        id: 101, 
        name: '工资', 
        keywords: [
          '工资', '薪水', '薪资', '月薪', '年薪', '发工资', '工资收入', '底薪', '基本工资',
          '代发工资', '工资到账', '薪酬', '劳务费', '劳务报酬'
        ] 
      },
      { 
        id: 102, 
        name: '兼职', 
        keywords: [
          // 兼职类型
          '兼职', '外快', '副业', '临时工', '兼职收入', '零工', '小时工', '日结', '周结',
          // 外卖配送
          '美团众包', '美团跑腿', '饿了么', '饿了么蜂鸟', '闪送', '达达', 'UU跑腿', '顺丰同城',
          // 网约车
          '滴滴司机', '网约车', '跑车', '代驾',
          // 自由职业
          '接单', '设计', '写作', '翻译', '咨询', '家教', '辅导', '培训', '讲课',
          // 线上兼职
          '威客', '猪八戒', '自由职客', '任务', '问卷', '调研'
        ] 
      },
      { 
        id: 103, 
        name: '奖金', 
        keywords: [
          '奖金', '年终奖', '季度奖', '月度奖', '项目奖', '绩效奖', '业绩奖',
          '提成', '绩效', '奖励', '激励', '分红', '股权激励', '期权'
        ] 
      },
      { 
        id: 104, 
        name: '红包', 
        keywords: [
          '红包', '压岁钱', '过年红包', '生日红包', '结婚红包', '满月红包',
          '微信红包', '支付宝红包', '抢红包', '发红包'
        ] 
      },
      { 
        id: 105, 
        name: '退款', 
        keywords: [
          '退款', '退货', '退费', '退钱', '返现', '返款', '退税', '税收返还',
          '淘宝退款', '京东退款', '拼多多退款', '退货退款', '仅退款'
        ] 
      },
      { 
        id: 106, 
        name: '报销', 
        keywords: [
          '报销', '补贴', '津贴', '补助', '补偿',
          '餐补', '饭补', '交通补贴', '通讯补贴', '话费补贴', '房补', '租房补贴',
          '差旅费', '出差补助', '加班费', '夜班费', '高温补贴', '取暖费'
        ] 
      },
      { 
        id: 107, 
        name: '投资', 
        keywords: [
          // 理财收益
          '利息', '收益', '分红', '股息', '红利', '理财', '理财收益', '投资收益',
          // 平台
          '支付宝', '余额宝', '微信理财通', '理财通', '天天基金', '蚂蚁财富',
          // 投资类型
          '股票', '基金', '债券', '定期', '活期', '货币基金', '股票分红',
          '雪球', '东方财富', '同花顺'
        ] 
      },
      { 
        id: 109, 
        name: '礼金', 
        keywords: [
          '礼金', '份子钱', '收礼', '随礼', '礼物', '礼品',
          '结婚礼金', '生日礼金', '满月礼金', '升学礼金', '乔迁礼金'
        ] 
      },
      { 
        id: 110, 
        name: '出售', 
        keywords: [
          '出售', '卖', '售出', '变卖', '转卖',
          '二手', '闲置', '转让', '回收',
          '闲鱼', '转转', '拍拍', '爱回收', '找靓机',
          '卖车', '卖房', '卖手机', '卖电脑'
        ] 
      },
      { 
        id: 111, 
        name: '借入', 
        keywords: [
          '借入', '借款', '贷款', '借钱', '借到',
          '朋友借', '亲戚借', '家人借', '同事借',
          '花呗', '借呗', '微粒贷', '白条', '京东白条', '信用贷'
        ] 
      },
      { 
        id: 112, 
        name: '中奖', 
        keywords: [
          '中奖', '奖品', '抽奖', '彩票', '刮刮乐', '大乐透', '双色球',
          '幸运', '奖励', '积分兑换', '积分奖励'
        ] 
      },
      { 
        id: 113, 
        name: '租金', 
        keywords: [
          '租金', '房租收入', '出租', '租房收入', '房屋出租',
          '车位租金', '店铺租金', '商铺租金'
        ] 
      },
      { 
        id: 108, 
        name: '其他', 
        keywords: [
          '收入', '赚', '挣', '收到', '到账', '其他收入', '杂项收入',
          '转账', '收款', '收钱', '进账'
        ] 
      }
    ];
    
    const searchText = (text + ' ' + merchant).toLowerCase();
    
    for (const category of incomeCategories) {
      for (const keyword of category.keywords) {
        if (searchText.includes(keyword)) {
          console.log('匹配到收入分类:', category.name, '关键词:', keyword);
          return { id: category.id, name: category.name };
        }
      }
    }
    
    console.log('未匹配到收入分类，返回空');
    return { id: null, name: '' };
  } else {
    // 支出分类（扩展版 - 参考主流记账应用）
    const categories = [
      { 
        id: 1, 
        name: '餐饮', 
        keywords: [
          // 餐厅类型
          '餐厅', '饭店', '食堂', '酒楼', '酒店', '餐馆', '饭馆', '食府',
          // 快餐品牌
          '麦当劳', '肯德基', 'KFC', '汉堡王', '德克士', '华莱士', '必胜客', '必胜客', '赛百味', '吉野家', '真功夫', '永和大王', '老娘舅',
          // 咖啡茶饮
          '星巴克', '瑞幸', '咖啡', '奶茶', '茶饮', '喜茶', '奈雪', '蜜雪冰城', 'CoCo', '一点点', '茶百道', '古茗', '书亦烧仙草',
          // 火锅烧烤
          '火锅', '烧烤', '海底捞', '呷哺', '小龙坎', '大龙燚', '巴奴', '串串', '烤肉', '自助餐',
          // 外卖平台
          '外卖', '美团外卖', '美团', '饿了么', '闪购', '淘宝闪购', '京东到家',
          // 其他
          '美食', '小吃', '快餐', '早餐', '午餐', '晚餐', '宵夜', '云厨', '食品'
        ] 
      },
      { 
        id: 2, 
        name: '交通', 
        keywords: [
          // 打车
          '滴滴', '出租', '打车', '网约车', '享道', '曹操', '高德打车', 'T3出行', '首汽约车',
          // 公共交通
          '地铁', '公交', '公交车', '轻轨', '有轨电车', '公共交通',
          // 长途交通
          '高铁', '火车', '动车', '飞机', '航空', '机票', '火车票', '汽车票', '船票', '客运', '旅客', '运输', '票务',
          // 汽车相关
          '加油', '停车', '洗车', '过路费', '高速', 'ETC',
          // 共享出行
          '哈啰', '青桔', '美团单车', '共享单车', '共享电动车',
          // 其他
          '车费', '出行', '交通费'
        ] 
      },
      { 
        id: 3, 
        name: '购物', 
        keywords: [
          // 电商平台
          '淘宝', '天猫', '京东', '拼多多', '唯品会', '苏宁易购', '国美在线', '当当', '亚马逊',
          // 超市
          '超市', '沃尔玛', '家乐福', '大润发', '永辉', '华润万家', '物美', '苏果', '联华', '华联', '世纪联华',
          '山姆', '麦德龙', '欧尚', '卜蜂莲花', '好想来', '胖东来', '步步高',
          // 便利店
          '便利店', '7-11', '全家', '罗森', '便利蜂', '好邻居', '快客', '美宜佳',
          // 新零售
          '盒马', '盒马鲜生', '叮咚买菜', '每日优鲜', '朴朴',
          // 其他
          '商场', '百货', '购物中心', '电商', '网购', '商务', '买', '购'
        ] 
      },
      { 
        id: 4, 
        name: '娱乐', 
        keywords: [
          // 影视
          '电影', '影院', '电影院', '万达影城', '大地影院', '金逸影城', '横店影城', '看电影',
          // 游戏
          '游戏', '网吧', '网咖', '电竞', '游戏充值', '王者荣耀', '和平精英', 'Steam',
          // 健身运动
          '健身', '健身房', '游泳', '瑜伽', '乐刻', '超级猩猩', 'Keep', '运动', '球类', '羽毛球', '篮球', '足球', '台球', '保龄球',
          // 娱乐场所
          'KTV', '唱歌', '酒吧', '夜店', '密室逃脱', '剧本杀', '桌游',
          // 旅游
          '旅游', '景点', '门票', '旅行', '度假', '民宿', '酒店住宿',
          // 其他
          '娱乐', '玩'
        ] 
      },
      { 
        id: 5, 
        name: '住房', 
        keywords: ['房租', '物业', '物业费', '水电', '燃气', '水费', '电费', '煤气费', '宽带', '网费', '房贷', '租房', '房屋', '维修', '装修', '家装'] 
      },
      { 
        id: 6, 
        name: '医疗', 
        keywords: [
          // 医疗机构
          '医院', '诊所', '卫生院', '社区医院', '门诊', '急诊', '体检中心',
          // 药店
          '药店', '药房', '大药房', '同仁堂', '老百姓大药房', '益丰大药房', '海王星辰',
          // 医疗服务
          '体检', '医疗', '挂号', '就诊', '治疗', '检查', '化验', '看病', '买药', '配药', '拿药',
          // 互联网医疗
          '平安好医生', '微医', '丁香医生', '春雨医生', '好大夫',
          // 体检机构
          '美年大健康', '爱康国宾', '慈铭体检'
        ] 
      },
      { 
        id: 7, 
        name: '通讯', 
        keywords: ['话费', '流量', '手机费', '电话费', '移动', '联通', '电信', '充值', '套餐', '网费', '宽带费'] 
      },
      { 
        id: 8, 
        name: '服饰', 
        keywords: [
          // 服装品牌
          '优衣库', 'ZARA', 'H&M', 'GAP', 'UR', '海澜之家', '太平鸟', '森马', '美特斯邦威', 'GXG', '李宁', '安踏', '耐克', '阿迪达斯',
          // 服装类型
          '衣服', '服装', '裤子', '裙子', '外套', '大衣', '羽绒服', 'T恤', '衬衫', '毛衣', '内衣', '袜子',
          // 配饰
          '鞋子', '包包', '帽子', '围巾', '手表', '眼镜', '首饰', '饰品'
        ] 
      },
      { 
        id: 9, 
        name: '美容', 
        keywords: [
          // 美发
          '美发', '理发', '理发店', '发廊', '洗头', '剪发', '染发', '烫发', '快剪', '文峰', '永琪', '丝域',
          // 美容
          '美容', '美容院', '美甲', 'SPA', '按摩', '推拿', '足疗',
          // 化妆品
          '化妆品', '护肤', '护肤品', '化妆', '面膜', '口红', '香水', '精华', '乳液',
          // 化妆品店
          '屈臣氏', '丝芙兰', '娇兰佳人', '莎莎', '万宁', '调色师'
        ] 
      },
      { 
        id: 10, 
        name: '学习', 
        keywords: [
          // 书籍文具
          '书籍', '图书', '书店', '文具', '文具店', '晨光', '得力',
          // 教育培训
          '课程', '培训', '教育', '学习', '考试', '报名', '辅导', '补习', '网课', '教材', '学费', '培训费',
          // 教育机构
          '学而思', '猿辅导', '作业帮', '新东方', '英孚', '达内', '尚德', '中公教育'
        ] 
      },
      { 
        id: 11, 
        name: '社交', 
        keywords: ['聚餐', '礼物', '红包', '送礼', '份子钱', '婚礼', '生日', '聚会', '宴请', '请客', 'AA', '聚会费'] 
      },
      { 
        id: 13, 
        name: '零食', 
        keywords: [
          // 零食
          '零食', '小食', '坚果', '薯片', '饼干', '糖果', '巧克力', '瓜子', '花生', '辣条',
          // 饮料
          '饮料', '可乐', '雪碧', '芬达', '果汁', '矿泉水', '纯净水', '茶', '酸奶', '牛奶', '豆奶',
          // 水果
          '水果', '苹果', '香蕉', '橙子', '橘子', '葡萄', '西瓜', '草莓', '芒果', '梨', '桃子', '樱桃', '车厘子',
          // 面包糕点
          '面包', '蛋糕', '糕点', '甜品', '好利来', '味多美', '85度C', '面包新语'
        ] 
      },
      { 
        id: 14, 
        name: '数码', 
        keywords: [
          // 手机品牌
          '手机', '苹果', 'iPhone', '华为', '小米', 'OPPO', 'vivo', '三星', '荣耀', '一加', '魅族', '真我',
          // 电脑品牌
          '电脑', '笔记本', 'iPad', 'Mac', 'MacBook', '戴尔', '联想', '惠普', '华硕', '宏碁', '微软',
          // 数码产品
          '平板', '相机', '耳机', '音箱', '键盘', '鼠标', '显示器', '路由器',
          // 配件
          '充电器', '数据线', '充电宝', '移动硬盘', 'U盘', '内存卡', '手机壳', '贴膜'
        ] 
      },
      { 
        id: 15, 
        name: '家居', 
        keywords: [
          // 家具
          '家具', '沙发', '床', '桌椅', '衣柜', '书柜', '茶几',
          // 家电
          '家电', '冰箱', '洗衣机', '空调', '电视', '微波炉', '电饭煲', '热水器', '油烟机', '洗碗机', '扫地机器人',
          // 日用品
          '日用品', '厨具', '床上用品', '毛巾', '被子', '枕头', '窗帘',
          // 家居品牌
          '宜家', '无印良品', 'MUJI', '名创优品', '网易严选', '小米有品'
        ] 
      },
      { 
        id: 16, 
        name: '汽车', 
        keywords: [
          // 汽车费用
          '车贷', '保养', '维修', '保险', '车险', '年检', '违章', '罚款',
          // 汽车服务
          '洗车', '美容', '4S店', '汽修', '换油', '轮胎', '保养',
          // 加油站
          '中石油', '中石化', '壳牌', '加油站'
        ] 
      },
      { 
        id: 17, 
        name: '宠物', 
        keywords: [
          // 宠物食品
          '宠物', '猫粮', '狗粮', '猫砂', '宠物零食', '宠物用品',
          // 宠物服务
          '宠物医院', '宠物店', '宠物美容', '疫苗', '驱虫', '绝育', '寄养',
          // 宠物品牌
          '瑞鹏', '芭比堂', '波奇', 'E宠', '宠物家'
        ] 
      }
    ];
    
    const searchText = (text + ' ' + merchant).toLowerCase();
    
    for (const category of categories) {
      for (const keyword of category.keywords) {
        if (searchText.includes(keyword)) {
          console.log('匹配到支出分类:', category.name, '关键词:', keyword);
          return { id: category.id, name: category.name };
        }
      }
    }
    
    console.log('未匹配到支出分类，返回空');
    return { id: null, name: '' };
  }
}

module.exports = router;
