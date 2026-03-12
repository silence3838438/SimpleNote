<template>
	<view class="page">
		<!-- 自定义导航栏（随手记风格） -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<view class="navbar-title">
					<text class="title-text">账单</text>
				</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56) + 'px' }">
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
					<view class="month-selector" @click="showMonthPicker">
						<text class="month-text">{{ data.selectedMonth || '全部账单' }}</text>
						<text class="month-arrow">▼</text>
					</view>
				</view>
				<view class="summary-amounts">
					<view class="amount-item">
						<view class="amount-label-row">
							<text class="amount-label">收入</text>
							<image class="eye-icon-img" :src="data.hideIncome ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleIncome" mode="aspectFit"></image>
						</view>
						<text class="amount-value income" v-if="!data.hideIncome">
							<text class="currency-symbol">¥</text>{{ formatAmount(data.totalIncome) }}
						</text>
						<text class="amount-value income" v-else>****</text>
					</view>
					<view class="amount-divider"></view>
					<view class="amount-item">
						<view class="amount-label-row">
							<text class="amount-label">支出</text>
							<image class="eye-icon-img" :src="data.hideExpense ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleExpense" mode="aspectFit"></image>
						</view>
						<text class="amount-value expense" v-if="!data.hideExpense">
							-<text class="currency-symbol">¥</text>{{ formatAmount(data.totalExpense) }}
						</text>
						<text class="amount-value expense" v-else>****</text>
					</view>
					<view class="amount-divider"></view>
					<view class="amount-item">
						<view class="amount-label-row">
							<text class="amount-label">结余</text>
							<image class="eye-icon-img" :src="data.hideBalance ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleBalance" mode="aspectFit"></image>
						</view>
						<text class="amount-value" :class="data.balance >= 0 ? 'income' : 'expense'" v-if="!data.hideBalance">
							{{ data.balance >= 0 ? '' : '-' }}<text class="currency-symbol">¥</text>{{ formatAmount(data.balance) }}
						</text>
						<text class="amount-value" :class="data.balance >= 0 ? 'income' : 'expense'" v-else>****</text>
					</view>
				</view>
			</view>
			
			<!-- 自定义月份选择器弹窗 -->
			<view class="custom-picker-modal" v-if="data.showCustomPicker" @click="closeMonthPicker">
				<view class="picker-content" @click.stop>
					<view class="picker-header">
						<text class="picker-cancel" @click="closeMonthPicker">取消</text>
						<text class="picker-title">选择月份</text>
						<text class="picker-confirm" @click="confirmMonthPicker">完成</text>
					</view>
					<picker-view class="picker-view" :value="data.pickerValue" @change="onPickerChange" indicator-style="height: 50px">
						<picker-view-column>
							<view 
								class="picker-item" 
								:class="{ 'picker-item-selected': index === data.pickerValue[0] }"
								v-for="(year, index) in data.years" 
								:key="year"
							>
								{{ year }}
							</view>
						</picker-view-column>
						<picker-view-column>
							<view 
								class="picker-item" 
								:class="{ 'picker-item-selected': index === data.pickerValue[1] }"
								v-for="(item, index) in data.availableMonths" 
								:key="item"
							>
								{{ item }}
							</view>
						</picker-view-column>
					</picker-view>
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
							<view class="bill-content">
								<view class="bill-main">
									<text class="bill-icon">{{ bill.categoryIcon }}</text>
									<text class="bill-merchant">{{ bill.merchant }}</text>
									<text class="bill-category">{{ bill.categoryName }}</text>
								</view>
								<text class="bill-time">{{ bill.timeText }}</text>
							</view>
							<view class="bill-amount-wrapper">
								<text class="bill-amount" :class="bill.type === 'income' ? 'income' : 'expense'">
									{{ bill.type === 'income' ? '' : '-' }}<text class="currency-symbol">¥</text>{{ bill.amount.toFixed(2) }}
								</text>
							</view>
							<view class="bill-delete-icon" @click.stop="confirmDeleteBill(bill)">
								<view class="delete-icon-wrapper">
									<text class="delete-icon">−</text>
								</view>
							</view>
						</view>
					</view>
				</view>
				
				<!-- 空状态 -->
				<view class="empty-state" v-if="data.filteredBills.length === 0">
					<image class="empty-image" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/emptyIcon.png" mode="aspectFit"></image>
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
import request from '@/utils/request.js'

// 获取状态栏高度
const systemInfo = uni.getWindowInfo()
const statusBarHeight = systemInfo.statusBarHeight || 0

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
	// 日期选择器相关
	currentMonth: '',
	// 自定义月份选择器
	showCustomPicker: false,
	years: [],
	months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	monthsWithAll: ['全部', '1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
	availableMonths: ['全部'], // 当前可用的月份列表（根据年份动态变化）
	pickerValue: [0, 0],
	tempYear: '',
	tempMonth: 0,
	// 防止点击穿透的标志
	isPickerClosing: false,
	// 隐藏金额状态
	hideIncome: false,
	hideExpense: false,
	hideBalance: false
})

const loadData = async () => {
	// 读取金额隐藏状态
	data.hideIncome = uni.getStorageSync('hideIncomeBills') || false
	data.hideExpense = uni.getStorageSync('hideExpenseBills') || false
	data.hideBalance = uni.getStorageSync('hideBalanceBills') || false
	
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
		
		// 初始化当前月份
		const now = new Date()
		const year = now.getFullYear()
		const month = (now.getMonth() + 1).toString().padStart(2, '0')
		data.currentMonth = `${year}-${month}`
		data.selectedMonth = `${year}年${month}月` // 默认选中当前年月
		
		// 初始化年份列表（第一项为"全部"）
		data.years = ['全部']
		for (let i = year - 5; i <= year + 5; i++) {
			data.years.push(i)
		}
		
		return
	}
	
	uni.showLoading({ title: '加载中...' })
	try {
		const bills = await billStorage.getFromAPI() // 直接从API获取
		data.allBills = bills || []
		data.categories = uni.getStorageSync('categories') || []
		
		// 初始化当前月份
		const now = new Date()
		const year = now.getFullYear()
		const month = (now.getMonth() + 1).toString().padStart(2, '0')
		data.currentMonth = `${year}-${month}`
		data.selectedMonth = `${year}年${month}月` // 默认选中当前年月
		
		// 初始化年份列表（第一项为"全部"）
		data.years = ['全部']
		for (let i = year - 5; i <= year + 5; i++) {
			data.years.push(i)
		}
		
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
		
		// 应用筛选
		applyFilters()
	} catch (error) {
		console.error('静默加载账单失败:', error)
		// 静默失败，不显示错误提示
	}
}

// 月份选择器改变事件
const onMonthChange = (e) => {
	const selectedMonth = e.detail.value // 格式: YYYY-MM
	data.currentMonth = selectedMonth
	
	const [year, month] = selectedMonth.split('-')
	data.selectedMonth = `${year}年${month}月`
	
	applyFilters()
}

// 显示月份选择器
const showMonthPicker = () => {
	data.showCustomPicker = true
	uni.hideTabBar() // 隐藏tabbar
	
	// 设置当前选中值
	if (data.selectedMonth) {
		// 如果已选择月份，定位到该月份
		const [yearStr, monthStr] = data.selectedMonth.replace('年', '-').replace('月', '').split('-')
		const year = parseInt(yearStr)
		const month = parseInt(monthStr)
		const yearIndex = data.years.indexOf(year)
		
		// 设置可用月份为1-12月
		data.availableMonths = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
		const monthIndex = month - 1 // 1月对应索引0
		
		data.pickerValue = [yearIndex, monthIndex]
		data.tempYear = year
		data.tempMonth = month
	} else {
		// 如果未选择（显示全部），定位到"全部"
		data.availableMonths = ['全部'] // 左边选全部，右边只能选全部
		data.pickerValue = [0, 0]
		data.tempYear = '全部'
		data.tempMonth = '全部'
	}
}

// 关闭月份选择器
const closeMonthPicker = () => {
	data.showCustomPicker = false
	uni.showTabBar() // 显示tabbar
}

// picker-view值改变
const onPickerChange = (e) => {
	const val = e.detail.value
	const yearIndex = val[0]
	const monthIndex = val[1]
	
	data.tempYear = data.years[yearIndex]
	
	// 如果左边选择"全部"
	if (data.tempYear === '全部') {
		// 右边只能显示"全部"
		data.availableMonths = ['全部']
		data.pickerValue = [yearIndex, 0] // 强制右边选中"全部"
		data.tempMonth = '全部'
	} else {
		// 左边选择具体年份，右边显示1-12月
		data.availableMonths = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
		// 如果之前右边是"全部"，切换到1月
		if (monthIndex >= data.availableMonths.length) {
			data.pickerValue = [yearIndex, 0]
			data.tempMonth = 1
		} else {
			data.pickerValue = [yearIndex, monthIndex]
			const monthItem = data.availableMonths[monthIndex]
			data.tempMonth = parseInt(monthItem)
		}
	}
}

// 确认选择
const confirmMonthPicker = async () => {
	const year = data.tempYear
	const month = data.tempMonth
	
	// 如果选择"全部"
	if (year === '全部' || month === '全部') {
		data.selectedMonth = null
		data.currentMonth = ''
	} else {
		const monthStr = month.toString().padStart(2, '0')
		data.selectedMonth = `${year}年${monthStr}月`
		data.currentMonth = `${year}-${monthStr}`
	}
	
	// 设置标志位，防止点击穿透
	data.isPickerClosing = true
	
	// 先关闭选择器
	data.showCustomPicker = false
	uni.showTabBar() // 显示tabbar
	
	// 延迟500ms后重置标志位
	setTimeout(() => {
		data.isPickerClosing = false
	}, 500)
	
	// 检查登录状态
	if (!checkLogin()) {
		data.allBills = []
		data.filteredBills = []
		data.groupedBills = []
		data.totalIncome = 0
		data.totalExpense = 0
		data.balance = 0
		return
	}
	
	uni.showLoading({ title: '加载中...' })
	
	try {
		data.allBills = await billStorage.getFromAPI()
		applyFilters()
	} catch (error) {
		console.error('加载数据失败:', error)
		uni.showToast({
			title: '加载失败',
			icon: 'none'
		})
	} finally {
		uni.hideLoading()
	}
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
	// 防止点击穿透
	if (data.isPickerClosing) {
		return
	}
	
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
		// 调用后端API导出Excel
		const res = await request.call('billManager', {
			action: 'exportExcel',
			data: {
				bills: billsToExport
			}
		})
		
		uni.hideLoading()
		
		if (res.success && res.downloadUrl) {
			// 使用uni.downloadFile下载文件
			uni.downloadFile({
				url: res.downloadUrl,
				success: (downloadRes) => {
					if (downloadRes.statusCode === 200) {
						// 下载成功，直接打开文件
						uni.openDocument({
							filePath: downloadRes.tempFilePath,
							fileType: 'xlsx',
							success: () => {
								console.log('打开文档成功')
							},
							fail: (err) => {
								console.error('打开文档失败:', err)
								uni.showToast({
									title: '请安装WPS或Excel应用',
									icon: 'none',
									duration: 3000
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
		} else {
			uni.showToast({
				title: '导出失败: ' + (res.message || '未知错误'),
				icon: 'none'
			})
		}
	} catch (error) {
		uni.hideLoading()
		console.error('导出账单失败:', error)
		uni.showToast({
			title: '导出失败: ' + (error.message || '网络错误'),
			icon: 'none',
			duration: 3000
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
	// #ifdef APP-PLUS
	// APP端：检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isLogin
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端：始终返回true（已自动登录）
	return true
	// #endif
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
			uni.hideLoading()
			uni.showToast({
				title: '删除成功',
				icon: 'success'
			})
			// 静默重新加载数据（不显示loading）
			await loadDataQuietly()
			// 通知其他页面静默刷新
			uni.$emit('billSaved')
		} else {
			throw new Error('删除失败')
		}
	} catch (error) {
		console.error('删除账单失败:', error)
		uni.hideLoading()
		uni.showToast({
			title: '删除失败',
			icon: 'none'
		})
	}
}

// 切换收入显示/隐藏
const toggleIncome = () => {
	data.hideIncome = !data.hideIncome
	uni.setStorageSync('hideIncomeBills', data.hideIncome)
}

// 切换支出显示/隐藏
const toggleExpense = () => {
	data.hideExpense = !data.hideExpense
	uni.setStorageSync('hideExpenseBills', data.hideExpense)
}

// 切换结余显示/隐藏
const toggleBalance = () => {
	data.hideBalance = !data.hideBalance
	uni.setStorageSync('hideBalanceBills', data.hideBalance)
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
		background: linear-gradient(180deg, #F8F9FA 0%, #F5F7FA 50%, #FAFBFC 100%); /* 柔和的灰色渐变 */
	}
	
	/* 自定义导航栏（随手记风格 - 纯白色） */
	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: $bg-white; /* 随手记风格：纯白色导航栏 */
		z-index: 1000;
		border-bottom: 1rpx solid $border-color; /* 浅灰色边框 */
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04); /* 轻微阴影 */
		
		.navbar-content {
			height: 56px; /* 从44px增加到56px */
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 $spacing-lg;
		}
		
		.navbar-left,
		.navbar-right {
			width: 80rpx;
			display: flex;
			align-items: center;
		}
		
		.navbar-right {
			justify-content: flex-end;
		}
		
		.navbar-title {
			flex: 1;
			display: flex;
			justify-content: center;
		}
		
		.title-text {
			font-size: $font-size-lg; /* 使用统一的大字体 */
			font-weight: $font-weight-semibold;
			color: $text-primary; /* 深灰色文字 */
		}
	}
	
	.container {
		padding: $spacing-sm $spacing-xl;
		padding-bottom: 100rpx;
		background: transparent;
	}
	
	/* 顶部搜索栏 - 精致版 */
	.header-bar {
		padding: $spacing-lg 0;
		background: transparent;
		margin-bottom: $spacing-xs;
	}
	
	/* 搜索输入框 - 精致版 */
	.search-input-wrapper {
		display: flex;
		align-items: center;
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		border-radius: 14rpx;
		padding: $spacing-md $spacing-lg;
		height: 68rpx;
		transition: all $transition-fast;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03), 0 1rpx 4rpx rgba(0, 0, 0, 0.02);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
	}
	
	.search-input-wrapper:focus-within {
		box-shadow: 0 4rpx 16rpx rgba(7, 193, 96, 0.08), 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		border-color: rgba(7, 193, 96, 0.2);
	}
	
	.search-icon {
		font-size: 32rpx;
		color: $text-tertiary;
		flex-shrink: 0;
		opacity: 0.6;
	}
	
	.search-input {
		flex: 1;
		font-size: $font-size-base;
		color: $text-primary;
		margin-left: $spacing-md;
		background: transparent;
		font-weight: 400;
	}
	
	/* placeholder样式 */
	.search-input::placeholder {
		color: $text-tertiary;
		font-size: $font-size-base;
		font-weight: 400;
	}
	
	.clear-icon {
		font-size: 28rpx;
		color: $text-tertiary;
		padding: $spacing-sm;
		flex-shrink: 0;
		transition: all $transition-fast;
		opacity: 0.5;
	}
	
	.clear-icon:active {
		transform: scale(0.92);
		opacity: 0.8;
	}
	
	/* 统计卡片 - 精致高端版 */
	.summary-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		margin: 0 0 $spacing-2xl 0;
		border-radius: 16rpx;
		padding: 36rpx $spacing-xl;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06), 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
		border: 1rpx solid rgba(255, 255, 255, 0.9);
		position: relative;
		overflow: hidden;
	}
	
	/* 卡片装饰光效 */
	.summary-card::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -20%;
		width: 180rpx;
		height: 180rpx;
		background: radial-gradient(circle, rgba(7, 193, 96, 0.06) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}
	
	.summary-header {
		margin-bottom: $spacing-xl;
		position: relative;
		z-index: 1;
	}
	
	.month-selector {
		display: inline-flex;
		align-items: center;
		gap: $spacing-xs;
		padding: 8rpx $spacing-lg;
		background: rgba(7, 193, 96, 0.06);
		border-radius: 20rpx; /* 胶囊形状 */
		transition: all $transition-fast;
		border: 1rpx solid rgba(7, 193, 96, 0.12);
	}
	
	.month-selector:active {
		transform: scale(0.96);
		background: rgba(7, 193, 96, 0.1);
	}
	
	.month-text {
		font-size: $font-size-sm;
		color: $primary-color;
		font-weight: 500;
	}
	
	.month-arrow {
		font-size: 18rpx;
		color: $primary-color;
		opacity: 0.7;
	}
	
	.summary-amounts {
		display: flex;
		align-items: center;
		justify-content: space-around;
		position: relative;
		z-index: 1;
	}
	
	.amount-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 12rpx;
	}
	
	.amount-label-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.amount-label {
		font-size: 22rpx;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
		letter-spacing: 0.5rpx;
	}
	
	.eye-icon-img {
		width: 24rpx;
		height: 24rpx;
		opacity: 0.6;
		transition: all $transition-fast;
	}
	
	.eye-icon-img:active {
		opacity: 1;
		transform: scale(0.9);
	}
	
	.amount-value {
		font-size: 44rpx; /* 从38rpx调大到44rpx */
		font-weight: 700; /* 加粗字体 */
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
		margin-top: 4rpx;
		letter-spacing: -0.5rpx;
	}
	
	.amount-value.expense {
		color: $error-color;
	}
	
	.amount-value.income {
		color: $success-color;
	}
	
	.amount-divider {
		width: 1rpx;
		height: 60rpx;
		background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.06), transparent);
	}
	
	/* 筛选标签 - 横向滚动（统一样式） */
	.filter-scroll {
		padding: 4rpx 0; /* 增加上下内边距，防止按钮上浮时被截断 */
		margin-top: $spacing-md;
		margin-bottom: $spacing-xl;
		white-space: nowrap;
		background: transparent;
	}
	
	.filter-tags {
		display: inline-flex; /* 改为 inline-flex，宽度自适应内容 */
		gap: $spacing-md; /* 从 $spacing-xs 增大到 $spacing-md */
		background: transparent; /* 去掉白色背景 */
		border-radius: 0; /* 去掉圆角 */
		padding: 0; /* 去掉内边距 */
		border: none; /* 去掉边框 */
	}
	
	.filter-tag {
		flex: 0 0 auto;
		min-width: 110rpx; /* 从 100rpx 增加到 110rpx */
		text-align: center;
		padding: 16rpx 26rpx; /* 调整为 16rpx 26rpx */
		font-size: 28rpx; /* 从 $font-size-sm 增大到 28rpx */
		color: $text-secondary;
		background: #FFFFFF; /* 纯白色背景 */
		border-radius: 16rpx; /* 从 12rpx 增大到 16rpx，更圆润 */
		transition: all $transition-fast;
		font-weight: $font-weight-medium;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06); /* 增强阴影，从 0 2rpx 8rpx 改为 0 4rpx 12rpx */
		border: 1rpx solid #F0F0F0; /* 边框颜色稍微浅一点 */
		white-space: nowrap;
		letter-spacing: 0.5rpx; /* 增加字间距 */
	}
	
	.filter-tag:active {
		background: $bg-hover;
		transform: scale(0.98);
	}
	
	.filter-tag.active {
		background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
		color: $primary-color;
		font-weight: $font-weight-bold; /* 从 semibold 改为 bold，更突出 */
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.2); /* 增强阴影 */
		border: 1rpx solid rgba(82, 196, 26, 0.3); /* 边框更明显 */
		/* 移除上浮效果，避免顶部被截断 */
	}
	
	.filter-tag.active:active {
		transform: scale(0.98);
	}
	
	.tag-text {
		font-size: 28rpx; /* 从 $font-size-sm 增大到 28rpx */
		color: inherit;
		font-weight: inherit;
		letter-spacing: 0.5rpx;
	}
	
	.export-tag {
		background: linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%);
		color: #FFFFFF;
		font-weight: $font-weight-bold; /* 从 600 改为 bold */
		box-shadow: 0 4rpx 16rpx rgba(19, 194, 194, 0.3); /* 增强阴影 */
		border: none;
	}
	
	.export-tag .tag-text {
		color: #FFFFFF;
		font-weight: 600;
	}
	
	.export-tag:active {
		transform: scale(0.96);
		box-shadow: 0 1rpx 4rpx rgba(19, 194, 194, 0.2);
	}
	
	/* 账单列表 - 精致高端版 */
	.bills-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-lg;
		padding: 0 0 $spacing-md 0;
		margin-top: $spacing-xs;
	}
	
	.date-group {
		background: #FFFFFF;
		border-radius: 16rpx;
		overflow: hidden;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid #F0F0F0;
	}
	
	.date-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $spacing-lg $spacing-xl;
		background: #FFFFFF;
		border-bottom: 2rpx solid #F5F5F5;
		position: relative;
	}
	
	.date-text {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: 600;
		letter-spacing: 0.5rpx;
	}
	
	.date-summary {
		display: flex;
		gap: $spacing-md;
		font-size: 28rpx; /* 从22rpx调大到28rpx */
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
		font-weight: 600; /* 从500调整为600，稍微加粗 */
	}
	
	.date-income {
		color: $success-color;
		background: rgba(7, 193, 96, 0.08);
		padding: 4rpx 12rpx;
		border-radius: 10rpx;
	}
	
	.date-expense {
		color: $error-color;
		background: rgba(238, 10, 36, 0.08);
		padding: 4rpx 12rpx;
		border-radius: 10rpx;
	}
	
	.bill-items {
		display: flex;
		flex-direction: column;
		background: #FFFFFF;
	}
	
	.bill-item {
		position: relative;
		display: flex;
		align-items: center;
		padding: $spacing-lg $spacing-xl;
		background: $bg-white;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.03);
		transition: all $transition-fast;
	}
	
	.bill-item:active {
		background: rgba(7, 193, 96, 0.02);
	}
	
	.bill-item:last-child {
		border-bottom: none;
	}
	

	
	.bill-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}
	
	.bill-main {
		display: flex;
		align-items: center;
		gap: $spacing-lg; /* 从 $spacing-sm 增大到 $spacing-lg，增加emoji和商家名称的距离 */
		width: 100%;
	}
	
	.bill-icon {
		font-size: 32rpx;
		flex-shrink: 0;
		width: 32rpx;
		text-align: center;
	}
	
	.bill-merchant {
		font-size: $font-size-base; /* 28rpx，基础字号 */
		color: $text-primary;
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		max-width: 280rpx;
		letter-spacing: 0.3rpx;
	}
	
	.bill-category {
		font-size: 20rpx;
		color: $text-tertiary;
		padding: 3rpx 10rpx;
		background: rgba(0, 0, 0, 0.03);
		border-radius: 8rpx; /* 更圆润 */
		white-space: nowrap;
		flex-shrink: 0;
		letter-spacing: 0.3rpx;
	}
	
	.bill-time {
		font-size: 22rpx;
		color: $text-tertiary;
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
		letter-spacing: 0.3rpx;
	}
	
	.bill-amount-wrapper {
		flex-shrink: 0;
		margin-left: $spacing-lg;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}
	
	.bill-amount {
		font-size: 36rpx; /* 从32rpx调大到36rpx */
		font-weight: 600;
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
		letter-spacing: -0.5rpx;
		line-height: 1.2;
	}
	
	.bill-amount.income {
		color: $success-color;
	}
	
	.bill-amount.expense {
		color: $error-color;
	}
	
	/* 货币符号样式 - 比数字小一些 */
	.currency-symbol {
		font-size: 0.8em; /* 相对于父元素字体大小的80% */
		opacity: 0.9;
		color: inherit; /* 继承父元素的颜色 */
	}
	
	.bill-delete-icon {
		width: 40rpx;
		height: 40rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-left: $spacing-md;
		border-radius: 50%;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		flex-shrink: 0;
		position: relative;
		overflow: hidden;
	}
	
	.delete-icon-wrapper {
		width: 28rpx;
		height: 28rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
		border: 1rpx solid rgba(0, 0, 0, 0.08);
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		box-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.1), 0 1rpx 2rpx rgba(0, 0, 0, 0.06);
	}
	
	.bill-delete-icon:active {
		transform: scale(0.95);
	}
	
	.bill-delete-icon:active .delete-icon-wrapper {
		background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
		border-color: #ff4d4f;
		box-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3), 0 1rpx 3rpx rgba(255, 77, 79, 0.2);
		transform: scale(1.05);
	}
	
	.bill-delete-icon .delete-icon {
		font-size: 24rpx;
		color: #666;
		font-weight: 400;
		line-height: 1;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
	}
	
	.bill-delete-icon:active .delete-icon {
		color: #fff;
		font-weight: 600;
	}
	
	/* 空状态 - 精致版 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 120rpx 0;
		margin-top: $spacing-md;
		text-align: center;
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		border-radius: 16rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.03), 0 1rpx 4rpx rgba(0, 0, 0, 0.02);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
	}
	
	/* 空状态装饰光效 */
	.empty-state::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -30%;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(7, 193, 96, 0.04) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}
	
	.empty-image {
		width: 200rpx;
		height: 200rpx;
		margin-bottom: $spacing-xl;
	}
	
	.empty-text {
		font-size: $font-size-lg;
		color: $text-secondary;
		font-weight: 500;
		margin-bottom: $spacing-sm;
		letter-spacing: 0.3rpx;
	}
	
	.empty-tip {
		font-size: $font-size-sm;
		color: $text-tertiary;
		letter-spacing: 0.3rpx;
	}
	
	/* 自定义月份选择器弹窗 */
	.custom-picker-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 9999;
		display: flex;
		align-items: flex-end;
		backdrop-filter: blur(4rpx);
	}
	
	.picker-content {
		width: 100%;
		background: #FFFFFF;
		border-radius: 24rpx 24rpx 0 0;
		animation: slideUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 -4rpx 24rpx rgba(0, 0, 0, 0.12);
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(100%);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.picker-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 32rpx 40rpx;
		border-bottom: 1rpx solid #F5F5F5;
		background: linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%);
	}
	
	.picker-cancel {
		font-size: 30rpx;
		color: #999999;
		padding: 8rpx 16rpx;
		transition: all 0.2s ease;
	}
	
	.picker-cancel:active {
		opacity: 0.6;
		transform: scale(0.95);
	}
	
	.picker-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #333333;
		letter-spacing: 0.5rpx;
	}
	
	.picker-confirm {
		font-size: 30rpx;
		color: $primary-color;
		font-weight: 600;
		padding: 8rpx 16rpx;
		transition: all 0.2s ease;
	}
	
	.picker-confirm:active {
		opacity: 0.7;
		transform: scale(0.95);
	}
	
	.picker-view {
		height: 400rpx;
		position: relative;
		padding: 20rpx 0;
	}
	
	.picker-item {
		text-align: center;
		font-size: 30rpx;
		color: #999999;
		transition: all 0.3s ease;
		font-weight: 400;
	}
	
	/* 选中项文字颜色使用主题色 */
	.picker-item-selected {
		color: $primary-color !important;
		font-weight: 600;
		font-size: 34rpx;
	}
</style>
