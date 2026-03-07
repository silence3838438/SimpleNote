<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left" @click="goBack">
					<text class="back-icon">‹</text>
				</view>
				<view class="navbar-title">记账提醒</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56 + 16) + 'px' }">
		<!-- 时间选择卡片 -->
		<view class="time-card">
			<view class="card-title">
				<text class="title-icon">⏰</text>
				<text class="title-text">提醒时间</text>
			</view>
			
			<view class="time-picker-wrapper" @click="showTimePicker">
				<view class="time-display">
					<text class="time-value" :class="{ 'unset-time': data.selectedTime === '未设置' }">{{ data.selectedTime }}</text>
					<text class="time-label">{{ data.selectedTime === '未设置' ? '点击设置提醒' : '每天提醒' }}</text>
				</view>
				<text class="arrow">›</text>
			</view>
		</view>
		
		<!-- 常用时间推荐 -->
		<view class="recommend-section">
			<view class="recommend-title">常用时间</view>
			<view class="recommend-list">
				<view 
					class="recommend-item" 
					v-for="time in data.recommendTimes" 
					:key="time.value"
					:class="{ 'active': data.selectedTime === time.value }"
					@click="selectRecommendTime(time.value)"
				>
					<text class="recommend-icon">{{ time.icon }}</text>
					<text class="recommend-label">{{ time.label }}</text>
					<text class="recommend-time">{{ time.value }}</text>
				</view>
			</view>
		</view>
		
		<!-- 保存按钮 -->
		<view class="save-btn-area">
			<button class="save-btn" @click="saveAndSubscribe" :disabled="data.saving || data.selectedTime === '未设置'">
				<text v-if="!data.saving">保存并开启提醒</text>
				<text v-else>保存中...</text>
			</button>
		</view>
		
		<!-- 时间选择器 -->
		<view class="time-picker-modal" v-if="data.showPicker" @click="closePicker">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-cancel" @click="closePicker">取消</text>
					<text class="picker-title">选择时间</text>
					<text class="picker-confirm" @click="confirmTime">确定</text>
				</view>
				<picker-view class="picker-view" :value="data.pickerValue" @change="onPickerChange" indicator-style="height: 80rpx">
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[0] }"
							v-for="(hour, index) in data.hours" 
							:key="index">
							{{ hour }}
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[1] }"
							v-for="(minute, index) in data.minutes" 
							:key="index">
							{{ minute }}
						</view>
					</picker-view-column>
				</picker-view>
			</view>
		</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import request from '@/utils/request.js'

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
	selectedTime: '未设置',  // 默认显示"未设置"
	showPicker: false,
	saving: false,
	fromBillSuccess: false,  // 是否来自记账成功
	// 时间选择器数据
	hours: [],
	minutes: [],
	pickerValue: [20, 0],
	tempHour: 20,
	tempMinute: 0,
	// 推荐时间
	recommendTimes: [
		{ icon: '🌅', label: '早晨', value: '08:00' },
		{ icon: '🌞', label: '中午', value: '12:00' },
		{ icon: '🌆', label: '傍晚', value: '18:00' },
		{ icon: '🌙', label: '晚上', value: '20:00' },
		{ icon: '🌃', label: '睡前', value: '22:00' }
	]
})

onLoad((options) => {
	// 获取系统信息
	getSystemInfo()
	
	// 保存来源参数
	data.fromBillSuccess = options?.from === 'billSuccess'
	
	// 初始化时间选择器
	initTimePicker()
	
	// 从云端获取提醒设置
	loadReminderFromCloud()
})

const initTimePicker = () => {
	// 生成小时列表 (0-23)
	data.hours = []
	for (let i = 0; i < 24; i++) {
		data.hours.push(i.toString().padStart(2, '0'))
	}
	
	// 生成分钟列表 (0-59)
	data.minutes = []
	for (let i = 0; i < 60; i++) {
		data.minutes.push(i.toString().padStart(2, '0'))
	}
}

const loadReminderFromCloud = async () => {
	try {
		// 显示加载提示
		uni.showLoading({ title: '加载中...' })
		
		// 从云端获取提醒设置
		const res = await request.call('billManager', {
			action: 'getReminder'
		})
		
		uni.hideLoading()
		
		if (res.success && res.reminder) {
			// 后端返回的是 reminder 对象，可能包含 time 或 reminder_time 字段
			const savedTime = res.reminder.reminder_time || res.reminder.time || ''
			
			if (savedTime) {
				// 云端有设置，使用云端数据
				data.selectedTime = savedTime
				const [hour, minute] = savedTime.split(':').map(v => parseInt(v))
				data.tempHour = hour
				data.tempMinute = minute
				data.pickerValue = [hour, minute]
				
				// 同步到本地
				uni.setStorageSync('reminderTime', savedTime)
				uni.setStorageSync('reminderEnabled', true)
			} else {
				// 云端没有设置
				data.selectedTime = '未设置'
			}
		} else {
			// 云端没有设置，检查本地
			const reminderEnabled = uni.getStorageSync('reminderEnabled')
			const savedTime = uni.getStorageSync('reminderTime')
			
			if (reminderEnabled && savedTime) {
				data.selectedTime = savedTime
				const [hour, minute] = savedTime.split(':').map(v => parseInt(v))
				data.tempHour = hour
				data.tempMinute = minute
				data.pickerValue = [hour, minute]
			} else {
				data.selectedTime = '未设置'
			}
		}
	} catch (error) {
		uni.hideLoading()
		console.error('获取提醒设置失败:', error)
		
		// 获取失败，使用本地缓存
		const reminderEnabled = uni.getStorageSync('reminderEnabled')
		const savedTime = uni.getStorageSync('reminderTime')
		
		if (reminderEnabled && savedTime) {
			data.selectedTime = savedTime
			const [hour, minute] = savedTime.split(':').map(v => parseInt(v))
			data.tempHour = hour
			data.tempMinute = minute
			data.pickerValue = [hour, minute]
		} else {
			data.selectedTime = '未设置'
		}
	}
}

const showTimePicker = () => {
	data.showPicker = true
}

const closePicker = () => {
	data.showPicker = false
}

const onPickerChange = (e) => {
	const val = e.detail.value
	data.pickerValue = val
	data.tempHour = parseInt(data.hours[val[0]])
	data.tempMinute = parseInt(data.minutes[val[1]])
}

const confirmTime = () => {
	const hour = data.tempHour.toString().padStart(2, '0')
	const minute = data.tempMinute.toString().padStart(2, '0')
	data.selectedTime = `${hour}:${minute}`
	data.showPicker = false
	uni.vibrateShort()
}

const selectRecommendTime = (time) => {
	data.selectedTime = time
	const [hour, minute] = time.split(':').map(v => parseInt(v))
	data.tempHour = hour
	data.tempMinute = minute
	
	// 更新选择器位置
	const hourIndex = hour
	const minuteIndex = data.minutes.indexOf(minute.toString().padStart(2, '0'))
	data.pickerValue = [hourIndex, minuteIndex]
	
	uni.vibrateShort()
}

const saveAndSubscribe = async () => {
	if (data.saving) return
	data.saving = true
	
	try {
		// 先保存时间到本地
		uni.setStorageSync('reminderTime', data.selectedTime)
		uni.setStorageSync('reminderEnabled', true)
		
		// #ifdef MP-WEIXIN
		// 小程序端：使用微信订阅消息
		uni.requestSubscribeMessage({
			tmplIds: ['bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'],
			success: async (res) => {
				if (res['bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'] === 'accept') {
					// 订阅成功，保存到云端
					try {
						await saveSubscriptionToCloud()
						
						uni.showToast({
							title: '设置成功',
							icon: 'success',
							duration: 1500
						})
						
						// 延迟返回，确保本地缓存已更新
						setTimeout(() => {
							// 如果是从记账成功页面跳转过来的，跳转到首页
							if (data.fromBillSuccess) {
								uni.switchTab({
									url: '/pages/tab/index/index'
								})
							} else {
								// 否则返回上一页
								uni.navigateBack({
									delta: 1
								})
							}
						}, 1500)
					} catch (error) {
						console.error('保存订阅信息失败:', error)
						uni.showToast({
							title: '保存失败，请重试',
							icon: 'none'
						})
					}
				} else {
					uni.showToast({
						title: '需要授权才能开启提醒',
						icon: 'none'
					})
				}
			},
			fail: (err) => {
				console.error('订阅失败:', err)
				uni.showToast({
					title: '订阅失败',
					icon: 'none'
				})
			},
			complete: () => {
				data.saving = false
			}
		})
		// #endif
		
		// #ifdef APP-PLUS
		// APP端：直接保存到云端即可
		try {
			// 获取推送客户端ID
			const clientId = uni.getStorageSync('pushClientId')
			
			// 保存到云端
			await saveSubscriptionToCloud(clientId)
			
			uni.showToast({
				title: '设置成功',
				icon: 'success',
				duration: 1500
			})
			
			// 延迟返回
			setTimeout(() => {
				if (data.fromBillSuccess) {
					uni.switchTab({
						url: '/pages/tab/index/index'
					})
				} else {
					uni.navigateBack({
						delta: 1
					})
				}
			}, 1500)
		} catch (error) {
			console.error('保存失败:', error)
			uni.showToast({
				title: '保存失败，请重试',
				icon: 'none'
			})
		} finally {
			data.saving = false
		}
		// #endif
	} catch (error) {
		console.error('保存失败:', error)
		data.saving = false
		uni.showToast({
			title: '保存失败',
			icon: 'none'
		})
	}
}

const saveSubscriptionToCloud = async (clientId = null) => {
	const res = await request.call('billManager', {
		action: 'saveReminderSubscription',
		data: {
			subscribed: true,
			templateId: 'bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw',
			reminderTime: data.selectedTime,
			clientId: clientId // APP 端传递 ClientID
		}
	})
	
	if (res.success) {
		return res
	} else {
		console.error('❌ 订阅信息保存失败:', res.message)
		throw new Error(res.message)
	}
}

</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	min-height: 100vh;
	background: #F7F8FA;
}

/* 自定义导航栏 - 随手记风格（纯白色） */
.custom-navbar {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	background: $bg-white; /* 随手记风格：纯白色导航栏 */
	z-index: 1000;
	border-bottom: 1rpx solid $border-color; /* 浅灰色边框 */
	box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04); /* 轻微阴影 */
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
	color: $text-primary; /* 深灰色图标 */
	font-weight: $font-weight-light;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-semibold;
	color: $text-primary; /* 深灰色文字 */
}

.navbar-right {
	width: 80rpx;
}

.container {
	min-height: 100vh;
	background: #F7F8FA;
	padding: $spacing-lg;
	padding-bottom: 140rpx;
}

.time-card {
	background: $bg-white;
	border-radius: $radius-2xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.card-title {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	margin-bottom: $spacing-lg;
}

.title-icon {
	font-size: 32rpx;
}

.title-text {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.time-picker-wrapper {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-xl;
	background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
	border-radius: $radius-xl;
}

.time-display {
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
}

.time-value {
	font-size: 48rpx;
	font-weight: $font-weight-bold;
	color: #52C41A;
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
	line-height: 1.2;
}

.time-value.unset-time {
	font-size: 36rpx;
	color: #999999;
	font-weight: $font-weight-medium;
}

.time-label {
	font-size: $font-size-sm;
	color: $text-secondary;
}

.arrow {
	font-size: 48rpx;
	color: #52C41A;
	font-weight: 300;
}

.recommend-section {
	background: $bg-white;
	border-radius: $radius-2xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
}

.recommend-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
	margin-bottom: $spacing-lg;
}

.recommend-list {
	display: flex;
	flex-direction: column;
	gap: $spacing-md;
}

.recommend-item {
	display: flex;
	align-items: center;
	gap: $spacing-lg;
	padding: $spacing-lg $spacing-xl;
	background: $bg-light;
	border-radius: $radius-xl;
	border: 2rpx solid transparent;
	transition: all $transition-fast;
}

.recommend-item.active {
	background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
	border-color: #52C41A;
	box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.2);
}

.recommend-icon {
	font-size: 32rpx;
}

.recommend-label {
	flex: 1;
	font-size: $font-size-lg;
	color: $text-primary;
	font-weight: $font-weight-medium;
}

.recommend-time {
	font-size: $font-size-xl;
	color: #52C41A;
	font-weight: $font-weight-bold;
	font-family: -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
	line-height: 1.2;
}

/* APP 端提示卡片 */
.tips-card {
	background: linear-gradient(135deg, #FFF7E6 0%, #FFE7BA 100%);
	border-radius: $radius-2xl;
	padding: $spacing-xl;
	margin-bottom: $spacing-lg;
	border: 2rpx solid #FFD591;
}

.tips-header {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
	margin-bottom: $spacing-md;
}

.tips-icon {
	font-size: 32rpx;
}

.tips-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: #D46B08;
}

.tips-content {
	display: flex;
	flex-direction: column;
	gap: $spacing-sm;
	margin-bottom: $spacing-md;
}

.tips-text {
	font-size: $font-size-base;
	color: #AD6800;
	line-height: 1.6;
}

.tips-footer {
	padding-top: $spacing-sm;
	border-top: 1rpx solid rgba(255, 213, 145, 0.5);
}

.tips-note {
	font-size: $font-size-sm;
	color: #D46B08;
	opacity: 0.8;
}

.save-btn-area {
	position: fixed;
	bottom: 20rpx;
	left: 0;
	right: 0;
	padding: $spacing-md $spacing-xl $spacing-xl;
	background: linear-gradient(180deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.98) 15%, $bg-white 100%);
	backdrop-filter: blur(20rpx);
	z-index: 100;
}

.save-btn {
	width: 100%;
	height: 88rpx;
	background: $gradient-primary;
	color: $text-white;
	border-radius: 35rpx;
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	border: none;
	box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.3);
	transition: all $transition-fast;
	position: relative;
	overflow: hidden;
	letter-spacing: 2rpx;
}

.save-btn::before {
	content: '';
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
	transition: left 0.6s;
}

.save-btn:active::before {
	left: 100%;
}

.save-btn:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
}

.save-btn[disabled] {
	background: linear-gradient(135deg, rgba(82, 196, 26, 0.4) 0%, rgba(115, 209, 61, 0.4) 100%);
	color: rgba(255, 255, 255, 0.8);
	box-shadow: none;
	transform: none;
}

.save-tip {
	text-align: center;
	font-size: $font-size-sm;
	color: $text-tertiary;
	margin-top: $spacing-sm;
}

/* 时间选择器 */
.time-picker-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.5);
	display: flex;
	align-items: flex-end;
	z-index: 10000;
	animation: fadeIn 0.25s ease;
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

.picker-content {
	width: 100%;
	background: $bg-white;
	border-radius: $radius-2xl $radius-2xl 0 0;
	animation: slideUp 0.3s ease;
	box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
}

@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

.picker-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $spacing-xl;
	border-bottom: 1rpx solid $border-light;
}

.picker-cancel {
	font-size: $font-size-lg;
	color: $text-tertiary;
	padding: 8rpx 16rpx;
}

.picker-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.picker-confirm {
	font-size: $font-size-lg;
	color: #52C41A;
	font-weight: $font-weight-bold;
	padding: 8rpx 16rpx;
}

.picker-view {
	height: 400rpx;
	padding: $spacing-md 0;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: center;
	height: 80rpx;
	font-size: $font-size-xl;
	color: $text-tertiary;
	transition: all 0.2s;
}

.picker-item-selected {
	font-size: 48rpx;
	color: #52C41A;
	font-weight: $font-weight-bold;
}

</style>
