<template>
	<view class="page">
		<view class="container">
			<!-- 顶部搜索栏 -->
			<view class="header-bar">
				<view class="search-input-wrapper">
					<text class="search-icon">🔍</text>
					<input 
						class="search-input" 
						type="text" 
						v-model="data.searchKeyword" 
						placeholder="搜索商家、分类"
						@input="handleSearch"
					/>
					<text class="clear-icon" v-if="data.searchKeyword" @click="clearSearch">✕</text>
				</view>
			</view>
			
			<!-- 统计卡片 -->
			<view class="summary-card">
				<view class="summary-header">
					<picker mode="multiSelector" :value="data.pickerValue" :range="data.pickerColumns" @change="onPickerConfirm" @columnchange="onPickerColumnChange">
						<view class="month-selector">
							<text class="month-text">{{ data.selectedMonth || '全部账单' }}</text>
							<text class="month-arrow">▼</text>
						</view>
					</picker>
				</view>
				<view class="summary-amounts">
					<view class="amount-item">
						<text class="amount-label">收入</text>
						<text class="amount-value income">{{ formatAmount(data.totalIncome) }}</text>
					</view>
					<view class="amount-divider"></view>
					<view class="amount-item">
						<text class="amount-label">支出</text>
						<text class="amount-value expense">-{{ formatAmount(data.totalExpense) }}</text>
					</view>
					<view class="amount-divider"></view>
					<view class="amount-item">
						<text class="amount-label">结余</text>
						<text class="amount-value" :class="data.balance >= 0 ? 'income' : 'expense'">
							{{ data.balance >= 0 ? '+' : '-' }}{{ formatAmount(data.balance) }}
						</text>
					</view>
				</view>
			</view>
			
			<!-- 筛选标签 - 横向滚动 -->
			<scroll-view class="filter-scroll" scroll-x show-scrollbar="false">
				<view class="filter-tags">
					<view class="filter-tag" :class="{ 'active': !data.selectedType }" @click="selectType(null)">
						<text class="tag-text">全部</text>
					</view>
					<view class="filter-tag" :class="{ 'active': data.selectedType === 'income' }" @click="selectType('income')">
						<text class="tag-text">收入</text>
					</view>
					<view class="filter-tag" :class="{ 'active': data.selectedType === 'expense' }" @click="selectType('expense')">
						<text class="tag-text">支出</text>
					</view>
					<view class="filter-tag export-tag" @click="exportBills">
						<text class="tag-text">导出</text>
					</view>
				</view>
			</scroll-view>
			
			<!-- 账单列表 -->
			<view class="bills-list">
				<view class="date-group" v-for="(group, index) in data.groupedBills" :key="index">
					<!-- 日期头部 -->
					<view class="date-header">
						<text class="date-text">{{ group.date }}</text>
						<view class="date-summary">
							<text class="date-income" v-if="group.income > 0">+{{ group.income.toFixed(2) }}</text>
							<text class="date-expense" v-if="group.expense > 0">-{{ group.expense.toFixed(2) }}</text>
						</view>
					</view>
					
					<!-- 账单项 -->
					<view class="bill-items">
						<view 
							class="bill-item" 
							v-for="bill in group.bills" 
							:key="bill.id"
							@click="goToDetail(bill)"
						>
							<view class="bill-icon-wrapper">
								<text class="bill-icon">{{ bill.categoryIcon }}</text>
							</view>
							<view class="bill-content">
								<view class="bill-main">
									<text class="bill-merchant">{{ bill.merchant }}</text>
									<text class="bill-category">{{ bill.categoryName }}</text>
								</view>
								<text class="bill-time">{{ bill.timeText }}</text>
							</view>
							<view class="bill-amount-wrapper">
								<text class="bill-amount" :class="bill.type === 'income' ? 'income' : 'expense'">
									{{ bill.type === 'income' ? '+' : '-' }}¥{{ bill.amount.toFixed(2) }}
								</text>
							</view>
							<view class="bill-delete-icon" @click.stop="confirmDeleteBill(bill)">
								<text class="delete-icon">🗑️</text>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-if="data.filteredBills.length === 0">
					<text class="empty-icon">📝</text>
					<text class="empty-text">暂无账单记录</text>
					<text class="empty-tip">快去记一笔吧~</text>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, computed } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'
import { getExpenseCategories, getIncomeCategories } from '@/utils/category.js'

const data = reactive({
	allBills: [],
	filteredBills: [],
	groupedBills: [],
	categories: [],
	searchKeyword: '',
	selectedType: null,
	selectedMonth: null,
	totalAmount: 0,
	totalIncome: 0,
	totalExpense: 0,
	balance: 0,
	// 原生picker相关
	pickerValue: [0, 0],
	pickerColumns: [[], []], // 两列：年份和月份
	tempYear: '',
	tempMonth: ''
})

const loadData = async () => {
	// 检查登录状态
	if (!checkLogin()) {
		// 未登录时显示空状态
		data.allBills = []
		data.filteredBills = []
		data.groupedBills = []
		data.totalIncome = 0
		data.totalExpense = 0
		data.balance = 0
		data.billCount = 0
		data.categories = uni.getStorageSync('categories') || []
		initYears()
		return
	}
	
	uni.showLoading({ title: '加载中...' })
	try {
		const bills = await billStorage.getFromAPI() // 直接从API获取
		data.allBills = bills || []
		data.categories = uni.getStorageSync('categories') || []
		
		// 初始化年份列表
		initYears()
		
		// 应用筛选
		applyFilters()
	} catch (error) {
		console.error('加载账单失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
	}
}

// 静默加载数据（不显示loading）
const loadDataQuietly = async () => {
	try {
		const bills = await billStorage.getFromAPI()
		data.allBills = bills || []
		data.categories = uni.getStorageSync('categories') || []
		
		// 初始化年份列表
		initYears()
		
		// 应用筛选
		applyFilters()
	} catch (error) {
		console.error('静默加载账单失败:', error)
		// 静默失败，不显示错误提示
	}
}

const initYears = () => {
	const now = new Date()
	const currentYear = now.getFullYear()
	
	// 生成年份列表（添加"全部"选项 + 当前年份前后5年）
	const years = ['全部']
	for (let i = currentYear - 5; i <= currentYear + 5; i++) {
		years.push(String(i))
	}
	
	// 生成月份列表（包含"全部"）
	const months = ['全部', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
	
	// 设置picker的列数据
	data.pickerColumns = [years, months]
	
	// 设置默认选中"全部"
	data.pickerValue = [0, 0]
	data.tempYear = '全部'
	data.tempMonth = '全部'
}

const applyFilters = () => {
	let filtered = [...data.allBills]
	
	// 搜索关键词筛选
	if (data.searchKeyword) {
		const keyword = data.searchKeyword.toLowerCase()
		filtered = filtered.filter(bill => {
			const merchant = bill.merchant.toLowerCase()
			// 根据账单类型选择对应的分类列表
			const billType = bill.type || 'expense'
			const categoryList = billType === 'income' ? getIncomeCategories() : getExpenseCategories()
			const category = categoryList.find(c => c.id === bill.categoryId)
			const categoryName = category ? category.name.toLowerCase() : (bill.categoryName || '').toLowerCase()
			return merchant.includes(keyword) || categoryName.includes(keyword)
		})
	}
	
	// 类型筛选
	if (data.selectedType) {
		filtered = filtered.filter(bill => (bill.type || 'expense') === data.selectedType)
	}
	
	// 月份筛选
	if (data.selectedMonth) {
		filtered = filtered.filter(bill => {
			const date = new Date(bill.date)
			const monthStr = `${date.getFullYear()}年${(date.getMonth() + 1).toString().padStart(2, '0')}月`
			return monthStr === data.selectedMonth
		})
	}
	
	data.filteredBills = filtered
	
	// 分别计算收入和支出
	data.totalIncome = filtered
		.filter(bill => bill.type === 'income')
		.reduce((sum, bill) => sum + bill.amount, 0)
	
	data.totalExpense = filtered
		.filter(bill => (bill.type || 'expense') === 'expense')
		.reduce((sum, bill) => sum + bill.amount, 0)
	
	data.balance = data.totalIncome - data.totalExpense
	
	// 计算总金额（兼容旧逻辑）
	data.totalAmount = filtered.reduce((sum, bill) => sum + bill.amount, 0)
	
	// 按日期分组
	groupBillsByDate()
}

const groupBillsByDate = () => {
	const groups = {}
	
	data.filteredBills.forEach(bill => {
		const date = new Date(bill.date)
		const dateKey = formatDateKey(date)
		
		if (!groups[dateKey]) {
			groups[dateKey] = {
				date: formatDateDisplay(date),
				bills: [],
				total: 0,
				income: 0,
				expense: 0
			}
		}
		
		// 根据账单类型选择对应的分类列表
		const billType = bill.type || 'expense'
		const categoryList = billType === 'income' ? getIncomeCategories() : getExpenseCategories()
		const category = categoryList.find(c => c.id === bill.categoryId) || {}
		const createTime = bill.createTime ? new Date(bill.createTime) : new Date(bill.date)
		
		groups[dateKey].bills.push({
			...bill,
			categoryIcon: category.icon || '📦',
			categoryName: category.name || bill.categoryName || '其他',
			timeText: formatTime(createTime),
			type: billType
		})
		
		groups[dateKey].total += bill.amount
		if (billType === 'income') {
			groups[dateKey].income += bill.amount
		} else {
			groups[dateKey].expense += bill.amount
		}
	})
	
	// 转换为数组并按日期排序
	data.groupedBills = Object.keys(groups)
		.sort((a, b) => new Date(b) - new Date(a))
		.map(key => groups[key])
}

const formatDateKey = (date) => {
	return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`
}

const formatDateDisplay = (date) => {
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const billDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	const diff = Math.floor((today - billDate) / (1000 * 60 * 60 * 24))
	
	if (diff === 0) return '今天'
	if (diff === 1) return '昨天'
	if (diff === 2) return '前天'
	
	const year = date.getFullYear()
	const month = date.getMonth() + 1
	const day = date.getDate()
	const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
	const weekday = weekdays[date.getDay()]
	
	if (year === now.getFullYear()) {
		return `${month}月${day}日 ${weekday}`
	}
	return `${year}年${month}月${day}日 ${weekday}`
}

const formatTime = (date) => {
	const hours = date.getHours().toString().padStart(2, '0')
	const minutes = date.getMinutes().toString().padStart(2, '0')
	return `${hours}:${minutes}`
}

const handleSearch = () => {
	applyFilters()
}

const clearSearch = () => {
	data.searchKeyword = ''
	applyFilters()
}

const selectType = (type) => {
	data.selectedType = type
	applyFilters()
}

// 原生picker列改变事件
const onPickerColumnChange = (e) => {
	const column = e.detail.column
	const value = e.detail.value
	
	// 如果改变的是年份列
	if (column === 0) {
		const selectedYear = data.pickerColumns[0][value]
		
		// 如果选择了"全部"年份
		if (selectedYear === '全部') {
			// 月份列包含"全部"
			data.pickerColumns[1] = ['全部', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
			// 自动选中"全部"月份
			data.pickerValue = [value, 0]
		} else {
			// 选择了具体年份，月份列不包含"全部"
			data.pickerColumns[1] = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12']
			// 如果当前月份索引超出范围，重置为0
			const currentMonthIndex = data.pickerValue[1]
			if (currentMonthIndex >= data.pickerColumns[1].length) {
				data.pickerValue = [value, 0]
			}
		}
	}
}

// 原生picker确认事件
const onPickerConfirm = (e) => {
	const values = e.detail.value
	const selectedYear = data.pickerColumns[0][values[0]]
	const selectedMonth = data.pickerColumns[1][values[1]]
	
	// 如果选择了"全部"，清空月份筛选
	if (selectedYear === '全部' || selectedMonth === '全部') {
		data.selectedMonth = null
	} else {
		data.selectedMonth = `${selectedYear}年${selectedMonth}月`
	}
	
	applyFilters()
}

const goToDetail = (bill) => {
	uni.navigateTo({
		url: `/pages/bills/detail?billData=${encodeURIComponent(JSON.stringify(bill))}`
	})
}

// 格式化金额显示
const formatAmount = (amount) => {
	const absAmount = Math.abs(amount)
	if (absAmount >= 100000) {
		// 大于等于10万，保留两位小数
		return absAmount.toFixed(2)
	} else {
		// 小于10万，保留两位小数
		return absAmount.toFixed(2)
	}
}

// 导出账单
const exportBills = async () => {
	// 获取当前筛选后的账单
	const billsToExport = data.groupedBills.flatMap(group => group.bills)
	
	if (billsToExport.length === 0) {
		uni.showToast({
			title: '暂无账单数据',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({ title: '正在生成Excel...' })
	
	try {
		// #ifdef MP-WEIXIN
		// 调用云函数生成Excel
		const res = await wx.cloud.callFunction({
			name: 'exportExcel',
			data: {
				bills: billsToExport
			}
		})
		
		uni.hideLoading()
		
		if (res.result.success) {
			// 下载文件
			uni.showModal({
				title: '导出成功',
				content: `已导出${billsToExport.length}笔账单，是否下载？`,
				confirmText: '下载',
				success: (modalRes) => {
					if (modalRes.confirm) {
						uni.downloadFile({
							url: res.result.tempFileURL,
							success: (downloadRes) => {
								if (downloadRes.statusCode === 200) {
									// 保存到本地
									uni.saveFile({
										tempFilePath: downloadRes.tempFilePath,
										success: (saveRes) => {
											uni.showModal({
												title: '下载成功',
												content: '文件已保存，是否打开？',
												confirmText: '打开',
												success: (openRes) => {
													if (openRes.confirm) {
														uni.openDocument({
															filePath: saveRes.savedFilePath,
															fileType: 'xlsx',
															success: () => {
																console.log('打开文档成功')
															},
															fail: (err) => {
																console.error('打开文档失败:', err)
																uni.showToast({
																	title: '打开失败',
																	icon: 'none'
																})
															}
														})
													}
												}
											})
										},
										fail: (err) => {
											console.error('保存文件失败:', err)
											uni.showToast({
												title: '保存失败',
												icon: 'none'
											})
										}
									})
								}
							},
							fail: (err) => {
								console.error('下载失败:', err)
								uni.showToast({
									title: '下载失败',
									icon: 'none'
								})
							}
						})
					}
				}
			})
		} else {
			uni.showToast({
				title: '生成失败：' + res.result.error,
				icon: 'none'
			})
		}
		// #endif
		
		// #ifndef MP-WEIXIN
		uni.hideLoading()
		uni.showToast({
			title: '当前环境不支持Excel导出',
			icon: 'none'
		})
		// #endif
		
	} catch (error) {
		uni.hideLoading()
		console.error('导出账单失败:', error)
		uni.showToast({
			title: '导出失败',
			icon: 'none'
		})
	}
}

const showActionSheet = (bill) => {
	uni.showActionSheet({
		itemList: ['编辑账单', '删除账单'],
		success: (res) => {
			if (res.tapIndex === 0) {
				editBill(bill)
			} else if (res.tapIndex === 1) {
				confirmDeleteBill(bill)
			}
		}
	})
}

// 检查登录状态
const checkLogin = () => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isLogin
}

// 提示登录
const promptLogin = () => {
	uni.showModal({
		title: '需要登录',
		content: '登录后可以查看和管理账单',
		confirmText: '去登录',
		cancelText: '稍后',
		success: (res) => {
			if (res.confirm) {
				// 跳转到登录页面
				// #ifdef MP-WEIXIN
				// 小程序直接在个人中心登录
				uni.switchTab({
					url: '/pages/tab/profile/profile'
				})
				// #endif
				
				// #ifdef APP-PLUS
				// APP跳转到登录页面
				uni.navigateTo({
					url: '/pages/user/login'
				})
				// #endif
			}
		}
	})
}

const editBill = (bill) => {
	// 检查登录
	if (!checkLogin()) {
		promptLogin()
		return
	}
	
	// 跳转到编辑页面（使用确认页面)
	uni.navigateTo({
		url: `/pages/record/confirm/confirm?editMode=true&billId=${bill.id}`
	})
}

const confirmDeleteBill = (bill) => {
	// 检查登录
	if (!checkLogin()) {
		promptLogin()
		return
	}
	
	uni.showModal({
		title: '确认删除',
		content: `确定要删除这笔账单吗？\n${bill.merchant} ¥${bill.amount.toFixed(2)}`,
		confirmColor: '#F5222D',
		success: async (res) => {
			if (res.confirm) {
				await deleteBill(bill)
			}
		}
	})
}

const deleteBill = async (bill) => {
	uni.showLoading({ title: '删除中...' })
	try {
		const result = await billStorage.deleteBill(bill.id, bill._id)
		if (result.success) {
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			})
			// 重新加载数据
			await loadData()
			// 通知其他页面刷新
			uni.$emit('billSaved')
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

onLoad(() => {
	loadData()
})

onShow(() => {
	// 检查是否需要刷新
	const needRefresh = uni.getStorageSync('needRefreshBills')
	if (needRefresh) {
		uni.removeStorageSync('needRefreshBills')
		loadDataQuietly() // 使用静默刷新
		return
	}
	
	// 检查登录状态，如果已登录且没有数据，则加载数据
	const userInfo = uni.getStorageSync('userInfo')
	if (userInfo && userInfo.isLogin && data.groupedBills.length === 0) {
		loadDataQuietly() // 静默加载数据
	}
})

// 下拉刷新
onPullDownRefresh(async () => {
	try {
		await loadData()
		uni.stopPullDownRefresh()
	} catch (error) {
		console.error('刷新失败:', error)
		uni.stopPullDownRefresh()
	}
})
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.page {
		width: 100%;
		min-height: 100vh;
		background: #F7F8FA;
	}
	
	.container {
		padding-bottom: 100rpx;
	}
	
	/* 顶部搜索栏 */
	.header-bar {
		padding: $spacing-lg;
		background: $bg-white;
		border-bottom: 1rpx solid #F0F0F0;
	}
	
	/* 搜索输入框 */
	.search-input-wrapper {
		display: flex;
		align-items: center;
		background: #F5F5F5;
		border-radius: $radius-2xl;
		padding: $spacing-md $spacing-lg;
		height: 60rpx;
		transition: all $transition-fast;
	}
	
	.search-input-wrapper:focus-within {
		background: #EBEBEB;
		box-shadow: 0 0 0 2rpx rgba(82, 196, 26, 0.2);
	}
	
	.search-icon {
		font-size: 32rpx;
		color: $text-tertiary;
		flex-shrink: 0;
	}
	
	.search-input {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
		margin-left: $spacing-md;
		background: transparent;
	}
	
	/* placeholder样式 */
	.search-input::placeholder {
		color: rgba(0, 0, 0, 0.35);
		font-size: $font-size-base;
		font-weight: $font-weight-light;
	}
	
	.clear-icon {
		font-size: 32rpx;
		color: $text-tertiary;
		padding: $spacing-sm;
		flex-shrink: 0;
		transition: all $transition-fast;
	}
	
	.clear-icon:active {
		transform: scale(0.9);
		color: $text-secondary;
	}
	
	/* 统计卡片 - 美团风格优化 */
	.summary-card {
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
		margin: $spacing-md;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: 32rpx $spacing-lg; /* 美团风格：更紧凑的内边距 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}
	
	.summary-header {
		margin-bottom: $spacing-md;
	}
	
	.month-selector {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		padding: 6rpx $spacing-md;
		background: rgba(255, 255, 255, 0.2);
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		backdrop-filter: blur(10rpx);
		transition: all $transition-fast;
	}
	
	.month-selector:active {
		transform: scale(0.96);
		background: rgba(255, 255, 255, 0.3);
	}
	
	.month-text {
		font-size: $font-size-sm;
		color: $text-white;
		font-weight: $font-weight-medium;
	}
	
	.month-arrow {
		font-size: 18rpx;
		color: rgba(255, 255, 255, 0.8);
	}
	
	.summary-amounts {
		display: flex;
		align-items: center;
		justify-content: space-around;
	}
	
	.amount-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}
	
	.amount-label {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.8);
		font-weight: $font-weight-normal;
	}
	
	.amount-value {
		font-size: 36rpx;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
		margin-top: 4rpx;
	}
	
	.amount-value.expense {
		color: #FF4D4F;
	}
	
	.amount-value.income {
		color: #FFFFFF;
	}
	
	.amount-divider {
		width: 1rpx;
		height: 60rpx;
		background: rgba(255, 255, 255, 0.25);
	}
	
	/* 筛选标签 - 横向滚动 */
	.filter-scroll {
		padding: $spacing-md;
		margin-bottom: $spacing-lg; /* 增加与列表的间距 */
		white-space: nowrap;
		background: $bg-white;
	}
	
	.filter-tags {
		display: inline-flex;
		gap: $spacing-sm;
	}
	
	.filter-tag {
		display: inline-flex;
		align-items: center;
		gap: 4rpx;
		padding: 10rpx 24rpx; /* 美团风格：更紧凑的内边距 */
		background: #F5F5F5;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		border: 2rpx solid transparent;
		transition: all $transition-fast;
		white-space: nowrap;
		position: relative;
		overflow: hidden;
	}
	
	.filter-tag::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(115, 209, 61, 0.1) 100%);
		opacity: 0;
		transition: opacity $transition-fast;
	}
	
	.filter-tag.active {
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
		border-color: #52C41A;
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
	}
	
	.tag-text {
		font-size: $font-size-base;
		color: #666666;
		font-weight: $font-weight-semibold;
		position: relative;
		z-index: 1;
		letter-spacing: 0.5rpx;
	}
	
	.filter-tag.active .tag-text {
		color: #FFFFFF;
		font-weight: $font-weight-bold;
	}
	
	.export-tag {
		background: linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%);
		border-color: #13C2C2;
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
	}
	
	.export-tag .tag-text {
		color: #FFFFFF;
		font-weight: $font-weight-bold;
	}
	
	.export-tag .tag-icon {
		font-size: $font-size-lg;
	}
	
	.export-tag:active {
		transform: scale(0.95);
		box-shadow: 0 2rpx 8rpx rgba(19, 194, 194, 0.2);
	}
	
	.tag-arrow {
		font-size: 20rpx;
		color: $text-tertiary;
		margin-left: 2rpx;
	}
	
	.filter-tag.active .tag-arrow {
		color: rgba(255, 255, 255, 0.8);
	}
	
	/* 账单列表 */
	.bills-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
		padding: 0 $spacing-md $spacing-md;
	}
	
	.date-group {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		overflow: hidden;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}
	
	.date-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $spacing-lg $spacing-lg;
		/* 纯白背景 */
		background: #FFFFFF;
		border-bottom: 2rpx solid #F0F0F0;
		position: relative;
		overflow: hidden;
		/* 添加阴影增加层次感 */
		box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.02);
	}
	
	/* 日期头部装饰线 - 美团风格：更细的装饰线 */
	.date-header::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4rpx; /* 美团风格：更细 */
		background: linear-gradient(180deg, #52C41A 0%, #73D13D 100%);
		border-radius: 0 2rpx 2rpx 0;
	}
	
	.date-text {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-bold;
		letter-spacing: 0.5rpx;
		padding-left: $spacing-sm; /* 为装饰线留出空间 */
	}
	
	.date-summary {
		display: flex;
		gap: $spacing-lg;
		font-size: $font-size-sm;
		font-family: 'DIN Alternate', monospace;
		font-weight: $font-weight-semibold;
	}
	
	.date-income {
		color: #52C41A;
		background: rgba(82, 196, 26, 0.1);
		padding: 2rpx 10rpx; /* 美团风格：更紧凑 */
		border-radius: $radius-sm; /* 美团风格：6rpx圆角 */
	}
	
	.date-expense {
		color: #FF4D4F;
		background: rgba(255, 77, 79, 0.1);
		padding: 2rpx 10rpx; /* 美团风格：更紧凑 */
		border-radius: $radius-sm; /* 美团风格：6rpx圆角 */
	}
	
	.bill-items {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm; /* 账单项之间的间距 */
	}
	
	.bill-item {
		position: relative;
		display: flex;
		align-items: center;
		padding: $spacing-md;
		background: $bg-white;
		border-bottom: 1rpx solid #F0F0F0;
		transition: all $transition-fast;
		/* 美团风格：去掉阴影，更简洁 */
		border-radius: $radius-md; /* 美团风格：8rpx圆角 */
		margin-bottom: $spacing-sm;
	}
	
	.bill-item:active {
		background: #FAFAFA;
		/* 美团风格：去掉阴影变化 */
		transform: scale(0.98); /* 美团风格：缩放反馈 */
	}
	
	.bill-item:last-child {
		border-bottom: none;
		margin-bottom: 0;
	}
	
	.bill-icon-wrapper {
		width: 64rpx; /* 美团风格：更小的图标容器 */
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #F5F5F5;
		border-radius: $radius-md; /* 美团风格：8rpx圆角 */
		margin-right: $spacing-md;
		flex-shrink: 0;
	}
	
	.bill-icon {
		font-size: 40rpx; /* 美团风格：稍小的图标 */
	}
	
	.bill-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
	}
	
	.bill-main {
		display: flex;
		align-items: center;
		gap: $spacing-sm;
		width: 100%;
	}
	
	.bill-merchant {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 280rpx;
	}
	
	.bill-category {
		font-size: $font-size-xs;
		color: $text-tertiary;
		padding: 2rpx 8rpx;
		background: #F5F5F5;
		border-radius: $radius-sm; /* 美团风格：6rpx圆角 */
		white-space: nowrap;
		flex-shrink: 0;
	}
	
	.bill-time {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}
	
	.bill-amount-wrapper {
		flex-shrink: 0;
		margin-left: $spacing-md;
	}
	
	.bill-amount {
		font-size: $font-size-lg;
		font-weight: $font-weight-semibold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.bill-amount.income {
		color: #52C41A;
	}
	
	.bill-amount.expense {
		color: #FF4D4F;
	}
	
	.bill-delete-icon {
		width: 44rpx; /* 美团风格：更小的删除按钮 */
		height: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: $spacing-sm;
		background: #FFF1F0;
		border-radius: $radius-md; /* 美团风格：8rpx圆角 */
		transition: all $transition-fast;
		flex-shrink: 0;
	}
	
	.bill-delete-icon:active {
		background: #FF4D4F;
		transform: scale(0.9);
	}
	
	.bill-delete-icon .delete-icon {
		font-size: 24rpx;
		transition: transform $transition-fast;
	}
	
	.bill-delete-icon:active .delete-icon {
		transform: rotate(15deg);
	}
	
	/* 空状态 - 美团风格 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 150rpx 0; /* 稍微增大内边距 */
		margin-top: 30rpx; /* 增加顶部距离 */
		text-align: center;
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}
	
	.empty-icon {
		font-size: 120rpx;
		margin-bottom: $spacing-lg;
		opacity: 0.3;
	}
	
	.empty-text {
		font-size: $font-size-lg;
		color: $text-secondary;
		font-weight: $font-weight-medium;
		margin-bottom: $spacing-xs;
	}
	
	.empty-tip {
		font-size: $font-size-sm;
		color: $text-tertiary;
	}
</style>
