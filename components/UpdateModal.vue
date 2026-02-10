<template>
	<view class="update-modal" v-if="visible" @click="handleMaskClick">
		<view class="modal-content" @click.stop :class="{ 'shake': showShake }">
			<!-- 顶部图标 -->
			<view class="modal-header">
				<view class="update-icon">
					<text class="icon-text">🎉</text>
					<view class="icon-badge" v-if="isForce">
						<text class="badge-text">必须</text>
					</view>
				</view>
				<text class="modal-title">发现新版本</text>
				<text class="version-text">v{{ newVersion }}</text>
			</view>
			
			<!-- 更新内容 -->
			<view class="modal-body">
				<scroll-view class="update-content" scroll-y>
					<view class="update-item" v-for="(item, index) in updateContent" :key="index">
						<view class="item-dot"></view>
						<text class="item-text">{{ item }}</text>
					</view>
				</scroll-view>
				
				<!-- 更新大小和时间 -->
				<view class="update-info">
					<text class="info-text">📦 {{ packageSize }}</text>
					<text class="info-divider">|</text>
					<text class="info-text">🕐 {{ updateTime }}</text>
				</view>
			</view>
			
			<!-- 下载进度条 -->
			<view class="progress-container" v-if="isDownloading">
				<view class="progress-bar">
					<view class="progress-fill" :style="{ width: downloadProgress }"></view>
				</view>
				<text class="progress-text">{{ downloadProgress }} 下载中...</text>
			</view>
			
			<!-- 底部按钮 -->
			<view class="modal-footer">
				<view class="btn-cancel" v-if="!isForce && !isDownloading" @click="handleCancel">
					<text class="btn-text-cancel">稍后更新</text>
				</view>
				<view 
					class="btn-confirm" 
					:class="{ 'btn-full': isForce || isDownloading, 'btn-disabled': isDownloading }" 
					@click="handleConfirm"
				>
					<text class="btn-text-confirm">{{ confirmButtonText }}</text>
				</view>
			</view>
			
			<!-- 强制更新提示 -->
			<view class="force-tip" v-if="isForce">
				<text class="force-tip-text">⚠️ 此版本为强制更新，必须升级后才能继续使用</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
	visible: {
		type: Boolean,
		default: false
	},
	newVersion: {
		type: String,
		default: '1.0.1'
	},
	currentVersion: {
		type: String,
		default: '1.0.0'
	},
	updateContent: {
		type: Array,
		default: () => [
			'优化用户体验，提升应用性能',
			'修复已知问题，增强稳定性',
			'新增更多实用功能'
		]
	},
	packageSize: {
		type: String,
		default: '15.8MB'
	},
	updateTime: {
		type: String,
		default: '2026-02-06'
	},
	downloadUrl: {
		type: String,
		default: ''
	},
	isForce: {
		type: Boolean,
		default: false
	},
	updateType: {
		type: String,
		default: 'server' // server: 服务器下载, market: 应用市场
	},
	markets: {
		type: Object,
		default: () => ({})
	}
})

const emit = defineEmits(['cancel', 'confirm', 'downloadComplete'])

const isDownloading = ref(false)
const downloadProgress = ref('0%')
const showShake = ref(false)

// 按钮文字
const confirmButtonText = computed(() => {
	if (isDownloading.value) {
		return '下载中...'
	}
	return '立即更新'
})

// 处理遮罩点击
const handleMaskClick = () => {
	if (!props.isForce && !isDownloading.value) {
		emit('cancel')
	} else if (props.isForce) {
		// 强制更新时点击遮罩，弹窗抖动提示
		triggerShake()
	}
}

// 触发抖动动画
const triggerShake = () => {
	showShake.value = true
	setTimeout(() => {
		showShake.value = false
	}, 500)
}

// 取消更新
const handleCancel = () => {
	if (!isDownloading.value) {
		emit('cancel')
	}
}

// 确认更新
const handleConfirm = () => {
	if (isDownloading.value) return
	
	// #ifdef APP-PLUS
	// 判断更新方式
	if (props.updateType === 'market') {
		// 应用市场更新
		jumpToMarket()
	} else {
		// 服务器下载更新
		startDownload()
	}
	// #endif
	
	// #ifndef APP-PLUS
	uni.showToast({
		title: '仅支持APP更新',
		icon: 'none'
	})
	// #endif
	
	emit('confirm')
}

// 跳转到应用市场
const jumpToMarket = () => {
	// #ifdef APP-PLUS
	try {
		// 获取手机品牌
		const brand = plus.device.vendor.toLowerCase()
		console.log('手机品牌:', brand)
		
		let marketUrl = ''
		
		// 根据品牌选择对应的应用市场链接
		if (brand.includes('huawei')) {
			marketUrl = props.markets.huawei || 'appmarket://details?id=com.qiannaqule.money'
		} else if (brand.includes('xiaomi') || brand.includes('redmi')) {
			marketUrl = props.markets.xiaomi || 'https://app.mi.com/details?id=com.qiannaqule.money'
		} else if (brand.includes('vivo')) {
			marketUrl = props.markets.vivo || 'vivomarket://details?id=com.qiannaqule.money'
		} else if (brand.includes('oppo') || brand.includes('realme') || brand.includes('oneplus')) {
			marketUrl = props.markets.oppo || 'market://details?id=com.qiannaqule.money'
		} else if (brand.includes('honor')) {
			marketUrl = props.markets.honor || 'market://details?id=com.qiannaqule.money'
		} else {
			// 其他品牌使用通用market链接
			marketUrl = 'market://details?id=com.qiannaqule.money'
		}
		
		console.log('跳转链接:', marketUrl)
		
		// 打开应用市场
		plus.runtime.openURL(marketUrl, (error) => {
			console.error('打开应用市场失败:', error)
			uni.showModal({
				title: '提示',
				content: '无法打开应用市场，请手动前往应用市场搜索"钱哪去了"进行更新',
				showCancel: false
			})
		})
		
		// 如果不是强制更新，关闭弹窗
		if (!props.isForce) {
			emit('cancel')
		}
	} catch (error) {
		console.error('跳转应用市场失败:', error)
		uni.showToast({
			title: '跳转失败',
			icon: 'none'
		})
	}
	// #endif
}

// 开始下载
const startDownload = () => {
	if (!props.downloadUrl) {
		uni.showToast({
			title: '下载地址错误',
			icon: 'none'
		})
		return
	}
	
	isDownloading.value = true
	downloadProgress.value = '0%'
	
	const downloadTask = uni.downloadFile({
		url: props.downloadUrl,
		success: (res) => {
			if (res.statusCode === 200) {
				downloadProgress.value = '100%'
				
				// 安装应用
				// #ifdef APP-PLUS
				plus.runtime.install(res.tempFilePath, {
					force: false
				}, () => {
					uni.showModal({
						title: '安装成功',
						content: '应用将重启以完成更新',
						showCancel: false,
						success: () => {
							plus.runtime.restart()
						}
					})
					emit('downloadComplete')
				}, (error) => {
					uni.showModal({
						title: '安装失败',
						content: '请稍后重试或联系客服',
						showCancel: false
					})
					isDownloading.value = false
					downloadProgress.value = '0%'
				})
				// #endif
			} else {
				uni.showToast({
					title: '下载失败，请重试',
					icon: 'none'
				})
				isDownloading.value = false
				downloadProgress.value = '0%'
			}
		},
		fail: (err) => {
			console.error('下载失败:', err)
			uni.showModal({
				title: '下载失败',
				content: '请检查网络连接后重试',
				showCancel: false
			})
			isDownloading.value = false
			downloadProgress.value = '0%'
		}
	})
	
	// 监听下载进度
	downloadTask.onProgressUpdate((res) => {
		if (res.progress > 0) {
			downloadProgress.value = res.progress + '%'
		}
	})
}
</script>

<style lang="scss" scoped>
.update-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(8rpx);
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
	width: 600rpx;
	background: #FFFFFF;
	border-radius: 32rpx;
	overflow: hidden;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2);
	animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes slideUp {
	from {
		transform: translateY(100rpx);
		opacity: 0;
	}
	to {
		transform: translateY(0);
		opacity: 1;
	}
}

.modal-content.shake {
	animation: shake 0.5s;
}

@keyframes shake {
	0%, 100% { transform: translateX(0); }
	10%, 30%, 50%, 70%, 90% { transform: translateX(-10rpx); }
	20%, 40%, 60%, 80% { transform: translateX(10rpx); }
}

.modal-header {
	padding: 60rpx 40rpx 32rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	position: relative;
}

.update-icon {
	width: 120rpx;
	height: 120rpx;
	background: rgba(255, 255, 255, 0.95);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 24rpx;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
	position: relative;
	animation: bounce 2s infinite;
}

@keyframes bounce {
	0%, 100% { transform: translateY(0); }
	50% { transform: translateY(-10rpx); }
}

.icon-text {
	font-size: 64rpx;
}

.icon-badge {
	position: absolute;
	top: -8rpx;
	right: -8rpx;
	background: #FF4D4F;
	padding: 4rpx 12rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.4);
}

.badge-text {
	font-size: 20rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.modal-title {
	font-size: 40rpx;
	font-weight: bold;
	color: #FFFFFF;
	margin-bottom: 12rpx;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.version-text {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
	padding: 8rpx 24rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: 24rpx;
	backdrop-filter: blur(10rpx);
}

.modal-body {
	padding: 40rpx;
}

.update-content {
	max-height: 400rpx;
	margin-bottom: 24rpx;
}

.update-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 24rpx;
	animation: slideInLeft 0.5s ease;
	animation-fill-mode: both;
}

.update-item:nth-child(1) { animation-delay: 0.1s; }
.update-item:nth-child(2) { animation-delay: 0.2s; }
.update-item:nth-child(3) { animation-delay: 0.3s; }

@keyframes slideInLeft {
	from {
		transform: translateX(-20rpx);
		opacity: 0;
	}
	to {
		transform: translateX(0);
		opacity: 1;
	}
}

.item-dot {
	width: 12rpx;
	height: 12rpx;
	background: #52C41A;
	border-radius: 50%;
	margin-top: 12rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.item-text {
	flex: 1;
	font-size: 28rpx;
	color: #333333;
	line-height: 1.6;
}

.update-info {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 20rpx;
	background: #F5F5F5;
	border-radius: 16rpx;
}

.info-text {
	font-size: 24rpx;
	color: #666666;
}

.info-divider {
	margin: 0 16rpx;
	color: #D9D9D9;
}

.progress-container {
	padding: 0 40rpx 24rpx;
}

.progress-bar {
	height: 12rpx;
	background: #F0F0F0;
	border-radius: 6rpx;
	overflow: hidden;
	margin-bottom: 12rpx;
}

.progress-fill {
	height: 100%;
	background: linear-gradient(90deg, #52C41A 0%, #73D13D 100%);
	transition: width 0.3s;
	border-radius: 6rpx;
}

.progress-text {
	font-size: 24rpx;
	color: #52C41A;
	text-align: center;
	display: block;
	font-weight: 500;
}

.modal-footer {
	display: flex;
	padding: 0 40rpx 40rpx;
	gap: 20rpx;
}

.btn-cancel {
	flex: 1;
	height: 88rpx;
	background: #F5F5F5;
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
}

.btn-cancel:active {
	transform: scale(0.98);
	background: #E8E8E8;
}

.btn-text-cancel {
	font-size: 32rpx;
	color: #666666;
	font-weight: 500;
}

.btn-confirm {
	flex: 1;
	height: 88rpx;
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	border-radius: 44rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.3);
	transition: all 0.3s;
}

.btn-confirm.btn-full {
	flex: 1;
}

.btn-confirm.btn-disabled {
	opacity: 0.6;
}

.btn-confirm:active:not(.btn-disabled) {
	transform: scale(0.98);
	box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.4);
}

.btn-text-confirm {
	font-size: 32rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.force-tip {
	padding: 24rpx 40rpx;
	background: #FFF7E6;
	border-top: 1rpx solid #FFE7BA;
}

.force-tip-text {
	font-size: 24rpx;
	color: #FA8C16;
	line-height: 1.5;
	text-align: center;
	display: block;
}
</style>
