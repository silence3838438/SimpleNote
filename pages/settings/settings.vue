<template>
	<view class="page">
		<view class="container">
			<!-- 功能列表 -->
			<view class="function-list">
				<!-- 关于我们 -->
				<view class="function-item" @click="showAbout">
					<view class="function-left">
						<view class="function-icon about-icon">
							<text class="icon-text">ℹ️</text>
						</view>
						<text class="function-title">关于我们</text>
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
						<text class="function-title">意见反馈</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</view>
				
				<!-- 用户注销（仅登录后显示） -->
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
			</view>
			
			<!-- 注销说明（仅登录后显示） -->
			<view class="warning-tips" v-if="data.isLogin">
				<text class="warning-title">⚠️ 注销账号说明</text>
				<text class="warning-item">• 注销后将清除所有账单数据</text>
				<text class="warning-item">• 注销后将清除所有积分记录</text>
				<text class="warning-item">• 注销操作不可恢复，请谨慎操作</text>
			</view>
			
			<!-- 退出登录按钮（仅登录后显示） -->
			<view class="logout-button-wrapper" v-if="data.isLogin">
				<view class="logout-button" @click="handleLogout">
					<text class="logout-button-text">退出登录</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'
import request from '@/utils/request.js'

const data = reactive({
	isLogin: false
})

// 检查登录状态
const checkLogin = () => {
	const userInfo = uni.getStorageSync('userInfo')
	data.isLogin = userInfo && userInfo.isLogin
}

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
						console.log('退出前数据已同步到云端')
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
		title: '⚠️ 注销账号',
		content: '注销后将清除所有数据且不可恢复，确定要注销吗？',
		confirmText: '确定注销',
		cancelText: '取消',
		confirmColor: '#FF4D4F',
		success: (res) => {
			if (res.confirm) {
				// 二次确认
				uni.showModal({
					title: '最后确认',
					content: '您真的要注销账号吗？此操作不可撤销！',
					confirmText: '确定注销',
					cancelText: '我再想想',
					confirmColor: '#FF4D4F',
					success: async (confirmRes) => {
						if (confirmRes.confirm) {
							await performDeleteAccount()
						}
					}
				})
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
	checkLogin()
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	min-height: 100vh;
	background: $bg-page;
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

.about-icon {
	background: linear-gradient(135deg, #722ED1 0%, #9254DE 100%);
}

.feedback-icon {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
}

.logout-icon {
	background: linear-gradient(135deg, #FA8C16 0%, #FFA940 100%);
}

.delete-icon {
	background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
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
	border-radius: $radius-xl;
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

.arrow {
	font-size: $font-size-3xl;
	color: $text-tertiary;
	font-weight: $font-weight-light;
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
