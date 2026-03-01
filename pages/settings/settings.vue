<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="navbar-title">系统设置</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56 + 16) + 'px' }">
			<!-- 功能列表 -->
			<view class="function-list">
				<!-- 关于我们 -->
				<view class="function-item" @click="showAbout">
					<view class="function-left">
						<view class="function-icon about-icon">
							<text class="icon-text">ℹ️</text>
						</view>
						<text class="function-title">{{ $t('settings.about') }}</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</view>
				
				<!-- 意见反馈 -->
				<view class="function-item" @click="goToFeedback">
					<view class="function-left">
						<view class="function-icon feedback-icon">
							<text class="icon-text">💬</text>
						</view>
						<text class="function-title">{{ $t('settings.feedback') }}</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</view>
				
				<!-- 联系客服（仅小程序） -->
				<!-- #ifdef MP-WEIXIN -->
				<button class="function-item contact-button" open-type="contact">
					<view class="function-left">
						<view class="function-icon service-icon">
							<text class="icon-text">👨‍💼</text>
						</view>
						<text class="function-title">联系客服</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</button>
				<!-- #endif -->
				
				<!-- 检查更新（仅APP） -->
				<!-- #ifdef APP-PLUS -->
				<view class="function-item" @click="checkAppUpdate">
					<view class="function-left">
						<view class="function-icon update-icon">
							<text class="icon-text">🔄</text>
						</view>
						<text class="function-title">检查更新</text>
					</view>
					<view class="function-right">
						<text class="function-desc">v{{ data.appVersion }}</text>
						<text class="arrow">›</text>
					</view>
				</view>
				<!-- #endif -->
				
				<!-- 绑定手机号（仅APP端且登录后显示） -->
				<!-- #ifdef APP-PLUS -->
				<view class="function-item" @click="goToBindPhone" v-if="data.isLogin">
					<view class="function-left">
						<view class="function-icon phone-icon">
							<text class="icon-text">📱</text>
						</view>
						<text class="function-title">绑定手机号</text>
					</view>
					<view class="function-right">
						<text class="function-desc" v-if="data.phoneNumber">{{ data.phoneNumber }}</text>
						<text class="function-desc inactive" v-else>未绑定</text>
						<text class="arrow">›</text>
					</view>
				</view>
				<!-- #endif -->
				
				<!-- 用户注销（仅登录后显示） -->
				<!-- #ifdef APP-PLUS -->
				<!-- APP端：需要登录才显示 -->
				<view class="function-item danger-item" @click="handleDeleteAccount" v-if="data.isLogin">
					<view class="function-left">
						<view class="function-icon delete-icon">
							<text class="icon-text">⚠️</text>
						</view>
						<text class="function-title danger-text">注销账号</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</view>
				<!-- #endif -->
				<!-- #ifdef MP-WEIXIN -->
				<!-- 小程序端：始终显示注销 -->
				<view class="function-item danger-item" @click="handleDeleteAccount">
					<view class="function-left">
						<view class="function-icon delete-icon">
							<text class="icon-text">⚠️</text>
						</view>
						<text class="function-title danger-text">注销账号</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</view>
				<!-- #endif -->
			</view>
			
			<!-- 注销说明 -->
			<!-- #ifdef APP-PLUS -->
			<!-- APP端：仅登录后显示 -->
			<view class="warning-tips" v-if="data.isLogin">
				<text class="warning-title">⚠️ 注销账号说明</text>
				<text class="warning-item">• 注销后将清除所有账单数据</text>
				<text class="warning-item">• 注销后将清除所有积分记录</text>
				<text class="warning-item">• 注销操作不可恢复，请谨慎操作</text>
			</view>
			<!-- #endif -->
			<!-- #ifdef MP-WEIXIN -->
			<!-- 小程序端：始终显示 -->
			<view class="warning-tips">
				<text class="warning-title">⚠️ 注销账号说明</text>
				<text class="warning-item">• 注销后将清除所有账单数据</text>
				<text class="warning-item">• 注销后将清除所有积分记录</text>
				<text class="warning-item">• 注销操作不可恢复，请谨慎操作</text>
			</view>
			<!-- #endif -->
			
			<!-- 退出登录按钮（仅APP端登录后显示） -->
			<!-- #ifdef APP-PLUS -->
			<view class="logout-button-wrapper" v-if="data.isLogin">
				<view class="logout-button" @click="handleLogout">
					<text class="logout-button-text">退出登录</text>
				</view>
			</view>
			<!-- #endif -->
		</view>
		
		<!-- 版本更新弹窗 -->
		<!-- #ifdef APP-PLUS -->
		<UpdateModal 
			:visible="data.showUpdateModal"
			:newVersion="data.updateInfo.newVersion"
			:currentVersion="data.updateInfo.currentVersion"
			:updateContent="data.updateInfo.updateContent"
			:packageSize="data.updateInfo.packageSize"
			:updateTime="data.updateInfo.updateTime"
			:downloadUrl="data.updateInfo.downloadUrl"
			:isForce="data.updateInfo.isForce"
			:updateType="data.updateInfo.updateType"
			:markets="data.updateInfo.markets"
			@cancel="closeUpdateModal"
			@confirm="handleUpdate"
			@downloadComplete="handleDownloadComplete"
		/>
		<!-- #endif -->
	</view>
</template>

<script setup>
import { reactive, computed, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useI18n } from 'vue-i18n'
import billStorage from '@/utils/billStorage.js'
import request from '@/utils/request.js'
// #ifdef APP-PLUS
import { checkUpdate } from '@/utils/appUpdate.js'
import UpdateModal from '@/components/UpdateModal.vue'
// #endif

const { t, locale } = useI18n()

// 获取状态栏高度
const statusBarHeight = ref(0)
const getSystemInfo = () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 0
}

// 返回上一页
const goBack = () => {
	uni.navigateBack()
}
const data = reactive({
	isLogin: false,
	phoneNumber: '', // 绑定的手机号（脱敏显示）
	appVersion: '',
	showUpdateModal: false,
	updateInfo: {
		newVersion: '',
		currentVersion: '',
		updateContent: [],
		packageSize: '',
		updateTime: '',
		downloadUrl: '',
		isForce: false,
		updateType: 'server',
		markets: {}
	}
})

// 检查登录状态
const checkLogin = () => {
	const userInfo = uni.getStorageSync('userInfo')
	data.isLogin = userInfo && userInfo.isLogin
	
	// 如果已登录，加载手机号
	if (data.isLogin) {
		loadPhoneNumber()
	}
}

// 加载手机号
const loadPhoneNumber = async () => {
	try {
		const res = await request.call('auth/get-phone')
		if (res.success && res.data && res.data.phone) {
			// 脱敏显示手机号
			const phone = res.data.phone
			data.phoneNumber = phone.substring(0, 3) + '****' + phone.substring(7)
		}
	} catch (error) {
		console.error('获取手机号失败:', error)
	}
}

// 跳转到绑定手机号页面
const goToBindPhone = () => {
	uni.navigateTo({
		url: '/pages/settings/bind-phone'
	})
}

// 获取APP版本号
const getAppVersion = () => {
	// #ifdef APP-PLUS
	const appInfo = plus.runtime
	data.appVersion = appInfo.version || '1.0.0'
	// #endif
}

// 检查APP更新
// #ifdef APP-PLUS
const checkAppUpdate = async () => {
	try {
		uni.showLoading({ title: '检查中...' })
		const updateInfo = await checkUpdate()
		uni.hideLoading()
		
		if (updateInfo.hasUpdate) {
			data.updateInfo = updateInfo
			data.showUpdateModal = true
		} else {
			uni.showToast({
				title: '已是最新版本',
				icon: 'success'
			})
		}
	} catch (error) {
		uni.hideLoading()
		console.error('检查更新失败:', error)
		uni.showToast({
			title: '检查更新失败',
			icon: 'none'
		})
	}
}

// 关闭更新弹窗
const closeUpdateModal = () => {
	if (!data.updateInfo.isForce) {
		data.showUpdateModal = false
	}
}

// 确认更新
const handleUpdate = () => {
}

// 下载完成
const handleDownloadComplete = () => {
	data.showUpdateModal = false
}
// #endif

// 关于我们
const showAbout = () => {
	uni.navigateTo({
		url: '/pages/settings/about'
	})
}

// 跳转到意见反馈页面
const goToFeedback = () => {
	uni.navigateTo({
		url: '/pages/settings/feedback'
	})
}

// 退出登录
const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '退出登录后，本地数据将被清除，云端数据已同步保存。确定要退出吗？',
		confirmText: '退出',
		cancelText: '取消',
		confirmColor: '#FF4D4F',
		success: async (res) => {
			if (res.confirm) {
				uni.showLoading({ title: '退出中...' })
				
				try {
					// 1. 先同步本地数据到云端
					try {
						await billStorage.syncToAPI()
					} catch (syncError) {
						console.error('同步数据失败:', syncError)
					}
					
					// 2. 调用后端退出接口
					try {
						await request.call('auth/logout')
					} catch (logoutError) {
						console.error('调用退出接口失败:', logoutError)
					}
					
					// 3. 清除所有本地数据
					uni.removeStorageSync('userInfo')
					uni.removeStorageSync('token')
					uni.removeStorageSync('userPoints')
					uni.removeStorageSync('bills')
					uni.removeStorageSync('pendingLevelUp')
					
					uni.hideLoading()
					uni.showToast({
						title: '已退出登录',
						icon: 'success'
					})
					
					// 4. 返回个人中心页面
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
					
				} catch (error) {
					uni.hideLoading()
					console.error('退出登录失败:', error)
					
					// 即使出错也清除本地数据
					uni.removeStorageSync('userInfo')
					uni.removeStorageSync('token')
					uni.removeStorageSync('userPoints')
					uni.removeStorageSync('bills')
					uni.removeStorageSync('pendingLevelUp')
					
					uni.showToast({
						title: '已退出登录',
						icon: 'success'
					})
					
					setTimeout(() => {
						uni.navigateBack()
					}, 500)
				}
			}
		}
	})
}

// 注销账号
const handleDeleteAccount = () => {
	uni.showModal({
		title: '⚠️ 确认注销',
		content: '注销后将清除所有数据且不可恢复，确定要注销吗？',
		confirmText: '确定注销',
		cancelText: '取消',
		confirmColor: '#FF4D4F',
		success: (res) => {
			if (res.confirm) {
				performDeleteAccount()
			}
		}
	})
}

// 执行注销账号
const performDeleteAccount = async () => {
	uni.showLoading({ title: '注销中...' })
	
	try {
		const res = await request.call('auth/delete-account')
		
		if (res.success) {
			// 清除所有本地数据
			uni.removeStorageSync('userInfo')
			uni.removeStorageSync('token')
			uni.removeStorageSync('userPoints')
			uni.removeStorageSync('bills')
			uni.removeStorageSync('pendingLevelUp')
			
			uni.hideLoading()
			uni.showModal({
				title: '注销成功',
				content: '您的账号已成功注销',
				showCancel: false,
				confirmText: '知道了',
				success: () => {
					// 返回个人中心页面
					uni.navigateBack()
				}
			})
		} else {
			throw new Error(res.message || '注销失败')
		}
	} catch (error) {
		uni.hideLoading()
		console.error('注销账号失败:', error)
		uni.showToast({
			title: error.message || '注销失败，请重试',
			icon: 'none'
		})
	}
}

onLoad(() => {
	getSystemInfo()
	checkLogin()
	// #ifdef APP-PLUS
	getAppVersion()
	// #endif
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	min-height: 100vh;
	background: $bg-page;
}

/* 自定义导航栏 - 和账单页面一样的样式 */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: $primary-gradient;
	z-index: 1000;
	border-bottom: 1rpx solid rgba(255, 255, 255, 0.2);
}

.navbar-content {
	height: 56px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-lg;
}

.navbar-left {
	min-width: 120rpx; /* 增大点击区域 */
	height: 100%; /* 占满导航栏高度 */
	display: flex;
	align-items: center;
	justify-content: flex-start;
	padding-right: 20rpx; /* 增加右侧内边距，扩大点击区域 */
}

.back-icon {
	font-size: 56rpx; /* 增大箭头图标 */
	color: $text-white;
	font-weight: $font-weight-light;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-white;
}

.navbar-right {
	width: 80rpx;
}

.container {
	padding: $spacing-lg;
}

/* 功能列表 */
.function-list {
	background: $bg-white;
	border-radius: $radius-lg;
	padding: $spacing-lg;
	box-shadow: $shadow-card;
}

.function-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-lg;
	border-radius: $radius-lg;
	transition: all $transition-fast;
	margin-bottom: $spacing-xs;
}

.function-item:last-child {
	margin-bottom: 0;
}

.function-item:active {
	background: $bg-light;
	transform: scale(0.98);
}

.danger-item:active {
	background: rgba(255, 77, 79, 0.05);
}

.function-left {
	display: flex;
	align-items: center;
	gap: $spacing-lg;
}

.function-icon {
	width: 64rpx;
	height: 64rpx;
	border-radius: $radius-md;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-sm;
	flex-shrink: 0;
}

.phone-icon {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.about-icon {
	background: linear-gradient(135deg, #722ED1 0%, #9254DE 100%);
}

.feedback-icon {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
}

.service-icon {
	background: linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%);
}

.logout-icon {
	background: linear-gradient(135deg, #FA8C16 0%, #FFA940 100%);
}

.delete-icon {
	background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
}

.update-icon {
	background: linear-gradient(135deg, #FA8C16 0%, #FFA940 100%);
}

/* 退出登录按钮 */
.logout-button-wrapper {
	margin-top: 80rpx;
	padding: 0 $spacing-lg;
}

.logout-button {
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

.logout-button:active {
	transform: scale(0.98);
	box-shadow: $shadow-sm;
}

.logout-button-text {
	font-size: $font-size-xl;
	font-weight: $font-weight-bold;
	color: $text-white;
}

.icon-text {
	font-size: 32rpx;
}

.icon-img {
	width: 32rpx;
	height: 32rpx;
}

.function-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-normal;
	color: $text-primary;
}

.danger-text {
	color: #FF4D4F;
}

.function-right {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.current-language {
	font-size: $font-size-base;
	color: $text-secondary;
}

.function-desc {
	font-size: $font-size-base;
	color: #52C41A;
	font-weight: $font-weight-medium;
}

.function-desc.inactive {
	color: $text-tertiary;
}

.arrow {
	font-size: $font-size-3xl;
	color: $text-tertiary;
	font-weight: $font-weight-light;
}

/* 联系客服按钮样式重置 */
.contact-button {
	background: transparent;
	border: none;
	padding: $spacing-lg;
	margin: 0 0 $spacing-xs 0;
	line-height: normal;
	text-align: left;
	width: 100%;
	display: flex;
	align-items: center;
	justify-content: space-between;
	border-radius: $radius-lg;
	transition: all $transition-fast;
}

.contact-button::after {
	border: none;
}

.contact-button:active {
	background: $bg-light;
	transform: scale(0.98);
}

/* 警告提示 */
.warning-tips {
	background: linear-gradient(135deg, #FFF7E6 0%, #FFF1F0 100%);
	border-radius: $radius-lg;
	padding: $spacing-xl;
	margin-top: $spacing-lg;
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
}

.warning-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: #FF4D4F;
	margin-bottom: $spacing-xs;
}

.warning-item {
	font-size: $font-size-sm;
	color: $text-secondary;
	line-height: 1.6;
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes scaleIn {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}
</style>
