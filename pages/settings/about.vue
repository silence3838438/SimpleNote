<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="navbar-title">关于我们</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56 + 16) + 'px' }">
			<!-- Logo 和标题 -->
			<view class="header-section">
				<image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
				<view class="app-name">小獭记账</view>
				<view class="app-slogan">聪明记账，轻松理财</view>
				<view class="version">v{{ appVersion }}</view>
			</view>
			
			<!-- 功能列表 -->
			<view class="menu-section">
				<!-- 微信公众号 -->
				<view class="menu-item" @click="showQRCode">
					<view class="menu-icon">📱</view>
					<view class="menu-label">微信公众号</view>
					<view class="menu-arrow">›</view>
				</view>
				
				<!-- 下载APP（仅小程序显示） -->
				<!-- #ifdef MP-WEIXIN -->
				<view class="menu-item" @click="goToDownloadPage">
					<view class="menu-icon">📲</view>
					<view class="menu-label">下载APP</view>
					<view class="menu-arrow">›</view>
				</view>
				<!-- #endif -->
				
				<!-- 用户协议 -->
				<view class="menu-item" @click="openUserAgreement">
					<view class="menu-icon">📄</view>
					<view class="menu-label">用户协议</view>
					<view class="menu-arrow">›</view>
				</view>
				
				<!-- 隐私政策 -->
				<view class="menu-item" @click="openPrivacyPolicy">
					<view class="menu-icon">🔒</view>
					<view class="menu-label">隐私政策</view>
					<view class="menu-arrow">›</view>
				</view>
			</view>
			
			<!-- 底部信息 -->
			<view class="footer-section">
				<view class="footer-text">© 2026 小獭记账</view>
				<view class="footer-text">用心做好每一个功能</view>
			</view>
		</view>
		
		<!-- 二维码弹窗 -->
		<view class="qrcode-modal" v-if="showQRCodeModal" @click="closeQRCode">
			<view class="qrcode-content" @click.stop>
				<view class="qrcode-header">
					<view class="qrcode-title">微信公众号</view>
					<text class="qrcode-close" @click="closeQRCode">✕</text>
				</view>
				<view class="qrcode-wrapper">
					<image 
						class="qrcode-img" 
						src="/static/gzhhao.jpg" 
						mode="aspectFit"
						@click="previewQRCode"
					></image>
				</view>
				<view class="qrcode-desc">长按识别二维码关注</view>
				<view class="qrcode-tips">获取最新功能 · 使用技巧 · 活动福利</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const appVersion = ref('1.0.0')
const statusBarHeight = ref(0)
const showQRCodeModal = ref(false)

const getSystemInfo = () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 0
}

const goBack = () => {
	uni.navigateBack()
}

onMounted(() => {
	getSystemInfo()
	
	// 获取版本号
	// #ifdef APP-PLUS
	const appInfo = plus.runtime
	appVersion.value = appInfo.version || '1.0.0'
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序从 manifest.json 读取版本号
	const accountInfo = uni.getAccountInfoSync()
	appVersion.value = accountInfo.miniProgram.version || '1.0.0'
	// #endif
})

const showQRCode = () => {
	showQRCodeModal.value = true
}

const closeQRCode = () => {
	showQRCodeModal.value = false
}

const previewQRCode = () => {
	uni.previewImage({
		urls: ['/static/gzhhao.jpg'],
		current: '/static/gzhhao.jpg'
	})
}

const goToFeedback = () => {
	uni.navigateTo({
		url: '/pages/settings/feedback'
	})
}

const openUserAgreement = () => {
	uni.navigateTo({
		url: '/pages/agreement/agreement'
	})
}

const openPrivacyPolicy = () => {
	uni.navigateTo({
		url: '/pages/privacy/privacy'
	})
}

const goToDownloadPage = () => {
	// #ifdef MP-WEIXIN
	uni.showModal({
		title: '下载APP',
		content: '请访问官网下载APP，获得更好的使用体验',
		confirmText: '复制链接',
		success: (res) => {
			if (res.confirm) {
				uni.setClipboardData({
					data: 'https://api.qiannaqule.top',
					success: () => {
						uni.showToast({
							title: '链接已复制',
							icon: 'success'
						})
					}
				})
			}
		}
	})
	// #endif
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	min-height: 100vh;
	background: linear-gradient(180deg, #F0FFF4 0%, #FAFAFA 100%);
}

/* 自定义导航栏 - 随手记风格（纯白色） */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: $bg-white;
	z-index: 1000;
	border-bottom: 1rpx solid $border-color;
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
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
	padding: $spacing-lg $spacing-lg 150rpx;
}

/* Logo 和标题 */
.header-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: 60rpx $spacing-lg;
	background: $bg-white;
	border-radius: $radius-2xl;
	margin-bottom: $spacing-lg;
	box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
}

.app-logo {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-2xl;
	margin-bottom: $spacing-lg;
	background: transparent;
}

.app-name {
	font-size: 40rpx;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $spacing-sm;
}

.app-slogan {
	font-size: $font-size-base;
	color: $text-secondary;
	margin-bottom: $spacing-lg;
}

.version {
	font-size: $font-size-xs;
	color: $text-tertiary;
	padding: $spacing-xs $spacing-md;
	background: $bg-light;
	border-radius: $radius-2xl;
}

/* 功能列表 - 精致版 */
.menu-section {
	background: $bg-white;
	border-radius: $radius-2xl;
	overflow: hidden;
	margin-bottom: $spacing-lg;
	box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
	padding: $spacing-sm 0;
}

.menu-item {
	display: flex;
	align-items: center;
	padding: $spacing-lg $spacing-xl;
	background: $bg-white;
	margin: 0 $spacing-md;
	border-radius: $radius-xl;
	transition: all $transition-fast;
	position: relative;
}

.menu-item:active {
	background: linear-gradient(135deg, rgba(82, 196, 26, 0.06) 0%, rgba(82, 196, 26, 0.03) 100%);
	transform: scale(0.98);
}

.menu-button {
	background: transparent;
	border: none;
	padding: $spacing-lg $spacing-xl;
	margin: 0 $spacing-md;
	line-height: normal;
	text-align: left;
	width: calc(100% - 32rpx);
	display: flex;
	align-items: center;
	border-radius: $radius-xl;
}

.menu-button::after {
	border: none;
}

.menu-button:active {
	background: linear-gradient(135deg, rgba(82, 196, 26, 0.06) 0%, rgba(82, 196, 26, 0.03) 100%);
	transform: scale(0.98);
}

.menu-icon {
	width: 72rpx;
	height: 72rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: 36rpx;
	margin-right: $spacing-lg;
	flex-shrink: 0;
	background: linear-gradient(135deg, #F0FFF4 0%, #FAFBFC 100%);
	border-radius: $radius-xl;
	box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.08);
}

.menu-label {
	flex: 1;
	font-size: 30rpx;
	color: $text-primary;
	font-weight: $font-weight-medium;
	letter-spacing: 0.5rpx;
}

.menu-arrow {
	font-size: 40rpx;
	color: $text-tertiary;
	font-weight: $font-weight-light;
	opacity: 0.5;
}

/* 二维码弹窗 */
.qrcode-modal {
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
}

.qrcode-content {
	width: 560rpx;
	background: $bg-white;
	border-radius: $radius-2xl;
	padding: $spacing-xl;
	display: flex;
	flex-direction: column;
	align-items: center;
}

.qrcode-header {
	width: 100%;
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $spacing-xl;
}

.qrcode-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.qrcode-close {
	font-size: 48rpx;
	color: $text-tertiary;
	padding: $spacing-xs;
}

.qrcode-wrapper {
	width: 400rpx;
	height: 400rpx;
	padding: $spacing-md;
	background: $bg-light;
	border-radius: $radius-xl;
	margin-bottom: $spacing-lg;
}

.qrcode-img {
	width: 100%;
	height: 100%;
	border-radius: $radius-lg;
}

.qrcode-desc {
	font-size: $font-size-base;
	color: $text-secondary;
	margin-bottom: $spacing-xs;
}

.qrcode-tips {
	font-size: $font-size-xs;
	color: $text-tertiary;
	text-align: center;
}

/* 底部信息 */
.footer-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-sm;
	padding: $spacing-xl;
}

.footer-text {
	font-size: $font-size-sm;
	color: $text-tertiary;
}
</style>
