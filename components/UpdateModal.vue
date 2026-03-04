<template>
	<view class="update-modal" v-if="visible" @click="handleMaskClick">
		<view class="modal-content" @click.stop :class="{ 'shake': showShake }">
			<!-- 内容区域 -->
			<view class="content-area">
				<!-- 顶部标题 -->
				<view class="header-row">
					<text class="modal-title">发现新版本</text>
					<view class="force-badge" v-if="isForce">
						<text class="force-badge-text">强制</text>
					</view>
				</view>
				
				<!-- 版本号 -->
				<view class="version-row">
					<text class="version-label">版本号：</text>
					<text class="version-number">v{{ newVersion }}</text>
				</view>
				
				<!-- 更新内容 -->
				<scroll-view class="update-content" scroll-y>
					<view class="update-item" v-for="(item, index) in updateContent" :key="index">
						<view class="item-dot"></view>
						<text class="item-text">{{ item }}</text>
					</view>
				</scroll-view>
				
				<!-- 更新信息 -->
				<view class="update-info">
					<text class="info-text">📦 {{ packageSize }}</text>
					<text class="info-divider">|</text>
					<text class="info-text">🕐 {{ updateTime }}</text>
				</view>
				
				<!-- 下载进度条 -->
				<view class="progress-container" v-if="isDownloading">
					<view class="progress-bar">
						<view class="progress-fill" :style="{ width: downloadProgress }"></view>
					</view>
					<text class="progress-text">{{ downloadProgress }}</text>
				</view>
				
				<!-- 占位空间 -->
				<view style="flex: 1;"></view>
				
				<!-- 底部按钮 -->
				<view class="button-group">
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
					// 安装成功，立即重启应用（不延迟，避免系统弹框）
					plus.runtime.restart()
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
	background: rgba(0, 0, 0, 0.7);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 9999;
	backdrop-filter: blur(10rpx);
	animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.modal-content {
	background: url("https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/zm/rocket.png") no-repeat;
	background-size: contain;
	background-position: top center;
	width: 75vw;
	height: 890rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	animation: modalFadeIn 0.5s ease-out;
	position: relative;
}

@keyframes modalFadeIn {
	0% {
		opacity: 0;
		transform: translateY(60rpx) scale(0.95);
	}
	100% {
		opacity: 1;
		transform: translateY(0) scale(1);
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

// 内容区域（从火箭下方开始）
.content-area {
	display: flex;
	flex-direction: column;
	width: 100%;
	margin-top: 260rpx;
	padding: 30rpx 60rpx 50rpx;
	box-sizing: border-box;
	height: 630rpx;
	position: relative;
	opacity: 0;
	animation: contentFadeIn 0.4s ease-out 0.3s forwards;
}

@keyframes contentFadeIn {
	0% {
		opacity: 0;
		transform: translateY(20rpx);
	}
	100% {
		opacity: 1;
		transform: translateY(0);
	}
}

// 标题行
.header-row {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 16rpx;
	position: relative;
}

.modal-title {
	font-size: 36rpx;
	font-weight: bold;
	color: #3D3D3D;
}

.force-badge {
	position: absolute;
	right: 0;
	top: 0;
	background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
	padding: 6rpx 16rpx;
	border-radius: 20rpx;
	box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
}

.force-badge-text {
	font-size: 20rpx;
	color: #FFFFFF;
	font-weight: bold;
}

// 版本号
.version-row {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: 20rpx;
}

.version-label {
	font-size: 24rpx;
	color: #3D3D3D;
}

.version-number {
	font-size: 24rpx;
	color: #3D3D3D;
	font-weight: 600;
}

// 更新内容
.update-content {
	height: 240rpx;
	overflow: hidden;
	margin-bottom: 20rpx;
}

.update-item {
	display: flex;
	align-items: flex-start;
	margin-bottom: 20rpx;
}

.item-dot {
	width: 10rpx;
	height: 10rpx;
	background: #52C41A;
	border-radius: 50%;
	margin-top: 12rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
}

.item-text {
	flex: 1;
	font-size: 26rpx;
	color: #3D3D3D;
	line-height: 1.6;
}

// 更新信息
.update-info {
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 12rpx;
	background: rgba(245, 245, 245, 0.8);
	border-radius: 12rpx;
	margin-bottom: 16rpx;
}

.info-text {
	font-size: 22rpx;
	color: #666666;
}

.info-divider {
	margin: 0 16rpx;
	color: #D9D9D9;
}

// 进度条
.progress-container {
	margin-bottom: 24rpx;
}

.progress-bar {
	height: 12rpx;
	background: rgba(240, 240, 240, 0.8);
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
	font-size: 22rpx;
	color: #52C41A;
	text-align: center;
	display: block;
	font-weight: 500;
}

// 按钮组
.button-group {
	display: flex;
	justify-content: center;
	gap: 20rpx;
	margin-top: 16rpx;
}

.btn-cancel {
	width: 170rpx;
	height: 72rpx;
	background: transparent;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
	border: 2rpx solid #CCCCCC;
}

.btn-cancel:active {
	transform: scale(0.95);
	background: #F5F5F5;
}

.btn-text-cancel {
	font-size: 28rpx;
	color: #666666;
	font-weight: 500;
}

.btn-confirm {
	width: 170rpx;
	height: 72rpx;
	background: #28B73B;
	border-radius: 36rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.3s;
	box-shadow: 0 4rpx 12rpx rgba(40, 183, 59, 0.3);
}

.btn-confirm.btn-full {
	width: 240rpx;
	height: 88rpx;
	border-radius: 44rpx;
}

.btn-confirm.btn-disabled {
	opacity: 0.6;
}

.btn-confirm:active:not(.btn-disabled) {
	transform: scale(0.95);
	opacity: 0.9;
}

.btn-text-confirm {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: bold;
}

// 强制更新提示
.force-tip {
	position: absolute;
	bottom: 20rpx;
	left: 20rpx;
	right: 20rpx;
	padding: 16rpx;
	background: rgba(255, 247, 230, 0.95);
	border-radius: 12rpx;
}

.force-tip-text {
	font-size: 22rpx;
	color: #FA8C16;
	line-height: 1.5;
	text-align: center;
	display: block;
}

</style>
