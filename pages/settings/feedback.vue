<template>
	<view class="page">
		<view class="container">
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
import { reactive } from 'vue'
import request from '@/utils/request.js'

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
	background: $bg-page;
}

.container {
	padding: $spacing-lg;
}

/* 输入区域 */
.input-section {
	background: $bg-white;
	border-radius: $radius-xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	box-shadow: $shadow-card;
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
	box-shadow: $shadow-sm;
	flex-shrink: 0;
}

.feedback-icon {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
}

.title-icon {
	font-size: 32rpx;
}

.title-icon-img {
	width: 40rpx;
	height: 40rpx;
	margin-right: 12rpx;
}

.title-text {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
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
	background: $bg-light;
	border-radius: $radius-lg;
	font-size: $font-size-lg;
	color: $text-primary;
	line-height: 1.6;
	border: 2rpx solid transparent;
	transition: all $transition-fast;
}

.feedback-input:focus {
	border-color: $primary-color;
	background: $bg-white;
}

.char-count {
	text-align: right;
	font-size: $font-size-sm;
	color: $text-tertiary;
	margin-top: $spacing-sm;
}

/* 图片上传区域 */
.upload-section {
	background: $bg-white;
	border-radius: $radius-xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	box-shadow: $shadow-card;
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
}

.image-preview {
	width: 100%;
	height: 100%;
	border-radius: $radius-lg;
	border: 2rpx solid $border-light;
}

.image-delete {
	position: absolute;
	top: $spacing-sm;
	right: $spacing-sm;
	width: 48rpx;
	height: 48rpx;
	background: rgba(0, 0, 0, 0.7);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	backdrop-filter: blur(10rpx);
	transition: all $transition-fast;
}

.image-delete:active {
	transform: scale(0.9);
}

.delete-icon {
	font-size: $font-size-lg;
	color: $text-white;
	font-weight: bold;
}

.upload-btn {
	width: 200rpx;
	height: 200rpx;
	background: $bg-light;
	border: 2rpx dashed $border-color;
	border-radius: $radius-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	gap: $spacing-sm;
	transition: all $transition-fast;
}

.upload-btn:active {
	transform: scale(0.95);
	background: #E8E8E8;
	border-color: $primary-color;
}

.upload-icon {
	font-size: 64rpx;
}

.upload-text {
	font-size: $font-size-base;
	color: $text-tertiary;
}

/* 提交按钮 */
.submit-button-wrapper {
	margin-top: $spacing-2xl;
}

.submit-button {
	width: 100%;
	height: 96rpx;
	background: $gradient-primary;
	border-radius: $radius-xl;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-primary;
	transition: all $transition-fast;
}

.submit-button:active {
	transform: scale(0.98);
	box-shadow: $shadow-sm;
}

.submit-button-text {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-white;
}
</style>
