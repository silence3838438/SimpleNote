<template>
	<!-- #ifdef APP-PLUS -->
	<view class="share-modal" v-if="visible" @click="handleClose">
		<view class="share-modal-content" @click.stop>
			<view class="modal-header">
				<text class="modal-title">分享给好友</text>
				<view class="close-btn" @click="handleClose">
					<text class="close-icon">✕</text>
				</view>
			</view>
			
			<view class="share-options">
				<view class="share-item" @click="shareToWechatFriend">
					<image class="share-icon" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/weixinhaoyou.png" mode="aspectFit"></image>
					<text class="share-label">微信好友</text>
				</view>
				
				<view class="share-item" @click="shareToWechatMoments">
					<image class="share-icon" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/weixinpengyouquan.png" mode="aspectFit"></image>
					<text class="share-label">朋友圈</text>
				</view>
			</view>
		</view>
	</view>
	<!-- #endif -->
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	}
})

const emit = defineEmits(['close', 'share'])

const handleClose = () => {
	emit('close')
}

// #ifdef APP-PLUS
const shareToWechatFriend = () => {
	uni.share({
		provider: 'weixin',
		scene: 'WXSceneSession',
		type: 0,
		title: '语音拍照记账，3秒搞定！消费一目了然',
		summary: '钱哪去了 - 轻松管理每一笔',
		href: 'https://api.qiannaqule.top',
		imageUrl: '/static/shareLine.png',
		success: () => {
			emit('share', 'friend')
			handleClose()
		},
		fail: (err) => {
			console.error('分享失败:', err)
		}
	})
}

const shareToWechatMoments = () => {
	uni.share({
		provider: 'weixin',
		scene: 'WXSceneTimeline',
		type: 0,
		title: '钱哪去了 - 语音拍照记账，轻松管理每一笔',
		summary: '语音拍照记账，3秒搞定！消费一目了然',
		href: 'https://api.qiannaqule.top',
		imageUrl: '/static/shareLine.png',
		success: () => {
			emit('share', 'moments')
			handleClose()
		},
		fail: (err) => {
			console.error('分享失败:', err)
		}
	})
}
// #endif
</script>

<style lang="scss" scoped>
.share-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: flex-end;
	justify-content: center;
	z-index: 10000;
	animation: fadeIn 0.3s ease;
}

.share-modal-content {
	width: 100%;
	background: transparent;
	border-radius: 32rpx 32rpx 0 0;
	padding-bottom: env(safe-area-inset-bottom);
	animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-header {
	position: relative;
	padding: 40rpx 32rpx 24rpx;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.1);
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
	border-radius: 32rpx 32rpx 0 0;
}

.modal-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
}

.close-btn {
	position: absolute;
	right: 32rpx;
	top: 50%;
	transform: translateY(-50%);
	width: 56rpx;
	height: 56rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	border-radius: 50%;
	background: #F5F5F5;
	transition: all 0.3s ease;
}

.close-btn:active {
	background: #E8E8E8;
	transform: translateY(-50%) scale(0.9);
}

.close-icon {
	font-size: 32rpx;
	color: #999;
	line-height: 1;
}

.share-options {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 120rpx;
	padding: 80rpx 32rpx 100rpx;
	background: rgba(255, 255, 255, 0.95);
	backdrop-filter: blur(20rpx);
}

.share-item {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 24rpx;
	transition: all 0.3s ease;
}

.share-item:active {
	transform: scale(0.9);
}

/* 小程序分享按钮样式重置 */
.share-button {
	background: transparent;
	border: none;
	padding: 0;
	margin: 0;
	line-height: normal;
}

.share-button::after {
	border: none;
}

.share-icon {
	width: 96rpx;
	height: 96rpx;
	display: block;
}

.share-label {
	font-size: 26rpx;
	color: #666;
	font-weight: 500;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
}

@keyframes slideUp {
	from {
		transform: translateY(100%);
	}
	to {
		transform: translateY(0);
	}
}
</style>
