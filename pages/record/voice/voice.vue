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
import request from '@/utils/request.js'
import cloudbaseAI from '@/utils/cloudbaseAI.js'

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
	// 检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		uni.showModal({
			title: '提示',
			content: '请先登录后再使用语音记账功能',
			confirmText: '去登录',
			cancelText: '返回',
			success: (res) => {
				if (res.confirm) {
					// 小程序跳转到个人中心
					// #ifdef MP-WEIXIN
					uni.switchTab({ url: '/pages/tab/profile/profile' })
					// #endif
					
					// APP跳转到登录页
					// #ifdef APP-PLUS
					uni.navigateTo({ url: '/pages/user/login' })
					// #endif
				} else {
					uni.navigateBack()
				}
			}
		})
		return
	}
	
	// 初始化录音管理器(小程序和APP都支持)
	data.recorderManager = uni.getRecorderManager()
	
	// 监听录音开始
	data.recorderManager.onStart(() => {
		console.log('✅ 录音已开始')
	})
	
	// 监听录音停止
	data.recorderManager.onStop((res) => {
		console.log('✅ 录音已停止，时长:', res.duration, 'ms')
		handleRecordStop(res)
	})
	
	// 监听录音错误
	data.recorderManager.onError((err) => {
		console.error('❌ 录音错误:', err)
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
		console.log('⚠️ 录音被中断')
		data.isRecording = false
		if (data.recordTimer) {
			clearInterval(data.recordTimer)
			data.recordTimer = null
		}
	})
	
	// 监听录音中断结束
	data.recorderManager.onInterruptionEnd(() => {
		console.log('✅ 录音中断结束')
	})
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
	console.log('🎙️ 开始录音，当前状态:', data.isRecording)
	
	// 防止重复启动
	if (data.isRecording) {
		console.log('⚠️ 录音已在进行中，忽略重复启动')
		return
	}
	
	try {
		// 第一步：检查并请求录音权限
		console.log('🔐 检查录音权限...')
		
		// #ifdef APP-PLUS
		// APP端：检查权限状态
		const permissionResult = await new Promise((resolve) => {
			plus.android.requestPermissions(
				['android.permission.RECORD_AUDIO'],
				(result) => {
					console.log('📋 权限请求结果:', result)
					// result.granted 是已授权的权限数组
					if (result.granted && result.granted.length > 0) {
						console.log('✅ 录音权限已授权')
						resolve(true)
					} else {
						console.log('❌ 用户拒绝录音权限')
						resolve(false)
					}
				},
				(error) => {
					console.error('❌ 权限请求失败:', error)
					resolve(false)
				}
			)
		})
		
		if (!permissionResult) {
			uni.showModal({
				title: '需要录音权限',
				content: '请在系统设置中开启录音权限',
				confirmText: '去设置',
				cancelText: '取消',
				success: (res) => {
					if (res.confirm) {
						// 打开应用设置页面
						plus.runtime.openURL('app-settings://')
					}
				}
			})
			return
		}
		// #endif
		
		// #ifdef MP-WEIXIN
		// 小程序端：使用getSetting检查权限
		const settingRes = await uni.getSetting()
		console.log('📋 当前权限设置:', settingRes)
		
		// 如果用户之前拒绝过权限
		if (settingRes.authSetting['scope.record'] === false) {
			uni.showModal({
				title: '需要录音权限',
				content: '请在设置中开启录音权限',
				confirmText: '去设置',
				cancelText: '取消',
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
				console.log('✅ 录音权限授权成功')
			} catch (err) {
				console.log('❌ 用户拒绝授权:', err)
				uni.showToast({
					title: '需要录音权限才能使用',
					icon: 'none'
				})
				return
			}
		}
		// #endif
		
		console.log('✅ 权限检查通过，开始初始化录音器')
		
		// 第二步：初始化录音器
		if (!data.recorderManager) {
			data.recorderManager = uni.getRecorderManager()
			
			// 绑定事件监听
			data.recorderManager.onStart(() => {
				console.log('✅ 录音已开始')
			})
			
			data.recorderManager.onStop((res) => {
				console.log('✅ 录音已停止，时长:', res.duration, 'ms')
				handleRecordStop(res)
			})
			
			data.recorderManager.onError((err) => {
				console.error('❌ 录音错误:', err)
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
		
		// 第三步：设置录音状态并启动
		data.isRecording = true
		data.recordTime = 0
		
		try {
			data.recorderManager.start({
				duration: 60000,
				format: 'aac',
				sampleRate: 16000,
				numberOfChannels: 1,
				encodeBitRate: 48000,
				frameSize: 50
			})
			
			console.log('✅ 录音器已启动，格式: aac, 采样率: 16000')
			
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
			console.error('❌ 启动录音失败:', error)
			data.isRecording = false
			uni.showToast({
				title: '启动录音失败，请重试',
				icon: 'none'
			})
		}
	} catch (error) {
		console.error('❌ 录音初始化失败:', error)
		data.isRecording = false
		uni.showToast({
			title: '录音初始化失败',
			icon: 'none'
		})
	}
}

const stopRecord = () => {
	console.log('🎙️ 停止录音，当前状态:', data.isRecording)
	if (!data.isRecording) {
		console.log('⚠️ 录音未启动，忽略停止操作')
		return
	}
	
	// 立即设置状态，防止重复触发
	data.isRecording = false
	
	// 清除定时器
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
		data.recordTimer = null
	}
	
	// APP端和小程序端都需要停止录音
	try {
		data.recorderManager.stop()
		console.log('✅ 录音器已停止')
	} catch (error) {
		console.error('❌ 停止录音失败:', error)
	}
}

const cancelRecord = () => {
	console.log('🎙️ 取消录音')
	if (!data.isRecording) {
		console.log('⚠️ 录音未启动，忽略取消操作')
		return
	}
	
	// 立即设置状态
	data.isRecording = false
	
	// 清除定时器
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
		data.recordTimer = null
	}
	
	// APP端和小程序端都需要停止录音
	try {
		data.recorderManager.stop()
		console.log('✅ 录音已取消')
	} catch (error) {
		console.error('❌ 取消录音失败:', error)
	}
	
	uni.showToast({
		title: '已取消录音',
		icon: 'none'
	})
}

const handleRecordStop = async (res) => {
	const startTime = Date.now()
	console.log('⏱️ [语音识别] 开始时间:', new Date().toLocaleTimeString())
	console.log('录音停止回调，文件路径:', res.tempFilePath)
	console.log('录音时长:', res.duration, 'ms')
	console.log('录音文件大小:', res.fileSize, 'bytes')
	
	// 确保状态已重置
	data.isRecording = false
	if (data.recordTimer) {
		clearInterval(data.recordTimer)
		data.recordTimer = null
	}
	
	// 检查录音文件是否有效
	if (!res.tempFilePath) {
		console.error('❌ 录音文件路径为空')
		uni.showToast({
			title: '录音失败，请重试',
			icon: 'none',
			duration: 2000
		})
		return
	}
	
	// 检查录音时长（如果有duration字段且太短，则拒绝）
	// 注意：APP端可能没有duration字段，所以只在有值时检查
	if (res.duration !== undefined && res.duration < 500) {
		console.error('❌ 录音时长太短:', res.duration, 'ms')
		uni.showToast({
			title: '录音时间太短，请重新录制',
			icon: 'none',
			duration: 2000
		})
		return
	}
	
	// 检查文件大小（如果太小，可能是无效录音）
	if (res.fileSize !== undefined && res.fileSize < 1000) {
		console.error('❌ 录音文件太小:', res.fileSize, 'bytes')
		uni.showToast({
			title: '录音文件无效，请重新录制',
			icon: 'none',
			duration: 2000
		})
		return
	}
	
	data.parsing = true
	
	try {
		// 上传音频文件到服务器
		const uploadStartTime = Date.now()
		console.log('开始上传音频文件到服务器，路径:', res.tempFilePath)
		
		const uploadRes = await request.uploadFile(res.tempFilePath)
		const uploadEndTime = Date.now()
		console.log('⏱️ [语音识别] 音频上传耗时:', uploadEndTime - uploadStartTime, 'ms')
		
		if (!uploadRes || !uploadRes.success) {
			throw new Error(uploadRes?.message || '音频上传失败')
		}
		
		if (!uploadRes.url) {
			throw new Error('上传成功但未返回文件URL')
		}
		
		console.log('音频文件上传成功，URL:', uploadRes.url)
		
		const asrStartTime = Date.now()
		console.log('开始调用语音识别接口')
		
		const result = await request.call('baiduASR', {
			audioUrl: uploadRes.url
		})
		
		const asrEndTime = Date.now()
		console.log('⏱️ [语音识别] 语音识别耗时:', asrEndTime - asrStartTime, 'ms')
		console.log('⏱️ [语音识别] 快速解析完成:', Date.now() - startTime, 'ms (', ((Date.now() - startTime) / 1000).toFixed(2), '秒)')
		
		if (!result.success || !result.text) {
			throw new Error(result.error || '识别结果为空')
		}
		
		console.log('识别结果:', result.text)
		data.recognizedText = result.text
		
		// 快速解析：使用本地规则立即返回结果
		const quickResult = extractBillInfo(result.text)
		console.log('📦 快速解析结果:', quickResult)
		
		// 立即跳转到确认页面
		data.parsing = false
		uni.navigateTo({
			url: `/pages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(quickResult))}`
		})
		
		// 后台异步执行 AI 增强识别
		console.log('⏱️ [AI增强] 开始后台增强识别')
		enhanceWithAI(result.text, startTime)
	} catch (error) {
		console.error('识别失败:', error)
		console.error('错误详情:', error.message)
		data.parsing = false
		
		// 根据错误类型给出更友好的提示
		let errorMsg = '识别失败，请重试'
		
		if (error.message.includes('没有文件上传') || error.message.includes('上传失败')) {
			errorMsg = '录音文件上传失败，请检查网络后重试'
		} else if (error.message.includes('识别结果为空')) {
			errorMsg = '未识别到内容，请说清楚一些'
		} else if (error.message.includes('网络')) {
			errorMsg = '网络连接失败，请检查网络'
		} else if (error.message) {
			// 如果有具体错误信息，显示简化版本
			errorMsg = error.message.length > 20 ? '识别失败，请重试' : error.message
		}
		
		uni.showToast({
			title: errorMsg,
			icon: 'none',
			duration: 2500
		})
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
	
	const startTime = Date.now()
	console.log('⏱️ [文字输入] 开始时间:', new Date().toLocaleTimeString())
	
	data.parsing = true
	data.recognizedText = data.inputText
	
	// 快速解析：使用本地规则立即返回结果
	const quickResult = extractBillInfo(data.inputText)
	console.log('⏱️ [文字输入] 快速解析完成:', Date.now() - startTime, 'ms (', ((Date.now() - startTime) / 1000).toFixed(2), '秒)')
	console.log('📦 快速解析结果:', quickResult)
	
	// 立即跳转到确认页面
	data.parsing = false
	uni.navigateTo({
		url: `/pages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(quickResult))}`
	})
	
	// 后台异步执行 AI 增强识别
	console.log('⏱️ [AI增强] 开始后台增强识别')
	enhanceWithAI(data.inputText, startTime)
}

// AI 增强识别（后台异步执行）
const enhanceWithAI = async (text, startTime) => {
	try {
		const aiStartTime = Date.now()
		console.log('⏱️ [AI增强-语音] 调用后端 AI API...')
		console.log('📋 语音文本:', text)
		
		// 先用前端正则提取基础信息
		const baseInfo = extractBillInfo(text)
		console.log('📦 前端提取的基础信息:', baseInfo)
		
		// 验证基础信息是否完整
		if (!baseInfo.amount || baseInfo.amount === 0) {
			console.warn('⚠️ 金额为0，AI增强可能无法改善')
		}
		if (!baseInfo.merchant || baseInfo.merchant.length < 2) {
			console.warn('⚠️ 商家为空或太短，AI增强将尝试提取')
		}
		if (!baseInfo.categoryName || baseInfo.categoryName === '其他') {
			console.warn('⚠️ 分类为空或"其他"，AI增强将尝试优化')
		}
		
		// 调用统一的 Cloudbase AI 工具类（现在使用后端API）
		const aiResult = await cloudbaseAI.enhanceVoice(text, baseInfo)
		
		const aiEndTime = Date.now()
		const totalTime = Date.now() - startTime
		console.log('⏱️ [AI增强-语音] AI识别耗时:', aiEndTime - aiStartTime, 'ms')
		console.log('⏱️ [AI增强-语音] 总耗时:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), '秒)')
		console.log('🎯 AI增强结果:', aiResult)
		
		// 验证AI结果
		if (aiResult) {
			if (aiResult.merchant && aiResult.merchant !== baseInfo.merchant) {
				console.log('✅ AI优化了商家:', baseInfo.merchant, '→', aiResult.merchant)
			}
			if (aiResult.categoryName && aiResult.categoryName !== baseInfo.categoryName) {
				console.log('✅ AI优化了分类:', baseInfo.categoryName, '→', aiResult.categoryName)
			}
			if (aiResult.remark && aiResult.remark !== baseInfo.remark) {
				console.log('✅ AI优化了备注:', baseInfo.remark, '→', aiResult.remark)
			}
		}
		
		// 通知确认页面更新
		console.log('🎯 AI 增强完成，通知页面更新')
		uni.$emit('aiEnhanced', aiResult)
		
	} catch (aiError) {
		console.error('❌ AI 增强失败:', aiError)
		console.error('❌ 错误详情:', aiError.message)
		console.error('❌ 错误堆栈:', aiError.stack)
		const totalTime = Date.now() - startTime
		console.log('⏱️ [AI增强-语音] 总耗时(失败):', totalTime, 'ms (', (totalTime / 1000).toFixed(2), '秒)')
		// AI 失败不影响用户使用，静默失败
	}
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
			'红包': ['红包', '压岁钱'],
			'退款': ['退款', '退货', '返现'],
			'报销': ['报销', '补贴', '津贴'],
			'投资': ['利息', '分红', '股息', '理财', '股票', '基金'],
			'礼金': ['礼金', '份子钱', '收礼'],
			'出售': ['出售', '卖', '二手', '闲置', '转让', '闲鱼'],
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
				'餐饮': ['吃', '饭', '餐', '喝', '食', '早餐', '午餐', '晚餐', '宵夜', '点心'],
				'交通': ['车', '打车', '出租', '地铁', '公交', '滴滴', '停车', '加油', '高速'],
				'购物': ['买', '购', '逛', '商场', '超市', '网购', '淘宝', '京东'],
				'娱乐': ['玩', '看电影', '游戏', 'KTV', '唱歌', '健身'],
				'医疗': ['看病', '买药', '医院', '体检', '挂号'],
				'通讯': ['话费', '流量', '宽带', '充值'],
				'服饰': ['衣服', '鞋', '裤子', '裙子'],
				'美容': ['理发', '美发', '美甲', '化妆'],
				'学习': ['书', '课', '培训', '学费'],
				'住房': ['房租', '水费', '电费', '物业'],
				'社交': ['聚餐', '送礼', '红包'],
				'零食': ['零食', '饮料', '水果', '可乐', '雪碧'],
				'数码': ['手机', '电脑', '平板', '耳机'],
				'家居': ['家具', '家电', '日用品'],
				'汽车': ['车贷', '保养', '维修', '洗车'],
				'宠物': ['宠物', '猫粮', '狗粮']
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
		'赛百味', 'Subway', '正新鸡排', '绝味鸭脖', '周黑鸭', '煌上煌',
		
		// 火锅烧烤
		'海底捞', '呷哺呷哺', '巴奴', '小龙坎', '大龙燚', '珮姐', '谭鸭血', '小肥羊',
		'太二', '太二酸菜鱼', '九毛九', '蛙来哒', '蛙小侠', '哥老官', '贤合庄',
		'木屋烧烤', '很久以前', '权金城', '汉拿山', '丰茂烤串',
		
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
		
		// 生活服务
		'阿姨帮', '天鹅到家', '58到家', 'e袋洗', '泰笛', '荣昌', '万师傅', '神工007',
		
		// 教育培训
		'学而思', '猿辅导', '作业帮', '新东方', '英孚', '华尔街英语', '韦博', '达内', '传智播客',
		
		// 医疗健康
		'平安好医生', '微医', '丁香医生', '美年大健康', '爱康国宾', '老百姓', '大参林', '益丰',
		
		// 宠物服务
		'瑞鹏', '芭比堂', '安安', '波奇', 'E宠',
		
		// 其他常见
		'名创优品', 'MINISO', '无印良品', 'MUJI', '优衣库', 'UNIQLO',
		'ZARA', 'H&M', 'GAP', '海澜之家', '太平鸟', 'UR', '热风'
	]
	
	// 尝试从文本中匹配商家关键词
	for (const keyword of merchantKeywords) {
		if (text.includes(keyword)) {
			merchant = keyword
			console.log('✅ 匹配到商家关键词:', merchant)
			
			// 尝试提取分店信息（如"星巴克国贸店"）
			const storePattern = new RegExp(`(${keyword}[\\u4e00-\\u9fa5]{0,10}(?:店|分店|门店|广场|中心|商场))`)
			const storeMatch = text.match(storePattern)
			if (storeMatch && storeMatch[1]) {
				merchant = storeMatch[1].trim()
				console.log('✅ 提取到完整店名:', merchant)
			}
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
	
	// 处理平台+商家组合（如"美团外卖-海底捞"→提取"海底捞"）
	if (merchant && (merchant.includes('美团') || merchant.includes('饿了么') || merchant.includes('淘宝') || merchant.includes('京东'))) {
		// 尝试提取平台后的商家名
		const platformMerchantMatch = text.match(/(?:美团|饿了么|淘宝|京东)[^，。！？\n]*?([^\s，。！？\n]{2,10}(?:店|餐厅|火锅|烧烤|咖啡|奶茶|超市|便利店))/)
		if (platformMerchantMatch && platformMerchantMatch[1]) {
			merchant = platformMerchantMatch[1].trim()
			console.log('✅ 从平台提取具体商家:', merchant)
		}
	}
	
	// 如果还是没有，尝试移除无关词汇后的剩余内容
	if (!merchant) {
		let cleanedText = text
			.replace(/\d+\.?\d*\s*元/g, '')  // 移除金额
			.replace(/\d+\.?\d*\s*块钱/g, '')  // 移除"块钱"
			.replace(/\d+\.?\d*\s*块/g, '')  // 移除"块"
			.replace(/今天|昨天|前天/g, '')   // 移除日期词
			.replace(/花了|支付|消费|买了|吃了|喝了|收到|赚了|挣了|发了/g, '')  // 移除动词
			.trim()
		
		// 如果清理后的文本太长或太短，使用分类名作为商家
		if (cleanedText.length > 20 || cleanedText.length < 2) {
			merchant = categoryName || '未知商家'
		} else {
			merchant = cleanedText
		}
	}
	
	// 收入类型的特殊处理：如果商家名为空或太短，使用默认值
	if (type === 'income') {
		if (!merchant || merchant.length < 2 || merchant === '未知商家') {
			// 根据分类名推断来源
			if (categoryName === '工资') {
				merchant = '公司'
			} else if (categoryName === '兼职') {
				// 尝试识别兼职平台
				const platforms = ['美团众包', '饿了么', '闪送', '滴滴', '达达', 'UU跑腿']
				for (const platform of platforms) {
					if (text.includes(platform)) {
						merchant = platform
						break
					}
				}
				if (!merchant || merchant.length < 2 || merchant === '未知商家') {
					merchant = '兼职平台'
				}
			} else if (categoryName === '奖金') {
				merchant = '公司'
			} else if (categoryName === '红包') {
				merchant = '亲友'
			} else if (categoryName === '退款') {
				merchant = '商家'
			} else if (categoryName === '报销') {
				merchant = '公司'
			} else if (categoryName === '投资') {
				// 尝试识别投资平台
				const platforms = ['支付宝', '微信理财通', '天天基金', '雪球', '蚂蚁财富', '京东金融']
				for (const platform of platforms) {
					if (text.includes(platform)) {
						merchant = platform
						break
					}
				}
				if (!merchant || merchant.length < 2 || merchant === '未知商家') {
					merchant = '投资平台'
				}
			} else if (categoryName === '礼金') {
				merchant = '亲友'
			} else if (categoryName === '出售') {
				// 尝试识别二手平台
				const platforms = ['闲鱼', '转转', '拼多多', '淘宝', '京东']
				for (const platform of platforms) {
					if (text.includes(platform)) {
						merchant = platform
						break
					}
				}
				if (!merchant || merchant.length < 2 || merchant === '未知商家') {
					merchant = '买家'
				}
			} else {
				merchant = '其他来源'
			}
			console.log('✅ 收入类型使用默认商家:', merchant)
		}
	} else {
		// 支出类型：如果商家名为空或无效，使用分类名
		if (!merchant || merchant.length < 2 || merchant === '未知商家') {
			merchant = categoryName || '其他'
		}
	}
	
	// 备注保留用户的完整输入，或智能提取关键信息
	let remark = ''
	
	// 1. 用户明确说"备注XX"
	const remarkMatch = text.match(/备注[：:]\s*(.+?)(?:[，。！？]|$)/)
	if (remarkMatch && remarkMatch[1]) {
		remark = remarkMatch[1].trim()
		console.log('✅ 提取备注:', remark)
	}
	// 2. 提取地点信息
	else if (text.includes('在')) {
		const locationMatch = text.match(/在(.+?)(?:吃|喝|买|花|消费|支付|玩|看|逛|购|订|充|交|缴|付|办|做|理|剪|洗|修|换|加|停|打|坐|乘|租|住|住宿|入住|预订|预约|报名|学|培训|上课|治疗|检查|体检|挂号|拿药|配药|取药)/)
		if (locationMatch && locationMatch[1]) {
			const location = locationMatch[1].trim()
			// 限制地点长度，避免过长
			remark = location.length > 20 ? location.substring(0, 20) : location
			console.log('✅ 提取地点:', remark)
		}
	}
	// 3. 提取商品信息（超市/便利店/零食店）
	else if (categoryName === '零食' || categoryName === '购物' || merchant.includes('超市') || merchant.includes('便利店')) {
		// 尝试提取商品名（如"买了可乐和薯片"）
		const goodsMatch = text.match(/(?:买了|购买了|买)(.+?)(?:[，。！？]|$)/)
		if (goodsMatch && goodsMatch[1]) {
			const goods = goodsMatch[1].trim().replace(/和|、/g, '、')
			// 限制商品名长度
			remark = goods.length > 30 ? goods.substring(0, 30) : goods
			console.log('✅ 提取商品:', remark)
		}
	}
	// 4. 提取用途（如"用于XX"）
	else if (text.includes('用于')) {
		const purposeMatch = text.match(/用于(.+?)(?:[，。！？]|$)/)
		if (purposeMatch && purposeMatch[1]) {
			const purpose = purposeMatch[1].trim()
			// 限制用途长度
			remark = purpose.length > 30 ? purpose.substring(0, 30) : purpose
			console.log('✅ 提取用途:', remark)
		}
	}
	// 5. 默认：限制长度，避免备注过长
	else {
		// 移除金额、日期等无关信息
		let cleanText = text
			.replace(/\d+\.?\d*\s*元/g, '')
			.replace(/\d+\.?\d*\s*块钱/g, '')
			.replace(/\d+\.?\d*\s*块/g, '')
			.replace(/今天|昨天|前天/g, '')
			.replace(/花了|支付|消费|买了|吃了|喝了|收到|赚了|挣了|发了/g, '')
			.trim()
		
		// 如果清理后的文本合理，使用它；否则留空
		if (cleanText.length > 2 && cleanText.length <= 50) {
			remark = cleanText
		} else if (cleanText.length > 50) {
			remark = cleanText.substring(0, 50)
		}
		// 如果太短或太长，留空，让AI增强来处理
	}
	
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
		/* 增加顶部间距，让图标距离顶部更远 */
		padding: $spacing-2xl 0 $spacing-lg;
		margin-bottom: 0;
		position: relative;
	}
	
	.header-icon-wrapper {
		/* 增大图标尺寸 */
		width: 88rpx;
		height: 88rpx;
		background: $gradient-primary;
		border-radius: 20rpx;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		margin-bottom: $spacing-md;
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
		/* 增大图标字号 */
		font-size: 52rpx;
		filter: drop-shadow(0 4rpx 8rpx rgba(0, 0, 0, 0.1));
	}
	
	.header-title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
		background: $gradient-primary;
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
		background-clip: text;
	}
	
	.header-subtitle {
		font-size: $font-size-sm;
		color: $text-tertiary;
		/* 增加副标题与下方卡片的距离 */
		margin-bottom: $spacing-lg;
	}
	
	/* 语音录制卡片 */
	.voice-card {
		background: $bg-white;
		border-radius: 20rpx;
		/* 增加内边距，让卡片高度更大 */
		padding: $spacing-2xl $spacing-lg;
		margin-bottom: $spacing-sm;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}

	.voice-area {
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.record-btn {
		/* 增大录音按钮尺寸 */
		width: 180rpx;
		height: 180rpx;
		border-radius: $radius-round;
		background: $gradient-primary;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 28rpx rgba(82, 196, 26, 0.3);
		position: relative;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		margin-bottom: $spacing-xl;
	}

	.record-btn.recording {
		transform: scale(1.1);
		box-shadow: 0 12rpx 36rpx rgba(82, 196, 26, 0.45);
		animation: pulse 1.5s ease-in-out infinite;
	}
	
	@keyframes pulse {
		0%, 100% {
			transform: scale(1.1);
		}
		50% {
			transform: scale(1.14);
		}
	}
	
	.record-icon-wrapper {
		z-index: 2;
	}

	.record-icon {
		/* 增大图标尺寸 */
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
		/* 减小输入框高度 */
		min-height: 80rpx;
		background: #FAFAFA;
		border-radius: 16rpx;
		/* 减小内边距 */
		padding: $spacing-sm $spacing-lg;
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
		/* 改为渐变背景，去掉灰色 */
		background: $gradient-primary;
		color: $text-white;
		border-radius: 18rpx;
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		border: none;
		box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.3);
		transition: all $transition-fast;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		letter-spacing: 1rpx;
	}
	
	.parse-btn:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.25);
	}

	.parse-btn[disabled] {
		/* 禁用状态改为半透明 */
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.4) 0%, rgba(115, 209, 61, 0.4) 100%);
		color: rgba(255, 255, 255, 0.7);
		box-shadow: none;
		opacity: 0.6;
	}
	
	.btn-icon {
		font-size: $font-size-2xl;
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
