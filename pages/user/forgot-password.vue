<template>
	<view class="forgot-page">
		<!-- 沉浸式返回按钮 -->
		<view class="back-button" :style="{ top: (statusBarHeight + 12) + 'px' }" @click="goBack">
			<text class="back-icon">‹</text>
		</view>
		
		<!-- 主内容区 -->
		<view class="content-wrapper" :style="{ paddingTop: (statusBarHeight + 80) + 'px' }">
			<!-- 头部 -->
			<view class="header-section">
				<text class="page-title">忘记密码</text>
				<text class="page-subtitle">通过手机号重置密码</text>
			</view>
			
			<!-- 重置密码表单 -->
			<view class="forgot-card">
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
						<image class="input-icon-img" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/yanzhengma.png" mode="aspectFit"></image>
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
							v-model="data.newPassword" 
							:password="!data.showPassword"
							placeholder="请设置新密码（6-20位）"
							placeholder-class="input-placeholder"
							maxlength="20"
						/>
						<image 
							class="eye-icon-img" 
							:src="data.showPassword ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png'"
							@click="togglePassword"
						/>
					</view>
				</view>
				
				<view class="form-item">
					<view class="input-wrapper">
						<text class="input-icon input-icon-small">✅</text>
						<input 
							class="form-input" 
							v-model="data.confirmPassword" 
							:password="!data.showConfirmPassword"
							placeholder="请再次输入新密码"
							placeholder-class="input-placeholder"
							maxlength="20"
						/>
						<image 
							class="eye-icon-img" 
							:src="data.showConfirmPassword ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png'"
							@click="toggleConfirmPassword"
						/>
					</view>
				</view>
				
				<view class="reset-btn" @click="handleReset">
					<text class="btn-text">重置密码</text>
				</view>
				
				<view class="login-link">
					<text class="link-text">想起密码了？</text>
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
	newPassword: '',
	confirmPassword: '',
	showPassword: false,
	showConfirmPassword: false,
	countdown: 0
})

// 切换密码显示
const togglePassword = () => {
	data.showPassword = !data.showPassword
}

const toggleConfirmPassword = () => {
	data.showConfirmPassword = !data.showConfirmPassword
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
			type: 'reset'
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

// 重置密码
const handleReset = async () => {
	if (!data.phone || !data.code || !data.newPassword || !data.confirmPassword) {
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
	
	if (data.newPassword.length < 6 || data.newPassword.length > 20) {
		uni.showToast({
			title: '密码长度为6-20位',
			icon: 'none'
		})
		return
	}
	
	if (data.newPassword !== data.confirmPassword) {
		uni.showToast({
			title: '两次密码输入不一致',
			icon: 'none'
		})
		return
	}
	
	try {
		uni.showLoading({ title: '重置中...' })
		
		const result = await request.call('auth/reset-password', {
			phone: data.phone,
			code: data.code,
			newPassword: data.newPassword
		})
		
		uni.hideLoading()
		
		if (result.success) {
			uni.showToast({
				title: '密码重置成功',
				icon: 'success'
			})
			
			// 跳转到登录页面
			setTimeout(() => {
				uni.navigateBack()
			}, 1000)
		} else {
			throw new Error(result.message || '重置失败')
		}
	} catch (error) {
		uni.hideLoading()
		uni.showToast({
			title: error.message || '重置失败',
			icon: 'none'
		})
	}
}

// 跳转到登录页面
const goToLogin = () => {
	uni.navigateBack()
}

// 获取状态栏高度
const statusBarHeight = uni.getSystemInfoSync().statusBarHeight || 0

// 返回上一页
const goBack = () => {
	uni.navigateBack({
		fail: () => {
			uni.switchTab({ url: '/pages/tab/index/index' })
		}
	})
}
</script>

<style lang="scss" scoped>
.forgot-page {
	min-height: 100vh;
	background: #F5F5F5;
	position: relative;
}

// 沉浸式返回按钮
.back-button {
	position: fixed;
	left: 32rpx;
	width: 72rpx;
	height: 72rpx;
	background: rgba(255, 255, 255, 0.9);
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 999;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.08);
	backdrop-filter: blur(10rpx);
	transition: all 0.2s;
}

.back-button:active {
	transform: scale(0.92);
	background: rgba(255, 255, 255, 1);
}

.back-icon {
	font-size: 52rpx;
	color: #1A1A1A;
	font-weight: 300;
	margin-left: -4rpx;
}

// 主内容区
.content-wrapper {
	padding: 32rpx 64rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
}

// 头部区域
.header-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 48rpx;
}

.page-title {
	font-size: 40rpx;
	font-weight: 600;
	color: #1A1A1A;
	margin-bottom: 8rpx;
	letter-spacing: 0.5rpx;
}

.page-subtitle {
	font-size: 24rpx;
	color: #999999;
	font-weight: 400;
}

// 重置密码卡片 - 添加白色背景增加层次感
.forgot-card {
	width: 100%;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 48rpx 40rpx;
	box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.04);
}

.form-item {
	margin-bottom: 32rpx;
}

.input-wrapper {
	display: flex;
	align-items: center;
	background: #FAFAFA;
	border-radius: 12rpx;
	padding: 0 24rpx;
	height: 88rpx;
	border: 1rpx solid #F0F0F0;
	transition: all 0.3s ease;
}

.input-wrapper:focus-within {
	background: #FFFFFF;
	border-color: #52C41A;
	box-shadow: 0 0 0 4rpx rgba(82, 196, 26, 0.06);
}

.input-icon {
	font-size: 40rpx;
	margin-right: 16rpx;
	opacity: 0.6;
}

.input-icon-small {
	font-size: 32rpx;
}

.input-icon-img {
	width: 40rpx;
	height: 40rpx;
	margin-right: 16rpx;
	flex-shrink: 0;
	display: block;
	opacity: 0.6;
}

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: #1A1A1A;
	height: 100%;
}

.input-placeholder {
	color: #C0C0C0;
}

.eye-icon-img {
	width: 40rpx;
	height: 40rpx;
	display: block;
	flex-shrink: 0;
	opacity: 0.5;
}

.code-btn {
	padding: 12rpx 24rpx;
	background: #52C41A;
	border-radius: 8rpx;
	transition: all 0.2s ease;
}

.code-btn.disabled {
	background: #E5E5E5;
}

.code-btn:active:not(.disabled) {
	transform: scale(0.95);
	opacity: 0.85;
}

.code-text {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: 400;
	white-space: nowrap;
}

.code-btn.disabled .code-text {
	color: #999999;
}

.reset-btn {
	width: 100%;
	height: 96rpx;
	background: #52C41A;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: none;
	margin-top: 48rpx;
	transition: all 0.2s ease;
}

.reset-btn:active {
	transform: scale(0.985);
	opacity: 0.85;
}

.btn-text {
	font-size: 32rpx;
	font-weight: 500;
	color: #FFFFFF;
	letter-spacing: 0.5rpx;
}

.login-link {
	display: flex;
	justify-content: center;
	align-items: center;
	margin-top: 32rpx;
	gap: 8rpx;
}

.link-text {
	font-size: 26rpx;
	color: #999999;
}

.link-action {
	font-size: 26rpx;
	color: #52C41A;
	font-weight: 400;
}
</style>
