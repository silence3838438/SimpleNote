/**
 * 腾讯云 Cloudbase AI 统一封装
 * 支持微信小程序和APP
 * 
 * 注意：统一使用后端 API 调用方式
 */
import apiConfig from './apiConfig.js'

class CloudbaseAI {
	constructor() {
		// 所有AI功能通过后端API实现，无需前端初始化
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
			
			if (response.statusCode === 200 && response.data.success) {
				const result = response.data.data
				
				// 优化商家名称：如果太长，截取主要部分
				if (result.merchant && result.merchant.length > 15) {
					// 提取主要商家名（去掉地址等信息）
					const parts = result.merchant.split(/\s+/)
					result.merchant = parts[0] // 只保留第一部分
				}
				
				console.log('✅ AI增强完成')
				console.log(`  商家: ${result.merchant || '(未识别)'}`)
				console.log(`  分类: ${result.categoryName}`)
				console.log(`  备注: ${result.remark || '(空)'}`)
				
				return result
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
	 * 语音识别增强（通过后端API调用）
	 * @param {String} voiceText - 语音识别的原始文本
	 * @param {Object} baseInfo - 前端正则已提取的基础信息（金额、商家、日期等）
	 * @returns {Promise<Object>} AI增强后的账单信息
	 */
	async enhanceVoice(voiceText, baseInfo = {}) {
		try {
			console.log('⏱️ [AI增强-语音] 开始语音增强识别（通过后端API）')
			console.log('📋 前端已提取:', baseInfo)
			
			// 使用 apiConfig 中的配置
			const url = `${apiConfig.apiBaseUrl}/ai-enhance/voice`
			
			console.log('📤 [AI增强-语音] 请求 URL:', url)
			
			// 获取 token
			const token = uni.getStorageSync('token') || ''
			const headers = {
				'Content-Type': 'application/json'
			}
			
			// 添加 Authorization 头
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
			
			console.log('📤 [AI增强-语音] 是否携带 token:', !!token)
			
			// 调用后端 AI 增强接口
			const response = await uni.request({
				url,
				method: 'POST',
				data: {
					voiceText,
					baseInfo
				},
				header: headers
			})
			
			console.log('📥 [AI增强-语音] 响应状态:', response.statusCode)
			
			if (response.statusCode === 200 && response.data.success) {
				const result = response.data.data
				
				// 优化商家名称：如果太长，截取主要部分
				if (result.merchant && result.merchant.length > 15) {
					// 提取主要商家名（去掉地址等信息）
					const parts = result.merchant.split(/\s+/)
					result.merchant = parts[0] // 只保留第一部分
				}
				
				console.log('✅ AI增强完成')
				console.log(`  商家: ${result.merchant || '(未识别)'}`)
				console.log(`  分类: ${result.categoryName}`)
				console.log(`  备注: ${result.remark || '(空)'}`)
				
				return result
			} else {
				console.warn('⚠️ AI增强失败，返回前端原始数据')
				console.warn('⚠️ 失败原因:', response.data.message || '未知')
				return {
					...baseInfo,
					categoryId: this.getCategoryIdByName(baseInfo.categoryName || '其他', baseInfo.type)
				}
			}
			
		} catch (error) {
			console.error('❌ AI增强请求异常:', error)
			console.error('❌ 错误详情:', error.errMsg || error.message)
			// AI失败不影响使用，返回前端数据
			return {
				...baseInfo,
				categoryId: this.getCategoryIdByName(baseInfo.categoryName || '其他', baseInfo.type)
			}
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
