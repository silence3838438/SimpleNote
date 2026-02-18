<template>
	<view class="register-page">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
			<view class="circle circle-3"></view>
		</view>
		
		<!-- 主内容区 -->
		<view class="content-wrapper">
			<!-- 头部 -->
			<view class="header-section">
				<text class="page-title">注册账号</text>
				<text class="page-subtitle">创建你的专属记账账号</text>
			</view>
			
			<!-- 注册表单 -->
			<view class="register-card">
				<view class="form-item">
					<view class="input-wrapper">
						<text class="input-icon">📱</text>
						<input 
							class="form-input" 
							v-model="data.phone" 
							placeholder="请输入手机号"
							placeholder-class="input-placeholder"
							type="number"
							maxlength="11"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-wrapper">
						<image class="input-icon-img" src="/static/yanzhengma.png" mode="aspectFit"></image>
						<input 
							class="form-input" 
							v-model="data.code" 
							placeholder="请输入验证码"
							placeholder-class="input-placeholder"
							type="number"
							maxlength="6"
						/>
						<view class="code-btn" @click="sendCode" :class="{ disabled: data.countdown > 0 }">
							<text class="code-text">{{ data.countdown > 0 ? `${data.countdown}s` : '获取验证码' }}</text>
						</view>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-wrapper">
						<text class="input-icon">🔒</text>
						<input 
							class="form-input" 
							v-model="data.password" 
							:password="!data.showPassword"
							placeholder="请设置密码（6-20位）"
							placeholder-class="input-placeholder"
							maxlength="20"
						/>
						<image 
							class="eye-icon-img" 
							:src="data.showPassword ? '/static/mingwen.png' : '/static/miwen.png'" 
							@click="togglePassword" 
							mode="aspectFit"
						></image>
					</view>
				</view>
				
				<!-- 隐私协议 -->
				<view class="privacy-section-inline">
					<checkbox-group @change="onAgreeChange">
						<label class="checkbox-label-inline">
							<checkbox :checked="data.agreed" color="#52C41A" class="custom-checkbox-inline" />
							<view class="privacy-text-inline">
								<text class="text-normal-inline">注册即表示同意</text>
								<text class="text-link-inline" @click.stop="openUserAgreement">《用户协议》</text>
								<text class="text-normal-inline">和</text>
								<text class="text-link-inline" @click.stop="openPrivacy">《隐私政策》</text>
							</view>
						</label>
					</checkbox-group>
				</view>
				
				<view class="register-btn" @click="handleRegister">
					<text class="btn-text">注册</text>
				</view>
				
				<view class="login-link">
					<text class="link-text">已有账号？</text>
					<text class="link-action" @click="goToLogin">立即登录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
import request from '@/utils/request.js'

const data = reactive({
	phone: '',
	code: '',
	password: '',
	showPassword: false,
	countdown: 0,
	agreed: false
})

// 切换密码显示
const togglePassword = () => {
	data.showPassword = !data.showPassword
}

// 同意协议变化
const onAgreeChange = (e) => {
	data.agreed = e.detail.value.length > 0
}

// 发送验证码
const sendCode = async () => {
	if (data.countdown > 0) return
	
	if (!data.phone) {
		uni.showToast({
			title: '请输入手机号',
			icon: 'none'
		})
		return
	}
	
	if (!/^1[3-9]\d{9}$/.test(data.phone)) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none'
		})
		return
	}
	
	try {
		uni.showLoading({ title: '发送中...' })
		
		const result = await request.call('auth/send-code', {
			phone: data.phone,
			type: 'register'
		})
		
		uni.hideLoading()
		
		if (result.success) {
			// 如果返回了验证码，直接填充到输入框
			if (result.code) {
				data.code = result.code
			}
			
			// 开始倒计时
			data.countdown = 60
			const timer = setInterval(() => {
				data.countdown--
				if (data.countdown <= 0) {
					clearInterval(timer)
				}
			}, 1000)
		} else {
			throw new Error(result.message || '发送失败')
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '发送失败',
			icon: 'none'
		})
	}
}

// 注册
const handleRegister = async () => {
	if (!data.agreed) {
		uni.showToast({
			title: '请先同意隐私政策和用户协议',
			icon: 'none'
		})
		return
	}
	
	if (!data.phone || !data.code || !data.password) {
		uni.showToast({
			title: '请填写完整信息',
			icon: 'none'
		})
		return
	}
	
	if (!/^1[3-9]\d{9}$/.test(data.phone)) {
		uni.showToast({
			title: '请输入正确的手机号',
			icon: 'none'
		})
		return
	}
	
	if (data.password.length < 6 || data.password.length > 20) {
		uni.showToast({
			title: '密码长度为6-20位',
			icon: 'none'
		})
		return
	}
	
	try {
		uni.showLoading({ title: '注册中...' })
		
		const result = await request.call('auth/register', {
			phone: data.phone,
			code: data.code,
			password: data.password
		})
		
		uni.hideLoading()
		
		if (result.success) {
			uni.showToast({
				title: '注册成功',
				icon: 'success'
			})
			
			// 保存用户信息
			const userInfo = {
				nickName: result.data?.nickName || data.phone,
				avatarUrl: result.data?.avatarUrl || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
				isLogin: true
			}
			
			uni.setStorageSync('userInfo', userInfo)
			uni.setStorageSync('token', result.token)
			
			// 跳转到首页
			setTimeout(() => {
				uni.switchTab({ url: '/pages/tab/index/index' })
			}, 1000)
		} else {
			throw new Error(result.message || '注册失败')
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '注册失败',
			icon: 'none'
		})
	}
}

// 跳转到登录页面
const goToLogin = () => {
	uni.navigateBack()
}

// 打开隐私政策
const openPrivacy = () => {
	// #ifdef APP-PLUS
	plus.runtime.openURL('https://api.qiannaqule.top/privacy.html')
	// #endif
	
	// #ifdef MP-WEIXIN
	uni.navigateTo({
		url: '/pages/privacy/privacy'
	})
	// #endif
}

// 打开用户协议
const openUserAgreement = () => {
	// #ifdef APP-PLUS
	plus.runtime.openURL('https://api.qiannaqule.top/user-agreement.html')
	// #endif
	
	// #ifdef MP-WEIXIN
	uni.navigateTo({
		url: '/pages/agreement/agreement'
	})
	// #endif
}
</script>

<style lang="scss" scoped>
.register-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #52C41A 0%, #73D13D 100%);
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center; /* 改回居中对齐 */
	justify-content: center;
	padding: 80rpx 80rpx 60rpx; /* 和登录页面保持一致 */
}

// 背景装饰 - 简化设计
.bg-decoration {
	position: absolute;
	width: 100%;
	height: 100%;
	top: 0;
	left: 0;
	overflow: hidden;
	z-index: 0;
	opacity: 0.6;
}

.circle {
	position: absolute;
	border-radius: 50%;
	background: rgba(255, 255, 255, 0.08);
}

.circle-1 {
	width: 500rpx;
	height: 500rpx;
	top: -200rpx;
	right: -150rpx;
}

.circle-2 {
	width: 350rpx;
	height: 350rpx;
	bottom: -100rpx;
	left: -100rpx;
}

.circle-3 {
	width: 250rpx;
	height: 250rpx;
	top: 40%;
	right: -80rpx;
}

// 主内容区
.content-wrapper {
	position: relative;
	z-index: 1;
	width: 100%;
	max-width: 600rpx; /* 保持减小的宽度 */
	margin: 0 auto;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: -100rpx; /* 向上偏移100rpx，实现居中偏上的效果 */
}

// 头部区域
.header-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 100rpx;
}

.page-title {
	font-size: 56rpx;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: 16rpx;
	letter-spacing: 1rpx;
}

.page-subtitle {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 400;
}

// 注册卡片
.register-card {
	width: 100%;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 56rpx 48rpx 48rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
}

.form-item {
	margin-bottom: 28rpx;
}

// 表单内隐私协议
.privacy-section-inline {
	margin-bottom: 24rpx;
}

.checkbox-label-inline {
	display: flex;
	align-items: center; /* 改为center，确保垂直居中 */
	gap: 12rpx;
}

.custom-checkbox-inline {
	flex-shrink: 0;
	/* 移除margin-top，让checkbox自然居中 */
}

.privacy-text-inline {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4rpx;
	line-height: 1.6;
}

.text-normal-inline {
	font-size: 24rpx;
	color: #8c8c8c;
}

.text-link-inline {
	font-size: 24rpx;
	color: #52C41A;
	font-weight: 500;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #fafafa;
	border-radius: 16rpx;
	padding: 0 28rpx;
	height: 104rpx;
	border: 2rpx solid #f0f0f0;
	transition: all 0.25s ease;
}

.input-wrapper:focus-within {
	background: #fff;
	border-color: #52C41A;
	box-shadow: 0 0 0 6rpx rgba(82, 196, 26, 0.08);
}

.input-icon {
	font-size: 40rpx;
	margin-right: 20rpx;
	flex-shrink: 0; /* 防止图标被压缩 */
	display: flex;
	align-items: center; /* 确保垂直居中 */
}

.input-icon-img {
	width: 40rpx;
	height: 40rpx;
	margin-right: 20rpx;
	flex-shrink: 0;
	display: block; /* 移除图片底部空隙 */
}

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: #1a1a1a;
	height: 100%;
	display: flex;
	align-items: center; /* 确保输入框内容垂直居中 */
}

.input-placeholder {
	color: #bfbfbf;
}

.eye-icon {
	font-size: 40rpx;
	padding: 0 8rpx;
	flex-shrink: 0; /* 防止图标被压缩 */
	display: flex;
	align-items: center; /* 确保垂直居中 */
}

.eye-icon-img {
	width: 40rpx;
	height: 40rpx;
	padding: 0 8rpx;
	cursor: pointer;
	flex-shrink: 0; /* 防止图标被压缩 */
	display: block; /* 移除图片底部空隙 */
}

.code-btn {
	padding: 16rpx 28rpx;
	background: #52C41A;
	border-radius: 12rpx;
	transition: all 0.25s ease;
}

.code-btn.disabled {
	background: #d9d9d9;
}

.code-btn:active:not(.disabled) {
	transform: scale(0.96);
}

.code-text {
	font-size: 26rpx;
	color: #fff;
	font-weight: 500;
	white-space: nowrap;
}

.register-btn {
	width: 100%;
	height: 104rpx;
	background: #52C41A;
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.25);
	margin-top: 40rpx;
	transition: all 0.25s ease;
}

.register-btn:active {
	transform: scale(0.98);
	opacity: 0.9;
}

.btn-text {
	font-size: 32rpx;
	font-weight: 600;
	color: #FFFFFF;
	letter-spacing: 1rpx;
}

.login-link {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 32rpx;
	gap: 8rpx;
}

.link-text {
	font-size: 28rpx;
	color: #8c8c8c;
}

.link-action {
	font-size: 28rpx;
	color: #52C41A;
	font-weight: 600;
}

// 隐私协议
.privacy-section {
	display: flex;
	align-items: center;
	justify-content: center;
	margin-top: 48rpx;
	gap: 12rpx;
}

.privacy-checkbox {
	display: flex;
	align-items: center;
}

.checkbox-label {
	display: flex;
	align-items: center;
}

.custom-checkbox {
	transform: scale(0.9);
}

.privacy-text {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 6rpx;
}

.text-normal {
	font-size: 26rpx;
	color: rgba(255, 255, 255, 0.9);
}

.text-link {
	font-size: 26rpx;
	color: #FFFFFF;
	font-weight: 600;
	text-decoration: underline;
}
</style>
