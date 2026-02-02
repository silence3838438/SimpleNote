<template>
	<view class="container">
		<!-- 时间选择卡片 -->
		<view class="time-card">
			<view class="card-title">
				<text class="title-icon">⏰</text>
				<text class="title-text">提醒时间</text>
			</view>
			
			<view class="time-picker-wrapper" @click="showTimePicker">
				<view class="time-display">
					<text class="time-value">{{ data.selectedTime }}</text>
					<text class="time-label">每天提醒</text>
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
			<button class="save-btn" @click="saveAndSubscribe" :disabled="data.saving">
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
				<picker-view class="picker-view" :value="data.pickerValue" @change="onPickerChange">
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
</template>

<script setup>
import { reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const data = reactive({
	selectedTime: '20:00',
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
	// 保存来源参数
	data.fromBillSuccess = options?.from === 'billSuccess'
	
	// 初始化时间选择器
	initTimePicker()
	
	// 如果已有订阅时间，加载
	const savedTime = uni.getStorageSync('reminderTime')
	if (savedTime) {
		data.selectedTime = savedTime
		const [hour, minute] = savedTime.split(':').map(v => parseInt(v))
		data.tempHour = hour
		data.tempMinute = minute
		data.pickerValue = [hour, minute]
	}
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
		
		// 请求订阅授权
		uni.requestSubscribeMessage({
			tmplIds: ['bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'],
			success: async (res) => {
				console.log('订阅结果:', res)
				
				if (res['bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'] === 'accept') {
					// 订阅成功，保存到云端
					try {
						await saveSubscriptionToCloud()
						
						// 统一使用 reminderEnabled 字段
						uni.setStorageSync('reminderEnabled', true)
						
						uni.showToast({
							title: '设置成功',
							icon: 'success',
							duration: 2000
						})
						
						setTimeout(() => {
							// 如果是从记账成功页面跳转过来的，跳转到首页
							if (data.fromBillSuccess) {
								uni.switchTab({
									url: '/pages/index/index'
								})
							} else {
								// 否则返回上一页
								uni.navigateBack()
							}
						}, 2000)
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
	} catch (error) {
		console.error('保存失败:', error)
		data.saving = false
		uni.showToast({
			title: '保存失败',
			icon: 'none'
		})
	}
}

const saveSubscriptionToCloud = async () => {
	return new Promise((resolve, reject) => {
		console.log('开始调用云函数保存订阅信息')
		console.log('提醒时间:', data.selectedTime)
		
		wx.cloud.callFunction({
			name: 'billManager',
			data: {
				action: 'saveReminderSubscription',
				data: {
					subscribed: true,
					templateId: 'bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw',
					reminderTime: data.selectedTime
				}
			},
			success: (res) => {
				console.log('云函数调用成功:', res)
				if (res.result.success) {
					console.log('✅ 订阅信息保存成功')
					resolve(res.result)
				} else {
					console.error('❌ 订阅信息保存失败:', res.result.message)
					reject(new Error(res.result.message))
				}
			},
			fail: (err) => {
				console.error('❌ 云函数调用失败:', err)
				reject(err)
			}
		})
	})
}
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

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

.save-btn-area {
	position: fixed;
	bottom: 40rpx;
	left: 0;
	right: 0;
	padding: $spacing-md $spacing-xl;
	background: linear-gradient(180deg, rgba(247, 248, 250, 0) 0%, rgba(247, 248, 250, 0.98) 15%, #F7F8FA 100%);
	backdrop-filter: blur(20rpx);
}

.save-btn {
	width: 100%;
	height: 88rpx;
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	color: $text-white;
	border-radius: $radius-2xl;
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	border: none;
	box-shadow: 0 6rpx 20rpx rgba(82, 196, 26, 0.3);
	transition: all $transition-fast;
}

.save-btn:active {
	transform: scale(0.98);
	box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
}

.save-btn[disabled] {
	background: linear-gradient(135deg, #E0E0E0 0%, #BDBDBD 100%);
	color: rgba(0, 0, 0, 0.3);
	box-shadow: none;
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
