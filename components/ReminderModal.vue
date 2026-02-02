<template>
	<view class="reminder-modal" v-if="show" @click="handleCancel">
		<view class="modal-content" @click.stop>
			<!-- 顶部装饰 -->
			<view class="modal-header">
				<view class="icon-wrapper">
					<text class="icon">💰</text>
					<view class="icon-glow"></view>
				</view>
			</view>
			
			<!-- 内容 -->
			<view class="modal-body">
				<text class="modal-title">记账提醒</text>
				<text class="modal-desc">今天还没记账哦~</text>
				<text class="modal-tip">养成每天记账的好习惯，让收支更清晰！</text>
			</view>
			
			<!-- 按钮 -->
			<view class="modal-footer">
				<view class="btn btn-cancel" @click="handleCancel">
					<text class="btn-text">稍后</text>
				</view>
				<view class="btn btn-confirm" @click="handleConfirm">
					<text class="btn-text">去记账</text>
					<text class="btn-icon">→</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref } from 'vue'

const show = ref(false)

const emit = defineEmits(['confirm', 'cancel'])

const showModal = () => {
	show.value = true
}

const hideModal = () => {
	show.value = false
}

const handleConfirm = () => {
	hideModal()
	emit('confirm')
}

const handleCancel = () => {
	hideModal()
	emit('cancel')
}

defineExpose({
	showModal,
	hideModal
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.reminder-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 99999;
	animation: fadeIn 0.3s ease;
	backdrop-filter: blur(8rpx);
	padding: 0 60rpx;
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
	max-width: 600rpx;
	background: $bg-white;
	border-radius: $radius-3xl;
	overflow: hidden;
	animation: scaleIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
}

@keyframes scaleIn {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

.modal-header {
	padding: 60rpx 0 40rpx;
	display: flex;
	justify-content: center;
	background: linear-gradient(180deg, #F0FFF4 0%, #FFFFFF 100%);
	position: relative;
	overflow: hidden;
}

.modal-header::before {
	content: '';
	position: absolute;
	top: -50%;
	left: -50%;
	width: 200%;
	height: 200%;
	background: radial-gradient(circle, rgba(82, 196, 26, 0.1) 0%, transparent 70%);
	animation: rotate 20s linear infinite;
}

@keyframes rotate {
	from {
		transform: rotate(0deg);
	}
	to {
		transform: rotate(360deg);
	}
}

.icon-wrapper {
	position: relative;
	z-index: 1;
}

.icon {
	font-size: 120rpx;
	display: block;
	animation: bounce 2s ease-in-out infinite;
}

@keyframes bounce {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-10rpx);
	}
}

.icon-glow {
	position: absolute;
	top: 50%;
	left: 50%;
	width: 160rpx;
	height: 160rpx;
	background: radial-gradient(circle, rgba(82, 196, 26, 0.3) 0%, transparent 70%);
	border-radius: 50%;
	transform: translate(-50%, -50%);
	animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
	0%, 100% {
		transform: translate(-50%, -50%) scale(1);
		opacity: 0.5;
	}
	50% {
		transform: translate(-50%, -50%) scale(1.2);
		opacity: 0.8;
	}
}

.modal-body {
	padding: 40rpx 48rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-md;
}

.modal-title {
	font-size: 44rpx;
	font-weight: $font-weight-bold;
	color: $text-primary;
	text-align: center;
}

.modal-desc {
	font-size: $font-size-xl;
	color: $text-secondary;
	text-align: center;
	margin-top: $spacing-xs;
}

.modal-tip {
	font-size: $font-size-base;
	color: $text-tertiary;
	text-align: center;
	line-height: 1.6;
	margin-top: $spacing-sm;
}

.modal-footer {
	display: flex;
	gap: $spacing-md;
	padding: 0 48rpx 48rpx;
}

.btn {
	flex: 1;
	height: 88rpx;
	border-radius: $radius-2xl;
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-xs;
	transition: all $transition-fast;
	position: relative;
	overflow: hidden;
}

.btn::before {
	content: '';
	position: absolute;
	top: 50%;
	left: 50%;
	width: 0;
	height: 0;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.3);
	transform: translate(-50%, -50%);
	transition: all 0.5s ease;
}

.btn:active::before {
	width: 200%;
	height: 200%;
}

.btn-cancel {
	background: $bg-light;
	border: 2rpx solid $border-light;
}

.btn-cancel:active {
	transform: scale(0.96);
	background: #E8E8E8;
}

.btn-cancel .btn-text {
	color: $text-secondary;
	font-size: $font-size-lg;
	font-weight: $font-weight-medium;
}

.btn-confirm {
	background: $gradient-primary;
	box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.4);
}

.btn-confirm:active {
	transform: scale(0.96);
	box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
}

.btn-confirm .btn-text {
	color: $text-white;
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
}

.btn-icon {
	color: $text-white;
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	animation: arrow-move 1.5s ease-in-out infinite;
}

@keyframes arrow-move {
	0%, 100% {
		transform: translateX(0);
	}
	50% {
		transform: translateX(6rpx);
	}
}
</style>
