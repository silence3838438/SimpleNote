<template>
	<view class="login-page">
		<!-- 沉浸式返回按钮 -->
		<view class="back-button" :style="{ top: (statusBarHeight + 12) + 'px' }" @click="goBack">
			<text class="back-icon">‹</text>
		</view>
		
		<!-- 主内容区 -->
		<view class="content-wrapper" :style="{ paddingTop: (statusBarHeight + 80) + 'px' }">
			<!-- Logo和标题 -->
			<view class="header-section">
				<image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
				<text class="app-name">小獭记账</text>
				<text class="app-slogan">聪明记账，轻松理财</text>
			</view>
			
			<!-- 登录卡片 -->
			<view class="login-card">
				<!-- APP登录 -->
				<!-- #ifdef APP-PLUS -->
				<!-- 账号密码登录表单 -->
				<view class="login-form">
					<view class="form-item">
						<view class="input-wrapper">
							<text class="input-icon">📱</text>
							<input 
								class="form-input" 
								v-model="data.account" 
								placeholder="请输入手机号/账号"
								placeholder-class="input-placeholder"
							/>
						</view>
					</view>
					
					<view class="form-item">
						<view class="input-wrapper">
							<text class="input-icon">🔒</text>
							<input 
								class="form-input" 
								v-model="data.password" 
								:password="!data.showPassword"
								placeholder="请输入密码"
								placeholder-class="input-placeholder"
							/>
							<image 
								class="eye-icon-img" 
								:src="data.showPassword ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png'" 
								@click="togglePassword" 
								mode="aspectFit"
							></image>
						</view>
					</view>
					
					<!-- 记住密码 -->
					<view class="remember-section">
						<checkbox-group @change="onRememberChange">
							<label class="remember-label">
								<checkbox :checked="data.rememberPassword" color="#52C41A" class="remember-checkbox" />
								<text class="remember-text">记住密码</text>
							</label>
						</checkbox-group>
					</view>
					
					<!-- 隐私协议 -->
					<view class="privacy-section-inline">
						<checkbox-group @change="onAgreeChange">
							<label class="checkbox-label-inline">
								<checkbox :checked="data.agreed" color="#52C41A" class="custom-checkbox-inline" />
								<view class="privacy-text-inline">
									<text class="text-normal-inline">登录即表示同意</text>
									<text class="text-link-inline" @click.stop="openUserAgreement">《用户协议》</text>
									<text class="text-normal-inline">和</text>
									<text class="text-link-inline" @click.stop="openPrivacy">《隐私政策》</text>
								</view>
							</label>
						</checkbox-group>
					</view>
					
					<view class="form-actions">
						<text class="action-link" @click="goToRegister">注册账号</text>
						<text class="action-link" @click="goToForgotPassword">忘记密码？</text>
					</view>
					
					<view class="login-btn primary-btn" @click="accountLogin">
						<text class="btn-text">登录</text>
					</view>
				</view>
				
				<!-- 第三方登录 -->
				<view class="third-party-login" v-if="isIOS">
					<view class="divider">
						<view class="divider-line"></view>
						<text class="divider-text">其他登录方式</text>
						<view class="divider-line"></view>
					</view>
					
					<view class="third-party-btn" @click="appleLogin">
						<image class="third-party-icon-img" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/zm/appleLogo.png" mode="aspectFit"></image>
					</view>
				</view>
				<!-- #endif -->
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import request from '@/utils/request.js'

const data = reactive({
	agreed: true, // 默认勾选隐私协议
	isIOS: false,
	account: '',
	password: '',
	showPassword: false,
	rememberPassword: false
})

onLoad(() => {
	// 检测平台
	// #ifdef APP-PLUS
	const systemInfo = uni.getSystemInfoSync()
	data.isIOS = systemInfo.platform === 'ios'
	// #endif
	
	// 读取保存的账号密码
	const savedAccount = uni.getStorageSync('savedAccount')
	const savedPassword = uni.getStorageSync('savedPassword')
	const rememberPassword = uni.getStorageSync('rememberPassword')
	
	if (rememberPassword && savedAccount && savedPassword) {
		data.account = savedAccount
		data.password = savedPassword
		data.rememberPassword = true
	}
})

// 同意协议变化
const onAgreeChange = (e) => {
	data.agreed = e.detail.value.length > 0
}

// 记住密码变化
const onRememberChange = (e) => {
	data.rememberPassword = e.detail.value.length > 0
}

// 切换密码显示
const togglePassword = () => {
	data.showPassword = !data.showPassword
}

// 账号密码登录
const accountLogin = async () => {
	if (!data.agreed) {
		uni.showToast({
			title: '请先同意隐私政策和用户协议',
			icon: 'none'
		})
		return
	}
	
	if (!data.account || !data.password) {
		uni.showToast({
			title: '请输入账号和密码',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({ title: '登录中...' })
	
	try {
		const result = await request.call('auth/account-login', {
			account: data.account,
			password: data.password
		})
		
		if (result.success) {
			// 保存用户信息
			const userInfo = {
				nickName: result.data?.nickName || data.account,
				avatarUrl: result.data?.avatarUrl || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
				isLogin: true
			}
			
			uni.setStorageSync('userInfo', userInfo)
			uni.setStorageSync('token', result.token)
			
			// 处理记住密码
			if (data.rememberPassword) {
				// 保存账号密码
				uni.setStorageSync('savedAccount', data.account)
				uni.setStorageSync('savedPassword', data.password)
				uni.setStorageSync('rememberPassword', true)
			} else {
				// 清除保存的账号密码
				uni.removeStorageSync('savedAccount')
				uni.removeStorageSync('savedPassword')
				uni.removeStorageSync('rememberPassword')
			}
			
			uni.hideLoading()
			uni.showToast({
				title: '登录成功',
				icon: 'success'
			})
			
			// 返回上一页或首页
			setTimeout(() => {
				uni.navigateBack({
					fail: () => {
						uni.switchTab({ url: '/pages/tab/index/index' })
					}
				})
			}, 1000)
		} else {
			throw new Error(result.message || '登录失败')
		}
	} catch (error) {
		uni.hideLoading()
		console.error('登录失败:', error)
		uni.showToast({
			title: error.message || '登录失败，请重试',
			icon: 'none'
		})
	}
}

// 跳转到注册页面
const goToRegister = () => {
	uni.navigateTo({
		url: '/pages/user/register'
	})
}

// 跳转到忘记密码页面
const goToForgotPassword = () => {
	uni.navigateTo({
		url: '/pages/user/forgot-password'
	})
}

// 微信登录（小程序）
const wechatLogin = () => {
	if (!data.agreed) {
		uni.showToast({
			title: '请先同意隐私政策和用户协议',
			icon: 'none'
		})
		return
	}
	
	// #ifdef MP-WEIXIN
	uni.getUserProfile({
		desc: '用于完善用户资料',
		success: async (res) => {
			uni.showLoading({ title: '登录中...' })
			
			try {
				// 获取微信登录凭证
				const loginRes = await uni.login()
				
				// 准备请求数据
				const requestData = {
					code: loginRes.code,
					nickName: res.userInfo.nickName,
					avatarUrl: res.userInfo.avatarUrl
				}
				
				// 调用后端登录接口
				const result = await request.call('auth/wechat-login', requestData)
				
				if (result.success) {
					// 保存用户信息(优先使用后端返回的数据,后端会从数据库读取老用户的昵称头像)
					const userInfo = {
						nickName: result.data?.nickName || '微信用户',
						avatarUrl: result.data?.avatarUrl || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
						isLogin: true
					}
					
					uni.setStorageSync('userInfo', userInfo)
					uni.setStorageSync('token', result.token)
					
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 返回上一页或首页
					setTimeout(() => {
						uni.navigateBack({
							fail: () => {
								uni.switchTab({ url: '/pages/tab/index/index' })
							}
						})
					}, 1000)
				} else {
					console.error('登录失败: success=false')
					throw new Error(result.message || '登录失败')
				}
			} catch (error) {
				uni.hideLoading()
				console.error('=== 登录异常 ===')
				console.error('错误对象:', error)
				console.error('错误消息:', error.message)
				console.error('错误堆栈:', error.stack)
				
				uni.showModal({
					title: '登录失败',
					content: `错误信息：${error.message || '未知错误'}\n\n请检查网络连接或联系管理员`,
					showCancel: false
				})
			}
		},
		fail: (err) => {
			console.error('获取用户信息失败:', err)
			uni.showToast({
				title: '获取用户信息失败',
				icon: 'none'
			})
		}
	})
	// #endif
}

// 微信登录（APP）
const wechatAppLogin = () => {
	if (!data.agreed) {
		uni.showToast({
			title: '请先同意隐私政策和用户协议',
			icon: 'none'
		})
		return
	}
	
	// #ifdef APP-PLUS
	uni.showLoading({ title: '登录中...' })
	
	// 调用微信登录 - 添加scope参数
	uni.login({
		provider: 'weixin',
		scopes: 'snsapi_userinfo', // 明确指定scope
		success: async (loginRes) => {
			// 弹框1：显示获取到的code
			uni.showModal({
				title: '调试1: 获取微信code',
				content: `成功获取code:\n${loginRes.code}`,
				showCancel: false,
				success: async () => {
					try {
						// 调用后端登录接口
						const result = await request.call('auth/wechat-app-login', {
							code: loginRes.code
						})
						
						// 弹框2：显示后端返回结果
						if (result.success) {
							uni.hideLoading()
							
							uni.showModal({
								title: '调试2: 后端返回成功',
								content: `success: true\ntoken: ${result.token ? '已获取' : '无'}\nnickName: ${result.data?.nickName || '无'}`,
								showCancel: false,
								success: () => {
									// 保存用户信息
									const userInfo = {
										nickName: result.data?.nickName || '微信用户',
										avatarUrl: result.data?.avatarUrl || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
										isLogin: true
									}
									
									uni.setStorageSync('userInfo', userInfo)
									uni.setStorageSync('token', result.token)
									
									uni.showToast({
										title: '登录成功',
										icon: 'success'
									})
									
									// 返回上一页或首页
									setTimeout(() => {
										uni.navigateBack({
											fail: () => {
												uni.switchTab({ url: '/pages/tab/index/index' })
											}
										})
									}, 1000)
								}
							})
						} else {
							uni.hideLoading()
							console.error('❌ 登录失败: success=false')
							console.error('❌ 错误消息:', result.message)
							
							// 弹框2：显示失败信息
							uni.showModal({
								title: '调试2: 后端返回失败',
								content: `success: false\n错误消息:\n${result.message || '无错误消息'}`,
								showCancel: false
							})
						}
					} catch (error) {
						uni.hideLoading()
						console.error('=== 登录异常 ===')
						console.error('错误类型:', typeof error)
						console.error('错误对象:', error)
						console.error('错误消息:', error.message)
						
						// 弹框：显示异常信息
						uni.showModal({
							title: '调试: 请求异常',
							content: `异常类型: ${typeof error}\n错误消息:\n${error.message || '未知错误'}\n\n请截图发给开发者`,
							showCancel: false
						})
					}
				}
			})
		},
		fail: (err) => {
			uni.hideLoading()
			console.error('=== uni.login调用失败 ===')
			console.error('错误对象:', err)
			console.error('错误消息:', err.errMsg)
			console.error('错误码:', err.errCode)
			
			// 根据错误码给出更友好的提示
			let errorMsg = err.errMsg || '未知错误'
			let errorDetail = ''
			
			if (err.errMsg && err.errMsg.includes('10005')) {
				errorMsg = '微信登录权限配置错误'
				errorDetail = '错误码10005：应用未获得该接口权限\n\n可能原因：\n1. 微信开放平台应用未审核通过\n2. AppID配置错误\n3. 应用权限未开通\n\n请联系管理员检查配置'
			} else if (err.errMsg && err.errMsg.includes('General errors')) {
				errorMsg = '微信SDK调用失败'
				errorDetail = '这是微信SDK返回的通用错误\n\n建议：\n1. 检查网络连接\n2. 重新安装APP\n3. 联系管理员'
			}
			
			// 弹框：显示uni.login失败信息
			uni.showModal({
				title: errorMsg,
				content: errorDetail || `错误消息:\n${err.errMsg || '未知错误'}\n\n这是微信SDK返回的错误\n请截图发给开发者`,
				showCancel: false
			})
		}
	})
	// #endif
}

// 手机号登录
const phoneLogin = () => {
	// 已废弃，使用账号密码登录
	uni.showToast({
		title: '请使用账号密码登录',
		icon: 'none'
	})
}

// Apple登录
const appleLogin = () => {
	if (!data.agreed) {
		uni.showToast({
			title: '请先同意隐私政策和用户协议',
			icon: 'none'
		})
		return
	}
	
	// #ifdef APP-PLUS
	uni.showLoading({ title: '登录中...' })
	
	// 调用Apple登录
	uni.login({
		provider: 'apple',
		success: async (loginRes) => {
			try {
				// 调用后端登录接口
				const result = await request.call('auth/apple-login', {
					identityToken: loginRes.identityToken,
					user: loginRes.user
				})
				
				if (result.success) {
					// 保存用户信息
					uni.setStorageSync('userInfo', {
						nickName: result.data?.nickName || 'Apple用户',
						avatarUrl: result.data?.avatarUrl || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
						isLogin: true
					})
					uni.setStorageSync('token', result.token)
					
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 返回上一页或首页
					setTimeout(() => {
						uni.navigateBack({
							fail: () => {
								uni.switchTab({ url: '/pages/tab/index/index' })
							}
						})
					}, 1000)
				} else {
					throw new Error(result.message || '登录失败')
				}
			} catch (error) {
				uni.hideLoading()
				console.error('Apple登录失败:', error)
				uni.showToast({
					title: error.message || '登录失败，请重试',
					icon: 'none'
				})
			}
		},
		fail: (err) => {
			uni.hideLoading()
			console.error('Apple登录失败:', err)
			uni.showToast({
				title: '登录失败',
				icon: 'none'
			})
		}
	})
	// #endif
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

// 稍后登录（延迟登录）
const laterLogin = () => {
	// 不设置任何用户信息，让页面自然显示未登录状态
	// 返回上一页或首页
	uni.navigateBack({
		fail: () => {
			uni.switchTab({ url: '/pages/tab/index/index' })
		}
	})
}

const isIOS = computed(() => data.isIOS)

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
.login-page {
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
	margin-bottom: 64rpx;
}

.app-logo {
	width: 120rpx;
	height: 120rpx;
	border-radius: 24rpx;
	box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06);
	margin-bottom: 24rpx;
	background: #fff;
}

.app-name {
	font-size: 40rpx;
	font-weight: 600;
	color: #1A1A1A;
	margin-bottom: 8rpx;
	letter-spacing: 0.5rpx;
}

.app-slogan {
	font-size: 24rpx;
	color: #999999;
	font-weight: 400;
}

// 登录卡片 - 添加白色背景增加层次感
.login-card {
	width: 100%;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 48rpx 40rpx;
	box-shadow: 0 2rpx 20rpx rgba(0, 0, 0, 0.04);
}

.card-title {
	font-size: 44rpx;
	font-weight: 700;
	color: #1a1a1a;
	display: block;
	margin-bottom: 16rpx;
}

.card-subtitle {
	font-size: 28rpx;
	color: #8c8c8c;
	display: block;
	margin-bottom: 48rpx;
}

// 登录按钮
.login-buttons {
	display: flex;
	flex-direction: column;
	gap: 20rpx;
	margin-top: 16rpx; /* 增加顶部间距，让按钮往下移 */
}

.login-btn {
	width: 100%;
	height: 96rpx;
	border-radius: 12rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.2s ease;
	border: none;
	padding: 0;
	position: relative;
	overflow: hidden;
}

.login-btn:active {
	transform: scale(0.985);
	opacity: 0.85;
}

.primary-btn {
	background: #52C41A;
	box-shadow: none;
}

.secondary-btn {
	background: #000000;
	box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.3);
}

.btn-content {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.btn-icon {
	font-size: 36rpx;
}

.btn-text {
	font-size: 32rpx;
	font-weight: 500;
	color: #FFFFFF;
	letter-spacing: 0.5rpx;
}

// 登录表单
.login-form {
	width: 100%;
}

.form-item {
	margin-bottom: 32rpx;
}

// 表单内隐私协议
.privacy-section-inline {
	margin-bottom: 16rpx;
}

// 记住密码
.remember-section {
	margin-bottom: 24rpx;
	margin-top: -8rpx;
}

.remember-label {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.remember-checkbox {
	transform: scale(0.85);
}

.remember-text {
	font-size: 24rpx;
	color: #666666;
}

.checkbox-label-inline {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.custom-checkbox-inline {
	flex-shrink: 0;
	transform: scale(0.85);
}

.privacy-text-inline {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4rpx;
	line-height: 1.5;
}

.text-normal-inline {
	font-size: 22rpx;
	color: #999999;
}

.text-link-inline {
	font-size: 22rpx;
	color: #52C41A;
	font-weight: 400;
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

.form-input {
	flex: 1;
	font-size: 30rpx;
	color: #1A1A1A;
	height: 100%;
}

.input-placeholder {
	color: #C0C0C0;
}

.eye-icon {
	font-size: 36rpx;
	padding: 0 8rpx;
	cursor: pointer;
}

.eye-icon-img {
	width: 40rpx;
	height: 40rpx;
	padding: 0 8rpx;
	cursor: pointer;
}

.form-actions {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: 48rpx;
	margin-top: 8rpx;
}

.action-link {
	font-size: 26rpx;
	color: #52C41A;
	font-weight: 400;
}

// 第三方登录
.third-party-login {
	display: flex;
	justify-content: center;
	gap: 48rpx;
	margin-bottom: 0;
}

.third-party-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
	padding: 16rpx;
	transition: all 0.2s;
}

.third-party-btn:active {
	transform: scale(0.92);
	opacity: 0.7;
}

.third-party-icon {
	font-size: 48rpx;
	width: 88rpx;
	height: 88rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #F7F7F7;
	border-radius: 50%;
}

.third-party-icon-img {
	width: 88rpx;
	height: 88rpx;
	border-radius: 50%;
}

.third-party-text {
	font-size: 24rpx;
	color: #666;
}

// 稍后登录按钮
.later-login-section {
	display: flex;
	justify-content: center;
	margin-top: 16rpx;
}

.later-login-text {
	font-size: 26rpx;
	color: #BFBFBF;
	padding: 12rpx 24rpx;
}

// 分割线
.divider {
	display: flex;
	align-items: center;
	gap: 20rpx;
	margin: 48rpx 0 32rpx;
}

.divider-line {
	flex: 1;
	height: 1rpx;
	background: #E5E5E5;
}

.divider-text {
	font-size: 24rpx;
	color: #CCCCCC;
}

// 卡片内隐私协议
.privacy-section-card {
	margin-bottom: 24rpx;
	padding: 16rpx 0;
}

.checkbox-label-card {
	display: flex;
	align-items: flex-start;
	gap: 12rpx;
}

.custom-checkbox-card {
	flex-shrink: 0;
	margin-top: 4rpx;
}

.privacy-text-card {
	display: flex;
	align-items: center;
	flex-wrap: wrap;
	gap: 4rpx;
	line-height: 1.6;
}

.text-normal-card {
	font-size: 24rpx;
	color: #8c8c8c;
}

.text-link-card {
	font-size: 24rpx;
	color: #52C41A;
	font-weight: 500;
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
	font-size: 24rpx;
	color: #8C8C8C;
}

.text-link {
	font-size: 24rpx;
	color: #52C41A;
	font-weight: 600;
}
</style>
