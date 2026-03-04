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
			
			<!-- 核心功能 -->
			<view class="features-section">
				<view class="section-title">核心功能</view>
				<view class="feature-grid">
					<view class="feature-card">
						<view class="feature-icon">⚡</view>
						<view class="feature-name">语音记账</view>
						<view class="feature-desc">说话就能记</view>
					</view>
					<view class="feature-card">
						<view class="feature-icon">📸</view>
						<view class="feature-name">拍照记账</view>
						<view class="feature-desc">智能识别金额</view>
					</view>
					<view class="feature-card">
						<view class="feature-icon">📊</view>
						<view class="feature-name">智能统计</view>
						<view class="feature-desc">收支一目了然</view>
					</view>
					<view class="feature-card">
						<view class="feature-icon">☁️</view>
						<view class="feature-name">云端同步</view>
						<view class="feature-desc">数据永不丢失</view>
					</view>
				</view>
			</view>
			
			<!-- 产品介绍 -->
			<view class="intro-section">
				<view class="section-title">产品介绍</view>
				<view class="intro-card">
					<view class="intro-text">
						小獭记账是一款可爱治愈的智能记账工具，像小水獭一样聪明灵活，帮你轻松管理每一笔收支。
					</view>
					<view class="intro-text">
						我们提供拍照识别、语音记账等多种便捷方式,让记账变得简单有趣。智能统计功能帮你清晰了解消费习惯，合理规划财务。
					</view>
					<view class="intro-text">
						数据云端同步，换手机也不怕。我们重视用户隐私，所有数据加密存储，安全可靠。
					</view>
				</view>
			</view>
			
			<!-- 联系我们 -->
			<view class="contact-section">
				<view class="section-title">联系我们</view>
				
				<!-- 微信公众号 -->
				<view class="qrcode-card">
					<view class="qrcode-header">
						<view class="wechat-logo-single"></view>
						<view class="qrcode-title">微信公众号</view>
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
				
				<!-- 联系客服（仅小程序） -->
				<!-- #ifdef MP-WEIXIN -->
				<button class="feedback-card contact-service-button" open-type="contact">
					<view class="feedback-icon">👨‍💼</view>
					<view class="feedback-content">
						<view class="feedback-title">联系客服</view>
						<view class="feedback-desc">有任何问题？点击咨询在线客服</view>
					</view>
					<view class="feedback-arrow">›</view>
				</button>
				<!-- #endif -->
				
				<!-- 下载APP（仅小程序显示） -->
				<!-- #ifdef MP-WEIXIN -->
				<view class="feedback-card" @click="goToDownloadPage">
					<view class="feedback-icon">📱</view>
					<view class="feedback-content">
						<view class="feedback-title">下载APP</view>
						<view class="feedback-desc">体验更流畅，功能更强大</view>
					</view>
					<view class="feedback-arrow">›</view>
				</view>
				<!-- #endif -->
				
				<!-- 意见反馈 -->
				<view class="feedback-card" @click="goToFeedback">
					<view class="feedback-icon">💡</view>
					<view class="feedback-content">
						<view class="feedback-title">意见反馈</view>
						<view class="feedback-desc">有任何建议或问题？点击反馈</view>
					</view>
					<view class="feedback-arrow">›</view>
				</view>
			</view>
			
			<!-- 用户协议和隐私政策 -->
			<view class="legal-section">
				<view class="legal-links">
					<text class="legal-link" @click="openUserAgreement">用户协议</text>
					<text class="legal-divider">|</text>
					<text class="legal-link" @click="openPrivacyPolicy">隐私政策</text>
				</view>
			</view>
			
			<!-- 底部信息 -->
			<view class="footer-section">
				<view class="footer-text">© 2026 小獭记账</view>
				<view class="footer-text">用心做好每一个功能</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { ref, onMounted } from 'vue'

const appVersion = ref('1.0.0')
const statusBarHeight = ref(0)

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
	padding: $spacing-xl $spacing-lg;
	background: $bg-white;
	border-radius: $radius-2xl;
	margin-bottom: $spacing-md;
	box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
}

.app-logo {
	width: 120rpx;
	height: 120rpx;
	border-radius: $radius-2xl;
	margin-bottom: $spacing-md;
	box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.2);
}

.app-name {
	font-size: 40rpx;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $spacing-xs;
}

.app-slogan {
	font-size: $font-size-base;
	color: $text-secondary;
	margin-bottom: $spacing-sm;
}

.version {
	font-size: $font-size-xs;
	color: $text-tertiary;
	padding: $spacing-xs $spacing-md;
	background: $bg-light;
	border-radius: $radius-2xl;
}

/* 核心功能 */
.features-section {
	background: $bg-white;
	border-radius: $radius-2xl;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
}

.section-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $spacing-lg;
	text-align: center;
}

.feature-grid {
	display: grid;
	grid-template-columns: repeat(2, 1fr);
	gap: $spacing-md;
}

.feature-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-lg;
	background: linear-gradient(135deg, #F0FFF4 0%, #FFFFFF 100%);
	border-radius: $radius-xl;
	border: 2rpx solid rgba(82, 196, 26, 0.1);
	transition: all $transition-fast;
}

.feature-card:active {
	transform: scale(0.96);
}

.feature-icon {
	font-size: 48rpx;
	margin-bottom: $spacing-sm;
}

.feature-name {
	font-size: $font-size-base;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $spacing-xs;
}

.feature-desc {
	font-size: $font-size-xs;
	color: $text-tertiary;
}

/* 产品介绍 */
.intro-section {
	background: $bg-white;
	border-radius: $radius-2xl;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
}

.intro-card {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.intro-text {
	font-size: $font-size-sm;
	color: $text-secondary;
	line-height: 1.6;
	text-align: justify;
}

/* 联系我们 */
.contact-section {
	background: $bg-white;
	border-radius: $radius-2xl;
	padding: $spacing-lg;
	margin-bottom: $spacing-md;
	box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
}

.contact-card {
	margin-bottom: $spacing-lg;
}

.contact-item {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-lg;
	background: linear-gradient(135deg, #F0FFF4 0%, #FFFFFF 100%);
	border-radius: $radius-xl;
	border: 2rpx solid rgba(82, 196, 26, 0.1);
	transition: all $transition-fast;
}

.contact-item:active {
	transform: scale(0.98);
	background: #E8F5E9;
}

.contact-icon {
	width: 80rpx;
	height: 80rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.2);
	position: relative;
	overflow: hidden;
}

.email-icon {
	background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
}

.service-icon {
	background: linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%);
}

.wechat-icon {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

/* 邮件信封图标 */
.email-envelope {
	width: 48rpx;
	height: 36rpx;
	position: relative;
}

.envelope-body {
	width: 100%;
	height: 100%;
	background: #FFFFFF;
	border-radius: 4rpx;
	position: relative;
}

.envelope-flap {
	position: absolute;
	top: 0;
	left: 0;
	width: 0;
	height: 0;
	border-left: 24rpx solid transparent;
	border-right: 24rpx solid transparent;
	border-top: 18rpx solid #FFE5E5;
	z-index: 1;
}

/* 客服图标 */
.service-person {
	font-size: 40rpx;
}

/* 联系客服按钮样式重置 */
.contact-service-button {
	background: transparent;
	border: none;
	padding: 0;
	margin: 0 0 $spacing-lg 0;
	line-height: normal;
	text-align: left;
	width: 100%;
	display: flex;
	align-items: center;
	gap: $spacing-md;
}

.contact-service-button::after {
	border: none;
}

/* 微信公众号二维码卡片 */
.qrcode-card {
	display: flex;
	flex-direction: column;
	align-items: center;
	padding: $spacing-xl;
	background: linear-gradient(135deg, #F0FFF4 0%, #FFFFFF 100%);
	border-radius: $radius-xl;
	border: 2rpx solid rgba(82, 196, 26, 0.1);
	margin-bottom: $spacing-lg;
}

.qrcode-header {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	margin-bottom: $spacing-lg;
}

/* 微信Logo - 单个圆形带眼睛 */
.wechat-logo-single {
	width: 48rpx;
	height: 48rpx;
	background: #52C41A;
	border-radius: 50%;
	position: relative;
	box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
}

.wechat-logo-single::before {
	content: '';
	position: absolute;
	width: 8rpx;
	height: 8rpx;
	background: #FFFFFF;
	border-radius: 50%;
	top: 16rpx;
	left: 12rpx;
}

.wechat-logo-single::after {
	content: '';
	position: absolute;
	width: 8rpx;
	height: 8rpx;
	background: #FFFFFF;
	border-radius: 50%;
	top: 16rpx;
	right: 12rpx;
}

.qrcode-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.qrcode-wrapper {
	width: 320rpx;
	height: 320rpx;
	padding: $spacing-md;
	background: $bg-white;
	border-radius: $radius-xl;
	box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.15);
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

.contact-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
}

.contact-label {
	font-size: $font-size-base;
	color: $text-secondary;
	font-weight: $font-weight-medium;
}

.contact-value {
	font-size: $font-size-lg;
	color: $text-primary;
	font-weight: $font-weight-bold;
}

.contact-hint {
	font-size: $font-size-xs;
	color: $primary-color;
}

/* 意见反馈卡片 */
.feedback-card {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-lg;
	background: linear-gradient(135deg, #FFF7E6 0%, #FFFFFF 100%);
	border-radius: $radius-xl;
	border: 2rpx solid rgba(250, 173, 20, 0.2);
	transition: all $transition-fast;
}

.feedback-card:active {
	transform: scale(0.98);
	background: #FFF3D9;
}

.feedback-icon {
	font-size: 48rpx;
}

.feedback-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
}

.feedback-title {
	font-size: $font-size-base;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.feedback-desc {
	font-size: $font-size-sm;
	color: $text-secondary;
}

.feedback-arrow {
	font-size: 48rpx;
	color: $text-tertiary;
	font-weight: $font-weight-light;
}

/* 法律链接 */
.legal-section {
	margin-bottom: $spacing-lg;
}

.legal-links {
	display: flex;
	justify-content: center;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-lg;
}

.legal-link {
	font-size: $font-size-base;
	color: $primary-color;
	font-weight: $font-weight-medium;
}

.legal-divider {
	font-size: $font-size-base;
	color: $text-tertiary;
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
