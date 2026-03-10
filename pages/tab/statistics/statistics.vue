<template>
	<view class="page">
		<!-- 自定义导航栏（随手记风格） -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<view class="navbar-title">
					<text class="title-text">统计</text>
				</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56) + 'px' }">
			<!-- 时间筛选 -->
			<view class="filter-wrapper">
				<view class="time-filter">
					<view 
						class="filter-item" 
						v-for="(item, index) in data.timeFilters" 
						:key="index"
						:class="{ 'active': data.currentFilter === item.value }"
						@click="changeFilter(item.value)"
					>
						{{ item.label }}
					</view>
					<view 
						class="filter-item custom-filter" 
						:class="{ 'active': data.currentFilter === 'custom' }"
						@click="openCustomPicker"
					>
						自定义
					</view>
				</view>
			</view>
		
		<!-- 收支总览 -->
		<view class="overview-card">
			<view class="overview-header">
				<text class="overview-title">收支总览</text>
				<!-- 生成海报按钮 - 只在12月显示（年度账单） -->
				<view class="poster-btn-mini" v-if="data.billCount > 0 && isDecember()" @click="generatePoster">
					<text class="poster-icon-mini">📸</text>
					<text class="poster-label">年度账单</text>
				</view>
			</view>
			<view class="overview-row">
				<view class="overview-item income-item">
					<view class="overview-label-row">
						<text class="overview-label">总收入</text>
						<image class="eye-icon-img" :src="data.hideIncome ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleIncome" mode="aspectFit"></image>
					</view>
					<text class="overview-amount income-color" v-if="!data.hideIncome">+¥{{ formatAmount(data.totalIncome) }}</text>
					<text class="overview-amount income-color" v-else>****</text>
				</view>
				<view class="overview-item expense-item">
					<view class="overview-label-row">
						<text class="overview-label">总支出</text>
						<image class="eye-icon-img" :src="data.hideExpense ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleExpense" mode="aspectFit"></image>
					</view>
					<text class="overview-amount expense-color" v-if="!data.hideExpense">-¥{{ formatAmount(data.totalExpense) }}</text>
					<text class="overview-amount expense-color" v-else>****</text>
				</view>
			</view>
			<view class="overview-divider"></view>
			<view class="overview-row balance-row">
				<view class="overview-item">
					<view class="overview-label-row">
						<text class="overview-label">结余</text>
						<image class="eye-icon-img" :src="data.hideBalance ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleBalance" mode="aspectFit"></image>
					</view>
					<text class="overview-amount" :class="data.balance >= 0 ? 'income-color' : 'expense-color'" v-if="!data.hideBalance">
						{{ data.balance >= 0 ? '+' : '-' }}¥{{ formatAmount(data.balance) }}
					</text>
					<text class="overview-amount" :class="data.balance >= 0 ? 'income-color' : 'expense-color'" v-else>****</text>
				</view>
				<view class="overview-item">
					<text class="overview-label">笔数</text>
					<text class="overview-count">{{ data.billCount }}</text>
				</view>
			</view>
		</view>
		
		<!-- 类型切换 -->
		<view class="type-tabs">
			<view 
				class="type-tab" 
				:class="{ 'active': data.currentType === 'expense' }"
				@click="switchType('expense')"
			>
				<text class="tab-text">支出分析</text>
			</view>
			<view 
				class="type-tab" 
				:class="{ 'active': data.currentType === 'income' }"
				@click="switchType('income')"
			>
				<text class="tab-text">收入分析</text>
			</view>
		</view>
		
		<!-- 环形图 -->
		<view class="chart-card">
			<view class="card-header">
				<view class="card-title">{{ data.currentType === 'income' ? '收入' : '支出' }}构成</view>
				<view class="chart-type-switcher">
					<view 
						class="chart-type-btn" 
						:class="{ 'active': data.chartType === 'pie' }"
						@click="switchChartType('pie')"
					>
						<text class="chart-type-text">饼状图</text>
					</view>
					<view 
						class="chart-type-btn" 
						:class="{ 'active': data.chartType === 'line' }"
						@click="switchChartType('line')"
					>
						<text class="chart-type-text">折线图</text>
					</view>
					<view 
						class="chart-type-btn" 
						:class="{ 'active': data.chartType === 'bar' }"
						@click="switchChartType('bar')"
					>
						<text class="chart-type-text">柱状图</text>
					</view>
				</view>
			</view>
			<view class="chart-wrapper" v-if="data.chartData.length > 0">
				<!-- 饼状图布局 -->
				<template v-if="data.chartType === 'pie'">
					<!-- 顶部标签 -->
					<view class="label-top" v-if="data.chartData[0]">
						<view class="label-dot" :style="{ backgroundColor: data.chartData[0].color }"></view>
						<view class="label-info">
							<text class="label-text">{{ data.chartData[0].name }}</text>
							<text class="label-value">¥{{ data.chartData[0].amount.toFixed(0) }} ({{ data.chartData[0].percent }}%)</text>
						</view>
					</view>
					
					<view class="chart-row">
						<!-- 左侧标签 -->
						<view class="label-left" v-if="data.chartData[3]">
							<view class="label-dot" :style="{ backgroundColor: data.chartData[3].color }"></view>
							<view class="label-info">
								<text class="label-text">{{ data.chartData[3].name }}</text>
								<text class="label-value">¥{{ data.chartData[3].amount.toFixed(0) }}</text>
								<text class="label-percent">{{ data.chartData[3].percent }}%</text>
							</view>
						</view>
						
						<!-- 中间图表 -->
						<view class="chart-center">
							<canvas 
								v-if="!data.showCustomPicker"
								canvas-id="pieChart" 
								id="pieChart"
								class="chart-canvas"
								@touchstart="handleChartTouch"
							></canvas>
						</view>
						
						<!-- 右侧标签 -->
						<view class="label-right" v-if="data.chartData[1]">
							<view class="label-info">
								<text class="label-text">{{ data.chartData[1].name }}</text>
								<text class="label-value">¥{{ data.chartData[1].amount.toFixed(0) }}</text>
								<text class="label-percent">{{ data.chartData[1].percent }}%</text>
							</view>
							<view class="label-dot" :style="{ backgroundColor: data.chartData[1].color }"></view>
						</view>
					</view>
					
					<!-- 底部标签 -->
					<view class="label-bottom" v-if="data.chartData[2]">
						<view class="label-dot" :style="{ backgroundColor: data.chartData[2].color }"></view>
						<view class="label-info">
							<text class="label-text">{{ data.chartData[2].name }}</text>
							<text class="label-value">¥{{ data.chartData[2].amount.toFixed(0) }} ({{ data.chartData[2].percent }}%)</text>
						</view>
					</view>
				</template>
				
				<!-- 折线图/柱状图布局 -->
				<template v-else>
					<view class="bar-line-chart-container">
						<!-- 折线图 -->
						<canvas 
							v-if="!data.showCustomPicker && data.chartType === 'line'"
							canvas-id="lineChart" 
							id="lineChart"
							class="bar-line-canvas"
							@touchstart="handleChartTouch"
						></canvas>
						<!-- 柱状图 -->
						<canvas 
							v-if="!data.showCustomPicker && data.chartType === 'bar'"
							canvas-id="barChart" 
							id="barChart"
							type="2d"
							class="bar-line-canvas"
							@touchstart="handleChartTouch"
						></canvas>
					</view>
				</template>
			</view>
			<view class="chart-empty" v-else>
				<text class="empty-text">暂无{{ data.currentType === 'income' ? '收入' : '支出' }}数据</text>
				<view class="empty-action" @click="goToHome">快去记账</view>
			</view>
		</view>
		
		<!-- 消费分析 -->
		<view class="analysis-card">
			<view class="card-title">财务分析</view>
			<view class="insights-list" v-if="data.insights.length > 0">
				<view 
					class="insight-item" 
					v-for="(insight, index) in data.insights" 
					:key="index"
					:class="insight.type"
				>
					<view class="insight-content">
						<text class="insight-text">{{ insight.text }}</text>
						<text class="insight-tip" v-if="insight.tip">{{ insight.tip }}</text>
					</view>
				</view>
			</view>
			<view class="analysis-empty" v-else>
				<text class="empty-text">暂无财务分析数据</text>
				<text class="empty-tip">记录账单后查看财务分析</text>
			</view>
		</view>
		
		<!-- 自定义时间选择弹窗 -->
		<view class="custom-picker-modal" v-if="data.showCustomPicker" @click="closeCustomPicker">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-cancel" @click="closeCustomPicker">取消</text>
					<text class="picker-title">{{ data.selectingStart ? '选择开始日期' : '选择结束日期' }}</text>
					<text class="picker-confirm" @click="confirmDateSelection">{{ data.selectingStart ? '下一步' : '完成' }}</text>
				</view>
				
				<!-- 日期范围显示 -->
				<view class="date-range-display">
					<view class="date-display-item" :class="{ 'active': data.selectingStart }">
						<text class="date-label">开始</text>
						<text class="date-value">{{ data.customStartDate || '请选择' }}</text>
					</view>
					<text class="date-separator">至</text>
					<view class="date-display-item" :class="{ 'active': !data.selectingStart }">
						<text class="date-label">结束</text>
						<text class="date-value">{{ data.customEndDate || '请选择' }}</text>
					</view>
				</view>
				
				<picker-view class="picker-view" :value="data.pickerValue" @change="onPickerChange" indicator-style="height: 50px">
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[0] }"
							v-for="(year, index) in data.years" 
							:key="year"
						>
							{{ year }}年
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[1] }"
							v-for="(month, index) in data.months" 
							:key="month"
						>
							{{ month }}月
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[2] }"
							v-for="(day, index) in data.days" 
							:key="day"
						>
							{{ day }}日
						</view>
					</picker-view-column>
				</picker-view>
			</view>
		</view>
</view>
	</view>
</template>

<script setup>
import { reactive, nextTick } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'

// 获取状态栏高度
const systemInfo = uni.getWindowInfo()
const statusBarHeight = systemInfo.statusBarHeight || 0

const data = reactive({
	currentFilter: 'month',
	currentType: 'expense', // 当前查看的类型：expense 或 income
	chartType: 'pie', // 图表类型：pie（饼状图）、line（折线图）、bar（柱状图）
	timeFilters: [
		{ label: '本月', value: 'month' },
		{ label: '本季', value: 'quarter' },
		{ label: '本年', value: 'year' }
	],
	totalExpense: 0,
	totalIncome: 0,
	balance: 0,
	billCount: 0,
	chartData: [],
	categories: [],
	colors: ['#52C41A', '#1890FF', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2', '#EB2F96', '#FA8C16'],
	allBills: [], // 缓存所有账单数据
	insights: [], // 消费分析洞察
	showCustomPicker: false,
	customStartDate: null,
	customEndDate: null,
	selectingStart: true, // true表示正在选择开始日期，false表示选择结束日期
	// picker-view 相关
	years: [],
	months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	days: [],
	pickerValue: [0, 0, 0],
	tempYear: 0,
	tempMonth: 0,
	tempDay: 0,
	// 隐藏金额状态
	hideIncome: false,
	hideExpense: false,
	hideBalance: false
})

const handleBillSaved = async () => {
	try {
		// 直接从API获取最新数据
		data.allBills = await billStorage.getFromAPI()
		recalculateData()
	} catch (error) {
		console.error('统计页刷新失败:', error)
	}
}

const changeFilter = async (value) => {
	if (data.currentFilter === value) return
	
	data.currentFilter = value
	uni.showLoading({ title: '加载中...' })
	
	try {
		const bills = await billStorage.getFromAPI()
		data.allBills = Array.isArray(bills) ? bills : []
	} catch (error) {
		console.error('获取数据失败:', error)
	} finally {
		recalculateData()
		uni.hideLoading()
	}
}

const switchType = (type) => {
	if (data.currentType === type) return
	data.currentType = type
	recalculateData()
	uni.vibrateShort()
}

// 切换图表类型
const switchChartType = (type) => {
	if (data.chartType === type) return
	
	console.log('切换图表类型:', type)
	data.chartType = type
	
	// 使用 setTimeout 确保 DOM 更新完成后再渲染
	setTimeout(() => {
		console.log('开始渲染图表:', type)
		renderChart()
	}, 100)
	
	uni.vibrateShort()
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

const loadData = async () => {
	// 检查登录状态
	if (!checkLogin()) {
		// 未登录时显示空状态
		data.allBills = []
		data.billCount = 0
		data.totalExpense = 0
		data.totalIncome = 0
		data.balance = 0
		data.chartData = []
		data.insights = []
		return
	}
	
	try {
		uni.showLoading({ title: '加载中...' })
		const bills = await billStorage.getFromAPI() // 直接从API获取
		data.allBills = bills
		recalculateData()
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

const recalculateData = () => {
	// 确保 allBills 存在
	if (!data.allBills || !Array.isArray(data.allBills)) {
		data.allBills = []
		data.billCount = 0
		data.totalExpense = 0
		data.totalIncome = 0
		data.balance = 0
		data.chartData = []
		data.insights = []
		return
	}
	
	const filteredBills = filterBillsByTime(data.allBills)
	
	// 一次遍历完成收支分类和计算
	let totalExpense = 0
	let totalIncome = 0
	const expenseBills = []
	const incomeBills = []
	
	for (const bill of filteredBills) {
		const billType = bill.type || 'expense'
		if (billType === 'expense') {
			expenseBills.push(bill)
			totalExpense += bill.amount
		} else if (billType === 'income') {
			incomeBills.push(bill)
			totalIncome += bill.amount
		}
	}
	
	data.billCount = filteredBills.length
	data.totalExpense = totalExpense
	data.totalIncome = totalIncome
	data.balance = totalIncome - totalExpense
	
	// 根据当前类型计算图表数据
	const targetBills = data.currentType === 'income' ? incomeBills : expenseBills
	calculateChartData(targetBills)
	generateInsights(targetBills)
	
	nextTick(() => {
		renderChart()
	})
}

// 计算时间趋势数据（用于折线图）
const calculateTrendData = () => {
	const filteredBills = filterBillsByTime(data.allBills)
	const targetBills = filteredBills.filter(bill => {
		const billType = bill.type || 'expense'
		return data.currentType === 'income' ? billType === 'income' : billType === 'expense'
	})
	
	if (targetBills.length === 0) return []
	
	// 按日期分组
	const dateMap = {}
	targetBills.forEach(bill => {
		const dateStr = bill.date.split('T')[0] // 只取日期部分 YYYY-MM-DD
		if (!dateMap[dateStr]) {
			dateMap[dateStr] = 0
		}
		dateMap[dateStr] += bill.amount
	})
	
	// 转换为数组并排序
	const trendData = Object.keys(dateMap).map(date => ({
		date: date,
		amount: dateMap[date]
	})).sort((a, b) => a.date.localeCompare(b.date))
	
	// 根据时间范围决定显示粒度
	if (data.currentFilter === 'year') {
		// 年度：按月聚合
		return aggregateByMonth(trendData)
	} else if (data.currentFilter === 'quarter') {
		// 季度：按周聚合
		return aggregateByWeek(trendData)
	} else {
		// 月度或自定义：按日显示（最多显示31天）
		return trendData.slice(-31)
	}
}

// 按月聚合
const aggregateByMonth = (trendData) => {
	const monthMap = {}
	trendData.forEach(item => {
		const month = item.date.substring(0, 7) // YYYY-MM
		if (!monthMap[month]) {
			monthMap[month] = 0
		}
		monthMap[month] += item.amount
	})
	
	return Object.keys(monthMap).map(month => ({
		date: month,
		label: month.substring(5) + '月', // 显示"01月"
		amount: monthMap[month]
	})).sort((a, b) => a.date.localeCompare(b.date))
}

// 按周聚合
const aggregateByWeek = (trendData) => {
	const weekMap = {}
	trendData.forEach(item => {
		const date = new Date(item.date)
		const weekNum = getWeekNumber(date)
		const weekKey = `${date.getFullYear()}-W${weekNum}`
		if (!weekMap[weekKey]) {
			weekMap[weekKey] = {
				amount: 0,
				startDate: item.date
			}
		}
		weekMap[weekKey].amount += item.amount
	})
	
	return Object.keys(weekMap).map(week => ({
		date: weekMap[week].startDate,
		label: week.split('-W')[1] + '周',
		amount: weekMap[week].amount
	})).sort((a, b) => a.date.localeCompare(b.date))
}

// 获取周数
const getWeekNumber = (date) => {
	const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
	const dayNum = d.getUTCDay() || 7
	d.setUTCDate(d.getUTCDate() + 4 - dayNum)
	const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
	return Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
}

const filterBillsByTime = (bills) => {
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth()
	const currentQuarter = Math.floor(currentMonth / 3)
	
	return bills.filter(bill => {
		const billDate = new Date(bill.date)
		const billYear = billDate.getFullYear()
		const billMonth = billDate.getMonth()
		const billQuarter = Math.floor(billMonth / 3)
		
		switch (data.currentFilter) {
			case 'month':
				return billYear === currentYear && billMonth === currentMonth
			case 'quarter':
				return billYear === currentYear && billQuarter === currentQuarter
			case 'year':
				return billYear === currentYear
			case 'custom':
				if (data.customStartDate && data.customEndDate) {
					// 使用日期字符串比较，避免时区问题
					// 确保日期格式统一为 YYYY-MM-DD
					let billDateStr = bill.date.split('T')[0] // 只取日期部分，去掉时间
					
					// 如果日期格式不是 YYYY-MM-DD，尝试转换
					if (billDateStr.includes('/')) {
						// 处理 YYYY/MM/DD 格式
						billDateStr = billDateStr.replace(/\//g, '-')
					}
					
					// 确保日期格式为 YYYY-MM-DD（补零）
					const dateParts = billDateStr.split('-')
					if (dateParts.length === 3) {
						const year = dateParts[0]
						const month = dateParts[1].padStart(2, '0')
						const day = dateParts[2].padStart(2, '0')
						billDateStr = `${year}-${month}-${day}`
					}
					
					const isInRange = billDateStr >= data.customStartDate && billDateStr <= data.customEndDate
					
					// 调试日志：打印筛选信息
					console.log('账单筛选:', {
						type: bill.type || 'expense',
						merchant: bill.merchant,
						amount: bill.amount,
						originalDate: bill.date,
						billDateStr: billDateStr,
						startDate: data.customStartDate,
						endDate: data.customEndDate,
						isInRange: isInRange
					})
					
					return isInRange
				}
				return true
			default:
				return true
		}
	})
}

const calculateChartData = (bills) => {
	const categoryMap = {}
	const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0)
	
	bills.forEach(bill => {
		if (!categoryMap[bill.categoryId]) {
			categoryMap[bill.categoryId] = 0
		}
		categoryMap[bill.categoryId] += bill.amount
	})
	
	// 先排序，再分配颜色
	const sortedData = Object.keys(categoryMap).map((id) => {
		const category = data.categories.find(c => c.id === parseInt(id)) || {}
		const amount = categoryMap[id]
		const percent = totalAmount > 0 ? Math.round((amount / totalAmount) * 100) : 0
		
		return {
			id: parseInt(id),
			name: category.name || '其他',
			icon: category.icon || '📦',
			amount,
			percent
		}
	}).sort((a, b) => b.amount - a.amount)
	
	// 排序后分配颜色
	data.chartData = sortedData.map((item, index) => ({
		...item,
		color: data.colors[index % data.colors.length]
	}))
}

const drawPieChart = () => {
	if (data.chartData.length === 0) {
		return
	}
	
	const ctx = uni.createCanvasContext('pieChart')
	const centerX = 80
	const centerY = 80
	const radius = 58
	
	let startAngle = -Math.PI / 2
	
	data.chartData.forEach((item, index) => {
		const angle = (item.percent / 100) * 2 * Math.PI
		const endAngle = startAngle + angle
		
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.arc(centerX, centerY, radius, startAngle, endAngle)
		ctx.closePath()
		ctx.setFillStyle(item.color)
		ctx.fill()
		
		startAngle = endAngle
	})
	
	ctx.beginPath()
	ctx.arc(centerX, centerY, radius * 0.6, 0, 2 * Math.PI)
	ctx.setFillStyle('#FFFFFF')
	ctx.fill()
	
	ctx.setFontSize(10)
	ctx.setFillStyle('#999999')
	ctx.setTextAlign('center')
	const labelText = data.currentType === 'income' ? '总收入' : '总支出'
	ctx.fillText(labelText, centerX, centerY - 5)
	
	ctx.setFontSize(13)
	ctx.setFillStyle('#1A1A1A')
	const amount = data.currentType === 'income' ? data.totalIncome : data.totalExpense
	ctx.fillText(`¥${amount.toFixed(0)}`, centerX, centerY + 8)
	
	ctx.draw()
}

// 统一的图表渲染方法
const renderChart = () => {
	console.log('renderChart 被调用，当前类型:', data.chartType)
	
	if (data.chartData.length === 0) {
		console.log('没有图表数据，跳过渲染')
		return
	}
	
	if (data.chartType === 'pie') {
		console.log('绘制饼图')
		drawPieChart()
	} else if (data.chartType === 'line') {
		console.log('绘制折线图')
		drawLineChart()
	} else if (data.chartType === 'bar') {
		console.log('绘制柱状图')
		drawBarChart()
	}
}

// 绘制折线图 - 优化版（显示时间趋势）
const drawLineChart = () => {
	console.log('drawLineChart 开始执行')
	
	// 获取时间趋势数据
	const trendData = calculateTrendData()
	console.log('趋势数据:', trendData)
	
	if (trendData.length === 0) {
		console.log('没有趋势数据')
		return
	}
	
	const canvasId = 'lineChart'
	const ctx = uni.createCanvasContext(canvasId)
	const width = 335
	const height = 220
	const padding = { top: 30, right: 15, bottom: 35, left: 50 }
	const chartWidth = width - padding.left - padding.right
	const chartHeight = height - padding.top - padding.bottom
	
	// 清空画布
	ctx.clearRect(0, 0, width, height)
	
	// 获取数据（根据数据量决定显示多少个点）
	const maxPoints = 12
	const step = Math.ceil(trendData.length / maxPoints)
	const dataPoints = trendData.filter((_, index) => index % step === 0 || index === trendData.length - 1)
	
	if (dataPoints.length === 0) return
	
	const maxValue = Math.max(...dataPoints.map(d => d.amount))
	const minValue = 0
	const stepX = dataPoints.length > 1 ? chartWidth / (dataPoints.length - 1) : chartWidth / 2
	
	// 计算Y轴刻度（5个刻度）
	const ySteps = 5
	const yStepValue = maxValue / (ySteps - 1)
	
	// 绘制Y轴单位标识
	ctx.setFontSize(10)
	ctx.setFillStyle('#666666')
	ctx.setTextAlign('right')
	ctx.fillText('￥', padding.left - 5, padding.top - 10)
	
	// 绘制Y轴刻度线和刻度值
	ctx.setStrokeStyle('#F0F0F0')
	ctx.setLineWidth(1)
	ctx.setFontSize(10)
	ctx.setFillStyle('#999999')
	ctx.setTextAlign('right')
	
	for (let i = 0; i < ySteps; i++) {
		const y = padding.top + (chartHeight / (ySteps - 1)) * i
		const value = maxValue - (yStepValue * i)
		
		// 绘制横向网格线
		ctx.beginPath()
		ctx.moveTo(padding.left, y)
		ctx.lineTo(width - padding.right, y)
		ctx.stroke()
		
		// 绘制Y轴刻度值
		const displayValue = value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)
		ctx.fillText(displayValue, padding.left - 5, y + 3)
	}
	
	// 绘制图表背景（浅色）
	ctx.setFillStyle('#FAFBFC')
	ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight)
	
	// 绘制渐变填充区域
	const gradient = ctx.createLinearGradient(0, padding.top, 0, height - padding.bottom)
	gradient.addColorStop(0, 'rgba(82, 196, 26, 0.2)')
	gradient.addColorStop(1, 'rgba(82, 196, 26, 0.02)')
	
	ctx.beginPath()
	ctx.moveTo(padding.left, height - padding.bottom)
	dataPoints.forEach((point, index) => {
		const x = padding.left + stepX * index
		const y = padding.top + chartHeight - ((point.amount - minValue) / (maxValue - minValue)) * chartHeight
		if (index === 0) {
			ctx.lineTo(x, y)
		} else {
			ctx.lineTo(x, y)
		}
	})
	ctx.lineTo(padding.left + stepX * (dataPoints.length - 1), height - padding.bottom)
	ctx.closePath()
	ctx.setFillStyle(gradient)
	ctx.fill()
	
	// 绘制折线
	ctx.setStrokeStyle('#52C41A')
	ctx.setLineWidth(2.5)
	ctx.setLineCap('round')
	ctx.setLineJoin('round')
	ctx.beginPath()
	dataPoints.forEach((point, index) => {
		const x = padding.left + stepX * index
		const y = padding.top + chartHeight - ((point.amount - minValue) / (maxValue - minValue)) * chartHeight
		if (index === 0) {
			ctx.moveTo(x, y)
		} else {
			ctx.lineTo(x, y)
		}
	})
	ctx.stroke()
	
	// 绘制数据点和数值
	dataPoints.forEach((point, index) => {
		const x = padding.left + stepX * index
		const y = padding.top + chartHeight - ((point.amount - minValue) / (maxValue - minValue)) * chartHeight
		
		// 外圈
		ctx.beginPath()
		ctx.arc(x, y, 5, 0, 2 * Math.PI)
		ctx.setFillStyle('#52C41A')
		ctx.fill()
		
		// 内圈
		ctx.beginPath()
		ctx.arc(x, y, 3, 0, 2 * Math.PI)
		ctx.setFillStyle('#FFFFFF')
		ctx.fill()
		
		// 绘制数值（在点上方，间隔显示避免拥挤）
		if (dataPoints.length <= 6 || index % 2 === 0) {
			ctx.setFontSize(9)
			ctx.setFillStyle('#52C41A')
			ctx.setTextAlign('center')
			const displayValue = point.amount >= 1000 ? (point.amount / 1000).toFixed(1) + 'k' : point.amount.toFixed(0)
			ctx.fillText('¥' + displayValue, x, y - 10)
		}
		
		// 绘制X轴标签（日期）
		ctx.setFontSize(9)
		ctx.setFillStyle('#666666')
		ctx.setTextAlign('center')
		
		// 根据数据类型显示不同的标签
		let labelText = ''
		if (point.label) {
			// 月份或周数
			labelText = point.label
		} else {
			// 日期：显示 MM/DD
			const dateParts = point.date.split('-')
			labelText = dateParts[1] + '/' + dateParts[2]
		}
		
		// 间隔显示标签避免拥挤
		if (dataPoints.length <= 8 || index % 2 === 0) {
			ctx.fillText(labelText, x, height - padding.bottom + 20)
		}
	})
	
	ctx.draw()
}

// 绘制柱状图 - 优化版
const drawBarChart = () => {
	console.log('drawBarChart 开始执行，数据长度:', data.chartData.length)
	
	if (data.chartData.length === 0) return
	
	const canvasId = 'barChart'
	
	// 使用新版 Canvas 2D API（真机兼容性更好）
	uni.createSelectorQuery()
		.select('#' + canvasId)
		.fields({ node: true, size: true })
		.exec((res) => {
			if (!res || !res[0]) {
				console.error('Canvas节点获取失败')
				// 降级到旧版API
				drawBarChartLegacy()
				return
			}
			
			const canvas = res[0].node
			const ctx = canvas.getContext('2d')
			
			// 设置canvas实际大小（考虑设备像素比）
			const dpr = uni.getSystemInfoSync().pixelRatio || 1
			const width = 335
			const height = 220
			canvas.width = width * dpr
			canvas.height = height * dpr
			ctx.scale(dpr, dpr)
			
			const padding = { top: 30, right: 15, bottom: 35, left: 50 }
			const chartWidth = width - padding.left - padding.right
			const chartHeight = height - padding.top - padding.bottom
			
			// 清空画布
			ctx.clearRect(0, 0, width, height)
			
			// 获取数据（最多显示前8个分类）
			const dataPoints = data.chartData.slice(0, 8)
			if (dataPoints.length === 0) return
			
			const maxValue = Math.max(...dataPoints.map(d => d.amount))
			
			// 计算柱子宽度，设置最大宽度避免数据少时柱子太宽
			const maxBarWidth = 45 // 最大柱子宽度（进一步缩小）
			const calculatedBarWidth = (chartWidth / dataPoints.length) * 0.65
			const barWidth = Math.min(calculatedBarWidth, maxBarWidth)
			
			// 根据实际柱子宽度计算间隙，保持居中
			const totalBarsWidth = barWidth * dataPoints.length
			const totalGapWidth = chartWidth - totalBarsWidth
			const barGap = totalGapWidth / (dataPoints.length + 1)
			
			// 计算Y轴刻度（5个刻度）
			const ySteps = 5
			const yStepValue = maxValue / (ySteps - 1)
			
			// 绘制Y轴单位标识
			ctx.font = '10px sans-serif'
			ctx.fillStyle = '#666666'
			ctx.textAlign = 'right'
			ctx.fillText('￥', padding.left - 5, padding.top - 10)
			
			// 绘制Y轴刻度线和刻度值
			ctx.strokeStyle = '#F0F0F0'
			ctx.lineWidth = 1
			ctx.font = '10px sans-serif'
			ctx.fillStyle = '#999999'
			ctx.textAlign = 'right'
			
			for (let i = 0; i < ySteps; i++) {
				const y = padding.top + (chartHeight / (ySteps - 1)) * i
				const value = maxValue - (yStepValue * i)
				
				// 绘制横向网格线
				ctx.beginPath()
				ctx.moveTo(padding.left, y)
				ctx.lineTo(width - padding.right, y)
				ctx.stroke()
				
				// 绘制Y轴刻度值
				const displayValue = value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)
				ctx.fillText(displayValue, padding.left - 5, y + 3)
			}
			
			// 绘制图表背景（浅色）
			ctx.fillStyle = '#FAFBFC'
			ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight)
			
			// 绘制柱子
			dataPoints.forEach((point, index) => {
				const x = padding.left + barGap + (barWidth + barGap) * index
				const barHeight = (point.amount / maxValue) * chartHeight
				const y = padding.top + chartHeight - barHeight
				
				// 绘制柱子底部背景（浅灰色，显示最大值）
				ctx.fillStyle = '#F0F0F0'
				ctx.fillRect(x, padding.top, barWidth, chartHeight)
				
				// 绘制柱子阴影（更柔和）
				ctx.fillStyle = 'rgba(0, 0, 0, 0.03)'
				ctx.fillRect(x + 1, y + 1, barWidth, barHeight)
				
				// 渐变色柱子（更鲜艳的渐变）
				const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
				gradient.addColorStop(0, point.color || '#52C41A')
				gradient.addColorStop(0.5, point.color || '#52C41A')
				gradient.addColorStop(1, (point.color || '#52C41A') + 'CC')
				
				ctx.fillStyle = gradient
				ctx.fillRect(x, y, barWidth, barHeight)
				
				// 柱子顶部圆角高亮效果
				if (barHeight > 8) {
					ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
					ctx.fillRect(x, y, barWidth, Math.min(barHeight * 0.25, 6))
				}
				
				// 绘制数值（在柱子上方，带背景）
				if (barHeight > 15) {
					ctx.font = '9px sans-serif'
					ctx.fillStyle = '#333333'
					ctx.textAlign = 'center'
					const displayValue = point.amount >= 1000 ? (point.amount / 1000).toFixed(1) + 'k' : point.amount.toFixed(0)
					
					// 数值文字（直接显示，无背景）
					ctx.fillStyle = point.color || '#52C41A'
					ctx.font = '9px sans-serif'
					ctx.fillText('¥' + displayValue, x + barWidth / 2, y - 8)
				}
				
				// 绘制X轴标签（分类名称）
				ctx.font = '10px sans-serif'
				ctx.fillStyle = '#666666'
				ctx.textAlign = 'center'
				const labelText = point.name.length > 3 ? point.name.substring(0, 3) : point.name
				ctx.fillText(labelText, x + barWidth / 2, height - padding.bottom + 20)
			})
		})
}

// 降级方案：使用旧版API
const drawBarChartLegacy = () => {
	console.log('使用旧版Canvas API绘制柱状图')
	
	if (data.chartData.length === 0) return
	
	const canvasId = 'barChart'
	const ctx = uni.createCanvasContext(canvasId)
	const width = 335
	const height = 220
	const padding = { top: 30, right: 15, bottom: 35, left: 50 }
	const chartWidth = width - padding.left - padding.right
	const chartHeight = height - padding.top - padding.bottom
	
	// 清空画布
	ctx.clearRect(0, 0, width, height)
	
	// 获取数据（最多显示前8个分类）
	const dataPoints = data.chartData.slice(0, 8)
	if (dataPoints.length === 0) return
	
	const maxValue = Math.max(...dataPoints.map(d => d.amount))
	
	// 计算柱子宽度，设置最大宽度避免数据少时柱子太宽
	const maxBarWidth = 45 // 最大柱子宽度（进一步缩小）
	const calculatedBarWidth = (chartWidth / dataPoints.length) * 0.65
	const barWidth = Math.min(calculatedBarWidth, maxBarWidth)
	
	// 根据实际柱子宽度计算间隙，保持居中
	const totalBarsWidth = barWidth * dataPoints.length
	const totalGapWidth = chartWidth - totalBarsWidth
	const barGap = totalGapWidth / (dataPoints.length + 1)
	
	// 计算Y轴刻度（5个刻度）
	const ySteps = 5
	const yStepValue = maxValue / (ySteps - 1)
	
	// 绘制Y轴单位标识
	ctx.setFontSize(10)
	ctx.setFillStyle('#666666')
	ctx.setTextAlign('right')
	ctx.fillText('￥', padding.left - 5, padding.top - 10)
	
	// 绘制Y轴刻度线和刻度值
	ctx.setStrokeStyle('#F0F0F0')
	ctx.setLineWidth(1)
	ctx.setFontSize(10)
	ctx.setFillStyle('#999999')
	ctx.setTextAlign('right')
	
	for (let i = 0; i < ySteps; i++) {
		const y = padding.top + (chartHeight / (ySteps - 1)) * i
		const value = maxValue - (yStepValue * i)
		
		// 绘制横向网格线
		ctx.beginPath()
		ctx.moveTo(padding.left, y)
		ctx.lineTo(width - padding.right, y)
		ctx.stroke()
		
		// 绘制Y轴刻度值
		const displayValue = value >= 1000 ? (value / 1000).toFixed(1) + 'k' : value.toFixed(0)
		ctx.fillText(displayValue, padding.left - 5, y + 3)
	}
	
	// 绘制图表背景（浅色）
	ctx.setFillStyle('#FAFBFC')
	ctx.fillRect(padding.left, padding.top, chartWidth, chartHeight)
	
	// 绘制柱子
	dataPoints.forEach((point, index) => {
		const x = padding.left + barGap + (barWidth + barGap) * index
		const barHeight = (point.amount / maxValue) * chartHeight
		const y = padding.top + chartHeight - barHeight
		const cornerRadius = 4 // 圆角半径
		
		// 绘制柱子底部背景（浅灰色，显示最大值）
		ctx.setFillStyle('#F0F0F0')
		ctx.fillRect(x, padding.top, barWidth, chartHeight)
		
		// 绘制柱子阴影（更柔和）
		ctx.setFillStyle('rgba(0, 0, 0, 0.03)')
		ctx.fillRect(x + 1, y + 1, barWidth, barHeight)
		
		// 渐变色柱子（更鲜艳的渐变）
		const gradient = ctx.createLinearGradient(x, y, x, y + barHeight)
		gradient.addColorStop(0, point.color || '#52C41A')
		gradient.addColorStop(0.5, point.color || '#52C41A')
		gradient.addColorStop(1, (point.color || '#52C41A') + 'CC')
		
		ctx.setFillStyle(gradient)
		ctx.fillRect(x, y, barWidth, barHeight)
		
		// 柱子顶部圆角高亮效果
		if (barHeight > 8) {
			ctx.setFillStyle('rgba(255, 255, 255, 0.4)')
			ctx.fillRect(x, y, barWidth, Math.min(barHeight * 0.25, 6))
		}
		
		// 绘制数值（在柱子上方，带背景）
		if (barHeight > 15) {
			ctx.setFontSize(9)
			ctx.setFillStyle('#333333')
			ctx.setTextAlign('center')
			const displayValue = point.amount >= 1000 ? (point.amount / 1000).toFixed(1) + 'k' : point.amount.toFixed(0)
			
			// 数值文字（直接显示，无背景）
			ctx.setFillStyle(point.color || '#52C41A')
			ctx.setFontSize(9)
			ctx.fillText('¥' + displayValue, x + barWidth / 2, y - 8)
		}
		
		// 绘制X轴标签（分类名称）
		ctx.setFontSize(10)
		ctx.setFillStyle('#666666')
		ctx.setTextAlign('center')
		const labelText = point.name.length > 3 ? point.name.substring(0, 3) : point.name
		ctx.fillText(labelText, x + barWidth / 2, height - padding.bottom + 20)
	})
	
	ctx.draw()
}

const handleChartTouch = () => {
	// 图表交互处理
}

const getLegendColor = (index) => {
	const colorList = ['#52C41A', '#1890FF', '#FAAD14', '#F5222D', '#722ED1', '#13C2C2', '#EB2F96', '#FA8C16']
	return colorList[index % colorList.length]
}

const goToHome = () => {
	uni.switchTab({
		url: '/pages/tab/index/index'
	})
}

// 判断是否是12月（年度账单季）
const isDecember = () => {
	const now = new Date()
	return now.getMonth() === 11 // 0-11，11表示12月
}

// 生成财务分析洞察（根据当前类型动态调整）
const generateInsights = (bills) => {
	const insights = []
	
	// 如果完全没有账单，显示提示信息
	if (data.billCount === 0) {
		insights.push({
			type: 'empty',
			icon: '📊',
			text: '暂无账单数据',
			tip: '记录第一笔账单，开启财务管理之旅'
		})
		data.insights = insights
		return
	}
	
	// 第一行：综合收支分析（始终显示）
	generateBalanceInsight(insights)
	
	// 根据当前类型显示不同的分析
	if (data.currentType === 'expense') {
		// 支出分析模式：显示支出相关的重点
		generateExpenseDetailAnalysis(insights)
	} else {
		// 收入分析模式：显示收入相关的重点
		generateIncomeDetailAnalysis(insights)
	}
	
	// 确保至少有一条洞察（如果insights为空，添加默认提示）
	if (insights.length === 0) {
		insights.push({
			type: 'info',
			icon: '📊',
			text: '暂无数据',
			tip: '开始记账，查看财务分析'
		})
	}
	
	// 最多显示3条洞察
	data.insights = insights.slice(0, 3)
}

// 第一行：综合收支分析
const generateBalanceInsight = (insights) => {
	// 计算储蓄率
	const savingRate = data.totalIncome > 0 ? Math.round((data.balance / data.totalIncome) * 100) : 0
	
	if (data.balance < 0) {
		// 收支赤字
		insights.push({
			type: 'danger',
			icon: '💸',
			text: `收支赤字¥${Math.abs(data.balance).toFixed(2)}，支出超过收入`,
			tip: '建议开源节流，控制非必要支出'
		})
	} else if (data.totalIncome === 0 && data.totalExpense > 0) {
		// 只有支出没有收入
		insights.push({
			type: 'warning',
			icon: '⚠️',
			text: `本期仅有支出¥${data.totalExpense.toFixed(2)}，暂无收入记录`,
			tip: '建议记录收入以便更好地管理财务'
		})
	} else if (data.totalIncome > 0) {
		// 有收入的情况
		if (savingRate >= 30) {
			insights.push({
				type: 'success',
				icon: '🎉',
				text: `储蓄率${savingRate}%，结余¥${data.balance.toFixed(2)}`,
				tip: '财务状况优秀，继续保持良好习惯'
			})
		} else if (savingRate >= 10) {
			insights.push({
				type: 'success',
				icon: '✅',
				text: `储蓄率${savingRate}%，结余¥${data.balance.toFixed(2)}`,
				tip: '财务状况良好，收支平衡'
			})
		} else {
			insights.push({
				type: 'warning',
				icon: '⚡',
				text: `储蓄率仅${savingRate}%，结余¥${data.balance.toFixed(2)}`,
				tip: '建议控制支出，提高储蓄比例'
			})
		}
	} else {
		// 没有任何数据
		insights.push({
			type: 'info',
			icon: '📊',
			text: '暂无收支数据',
			tip: '开始记账，掌握财务状况'
		})
	}
}

// 支出分析模式：显示支出相关的详细分析
const generateExpenseDetailAnalysis = (insights) => {
	if (data.totalExpense === 0) {
		insights.push({
			type: 'info',
			icon: '💸',
			text: '本期暂无支出记录',
			tip: '开始记录支出，掌握消费情况'
		})
		return
	}
	
	// 第二行：支出趋势对比
	const lastPeriodBills = getLastPeriodBills()
	const lastExpense = lastPeriodBills.filter(b => (b.type || 'expense') === 'expense').reduce((sum, bill) => sum + bill.amount, 0)
	
	if (lastExpense > 0) {
		const expenseChange = Math.round(((data.totalExpense - lastExpense) / lastExpense) * 100)
		
		if (expenseChange > 20) {
			insights.push({
				type: 'danger',
				icon: '📈',
				text: `支出增长${expenseChange}%，较上期增加¥${(data.totalExpense - lastExpense).toFixed(2)}`,
				tip: '支出增长过快，需要控制消费'
			})
		} else if (expenseChange > 0) {
			insights.push({
				type: 'warning',
				icon: '📊',
				text: `支出增长${expenseChange}%，较上期增加¥${(data.totalExpense - lastExpense).toFixed(2)}`,
				tip: '支出有所增加，注意控制'
			})
		} else if (expenseChange < -10) {
			insights.push({
				type: 'success',
				icon: '📉',
				text: `支出减少${Math.abs(expenseChange)}%，较上期节省¥${(lastExpense - data.totalExpense).toFixed(2)}`,
				tip: '节流效果显著，继续保持'
			})
		} else {
			// 支出变化不大，显示主要支出分类
			if (data.chartData.length > 0) {
				const topCategory = data.chartData[0]
				insights.push({
					type: 'info',
					icon: '📊',
					text: `${topCategory.icon} ${topCategory.name}占支出${topCategory.percent}%，¥${topCategory.amount.toFixed(2)}`,
					tip: `${topCategory.name}是主要支出项`
				})
			}
		}
	} else {
		// 没有上期数据，显示主要支出分类
		if (data.chartData.length > 0) {
			const topCategory = data.chartData[0]
			if (topCategory.percent >= 40) {
				insights.push({
					type: 'warning',
					icon: '📊',
					text: `${topCategory.icon} ${topCategory.name}占支出${topCategory.percent}%，¥${topCategory.amount.toFixed(2)}`,
					tip: `${topCategory.name}支出${topCategory.percent >= 50 ? '过高' : '较高'}，可以考虑优化`
				})
			} else {
				insights.push({
					type: 'info',
					icon: '📊',
					text: `${topCategory.icon} ${topCategory.name}占支出${topCategory.percent}%，¥${topCategory.amount.toFixed(2)}`,
					tip: `${topCategory.name}是主要支出项`
				})
			}
		}
	}
}

// 收入分析模式：显示收入相关的详细分析
const generateIncomeDetailAnalysis = (insights) => {
	if (data.totalIncome === 0) {
		insights.push({
			type: 'info',
			icon: '💰',
			text: '本期暂无收入记录',
			tip: '记录收入可以更好地管理财务'
		})
		return
	}
	
	// 第二行：收入趋势对比
	const lastPeriodBills = getLastPeriodBills()
	const lastIncome = lastPeriodBills.filter(b => b.type === 'income').reduce((sum, bill) => sum + bill.amount, 0)
	
	if (lastIncome > 0) {
		const incomeChange = Math.round(((data.totalIncome - lastIncome) / lastIncome) * 100)
		
		if (incomeChange > 10) {
			insights.push({
				type: 'success',
				icon: '📈',
				text: `收入增长${incomeChange}%，较上期增加¥${(data.totalIncome - lastIncome).toFixed(2)}`,
				tip: '收入增长良好，继续保持'
			})
		} else if (incomeChange < -10) {
			insights.push({
				type: 'warning',
				icon: '📉',
				text: `收入减少${Math.abs(incomeChange)}%，较上期减少¥${(lastIncome - data.totalIncome).toFixed(2)}`,
				tip: '收入下降，建议开拓新的收入来源'
			})
		} else {
			// 收入变化不大，显示主要收入来源
			if (data.chartData.length > 0) {
				const topCategory = data.chartData[0]
				if (topCategory.percent >= 50) {
					insights.push({
						type: 'warning',
						icon: '📊',
						text: `${topCategory.icon} ${topCategory.name}占收入${topCategory.percent}%`,
						tip: '收入来源过于单一，建议多元化'
					})
				} else {
					insights.push({
						type: 'success',
						icon: '📊',
						text: `${topCategory.icon} ${topCategory.name}占收入${topCategory.percent}%`,
						tip: '收入来源较为多元'
					})
				}
			}
		}
	} else {
		// 没有上期数据，显示主要收入来源
		if (data.chartData.length > 0) {
			const topCategory = data.chartData[0]
			if (topCategory.percent >= 50) {
				insights.push({
					type: 'warning',
					icon: '📊',
					text: `${topCategory.icon} ${topCategory.name}占收入${topCategory.percent}%`,
					tip: '收入来源过于单一，建议多元化'
				})
			} else {
				insights.push({
					type: 'success',
					icon: '📊',
					text: `${topCategory.icon} ${topCategory.name}占收入${topCategory.percent}%`,
					tip: '收入来源较为多元'
				})
			}
		}
	}
}

// 获取上期账单（用于对比）
const getLastPeriodBills = () => {
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth()
	
	// 计算上月
	let lastYear = currentYear
	let lastMonth = currentMonth - 1
	if (lastMonth < 0) {
		lastMonth = 11
		lastYear = currentYear - 1
	}
	
	return data.allBills.filter(bill => {
		const billDate = new Date(bill.date)
		const billYear = billDate.getFullYear()
		const billMonth = billDate.getMonth()
		return billYear === lastYear && billMonth === lastMonth
	})
}

const getFilterLabel = () => {
	if (data.currentFilter === 'custom' && data.customStartDate && data.customEndDate) {
		const start = data.customStartDate.replace(/-/g, '/')
		const end = data.customEndDate.replace(/-/g, '/')
		return `${start} 至 ${end}`
	}
	const labels = {
		'month': '本月',
		'quarter': '本季',
		'year': '本年',
		'custom': '自定义'
	}
	return labels[data.currentFilter] || '本月'
}

const generatePoster = () => {
	if (data.billCount === 0) {
		uni.showToast({
			title: '暂无数据',
			icon: 'none'
		})
		return
	}
	
	// 准备海报数据（增强版：包含更多分析数据）
	const posterData = {
		filterType: data.currentFilter,
		filterLabel: getFilterLabel(),
		totalExpense: data.totalExpense,
		totalIncome: data.totalIncome,
		balance: data.balance,
		billCount: data.billCount,
		topCategories: data.chartData.slice(0, 3).map(item => ({
			name: item.name,
			icon: item.icon,
			amount: item.amount,
			percent: item.percent,
			color: item.color
		})),
		// 新增：财务分析洞察
		insights: data.insights.slice(0, 2).map(insight => ({
			icon: insight.icon,
			text: insight.text,
			type: insight.type
		})),
		// 新增：预算使用率
		budgetPercent: Math.round((data.totalExpense / (uni.getStorageSync('budget') || 6000)) * 100)
	}
	
	// 跳转到海报页面
	uni.navigateTo({
		url: `/pages/record/poster/index?data=${encodeURIComponent(JSON.stringify(posterData))}`
	})
}

// 打开自定义时间选择器
const openCustomPicker = () => {
	data.showCustomPicker = true
	initCustomPicker()
	// 隐藏 tabbar
	uni.hideTabBar()
}

// 关闭自定义时间选择器
const closeCustomPicker = () => {
	data.showCustomPicker = false
	data.selectingStart = true // 重置为选择开始日期
	// 显示 tabbar
	uni.showTabBar()
}

// 初始化自定义时间选择器
const initCustomPicker = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = now.getMonth() + 1
	const day = now.getDate()
	
	// 初始化年份列表（前后5年）
	data.years = []
	for (let i = year - 5; i <= year + 5; i++) {
		data.years.push(i)
	}
	
	// 默认选择本月1号到今天
	data.customStartDate = `${year}-${String(month).padStart(2, '0')}-01`
	data.customEndDate = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
	data.selectingStart = true
	
	// 设置picker初始值为开始日期（本月1号），而不是今天
	const yearIndex = data.years.indexOf(year)
	const monthIndex = month - 1
	updateDaysInMonth(year, month)
	const dayIndex = 0 // 1号对应索引0
	
	data.pickerValue = [yearIndex, monthIndex, dayIndex]
	data.tempYear = year
	data.tempMonth = month
	data.tempDay = 1 // 设置为1号
}

// 更新当月天数
const updateDaysInMonth = (year, month) => {
	const daysInMonth = new Date(year, month, 0).getDate()
	data.days = []
	for (let i = 1; i <= daysInMonth; i++) {
		data.days.push(i)
	}
}

// picker-view值改变
const onPickerChange = (e) => {
	const val = e.detail.value
	data.pickerValue = val
	
	data.tempYear = data.years[val[0]]
	data.tempMonth = data.months[val[1]]
	
	// 更新天数列表
	updateDaysInMonth(data.tempYear, data.tempMonth)
	
	// 如果当前选择的天数超过了新月份的天数，调整到最后一天
	if (val[2] >= data.days.length) {
		data.pickerValue = [val[0], val[1], data.days.length - 1]
		data.tempDay = data.days[data.days.length - 1]
	} else {
		data.tempDay = data.days[val[2]]
	}
}

// 确认日期选择
const confirmDateSelection = () => {
	const dateStr = `${data.tempYear}-${String(data.tempMonth).padStart(2, '0')}-${String(data.tempDay).padStart(2, '0')}`
	
	if (data.selectingStart) {
		// 选择开始日期
		data.customStartDate = dateStr
		data.selectingStart = false
		
		// 如果已有结束日期且开始日期晚于结束日期，清空结束日期
		if (data.customEndDate && dateStr > data.customEndDate) {
			data.customEndDate = null
		}
		
		// 将picker跳转到结束日期（如果有的话），否则跳转到今天
		if (data.customEndDate) {
			const [endYear, endMonth, endDay] = data.customEndDate.split('-').map(Number)
			const yearIndex = data.years.indexOf(endYear)
			const monthIndex = endMonth - 1
			updateDaysInMonth(endYear, endMonth)
			const dayIndex = endDay - 1
			
			data.pickerValue = [yearIndex, monthIndex, dayIndex]
			data.tempYear = endYear
			data.tempMonth = endMonth
			data.tempDay = endDay
		} else {
			// 如果没有结束日期，跳转到今天
			const now = new Date()
			const year = now.getFullYear()
			const month = now.getMonth() + 1
			const day = now.getDate()
			
			const yearIndex = data.years.indexOf(year)
			const monthIndex = month - 1
			updateDaysInMonth(year, month)
			const dayIndex = day - 1
			
			data.pickerValue = [yearIndex, monthIndex, dayIndex]
			data.tempYear = year
			data.tempMonth = month
			data.tempDay = day
		}
	} else {
		// 选择结束日期
		if (data.customStartDate && dateStr < data.customStartDate) {
			// 如果结束日期早于开始日期，交换它们
			data.customEndDate = data.customStartDate
			data.customStartDate = dateStr
		} else {
			data.customEndDate = dateStr
		}
		
		// 完成选择，应用筛选
		confirmCustomTime()
	}
}

// 确认自定义时间
const confirmCustomTime = async () => {
	data.currentFilter = 'custom'
	data.showCustomPicker = false
	data.selectingStart = true // 重置
	// 显示 tabbar
	uni.showTabBar()
	
	// 调试日志：打印选择的日期范围
	console.log('自定义时间范围:', {
		startDate: data.customStartDate,
		endDate: data.customEndDate
	})
	
	// 显示加载提示
	uni.showLoading({ title: '加载中...' })
	
	try {
		// 直接从API获取最新数据
		const bills = await billStorage.getFromAPI()
		// 确保返回的是数组
		data.allBills = Array.isArray(bills) ? bills : []
		
		// 调试日志：打印所有账单数量
		console.log('总账单数量:', data.allBills.length)
		console.log('收入账单数量:', data.allBills.filter(b => b.type === 'income').length)
		console.log('支出账单数量:', data.allBills.filter(b => (b.type || 'expense') === 'expense').length)
		
		recalculateData()
	} catch (error) {
		console.error('获取数据失败:', error)
		// 出错时使用当前缓存数据
		recalculateData()
	} finally {
		uni.hideLoading()
	}
}

// 切换收入显示/隐藏
const toggleIncome = () => {
	data.hideIncome = !data.hideIncome
	uni.setStorageSync('hideIncomeStatistics', data.hideIncome)
}

// 切换支出显示/隐藏
const toggleExpense = () => {
	data.hideExpense = !data.hideExpense
	uni.setStorageSync('hideExpenseStatistics', data.hideExpense)
}

// 切换结余显示/隐藏
const toggleBalance = () => {
	data.hideBalance = !data.hideBalance
	uni.setStorageSync('hideBalanceStatistics', data.hideBalance)
}


onLoad(() => {
	data.categories = uni.getStorageSync('categories') || []
	
	// 读取金额隐藏状态
	data.hideIncome = uni.getStorageSync('hideIncomeStatistics') || false
	data.hideExpense = uni.getStorageSync('hideExpenseStatistics') || false
	data.hideBalance = uni.getStorageSync('hideBalanceStatistics') || false
	
	loadData()
	
	// 监听账单保存事件
	uni.$on('billSaved', handleBillSaved)
	
	// 首次加载后不再后台同步（已改为实时从API获取）
})

onShow(() => {
	// 检查是否需要刷新数据
	const needRefresh = uni.getStorageSync('needRefreshStatistics')
	
	if (needRefresh) {
		// 清除标记
		uni.removeStorageSync('needRefreshStatistics')
		// 立即显示加载提示
		uni.showLoading({ title: '刷新中...' })
		// 直接从API获取最新数据并刷新
		billStorage.getFromAPI().then(bills => {
			data.allBills = bills
			recalculateData()
			uni.hideLoading()
		}).catch(error => {
			console.error('刷新失败:', error)
			uni.showToast({
				title: '刷新失败',
				icon: 'none'
			})
			uni.hideLoading()
		})
	} else if (!data.allBills || data.allBills.length === 0) {
		// 如果缓存为空（比如首次进入），也加载数据
		loadData()
	}
})

// 下拉刷新
onPullDownRefresh(async () => {
	const startTime = Date.now()
	
	try {
		data.allBills = await billStorage.getFromAPI()
		recalculateData()
	} catch (error) {
		console.error('刷新失败:', error)
		uni.showToast({
			title: '刷新失败',
			icon: 'none'
		})
	} finally {
		// 确保至少显示500ms的刷新动画
		const elapsed = Date.now() - startTime
		const delay = Math.max(0, 500 - elapsed)
		setTimeout(() => uni.stopPullDownRefresh(), delay)
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
		min-height: 100vh;
		background: transparent;
		padding: $spacing-sm $spacing-xl;
		padding-bottom: 100rpx;
		box-sizing: border-box;
	}
	
	/* 筛选器包装容器 - 随手记风格（简洁版） */
	.filter-wrapper {
		background: transparent;
		padding: 0;
		margin-top: $spacing-md;
		margin-bottom: $spacing-xl;
	}

	.time-filter {
		display: flex;
		gap: $spacing-md; /* 增大按钮间距 */
		background: transparent; /* 去掉白色背景 */
		border-radius: 0; /* 去掉圆角 */
		padding: 0; /* 去掉内边距 */
		border: none; /* 去掉边框 */
	}

	.filter-item {
		flex: 1;
		text-align: center;
		padding: 16rpx 26rpx; /* 调整为 16rpx 26rpx，与账单页面一致 */
		font-size: 28rpx; /* 从 $font-size-sm 增大到 28rpx */
		color: $text-secondary;
		background: #FFFFFF; /* 纯白色背景 */
		border-radius: 16rpx; /* 从 12rpx 增大到 16rpx，更圆润 */
		transition: all $transition-fast;
		font-weight: $font-weight-medium;
		box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.06); /* 增强阴影 */
		border: 1rpx solid #F0F0F0; /* 边框颜色稍微浅一点 */
		letter-spacing: 0.5rpx; /* 增加字间距 */
	}
	
	.filter-item:active {
		background: $bg-hover;
		transform: scale(0.98);
	}

	.filter-item.active {
		background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
		color: $primary-color;
		font-weight: $font-weight-bold; /* 从 semibold 改为 bold，更突出 */
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.2); /* 增强阴影 */
		border: 1rpx solid rgba(82, 196, 26, 0.3); /* 边框更明显 */
		transform: translateY(-2rpx); /* 添加轻微上浮效果 */
	}
	
	.filter-item.active:active {
		transform: scale(0.98);
	}

	.custom-filter {
		/* 继承 .filter-item 的样式，不需要额外覆盖 */
	}
	
	.custom-filter.active {
		background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
		color: $primary-color;
		font-weight: $font-weight-bold; /* 从 semibold 改为 bold */
		border: 1rpx solid rgba(82, 196, 26, 0.3); /* 边框更明显 */
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.2); /* 增强阴影 */
		transform: translateY(-2rpx); /* 添加轻微上浮效果 */
	}
	
	/* 自定义时间选择弹窗 - 类似首页样式 */
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
	
	/* 日期范围显示 - 精致优化版 */
	.date-range-display {
		display: flex;
		align-items: center;
		padding: 28rpx 40rpx 32rpx;
		gap: 20rpx;
		background: linear-gradient(180deg, #FAFBFC 0%, #F5F7FA 100%);
		border-bottom: 1rpx solid #EBEDF0;
	}
	
	.date-display-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		padding: 20rpx 24rpx;
		background: #FFFFFF;
		border-radius: 12rpx;
		border: 2rpx solid #F0F0F0;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
	}
	
	/* 未激活状态的微妙渐变背景 */
	.date-display-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, #FAFBFC 0%, #FFFFFF 100%);
		opacity: 0;
		transition: opacity 0.3s ease;
		z-index: 0;
	}
	
	.date-display-item .date-label,
	.date-display-item .date-value {
		position: relative;
		z-index: 1;
	}
	
	.date-display-item.active {
		border-color: $primary-color;
		background: linear-gradient(135deg, #F6FFED 0%, #F0FFF4 100%);
		box-shadow: 0 6rpx 16rpx rgba(82, 196, 26, 0.2), 0 2rpx 8rpx rgba(82, 196, 26, 0.1);
		transform: scale(1.03);
	}
	
	/* 激活状态的光效 */
	.date-display-item.active::after {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(82, 196, 26, 0.15) 0%, transparent 70%);
		animation: pulse-glow 2s ease-in-out infinite;
	}
	
	@keyframes pulse-glow {
		0%, 100% {
			opacity: 0.5;
		}
		50% {
			opacity: 1;
		}
	}
	
	.date-label {
		font-size: 20rpx;
		color: $text-tertiary;
		font-weight: $font-weight-medium;
		text-transform: uppercase;
		letter-spacing: 1rpx;
		line-height: 1;
	}
	
	.date-display-item.active .date-label {
		color: $primary-color;
		font-weight: $font-weight-semibold;
	}
	
	.date-value {
		font-size: 28rpx;
		color: $text-primary;
		font-weight: $font-weight-semibold;
		line-height: 1.3;
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
	}
	
	.date-display-item.active .date-value {
		color: $primary-color;
		font-weight: $font-weight-bold;
	}
	
	/* 未选择状态的占位文字 */
	.date-display-item .date-value:empty::before {
		opacity: 0.4;
	}
	
	.date-separator {
		font-size: 24rpx;
		color: $text-tertiary;
		font-weight: $font-weight-medium;
		opacity: 0.6;
		position: relative;
		padding: 0 4rpx;
	}
	
	/* 分隔符装饰 */
	.date-separator::before,
	.date-separator::after {
		content: '';
		position: absolute;
		top: 50%;
		width: 4rpx;
		height: 4rpx;
		background: $text-tertiary;
		border-radius: 50%;
		opacity: 0.3;
	}
	
	.date-separator::before {
		left: -8rpx;
	}
	
	.date-separator::after {
		right: -8rpx;
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

	/* 收支总览卡片 - 精致高端版 */
	.overview-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		border-radius: 16rpx;
		padding: 32rpx $spacing-xl;
		margin-bottom: $spacing-2xl;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06), 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
		border: 1rpx solid rgba(255, 255, 255, 0.9);
		position: relative;
		overflow: hidden;
	}
	
	/* 卡片装饰光效 */
	.overview-card::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -30%;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(7, 193, 96, 0.06) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}
	
	.overview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-lg;
		position: relative;
		z-index: 1;
	}
	
	.overview-title {
		font-size: $font-size-base;
		font-weight: 600;
		color: $text-primary;
		letter-spacing: 0.3rpx;
	}
	
	/* 海报按钮 - 年度账单版 - 美团风格 */
	.poster-btn-mini {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4rpx;
		padding: 10rpx 16rpx; /* 美团风格：更紧凑 */
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
		transition: all $transition-fast;
		border: 2rpx solid rgba(255, 255, 255, 0.5);
		position: relative;
		overflow: hidden;
	}
	
	.poster-btn-mini::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: linear-gradient(45deg, transparent 30%, rgba(255, 255, 255, 0.3) 50%, transparent 70%);
		animation: shine 3s infinite;
	}
	
	@keyframes shine {
		0% {
			transform: translateX(-100%) translateY(-100%) rotate(45deg);
		}
		100% {
			transform: translateX(100%) translateY(100%) rotate(45deg);
		}
	}
	
	.poster-btn-mini:active {
		transform: scale(0.95);
		background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
		box-shadow: $shadow-sm; /* 美团风格：更轻的阴影 */
	}
	
	.poster-icon-mini {
		font-size: 28rpx; /* 美团风格：稍小的图标 */
		position: relative;
		z-index: 1;
	}
	
	.poster-label {
		font-size: 20rpx;
		color: #8B4513;
		font-weight: $font-weight-bold;
		position: relative;
		z-index: 1;
		white-space: nowrap;
	}
	
	.overview-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.overview-row.balance-row {
		margin-top: $spacing-sm; /* 减小间距 */
		padding-top: $spacing-sm; /* 减小间距 */
	}
	
	.overview-divider {
		height: 1rpx;
		background: #F0F0F0;
		margin: $spacing-sm 0; /* 减小间距 */
	}

	.overview-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.overview-label-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
		margin-bottom: 4rpx; /* 减小间距 */
	}

	.overview-label {
		font-size: $font-size-xs;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
	}
	
	.eye-icon-img {
		width: 28rpx;
		height: 28rpx;
		opacity: 0.5;
		transition: all $transition-fast;
	}
	
	.eye-icon-img:active {
		opacity: 0.8;
		transform: scale(0.9);
	}

	.overview-amount {
		font-size: 40rpx;
		font-weight: $font-weight-semibold;
		color: $primary-color;
		font-family: 'DIN Alternate', monospace;
	}
	
	.income-color {
		color: $success-color !important; /* 使用主题色 */
	}
	
	.expense-color {
		color: #FF4D4F !important;
	}

	.overview-count {
		font-size: 40rpx; /* 减小字号 */
		font-weight: $font-weight-semibold;
		color: $text-primary;
		font-family: 'DIN Alternate', monospace;
	}
	
	/* 类型切换标签 - 参考首页拍照/语音按钮样式 */
	.type-tabs {
		display: flex;
		gap: $spacing-sm;
		margin-bottom: $spacing-2xl;
	}
	
	.type-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-xs;
		height: 88rpx;
		padding: 0 $spacing-md;
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		border-radius: 14rpx;
		transition: all $transition-fast;
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04), 0 1rpx 4rpx rgba(0, 0, 0, 0.02);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
	}
	
	.type-tab.active {
		background: #E8F5E9;
		border: 1rpx solid rgba(82, 196, 26, 0.2);
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.08), 0 2rpx 8rpx rgba(82, 196, 26, 0.05);
	}
	
	.type-tab::before {
		content: '';
		position: absolute;
		top: -50%;
		left: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, transparent 70%);
		opacity: 0;
		transition: opacity $transition-fast;
	}
	
	.type-tab:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}
	
	.type-tab:active::before {
		opacity: 1;
	}
	
	.tab-icon {
		font-size: 38rpx;
	}
	
	.tab-text {
		font-size: $font-size-base;
		color: $text-secondary;
		font-weight: 500;
		position: relative;
		z-index: 1;
	}
	
	.type-tab.active .tab-text {
		color: #52C41A;
		font-weight: 600;
	}

	.overview-card, .analysis-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-md; /* 减小内边距 */
		margin-bottom: $spacing-xl; /* 增大卡片之间的间距 */
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06), 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
	}
	
	.chart-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-lg $spacing-md $spacing-sm $spacing-md; /* 顶部内边距与财务分析保持一致 */
		margin-bottom: $spacing-md; /* 减小底部间距，让下面的财务分析板块更靠近 */
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06), 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
	}

	.card-title {
		font-size: $font-size-base;
		font-weight: 600;
		color: $text-primary;
		margin-bottom: $spacing-lg;
		padding: 0;
		border-bottom: none;
	}
	
	/* 卡片头部 - 标题和切换按钮 */
	.card-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-lg;
	}
	
	/* 图表类型切换器 */
	.chart-type-switcher {
		display: flex;
		gap: 0;
		background: #F5F5F5;
		border-radius: 20rpx;
		padding: 4rpx;
	}
	
	.chart-type-btn {
		padding: 8rpx 20rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 16rpx;
		transition: all 0.3s ease;
		background: transparent;
	}
	
	.chart-type-btn.active {
		background: linear-gradient(135deg, #E8F5E9 0%, #F0FFF4 100%); /* 浅绿色渐变 */
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.15);
	}
	
	.chart-type-text {
		font-size: 24rpx;
		color: #666666;
		transition: all 0.3s ease;
		font-weight: 400;
	}
	
	.chart-type-btn.active .chart-type-text {
		color: #52C41A; /* 绿色文字 */
		font-weight: 500;
	}

	/* 图表包装器 */
	.chart-wrapper {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0 0 32rpx 0; /* 移除顶部内边距 */
		gap: 12rpx; /* 减小标签间距，让环形图更紧凑 */
		/* 移除min-height限制，让内容自适应 */
	}
	
	.chart-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 48rpx; /* 增大间距，让标签与图表距离更大 */
		width: 100%;
		padding: 0 20rpx; /* 适中的左右内边距 */
	}
	
	.chart-center {
		flex-shrink: 0;
	}

	.chart-canvas {
		width: 140px; /* 增大图表尺寸 */
		height: 140px;
	}
	
	/* 折线图/柱状图容器 */
	.bar-line-chart-container {
		width: 100%;
		display: flex;
		justify-content: center;
		padding: 20rpx 0;
	}
	
	.bar-line-canvas {
		width: 335px;
		height: 220px;
	}
	
	/* 标签样式 - 优化视觉层次 */
	.label-top,
	.label-bottom {
		display: flex;
		align-items: center;
		gap: 10rpx;
		background: #FFFFFF;
		backdrop-filter: blur(10rpx);
		padding: 12rpx 16rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
	}
	
	.label-left,
	.label-right {
		display: flex;
		align-items: center;
		gap: 8rpx;
		background: #FFFFFF;
		backdrop-filter: blur(10rpx);
		padding: 10rpx 14rpx;
		border-radius: 12rpx;
		box-shadow: 0 2rpx 12rpx rgba(0, 0, 0, 0.06);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
		flex-shrink: 0;
	}
	
	.label-dot {
		width: 12rpx;
		height: 12rpx;
		border-radius: 50%;
		flex-shrink: 0;
		box-shadow: 0 2rpx 6rpx rgba(0, 0, 0, 0.15);
	}
	
	.label-info {
		display: flex;
		flex-direction: column;
		gap: 2rpx;
		min-width: 0;
	}
	
	.label-text {
		font-size: 22rpx;
		color: $text-secondary;
		font-weight: $font-weight-semibold;
		line-height: 1.3;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	
	.label-value {
		font-size: 24rpx;
		color: $text-primary;
		font-weight: $font-weight-bold;
		line-height: 1.2;
		font-family: 'DIN Alternate', monospace;
	}
	
	.label-percent {
		font-size: 20rpx;
		color: $primary-color;
		font-weight: $font-weight-bold;
		line-height: 1;
	}
	
	/* 支出构成空状态 - 居中显示、精致专业 */
	.chart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 40rpx;
		background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
		border-radius: 12rpx;
		margin: 20rpx 0;
	}
	
	.empty-text {
		font-size: 32rpx;
		color: #8C8C8C;
		margin-bottom: 32rpx;
		font-weight: 500;
		text-align: center;
		line-height: 1.5;
	}
	
	.empty-action {
		padding: 20rpx 48rpx;
		background: linear-gradient(135deg, $primary-color 0%, #45B015 100%);
		color: #FFFFFF;
		font-size: 28rpx;
		font-weight: 600;
		border-radius: 35rpx;
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.25);
		transition: all $transition-fast;
		letter-spacing: 0.5rpx;
		position: relative;
		overflow: hidden;
	}
	
	/* 按钮光泽效果 */
	.empty-action::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 0.5s ease;
	}
	
	.empty-action:active {
		transform: scale(0.96);
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.2);
	}
	
	.empty-action:active::before {
		left: 100%;
	}
	
	/* 财务分析空状态 - 与支出构成空状态保持一致 */
	.analysis-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 100rpx 40rpx;
		background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
		border-radius: 12rpx;
		margin: 20rpx 0;
	}
	
	.analysis-empty .empty-text {
		font-size: 32rpx;
		color: #8C8C8C;
		margin-bottom: 12rpx;
		font-weight: 500;
		text-align: center;
		line-height: 1.5;
	}
	
	.analysis-empty .empty-tip {
		font-size: 26rpx;
		color: #BFBFBF;
		text-align: center;
		line-height: 1.5;
	}
	
	/* 消费分析卡片 - 美团风格 */
	.analysis-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		border-radius: 16rpx; /* 增大圆角 */
		padding: $spacing-xl;
		margin-bottom: $spacing-md;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.06), 0 2rpx 8rpx rgba(0, 0, 0, 0.03);
		border: 1rpx solid rgba(82, 196, 26, 0.12);
		position: relative;
		overflow: hidden;
	}
	
	/* 卡片装饰光效 */
	.analysis-card::before {
		content: '';
		position: absolute;
		top: -40%;
		right: -20%;
		width: 180rpx;
		height: 180rpx;
		background: radial-gradient(circle, rgba(82, 196, 26, 0.05) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}
	
	.insights-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-md; /* 增大间距 */
		position: relative;
		z-index: 1;
	}
	
	.insight-item {
		display: flex;
		align-items: flex-start;
		padding: $spacing-lg;
		border-radius: 12rpx;
		background: #FFFFFF;
		border: 1rpx solid #E8E8E8; /* 添加清晰边框 */
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		transition: all 0.3s ease;
	}
	
	.insight-item:active {
		transform: scale(0.98);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.03);
	}
	
	.insight-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 6rpx; /* 增大间距 */
		min-width: 0;
	}
	
	.insight-text {
		font-size: 28rpx; /* 增大字号 */
		color: #262626; /* 更深的主文字颜色 */
		font-weight: 500;
		line-height: 1.6;
		letter-spacing: 0.3rpx;
	}
	
	/* 不同类型的文字颜色优化 - 更精致的配色 */
	.insight-item.danger .insight-text {
		color: #FF4D4F;
		font-weight: 600;
	}
	
	.insight-item.danger {
		background: linear-gradient(135deg, #FFF1F0 0%, #FFFFFF 100%);
		border-color: rgba(255, 77, 79, 0.2);
	}
	
	.insight-item.warning .insight-text {
		color: #FA8C16;
		font-weight: 600;
	}
	
	.insight-item.warning {
		background: linear-gradient(135deg, #FFF7E6 0%, #FFFFFF 100%);
		border-color: rgba(250, 140, 22, 0.2);
	}
	
	.insight-item.success .insight-text {
		color: #52C41A;
		font-weight: 600;
	}
	
	.insight-item.success {
		background: linear-gradient(135deg, #F6FFED 0%, #FFFFFF 100%);
		border-color: rgba(82, 196, 26, 0.2);
	}
	
	.insight-item.info .insight-text {
		color: #1890FF;
		font-weight: 600;
	}
	
	.insight-item.info {
		background: linear-gradient(135deg, #E6F7FF 0%, #FFFFFF 100%);
		border-color: rgba(24, 144, 255, 0.2);
	}
	
	/* 空状态样式 - 居中显示、精致专业 */
	.insight-item.empty {
		background: linear-gradient(135deg, #FAFAFA 0%, #F5F5F5 100%);
		border: 1rpx solid #E8E8E8;
		padding: 60rpx 32rpx;
		justify-content: center;
		align-items: center;
		text-align: center;
	}
	
	.insight-item.empty .insight-content {
		align-items: center;
		gap: 12rpx;
	}
	
	.insight-item.empty .insight-text {
		font-size: 32rpx;
		color: #8C8C8C;
		font-weight: 500;
	}
	
	.insight-item.empty .insight-tip {
		font-size: 26rpx;
		color: #BFBFBF;
		text-align: center;
	}
	
	.insight-tip {
		font-size: 24rpx; /* 增大字号 */
		color: #8C8C8C; /* 更柔和的辅助文字颜色 */
		line-height: 1.5;
		margin-top: 4rpx;
		letter-spacing: 0.3rpx;
	}
</style>
