<template>
	<view class="login-page">
		<!-- 背景装饰 -->
		<view class="bg-decoration">
			<view class="circle circle-1"></view>
			<view class="circle circle-2"></view>
			<view class="circle circle-3"></view>
		</view>
		
		<!-- 主内容区 -->
		<view class="content-wrapper">
			<!-- Logo和标题 -->
			<view class="header-section">
				<image class="app-logo" src="/static/logo.png" mode="aspectFit"></image>
				<text class="app-name">钱哪去了</text>
				<text class="app-slogan">让每一笔支出都清晰可见</text>
			</view>
			
			<!-- 登录卡片 -->
			<view class="login-card">
				<text class="card-title">欢迎回来</text>
				<text class="card-subtitle">选择你喜欢的方式登录</text>
				
				<!-- 微信小程序登录 -->
				<!-- #ifdef MP-WEIXIN -->
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
				
				<view class="login-buttons">
					<button class="login-btn primary-btn" open-type="getUserProfile" @click="wechatLogin">
						<view class="btn-content">
							<text class="btn-text">一键登录</text>
						</view>
					</button>
				</view>
				<!-- #endif -->
				
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
								:src="data.showPassword ? '/static/mingwen.png' : '/static/miwen.png'" 
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
				
				<!-- 分割线 -->
				<!-- #ifndef APP-PLUS -->
				<view class="divider">
					<view class="divider-line"></view>
					<text class="divider-text">其他登录方式</text>
					<view class="divider-line"></view>
				</view>
				<!-- #endif -->
				
				<!-- 第三方登录 -->
				<view class="third-party-login">
					<!-- 暂时隐藏微信登录按钮，等认证通过后再启用 -->
					<!-- <view class="third-party-btn" @click="wechatAppLogin">
						<image class="third-party-icon-img" src="/static/weixinhaoyou.png" mode="aspectFit"></image>
					</view> -->
					
					<view class="third-party-btn" @click="appleLogin" v-if="isIOS">
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
				console.log('=== 微信登录流程开始 ===')
				console.log('1. 获取到微信code:', loginRes.code)
				console.log('2. 用户信息:', res.userInfo)
				
				// 准备请求数据
				const requestData = {
					code: loginRes.code,
					nickName: res.userInfo.nickName,
					avatarUrl: res.userInfo.avatarUrl
				}
				console.log('3. 准备发送的数据:', requestData)
				console.log('4. 请求URL: https://api.qiannaqule.top/api/auth/wechat-login')
				
				// 调用后端登录接口
				const result = await request.call('auth/wechat-login', requestData)
				
				console.log('5. 后端返回结果:', result)
				
				if (result.success) {
					// 保存用户信息(优先使用后端返回的数据,后端会从数据库读取老用户的昵称头像)
					const userInfo = {
						nickName: result.data?.nickName || '微信用户',
						avatarUrl: result.data?.avatarUrl || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
						isLogin: true
					}
					
					console.log('6. 保存用户信息:', userInfo)
					console.log('7. 保存token:', result.token)
					
					uni.setStorageSync('userInfo', userInfo)
					uni.setStorageSync('token', result.token)
					
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					console.log('=== 登录成功 ===')
					
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
			console.log('=== APP微信登录流程开始 ===')
			console.log('1. 获取到微信code:', loginRes.code)
			console.log('1.1 完整登录响应:', JSON.stringify(loginRes))
			
			// 弹框1：显示获取到的code
			uni.showModal({
				title: '调试1: 获取微信code',
				content: `成功获取code:\n${loginRes.code}`,
				showCancel: false,
				success: async () => {
					try {
						// 调用后端登录接口
						console.log('2. 准备调用后端接口: auth/wechat-app-login')
						console.log('2.1 请求参数:', { code: loginRes.code })
						
						const result = await request.call('auth/wechat-app-login', {
							code: loginRes.code
						})
						
						console.log('3. 后端返回结果:', JSON.stringify(result))
						
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
									
									console.log('4. 保存用户信息:', userInfo)
									console.log('5. 保存token:', result.token)
									
									uni.setStorageSync('userInfo', userInfo)
									uni.setStorageSync('token', result.token)
									
									uni.showToast({
										title: '登录成功',
										icon: 'success'
									})
									
									console.log('=== 登录成功 ===')
									
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
		url: '/pages/webview/webview?url=' + encodeURIComponent('https://api.qiannaqule.top/privacy.html')
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
		url: '/pages/webview/webview?url=' + encodeURIComponent('https://api.qiannaqule.top/user-agreement.html')
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
</script>

<style lang="scss" scoped>
.login-page {
	min-height: 100vh;
	background: linear-gradient(180deg, #52C41A 0%, #73D13D 100%);
	position: relative;
	overflow: hidden;
	display: flex;
	align-items: center;
	justify-content: center;
	padding: 80rpx 80rpx 60rpx;
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
	max-width: 640rpx;
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-top: -100rpx;
}

// 头部区域
.header-section {
	display: flex;
	flex-direction: column;
	align-items: center;
	margin-bottom: 56rpx;
	animation: fadeInDown 0.5s ease-out;
}

@keyframes fadeInDown {
	from {
		opacity: 0;
		transform: translateY(-20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.app-logo {
	width: 128rpx;
	height: 128rpx;
	border-radius: 32rpx;
	box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.15);
	margin-bottom: 32rpx;
	background: #fff;
}

.app-name {
	font-size: 56rpx;
	font-weight: 700;
	color: #FFFFFF;
	margin-bottom: 16rpx;
	letter-spacing: 1rpx;
}

.app-slogan {
	font-size: 28rpx;
	color: rgba(255, 255, 255, 0.9);
	font-weight: 400;
}

// 登录卡片
.login-card {
	width: 100%;
	background: #FFFFFF;
	border-radius: 24rpx;
	padding: 56rpx 48rpx 48rpx;
	box-shadow: 0 8rpx 32rpx rgba(0, 0, 0, 0.08);
	animation: fadeInUp 0.5s ease-out 0.15s both;
}

@keyframes fadeInUp {
	from {
		opacity: 0;
		transform: translateY(20rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
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
	height: 92rpx; /* 减小高度，从104rpx改为92rpx */
	border-radius: 16rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all 0.25s ease;
	border: none;
	padding: 0;
	position: relative;
	overflow: hidden;
}

.login-btn:active {
	transform: scale(0.98);
	opacity: 0.9;
}

.primary-btn {
	background: #52C41A;
	box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.25);
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
	font-size: 30rpx;
	font-weight: 600;
	color: #FFFFFF;
	letter-spacing: 1rpx;
}

// 登录表单
.login-form {
	width: 100%;
}

.form-item {
	margin-bottom: 24rpx; /* 恢复原来的间距 */
}

// 表单内隐私协议
.privacy-section-inline {
	margin-bottom: 24rpx; /* 恢复原来的间距 */
}

// 记住密码
.remember-section {
	margin-bottom: 20rpx; /* 恢复原来的间距 */
}

.remember-label {
	display: flex;
	align-items: center;
	gap: 8rpx;
}

.remember-checkbox {
	transform: scale(0.9);
}

.remember-text {
	font-size: 26rpx;
	color: #666;
}

.checkbox-label-inline {
	display: flex;
	align-items: center; /* 改为center，让单选框和文字垂直居中对齐 */
	gap: 12rpx;
}

.custom-checkbox-inline {
	flex-shrink: 0;
	transform: scale(0.9); /* 和记住密码的单选框大小一致 */
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
	height: 92rpx; /* 减小高度，从104rpx改为92rpx，和登录按钮一致 */
	border: 2rpx solid #f0f0f0;
	transition: all 0.25s ease;
}

.input-wrapper:focus-within {
	background: #fff;
	border-color: #52C41A;
	box-shadow: 0 0 0 6rpx rgba(82, 196, 26, 0.08);
}

.input-icon {
	font-size: 36rpx;
	margin-right: 16rpx;
}

.form-input {
	flex: 1;
	font-size: 28rpx;
	color: #1a1a1a;
	height: 100%;
}

.input-placeholder {
	color: #999;
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
	margin-bottom: 32rpx; /* 恢复原来的间距 */
}

.action-link {
	font-size: 26rpx;
	color: #52C41A;
	font-weight: 500;
}

// 第三方登录
.third-party-login {
	display: flex;
	justify-content: center;
	gap: 40rpx;
	margin-bottom: 16rpx; /* 减小间距，从24rpx改为16rpx */
}

.third-party-btn {
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 12rpx;
	padding: 20rpx;
	transition: all 0.3s;
}

.third-party-btn:active {
	transform: scale(0.95);
}

.third-party-icon {
	font-size: 48rpx;
	width: 80rpx;
	height: 80rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: #f8f9fa;
	border-radius: 50%;
}

.third-party-icon-img {
	width: 80rpx;
	height: 80rpx;
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
	color: #999999; /* 改为浅灰色，和其他登录方式文字颜色一样 */
	padding: 12rpx 24rpx;
}

// 分割线
.divider {
	display: flex;
	align-items: center;
	gap: 24rpx;
	margin: 32rpx 0 24rpx; /* 优化间距，从40rpx 0 20rpx改为32rpx 0 24rpx */
}

.divider-line {
	flex: 1;
	height: 1rpx;
	background: #e8e8e8;
}

.divider-text {
	font-size: 26rpx;
	color: #bfbfbf;
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
	animation: fadeIn 0.5s ease-out 0.3s both;
}

@keyframes fadeIn {
	from {
		opacity: 0;
	}
	to {
		opacity: 1;
	}
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
	color: rgba(255, 255, 255, 0.85);
}

.text-link {
	font-size: 24rpx;
	color: #FFFFFF;
	font-weight: 600;
	text-decoration: underline;
}
</style>
