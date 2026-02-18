<template>
	<view class="page">
		<view class="container">
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
				<view class="overview-title-wrapper">
					<text class="overview-title">收支总览</text>
					<text class="overview-subtitle">{{ getFilterLabel() }}数据</text>
				</view>
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
						<image class="eye-icon-img" :src="data.hideIncome ? '/static/miwen.png' : '/static/mingwen.png'" @click="toggleIncome" mode="aspectFit"></image>
					</view>
					<text class="overview-amount income-color" v-if="!data.hideIncome">+¥{{ formatAmount(data.totalIncome) }}</text>
					<text class="overview-amount income-color" v-else>****</text>
				</view>
				<view class="overview-item expense-item">
					<view class="overview-label-row">
						<text class="overview-label">总支出</text>
						<image class="eye-icon-img" :src="data.hideExpense ? '/static/miwen.png' : '/static/mingwen.png'" @click="toggleExpense" mode="aspectFit"></image>
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
						<image class="eye-icon-img" :src="data.hideBalance ? '/static/miwen.png' : '/static/mingwen.png'" @click="toggleBalance" mode="aspectFit"></image>
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
				<text class="tab-icon">💸</text>
				<text class="tab-text">支出分析</text>
			</view>
			<view 
				class="type-tab" 
				:class="{ 'active': data.currentType === 'income' }"
				@click="switchType('income')"
			>
				<text class="tab-icon">💰</text>
				<text class="tab-text">收入分析</text>
			</view>
		</view>
		
		<!-- 环形图 -->
		<view class="chart-card">
			<view class="card-title">{{ data.currentType === 'income' ? '收入' : '支出' }}构成</view>
			<view class="chart-wrapper" v-if="data.chartData.length > 0">
				<!-- 顶部标签 -->
				<view class="label-top" v-if="data.chartData[0]">
					<view class="label-dot" :style="{ backgroundColor: data.chartData[0].color }"></view>
					<view class="label-info">
						<text class="label-text">{{ data.chartData[0].icon }} {{ data.chartData[0].name }}</text>
						<text class="label-value">¥{{ data.chartData[0].amount.toFixed(0) }} ({{ data.chartData[0].percent }}%)</text>
					</view>
				</view>
				
				<view class="chart-row">
					<!-- 左侧标签 -->
					<view class="label-left" v-if="data.chartData[3]">
						<view class="label-dot" :style="{ backgroundColor: data.chartData[3].color }"></view>
						<view class="label-info">
							<text class="label-text">{{ data.chartData[3].icon }} {{ data.chartData[3].name }}</text>
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
							<text class="label-text">{{ data.chartData[1].icon }} {{ data.chartData[1].name }}</text>
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
						<text class="label-text">{{ data.chartData[2].icon }} {{ data.chartData[2].name }}</text>
						<text class="label-value">¥{{ data.chartData[2].amount.toFixed(0) }} ({{ data.chartData[2].percent }}%)</text>
					</view>
				</view>
			</view>
			<view class="chart-empty" v-else>
				<text class="empty-icon">📊</text>
				<text class="empty-text">暂无{{ data.currentType === 'income' ? '收入' : '支出' }}数据</text>
				<view class="empty-action" @click="goToHome">快去记账</view>
			</view>
		</view>
		
		<!-- 消费分析 -->
		<view class="analysis-card" v-if="data.insights.length > 0">
			<view class="card-title">财务分析</view>
			<view class="insights-list">
				<view 
					class="insight-item" 
					v-for="(insight, index) in data.insights" 
					:key="index"
					:class="insight.type"
				>
					<view class="insight-icon">{{ insight.icon }}</view>
					<view class="insight-content">
						<text class="insight-text">{{ insight.text }}</text>
						<text class="insight-tip" v-if="insight.tip">{{ insight.tip }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 自定义时间选择弹窗 -->
		<view class="custom-time-modal" v-if="data.showCustomPicker" @click="closeCustomPicker">
			<view class="calendar-picker" @click.stop>
				<view class="calendar-header">
					<view class="calendar-nav">
						<text class="nav-arrow" @click="prevMonth">‹</text>
						<text class="calendar-title">{{ data.calendarYear }}年{{ data.calendarMonth }}月</text>
						<text class="nav-arrow" @click="nextMonth">›</text>
					</view>
					<text class="calendar-close" @click="closeCustomPicker">✕</text>
				</view>
				
				<view class="date-range-display">
					<view class="date-input" :class="{ 'active': data.selectingStart }" @click="data.selectingStart = true">
						<text class="input-label">开始日期</text>
						<text class="input-value">{{ data.customStartDate || '请选择' }}</text>
					</view>
					<text class="date-separator">-</text>
					<view class="date-input" :class="{ 'active': !data.selectingStart }" @click="data.selectingStart = false">
						<text class="input-label">结束日期</text>
						<text class="input-value">{{ data.customEndDate || '请选择' }}</text>
					</view>
				</view>
				
				<view class="calendar-weekdays">
					<text class="weekday">日</text>
					<text class="weekday">一</text>
					<text class="weekday">二</text>
					<text class="weekday">三</text>
					<text class="weekday">四</text>
					<text class="weekday">五</text>
					<text class="weekday">六</text>
				</view>
				
				<view class="calendar-days">
					<view 
						v-for="(day, index) in data.calendarDays" 
						:key="index"
						class="calendar-day"
						:class="{
							'other-month': !day.isCurrentMonth,
							'start-date': day.isStart,
							'end-date': day.isEnd,
							'in-range': day.inRange,
							'today': day.isToday
						}"
						@click="selectDate(day)"
					>
						<text class="day-text">{{ day.day }}</text>
					</view>
				</view>
				
				<view class="calendar-footer">
					<view class="footer-btn cancel-btn" @click="closeCustomPicker">取消</view>
					<view class="footer-btn confirm-btn" @click="confirmCustomTime">确认</view>
				</view>
			</view>
		</view>
</view>
	</view>
</template>

<script setup>
import { reactive, nextTick } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'

const data = reactive({
	currentFilter: 'month',
	currentType: 'expense', // 当前查看的类型：expense 或 income
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
	calendarYear: new Date().getFullYear(),
	calendarMonth: new Date().getMonth() + 1,
	calendarDays: [],
	selectingStart: true, // true表示正在选择开始日期，false表示选择结束日期
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

// 检查登录状态
const checkLogin = () => {
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isLogin
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
		drawPieChart()
	})
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
					const startTime = new Date(data.customStartDate).getTime()
					const endTime = new Date(data.customEndDate).getTime()
					const billTime = billDate.getTime()
					return billTime >= startTime && billTime <= endTime
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
	
	// 如果没有账单，显示提示信息
	if (data.billCount === 0) {
		insights.push({
			type: 'info',
			icon: '📝',
			text: '还没有账单记录',
			tip: '快去记录第一笔账单吧'
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
	// 显示 tabbar
	uni.showTabBar()
}

// 初始化自定义时间选择器
const initCustomPicker = () => {
	const now = new Date()
	data.calendarYear = now.getFullYear()
	data.calendarMonth = now.getMonth() + 1
	
	// 默认选择本月1号到今天
	const firstDay = `${data.calendarYear}-${String(data.calendarMonth).padStart(2, '0')}-01`
	const today = `${data.calendarYear}-${String(data.calendarMonth).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
	
	data.customStartDate = firstDay
	data.customEndDate = today
	data.selectingStart = true
	
	generateCalendar()
}

// 生成日历
const generateCalendar = () => {
	const year = data.calendarYear
	const month = data.calendarMonth
	
	// 获取当月第一天是星期几（0-6）
	const firstDay = new Date(year, month - 1, 1).getDay()
	// 获取当月有多少天
	const daysInMonth = new Date(year, month, 0).getDate()
	// 获取上个月有多少天
	const prevMonthDays = new Date(year, month - 1, 0).getDate()
	
	const days = []
	const today = new Date()
	const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
	
	// 添加上个月的日期
	for (let i = firstDay - 1; i >= 0; i--) {
		const day = prevMonthDays - i
		const dateStr = `${year}-${String(month - 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
		days.push({
			day,
			dateStr,
			isCurrentMonth: false,
			isToday: false,
			isStart: false,
			isEnd: false,
			inRange: false
		})
	}
	
	// 添加当月的日期
	for (let i = 1; i <= daysInMonth; i++) {
		const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`
		const isStart = dateStr === data.customStartDate
		const isEnd = dateStr === data.customEndDate
		const inRange = data.customStartDate && data.customEndDate && 
			dateStr > data.customStartDate && dateStr < data.customEndDate
		
		days.push({
			day: i,
			dateStr,
			isCurrentMonth: true,
			isToday: dateStr === todayStr,
			isStart,
			isEnd,
			inRange
		})
	}
	
	// 添加下个月的日期，补齐到42个（6行7列）
	const remainingDays = 42 - days.length
	for (let i = 1; i <= remainingDays; i++) {
		const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
		days.push({
			day: i,
			dateStr,
			isCurrentMonth: false,
			isToday: false,
			isStart: false,
			isEnd: false,
			inRange: false
		})
	}
	
	data.calendarDays = days
}

// 选择日期
const selectDate = (day) => {
	if (!day.isCurrentMonth) return
	
	if (data.selectingStart) {
		data.customStartDate = day.dateStr
		data.selectingStart = false
		// 如果开始日期晚于结束日期，清空结束日期
		if (data.customEndDate && day.dateStr > data.customEndDate) {
			data.customEndDate = null
		}
	} else {
		// 如果选择的结束日期早于开始日期，交换它们
		if (data.customStartDate && day.dateStr < data.customStartDate) {
			data.customEndDate = data.customStartDate
			data.customStartDate = day.dateStr
		} else {
			data.customEndDate = day.dateStr
		}
	}
	
	generateCalendar()
}

// 上一个月
const prevMonth = () => {
	if (data.calendarMonth === 1) {
		data.calendarMonth = 12
		data.calendarYear--
	} else {
		data.calendarMonth--
	}
	generateCalendar()
}

// 下一个月
const nextMonth = () => {
	if (data.calendarMonth === 12) {
		data.calendarMonth = 1
		data.calendarYear++
	} else {
		data.calendarMonth++
	}
	generateCalendar()
}

// 确认自定义时间
const confirmCustomTime = async () => {
	data.currentFilter = 'custom'
	data.showCustomPicker = false
	// 显示 tabbar
	uni.showTabBar()
	
	// 显示加载提示
	uni.showLoading({ title: '加载中...' })
	
	try {
		// 直接从API获取最新数据
		const bills = await billStorage.getFromAPI()
		// 确保返回的是数组
		data.allBills = Array.isArray(bills) ? bills : []
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
		background: #F7F8FA;
	}
	
	.container {
		min-height: 100vh;
		background: #F7F8FA;
		padding: $spacing-sm $spacing-md;
		padding-bottom: 100rpx;
		box-sizing: border-box;
		/* #ifdef APP-PLUS */
		padding-top: $spacing-md;
		/* #endif */
	}
	
	/* 筛选器包装容器 - 美团风格 */
	.filter-wrapper {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-sm;
		/* #ifdef MP-WEIXIN */
		margin-top: $spacing-sm;
		/* #endif */
		/* #ifdef APP-PLUS */
		margin-top: $spacing-sm;
		/* #endif */
		margin-bottom: $spacing-xl; /* 增大与收支总览的间距 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		border: 2rpx solid rgba(82, 196, 26, 0.08);
	}

	.time-filter {
		display: flex;
		gap: $spacing-md;
	}

	.filter-item {
		flex: 1;
		text-align: center;
		padding: 16rpx 20rpx; /* 美团风格：更紧凑 */
		font-size: 28rpx;
		color: $text-secondary;
		background: $bg-light;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		transition: all $transition-base ease;
		font-weight: $font-weight-medium;
		border: 2rpx solid transparent;
		position: relative;
		overflow: hidden;
		letter-spacing: 0.5rpx;
	}
	
	.filter-item::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent);
		transition: left 0.5s ease;
	}
	
	.filter-item:active {
		transform: scale(0.96);
	}
	
	.filter-item:active::before {
		left: 100%;
	}

	.filter-item.active {
		background: $gradient-primary;
		color: $text-white;
		font-weight: $font-weight-semibold;
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
		transform: scale(1.02);
		border-color: transparent;
	}
	
	.filter-item.active:active {
		transform: scale(0.98);
	}

	.custom-filter {
		background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%);
		border: 2rpx solid rgba(82, 196, 26, 0.2);
	}
	
	.custom-filter.active {
		background: $gradient-primary;
		color: $text-white;
		border-color: transparent;
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
	}
	
	/* 自定义时间选择弹窗 */
	.custom-time-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 99999;
		animation: fadeIn 0.3s ease;
		backdrop-filter: blur(8rpx);
	}
	
	.calendar-picker {
		width: 92%;
		max-width: 680rpx;
		background: #FFFFFF;
		border-radius: $radius-xl; /* 美团风格：16rpx圆角 */
		animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.2), 0 8rpx 24rpx rgba(0, 0, 0, 0.12); /* 美团风格：更轻的阴影 */
		overflow: hidden;
		position: relative;
		z-index: 100000;
	}
	
	.calendar-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 32rpx 32rpx 24rpx;
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
		position: relative;
		overflow: hidden;
	}
	
	.calendar-header::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 400rpx;
		height: 400rpx;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.15) 0%, transparent 70%);
		border-radius: 50%;
	}
	
	.calendar-nav {
		display: flex;
		align-items: center;
		gap: 24rpx;
		position: relative;
		z-index: 1;
	}
	
	.nav-arrow {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 40rpx;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		transition: all 0.2s;
		backdrop-filter: blur(10rpx);
	}
	
	.nav-arrow:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.9);
	}
	
	.calendar-title {
		font-size: 36rpx;
		font-weight: $font-weight-bold;
		color: #FFFFFF;
		letter-spacing: 1rpx;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}
	
	.calendar-close {
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		color: rgba(255, 255, 255, 0.9);
		background: rgba(255, 255, 255, 0.2);
		border-radius: 50%;
		transition: all 0.2s;
		backdrop-filter: blur(10rpx);
		position: relative;
		z-index: 1;
	}
	
	.calendar-close:active {
		background: rgba(255, 255, 255, 0.3);
		transform: scale(0.9) rotate(90deg);
	}
	
	.date-range-display {
		display: flex;
		align-items: center;
		padding: 24rpx 32rpx;
		gap: 16rpx;
		background: #FFFFFF;
	}
	
	.date-input {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		padding: 16rpx 20rpx; /* 美团风格：更紧凑 */
		background: linear-gradient(135deg, #F6FFED 0%, #F0FFF4 100%);
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		border: 2rpx solid transparent;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		position: relative;
		overflow: hidden;
	}
	
	.date-input::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(115, 209, 61, 0.05) 100%);
		opacity: 0;
		transition: opacity 0.3s;
	}
	
	.date-input.active {
		border-color: $primary-color;
		background: #FFFFFF;
		box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.2), 0 0 0 4rpx rgba(82, 196, 26, 0.1);
		transform: scale(1.02);
	}
	
	.date-input.active::before {
		opacity: 1;
	}
	
	.input-label {
		font-size: 24rpx;
		color: $text-tertiary;
		font-weight: $font-weight-medium;
		letter-spacing: 0.5rpx;
	}
	
	.input-value {
		font-size: 28rpx;
		color: $text-primary;
		font-weight: $font-weight-bold;
		letter-spacing: 0.5rpx;
	}
	
	.date-input.active .input-value {
		color: $primary-color;
	}
	
	.date-separator {
		font-size: 32rpx;
		color: $text-tertiary;
		font-weight: $font-weight-bold;
	}
	
	.calendar-weekdays {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding: 24rpx 32rpx 16rpx;
		background: #FFFFFF;
	}
	
	.weekday {
		text-align: center;
		font-size: 26rpx;
		color: $text-tertiary;
		font-weight: $font-weight-bold;
		letter-spacing: 0.5rpx;
	}
	
	.calendar-days {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		padding: 8rpx 24rpx 32rpx;
		gap: 8rpx;
		background: #FFFFFF;
	}
	
	.calendar-day {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		position: relative;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		cursor: pointer;
	}
	
	.calendar-day::before {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 50%;
		background: transparent;
		transition: all 0.2s;
	}
	
	.calendar-day.other-month {
		opacity: 0.25;
	}
	
	.calendar-day:not(.other-month):active {
		transform: scale(0.85);
	}
	
	.calendar-day:not(.other-month):active::before {
		background: rgba(82, 196, 26, 0.1);
	}
	
	.day-text {
		font-size: 28rpx;
		color: $text-primary;
		font-weight: $font-weight-medium;
		z-index: 1;
		transition: all 0.2s;
	}
	
	.calendar-day.today {
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(115, 209, 61, 0.1) 100%);
		border: 2rpx solid rgba(82, 196, 26, 0.3);
	}
	
	.calendar-day.today .day-text {
		color: $primary-color;
		font-weight: $font-weight-bold;
	}
	
	.calendar-day.start-date,
	.calendar-day.end-date {
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.4), 0 0 0 4rpx rgba(82, 196, 26, 0.15);
		transform: scale(1.05);
	}
	
	.calendar-day.start-date .day-text,
	.calendar-day.end-date .day-text {
		color: #FFFFFF;
		font-weight: $font-weight-bold;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
	}
	
	.calendar-day.in-range {
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.12) 0%, rgba(115, 209, 61, 0.08) 100%);
		border-radius: 0;
	}
	
	.calendar-day.in-range .day-text {
		color: $primary-color;
		font-weight: $font-weight-semibold;
	}
	
	.calendar-footer {
		display: flex;
		gap: 20rpx;
		padding: 24rpx 32rpx 32rpx;
		background: #FFFFFF;
	}
	
	.footer-btn {
		flex: 1;
		text-align: center;
		padding: 24rpx; /* 美团风格：更紧凑 */
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		font-size: 30rpx; /* 美团风格：稍小的字号 */
		font-weight: $font-weight-bold;
		transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		letter-spacing: 2rpx;
		position: relative;
		overflow: hidden;
	}
	
	.footer-btn::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transform: translate(-50%, -50%);
		transition: width 0.4s, height 0.4s;
	}
	
	.footer-btn:active::before {
		width: 200%;
		height: 200%;
	}
	
	.cancel-btn {
		background: linear-gradient(135deg, #F5F5F5 0%, #E8E8E8 100%);
		color: $text-secondary;
		border: 2rpx solid $border-light;
	}
	
	.cancel-btn:active {
		transform: scale(0.96);
		background: linear-gradient(135deg, #E8E8E8 0%, #D9D9D9 100%);
	}
	
	.confirm-btn {
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
		color: #FFFFFF;
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
		border: 2rpx solid transparent;
	}
	
	.confirm-btn:active {
		transform: scale(0.96);
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3), 0 2rpx 6rpx rgba(82, 196, 26, 0.15);
	}
	
	@keyframes fadeIn {
		from { 
			opacity: 0;
		}
		to { 
			opacity: 1;
		}
	}
	
	@keyframes scaleIn {
		from { 
			opacity: 0;
			transform: scale(0.9) translateY(40rpx);
		}
		to { 
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.overview-card {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-xl; /* 增大内边距，让卡片更高 */
		margin-bottom: $spacing-xl; /* 增大底部间距 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}
	
	.overview-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-sm; /* 减小间距 */
	}
	
	.overview-title-wrapper {
		display: flex;
		flex-direction: column;
		gap: 4rpx;
	}
	
	.overview-title {
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		color: $text-primary;
	}
	
	.overview-subtitle {
		font-size: $font-size-xs;
		color: $text-tertiary;
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
		font-weight: $font-weight-bold;
		color: $primary-color;
		font-family: 'DIN Alternate', monospace;
	}
	
	.income-color {
		color: #52C41A !important;
	}
	
	.expense-color {
		color: #FF4D4F !important;
	}

	.overview-count {
		font-size: 40rpx; /* 减小字号 */
		font-weight: $font-weight-bold;
		color: $text-primary;
		font-family: 'DIN Alternate', monospace;
	}
	
	/* 类型切换标签 - 美团风格 */
	.type-tabs {
		display: flex;
		gap: $spacing-sm;
		margin-bottom: $spacing-xl; /* 增大与支出构成卡片的间距 */
		padding: $spacing-xs;
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}
	
	.type-tab {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-xs;
		padding: $spacing-md; /* 增大内边距，让按钮更高 */
		background: transparent;
		border-radius: $radius-lg;
		transition: all $transition-fast;
	}
	
	.type-tab.active {
		background: #F0F9FF;
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.1);
	}
	
	.type-tab:active {
		transform: scale(0.98);
	}
	
	.tab-icon {
		font-size: 40rpx; /* 增大图标尺寸 */
	}
	
	.tab-text {
		font-size: $font-size-base; /* 增大文字尺寸 */
		color: $text-secondary;
		font-weight: $font-weight-medium;
	}
	
	.type-tab.active .tab-text {
		color: #52C41A;
		font-weight: $font-weight-semibold;
	}

	.overview-card, .analysis-card {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-md; /* 减小内边距 */
		margin-bottom: $spacing-xl; /* 增大卡片之间的间距 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}
	
	.chart-card {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-xs $spacing-md $spacing-sm $spacing-md; /* 减小顶部内边距，让标题更靠上 */
		margin-bottom: $spacing-md; /* 减小底部间距，让下面的财务分析板块更靠近 */
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	}

	.card-title {
		font-size: $font-size-base; /* 与收支总览标题字体大小一致 */
		font-weight: $font-weight-bold; /* 加粗标题 */
		color: $text-primary;
		margin-bottom: 4rpx; /* 进一步减小底部间距 */
		padding-bottom: 0; /* 移除底部内边距 */
		border-bottom: none; /* 移除分割线 */
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
	
	.chart-empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 80rpx 0;
	}
	
	.empty-icon {
		font-size: 80rpx; /* 美团风格：稍小的图标 */
		margin-bottom: $spacing-lg;
		opacity: 0.4;
		filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.08));
		animation: float 3s ease-in-out infinite;
	}
	
	@keyframes float {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-12rpx); }
	}
	
	.empty-text {
		font-size: $font-size-lg;
		color: $text-secondary;
		margin-bottom: $spacing-xl;
		font-weight: $font-weight-medium;
	}
	
	.empty-action {
		padding: $spacing-md $spacing-2xl;
		background: $gradient-primary;
		color: $text-white;
		font-size: $font-size-base;
		font-weight: $font-weight-bold;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
		transition: all $transition-fast;
		letter-spacing: 0.5rpx;
	}
	
	.empty-action:active {
		opacity: 0.9;
		transform: scale(0.96);
	}
	
	/* 消费分析卡片 - 美团风格 */
	.analysis-card {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: $spacing-lg;
		margin-bottom: $spacing-md;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		border: 2rpx solid rgba(82, 196, 26, 0.08);
	}
	
	.insights-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-sm;
	}
	
	.insight-item {
		display: flex;
		align-items: flex-start;
		gap: $spacing-sm;
		padding: $spacing-md;
		border-radius: $radius-lg;
		background: linear-gradient(135deg, #FAFAFA 0%, #FFFFFF 100%); /* 更精致的背景 */
		border: 1rpx solid rgba(0, 0, 0, 0.06); /* 添加边框 */
		position: relative;
		overflow: hidden;
		box-shadow: $shadow-sm; /* 添加轻微阴影 */
	}
	
	.insight-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4rpx; /* 美团风格：更细的装饰线 */
		border-radius: 0 2rpx 2rpx 0;
	}
	
	.insight-item.info::before {
		background: linear-gradient(180deg, #1890FF 0%, #40A9FF 100%);
	}
	
	.insight-item.success::before {
		background: linear-gradient(180deg, #52C41A 0%, #73D13D 100%);
	}
	
	.insight-item.warning::before {
		background: linear-gradient(180deg, #FAAD14 0%, #FFC53D 100%);
	}
	
	.insight-item.danger::before {
		background: linear-gradient(180deg, #F5222D 0%, #FF4D4F 100%);
	}
	
	.insight-icon {
		font-size: 32rpx; /* 美团风格：稍小的图标 */
		line-height: 1;
		flex-shrink: 0;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}
	
	.insight-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 4rpx;
		min-width: 0;
	}
	
	.insight-text {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-medium; /* 调整字重 */
		line-height: 1.5;
		letter-spacing: 0.3rpx;
	}
	
	/* 不同类型的文字颜色优化 */
	.insight-item.danger .insight-text {
		color: #FF4D4F;
		font-weight: $font-weight-semibold;
	}
	
	.insight-item.warning .insight-text {
		color: #FA8C16;
		font-weight: $font-weight-semibold;
	}
	
	.insight-item.success .insight-text {
		color: #52C41A;
		font-weight: $font-weight-semibold;
	}
	
	.insight-item.info .insight-text {
		color: #1890FF;
		font-weight: $font-weight-semibold;
	}
	
	.insight-tip {
		font-size: $font-size-sm;
		color: $text-secondary; /* 优化颜色 */
		line-height: 1.4;
		margin-top: 4rpx;
	}
</style>
