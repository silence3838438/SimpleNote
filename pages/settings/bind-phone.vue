<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="navbar-title">绑定手机号</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 44 + 20) + 'px' }">
			<!-- 绑定状态卡片 -->
			<view class="status-card">
				<view class="status-icon" :class="{ 'bound': data.isBound }">
					<text class="icon-text">{{ data.isBound ? '✓' : '📱' }}</text>
				</view>
				<text class="status-title">{{ data.isBound ? '已绑定手机号' : '未绑定手机号' }}</text>
				<text class="status-desc" v-if="data.isBound">{{ data.phoneNumber }}</text>
				<text class="status-desc" v-else>绑定手机号后，可在APP端同步数据</text>
			</view>
			
			<!-- 绑定表单 -->
			<view class="form-card" v-if="!data.isBound">
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">手机号</text>
						<text class="label-required">*</text>
					</view>
					<input 
						class="form-input" 
						v-model="data.phone"
						type="number"
						maxlength="11"
						placeholder="请输入手机号"
						placeholder-class="input-placeholder"
					/>
				</view>
				
				<view class="form-item">
					<view class="form-label">
						<text class="label-text">验证码</text>
						<text class="label-required">*</text>
					</view>
					<view class="code-input-wrapper">
						<input 
							class="form-input code-input" 
							v-model="data.code"
							type="number"
							maxlength="6"
							placeholder="请输入验证码"
							placeholder-class="input-placeholder"
						/>
						<view 
							class="send-code-btn" 
							:class="{ 'disabled': data.countdown > 0 }"
							@click="sendCode"
						>
							<text class="send-code-text">{{ data.countdown > 0 ? `${data.countdown}s` : '发送验证码' }}</text>
						</view>
					</view>
				</view>
				
				<view class="form-tips">
					<text class="tip-item">• 绑定手机号后，可在APP端使用同一手机号登录</text>
					<text class="tip-item">• 如果该手机号已在APP注册，账号将自动关联</text>
					<text class="tip-item">• 数据将在小程序和APP之间同步</text>
				</view>
				
				<view class="submit-btn" @click="submitBind">
					<text class="submit-text">确认绑定</text>
				</view>
			</view>
			
			<!-- 已绑定操作 -->
			<view class="action-card" v-else>
				<view class="action-item" @click="showUnbindConfirm">
					<text class="action-text">解绑手机号</text>
					<text class="action-arrow">›</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import request from '@/utils/request.js'

const data = reactive({
	isBound: false,
	phoneNumber: '',
	phone: '',
	code: '',
	countdown: 0
})

// 获取系统信息
const statusBarHeight = ref(0)

const getSystemInfo = () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 0
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 加载绑定状态
const loadBindingStatus = async () => {
	try {
		uni.showLoading({ title: '加载中...' })
		const res = await request.call('account/binding-status', {}, 'GET')
		
		if (res.success && res.data) {
			data.isBound = res.data.hasPhone
			data.phoneNumber = res.data.phone || ''
		}
		
		uni.hideLoading()
	} catch (error) {
		uni.hideLoading()
		console.error('获取绑定状态失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	}
}

// 发送验证码
const sendCode = async () => {
	if (data.countdown > 0) {
		return
	}
	
	// 验证手机号
	if (!data.phone) {
		uni.showToast({
			title: '请输入手机号',
			icon: 'none'
		})
		return
	}
	
	if (!/^1[3-9]\d{9}$/.test(data.phone)) {
		uni.showToast({
			title: '手机号格式不正确',
			icon: 'none'
		})
		return
	}
	
	try {
		uni.showLoading({ title: '发送中...' })
		const res = await request.call('auth/send-code', {
			phone: data.phone,
			type: 'bind'
		})
		
		uni.hideLoading()
		
		if (res.success) {
			uni.showToast({
				title: '验证码已发送',
				icon: 'success'
			})
			
			// 开发环境直接回显验证码到输入框
			if (res.code) {
				data.code = res.code
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
			uni.showToast({
				title: res.message || '发送失败',
				icon: 'none'
			})
		}
	} catch (error) {
		uni.hideLoading()
		console.error('发送验证码失败:', error)
		uni.showToast({
			title: '发送失败',
			icon: 'none'
		})
	}
}

// 提交绑定
const submitBind = async () => {
	// 验证手机号
	if (!data.phone) {
		uni.showToast({
			title: '请输入手机号',
			icon: 'none'
		})
		return
	}
	
	if (!/^1[3-9]\d{9}$/.test(data.phone)) {
		uni.showToast({
			title: '手机号格式不正确',
			icon: 'none'
		})
		return
	}
	
	// 验证验证码
	if (!data.code) {
		uni.showToast({
			title: '请输入验证码',
			icon: 'none'
		})
		return
	}
	
	if (data.code.length !== 6) {
		uni.showToast({
			title: '验证码格式不正确',
			icon: 'none'
		})
		return
	}
	
	try {
		uni.showLoading({ title: '绑定中...' })
		const res = await request.call('account/bind-phone', {
			phone: data.phone,
			code: data.code
		})
		
		uni.hideLoading()
		
		if (res.success) {
			// 如果账号被合并，需要更新token
			if (res.merged && res.token) {
				uni.setStorageSync('token', res.token)
				uni.showModal({
					title: '账号已关联',
					content: '您的小程序账号已与APP账号成功关联，数据将自动同步',
					showCancel: false,
					success: () => {
						uni.navigateBack()
					}
				})
			} else {
				uni.showToast({
					title: '绑定成功',
					icon: 'success'
				})
				setTimeout(() => {
					uni.navigateBack()
				}, 1500)
			}
		} else {
			uni.showToast({
				title: res.message || '绑定失败',
				icon: 'none'
			})
		}
	} catch (error) {
		uni.hideLoading()
		console.error('绑定失败:', error)
		uni.showToast({
			title: '绑定失败',
			icon: 'none'
		})
	}
}

// 显示解绑确认
const showUnbindConfirm = () => {
	uni.showModal({
		title: '确认解绑',
		content: '解绑后，您需要至少保留一种登录方式。确定要解绑手机号吗？',
		confirmText: '确认解绑',
		cancelText: '取消',
		confirmColor: '#FF4D4F',
		success: async (res) => {
			if (res.confirm) {
				await unbindPhone()
			}
		}
	})
}

// 解绑手机号
const unbindPhone = async () => {
	try {
		uni.showLoading({ title: '解绑中...' })
		const res = await request.call('account/unbind-phone')
		
		uni.hideLoading()
		
		if (res.success) {
			uni.showToast({
				title: '解绑成功',
				icon: 'success'
			})
			setTimeout(() => {
				loadBindingStatus()
			}, 1500)
		} else {
			uni.showToast({
				title: res.message || '解绑失败',
				icon: 'none'
			})
		}
	} catch (error) {
		uni.hideLoading()
		console.error('解绑失败:', error)
		uni.showToast({
			title: '解绑失败',
			icon: 'none'
		})
	}
}

onLoad(async () => {
	// 小程序端检查配置
	// #ifdef MP-WEIXIN
	try {
		const res = await request.call('config/public', {}, 'GET')
		if (res.success && res.data) {
			// 统一使用show_ai_advisor_wechat字段判断
			const showFeature = res.data.show_ai_advisor_wechat || false
			if (!showFeature) {
				uni.showModal({
					title: '功能提示',
					content: '此功能暂未开放，敬请期待',
					showCancel: false,
					success: () => {
						uni.navigateBack()
					}
				})
				return
			}
		}
	} catch (error) {
		console.error('加载配置失败:', error)
		// 配置加载失败，默认不允许访问
		uni.showModal({
			title: '功能提示',
			content: '此功能暂未开放，敬请期待',
			showCancel: false,
			success: () => {
				uni.navigateBack()
			}
		})
		return
	}
	// #endif
	
	getSystemInfo()
	loadBindingStatus()
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	min-height: 100vh;
	background: $bg-light;
}

/* 自定义导航栏 */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: $bg-white;
	border-bottom: 1rpx solid $border-light;
	z-index: 1000;
}

.navbar-content {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-lg;
}

.navbar-left {
	width: 80rpx;
	display: flex;
	align-items: center;
}

.back-icon {
	font-size: 48rpx;
	color: $text-primary;
	font-weight: $font-weight-light;
	line-height: 1;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.navbar-right {
	width: 80rpx;
}

.container {
	min-height: 100vh;
	padding: 40rpx $spacing-lg 100rpx;
}

/* 绑定状态卡片 */
.status-card {
	background: $bg-white;
	border-radius: $radius-lg;
	padding: 60rpx $spacing-xl;
	margin-bottom: $spacing-lg;
	display: flex;
	flex-direction: column;
	align-items: center;
	box-shadow: $shadow-card;
}

.status-icon {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	background: linear-gradient(135deg, #E8E8E8 0%, #F0F0F0 100%);
	display: flex;
	align-items: center;
	justify-content: center;
	margin-bottom: $spacing-lg;
}

.status-icon.bound {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.icon-text {
	font-size: 60rpx;
}

.status-title {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $spacing-sm;
}

.status-desc {
	font-size: $font-size-base;
	color: $text-secondary;
	text-align: center;
	line-height: 1.6;
}

/* 表单卡片 */
.form-card {
	background: $bg-white;
	border-radius: $radius-lg;
	padding: $spacing-xl;
	box-shadow: $shadow-card;
}

.form-item {
	margin-bottom: $spacing-xl;
}

.form-label {
	display: flex;
	align-items: center;
	margin-bottom: $spacing-sm;
}

.label-text {
	font-size: $font-size-base;
	color: $text-primary;
	font-weight: $font-weight-medium;
}

.label-required {
	font-size: $font-size-base;
	color: #FF4D4F;
	margin-left: 4rpx;
}

.form-input {
	width: 100%;
	height: 88rpx;
	background: $bg-light;
	border-radius: $radius-md;
	padding: 0 $spacing-lg;
	font-size: $font-size-lg;
	color: $text-primary;
	border: 2rpx solid transparent;
	transition: all $transition-fast;
}

.form-input:focus {
	background: $bg-white;
	border-color: $primary-color;
}

.input-placeholder {
	color: $text-tertiary;
}

.code-input-wrapper {
	display: flex;
	align-items: center;
	gap: $spacing-md;
}

.code-input {
	flex: 1;
}

.send-code-btn {
	flex-shrink: 0;
	padding: 0 $spacing-lg;
	height: 88rpx;
	background: $gradient-primary;
	border-radius: $radius-md;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-sm;
	transition: all $transition-fast;
}

.send-code-btn.disabled {
	background: $bg-light;
	box-shadow: none;
}

.send-code-btn:active:not(.disabled) {
	transform: scale(0.96);
}

.send-code-text {
	font-size: $font-size-base;
	color: $text-white;
	font-weight: $font-weight-medium;
	white-space: nowrap;
}

.send-code-btn.disabled .send-code-text {
	color: $text-tertiary;
}

.form-tips {
	padding: $spacing-lg;
	background: linear-gradient(135deg, #F0FFF4 0%, #F8FFF9 100%);
	border-radius: $radius-md;
	border-left: 4rpx solid $primary-color;
	margin-bottom: $spacing-xl;
}

.tip-item {
	display: block;
	font-size: $font-size-sm;
	color: $text-secondary;
	line-height: 2;
}

.submit-btn {
	width: 100%;
	height: 96rpx;
	background: $gradient-primary;
	border-radius: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-md;
	transition: all $transition-fast;
}

.submit-btn:active {
	transform: scale(0.98);
}

.submit-text {
	font-size: $font-size-lg;
	color: $text-white;
	font-weight: $font-weight-bold;
}

/* 操作卡片 */
.action-card {
	background: $bg-white;
	border-radius: $radius-lg;
	padding: $spacing-lg;
	box-shadow: $shadow-card;
}

.action-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-lg;
	border-radius: $radius-md;
	transition: all $transition-fast;
}

.action-item:active {
	background: $bg-light;
	transform: scale(0.98);
}

.action-text {
	font-size: $font-size-lg;
	color: #FF4D4F;
	font-weight: $font-weight-medium;
}

.action-arrow {
	font-size: $font-size-3xl;
	color: $text-tertiary;
	font-weight: $font-weight-light;
}
</style>
