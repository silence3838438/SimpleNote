/**
 * 测试 AI 增强功能
 */
const fs = require('fs');
const path = require('path');
const axios = require('axios');

// 读取测试图片
const imagePath = path.join(__dirname, 'static/testImages/WechatIMG617.jpg');
const imageBuffer = fs.readFileSync(imagePath);
const imageBase64 = imageBuffer.toString('base64');

console.log('📷 图片读取成功，大小:', imageBase64.length);

// 模拟 OCR 识别结果（享道出行小票）
const mockOCRResult = {
  ocrText: `电子发票(普通发票)
发票号码:26317000000219389145
旅客运输服务
开票日期:2026年01月10日
上海税局
购买方名称:南京公司
销售方名称:享道出行(上海)科技股份有限公司
统一社会信用代码:913201
统一社会信用代码/纳税人识别号:91310115MA1K427762
项目名称 单价 数量 金额 税率/征收率 税额
运输服务*客运服务费 21.36 1.00 21.36 3% 0.64
合计 ￥21.36 0.64
出行人 有效身份证件号 出行日期 出发地 到达地 等级 交通工具类型
价税合计(大写) 贰拾贰元整
(小写)￥22.00
加班产品上线发布
备注
开票人:李金丽`,
  baseInfo: {
    type: 'expense',
    amount: 22,
    merchant: '享道出行(上海)科技股份有限公司',
    date: '2026-01-10',
    remark: '',
    categoryId: 2,
    categoryName: '交通'
  }
};

// 调用后端 AI 增强接口
async function testAIEnhance() {
  try {
    console.log('\n📤 调用 AI 增强接口...');
    console.log('URL: https://api.qiannaqule.top/api/ai-enhance/ocr');
    
    // 不需要 token，AI 增强接口使用 optionalAuthMiddleware
    const response = await axios.post('https://api.qiannaqule.top/api/ai-enhance/ocr', mockOCRResult, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('\n📥 响应状态:', response.status);
    console.log('📥 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success && response.data.data) {
      const result = response.data.data;
      console.log('\n✅ AI 增强结果:');
      console.log('  - 金额:', result.amount);
      console.log('  - 商家:', result.merchant);
      console.log('  - 备注:', result.remark || '(空)');
      console.log('  - 分类:', result.categoryName);
      console.log('  - 日期:', result.date);
      console.log('  - AI 是否启用:', response.data.aiEnabled);
    }
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
  }
}

// 执行测试
testAIEnhance();
