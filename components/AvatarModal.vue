<template>
	<view class="avatar-modal" v-if="visible" @click="handleClose">
		<view class="modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">更换头像</text>
				<view class="close-btn" @click="handleClose">
					<text class="close-icon">✕</text>
				</view>
			</view>
			
			<view class="modal-body">
				<view class="option-item" @click="handleChooseFromAlbum">
					<view class="option-icon album-icon">
						<text class="icon-text">🖼️</text>
					</view>
					<view class="option-info">
						<text class="option-title">从相册选择</text>
						<text class="option-desc">选择已有照片作为头像</text>
					</view>
					<text class="arrow">›</text>
				</view>
				
				<view class="option-item" @click="handleTakePhoto">
					<view class="option-icon camera-icon">
						<text class="icon-text">📷</text>
					</view>
					<view class="option-info">
						<text class="option-title">拍照</text>
						<text class="option-desc">使用相机拍摄新照片</text>
					</view>
					<text class="arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['close', 'chooseFromAlbum', 'takePhoto'])

const handleClose = () => {
	emit('close')
}

const handleChooseFromAlbum = () => {
	emit('chooseFromAlbum')
}

const handleTakePhoto = () => {
	emit('takePhoto')
}
</script>

<style scoped lang="scss">
.avatar-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 9999;
	animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

.modal-content {
	width: 100%;
	background: #FFFFFF;
	border-radius: 24rpx 24rpx 0 0;
	padding-bottom: env(safe-area-inset-bottom);
	animation: slideUp 0.3s ease;
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}

.modal-header {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 40rpx 40rpx 20rpx;
	border-bottom: 1rpx solid #F0F0F0;
	position: relative;
}

.modal-title {
	font-size: 36rpx;
	font-weight: 600;
	color: #333333;
}

.close-btn {
	position: absolute;
	right: 40rpx;
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F5F5F5;
	border-radius: 50%;
	transition: all 0.3s;
}

.close-btn:active {
	background: #E8E8E8;
	transform: scale(0.95);
}

.close-icon {
	font-size: 32rpx;
	color: #666666;
}

.modal-body {
	padding: 20rpx 40rpx 40rpx;
}

.option-item {
	display: flex;
	align-items: center;
	padding: 32rpx 24rpx;
	background: #F8F9FA;
	border-radius: 16rpx;
	margin-top: 20rpx;
	transition: all 0.3s;
}

.option-item:active {
	background: #F0F1F3;
	transform: scale(0.98);
}

.option-icon {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-right: 24rpx;
	flex-shrink: 0;
}

.album-icon {
	background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.camera-icon {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.icon-text {
	font-size: 44rpx;
}

.option-info {
	flex: 1;
	display: flex;
	flex-direction: column;
}

.option-title {
	font-size: 32rpx;
	font-weight: 500;
	color: #333333;
	margin-bottom: 8rpx;
}

.option-desc {
	font-size: 24rpx;
	color: #999999;
}

.arrow {
	font-size: 48rpx;
	color: #CCCCCC;
	margin-left: 16rpx;
}
</style>
