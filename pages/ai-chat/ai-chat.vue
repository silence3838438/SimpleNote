<template>
	<page-meta :page-style="'overflow: hidden;'"></page-meta>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="navbar-title">财务顾问</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
			<!-- 对话区域 -->
			<scroll-view 
				class="chat-area" 
				scroll-y 
				:scroll-into-view="scrollIntoView"
				:scroll-with-animation="true"
			>
				<!-- 欢迎消息 -->
				<view class="message-item ai-message" id="msg-welcome">
					<view class="avatar">
						<text class="avatar-icon">🤖</text>
					</view>
					<view class="message-content">
						<view class="message-bubble">
							<text class="message-text">你好！我是小财，你的专属财务顾问 💰</text>
							<text class="message-text">你可以问我：</text>
							<text class="message-text">• 我这个月花了多少钱？</text>
							<text class="message-text">• 哪个分类花费最多？</text>
							<text class="message-text">• 给我一些省钱建议</text>
						</view>
					</view>
				</view>
				
				<!-- 对话消息 -->
				<view 
					v-for="(msg, index) in messages" 
					:key="index" 
					:class="['message-item', msg.role === 'user' ? 'user-message' : 'ai-message']"
					:id="'msg-' + index"
				>
					<view class="avatar" v-if="msg.role === 'ai'">
						<text class="avatar-icon">🤖</text>
					</view>
					<view class="message-content">
						<view class="message-bubble">
							<text class="message-text">{{ msg.content }}</text>
						</view>
						<text class="message-time">{{ msg.time }}</text>
					</view>
					<view class="avatar" v-if="msg.role === 'user'">
						<image class="avatar-img" :src="userAvatar" mode="aspectFill"></image>
					</view>
				</view>
				
				<!-- 加载中 -->
				<view class="message-item ai-message" v-if="isLoading" id="msg-loading">
					<view class="avatar">
						<text class="avatar-icon">🤖</text>
					</view>
					<view class="message-content">
						<view class="message-bubble loading-bubble">
							<view class="loading-dots">
								<view class="dot"></view>
								<view class="dot"></view>
								<view class="dot"></view>
							</view>
						</view>
					</view>
				</view>
			</scroll-view>
			
			<!-- 快捷问题 -->
			<view class="quick-questions" v-if="messages.length === 0 && !isLoading">
				<view 
					class="quick-item" 
					v-for="(q, index) in quickQuestions" 
					:key="index"
					@click="askQuestion(q)"
				>
					<text class="quick-text">{{ q }}</text>
				</view>
			</view>
			
			<!-- 输入区域 -->
			<view class="input-area">
				<view class="input-wrapper">
					<input 
						class="input-box" 
						v-model="inputText" 
						placeholder="问我任何财务问题..."
						:disabled="isLoading"
						:adjust-position="false"
						:hold-keyboard="false"
						@confirm="sendMessage"
					/>
					<view 
						class="send-btn" 
						:class="{ active: inputText.trim() && !isLoading }"
						@click="sendMessage"
					>
						<text class="send-icon">{{ isLoading ? '⏳' : '➤' }}</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref, nextTick } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import request from '@/utils/request.js'

const statusBarHeight = ref(0)
const inputText = ref('')
const isLoading = ref(false)
const scrollIntoView = ref('')
const userAvatar = ref('https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png')

const messages = reactive([])

const quickQuestions = [
	'我这个月花了多少钱？',
	'哪个分类花费最多？',
	'给我一些省钱建议',
	'我的消费趋势如何？'
]

// 获取系统信息
const getSystemInfo = () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 0
}

// 返回
const goBack = () => {
	uni.navigateBack()
}

// 发送消息
const sendMessage = async () => {
	const question = inputText.value.trim()
	if (!question || isLoading.value) return
	
	// 添加用户消息
	messages.push({
		role: 'user',
		content: question,
		time: formatTime(new Date())
	})
	
	inputText.value = ''
	isLoading.value = true
	
	// 滚动到底部
	await nextTick()
	scrollToBottom()
	
	try {
		// 调用AI接口
		const result = await request.call('ai-chat', {
			question
		})
		
		if (result.success) {
			// 添加AI回复
			messages.push({
				role: 'ai',
				content: result.answer,
				time: formatTime(new Date())
			})
			
			// 显示剩余次数提示
			if (result.remainingCount !== undefined) {
				if (result.remainingCount === 0) {
					uni.showToast({
						title: '今日咨询次数已用完',
						icon: 'none',
						duration: 2000
					})
				} else if (result.remainingCount <= 1) {
					uni.showToast({
						title: `今日还剩${result.remainingCount}次咨询`,
						icon: 'none',
						duration: 2000
					})
				}
			}
		} else {
			// 处理失败情况
			let errorMessage = '抱歉，我暂时无法回答这个问题 😅 请稍后再试~'
			
			// 如果是次数用完的错误，显示特定提示
			if (result.message && result.message.includes('今日咨询次数已用完')) {
				errorMessage = result.message
			} else if (result.message) {
				errorMessage = result.message
			}
			
			messages.push({
				role: 'ai',
				content: errorMessage,
				time: formatTime(new Date())
			})
		}
	} catch (error) {
		console.error('AI对话失败:', error)
		messages.push({
			role: 'ai',
			content: '抱歉，网络连接失败 😅 请检查网络后重试~',
			time: formatTime(new Date())
		})
	} finally {
		isLoading.value = false
		await nextTick()
		scrollToBottom()
	}
}

// 快捷提问
const askQuestion = (question) => {
	inputText.value = question
	sendMessage()
}

// 滚动到底部
const scrollToBottom = () => {
	if (isLoading.value) {
		scrollIntoView.value = 'msg-loading'
	} else if (messages.length > 0) {
		scrollIntoView.value = 'msg-' + (messages.length - 1)
	}
}

// 格式化时间
const formatTime = (date) => {
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${hours}:${minutes}`
}

onLoad(async () => {
	// 小程序端检查配置
	// #ifdef MP-WEIXIN
	try {
		const res = await request.call('config/public', {}, 'GET')
		if (res.success && res.data) {
			// 检查AI财务顾问配置（小程序端使用show_ai_advisor_wechat字段）
			const showAiAdvisor = res.data.show_ai_advisor_wechat || false
			if (!showAiAdvisor) {
				uni.showModal({
					title: '功能提示',
					content: '该功能暂未开放，敬请期待',
					showCancel: false,
					success: () => {
						uni.navigateBack({
							fail: () => {
								uni.switchTab({ url: '/pages/tab/profile/profile' })
							}
						})
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
			content: '该功能暂未开放，敬请期待',
			showCancel: false,
			success: () => {
				uni.navigateBack({
					fail: () => {
						uni.switchTab({ url: '/pages/tab/profile/profile' })
					}
				})
			}
		})
		return
	}
	// #endif
	
	getSystemInfo()
	
	// 获取用户头像
	const userInfo = uni.getStorageSync('userInfo')
	if (userInfo && userInfo.avatarUrl) {
		userAvatar.value = userInfo.avatarUrl
	}
})
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	height: 100vh;
	background: #F5F5F5;
	display: flex;
	flex-direction: column;
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
}

/* 自定义导航栏 */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	z-index: 1000;
	box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.2);
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
	color: $text-white;
	font-weight: $font-weight-light;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-white;
}

.navbar-right {
	width: 80rpx;
}

.container {
	flex: 1;
	display: flex;
	flex-direction: column;
	height: 100%;
	overflow: hidden;
}

/* 对话区域 */
.chat-area {
	flex: 1;
	padding: $spacing-lg;
	overflow-y: auto;
}

.message-item {
	display: flex;
	gap: $spacing-md;
	margin-bottom: $spacing-lg;
	animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
	from {
		opacity: 0;
		transform: translateY(10rpx);
	}
	to {
		opacity: 1;
		transform: translateY(0);
	}
}

.ai-message {
	justify-content: flex-start;
}

.user-message {
	justify-content: flex-end;
	flex-direction: row-reverse;
}

.avatar {
	width: 72rpx;
	height: 72rpx;
	border-radius: 50%;
	flex-shrink: 0;
	display: flex;
	align-items: center;
	justify-content: center;
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	box-shadow: $shadow-sm;
}

.avatar-icon {
	font-size: 36rpx;
}

.avatar-img {
	width: 100%;
	height: 100%;
	border-radius: 50%;
}

.message-content {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
	max-width: 70%;
}

.user-message .message-content {
	align-items: flex-end;
}

.message-bubble {
	padding: $spacing-lg;
	border-radius: $radius-lg;
	background: $bg-white;
	box-shadow: $shadow-sm;
	word-break: break-word;
}

.user-message .message-bubble {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.message-text {
	font-size: $font-size-base;
	color: $text-primary;
	line-height: 1.6;
	display: block;
	margin-bottom: $spacing-xs;
}

.message-text:last-child {
	margin-bottom: 0;
}

.user-message .message-text {
	color: $text-white;
}

.message-time {
	font-size: $font-size-xs;
	color: $text-tertiary;
	padding: 0 $spacing-sm;
}

/* 加载动画 */
.loading-bubble {
	padding: $spacing-lg $spacing-xl;
}

.loading-dots {
	display: flex;
	gap: $spacing-sm;
	align-items: center;
	justify-content: center;
}

.dot {
	width: 12rpx;
	height: 12rpx;
	border-radius: 50%;
	background: #52C41A;
	animation: bounce 1.4s infinite ease-in-out both;
}

.dot:nth-child(1) {
	animation-delay: -0.32s;
}

.dot:nth-child(2) {
	animation-delay: -0.16s;
}

@keyframes bounce {
	0%, 80%, 100% {
		transform: scale(0);
		opacity: 0.5;
	}
	40% {
		transform: scale(1);
		opacity: 1;
	}
}

/* 快捷问题 */
.quick-questions {
	padding: 0 $spacing-lg $spacing-lg;
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.quick-item {
	padding: $spacing-lg;
	background: $bg-white;
	border-radius: $radius-lg;
	box-shadow: $shadow-sm;
	transition: all $transition-fast;
}

.quick-item:active {
	transform: scale(0.98);
	background: #F0FFF4;
}

.quick-text {
	font-size: $font-size-base;
	color: #52C41A;
	font-weight: $font-weight-medium;
}

/* 输入区域 */
.input-area {
	padding: $spacing-lg;
	background: $bg-white;
	border-top: 1rpx solid $border-light;
	box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.05);
	flex-shrink: 0;
}

.input-wrapper {
	display: flex;
	align-items: center;
	gap: $spacing-md;
	background: #F5F5F5;
	border-radius: $radius-2xl;
	padding: $spacing-sm $spacing-lg;
}

.input-box {
	flex: 1;
	font-size: $font-size-base;
	color: $text-primary;
	background: transparent;
	border: none;
	outline: none;
}

.send-btn {
	width: 64rpx;
	height: 64rpx;
	border-radius: 50%;
	background: #E8E8E8;
	display: flex;
	align-items: center;
	justify-content: center;
	transition: all $transition-fast;
	flex-shrink: 0;
}

.send-btn.active {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	box-shadow: $shadow-md;
}

.send-btn:active {
	transform: scale(0.9);
}

.send-icon {
	font-size: 28rpx;
	color: $text-white;
	font-weight: $font-weight-bold;
}
</style>
