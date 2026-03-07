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
	background: #F7F8FA;
}

/* 自定义导航栏 */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: #FFFFFF;
	z-index: 1000;
	border-bottom: 1rpx solid #EBEDF0;
}

.navbar-content {
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-lg;
}

.navbar-left {
	width: 80rpx;
	height: 100%;
	display: flex;
	align-items: center;
	justify-content: flex-start;
}

.back-icon {
	font-size: 56rpx;
	color: $text-primary;
	font-weight: $font-weight-light;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
}

.navbar-right {
	width: 80rpx;
}

.container {
	padding: $spacing-lg;
}

/* 输入区域 */
.input-section {
	background: #FFFFFF;
	border-radius: $radius-lg;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
}

.section-title {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	margin-bottom: $spacing-lg;
}

.title-icon-wrapper {
	display: none;
}

.title-icon {
	font-size: 28rpx;
}

.title-text {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary;
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
	background: #F7F8FA;
	border-radius: $radius-md;
	font-size: $font-size-base;
	color: $text-primary;
	line-height: 1.6;
	border: 1rpx solid #EBEDF0;
}

.feedback-input:focus {
	border-color: $primary-color;
	background: #FFFFFF;
}

.char-count {
	text-align: right;
	font-size: $font-size-sm;
	color: $text-tertiary;
	margin-top: $spacing-sm;
}

/* 图片上传区域 */
.upload-section {
	background: #FFFFFF;
	border-radius: $radius-lg;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
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
	border-radius: $radius-md;
	overflow: hidden;
}

.image-preview {
	width: 100%;
	height: 100%;
}

.image-delete {
	position: absolute;
	top: $spacing-sm;
	right: $spacing-sm;
	width: 48rpx;
	height: 48rpx;
	background: rgba(0, 0, 0, 0.6);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
}

.delete-icon {
	font-size: $font-size-base;
	color: $text-white;
}

.upload-btn {
	width: 200rpx;
	height: 200rpx;
	background: #F7F8FA;
	border: 1rpx dashed #DCDEE0;
	border-radius: $radius-md;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: $spacing-sm;
}

.upload-btn:active {
	background: #EBEDF0;
}

.upload-icon {
	font-size: 48rpx;
}

.upload-text {
	font-size: $font-size-sm;
	color: $text-tertiary;
}

/* 提交按钮 */
.submit-button-wrapper {
	margin-top: 60rpx; /* 增加顶部间距，让按钮往下移 */
}

.submit-button {
	width: 100%;
	height: 88rpx;
	background: $primary-color;
	border-radius: 24rpx; /* 增大圆角 */
	display: flex;
	align-items: center;
	justify-content: center;
}

.submit-button:active {
	opacity: 0.8;
}

.submit-button-text {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-white;
}
</style>
