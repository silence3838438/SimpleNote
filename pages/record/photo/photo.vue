<template>
	<view class="container">
		<!-- 相机预览区域 -->
		<view class="camera-container">
			<!-- #ifdef MP-WEIXIN -->
			<!-- 小程序端使用camera组件 -->
			<view class="camera-placeholder" v-if="!data.cameraReady">
				<view class="placeholder-content">
					<view class="placeholder-icon">📷</view>
					<text class="placeholder-text">正在启动相机...</text>
				</view>
			</view>
			
			<camera 
				v-if="data.cameraReady"
				device-position="back" 
				flash="off" 
				class="camera" 
				@error="onCameraError"
			>
				<!-- 顶部提示区域 -->
				<view class="top-tips">
					<view class="tip-card">
						<text class="tip-icon">💡</text>
						<view class="tip-content">
							<text class="tip-title">智能识别小票</text>
							<text class="tip-desc">拍照后自动识别，长小票可拍摄关键部分</text>
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
							<image class="action-icon-img" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/xiangce.png" mode="aspectFit"></image>
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
			<!-- #endif -->
			
			<!-- #ifdef APP-PLUS -->
			<!-- APP端使用简化界面，直接调用系统相机 -->
			<view class="app-camera-placeholder">
				<view class="placeholder-content">
					<view class="placeholder-icon">📷</view>
					<text class="placeholder-title">拍照记账</text>
					<text class="placeholder-desc">拍照后自动识别小票信息</text>
				</view>
				
				<!-- 底部操作栏 -->
				<view class="action-bar">
					<view class="action-item" @click="chooseImage">
						<view class="action-btn album-btn">
							<image class="action-icon-img" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/xiangce.png" mode="aspectFit"></image>
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
			</view>
			<!-- #endif -->
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
import { onReady, onShow, onLoad } from '@dcloudio/uni-app'
import request from '@/utils/request.js'
import cloudbaseAI from '@/utils/cloudbaseAI.js'

const data = reactive({
	imageUrl: '',
	recognizing: false,
	cameraContext: null,
	lastRecognizeTime: 0,
	cameraReady: false // 相机是否准备好
})

// 检查登录状态
onLoad(() => {
	// #ifdef APP-PLUS
	// APP端：检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		uni.showModal({
			title: '提示',
			content: '请先登录后再使用拍照记账功能',
			confirmText: '去登录',
			cancelText: '返回',
			success: (res) => {
				if (res.confirm) {
					uni.navigateTo({ url: '/pages/user/login' })
				} else {
					uni.navigateBack()
				}
			}
		})
		return
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端：已自动登录，无需检查
	// #endif
})

onShow(() => {
	// #ifdef MP-WEIXIN
	// 小程序端延迟加载相机，避免阻塞页面渲染
	setTimeout(() => {
		data.cameraReady = true
	}, 100)
	// #endif
	
	// #ifdef APP-PLUS
	// APP端直接准备好
	data.cameraReady = true
	// #endif
})

onReady(() => {
	// #ifdef MP-WEIXIN
	// 延迟创建相机上下文，等相机组件渲染完成
	setTimeout(() => {
		data.cameraContext = uni.createCameraContext()
	}, 200)
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
		quality: 'normal', // 改为 normal，减少文件大小
		success: (res) => {
			// 压缩图片
			compressImage(res.tempImagePath)
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
			compressImage(res.tempFilePaths[0])
		}
	})
	// #endif
}

const chooseImage = () => {
	uni.chooseImage({
		count: 1,
		sourceType: ['album'],
		success: (res) => {
			compressImage(res.tempFilePaths[0])
		}
	})
}

// 压缩图片并立即识别
const compressImage = async (imagePath) => {
	try {
		// 压缩图片（quality: 70，在识别准确率和文件大小间取得平衡）
		const compressRes = await uni.compressImage({
			src: imagePath,
			quality: 70
		})
		console.log('图片压缩成功')
		
		// 立即跳转到确认页面并开始识别
		await recognizeAndNavigate(compressRes.tempFilePath)
	} catch (error) {
		console.log('图片压缩失败，使用原图')
		// 压缩失败，使用原图
		await recognizeAndNavigate(imagePath)
	}
}

const retake = () => {
	data.imageUrl = ''
}

// 识别并跳转到确认页面
const recognizeAndNavigate = async (imagePath) => {
	// 先跳转到确认页面，显示加载状态
	uni.navigateTo({
		url: `/pages/record/confirm/confirm?loading=true`
	})
	
	try {
		// 后台识别
		const result = await callOCRCloudFunction(imagePath)
		
		// 识别成功，通知确认页面更新数据
		uni.$emit('ocrRecognized', result)
	} catch (error) {
		console.error('识别失败:', error)
		
		// 识别失败，通知确认页面显示空数据
		const emptyData = {
			amount: 0,
			merchant: '',
			date: new Date().toISOString().split('T')[0],
			categoryId: null,
			categoryName: '',
			type: 'expense',
			error: error.message || '识别失败'
		}
		uni.$emit('ocrRecognized', emptyData)
	}
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
		// 调用真实的OCR识别接口(小程序和APP都使用)
		const result = await callOCRCloudFunction()
		
		data.recognizing = false
		
		// 跳转到确认页面
		uni.navigateTo({
			url: `/pages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(result))}`
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
						url: `/pages/record/confirm/confirm?data=${encodeURIComponent(JSON.stringify(emptyData))}`
					})
				} else {
					retake()
				}
			}
		})
	}
}

const callOCRCloudFunction = async (imagePath) => {
	const startTime = Date.now()
	console.log('⏱️ [拍照识别] 开始时间:', new Date().toLocaleTimeString())
	
	// 直接读取图片转base64,不上传
	const base64StartTime = Date.now()
	const imageBase64 = await getImageBase64(imagePath)
	const base64EndTime = Date.now()
	console.log('⏱️ [拍照识别] 图片转base64耗时:', base64EndTime - base64StartTime, 'ms')
	
	if (!imageBase64) {
		throw new Error('图片读取失败')
	}
	
	console.log('图片base64长度:', imageBase64.length)
	
	// 调用OCR识别接口
	const ocrStartTime = Date.now()
	const ocrRes = await request.call('ocrRecognize', {
		imageBase64: imageBase64
	})
	const ocrEndTime = Date.now()
	console.log('⏱️ [拍照识别] OCR识别耗时:', ocrEndTime - ocrStartTime, 'ms')
	console.log('OCR识别返回:', ocrRes)
	
	// 如果OCR识别失败，抛出错误
	if (!ocrRes || !ocrRes.success) {
		const errorMsg = ocrRes?.error || 'OCR识别失败'
		throw new Error(errorMsg)
	}
	
	// 第三步：先返回快速解析结果，智能判断是否需要AI增强
	const ocrText = ocrRes.text || ''
	const quickResult = ocrRes.data
	
	// 如果OCR文本为空，直接使用原始结果
	if (!ocrText || ocrText.trim() === '') {
		console.log('OCR识别文本为空，直接使用原始结果')
		const totalTime = Date.now() - startTime
		console.log('⏱️ [拍照识别] 总耗时:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), '秒)')
		return quickResult
	}
	
	const quickTime = Date.now() - startTime
	console.log('⏱️ [拍照识别] 快速解析完成:', quickTime, 'ms (', (quickTime / 1000).toFixed(2), '秒)')
	console.log('📦 快速解析结果:', quickResult)
	
	// 智能判断是否需要AI增强（节省token）
	const needAI = shouldUseAI(quickResult, ocrText)
	
	if (needAI) {
		console.log('🤖 [AI策略] 识别质量较低，启动AI增强')
		// 【修改】等待 AI 增强完成后再返回结果（避免显示错误数据）
		try {
			const aiResult = await enhanceWithAI(ocrText, startTime, quickResult)
			console.log('✅ [AI策略] AI增强完成，返回最终结果')
			return aiResult
		} catch (err) {
			console.log('⚠️ AI 增强失败，返回快速解析结果:', err.message)
			return quickResult
		}
	} else {
		console.log('✅ [AI策略] 识别质量良好，跳过AI增强（节省token）')
		return quickResult
	}
}

// 读取图片转base64
const getImageBase64 = (imagePath) => {
	return new Promise((resolve, reject) => {
		// #ifdef MP-WEIXIN
		// 小程序端使用 getFileSystemManager
		uni.getFileSystemManager().readFile({
			filePath: imagePath,
			encoding: 'base64',
			success: (res) => {
				resolve(res.data)
			},
			fail: (err) => {
				console.error('❌ 小程序读取图片失败:', err)
				reject(err)
			}
		})
		// #endif
		
		// #ifdef APP-PLUS
		// APP端使用 plus.io 读取文件
		plus.io.resolveLocalFileSystemURL(imagePath, (entry) => {
			entry.file((file) => {
				const reader = new plus.io.FileReader()
				reader.onloadend = (e) => {
					// 移除 data:image/xxx;base64, 前缀
					const base64 = e.target.result.split(',')[1]
					resolve(base64)
				}
				reader.onerror = (err) => {
					console.error('❌ APP读取图片失败:', err)
					reject(err)
				}
				reader.readAsDataURL(file)
			}, (err) => {
				console.error('❌ APP获取文件失败:', err)
				reject(err)
			})
		}, (err) => {
			console.error('❌ APP解析文件路径失败:', err)
			reject(err)
		})
		// #endif
	})
}

// AI 增强识别（后台异步执行）
const enhanceWithAI = async (ocrText, startTime, quickResult) => {
	const aiStartTime = Date.now()
	console.log('⏱️ [AI增强] 开始后台增强识别')
	console.log('📋 后端快速解析结果:', quickResult)
	
	try {
		// 调用腾讯云 Cloudbase AI 增强接口（传入后端已提取的信息）
		console.log('⏱️ [AI增强] 调用 Cloudbase AI 进行语义增强...')
		
		const aiResult = await cloudbaseAI.enhanceOCR(ocrText, quickResult)
		
		const aiEndTime = Date.now()
		const totalTime = Date.now() - startTime
		console.log('⏱️ [AI增强] AI识别耗时:', aiEndTime - aiStartTime, 'ms')
		console.log('⏱️ [AI增强] 总耗时:', totalTime, 'ms (', (totalTime / 1000).toFixed(2), '秒)')
		console.log('🎯 AI增强结果:', aiResult)
		
		return aiResult
		
	} catch (error) {
		const aiEndTime = Date.now()
		console.error('⚠️ [AI增强] 失败:', error.message, '耗时:', aiEndTime - aiStartTime, 'ms')
		// AI失败返回后端原始数据
		return quickResult
	}
}

/**
 * 智能判断是否需要AI增强（节省token策略）
 * @param {Object} quickResult - OCR快速解析结果
 * @param {String} ocrText - OCR原始文本
 * @returns {Boolean} 是否需要AI增强
 */
const shouldUseAI = (quickResult, ocrText) => {
	// 【修改】金额识别很复杂，始终启用AI来确保准确性
	console.log('💡 [AI策略] 金额识别复杂，启用AI确保准确性');
	return true;
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
	
	/* 相机占位界面 */
	.camera-placeholder {
		width: 100%;
		height: 100%;
		background: #000000;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	/* APP端相机占位界面 */
	.app-camera-placeholder {
		width: 100%;
		height: 100%;
		background: linear-gradient(180deg, #52C41A 0%, #73D13D 50%, #95DE64 100%);
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: space-between;
		position: relative;
		overflow: hidden;
	}
	
	/* 添加装饰元素 - 圆形光晕 */
	.app-camera-placeholder::before {
		content: '';
		position: absolute;
		width: 800rpx;
		height: 800rpx;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.2) 0%, transparent 70%);
		border-radius: 50%;
		top: -300rpx;
		right: -200rpx;
		animation: float 6s ease-in-out infinite;
	}
	
	.app-camera-placeholder::after {
		content: '';
		position: absolute;
		width: 600rpx;
		height: 600rpx;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		border-radius: 50%;
		bottom: -200rpx;
		left: -150rpx;
		animation: float 8s ease-in-out infinite reverse;
	}
	
	@keyframes float {
		0%, 100% {
			transform: translate(0, 0) scale(1);
		}
		50% {
			transform: translate(30rpx, -30rpx) scale(1.1);
		}
	}
	
	.placeholder-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xl;
		z-index: 1;
		padding: 0 $spacing-2xl;
		flex: 1;
		justify-content: center;
		padding-bottom: 280rpx;
	}
	
	.placeholder-icon {
		font-size: 160rpx;
		filter: drop-shadow(0 8rpx 24rpx rgba(0, 0, 0, 0.15));
		animation: pulse-icon 2s ease-in-out infinite;
	}
	
	@keyframes pulse-icon {
		0%, 100% {
			transform: scale(1);
			filter: drop-shadow(0 8rpx 24rpx rgba(0, 0, 0, 0.15));
		}
		50% {
			transform: scale(1.08);
			filter: drop-shadow(0 12rpx 32rpx rgba(0, 0, 0, 0.2));
		}
	}
	
	.placeholder-title {
		font-size: 56rpx;
		color: $text-white;
		font-weight: $font-weight-bold;
		text-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.15);
		letter-spacing: 2rpx;
	}
	
	.placeholder-text {
		font-size: $font-size-lg;
		color: rgba(255, 255, 255, 0.8);
		font-weight: $font-weight-medium;
	}
	
	.placeholder-desc {
		font-size: $font-size-lg;
		color: rgba(255, 255, 255, 0.85);
		text-align: center;
		padding: 0 $spacing-3xl;
		line-height: 1.8;
		background: rgba(255, 255, 255, 0.1);
		backdrop-filter: blur(10rpx);
		border-radius: $radius-2xl;
		padding: $spacing-lg $spacing-2xl;
		border: 1rpx solid rgba(255, 255, 255, 0.2);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.1);
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
		bottom: 50rpx;
		left: 0;
		right: 0;
		display: flex;
		justify-content: space-around;
		align-items: center;
		padding: 0 80rpx;
		z-index: 2;
	}

	.action-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-md;
	}
	
	.action-placeholder {
		width: 100rpx;
		height: 100rpx;
	}
	
	.action-btn {
		width: 110rpx;
		height: 110rpx;
		border-radius: $radius-2xl;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.3s;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.2);
	}
	
	.album-btn {
		background: rgba(255, 255, 255, 0.95);
		backdrop-filter: blur(20rpx);
		border: 2rpx solid rgba(255, 255, 255, 0.5);
	}
	
	.album-btn:active {
		transform: scale(0.92);
		background: rgba(255, 255, 255, 1);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.25);
	}
	
	.action-icon-img {
		width: 56rpx;
		height: 56rpx;
	}

	.action-label {
		font-size: $font-size-lg;
		color: $text-white;
		font-weight: $font-weight-semibold;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	}
	
	.action-label.main {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
	}

	/* 拍照按钮 */
	.capture-btn {
		width: 140rpx;
		height: 140rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	
	.capture-btn:active {
		transform: scale(0.92);
	}
	
	.capture-outer {
		width: 140rpx;
		height: 140rpx;
		border-radius: $radius-round;
		background: rgba(255, 255, 255, 0.25);
		border: 6rpx solid rgba(255, 255, 255, 0.95);
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.3);
		backdrop-filter: blur(10rpx);
	}

	.capture-inner {
		width: 104rpx;
		height: 104rpx;
		border-radius: $radius-round;
		background: linear-gradient(135deg, #FFFFFF 0%, rgba(255, 255, 255, 0.9) 100%);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.2);
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
		border-radius: 48rpx;
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
