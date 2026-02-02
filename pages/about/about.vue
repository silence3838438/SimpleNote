<template>
	<view class="page">
		<view class="container">
			<!-- Logo 和标题 -->
			<view class="header-section">
				<image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
				<view class="app-name">钱哪去了</view>
				<view class="app-slogan">让记账变得简单有趣</view>
				<view class="version">v1.0.0</view>
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
						钱哪去了是一款简洁实用的记账小程序，致力于帮助用户轻松管理每一笔收支。
					</view>
					<view class="intro-text">
						我们提供语音记账、拍照记账等多种便捷方式，让记账变得像聊天一样简单。智能统计功能帮你清晰了解消费习惯，合理规划财务。
					</view>
					<view class="intro-text">
						数据云端同步，换手机也不怕。我们重视用户隐私，所有数据加密存储，安全可靠。
					</view>
				</view>
			</view>
			
			<!-- 联系我们 -->
			<view class="contact-section">
				<view class="section-title">联系我们</view>
				<view class="contact-card">
					<view class="contact-item" @click="callPhone">
						<view class="contact-icon phone-icon">
							<view class="icon-symbol">📞</view>
						</view>
						<view class="contact-content">
							<view class="contact-label">联系电话</view>
							<view class="contact-value">17682824692 <text class="copy-hint">（点击拨打）</text></view>
						</view>
					</view>
					<view class="contact-item">
						<view class="contact-icon email-icon">
							<view class="icon-symbol">@</view>
						</view>
						<view class="contact-content">
							<view class="contact-label">邮箱</view>
							<view class="contact-value">951123604@qq.com</view>
						</view>
					</view>
					<view class="contact-item" @click="copyWechat">
						<view class="contact-icon wechat-icon">
							<view class="icon-symbol wechat-symbol">
								<view class="wechat-bubble wechat-bubble-1"></view>
								<view class="wechat-bubble wechat-bubble-2"></view>
							</view>
						</view>
						<view class="contact-content">
							<view class="contact-label">微信</view>
							<view class="contact-value">silenceA15 <text class="copy-hint">（点击复制）</text></view>
						</view>
					</view>
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
				<view class="footer-text">© 2026 钱哪去了</view>
				<view class="footer-text">用心做好每一个功能</view>
			</view>
		</view>
	</view>
</template>

<script setup>
const callPhone = () => {
	uni.makePhoneCall({
		phoneNumber: '17682824692',
		fail: () => {
			uni.showToast({
				title: '拨号失败',
				icon: 'none'
			})
		}
	})
}

const copyWechat = () => {
	uni.setClipboardData({
		data: 'silenceA15',
		success: () => {
			uni.showToast({
				title: '微信号已复制',
				icon: 'success'
			})
		}
	})
}

const openUserAgreement = () => {
	uni.showModal({
		title: '用户协议',
		content: '感谢您使用钱哪去了小程序。使用本服务即表示您同意遵守相关服务条款。我们承诺保护您的隐私和数据安全。',
		showCancel: false,
		confirmText: '知道了'
	})
}

const openPrivacyPolicy = () => {
	uni.showModal({
		title: '隐私政策',
		content: '我们重视您的隐私保护。您的记账数据仅用于为您提供服务，不会用于其他用途。所有数据均加密存储，未经授权不会分享给第三方。',
		showCancel: false,
		confirmText: '知道了'
	})
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	min-height: 100vh;
	background: linear-gradient(180deg, #F0FFF4 0%, #FAFAFA 100%);
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
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.contact-item {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	padding: $spacing-md;
	background: $bg-light;
	border-radius: $radius-xl;
	transition: all $transition-fast;
}

.contact-item:active {
	transform: scale(0.98);
	background: #E8E8E8;
}

.contact-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	flex-shrink: 0;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
	position: relative;
}

.email-icon {
	background: linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%);
}

.phone-icon {
	background: linear-gradient(135deg, #4CAF50 0%, #52C41A 100%);
}

.wechat-icon {
	background: linear-gradient(135deg, #07C160 0%, #2AAE67 100%);
}

.icon-symbol {
	font-size: 36rpx;
	font-weight: bold;
	color: #FFFFFF;
	font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Arial, sans-serif;
}

/* 微信图标 - 两个对话气泡 */
.wechat-symbol {
	width: 36rpx;
	height: 36rpx;
	position: relative;
}

.wechat-bubble {
	position: absolute;
	background: #FFFFFF;
	border-radius: 50%;
}

.wechat-bubble-1 {
	width: 28rpx;
	height: 28rpx;
	top: 0;
	right: 0;
}

.wechat-bubble-1::after {
	content: '';
	position: absolute;
	width: 6rpx;
	height: 6rpx;
	background: #FFFFFF;
	border-radius: 50%;
	bottom: -4rpx;
	right: 4rpx;
}

.wechat-bubble-2 {
	width: 32rpx;
	height: 32rpx;
	bottom: 0;
	left: 0;
}

.wechat-bubble-2::after {
	content: '';
	position: absolute;
	width: 8rpx;
	height: 8rpx;
	background: #FFFFFF;
	border-radius: 50%;
	top: -4rpx;
	left: 6rpx;
}

.contact-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
}

.contact-label {
	font-size: $font-size-sm;
	color: $text-tertiary;
}

.contact-value {
	font-size: $font-size-base;
	color: $text-primary;
	font-weight: $font-weight-medium;
}

.copy-hint {
	font-size: $font-size-xs;
	color: $primary-color;
	font-weight: $font-weight-normal;
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
