<template>
	<view class="container">
		<!-- 顶部标题区域 -->
		<view class="header-section">
			<view class="header-icon-wrapper">
				<text class="header-icon">🎙️</text>
			</view>
			<view class="header-title">语音记账</view>
			<view class="header-subtitle">说出你的消费，自动帮你记下来</view>
		</view>
		
		<!-- 语音录制区域 -->
		<view class="voice-card">
			<view class="voice-area">
				<view 
					class="record-btn" 
					:class="{ 'recording': data.isRecording }"
					@touchstart="startRecord"
					@touchend="stopRecord"
					@touchcancel="cancelRecord"
				>
					<view class="record-icon-wrapper">
						<text class="record-icon">🎤</text>
					</view>
					<view class="record-wave" v-if="data.isRecording">
						<view class="wave wave-1"></view>
						<view class="wave wave-2"></view>
						<view class="wave wave-3"></view>
					</view>
					<view class="record-glow" v-if="data.isRecording"></view>
				</view>
				
				<view class="record-status">
					<text v-if="!data.isRecording" class="status-normal">
						<text class="status-icon">👆</text>
						长按开始录音
					</text>
					<text v-else class="status-recording">
						<text class="recording-dot"></text>
						{{ data.recordTime }}s 正在录音...
					</text>
				</view>
				
				<view class="record-tip">
					<text class="tip-icon">⏱️</text>
					最长支持 60 秒录音
				</view>
			</view>
		</view>
		
		<!-- 分隔线 -->
		<view class="divider">
			<view class="divider-line"></view>
			<view class="divider-text-wrapper">
				<text class="divider-text">或</text>
			</view>
			<view class="divider-line"></view>
		</view>
		
		<!-- 文字输入区域 -->
		<view class="input-card">
			<view class="input-header">
				<view class="input-title-wrapper">
					<text class="input-icon">✍️</text>
					<text class="input-title">文字输入</text>
				</view>
				<text class="input-subtitle">直接输入消费信息</text>
			</view>
			<view class="input-wrapper">
				<input 
					class="text-input" 
					v-model="data.inputText"
					placeholder="例如：今天滴滴打车花了24元"
					placeholder-class="input-placeholder"
					@confirm="parseText"
				/>
			</view>
			<button class="parse-btn" @click="parseText" :disabled="!data.inputText">
				<text class="btn-icon" v-if="!data.parsing">✨</text>
				<text v-if="!data.parsing">立即解析</text>
				<text v-else>智能识别中...</text>
			</button>
		</view>
		
		<!-- 示例区域 -->
		<view class="examples-card">
			<view class="examples-header">
				<text class="examples-icon">💡</text>
				<view class="examples-title-wrapper">
					<text class="examples-title">试试这些示例</text>
					<text class="examples-subtitle">点击快速填入</text>
				</view>
			</view>
			<view class="examples-list">
				<view 
					class="example-item" 
					v-for="(example, index) in data.examples" 
					:key="index" 
					@click="useExample(example)"
				>
					<view class="example-content">
						<text class="example-number">{{ index + 1 }}</text>
						<text class="example-text">{{ example }}</text>
					</view>
					<text class="example-arrow">→</text>
				</view>
			</view>
		</view>
		
		<!-- 加载遮罩 -->
		<view class="loading-mask" v-if="data.parsing">
			<view class="loading-content">
				<view class="loading-spinner"></view>
				<text class="loading-text">智能识别中...</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
import { onLoad, onUnload, onShow } from '@dcloudio/uni-app'
import { getExpenseCategories, getIncomeCategories } from '@/utils/category.js'

const data = reactive({
	isRecording: false,
	recordTime: 0,
	inputText: '',
	recognizedText: '',
	parsing: false,
	recorderManager: null,
	recordTimer: null,
	examples: [
		'"午餐35元"',
		'"网购衣服268元"',
		'"收到工资8000元"',
		'"滴滴打车24元"'
	]
})

onLoad(() => {
	// #ifdef MP-WEIXIN
	data.recorderManager = uni.getRecorderManager()
	
	// 监听录音开始
	data.recorderManager.onStart(() => {
		console.log('录音已开始')
	})
	
	// 监听录音停止
	data.recorderManager.onStop((res) => {
		console.log('录音已停止，时长:', res.duration, 'ms')
		handleRecordStop(res)
	})
	
	// 监听录音错误
	data.recorderManager.onError((err) => {
		console.error('录音错误:', err)
		data.isRecording = false
		if (data.recordTimer) {
			clearInterval(data.recordTimer)
			data.recordTimer = null
		}
		
		// 根据错误类型给出不同提示
		let errorMsg = '录音失败'
		if (err.errMsg) {
			if (err.errMsg.includes('auth')) {
				errorMsg = '请授权录音权限'
			} else if (err.errMsg.includes('busy')) {
				errorMsg = '录音器忙碌，请稍后重试'
			} else if (err.errMsg.includes('timeout')) {
				errorMsg = '录音超时'
			}
		}
		
		uni.showToast({
			title: errorMsg,
			icon: 'none',
			duration: 2000
		})
	})
	
	// 监听录音因为受到系统占用而被中断
	data.recorderManager.onInterruptionBegin(() => {
		console.log('录音被中断')
		data.isRecording = false
		if (data.recordTimer) {
			clearInterval(data.recordTimer)
			data.recordTimer = null
		}
	})
	
	// 监听录音中断结束
	data.recorderManager.onInterruptionEnd(() => {
		console.log('录音中断结束')
	})
	// #endif
})

onShow(() => {
	// #ifdef MP-WEIXIN
	// 页面显示时检查录音权限状态
	uni.getSetting({
		success: (res) => {
			console.log('当前权限状态:', res.authSetting)
			if (res.authSetting['scope.record'] === false) {
				console.log('用户已拒绝录音权限')
			} else if (res.authSetting['scope.record'] === true) {
				console.log('用户已授权录音权限')
			} else {
				console.log('用户尚未授权录音权限')
			}
		}
	})
	// #endif
})

onUnload(() => {
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
	}
})

const startRecord = async () => {
	console.log('开始录音，当前状态:', data.isRecording)
	
	// 防止重复启动
	if (data.isRecording) {
		console.log('录音已在进行中，忽略重复启动')
		return
	}
	
	// #ifdef MP-WEIXIN
	try {
		// 先检查录音权限
		const settingRes = await uni.getSetting()
		console.log('当前权限设置:', settingRes)
		
		// 如果用户之前拒绝过权限
		if (settingRes.authSetting['scope.record'] === false) {
			uni.showModal({
				title: '需要录音权限',
				content: '请在设置中开启录音权限',
				confirmText: '去设置',
				success: (res) => {
					if (res.confirm) {
						uni.openSetting()
					}
				}
			})
			return
		}
		
		// 如果还没授权过，请求授权
		if (settingRes.authSetting['scope.record'] === undefined) {
			try {
				await uni.authorize({ scope: 'scope.record' })
				console.log('录音权限授权成功')
			} catch (err) {
				console.log('用户拒绝授权:', err)
				uni.showToast({
					title: '需要录音权限才能使用',
					icon: 'none'
				})
				return
			}
		}
		
		// 确保录音器已初始化
		if (!data.recorderManager) {
			data.recorderManager = uni.getRecorderManager()
			
			// 重新绑定事件监听
			data.recorderManager.onStart(() => {
				console.log('录音已开始')
			})
			
			data.recorderManager.onStop((res) => {
				console.log('录音已停止，时长:', res.duration, 'ms')
				handleRecordStop(res)
			})
			
			data.recorderManager.onError((err) => {
				console.error('录音错误:', err)
				data.isRecording = false
				if (data.recordTimer) {
					clearInterval(data.recordTimer)
					data.recordTimer = null
				}
				
				let errorMsg = '录音失败'
				if (err.errMsg) {
					if (err.errMsg.includes('auth')) {
						errorMsg = '请授权录音权限'
					} else if (err.errMsg.includes('busy')) {
						errorMsg = '录音器忙碌，请稍后重试'
					} else if (err.errMsg.includes('timeout')) {
						errorMsg = '录音超时'
					}
				}
				
				uni.showToast({
					title: errorMsg,
					icon: 'none',
					duration: 2000
				})
			})
		}
		
		// 设置录音状态
		data.isRecording = true
		data.recordTime = 0
		
		// 启动录音
		try {
			data.recorderManager.start({
				duration: 60000,
				format: 'aac',
				sampleRate: 16000,
				numberOfChannels: 1,
				encodeBitRate: 48000,
				frameSize: 50
			})
			
			console.log('录音器已启动，格式: aac, 采样率: 16000')
			
			// 清除旧的定时器
			if (data.recordTimer) {
				clearInterval(data.recordTimer)
			}
			
			// 启动计时器
			data.recordTimer = setInterval(() => {
				data.recordTime++
				if (data.recordTime >= 60) {
					stopRecord()
				}
			}, 1000)
		} catch (error) {
			console.error('启动录音失败:', error)
			data.isRecording = false
			uni.showToast({
				title: '启动录音失败，请重试',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('录音权限检查失败:', error)
		data.isRecording = false
		uni.showToast({
			title: '录音初始化失败',
			icon: 'none'
		})
	}
	// #endif
	
	// #ifndef MP-WEIXIN
	uni.showToast({
		title: '当前环境不支持录音',
		icon: 'none'
	})
	// #endif
}

const stopRecord = () => {
	console.log('停止录音，当前状态:', data.isRecording)
	if (!data.isRecording) {
		console.log('录音未启动，忽略停止操作')
		return
	}
	
	// 立即设置状态，防止重复触发
	data.isRecording = false
	
	// 清除定时器
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
		data.recordTimer = null
	}
	
	// #ifdef MP-WEIXIN
	try {
		data.recorderManager.stop()
		console.log('录音器已停止')
	} catch (error) {
		console.error('停止录音失败:', error)
	}
	// #endif
}

const cancelRecord = () => {
	console.log('取消录音')
	if (!data.isRecording) {
		console.log('录音未启动，忽略取消操作')
		return
	}
	
	// 立即设置状态
	data.isRecording = false
	
	// 清除定时器
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
		data.recordTimer = null
	}
	
	// #ifdef MP-WEIXIN
	try {
		data.recorderManager.stop()
		console.log('录音已取消')
	} catch (error) {
		console.error('取消录音失败:', error)
	}
	// #endif
	
	uni.showToast({
		title: '已取消录音',
		icon: 'none'
	})
}

const handleRecordStop = async (res) => {
	console.log('录音停止回调，文件路径:', res.tempFilePath)
	
	// 确保状态已重置
	data.isRecording = false
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
		data.recordTimer = null
	}
	
	data.parsing = true
	
	try {
		// #ifdef MP-WEIXIN
		console.log('开始上传音频文件到云存储')
		const uploadRes = await wx.cloud.uploadFile({
			cloudPath: `voice/${Date.now()}.aac`,
			filePath: res.tempFilePath
		})
		
		console.log('音频文件上传成功，fileID:', uploadRes.fileID)
		console.log('开始调用语音识别云函数')
		
		const result = await new Promise((resolve, reject) => {
			wx.cloud.callFunction({
				name: 'baiduASR',
				data: {
					fileID: uploadRes.fileID
				},
				success: (res) => {
					console.log('云函数调用成功:', res)
					if (res.result && res.result.success && res.result.text) {
						resolve(res.result.text)
					} else {
						reject(new Error(res.result?.error || '识别结果为空'))
					}
				},
				fail: (error) => {
					console.error('云函数调用失败:', error)
					reject(error)
				}
			})
		})
		
		console.log('识别结果:', result)
		data.recognizedText = result
		await parseVoiceText(result)
		// #endif
	} catch (error) {
		console.error('识别失败:', error)
		uni.showToast({
			title: '识别失败：' + (error.message || '请重试'),
			icon: 'none',
			duration: 3000
		})
	} finally {
		data.parsing = false
	}
}

const useExample = (example) => {
	data.inputText = example.replace(/"/g, '')
}

const parseText = async () => {
	if (!data.inputText.trim()) {
		uni.showToast({
			title: '请输入内容',
			icon: 'none'
		})
		return
	}
	
	data.parsing = true
	data.recognizedText = data.inputText
	
	try {
		await parseVoiceText(data.inputText)
	} catch (error) {
		uni.showToast({
			title: '解析失败，请重试',
			icon: 'none'
		})
	} finally {
		data.parsing = false
	}
}

const parseVoiceText = async (text) => {
	try {
		console.log('开始调用 AI 识别语音内容...')
		console.log('用户输入:', text)
		
		// 优化后的提示词 - 更简洁，减少token数量
		const userMessage = `语音："${text}"

提取JSON（无需解释）：
1. 类型：expense/income（收入关键词：工资/奖金/红包/退款/报销）
2. 金额：数字
3. 商家：支出填店名（如"星巴克"），收入填来源（如"公司"、"单位"、"老板"），不要填分类名
4. 分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/其他（收入：工资/兼职/奖金/红包/退款/报销/投资/其他）
5. 日期：今天=${new Date().toISOString().split('T')[0]}
6. 备注：原始描述

格式：{"type":"expense","amount":0,"merchant":"","categoryName":"餐饮","date":"${new Date().toISOString().split('T')[0]}","remark":""}`
		
		// 调用 AI Agent
		const res = await wx.cloud.extend.AI.bot.sendMessage({
			data: {
				botId: 'agent-xiaopiaoshi-2end0lcd9c419f',
				threadId: `thread-${Date.now()}`,
				runId: `run-${Date.now()}`,
				messages: [
					{
						id: `msg-${Date.now()}`,
						role: 'user',
						content: userMessage
					}
				],
				tools: [],
				context: [],
				state: {},
				forwardedProps: {}
			}
		})
		
		// 优化：边接收边解析，不等待完整响应
		let fullText = ''
		let hasValidJson = false
		
		for await (let event of res.eventStream) {
			const eventData = JSON.parse(event.data)
			
			switch (eventData.type) {
				case 'TEXT_MESSAGE_CONTENT':
					fullText += eventData.delta
					
					// 优化：尝试提前解析（当收到完整的JSON时）
					if (!hasValidJson && fullText.includes('}')) {
						try {
							const testResult = parseAIResponse(fullText)
							if (testResult && testResult.amount > 0) {
								hasValidJson = true
								console.log('✅ 提前解析成功，无需等待完整响应')
								
								// 立即跳转
								uni.navigateTo({
									url: `/subPackages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(testResult))}`
								})
								return
							}
						} catch (e) {
							// 继续等待更多数据
						}
					}
					break
					
				case 'RUN_ERROR':
					console.error('AI 运行出错:', eventData.message)
					throw new Error(eventData.message)
					
				case 'RUN_FINISHED':
					console.log('AI 识别完成')
					break
			}
		}
		
		console.log('AI 完整响应:', fullText)
		
		// 如果还没跳转，使用完整响应解析
		if (!hasValidJson) {
			const aiResult = parseAIResponse(fullText)
			console.log('AI 识别成功:', aiResult)
			
			uni.navigateTo({
				url: `/subPackages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(aiResult))}`
			})
		}
		
	} catch (aiError) {
		console.error('AI 识别失败，使用本地规则:', aiError)
		// 降级使用本地规则
		const result = extractBillInfo(text)
		
		uni.navigateTo({
			url: `/subPackages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(result))}`
		})
	}
}

// 解析 AI 返回的响应
const parseAIResponse = (aiText) => {
	try {
		console.log('开始解析 AI 响应，原始文本长度:', aiText.length)
		
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
			throw new Error('AI 返回格式错误：未找到 JSON 数据')
		}
		
		console.log('提取的 JSON 字符串:', jsonStr)
		
		// 解析 JSON
		const result = JSON.parse(jsonStr)
		console.log('JSON 解析成功:', result)
		
		// 验证必要字段
		if (!result.amount || result.amount <= 0) {
			throw new Error('未识别到有效金额')
		}
		
		// 设置默认值
		result.type = result.type || 'expense'
		result.categoryName = result.categoryName || '其他'
		result.date = result.date || new Date().toISOString().split('T')[0]
		result.remark = result.remark || ''
		
		// 根据分类名称匹配分类ID
		result.categoryId = getCategoryIdByName(result.categoryName, result.type)
		
		// 兜底逻辑：如果merchant为空，根据类型和分类智能填充
		if (!result.merchant || result.merchant.trim() === '') {
			if (result.type === 'income') {
				// 收入类型的默认商家
				const incomeDefaultMerchant = {
					'工资': '公司',
					'兼职': '兼职单位',
					'奖金': '公司',
					'红包': '亲友',
					'退款': '商家退款',
					'报销': '公司',
					'投资': '投资收益'
				}
				result.merchant = incomeDefaultMerchant[result.categoryName] || '其他来源'
			} else {
				// 支出类型的默认商家
				const expenseDefaultMerchant = {
					'餐饮': '餐厅',
					'交通': '出行',
					'购物': '商店',
					'娱乐': '娱乐场所',
					'住房': '物业',
					'医疗': '医院',
					'通讯': '运营商',
					'服饰': '服装店',
					'美容': '美容店',
					'学习': '教育机构',
					'社交': '社交'
				}
				result.merchant = expenseDefaultMerchant[result.categoryName] || result.categoryName
			}
			console.log('⚠️ merchant为空，使用兜底值:', result.merchant)
		}
		
		console.log('最终解析结果:', result)
		return result
		
	} catch (error) {
		console.error('解析 AI 响应失败:', error)
		console.error('原始 AI 文本:', aiText)
		throw new Error('AI 识别结果解析失败: ' + error.message)
	}
}

// 根据分类名称获取分类ID
const getCategoryIdByName = (categoryName, type) => {
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
		'其他': 108
	}
	
	const categories = type === 'income' ? incomeCategories : expenseCategories
	return categories[categoryName] || (type === 'income' ? 108 : 12)
}

const extractBillInfo = (text) => {
	// 判断是收入还是支出
	const incomeKeywords = ['工资', '奖金', '红包', '退款', '收入', '赚', '挣', '报销', '兼职', '分红', '利息', '收到', '转账收入', '发了']
	let type = 'expense' // 默认支出
	
	for (const keyword of incomeKeywords) {
		if (text.includes(keyword)) {
			type = 'income'
			break
		}
	}
	
	// 提取金额 - 支持多种表达方式
	let amount = 0
	const amountPatterns = [
		/(\d+\.?\d*)\s*元/,           // 3000元
		/(\d+\.?\d*)\s*块钱/,         // 3000块钱
		/(\d+\.?\d*)\s*块/,           // 3000块
		/(\d+\.?\d*)\s*[¥￥]/,        // 3000¥
		/[¥￥]\s*(\d+\.?\d*)/,        // ¥3000
		/(\d+\.?\d*)\s*(?:人民币|rmb)/i  // 3000人民币
	]
	
	for (const pattern of amountPatterns) {
		const match = text.match(pattern)
		if (match && match[1]) {
			amount = parseFloat(match[1])
			console.log('匹配到金额:', amount, '使用模式:', pattern)
			break
		}
	}
	
	// 如果还没匹配到，尝试直接提取数字（最后的备选方案）
	if (amount === 0) {
		const numberMatch = text.match(/(\d+\.?\d*)/)
		if (numberMatch) {
			amount = parseFloat(numberMatch[1])
			console.log('使用数字作为金额:', amount)
		}
	}
	
	// 获取分类列表 - 直接从工具类导入，而不是从本地存储读取
	const categories = type === 'income' ? getIncomeCategories() : getExpenseCategories()
	console.log('当前类型:', type, '分类列表:', categories)
	
	let categoryId = null
	let categoryName = ''
	
	if (type === 'income') {
		// 收入分类匹配 - 修正分类名称，与 category.js 中的定义一致
		const incomeCategoryKeywords = {
			'工资': ['工资', '薪水', '薪资', '月薪', '发工资'],
			'兼职': ['兼职', '外快', '副业'],
			'奖金': ['奖金', '年终奖', '提成', '绩效'],
			'红包': ['红包', '压岁钱', '礼金'],
			'退款': ['退款', '退货', '返现'],
			'报销': ['报销', '补贴', '津贴'],
			'投资': ['利息', '分红', '股息', '理财', '股票', '基金'],
			'其他': ['收入', '赚', '挣', '收到']
		}
		
		for (const [catName, keywords] of Object.entries(incomeCategoryKeywords)) {
			for (const keyword of keywords) {
				if (text.includes(keyword)) {
					// 找到对应的分类
					const matchedCategory = categories.find(c => c.name === catName)
					if (matchedCategory) {
						categoryId = matchedCategory.id
						categoryName = matchedCategory.name
						console.log('✅ 匹配到收入分类:', categoryName, 'ID:', categoryId, '关键词:', keyword)
						break
					}
				}
			}
			if (categoryId !== null) break
		}
		
		// 如果没有匹配到，使用默认的"其他"
		if (categoryId === null) {
			const defaultCategory = categories.find(c => c.name === '其他')
			if (defaultCategory) {
				categoryId = defaultCategory.id
				categoryName = defaultCategory.name
				console.log('使用默认收入分类:', categoryName, 'ID:', categoryId)
			}
		}
	} else {
		// 支出分类匹配
		for (const category of categories) {
			if (category.keywords && Array.isArray(category.keywords)) {
				for (const keyword of category.keywords) {
					if (text.includes(keyword)) {
						categoryId = category.id
						categoryName = category.name
						console.log('✅ 匹配到支出分类:', categoryName, 'ID:', categoryId, '关键词:', keyword)
						break
					}
				}
			}
			if (categoryId !== null) break
		}
		
		// 如果没有匹配到，尝试更广泛的关键词匹配
		if (categoryId === null) {
			const categoryKeywords = {
				'餐饮': ['吃', '饭', '餐', '喝', '食', '早餐', '午餐', '晚餐', '宵夜', '点心', '零食'],
				'交通': ['车', '打车', '出租', '地铁', '公交', '滴滴', '停车', '加油', '高速'],
				'购物': ['买', '购', '逛', '商场', '超市', '网购', '淘宝', '京东'],
				'娱乐': ['玩', '看电影', '游戏', 'KTV', '唱歌', '健身'],
				'医疗': ['看病', '买药', '医院', '体检', '挂号'],
				'通讯': ['话费', '流量', '宽带', '充值'],
				'服饰': ['衣服', '鞋', '裤子', '裙子'],
				'美容': ['理发', '美发', '美甲', '化妆'],
				'学习': ['书', '课', '培训', '学费'],
				'住房': ['房租', '水费', '电费', '物业'],
				'社交': ['聚餐', '送礼', '红包']
			}
			
			for (const [catName, keywords] of Object.entries(categoryKeywords)) {
				for (const keyword of keywords) {
					if (text.includes(keyword)) {
						// 找到对应的分类
						const matchedCategory = categories.find(c => c.name === catName)
						if (matchedCategory) {
							categoryId = matchedCategory.id
							categoryName = matchedCategory.name
							console.log('✅ 通过扩展关键词匹配到支出分类:', categoryName, 'ID:', categoryId, '关键词:', keyword)
							break
						}
					}
				}
				if (categoryId !== null) break
			}
		}
	}
	
	// 提取商家名称 - 智能提取商家关键词
	let merchant = ''
	
	// 定义常见商家品牌关键词列表（参考主流记账应用）
	const merchantKeywords = [
		// 咖啡茶饮品牌
		'星巴克', 'Starbucks', '瑞幸', '瑞幸咖啡', 'Luckin', '库迪', '库迪咖啡', 'Cotti', 
		'喜茶', 'HEYTEA', '奈雪', '奈雪的茶', '蜜雪冰城', '茶百道', '古茗', '书亦烧仙草', 
		'CoCo', 'COCO都可', '一点点', '益禾堂', '茶颜悦色', '霸王茶姬', '沪上阿姨',
		'太平洋咖啡', 'COSTA', '麦咖啡', '幸运咖', 'Manner', 'M Stand', 'Seesaw',
		
		// 快餐连锁
		'麦当劳', "McDonald's", 'KFC', '肯德基', '汉堡王', '德克士', '华莱士', '塔斯汀',
		'必胜客', '达美乐', '棒约翰', '萨莉亚', '吉野家', '松屋', '食其家', '味千拉面',
		'永和大王', '真功夫', '老乡鸡', '乡村基', '老娘舅', '和合谷', '嘉和一品',
		'赛百味', 'Subway', '华莱士', '正新鸡排', '绝味鸭脖', '周黑鸭', '煌上煌',
		
		// 火锅烧烤
		'海底捞', '呷哺呷哺', '巴奴', '小龙坎', '大龙燚', '珮姐', '谭鸭血', '小肥羊',
		'太二', '太二酸菜鱼', '九毛九', '蛙来哒', '蛙小侠', '哥老官', '贤合庄',
		'木屋烧烤', '很久以前', '权金城', '汉拿山', '权金城', '丰茂烤串',
		
		// 中餐连锁
		'西贝', '西贝莜面村', '外婆家', '绿茶', '云海肴', '探鱼', '炉鱼', '渝是乎',
		'杨国福', '张亮麻辣烫', '小杨生煎', '南京大牌档', '新白鹿', '金鼎轩',
		
		// 甜品烘焙
		'好利来', '元祖', '味多美', '85度C', '面包新语', '巴黎贝甜', '原麦山丘',
		'幸福西饼', '21cake', '诺心', '泸溪河', '墨茉点心局', '虎头局',
		
		// 便利店超市
		'7-11', '7-Eleven', '全家', 'FamilyMart', '罗森', 'Lawson', '便利蜂', '美宜佳',
		'沃尔玛', '家乐福', '大润发', '永辉', '盒马', '盒马鲜生', '华润万家', '物美',
		'山姆', "Sam's Club", '麦德龙', 'Metro', 'Ole', 'BHG', '华联', '联华',
		
		// 交通出行
		'滴滴', '滴滴出行', '曹操', '曹操出行', '享道', '享道出行', '高德', '高德打车',
		'美团打车', '首汽', '首汽约车', '神州', '神州专车', '嘀嗒', '嘀嗒出行',
		'哈啰', '哈啰出行', '青桔', '美团单车', '中石油', '中石化', '壳牌', '美孚',
		
		// 电商平台
		'淘宝', '天猫', '京东', 'JD', '拼多多', '苏宁', '苏宁易购', '唯品会', '得物',
		'小红书', '抖音', '快手', '美团', '饿了么', '盒马', '叮咚买菜', '每日优鲜',
		
		// 影院娱乐
		'万达影城', '大地影院', '金逸影城', 'CGV', '横店影城', '保利影城', 'IMAX',
		'星美影城', '博纳影城', 'UME', '耀莱成龙', '卢米埃', '百老汇',
		
		// 健身运动
		'乐刻', '超级猩猩', 'Keep', '威尔仕', '一兆韦德', '浩沙', '中田健身', '古德菲力',
		
		// 美容美发
		'屈臣氏', '丝芙兰', '娇兰佳人', '调色师', '快剪', 'QB House', '文峰', '永琪',
		
		// 酒店住宿
		'如家', '汉庭', '7天', '锦江之星', '维也纳', '全季', '桔子', '亚朵', '希尔顿',
		'万豪', '洲际', '香格里拉', '凯悦', '喜来登', '华住', '首旅如家',
		
		// 其他常见
		'屈臣氏', '名创优品', 'MINISO', '无印良品', 'MUJI', '优衣库', 'UNIQLO',
		'ZARA', 'H&M', 'GAP', '海澜之家', '太平鸟', 'UR', '热风'
	]
	
	// 尝试从文本中匹配商家关键词
	for (const keyword of merchantKeywords) {
		if (text.includes(keyword)) {
			merchant = keyword
			console.log('✅ 匹配到商家关键词:', merchant)
			break
		}
	}
	
	// 如果没有匹配到品牌关键词，尝试"在XX"模式
	if (!merchant) {
		const atMatch = text.match(/在(.+?)(?:吃|喝|买|花|消费|支付|玩|看|逛|购|订|充|交|缴|付|办|做|理|剪|洗|修|换|加|停|打|坐|乘|租|住|住宿|入住|预订|预约|报名|学|培训|上课|治疗|检查|体检|挂号|拿药|配药|取药)/);
		
		if (atMatch && atMatch[1]) {
			merchant = atMatch[1].trim()
			console.log('✅ 从"在XX"模式提取商家:', merchant)
		}
	}
	
	// 如果还是没有，尝试移除无关词汇后的剩余内容
	if (!merchant) {
		merchant = text
			.replace(/\d+\.?\d*\s*元/g, '')  // 移除金额
			.replace(/\d+\.?\d*\s*块钱/g, '')  // 移除"块钱"
			.replace(/\d+\.?\d*\s*块/g, '')  // 移除"块"
			.replace(/今天|昨天|前天/g, '')   // 移除日期词
			.replace(/花了|支付|消费|买了|吃了|喝了|收到|赚了|挣了|发了/g, '')  // 移除动词
			.trim()
	}
	
	// 收入类型的特殊处理：如果商家名为空或太短，使用默认值
	if (type === 'income') {
		if (!merchant || merchant.length < 2) {
			// 根据分类名推断来源
			if (categoryName === '工资') {
				merchant = '公司'
			} else if (categoryName === '兼职') {
				merchant = '兼职单位'
			} else if (categoryName === '奖金') {
				merchant = '公司'
			} else if (categoryName === '红包') {
				merchant = '亲友'
			} else if (categoryName === '退款') {
				merchant = '商家'
			} else if (categoryName === '报销') {
				merchant = '公司'
			} else if (categoryName === '投资') {
				merchant = '投资收益'
			} else {
				merchant = '其他来源'
			}
			console.log('✅ 收入类型使用默认商家:', merchant)
		}
	} else {
		// 支出类型：如果商家名为空，使用分类名
		if (!merchant && categoryName) {
			merchant = categoryName
		}
	}
	
	// 备注保留用户的完整输入
	const remark = text
	
	// 提取日期 - 默认为今天
	let date = new Date().toISOString().split('T')[0]  // 默认今天
	
	if (text.includes('昨天')) {
		const yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
		date = yesterday.toISOString().split('T')[0]
	} else if (text.includes('前天')) {
		const dayBefore = new Date()
		dayBefore.setDate(dayBefore.getDate() - 2)
		date = dayBefore.toISOString().split('T')[0]
	}
	
	console.log('📊 最终解析结果:', { type, amount, merchant, remark, categoryId, categoryName, date })
	
	return {
		type,
		amount,
		merchant,
		remark,
		categoryId,
		categoryName,
		date
	}
}
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #F0FFF4 0%, #F6FFED 50%, #FAFAFA 100%);
		padding: $spacing-md $spacing-md;
		padding-bottom: 80rpx;
	}
	
	/* 顶部标题 */
	.header-section {
		text-align: center;
		padding: $spacing-lg 0 $spacing-md;
		margin-bottom: $spacing-xs;
		position: relative;
	}
	
	.header-icon-wrapper {
		width: 80rpx;
		height: 80rpx;
		background: $gradient-primary;
		border-radius: 20rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-sm;
		box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.25);
		transform: rotate(-5deg);
		animation: float 3s ease-in-out infinite;
	}
	
	@keyframes float {
		0%, 100% {
			transform: rotate(-5deg) translateY(0);
		}
		50% {
			transform: rotate(-5deg) translateY(-8rpx);
		}
	}
	
	.header-icon {
		font-size: 48rpx;
		filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
	}
	
	.header-title {
		font-size: 36rpx;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-xs;
		background: $gradient-primary;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.header-subtitle {
		font-size: $font-size-sm;
		color: $text-tertiary;
	}
	
	/* 语音录制卡片 */
	.voice-card {
		background: $bg-white;
		border-radius: 20rpx;
		padding: $spacing-xl $spacing-lg;
		margin-bottom: $spacing-sm;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}

	.voice-area {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.record-btn {
		width: 180rpx;
		height: 180rpx;
		border-radius: $radius-round;
		background: $gradient-primary;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 32rpx rgba(82, 196, 26, 0.3);
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		margin-bottom: $spacing-xl;
	}

	.record-btn.recording {
		transform: scale(1.1);
		box-shadow: 0 12rpx 40rpx rgba(82, 196, 26, 0.5);
		animation: pulse 1.5s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: scale(1.1);
		}
		50% {
			transform: scale(1.15);
		}
	}
	
	.record-icon-wrapper {
		z-index: 2;
	}

	.record-icon {
		font-size: 80rpx;
		filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.2));
	}
	
	.record-glow {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: $radius-round;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.3) 0%, transparent 70%);
		animation: glow 2s ease-in-out infinite;
	}
	
	@keyframes glow {
		0%, 100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}

	.record-wave {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: $radius-round;
	}

	.wave {
		position: absolute;
		width: 100%;
		height: 100%;
		border-radius: $radius-round;
		border: 4rpx solid rgba(255, 255, 255, 0.6);
		animation: wave 2s ease-out infinite;
	}

	.wave-1 {
		animation-delay: 0s;
	}

	.wave-2 {
		animation-delay: 0.6s;
	}

	.wave-3 {
		animation-delay: 1.2s;
	}

	@keyframes wave {
		0% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(1.8);
			opacity: 0;
		}
	}

	.record-status {
		font-size: $font-size-lg;
		margin-bottom: $spacing-sm;
	}
	
	.status-normal {
		color: $text-secondary;
		font-weight: $font-weight-medium;
		display: flex;
		align-items: center;
		gap: $spacing-xs;
	}
	
	.status-icon {
		font-size: $font-size-2xl;
		animation: bounce 2s ease-in-out infinite;
	}
	
	@keyframes bounce {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8rpx);
		}
	}
	
	.status-recording {
		color: $error-color;
		font-weight: $font-weight-bold;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}
	
	.recording-dot {
		width: 16rpx;
		height: 16rpx;
		background: $error-color;
		border-radius: $radius-round;
		animation: blink 1s infinite;
		box-shadow: 0 0 12rpx $error-color;
	}
	
	@keyframes blink {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.3; }
	}
	
	.record-tip {
		font-size: $font-size-sm;
		color: $text-tertiary;
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		background: $bg-light;
		padding: $spacing-sm $spacing-lg;
		border-radius: $radius-2xl;
	}
	
	.tip-icon {
		font-size: $font-size-base;
	}
	
	/* 分隔线 */
	.divider {
		display: flex;
		align-items: center;
		margin: $spacing-lg 0;
		position: relative;
	}
	
	.divider-line {
		flex: 1;
		height: 2rpx;
		background: linear-gradient(90deg, transparent 0%, $border-color 50%, transparent 100%);
	}
	
	.divider-text-wrapper {
		padding: 0 $spacing-xl;
	}
	
	.divider-text {
		font-size: $font-size-lg;
		color: $text-tertiary;
		font-weight: $font-weight-medium;
		background: $gradient-primary;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	/* 输入卡片 */
	.input-card {
		background: $bg-white;
		border-radius: 20rpx;
		padding: $spacing-lg;
		margin-bottom: $spacing-sm;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}
	
	.input-header {
		margin-bottom: $spacing-md;
	}
	
	.input-title-wrapper {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		margin-bottom: $spacing-xs;
	}
	
	.input-icon {
		font-size: $font-size-2xl;
	}
	
	.input-title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
	}
	
	.input-subtitle {
		font-size: $font-size-sm;
		color: $text-tertiary;
		margin-left: 56rpx;
	}
	
	.input-wrapper {
		margin-bottom: $spacing-md;
	}

	.text-input {
		width: 100%;
		min-height: 100rpx;
		background: #FAFAFA;
		border-radius: 16rpx;
		padding: $spacing-md $spacing-lg;
		font-size: $font-size-base;
		color: $text-primary;
		line-height: $line-height-relaxed;
		border: 2rpx solid transparent;
		transition: all 0.3s;
	}
	
	.text-input:focus {
		border-color: $primary-color;
		background: $bg-white;
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.1);
	}
	
	.input-placeholder {
		color: $text-tertiary;
	}

	.parse-btn {
		width: 100%;
		height: 88rpx;
		background: $gradient-primary;
		color: $text-white;
		border-radius: 18rpx;
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		border: none;
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.25);
		transition: all $transition-fast;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
	}
	
	.parse-btn:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.2);
	}

	.parse-btn[disabled] {
		background: #E0E0E0;
		color: $text-tertiary;
		box-shadow: none;
	}
	
	.btn-icon {
		font-size: $font-size-xl;
	}
	
	/* 示例卡片 */
	.examples-card {
		background: $bg-white;
		border-radius: 20rpx;
		padding: $spacing-lg;
		margin-bottom: $spacing-md;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}
	
	.examples-header {
		display: flex;
		align-items: center;
		margin-bottom: $spacing-md;
		gap: $spacing-sm;
	}
	
	.examples-icon {
		font-size: 40rpx;
	}
	
	.examples-title-wrapper {
		flex: 1;
	}

	.examples-title {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		display: block;
		margin-bottom: 4rpx;
	}
	
	.examples-subtitle {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}
	
	.examples-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}

	.example-item {
		background: #FAFAFA;
		border-radius: 14rpx;
		padding: $spacing-md $spacing-lg;
		display: flex;
		align-items: center;
		justify-content: space-between;
		transition: all $transition-fast;
		border: 2rpx solid transparent;
	}
	
	.example-item:active {
		background: #F0F0F0;
		transform: scale(0.98);
		border-color: $primary-color;
	}
	
	.example-content {
		flex: 1;
		display: flex;
		align-items: center;
		gap: $spacing-sm;
	}
	
	.example-number {
		width: 40rpx;
		height: 40rpx;
		background: $gradient-primary;
		color: $text-white;
		border-radius: $radius-round;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-xs;
		font-weight: $font-weight-bold;
		flex-shrink: 0;
	}

	.example-text {
		font-size: $font-size-base;
		color: $text-secondary;
		flex: 1;
	}
	
	.example-arrow {
		font-size: $font-size-xl;
		color: $primary-color;
		margin-left: $spacing-sm;
		font-weight: 300;
	}
	
	/* 加载遮罩 */
	.loading-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		backdrop-filter: blur(4rpx);
	}

	.loading-content {
		background: $bg-white;
		border-radius: $radius-2xl;
		padding: 60rpx 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xl;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
	}

	.loading-spinner {
		width: 80rpx;
		height: 80rpx;
		border: 6rpx solid $bg-light;
		border-top-color: $primary-color;
		border-radius: $radius-round;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}

	.loading-text {
		font-size: $font-size-lg;
		color: $text-primary;
		font-weight: $font-weight-medium;
	}
</style>
