<template>
	<view class="page">
		<view class="container">
			<!-- 顶部金额卡片 -->
			<view class="amount-card" :class="data.bill.type === 'income' ? 'income-card' : 'expense-card'">
				<view class="type-badge">
					<text class="badge-icon">{{ data.bill.type === 'income' ? '💰' : '💸' }}</text>
					<text class="badge-text">{{ data.bill.type === 'income' ? '收入' : '支出' }}</text>
				</view>
				<view class="amount-label">账单金额</view>
				<view class="amount-value">{{ data.bill.type === 'income' ? '+' : '-' }}¥{{ data.bill.amount?.toFixed(2) || '0.00' }}</view>
				<view class="amount-date">{{ formatDateTime(data.bill.createTime || data.bill.date) }}</view>
			</view>
			
			<!-- 账单信息 -->
			<view class="info-card">
				<view class="card-title">账单信息</view>
				<view class="info-list">
					<view class="info-item">
						<view class="info-label">
							<text class="info-icon">{{ data.bill.categoryIcon || '📦' }}</text>
							<text>分类</text>
						</view>
						<text class="info-value">{{ data.bill.categoryName || '其他' }}</text>
					</view>
					<view class="info-item">
						<view class="info-label">
							<text class="info-icon">{{ data.bill.type === 'income' ? '💼' : '🏪' }}</text>
							<text>{{ data.bill.type === 'income' ? '来源' : '商家' }}</text>
						</view>
						<text class="info-value">{{ data.bill.merchant || '未知' }}</text>
					</view>
					<view class="info-item">
						<view class="info-label">
							<text class="info-icon">📅</text>
							<text>日期</text>
						</view>
						<text class="info-value">{{ formatDate(data.bill.date) }}</text>
					</view>
					<view class="info-item">
						<view class="info-label">
							<text class="info-icon">🕐</text>
							<text>时间</text>
						</view>
						<text class="info-value">{{ formatTime(data.bill.createTime || data.bill.date) }}</text>
					</view>
					<view class="info-item" v-if="data.bill.remark">
						<view class="info-label">
							<text class="info-icon">📝</text>
							<text>备注</text>
						</view>
						<text class="info-value">{{ data.bill.remark }}</text>
					</view>
				</view>
			</view>
			
			<!-- 操作按钮 -->
			<view class="action-buttons">
				<button class="btn-secondary" @click="editBill">
					<text>编辑</text>
				</button>
				<button class="btn-danger" @click="confirmDelete">
					<text>删除</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'
import { getExpenseCategories, getIncomeCategories } from '@/utils/category.js'

const data = reactive({
	bill: {},
	categories: []
})

onLoad((options) => {
	data.categories = uni.getStorageSync('categories') || []
	
	if (options.billData) {
		try {
			data.bill = JSON.parse(decodeURIComponent(options.billData))
			
			// 根据账单类型选择对应的分类列表
			const billType = data.bill.type || 'expense'
			const categoryList = billType === 'income' ? getIncomeCategories() : getExpenseCategories()
			const category = categoryList.find(c => c.id === data.bill.categoryId) || {}
			
			data.bill.categoryIcon = category.icon || '📦'
			data.bill.categoryName = category.name || data.bill.categoryName || '其他'
		} catch (error) {
			console.error('解析账单数据失败:', error)
			uni.showToast({
				title: '数据加载失败',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
	}
})

const formatDate = (dateStr) => {
	if (!dateStr) return '-'
	const date = new Date(dateStr)
	const year = date.getFullYear()
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
	const weekday = weekdays[date.getDay()]
	return `${year}年${month}月${day}日 ${weekday}`
}

const formatTime = (dateStr) => {
	if (!dateStr) return '-'
	const date = new Date(dateStr)
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	const seconds = date.getSeconds().toString().padStart(2, '0')
	return `${hours}:${minutes}:${seconds}`
}

const formatDateTime = (dateStr) => {
	if (!dateStr) return '-'
	const date = new Date(dateStr)
	const now = new Date()
	const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
	
	if (diff === 0) return '今天'
	if (diff === 1) return '昨天'
	if (diff === 2) return '前天'
	
	const month = (date.getMonth() + 1).toString().padStart(2, '0')
	const day = date.getDate().toString().padStart(2, '0')
	return `${month}月${day}日`
}

const editBill = () => {
	uni.navigateTo({
		url: `/subPackages/record/confirm/confirm?editMode=true&billId=${data.bill.id}`
	})
}

const confirmDelete = () => {
	uni.showModal({
		title: '确认删除',
		content: `确定要删除这笔账单吗？\n${data.bill.merchant} ¥${data.bill.amount?.toFixed(2)}`,
		confirmColor: '#F5222D',
		success: async (res) => {
			if (res.confirm) {
				await deleteBill()
			}
		}
	})
}

const deleteBill = async () => {
	uni.showLoading({ title: '删除中...' })
	try {
		const result = await billStorage.deleteBill(data.bill.id, data.bill._id)
		if (result.success) {
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			})
			// 通知其他页面刷新
			uni.$emit('billSaved')
			// 返回上一页
			setTimeout(() => {
				uni.navigateBack()
			}, 1000)
		} else {
			throw new Error('删除失败')
		}
	} catch (error) {
		console.error('删除账单失败:', error)
		uni.showToast({
			title: '删除失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
	}
}
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.page {
		width: 100%;
		min-height: 100vh;
		background: linear-gradient(180deg, #F0FFF4 0%, #FAFAFA 100%);
	}
	
	.container {
		padding: $spacing-md;
		padding-bottom: 100rpx;
	}
	
	/* 金额卡片 */
	.amount-card {
		border-radius: $radius-2xl;
		padding: $spacing-3xl $spacing-2xl;
		margin-bottom: $spacing-lg;
		box-shadow: 0 12rpx 32rpx rgba(82, 196, 26, 0.3);
		position: relative;
		overflow: hidden;
		border: 2rpx solid rgba(255, 255, 255, 0.2);
		text-align: center;
	}
	
	.amount-card.income-card {
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
	}
	
	.amount-card.expense-card {
		background: $gradient-primary;
	}
	
	.amount-card::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 400rpx;
		height: 400rpx;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		border-radius: $radius-round;
	}
	
	.type-badge {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		padding: $spacing-xs $spacing-lg;
		background: rgba(255, 255, 255, 0.25);
		border-radius: $radius-2xl;
		margin-bottom: $spacing-md;
		position: relative;
		z-index: 1;
		backdrop-filter: blur(10rpx);
	}
	
	.badge-icon {
		font-size: $font-size-lg;
	}
	
	.badge-text {
		font-size: $font-size-sm;
		color: $text-white;
		font-weight: $font-weight-bold;
	}
	
	.amount-label {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.85);
		margin-bottom: $spacing-sm;
		font-weight: $font-weight-normal;
		position: relative;
		z-index: 1;
		letter-spacing: 0.5rpx;
	}
	
	.amount-value {
		font-size: 88rpx;
		font-weight: $font-weight-bold;
		color: $text-white;
		font-family: 'DIN Alternate', monospace;
		text-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.15);
		position: relative;
		z-index: 1;
		letter-spacing: -2rpx;
		margin-bottom: $spacing-xs;
		line-height: 1.2;
	}
	
	.amount-date {
		font-size: $font-size-base;
		color: rgba(255, 255, 255, 0.85);
		font-weight: $font-weight-normal;
		position: relative;
		z-index: 1;
		letter-spacing: 0.5rpx;
	}
	
	/* 信息卡片 */
	.info-card {
		background: $bg-white;
		border-radius: $radius-2xl;
		padding: $spacing-xl;
		margin-bottom: $spacing-lg;
		box-shadow: 0 4rpx 20rpx rgba(82, 196, 26, 0.08);
		border: 2rpx solid rgba(82, 196, 26, 0.08);
	}
	
	.card-title {
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: $spacing-xl;
		display: flex;
		align-items: center;
		letter-spacing: 0.5rpx;
	}
	
	.card-title::before {
		content: '';
		width: 6rpx;
		height: 28rpx;
		background: $gradient-primary;
		border-radius: 3rpx;
		margin-right: $spacing-sm;
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.3);
	}
	
	.info-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
	}
	
	.info-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $spacing-lg;
		background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
		border-radius: $radius-xl;
		border: 2rpx solid rgba(82, 196, 26, 0.08);
		transition: all $transition-fast;
	}
	
	.info-item:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.12);
	}
	
	.info-label {
		display: flex;
		align-items: center;
		gap: $spacing-lg;
		font-size: $font-size-base;
		color: $text-secondary;
		font-weight: $font-weight-normal;
	}
	
	.info-icon {
		font-size: $font-size-xl;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.08));
	}
	
	.info-value {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-medium;
		text-align: right;
		max-width: 400rpx;
		word-break: break-all;
	}
	
	/* 操作按钮 */
	.action-buttons {
		display: flex;
		gap: $spacing-lg;
		padding: 0 $spacing-md;
	}
	
	.btn-secondary, .btn-danger {
		flex: 1;
		height: 88rpx;
		border-radius: $radius-2xl;
		font-size: $font-size-lg;
		font-weight: $font-weight-bold;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all $transition-fast;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
		letter-spacing: 1rpx;
	}
	
	.btn-secondary {
		background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
		color: $primary-color;
		border: 2rpx solid rgba(82, 196, 26, 0.2);
	}
	
	.btn-secondary:active {
		background: $gradient-primary;
		color: $text-white;
		transform: scale(0.98);
		border-color: transparent;
	}
	
	.btn-danger {
		background: linear-gradient(135deg, #FFF1F0 0%, #FFFFFF 100%);
		color: $error-color;
		border: 2rpx solid rgba(245, 34, 45, 0.2);
	}
	
	.btn-danger:active {
		background: linear-gradient(135deg, #FF4D4F 0%, #F5222D 100%);
		color: $text-white;
		transform: scale(0.98);
		border-color: transparent;
	}
</style>
