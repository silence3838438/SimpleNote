<template>
	<view class="container">
		<!-- 相机预览区域 -->
		<view class="camera-container" v-if="!data.imageUrl">
			<camera device-position="back" flash="off" class="camera" @error="onCameraError">
				<!-- 顶部提示区域 -->
				<view class="top-tips">
					<view class="tip-card">
						<text class="tip-icon">💡</text>
						<view class="tip-content">
							<text class="tip-title">智能识别小票</text>
							<text class="tip-desc">长小票可拍摄关键部分（金额和商家名）</text>
						</view>
					</view>
				</view>
				
				<!-- 中央扫描框 -->
				<view class="scan-area">
					<view class="scan-frame">
						<view class="corner corner-tl"></view>
						<view class="corner corner-tr"></view>
						<view class="corner corner-bl"></view>
						<view class="corner corner-br"></view>
						<view class="scan-line"></view>
					</view>
				</view>
				
				<!-- 底部操作栏 -->
				<view class="action-bar">
					<view class="action-item" @click="chooseImage">
						<view class="action-btn album-btn">
							<image class="action-icon-img" src="/static/xiangce.png" mode="aspectFit"></image>
						</view>
						<text class="action-label">相册</text>
					</view>
					
					<view class="action-item">
						<view class="capture-btn" @click="takePhoto">
							<view class="capture-outer">
								<view class="capture-inner"></view>
							</view>
						</view>
						<text class="action-label main">拍照</text>
					</view>
					
					<view class="action-item action-placeholder"></view>
				</view>
			</camera>
		</view>
		
		<!-- 图片预览区域 -->
		<view class="preview-container" v-else>
			<view class="preview-header">
				<text class="preview-title">确认图片</text>
				<text class="preview-subtitle">请确认小票清晰可见</text>
			</view>
			
			<view class="preview-image-wrapper">
				<image :src="data.imageUrl" mode="aspectFit" class="preview-image"></image>
			</view>
			
			<view class="preview-actions">
				<button class="btn-secondary" @click="retake">
					<text class="btn-icon">🔄</text>
					<text>重新拍摄</text>
				</button>
				<button class="btn-primary" @click="recognizeImage" :loading="data.recognizing">
					<text class="btn-icon" v-if="!data.recognizing">✨</text>
					<text>{{ data.recognizing ? '智能识别中...' : '开始识别' }}</text>
				</button>
			</view>
		</view>
		
		<!-- 加载遮罩 -->
		<view class="loading-mask" v-if="data.recognizing">
			<view class="loading-card">
				<view class="loading-spinner">
					<view class="spinner-ring"></view>
					<view class="spinner-ring"></view>
					<view class="spinner-ring"></view>
				</view>
				<text class="loading-title">智能识别中</text>
				<text class="loading-text">正在智能识别小票信息...</text>
				<view class="loading-progress">
					<view class="progress-bar"></view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
import { onReady } from '@dcloudio/uni-app'

const data = reactive({
	imageUrl: '',
	recognizing: false,
	cameraContext: null,
	lastRecognizeTime: 0
})

onReady(() => {
	// #ifdef MP-WEIXIN
	data.cameraContext = uni.createCameraContext()
	// #endif
})

// 相机错误处理
const onCameraError = (e) => {
	console.error('相机错误:', e)
	
	// 如果是权限问题，提示用户可以使用相册
	if (e.detail.errMsg && e.detail.errMsg.includes('auth')) {
		uni.showModal({
			title: '相机权限未开启',
			content: '您可以点击底部"相册"按钮选择已有图片，或在设置中开启相机权限后拍照',
			confirmText: '知道了',
			showCancel: false
		})
	} else {
		uni.showToast({
			title: '相机启动失败，请使用相册',
			icon: 'none'
		})
	}
}

const takePhoto = () => {
	// #ifdef MP-WEIXIN
	if (!data.cameraContext) {
		data.cameraContext = uni.createCameraContext()
	}
	data.cameraContext.takePhoto({
		quality: 'high',
		success: (res) => {
			data.imageUrl = res.tempImagePath
		},
		fail: (err) => {
			uni.showToast({
				title: '拍照失败',
				icon: 'none'
			})
		}
	})
	// #endif
	
	// #ifndef MP-WEIXIN
	uni.chooseImage({
		count: 1,
		sourceType: ['camera'],
		success: (res) => {
			data.imageUrl = res.tempFilePaths[0]
		}
	})
	// #endif
}

const chooseImage = () => {
	uni.chooseImage({
		count: 1,
		sourceType: ['album'],
		success: (res) => {
			data.imageUrl = res.tempFilePaths[0]
		}
	})
}

const retake = () => {
	data.imageUrl = ''
}

const recognizeImage = async () => {
	if (!data.imageUrl) {
		uni.showToast({
			title: '请先拍照或选择图片',
			icon: 'none'
		})
		return
	}
	
	const now = Date.now()
	if (now - data.lastRecognizeTime < 3000) {
		uni.showToast({
			title: '请稍后再试',
			icon: 'none'
		})
		return
	}
	data.lastRecognizeTime = now
	
	if (data.recognizing) return
	data.recognizing = true
	
	try {
		// #ifdef MP-WEIXIN
		const result = await callOCRCloudFunction()
		// #endif
		
		// #ifndef MP-WEIXIN
		const result = await mockOCRResult()
		// #endif
		
		data.recognizing = false
		
		// 优化：立即跳转到确认页面，不等待AI解析完成
		uni.navigateTo({
			url: `/subPackages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(result))}`
		})
	} catch (error) {
		data.recognizing = false
		
		uni.showModal({
			title: '识别失败',
			content: error.message || '无法识别图片内容，是否手动填写账单？',
			confirmText: '手动填写',
			cancelText: '重新拍照',
			success: (res) => {
				if (res.confirm) {
					const emptyData = {
						amount: 0,
						merchant: '',
						date: new Date().toISOString().split('T')[0],
						categoryId: null,
						categoryName: '',
						type: 'expense'
					}
					uni.navigateTo({
						url: `/subPackages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(emptyData))}`
					})
				} else {
					retake()
				}
			}
		})
	}
}

const callOCRCloudFunction = async () => {
	// 第一步：上传图片到云存储
	const uploadResult = await wx.cloud.uploadFile({
		cloudPath: `ocr/${Date.now()}.jpg`,
		filePath: data.imageUrl
	})
	
	console.log('图片上传成功，fileID:', uploadResult.fileID)
	
	// 第二步：调用原有OCR云函数获取文本
	const ocrRes = await wx.cloud.callFunction({
		name: 'ocrRecognize',
		data: {
			fileID: uploadResult.fileID
		}
	})
	
	console.log('OCR识别返回:', ocrRes.result)
	
	// 如果OCR识别失败，抛出错误
	if (!ocrRes.result || !ocrRes.result.success) {
		const errorMsg = ocrRes.result?.error || 'OCR识别失败'
		throw new Error(errorMsg)
	}
	
	// 第三步：使用 AI 增强识别结果
	try {
		// 构建用户消息（包含OCR识别的文本）
		const ocrText = ocrRes.result.text || ''
		
		// 如果OCR文本为空，直接使用原始结果
		if (!ocrText || ocrText.trim() === '') {
			console.log('OCR识别文本为空，直接使用原始结果')
			return ocrRes.result.data
		}
		
		// 优化后的提示词 - 更简洁，减少token数量
		const userMessage = `小票OCR文本：
${ocrText}

请提取账单信息，返回JSON格式（无需解释）：

金额识别规则（重要）：
1. 查找"实付"、"实结"、"应付"、"合计"等关键字后的金额
2. 格式可能是：¥15.89、*1 15.89、15.89元
3. 注意：*1 表示数量，后面的才是金额
4. 注意：¥ 和数字之间可能有空格
5. 如果看到 *1 15.89，金额是 15.89 不是 115.89
6. 如果看到 ¥ 15.89，金额是 15.89 不是 115.89

商家识别：完整提取商家名称和分店信息，不要遗漏文字
- 必须保留：完整品牌名+分店名（括号内的信息必须保留）
- 去掉：宣传语（如"家门口的零食乐园"）
- 去掉：过长的地址前缀（如"南京雨花台区"）
- 重要：不要遗漏或简化商家名称中的任何文字
- 示例：好想来 家门口的零食乐园 南京雨花台区时光韵店 → 好想来(时光韵店)
- 示例：苏客·天厨现炒(河西永辉超市店) → 苏客·天厨现炒(河西永辉超市店)【完整保留，不要写成"苏客·厨现炒"】
- 示例：南京市第一人民医院门诊部 → 南京市第一人民医院(门诊部)
分类：餐饮/交通/购物/娱乐/住房/医疗/通讯/服饰/美容/学习/社交/其他
类型：expense或income
日期：YYYY-MM-DD
备注：根据场景提取消费项目明细，保留具体名称
- 超市/购物：商品名称（如：可乐、薯片、矿泉水）
- 餐饮：具体菜品名称（如：红烧鸡腿、青椒土豆丝、米饭），不要泛化成"荤菜"、"素菜"
- 医疗：诊疗项目或药品名称（如：挂号费、血常规、阿莫西林）
- 交通：出行信息（如：起点-终点、车牌号）
- 娱乐：项目名称（如：电影票-《流浪地球》、健身卡）
- 其他：相关项目或服务名称
多个项目用逗号分隔，最多提取5个主要项目

返回格式：
{"type":"expense","amount":0,"merchant":"","categoryName":"餐饮","date":"${new Date().toISOString().split('T')[0]}","remark":""}`
		
		console.log('开始调用 AI 增强识别...')
		
		// 调用 AI Agent 识别
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
								return testResult
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
		
		// 解析 AI 返回的结果
		const aiResult = parseAIResponse(fullText)
		console.log('AI 增强识别成功:', aiResult)
		return aiResult
		
	} catch (aiError) {
		console.error('AI 增强识别失败，使用原始OCR结果:', aiError)
		// 如果 AI 识别失败，降级使用原始OCR结果
		return ocrRes.result.data
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

const mockOCRResult = () => {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve({
				amount: 156.00,
				merchant: '海底捞火锅',
				date: new Date().toISOString().split('T')[0],
				categoryId: 1,
				categoryName: '餐饮'
			})
		}, 2000)
	})
}
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.container {
		width: 100vw;
		height: 100vh;
		background-color: #000000;
		position: relative;
	}

	/* 相机容器 */
	.camera-container {
		width: 100%;
		height: 100%;
		position: relative;
	}

	.camera {
		width: 100%;
		height: 100%;
	}
	
	/* 顶部提示 */
	.top-tips {
		position: absolute;
		top: 30rpx;
		left: 0;
		right: 0;
		padding: 0 $spacing-xl;
		z-index: 10;
	}
	
	.tip-card {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20rpx);
		border-radius: $radius-2xl;
		padding: $spacing-lg $spacing-xl;
		display: flex;
		align-items: center;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
	}
	
	.tip-icon {
		font-size: 48rpx;
		margin-right: $spacing-md;
	}
	
	.tip-content {
		flex: 1;
		display: flex;
		flex-direction: column;
	}
	
	.tip-title {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: 4rpx;
	}
	
	.tip-desc {
		font-size: $font-size-sm;
		color: $text-secondary;
	}

	/* 扫描区域 */
	.scan-area {
		position: absolute;
		top: 47%;
		left: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.scan-frame {
		width: 650rpx;
		height: 1000rpx;
		position: relative;
		box-shadow: 0 0 0 9999rpx rgba(0, 0, 0, 0.6);
	}
	
	/* 四个角 */
	.corner {
		position: absolute;
		width: 60rpx;
		height: 60rpx;
		border: 6rpx solid $primary-color;
	}
	
	.corner-tl {
		top: -6rpx;
		left: -6rpx;
		border-right: none;
		border-bottom: none;
		border-radius: $radius-lg 0 0 0;
	}
	
	.corner-tr {
		top: -6rpx;
		right: -6rpx;
		border-left: none;
		border-bottom: none;
		border-radius: 0 $radius-lg 0 0;
	}
	
	.corner-bl {
		bottom: -6rpx;
		left: -6rpx;
		border-right: none;
		border-top: none;
		border-radius: 0 0 0 $radius-lg;
	}
	
	.corner-br {
		bottom: -6rpx;
		right: -6rpx;
		border-left: none;
		border-top: none;
		border-radius: 0 0 $radius-lg 0;
	}
	
	/* 扫描线 */
	.scan-line {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 4rpx;
		background: linear-gradient(90deg, transparent 0%, $primary-color 50%, transparent 100%);
		animation: scan 2s linear infinite;
		box-shadow: 0 0 20rpx $primary-color;
	}
	
	@keyframes scan {
		0% {
			top: 0;
		}
		100% {
			top: 100%;
		}
	}

	.scan-text {
		position: absolute;
		top: -80rpx;
		font-size: $font-size-lg;
		color: $text-white;
		font-weight: $font-weight-semibold;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.8);
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(10rpx);
		padding: $spacing-sm $spacing-xl;
		border-radius: $radius-2xl;
	}

	/* 底部操作栏 */
	.action-bar {
		position: absolute;
		bottom: 60rpx;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 0 80rpx;
	}

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-sm;
	}
	
	.action-placeholder {
		width: 100rpx;
		height: 100rpx;
	}
	
	.action-btn {
		width: 100rpx;
		height: 100rpx;
		border-radius: $radius-2xl;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
	}
	
	.album-btn {
		background: rgba(255, 255, 255, 0.9);
		backdrop-filter: blur(20rpx);
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
	}
	
	.album-btn:active {
		transform: scale(0.95);
		background: rgba(255, 255, 255, 1);
	}
	
	.action-icon-img {
		width: 52rpx;
		height: 52rpx;
	}

	.action-label {
		font-size: $font-size-base;
		color: rgba(255, 255, 255, 0.9);
		font-weight: $font-weight-medium;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.5);
	}
	
	.action-label.main {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
	}

	/* 拍照按钮 */
	.capture-btn {
		width: 130rpx;
		height: 130rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	
	.capture-btn:active {
		transform: scale(0.95);
	}
	
	.capture-outer {
		width: 130rpx;
		height: 130rpx;
		border-radius: $radius-round;
		background: rgba(255, 255, 255, 0.2);
		border: 5rpx solid rgba(255, 255, 255, 0.9);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.4);
	}

	.capture-inner {
		width: 96rpx;
		height: 96rpx;
		border-radius: $radius-round;
		background: $gradient-primary;
		box-shadow: $shadow-primary;
	}

	/* 预览容器 */
	.preview-container {
		width: 100%;
		height: 100%;
		display: flex;
		flex-direction: column;
		background: linear-gradient(180deg, #1a1a1a 0%, #000000 100%);
	}
	
	.preview-header {
		padding: 60rpx $spacing-xl $spacing-lg;
		text-align: center;
		background: rgba(0, 0, 0, 0.5);
		backdrop-filter: blur(20rpx);
	}
	
	.preview-title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-white;
		display: block;
		margin-bottom: $spacing-xs;
	}
	
	.preview-subtitle {
		font-size: $font-size-base;
		color: rgba(255, 255, 255, 0.7);
	}
	
	.preview-image-wrapper {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $spacing-xl;
	}

	.preview-image {
		width: 100%;
		max-height: 100%;
		border-radius: $radius-2xl;
		box-shadow: 0 12rpx 48rpx rgba(0, 0, 0, 0.5);
	}

	.preview-actions {
		padding: $spacing-xl;
		background: linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.8) 100%);
		display: flex;
		gap: $spacing-lg;
	}

	.btn-secondary, .btn-primary {
		flex: 1;
		height: 96rpx;
		border-radius: $radius-2xl;
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		transition: all 0.2s;
	}
	
	.btn-icon {
		font-size: $font-size-xl;
	}

	.btn-secondary {
		background: rgba(255, 255, 255, 0.15);
		backdrop-filter: blur(20rpx);
		color: $text-white;
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.btn-secondary:active {
		background: rgba(255, 255, 255, 0.25);
		transform: scale(0.98);
	}

	.btn-primary {
		background: $gradient-primary;
		color: $text-white;
		box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.4);
	}
	
	.btn-primary:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
	}

	/* 加载遮罩 */
	.loading-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.85);
		backdrop-filter: blur(20rpx);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
	}

	.loading-card {
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(248, 249, 255, 0.95) 100%);
		border-radius: 32rpx;
		padding: 60rpx 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.4);
		min-width: 500rpx;
	}

	.loading-spinner {
		width: 120rpx;
		height: 120rpx;
		position: relative;
		margin-bottom: $spacing-xl;
	}
	
	.spinner-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 6rpx solid transparent;
		border-top-color: $primary-color;
		border-radius: $radius-round;
		animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
	}
	
	.spinner-ring:nth-child(1) {
		animation-delay: -0.45s;
	}
	
	.spinner-ring:nth-child(2) {
		animation-delay: -0.3s;
		border-top-color: $primary-light;
	}
	
	.spinner-ring:nth-child(3) {
		animation-delay: -0.15s;
		border-top-color: #95DE64;
	}

	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	
	.loading-title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-sm;
	}

	.loading-text {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-xl;
	}
	
	.loading-progress {
		width: 100%;
		height: 8rpx;
		background: rgba(82, 196, 26, 0.1);
		border-radius: 4rpx;
		overflow: hidden;
	}
	
	.progress-bar {
		height: 100%;
		background: $gradient-primary;
		border-radius: 4rpx;
		animation: progress 1.5s ease-in-out infinite;
	}
	
	@keyframes progress {
		0% {
			width: 0%;
		}
		50% {
			width: 70%;
		}
		100% {
			width: 100%;
		}
	}
</style>
