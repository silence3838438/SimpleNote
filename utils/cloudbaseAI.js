/**
 * 腾讯云 Cloudbase AI 统一封装
 * 支持微信小程序和APP
 * 
 * 注意：改用后端 API 调用方式
 */
import apiConfig from './apiConfig.js'

// Agent ID
const AGENT_ID = 'agent-xiaopiaoshi-2end0lcd9c419f'

class CloudbaseAI {
	constructor() {
		this.initialized = false
		this.enabled = false // AI功能开关
	}
	
	async init() {
		if (this.initialized) return
		
		try {
			console.log('✅ [AI] 初始化开始（使用 accessKey 匿名访问）')
			
			// 使用 accessKey 时，已经是匿名身份，无需再次登录
			// 直接标记为已启用
			this.enabled = true
			this.initialized = true
			console.log('✅ [AI] 初始化完成')
		} catch (error) {
			console.warn('⚠️ [AI] 初始化失败:', error.message)
			this.enabled = false
			this.initialized = true
		}
	}
	
	/**
	 * OCR 识别增强（通过后端API调用）
	 * @param {String} ocrText - OCR 识别的原始文本
	 * @param {Object} baseInfo - 后端正则已提取的基础信息（金额、商家、日期等）
	 * @returns {Promise<Object>} AI增强后的账单信息
	 */
	async enhanceOCR(ocrText, baseInfo = {}) {
		try {
			console.log('⏱️ [AI增强] 开始 OCR 语义增强（通过后端API）')
			console.log('📋 后端已提取:', baseInfo)
			
			// 使用 apiConfig 中的配置
			const url = `${apiConfig.apiBaseUrl}/ai-enhance/ocr`
			
			console.log('📤 [AI增强] 请求 URL:', url)
			
			// 获取 token
			const token = uni.getStorageSync('token') || ''
			const headers = {
				'Content-Type': 'application/json'
			}
			
			// 添加 Authorization 头
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
			
			console.log('📤 [AI增强] 是否携带 token:', !!token)
			
			// 调用后端 AI 增强接口
			const response = await uni.request({
				url,
				method: 'POST',
				data: {
					ocrText,
					baseInfo
				},
				header: headers
			})
			
			console.log('📥 [AI增强] 响应状态:', response.statusCode)
			console.log('📥 [AI增强] 响应数据:', response.data)
			
			if (response.statusCode === 200 && response.data.success) {
				console.log('✅ AI增强完成:', response.data.data)
				return response.data.data
			} else {
				console.warn('⚠️ AI增强失败，返回后端原始数据')
				console.warn('⚠️ 失败原因:', response.data.message || '未知')
				return {
					...baseInfo,
					categoryId: this.getCategoryIdByName(baseInfo.categoryName || '其他', baseInfo.type)
				}
			}
			
		} catch (error) {
			console.error('❌ AI增强请求异常:', error)
			console.error('❌ 错误详情:', error.errMsg || error.message)
			// AI失败不影响使用，返回后端数据
			return {
				...baseInfo,
				categoryId: this.getCategoryIdByName(baseInfo.categoryName || '其他', baseInfo.type)
			}
		}
	}
	
	/**
	 * 语音识别增强
	 * @param {String} voiceText - 语音识别的原始文本
	 * @returns {Promise<Object>} 解析后的账单信息
	 */
	async enhanceVoice(voiceText) {
		try {
			console.log('⏱️ [AI增强] 开始语音增强识别')
			
			// 确保已初始化
			await this.init()
			
			// 构建提示词
			const prompt = `语音："${voiceText}"

提取JSON（无需解释）：
1. 类型：expense/income（收入关键词：工资/奖金/红包/退款/报销）
2. 金额识别规则（重要，按优先级执行）：
   【优先级1】查找关键词后的金额：
      - 最高优先：实付/实收/实际支付/实际收入
      - 次优先：合计/总计/小计/支付金额/订单金额/实付款/应收
      - 再次：应付/应收款
      示例："优惠5元 实付20元" → 取20元
   
   【优先级2】识别商品列表并计算总额：
      - 格式1：*数量 单价 小计 → 累加所有小计
        示例："可乐*2 3.5 7.0 薯片*1 11.3" → 7.0+11.3=18.3元
      - 格式2：*数量 单价（无小计）→ 计算数量×单价并累加
        示例："*2 11.3" → 2×11.3=22.6元
      - 注意：如果同时存在商品列表和关键词金额，优先取关键词金额
   
   【优先级3】过滤无效金额：
      - 忽略负数金额（如"-5"、"优惠-10"）
      - 忽略异常值（>100000 或 <0.01）
      - 忽略"优惠券"、"折扣"、"减免"后的金额
   
   【优先级4】取最大正数金额（兜底）

3. 商家/来源识别规则（重要）：
   【支出-商家】：
   - 品牌优先：识别200+知名品牌（星巴克、麦当劳、海底捞等）
   - 保留分店：完整商家名含分店信息（如"星巴克国贸店"）
   - 平台商家：电商/外卖要提取具体商家（"美团外卖-海底捞"→填"海底捞"）
   - 识别不出填空，不要填分类名
   
   【收入-来源】：
   - 工资→识别公司名或填"公司"
   - 兼职→识别平台（美团众包/饿了么/闪送/滴滴）或填"兼职平台"
   - 投资→识别平台（支付宝/微信理财通/天天基金）或填"投资平台"
   - 出售→识别平台（闲鱼/转转）或填"买家"
   - 其他→根据分类智能填充

4. 分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/零食/数码/家居/汽车/宠物/其他（收入：工资/兼职/奖金/红包/退款/报销/投资/礼金/出售/其他）

5. 日期：今天=${new Date().toISOString().split('T')[0]}

6. 备注智能提取规则（重要，按优先级执行）：
   【优先级1】用户明确说"备注XX"：
   - "备注加班" → remark: "加班"
   
   【优先级2】提到商品：
   - "买了可乐和薯片" → remark: "可乐、薯片"
   
   【优先级3】提到用途：
   - "用于加班" → remark: "加班"
   
   【优先级4】提到地点：
   - "在星巴克" → remark: "📍星巴克"
   
   【优先级5】没有特殊信息：
   - 填写完整的语音文字

格式：{"type":"expense","amount":0,"merchant":"","categoryName":"餐饮","date":"${new Date().toISOString().split('T')[0]}","remark":""}`

			// 调用 AI Agent
			const response = await this.chat(prompt)
			
			// 解析响应
			const result = this.parseAIResponse(response)
			
			console.log('✅ 语音增强识别完成:', result)
			return result
			
		} catch (error) {
			console.error('❌ 语音增强识别失败:', error)
			throw error
		}
	}
	
	/**
	 * 调用 AI Agent 进行对话
	 * @param {String} message - 用户消息
	 * @returns {Promise<String>} AI 响应文本
	 */
	async chat(message) {
		try {
			console.log('📤 发送消息到 AI Agent...')
			
			// 检查 cloudbase 实例是否有效
			if (!cloudbase) {
				throw new Error('Cloudbase 实例未初始化（为 null）')
			}
			
			if (typeof cloudbase.ai !== 'function') {
				throw new Error('Cloudbase 实例没有 ai() 方法')
			}
			
			const res = await cloudbase.ai().bot.sendMessage({
				botId: AGENT_ID,
				threadId: `thread-${Date.now()}`,
				runId: `run-${Date.now()}`,
				messages: [
					{
						id: `msg-${Date.now()}`,
						role: 'user',
						content: message
					}
				],
				tools: [],
				context: [],
				state: {},
				forwardedProps: {}
			})
			
			let fullText = ''
			
			// 读取流式响应
			for await (const data of res.dataStream) {
				// 如果有思维链内容
				const think = data.reasoning_content
				if (think) {
					console.log('💭 思维链:', think)
				}
				
				// 输出正文
				const content = data.content
				if (content) {
					fullText += content
				}
			}
			
			console.log('📥 AI 响应完成，长度:', fullText.length)
			return fullText
			
		} catch (error) {
			console.error('❌ AI 调用失败:', error)
			throw error
		}
	}
	
	/**
	 * 解析 AI 增强返回的响应（简化版，只返回增强字段）
	 * @param {String} aiText - AI 返回的文本
	 * @returns {Object} 增强的字段 {remark, merchant, categoryName}
	 */
	parseAIEnhancement(aiText) {
		try {
			console.log('开始解析 AI 增强响应，原始文本长度:', aiText.length)
			
			// 尝试多种方式提取 JSON
			let jsonStr = null
			
			// 方式1：查找 ```json 代码块
			const codeBlockMatch = aiText.match(/```json\s*([\s\S]*?)\s*```/)
			if (codeBlockMatch) {
				jsonStr = codeBlockMatch[1]
				console.log('从代码块中提取 JSON')
			}
			
			// 方式2：查找第一个 { 到最后一个 }
			if (!jsonStr) {
				const firstBrace = aiText.indexOf('{')
				const lastBrace = aiText.lastIndexOf('}')
				if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
					jsonStr = aiText.substring(firstBrace, lastBrace + 1)
					console.log('从大括号中提取 JSON')
				}
			}
			
			// 方式3：尝试整个文本
			if (!jsonStr) {
				jsonStr = aiText.trim()
				console.log('使用整个文本作为 JSON')
			}
			
			if (!jsonStr) {
				console.warn('AI 返回格式错误：未找到 JSON 数据')
				return { remark: '', merchant: '', categoryName: '' }
			}
			
			console.log('提取的 JSON 字符串:', jsonStr)
			
			// 解析 JSON
			const result = JSON.parse(jsonStr)
			console.log('JSON 解析成功:', result)
			
			// 返回增强字段（允许为空）
			return {
				remark: result.remark || '',
				merchant: result.merchant || '',
				categoryName: result.categoryName || ''
			}
			
		} catch (error) {
			console.error('解析 AI 增强响应失败:', error)
			console.error('原始 AI 文本:', aiText)
			// 解析失败返回空值，不影响使用
			return { remark: '', merchant: '', categoryName: '' }
		}
	}
	
	/**
	 * 根据分类名称获取分类ID
	 * @param {String} categoryName - 分类名称
	 * @param {String} type - 类型（expense/income）
	 * @returns {Number} 分类ID
	 */
	getCategoryIdByName(categoryName, type) {
		// 支出分类映射
		const expenseCategories = {
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
			'零食': 13,
			'数码': 14,
			'家居': 15,
			'汽车': 16,
			'宠物': 17,
			'其他': 12
		}
		
		// 收入分类映射
		const incomeCategories = {
			'工资': 101,
			'兼职': 102,
			'奖金': 103,
			'红包': 104,
			'退款': 105,
			'报销': 106,
			'投资': 107,
			'礼金': 109,
			'出售': 110,
			'其他': 108
		}
		
		const categories = type === 'income' ? incomeCategories : expenseCategories
		return categories[categoryName] || (type === 'income' ? 108 : 12)
	}
}

// 导出单例
export default new CloudbaseAI()
