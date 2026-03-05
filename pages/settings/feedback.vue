<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="navbar-title">意见反馈</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56 + 16) + 'px' }">
			<!-- 输入区域 -->
			<view class="input-section">
				<view class="section-title">
					<view class="title-icon-wrapper feedback-icon">
						<text class="title-icon">💬</text>
					</view>
					<text class="title-text">您的宝贵意见</text>
				</view>
				<textarea 
					class="feedback-input" 
					v-model="data.feedbackContent"
					placeholder="请输入您的意见或建议，我们会认真对待每一条反馈..."
					maxlength="500"
					:auto-height="true"
				></textarea>
				<view class="char-count">{{ data.feedbackContent.length }}/500</view>
			</view>
			
			<!-- 图片上传区域 -->
			<view class="upload-section">
				<view class="section-title">
					<text class="title-icon">📷</text>
					<text class="title-text">上传图片</text>
					<text class="title-tip">（选填，最多3张）</text>
				</view>
				<view class="image-list">
					<!-- 已上传的图片 -->
					<view 
						class="image-item" 
						v-for="(image, index) in data.feedbackImages" 
						:key="index"
					>
						<image class="image-preview" :src="image" mode="aspectFill"></image>
						<view class="image-delete" @click="deleteImage(index)">
							<text class="delete-icon">✕</text>
						</view>
					</view>
					
					<!-- 上传按钮 -->
					<view 
						class="upload-btn" 
						@click="chooseImage" 
						v-if="data.feedbackImages.length < 3"
					>
						<text class="upload-icon">📷</text>
						<text class="upload-text">添加图片</text>
					</view>
				</view>
			</view>
			
			<!-- 提交按钮 -->
			<view class="submit-button-wrapper">
				<view class="submit-button" @click="submitFeedback">
					<text class="submit-button-text">提交反馈</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import request from '@/utils/request.js'

const statusBarHeight = ref(0)

const getSystemInfo = () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 0
}

const goBack = () => {
	uni.navigateBack()
}

getSystemInfo()

const data = reactive({
	feedbackContent: '',
	feedbackImages: []
})

// 选择图片
const chooseImage = () => {
	const remainCount = 3 - data.feedbackImages.length
	
	uni.chooseImage({
		count: remainCount,
		sizeType: ['compressed'],
		sourceType: ['album', 'camera'],
		success: (res) => {
			const tempFilePaths = res.tempFilePaths
			data.feedbackImages.push(...tempFilePaths)
		}
	})
}

// 删除图片
const deleteImage = (index) => {
	data.feedbackImages.splice(index, 1)
}

// 提交意见反馈
const submitFeedback = async () => {
	if (!data.feedbackContent.trim()) {
		uni.showToast({
			title: '请输入反馈内容',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({ title: '提交中...' })
	
	try {
		// 1. 先上传图片（如果有）
		let imageUrls = []
		if (data.feedbackImages.length > 0) {
			uni.showLoading({ title: `上传图片 0/${data.feedbackImages.length}` })
			
			for (let i = 0; i < data.feedbackImages.length; i++) {
				const imagePath = data.feedbackImages[i]
				
				try {
					const uploadResult = await request.uploadFile(imagePath)
					
					if (uploadResult.success) {
						imageUrls.push(uploadResult.url)
						uni.showLoading({ title: `上传图片 ${i + 1}/${data.feedbackImages.length}` })
					} else {
						console.error('图片上传失败:', uploadResult.message)
					}
				} catch (uploadError) {
					console.error('图片上传异常:', uploadError)
				}
			}
		}
		
		// 2. 提交反馈
		uni.showLoading({ title: '提交中...' })
		
		const res = await request.call('auth/feedback/submit', {
			content: data.feedbackContent.trim(),
			images: imageUrls
		})
		
		if (res.success) {
			uni.hideLoading()
			uni.showModal({
				title: '提交成功',
				content: '感谢您的反馈，我们会认真对待！',
				showCancel: false,
				confirmText: '知道了',
				success: () => {
					uni.navigateBack()
				}
			})
		} else {
			throw new Error(res.message || '提交失败')
		}
	} catch (error) {
		uni.hideLoading()
		console.error('提交反馈失败:', error)
		uni.showToast({
			title: error.message || '提交失败，请重试',
			icon: 'none'
		})
	}
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	min-height: 100vh;
	background: linear-gradient(180deg, #F5F7FA 0%, #E8EBF0 50%, #F5F7FA 100%);
	position: relative;
}

.page::before {
	content: '';
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-image: 
		radial-gradient(circle at 20% 30%, rgba(82, 196, 26, 0.03) 0%, transparent 50%),
		radial-gradient(circle at 80% 70%, rgba(115, 209, 61, 0.03) 0%, transparent 50%);
	pointer-events: none;
	z-index: 0;
}

/* 自定义导航栏 */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: saturate(180%) blur(20rpx);
	z-index: 1000;
	border-bottom: 1rpx solid rgba(0, 0, 0, 0.06);
	box-shadow: 0 2rpx 16rpx rgba(0, 0, 0, 0.04);
}

.navbar-content {
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-lg;
}

.navbar-left {
	min-width: 120rpx;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-start;
	padding-right: 20rpx;
}

.back-icon {
	font-size: 56rpx;
	color: $text-primary;
	font-weight: $font-weight-light;
	transition: all $transition-fast;
}

.navbar-left:active .back-icon {
	opacity: 0.6;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
	letter-spacing: 0.5rpx;
}

.navbar-right {
	width: 80rpx;
}

.container {
	padding: $spacing-lg;
	position: relative;
	z-index: 1;
}

/* 输入区域 */
.input-section {
	background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
	border-radius: $radius-xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	box-shadow: 
		0 2rpx 8rpx rgba(0, 0, 0, 0.04),
		0 8rpx 24rpx rgba(0, 0, 0, 0.06),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
	border: 1rpx solid rgba(255, 255, 255, 0.8);
	position: relative;
	overflow: hidden;
}

.input-section::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, rgba(82, 196, 26, 0.15), transparent);
}

.section-title {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	margin-bottom: $spacing-lg;
}

.title-icon-wrapper {
	width: 64rpx;
	height: 64rpx;
	border-radius: $radius-md;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 
		0 4rpx 12rpx rgba(82, 196, 26, 0.2),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	flex-shrink: 0;
	position: relative;
}

.feedback-icon {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.feedback-icon::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 100%);
	border-radius: $radius-md;
}

.title-icon {
	font-size: 32rpx;
	position: relative;
	z-index: 1;
}

.title-text {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-primary;
	letter-spacing: 0.5rpx;
}

.title-tip {
	font-size: $font-size-sm;
	color: $text-tertiary;
	margin-left: auto;
}

.feedback-input {
	width: 100%;
	min-height: 300rpx;
	padding: $spacing-lg;
	background: linear-gradient(135deg, #F8F9FA 0%, #F5F6F8 100%);
	border-radius: $radius-lg;
	font-size: $font-size-lg;
	color: $text-primary;
	line-height: 1.8;
	border: 2rpx solid rgba(0, 0, 0, 0.04);
	transition: all $transition-fast;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.02);
}

.feedback-input:focus {
	border-color: rgba(82, 196, 26, 0.4);
	background: #FFFFFF;
	box-shadow: 
		inset 0 2rpx 4rpx rgba(0, 0, 0, 0.02),
		0 0 0 4rpx rgba(82, 196, 26, 0.08);
}

.char-count {
	text-align: right;
	font-size: $font-size-sm;
	color: $text-tertiary;
	margin-top: $spacing-sm;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

/* 图片上传区域 */
.upload-section {
	background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
	border-radius: $radius-xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	box-shadow: 
		0 2rpx 8rpx rgba(0, 0, 0, 0.04),
		0 8rpx 24rpx rgba(0, 0, 0, 0.06),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
	border: 1rpx solid rgba(255, 255, 255, 0.8);
	position: relative;
	overflow: hidden;
}

.upload-section::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	height: 1rpx;
	background: linear-gradient(90deg, transparent, rgba(82, 196, 26, 0.15), transparent);
}

.image-list {
	display: flex;
	flex-wrap: wrap;
	gap: $spacing-lg;
}

.image-item {
	width: 200rpx;
	height: 200rpx;
	position: relative;
	border-radius: $radius-lg;
	overflow: hidden;
	box-shadow: 
		0 4rpx 12rpx rgba(0, 0, 0, 0.08),
		inset 0 0 0 1rpx rgba(255, 255, 255, 0.2);
}

.image-preview {
	width: 100%;
	height: 100%;
	border-radius: $radius-lg;
}

.image-delete {
	position: absolute;
	top: $spacing-sm;
	right: $spacing-sm;
	width: 48rpx;
	height: 48rpx;
	background: rgba(0, 0, 0, 0.75);
	backdrop-filter: saturate(180%) blur(20rpx);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all $transition-fast;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
}

.image-delete:active {
	transform: scale(0.9);
	background: rgba(0, 0, 0, 0.85);
}

.delete-icon {
	font-size: $font-size-lg;
	color: $text-white;
	font-weight: bold;
}

.upload-btn {
	width: 200rpx;
	height: 200rpx;
	background: linear-gradient(135deg, #F8F9FA 0%, #F5F6F8 100%);
	border: 2rpx dashed rgba(0, 0, 0, 0.1);
	border-radius: $radius-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: $spacing-sm;
	transition: all $transition-fast;
	position: relative;
	overflow: hidden;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.02);
}

.upload-btn::before {
	content: '';
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: linear-gradient(135deg, rgba(82, 196, 26, 0.05) 0%, rgba(115, 209, 61, 0.05) 100%);
	opacity: 0;
	transition: opacity $transition-fast;
}

.upload-btn:active {
	transform: scale(0.96);
	border-color: rgba(82, 196, 26, 0.4);
}

.upload-btn:active::before {
	opacity: 1;
}

.upload-icon {
	font-size: 64rpx;
	transition: transform $transition-fast;
}

.upload-btn:active .upload-icon {
	transform: scale(1.1);
}

.upload-text {
	font-size: $font-size-base;
	color: $text-tertiary;
	font-weight: 500;
}

/* 提交按钮 */
.submit-button-wrapper {
	margin-top: $spacing-2xl;
}

.submit-button {
	width: 100%;
	height: 96rpx;
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	border-radius: 28rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 
		0 8rpx 24rpx rgba(82, 196, 26, 0.3),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
	transition: all $transition-fast;
	position: relative;
	overflow: hidden;
}

.submit-button::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
	transition: left 0.6s;
}

.submit-button:active::before {
	left: 100%;
}

.submit-button:active {
	transform: scale(0.98);
	box-shadow: 
		0 4rpx 16rpx rgba(82, 196, 26, 0.3),
		inset 0 1rpx 0 rgba(255, 255, 255, 0.3);
}

.submit-button-text {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-white;
	letter-spacing: 2rpx;
	text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.1);
}
</style>
