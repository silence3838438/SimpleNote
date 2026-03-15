<template>
	<view class="page">
		<!-- 自定义导航栏（随手记风格） -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<view class="navbar-title">
				<text class="title-text">首页</text>
			</view>
				<view class="navbar-right"></view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 56) + 'px' }">
			<!-- 顶部月份选择器 -->
			<view class="header">
				<view class="month-picker" @click="showMonthPicker">
					{{ data.currentMonthText }} <text class="arrow">▼</text>
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
					</picker-view>
				</view>
			</view>
			
			<!-- 收支结余卡片（美团风格优化） -->
		<view class="finance-summary-card">
			<!-- 收支数据 -->
			<view class="finance-data">
				<view class="finance-item income-item">
					<view class="finance-label-row">
						<view class="finance-label">本月收入</view>
						<image class="eye-icon-img" :src="data.hideIncome ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleIncome" mode="aspectFit"></image>
					</view>
					<view class="finance-amount income-color" v-if="!data.hideIncome">
						<text class="currency-symbol">¥</text>{{ formatAmount(data.totalIncome) }}
					</view>
					<view class="finance-amount income-color" v-else>****</view>
				</view>
				<view class="finance-divider"></view>
				<view class="finance-item expense-item">
					<view class="finance-label-row">
						<view class="finance-label">本月支出</view>
						<image class="eye-icon-img" :src="data.hideExpense ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleExpense" mode="aspectFit"></image>
					</view>
					<view class="finance-amount expense-color" v-if="!data.hideExpense">
						-<text class="currency-symbol">¥</text>{{ formatAmount(data.totalExpense) }}
					</view>
					<view class="finance-amount expense-color" v-else>****</view>
				</view>
			</view>
			
			<!-- 结余信息 -->
			<view class="balance-section" :class="{ 'positive': data.balance >= 0, 'negative': data.balance < 0 }">
				<view class="balance-label-row">
					<text class="balance-label">本月结余</text>
					<image class="eye-icon-img balance-eye-icon" :src="data.hideBalance ? 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/miwen.png' : 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/mingwen.png'" @click="toggleBalance" mode="aspectFit"></image>
				</view>
				<view class="balance-amount" v-if="!data.hideBalance">
					{{ data.balance >= 0 ? '' : '-' }}<text class="currency-symbol">¥</text>{{ formatAmount(Math.abs(data.balance)) }}
				</view>
				<view class="balance-amount" v-else>****</view>
				<view class="balance-tip">{{ data.balance >= 0 ? '收入大于支出，继续保持！' : '支出大于收入，注意控制！' }}</view>
			</view>
		</view>

		<!-- 记账按钮（紧凑版） -->
		<view class="action-buttons-compact">
			<view class="action-btn-compact photo-btn-compact" @click="goToPhoto">
				<text class="btn-icon-compact">📸</text>
				<text class="btn-text-compact">拍照记账</text>
			</view>
			<!-- 小程序端使用show_ai_advisor_wechat控制，APP端直接显示 -->
			<!-- #ifdef MP-WEIXIN -->
			<view class="action-btn-compact voice-btn-compact" v-if="data.appConfig.show_ai_advisor_wechat" @click="goToVoice">
				<text class="btn-icon-compact">🎤</text>
				<text class="btn-text-compact">语音记账</text>
			</view>
			<!-- #endif -->
			<!-- #ifdef APP-PLUS -->
			<view class="action-btn-compact voice-btn-compact" @click="goToVoice">
				<text class="btn-icon-compact">🎤</text>
				<text class="btn-text-compact">语音记账</text>
			</view>
			<!-- #endif -->
		</view>

		<!-- 预算进度（简化版） -->
		<view class="budget-card-compact" :class="getBudgetCardClass()">
			<view class="budget-header-compact" @click="toggleBudgetDetail">
				<view class="budget-title-wrapper">
					<text class="budget-title-compact">预算使用率</text>
					<view class="budget-warning-compact" v-if="data.budgetPercent >= 80">
						<text class="warning-icon-compact">{{ data.budgetPercent >= 100 ? '⚠️' : '⚡' }}</text>
						<text class="warning-text-compact">{{ getBudgetWarningText() }}</text>
					</view>
				</view>
				<text class="budget-percent-compact" :class="getBudgetPercentClass()">{{ data.budgetPercent }}%</text>
			</view>
			<view class="budget-bar-compact" @click="toggleBudgetDetail">
				<view class="budget-progress-compact" :class="getBudgetProgressClass()" :style="{ width: Math.min(data.budgetPercent, 100) + '%' }"></view>
			</view>
			
			<!-- 详细信息（可展开） -->
			<view class="budget-detail" v-if="data.showBudgetDetail">
				<view class="budget-footer-compact">
					<view class="budget-info-compact">
						<text class="budget-label-compact">本月预算</text>
						<text class="budget-amount-compact">¥{{ data.budget.toFixed(0) }}</text>
					</view>
					<view class="budget-info-compact">
						<text class="budget-label-compact">已使用</text>
						<text class="budget-used-compact" :class="{ 'over-budget': data.budgetPercent >= 100 }">¥{{ data.totalExpense.toFixed(0) }}</text>
					</view>
					<view class="budget-info-compact">
						<text class="budget-label-compact">剩余</text>
						<text class="budget-remaining-compact" :class="{ 'negative': data.budgetPercent >= 100 }">¥{{ (data.budget - data.totalExpense).toFixed(0) }}</text>
					</view>
				</view>
				<view class="budget-actions-row">
					<view class="budget-edit-btn" @click.stop="openBudgetModal">
						<text class="edit-icon">✏️</text>
						<text class="edit-text">修改预算</text>
					</view>
				</view>
			</view>
			
			<!-- 展开/收起提示 -->
			<view class="budget-toggle-hint" @click="toggleBudgetDetail">
				<text class="toggle-text">{{ data.showBudgetDetail ? '收起' : '展开详情' }}</text>
				<text class="toggle-arrow" :class="{ 'arrow-up': data.showBudgetDetail }">▼</text>
			</view>
		</view>
		
		<!-- 预算设置弹窗 -->
		<view class="budget-modal" v-if="data.showBudgetModal" @click="closeBudgetModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">设置月预算</text>
					<view class="modal-close" @click="closeBudgetModal">
						<text class="close-icon">×</text>
					</view>
				</view>
				<view class="modal-body">
					<view class="input-section">
						<view class="input-wrapper">
							<text class="currency-symbol">¥</text>
							<input 
								class="budget-input" 
								type="digit" 
								v-model="data.tempBudget" 
								placeholder="请输入预算金额"
								placeholder-style="color: #BFBFBF; font-size: 32rpx;"
								:focus="data.showBudgetModal"
							/>
						</view>
						<text class="input-hint">设置合理的月度预算，帮助控制支出</text>
					</view>
					<view class="quick-amounts">
						<view class="amounts-grid">
							<view 
								class="amount-chip" 
								v-for="amount in data.quickAmounts" 
								:key="amount"
								:class="{ 'active': data.tempBudget == amount }"
								@click="data.tempBudget = amount"
							>
								{{ amount }}
							</view>
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<view class="footer-buttons">
						<view class="modal-btn cancel-btn" @click="closeBudgetModal">取消</view>
						<view class="modal-btn confirm-btn" @click="confirmBudget">确定</view>
					</view>
				</view>
			</view>
		</view>

		<!-- 近期账单 -->
		<view class="bills-card">
			<view class="card-title">近期账单</view>
			
			<!-- 账单列表 -->
			<view class="bills-list" v-if="data.recentBills.length > 0">
				<view class="bill-item" v-for="(bill, index) in data.recentBills" :key="bill._id || index" @click="goToBillDetail(bill)">
					<view class="bill-left">
						<view class="bill-info">
							<text class="bill-icon">{{ bill.categoryIcon }}</text>
							<view class="bill-text-info">
								<text class="bill-merchant">{{ bill.merchant }}</text>
								<view class="bill-category">
									<text class="bill-category-dot"></text>
									<text>{{ bill.categoryName }}</text>
								</view>
							</view>
						</view>
					</view>
					<view class="bill-right">
						<text class="bill-amount" :class="bill.type === 'income' ? 'income' : 'expense'">
							{{ bill.type === 'expense' ? '-' : '' }}<text class="currency-symbol">¥</text>{{ bill.amount.toFixed(2) }}
						</text>
						<text class="bill-date">{{ bill.dateText }}</text>
					</view>
				</view>
			</view>
			
			<!-- 空状态 - 参考账单页面样式 -->
			<view class="empty-state" v-if="data.recentBills.length === 0">
				<image class="empty-image" src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/emptyIcon.png" mode="aspectFit"></image>
				<text class="empty-tip">快去记一笔吧~</text>
			</view>
			
			<view class="view-all" v-if="data.recentBills.length > 0" @click="goToBills">查看全部账单</view>
		</view>
	</view>
	
	<!-- 悬浮记账按钮 -->
	<view 
		class="float-add-btn" 
		:style="{ left: data.floatBtnX + 'px', top: data.floatBtnY + 'px', right: 'auto', bottom: 'auto' }"
		@touchstart="onFloatBtnTouchStart"
		@touchmove="onFloatBtnTouchMove"
		@touchend="onFloatBtnTouchEnd"
	>
		<text class="add-icon">+</text>
	</view>
	
	<!-- 提醒弹框 -->
	<ReminderModal 
		ref="reminderModalRef" 
		@confirm="handleReminderConfirm" 
		@cancel="handleReminderCancel" 
	/>
	
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
		@confirm="handleUpdateConfirm"
		@downloadComplete="handleDownloadComplete"
	/>
	<!-- #endif -->
</view>
</template>

<script setup>
import { reactive, nextTick, ref } from 'vue'
import { onLoad, onShow, onHide, onUnload, onPullDownRefresh } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'
import { checkUpdate } from '@/utils/appUpdate.js'
import UpdateModal from '@/components/UpdateModal.vue'
import { checkLevelUp } from '@/utils/memberLevel.js'
import { checkRecordAchievements, checkContinuousAchievements, rewardSetBudget } from '@/utils/pointsRules.js'
import { addPointsHybrid } from '@/utils/pointsSync.js'
import { getExpenseCategories, getIncomeCategories } from '@/utils/category.js'
import ReminderModal from '@/components/ReminderModal.vue'
import request from '@/utils/request.js'

// 获取状态栏高度
const systemInfo = uni.getWindowInfo()
const statusBarHeight = systemInfo.statusBarHeight || 0

// 提醒弹框引用
const reminderModalRef = ref(null)

const data = reactive({
	currentMonth: '',
	currentMonthText: '',
	totalExpense: 0,
	totalIncome: 0,
	balance: 0,
	changeRate: 0,
	budget: 6000,
	budgetPercent: 0,
	recentBills: [],
	categories: [],
	showBudgetModal: false,
	tempBudget: '',
	quickAmounts: [3000, 5000, 8000, 10000, 15000, 20000],
	allBills: [], // 缓存所有账单数据
	preventClick: false, // 防止事件穿透的标记
	isPickerClosing: false, // 防止选择器关闭时的点击穿透
	showBudgetDetail: false, // 显示预算详情
	hideAmount: false, // 隐藏金额
	hideIncome: false, // 隐藏收入
	hideExpense: false, // 隐藏支出
	hideBalance: false, // 隐藏结余
	floatBtnX: 550, // 悬浮按钮X坐标（初始值，会在onLoad中根据屏幕尺寸调整）
	floatBtnY: 800, // 悬浮按钮Y坐标（初始值，会在onLoad中根据屏幕尺寸调整）
	// 版本更新
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
	},
	// 自定义月份选择器
	showCustomPicker: false,
	years: [],
	months: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
	pickerValue: [0, 0],
	tempYear: 0,
	tempMonth: 0,
	// 应用配置
	appConfig: {
		show_voice_record: false, // APP端语音记账开关
		show_ai_advisor_wechat: true // 小程序端功能总开关（默认开启，等待接口返回）
	}
})

const initData = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = (now.getMonth() + 1).toString().padStart(2, '0')
	data.currentMonth = `${year}-${month}`
	data.currentMonthText = `${year}年${month}月`
	data.categories = uni.getStorageSync('categories') || []
	
	// 初始化年份列表（最近10年）
	const currentYear = now.getFullYear()
	data.years = []
	for (let i = currentYear - 5; i <= currentYear + 5; i++) {
		data.years.push(i)
	}
	
	// 设置当前选中的年月索引
	const yearIndex = data.years.indexOf(year)
	const monthIndex = parseInt(month) - 1
	data.pickerValue = [yearIndex, monthIndex]
	data.tempYear = year
	data.tempMonth = parseInt(month)
	
	// 读取金额隐藏状态
	data.hideAmount = uni.getStorageSync('hideAmount') || false
	data.hideIncome = uni.getStorageSync('hideIncome') || false
	data.hideExpense = uni.getStorageSync('hideExpense') || false
	data.hideBalance = uni.getStorageSync('hideBalance') || false
}

const loadBudget = async () => {
	data.budget = await billStorage.getBudget()
}

const loadData = async () => {
	// 检查登录状态
	if (!checkLogin()) {
		// 未登录时显示空状态
		data.allBills = []
		data.recentBills = []
		data.totalExpense = 0
		data.totalIncome = 0
		data.balance = 0
		data.budgetPercent = 0
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

const recalculateData = () => {
	// 确保 allBills 存在
	if (!data.allBills || !Array.isArray(data.allBills)) {
		data.allBills = []
		data.recentBills = []
		return
	}
	
	const [year, month] = data.currentMonth.split('-')
	const yearNum = parseInt(year)
	const monthNum = parseInt(month)
	
	// 一次遍历完成所有计算
	let totalExpense = 0
	let totalIncome = 0
	const monthBills = []
	
	for (const bill of data.allBills) {
		const billDate = new Date(bill.date)
		if (billDate.getFullYear() === yearNum && billDate.getMonth() + 1 === monthNum) {
			monthBills.push(bill)
			const billType = bill.type || 'expense'
			if (billType === 'expense') {
				totalExpense += bill.amount
			} else if (billType === 'income') {
				totalIncome += bill.amount
			}
		}
	}
	
	// 预算预警检查
	const oldExpense = data.totalExpense
	const oldPercent = data.budgetPercent
	
	data.totalExpense = totalExpense
	data.totalIncome = totalIncome
	data.balance = totalIncome - totalExpense
	data.budgetPercent = Math.min(Math.round((totalExpense / data.budget) * 100), 100)
	
	// 预算预警提示（仅在支出增加时）
	if (oldExpense > 0 && totalExpense > oldExpense) {
		if (oldPercent < 80 && data.budgetPercent >= 80 && data.budgetPercent < 100) {
			uni.showToast({ title: '⚡ 预算已使用80%', icon: 'none', duration: 2000 })
		} else if (oldPercent < 100 && data.budgetPercent >= 100) {
			uni.showModal({
				title: '⚠️ 预算超支提醒',
				content: `本月预算已超支 ¥${(totalExpense - data.budget).toFixed(0)}，建议控制消费哦~`,
				showCancel: false,
				confirmText: '知道了',
				confirmColor: '#F5222D'
			})
		}
	}
	
	calculateChangeRate(data.allBills, yearNum, monthNum)
	
	// 优化：按日期排序并取前3条（使用slice避免完整排序）
	const recentBills = data.allBills
		.sort((a, b) => new Date(b.date) - new Date(a.date))
		.slice(0, 3)
		.map(bill => {
			const billType = bill.type || 'expense'
			const categoryList = billType === 'income' ? getIncomeCategories() : getExpenseCategories()
			const category = categoryList.find(c => c.id === bill.categoryId) || {}
			
			return {
				...bill,
				categoryIcon: category.icon || '📦',
				categoryName: category.name || bill.categoryName || '其他',
				dateText: formatDate(bill.date)
			}
		})
	
	data.recentBills.splice(0, data.recentBills.length, ...recentBills)
}

const handleBillSaved = async () => {
	try {
		// 静默刷新，不显示loading
		const [bills] = await Promise.all([
			billStorage.getFromAPI(),
			loadBudget()
		])
		
		data.allBills = bills
		recalculateData()
		await nextTick()
		
		// 并行执行成就检查（静默）
		// 注意：记账积分已由后端自动处理，前端不需要再调用rewardRecord
		Promise.all([
			checkRecordAchievements(bills.length),
			checkContinuousAchievements(new Set(bills.map(b => new Date(b.date).toDateString())).size)
		]).catch(err => console.error('成就检查失败:', err))
		
	} catch (error) {
		console.error('静默刷新失败:', error)
	} finally {
		uni.hideLoading()
	}
}

// 显示记账提醒订阅引导
const showReminderSubscribeGuide = () => {
	// 检查是否已经订阅过
	const hasSubscribed = uni.getStorageSync('hasSubscribedReminder') || false
	// 检查是否已经拒绝过（今天）
	const lastRefuseDate = uni.getStorageSync('lastRefuseReminderDate') || ''
	const today = new Date().toISOString().split('T')[0]
	
	// 如果已订阅或今天已拒绝过，不再显示
	if (hasSubscribed || lastRefuseDate === today) {
		return
	}
	
	uni.showModal({
		title: '✅ 记账成功',
		content: '开启每日提醒，养成记账好习惯？\n每天晚上8点温馨提示',
		confirmText: '开启提醒',
		cancelText: '暂不需要',
		confirmColor: '#52C41A', // 使用主题色
		success: (res) => {
			if (res.confirm) {
				// 用户点击开启提醒
				subscribeReminder()
			} else {
				// 用户点击暂不需要，记录今天已拒绝
				uni.setStorageSync('lastRefuseReminderDate', today)
			}
		}
	})
}

// 订阅记账提醒
const subscribeReminder = () => {
	// 请求订阅消息
	uni.requestSubscribeMessage({
		tmplIds: ['bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'],
		success: (res) => {
			// 检查是否订阅成功
			if (res['bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'] === 'accept') {
				uni.setStorageSync('hasSubscribedReminder', true)
				uni.showToast({
					title: '订阅成功',
					icon: 'success',
					duration: 2000
				})
				
				// 调用云函数保存用户订阅信息
				saveSubscription()
			} else {
				uni.showToast({
					title: '订阅失败，请稍后重试',
					icon: 'none',
					duration: 2000
				})
			}
		},
		fail: (err) => {
			console.error('订阅失败:', err)
			uni.showToast({
				title: '订阅失败',
				icon: 'none',
				duration: 2000
			})
		}
	})
}

// 保存订阅信息到云端
const saveSubscription = async () => {
	try {
		const res = await request.call('billManager', {
			action: 'saveReminderSubscription',
			data: {
				subscribed: true,
				templateId: 'bNzt1GtONIHLlujvtLtYRO5B2Ot24MKrwFGmo_10Mxw'
			}
		})
		
		if (res.success) {
		} else {
			console.error('订阅信息保存失败:', res.message)
		}
	} catch (error) {
		console.error('保存订阅信息失败:', error)
	}
}

const syncData = async () => {
	try {
		await billStorage.syncToCloud()
		// 同步后重新从API加载数据
		const bills = await billStorage.getFromAPI()
		if (bills && bills.length !== (data.allBills ? data.allBills.length : 0)) {
			data.allBills = bills
			recalculateData()
		}
	} catch (error) {
	}
}

const calculateChangeRate = (bills, currentYear, currentMonth) => {
	let lastYear = currentYear
	let lastMonth = currentMonth - 1
	if (lastMonth === 0) {
		lastMonth = 12
		lastYear = currentYear - 1
	}
	
	const lastMonthBills = bills.filter(bill => {
		const billDate = new Date(bill.date)
		return billDate.getFullYear() === lastYear && 
		       (billDate.getMonth() + 1) === lastMonth
	})
	
	const lastMonthExpense = lastMonthBills.reduce((sum, bill) => sum + bill.amount, 0)
	
	if (lastMonthExpense === 0) {
		data.changeRate = data.totalExpense > 0 ? 100 : 0
	} else {
		data.changeRate = Math.round(((data.totalExpense - lastMonthExpense) / lastMonthExpense) * 100)
	}
}

const formatDate = (dateStr) => {
	const date = new Date(dateStr)
	const now = new Date()
	const diff = Math.floor((now - date) / (1000 * 60 * 60 * 24))
	
	if (diff === 0) return '今天'
	if (diff === 1) return '昨天'
	if (diff === 2) return '前天'
	return `${date.getMonth() + 1}月${date.getDate()}日`
}

// 显示月份选择器
const showMonthPicker = () => {
	data.showCustomPicker = true
	uni.hideTabBar() // 隐藏tabbar
	// 设置当前选中值
	const [year, month] = data.currentMonth.split('-')
	const yearIndex = data.years.indexOf(parseInt(year))
	const monthIndex = parseInt(month) - 1
	data.pickerValue = [yearIndex, monthIndex]
	data.tempYear = parseInt(year)
	data.tempMonth = parseInt(month)
}

// 关闭月份选择器
const closeMonthPicker = () => {
	data.showCustomPicker = false
	uni.showTabBar() // 显示tabbar
}

// picker-view值改变
const onPickerChange = (e) => {
	const val = e.detail.value
	data.pickerValue = val
	data.tempYear = data.years[val[0]]
	data.tempMonth = data.months[val[1]]
}

// 确认选择
const confirmMonthPicker = async () => {
	const year = data.tempYear
	const month = data.tempMonth.toString().padStart(2, '0')
	const selectedMonth = `${year}-${month}`
	
	data.currentMonth = selectedMonth
	data.currentMonthText = `${year}年${month}月`
	
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
		data.recentBills = []
		data.totalExpense = 0
		data.totalIncome = 0
		data.balance = 0
		data.budgetPercent = 0
		return
	}
	
	uni.showLoading({ title: '加载中...' })
	
	try {
		data.allBills = await billStorage.getFromAPI()
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

const onMonthChange = async (e) => {
	const selectedMonth = e.detail.value // 格式: YYYY-MM
	data.currentMonth = selectedMonth
	
	const [year, month] = selectedMonth.split('-')
	data.currentMonthText = `${year}年${month}月`
	
	// 检查登录状态
	if (!checkLogin()) {
		// 未登录时只更新显示，不调用接口
		data.allBills = []
		data.recentBills = []
		data.totalExpense = 0
		data.totalIncome = 0
		data.balance = 0
		data.budgetPercent = 0
		return
	}
	
	// 显示加载提示
	uni.showLoading({ title: '加载中...' })
	
	try {
		// 直接从API获取最新数据
		data.allBills = await billStorage.getFromAPI()
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

const openBudgetModal = () => {
	// 检查登录状态
	if (!checkLogin()) {
		promptLogin()
		return
	}
	
	// 如果正在防止点击穿透期间，不响应点击
	if (data.preventClick) return
	
	data.showBudgetModal = true
	uni.hideTabBar()
}

const closeBudgetModal = () => {
	data.showBudgetModal = false
	data.tempBudget = ''
	// 延迟显示TabBar，防止事件穿透
	setTimeout(() => {
		uni.showTabBar()
	}, 300)
}

const confirmBudget = async () => {
	const amount = parseFloat(data.tempBudget)
	if (!amount || amount <= 0) {
		uni.showToast({
			title: '请输入有效金额',
			icon: 'none'
		})
		return
	}
	
	uni.showLoading({ title: '保存中...' })
	const result = await billStorage.setBudget(amount)
	uni.hideLoading()
	
	if (result.success) {
		data.budget = amount
		data.budgetPercent = Math.min(Math.round((data.totalExpense / data.budget) * 100), 100)
		closeBudgetModal()
		
		// 奖励设置预算积分
		const budgetReward = await rewardSetBudget()
		if (budgetReward) {
			uni.showToast({
				title: `预算设置成功 +${budgetReward.addedPoints}积分`,
				icon: 'success',
				duration: 2000
			})
		} else {
			uni.showToast({
				title: '预算设置成功',
				icon: 'success'
			})
		}
	} else {
		uni.showToast({
			title: '设置失败',
			icon: 'none'
		})
	}
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
		content: '登录后可以记账并同步数据到云端',
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

const goToPhoto = () => {
	// 防止点击穿透
	if (data.isPickerClosing) {
		return
	}
	
	// 检查登录
	if (!checkLogin()) {
		promptLogin()
		return
	}
	
	// 使用 reLaunch 替代 navigateTo，清理页面栈，提升性能
	uni.navigateTo({
		url: '/pages/record/photo/photo',
		// 添加页面切换动画优化
		animationType: 'pop-in',
		animationDuration: 200
	})
}

const goToVoice = () => {
	// 检查登录
	if (!checkLogin()) {
		promptLogin()
		return
	}
	
	uni.navigateTo({
		url: '/pages/record/voice/voice'
	})
}

const goToStatistics = () => {
	uni.switchTab({
		url: '/pages/tab/statistics/statistics'
	})
}

const goToBills = () => {
	uni.switchTab({
		url: '/pages/tab/bills/bills'
	})
}

const goToBillDetail = (bill) => {
	// 跳转到账单详情页
	uni.navigateTo({
		url: `/pages/bills/detail?billData=${encodeURIComponent(JSON.stringify(bill))}`
	})
}

const goToManualRecord = () => {
	// 检查登录
	if (!checkLogin()) {
		promptLogin()
		return
	}
	
	uni.navigateTo({
		url: '/pages/record/confirm/confirm'
	})
}

// 悬浮按钮拖动相关
let floatBtnStartX = 0
let floatBtnStartY = 0
let floatBtnTouchStartX = 0
let floatBtnTouchStartY = 0
let isDragging = false

const onFloatBtnTouchStart = (e) => {
	floatBtnStartX = data.floatBtnX
	floatBtnStartY = data.floatBtnY
	floatBtnTouchStartX = e.touches[0].clientX
	floatBtnTouchStartY = e.touches[0].clientY
	isDragging = false
}

const onFloatBtnTouchMove = (e) => {
	const moveX = e.touches[0].clientX - floatBtnTouchStartX
	const moveY = e.touches[0].clientY - floatBtnTouchStartY
	
	// 移动超过5px才认为是拖动
	if (Math.abs(moveX) > 5 || Math.abs(moveY) > 5) {
		isDragging = true
	}
	
	if (isDragging) {
		const systemInfo = uni.getSystemInfoSync()
		const btnSize = 60 // 按钮半径（120rpx / 2）
		
		// 计算新位置
		let newX = floatBtnStartX + moveX
		let newY = floatBtnStartY + moveY
		
		// 限制在屏幕范围内
		newX = Math.max(btnSize, Math.min(systemInfo.windowWidth - btnSize, newX))
		newY = Math.max(btnSize, Math.min(systemInfo.windowHeight - btnSize, newY))
		
		data.floatBtnX = newX
		data.floatBtnY = newY
	}
}

const onFloatBtnTouchEnd = () => {
	// 如果没有拖动，则触发点击事件
	if (!isDragging) {
		goToManualRecord()
	}
	isDragging = false
}

// 切换收入显示/隐藏
const toggleIncome = () => {
	data.hideIncome = !data.hideIncome
	uni.setStorageSync('hideIncome', data.hideIncome)
}

// 切换支出显示/隐藏
const toggleExpense = () => {
	data.hideExpense = !data.hideExpense
	uni.setStorageSync('hideExpense', data.hideExpense)
}

// 切换结余显示/隐藏
const toggleBalance = () => {
	data.hideBalance = !data.hideBalance
	uni.setStorageSync('hideBalance', data.hideBalance)
}

// 切换金额显示/隐藏（保留兼容）
const toggleAmountVisibility = () => {
	data.hideAmount = !data.hideAmount
	// 保存到本地存储
	uni.setStorageSync('hideAmount', data.hideAmount)
}

// 处理提醒弹框确认
const handleReminderConfirm = () => {
	// 不记录已提醒，让用户记账后自动停止提醒
}

// 处理提醒弹框取消
const handleReminderCancel = () => {
	// 不记录已提醒，下次打开继续提醒
}

// 检查APP更新
const checkAppUpdate = async () => {
	// #ifdef APP-PLUS
	try {
		const updateInfo = await checkUpdate()
		
		if (updateInfo.hasUpdate) {
			// 检查是否已经下载过这个版本
			const downloadedVersion = uni.getStorageSync('downloadedVersion')
			if (downloadedVersion === updateInfo.newVersion) {
				// 已经下载过，不再弹窗
				return
			}
			
			data.updateInfo = updateInfo
			data.showUpdateModal = true
		}
	} catch (error) {
		console.error('检查更新失败:', error)
	}
	// #endif
}

// 关闭更新弹窗
const closeUpdateModal = () => {
	if (!data.updateInfo.isForce) {
		data.showUpdateModal = false
	}
}

// 确认更新
const handleUpdateConfirm = () => {
}

// 下载完成
const handleDownloadComplete = () => {
	// 记录已下载的版本号，避免重复弹窗
	uni.setStorageSync('downloadedVersion', data.updateInfo.newVersion)
	data.showUpdateModal = false
}



const getBudgetCardClass = () => {
	if (data.budgetPercent >= 100) return 'budget-danger'
	if (data.budgetPercent >= 80) return 'budget-warning'
	return ''
}

const getBudgetPercentClass = () => {
	if (data.budgetPercent >= 100) return 'percent-danger'
	if (data.budgetPercent >= 80) return 'percent-warning'
	return ''
}

const getBudgetProgressClass = () => {
	if (data.budgetPercent >= 100) return 'progress-danger'
	if (data.budgetPercent >= 80) return 'progress-warning'
	return ''
}

const getBudgetWarningText = () => {
	if (data.budgetPercent >= 100) {
		const over = data.totalExpense - data.budget
		return `已超支 ¥${over.toFixed(0)}`
	}
	if (data.budgetPercent >= 80) {
		const remaining = data.budget - data.totalExpense
		return `仅剩 ¥${remaining.toFixed(0)}`
	}
	return ''
}

// 切换预算详情显示
const toggleBudgetDetail = () => {
	data.showBudgetDetail = !data.showBudgetDetail
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

// 加载应用配置
const loadAppConfig = async () => {
	try {
		const res = await request.call('config/public', {}, 'GET')
		if (res.success && res.data) {
			data.appConfig = {
				...data.appConfig,
				...res.data
			}
		}
	} catch (error) {
		console.error('加载配置失败:', error)
	}
}

onLoad((options) => {
	// 先初始化悬浮按钮位置（在其他初始化之前）
	const systemInfo = uni.getSystemInfoSync()
	const rpxToPx = systemInfo.windowWidth / 750
	data.floatBtnX = systemInfo.windowWidth - (180 * rpxToPx)
	data.floatBtnY = systemInfo.windowHeight - (250 * rpxToPx)
	
	initData()
	loadBudget()
	loadData()
	
	// 监听账单保存事件
	uni.$on('billSaved', handleBillSaved)
	
	// 弹框提醒已移除
	// uni.$on('showReminderModal', () => {
	// 	nextTick(() => {
	// 		if (reminderModalRef.value && typeof reminderModalRef.value.showModal === 'function') {
	// 			reminderModalRef.value.showModal()
	// 		}
	// 	})
	// })
	
	// 首次加载后，后台静默同步一次云端数据
	setTimeout(() => {
		syncData()
	}, 1000)
	
	// 检查APP更新（仅APP端）
	// #ifdef APP-PLUS
	checkAppUpdate()
	// #endif
})

onShow(() => {
	// 优先加载配置
	loadAppConfig()
	
	// 页面显示时滚动到顶部
	uni.pageScrollTo({
		scrollTop: 0,
		duration: 0
	})
	
	// 检查是否需要刷新数据
	const needRefresh = uni.getStorageSync('needRefreshHome')
	
	if (needRefresh) {
		// 清除标记
		uni.removeStorageSync('needRefreshHome')
		// 立即显示加载提示
		uni.showLoading({ title: '刷新中...' })
		// 直接从API获取最新数据并刷新
		billStorage.getFromAPI().then(bills => {
			data.allBills = bills || []
			// 重新加载预算
			loadBudget()
			// 重新计算所有数据
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
	try {
		uni.showLoading({ title: '加载中...', mask: true })
		
		const [bills] = await Promise.all([
			billStorage.getFromAPI(),
			loadBudget()
		])
		
		if (bills) {
			data.allBills = bills
			recalculateData()
		}
		
		uni.hideLoading()
		uni.showToast({ title: '刷新成功', icon: 'success', duration: 1500 })
	} catch (error) {
		console.error('下拉刷新失败:', error)
		uni.hideLoading()
		uni.showToast({ title: '刷新失败，请重试', icon: 'none', duration: 2000 })
		
		try {
			await loadData()
		} catch (e) {
			console.error('本地加载失败:', e)
		}
	} finally {
		uni.stopPullDownRefresh()
	}
})

onHide(() => {
	// 页面隐藏时不需要特殊处理
})

onUnload(() => {
	// 移除事件监听
	uni.$off('billSaved', handleBillSaved)
	// uni.$off('showReminderModal') // 已移除
})

</script>

<script>
// 分享功能配置
export default {
	onShareAppMessage(res) {
		return {
			title: '语音拍照记账，3秒搞定！AI智能分类，消费一目了然',
			path: '/pages/tab/index/index?from=share',
			imageUrl: '/static/logo.png'
		}
	},
	onShareTimeline() {
		return {
			title: '语音拍照记账，3秒搞定！AI智能分类，消费一目了然',
			query: 'from=timeline',
			imageUrl: '/static/logo.png'
		}
	}
}
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.page {
		width: 100%;
		min-height: 100vh;
		background: linear-gradient(180deg, #F8F9FA 0%, #F5F7FA 50%, #FAFBFC 100%);
		position: relative;
		overflow: hidden;
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
		
		.navbar-content {
			height: 56px; /* 专业高度 */
			display: flex;
			align-items: center;
			justify-content: space-between;
			padding: 0 $spacing-xl;
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
			
			.title-text {
				font-size: 32rpx; /* 专业字号 */
				font-weight: $font-weight-semibold;
				color: $text-primary; /* 深灰色文字 */
				letter-spacing: 1rpx; /* 增加字间距 */
			}
		}
	}
	
	.container {
		padding: $spacing-sm $spacing-xl;
		padding-bottom: 100rpx;
		box-sizing: border-box;
		background: transparent;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-lg;
		padding-top: $spacing-lg;
		position: relative;
		z-index: 100;
	}

	.month-picker {
		font-size: 30rpx; /* 减小字号，更简洁 */
		font-weight: $font-weight-semibold;
		color: $text-primary;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: $spacing-md $spacing-lg;
		background: transparent; /* 透明背景，更简洁 */
		border-radius: $radius-lg;
		transition: all $transition-fast;
	}
	
	.month-picker:active {
		transform: scale(0.96);
		background: $bg-hover; /* 点击时浅灰背景 */
	}

	.arrow {
		font-size: 20rpx;
		margin-left: $spacing-xs;
		color: $text-tertiary;
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
	
	/* 统计按钮 */
	.stats-btn {
		width: 80rpx;
		height: 80rpx;
		background: transparent;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all $transition-fast;
	}
	
	.stats-btn:active {
		transform: scale(0.88);
		opacity: 0.7;
	}
	
	.stats-icon {
		font-size: 52rpx;
		filter: drop-shadow(0 2rpx 6rpx rgba(0, 0, 0, 0.15));
	}
	
	/* 收支卡片 */
	.income-expense-cards {
		display: flex;
		gap: $spacing-md;
		margin-bottom: $spacing-xl;
	}
	
	.income-card, .expense-card-mini {
		flex: 1;
		border-radius: $radius-2xl;
		padding: $spacing-xl;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
	}
	
	.income-card {
		background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.expense-card-mini {
		background: linear-gradient(135deg, #FFA940 0%, #FFC069 100%);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.card-label {
		font-size: $font-size-sm;
		color: rgba(255, 255, 255, 0.9);
		margin-bottom: $spacing-sm;
		font-weight: $font-weight-medium;
	}
	
	.card-amount {
		font-size: $font-size-3xl;
		font-weight: $font-weight-bold;
		color: $text-white;
		font-family: 'DIN Alternate', monospace;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
	}
	
	/* 收支结余卡片 */
	.balance-card {
		border-radius: $radius-2xl;
		padding: $spacing-xl;
		margin-bottom: $spacing-xl;
		text-align: center;
		position: relative;
		overflow: hidden;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}
	
	.balance-card.positive {
		background: linear-gradient(135deg, #FFF1F0 0%, #FFEBEE 100%);
		border: 2rpx solid rgba(255, 77, 79, 0.2);
	}
	
	.balance-card.negative {
		background: linear-gradient(135deg, #FFF7E6 0%, #FFF1E0 100%);
		border: 2rpx solid rgba(250, 173, 20, 0.2);
	}
	
	.balance-label {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-sm;
		font-weight: $font-weight-medium;
	}
	
	.balance-amount {
		font-size: 64rpx;
		font-weight: $font-weight-bold;
		margin-bottom: $spacing-sm;
		font-family: 'DIN Alternate', monospace;
		letter-spacing: -1rpx;
	}
	
	.balance-card.positive .balance-amount {
		color: #FF4D4F;
		text-shadow: 0 2rpx 8rpx rgba(255, 77, 79, 0.3);
	}
	
	.balance-card.negative .balance-amount {
		color: #FA8C16;
		text-shadow: 0 2rpx 8rpx rgba(250, 140, 22, 0.3);
	}
	
	.balance-tip {
		font-size: $font-size-sm;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
	}

	.action-buttons {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: $spacing-lg;
		margin-bottom: $spacing-xl;
	}

	.action-btn {
		height: 180rpx;
		border-radius: $radius-2xl;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
		transition: all $transition-fast;
		position: relative;
		overflow: hidden;
		border: 2rpx solid rgba(255, 255, 255, 0.5);
	}
	
	.action-btn:active {
		transform: translateY(-4rpx);
		box-shadow: 0 12rpx 32rpx rgba(0, 0, 0, 0.15);
	}

	.photo-btn {
		background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}

	.voice-btn {
		background: linear-gradient(135deg, #FFA940 0%, #FFC069 100%);
		border: 2rpx solid rgba(255, 255, 255, 0.3);
	}

	.btn-icon {
		font-size: 72rpx;
		margin-bottom: $spacing-sm;
		filter: drop-shadow(0 4rpx 12rpx rgba(0, 0, 0, 0.15));
		position: relative;
		z-index: 1;
	}

	.btn-text {
		font-size: $font-size-lg;
		color: $text-white;
		font-weight: $font-weight-bold;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		position: relative;
		z-index: 1;
		letter-spacing: 0.5rpx;
	}
	
	/* 紧凑版记账按钮 - 美团风格优化 */
	.action-buttons-compact {
		display: flex;
		gap: $spacing-md;
		margin-bottom: $spacing-xl;
	}
	
	.action-btn-compact {
		flex: 1;
		height: 120rpx; /* 美团风格：更紧凑的高度 */
		border-radius: $radius-lg; /* 美团风格：更小的圆角 */
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		transition: all $transition-fast;
		position: relative;
		overflow: hidden;
	}
	
	/* 紧凑版记账按钮 - 精致高端版 */
	.action-buttons-compact {
		display: flex;
		gap: $spacing-sm;
		margin-bottom: $spacing-2xl;
	}
	
	.action-btn-compact {
		flex: 1;
		height: 98rpx;
		border-radius: 14rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		transition: all $transition-fast;
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04), 0 1rpx 4rpx rgba(0, 0, 0, 0.02);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
		position: relative;
		overflow: hidden;
	}
	
	/* 拍照按钮 - 浅绿色纯色 */
	.photo-btn-compact {
		background: #E8F5E9;
		border: 1rpx solid rgba(82, 196, 26, 0.2);
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.08), 0 2rpx 8rpx rgba(82, 196, 26, 0.05);
	}
	
	.photo-btn-compact .btn-text-compact {
		color: #52C41A;
		font-weight: 600;
	}
	
	/* 语音按钮 - 白色 */
	.voice-btn-compact {
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		border: 1rpx solid rgba(0, 0, 0, 0.04);
	}
	
	.voice-btn-compact .btn-text-compact {
		color: $text-primary;
	}
	
	/* 按钮光效 */
	.action-btn-compact::before {
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
	
	.action-btn-compact:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
	}
	
	.action-btn-compact:active::before {
		opacity: 1;
	}
	
	.btn-icon-compact {
		font-size: 42rpx;
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.08));
	}
	
	.btn-text-compact {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: 500;
		letter-spacing: 0.5rpx;
	}
	
	/* 收支结余合并卡片 - 精致高端版 */
	.finance-summary-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%); /* 更柔和的渐变 */
		border-radius: 16rpx; /* 更大的圆角 */
		padding: 32rpx 28rpx;
		margin-bottom: $spacing-2xl;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.04), 0 1rpx 4rpx rgba(0, 0, 0, 0.02); /* 双层阴影 */
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		position: relative;
		overflow: hidden;
	}
	
	/* 卡片装饰光效 */
	.finance-summary-card::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -30%;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(7, 193, 96, 0.08) 0%, transparent 70%);
		border-radius: 50%;
		pointer-events: none;
	}
	
	.finance-data {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid rgba(0, 0, 0, 0.04);
		position: relative;
		z-index: 1;
	}
	
	.finance-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 10rpx;
		align-items: center;
	}
	
	.income-item {
		padding-right: $spacing-md;
	}
	
	.expense-item {
		padding-left: $spacing-md;
	}
	
	.finance-divider {
		width: 1rpx;
		height: 56rpx;
		background: linear-gradient(to bottom, transparent, rgba(0, 0, 0, 0.06), transparent); /* 渐变分隔线 */
		flex-shrink: 0;
	}
	
	.finance-label {
		font-size: 22rpx;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
		letter-spacing: 0.5rpx;
	}
	
	.finance-label-row {
		display: flex;
		align-items: center;
		gap: 6rpx;
	}
	
	.finance-amount {
		font-size: 40rpx; /* 从38rpx调整到40rpx */
		font-weight: 700; /* 加粗字体 */
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
		line-height: 1.2;
		letter-spacing: -0.5rpx; /* 紧凑的字间距 */
	}
	
	.eye-icon-img {
		width: 26rpx;
		height: 26rpx;
		display: block;
		cursor: pointer;
		transition: all $transition-fast;
		opacity: 0.35;
		filter: grayscale(0.3);
	}
	
	.eye-icon-img:active {
		opacity: 0.6;
		transform: scale(1.1);
	}
	
	.income-color {
		color: $success-color;
	}
	
	.expense-color {
		color: $error-color;
	}
	
	/* 货币符号样式 - 比数字小一些 */
	.currency-symbol {
		font-size: 0.8em; /* 相对于父元素字体大小的80% */
		opacity: 0.9;
		color: inherit; /* 继承父元素的颜色 */
	}
	
	.balance-section {
		text-align: center;
		padding: 20rpx 0 8rpx;
		position: relative;
		z-index: 1;
	}
	
	.balance-label-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6rpx;
		margin-bottom: 10rpx;
	}
	
	.balance-label {
		font-size: 22rpx;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
		letter-spacing: 0.5rpx;
		line-height: 1;
	}
	
	.balance-section .balance-amount {
		font-size: 40rpx; /* 从44rpx调整为40rpx，与收入支出字体大小保持一致 */
		font-weight: 700; /* 加粗字体 */
		font-family: 'DIN Alternate', 'Helvetica Neue', monospace;
		line-height: 1.2;
		margin-top: 4rpx;
		margin-bottom: 10rpx;
		letter-spacing: -0.5rpx;
	}
	
	.eye-icon-img-large:active {
		transform: scale(0.9);
		opacity: 0.8;
	}
	
	.balance-section.positive .balance-amount {
		color: $success-color;
	}
	
	.balance-section.negative .balance-amount {
		color: $error-color;
	}
	
	.balance-section .balance-tip {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}

	.budget-card {
		background: $bg-white;
		border-radius: $radius-2xl;
		padding: $spacing-2xl;
		margin-bottom: $spacing-xl;
		box-shadow: 0 4rpx 20rpx rgba(0, 0, 0, 0.06);
		transition: all $transition-fast;
		border: 2rpx solid rgba(82, 196, 26, 0.08);
		position: relative;
		overflow: hidden;
	}
	
	.budget-card:active {
		transform: translateY(-2rpx);
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
	}
	
	.budget-card.budget-warning {
		background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
		border-color: rgba(250, 173, 20, 0.3);
		box-shadow: 0 4rpx 16rpx rgba(250, 173, 20, 0.15);
	}
	
	.budget-card.budget-danger {
		background: linear-gradient(135deg, #FFF1F0 0%, #FFFFFF 100%);
		border-color: rgba(245, 34, 45, 0.3);
		box-shadow: 0 4rpx 16rpx rgba(245, 34, 45, 0.15);
		animation: shake 0.5s ease;
	}
	
	@keyframes shake {
		0%, 100% { transform: translateX(0); }
		25% { transform: translateX(-4rpx); }
		75% { transform: translateX(4rpx); }
	}

	.budget-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $spacing-lg;
	}
	
	.budget-title-wrapper {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: $spacing-xs;
	}

	.budget-title {
		font-size: $font-size-lg;
		color: $text-primary;
		font-weight: $font-weight-semibold;
	}
	
	.budget-warning {
		display: flex;
		align-items: center;
		gap: $spacing-xs;
		padding: $spacing-xs $spacing-md;
		background: rgba(250, 173, 20, 0.1);
		border-radius: $radius-lg;
		animation: pulse-warning 2s ease-in-out infinite;
	}
	
	.budget-card.budget-danger .budget-warning {
		background: rgba(245, 34, 45, 0.1);
	}
	
	@keyframes pulse-warning {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.7; }
	}
	
	.warning-icon {
		font-size: $font-size-base;
		animation: bounce-warning 1s ease-in-out infinite;
	}
	
	@keyframes bounce-warning {
		0%, 100% { transform: translateY(0); }
		50% { transform: translateY(-4rpx); }
	}
	
	.warning-text {
		font-size: $font-size-sm;
		color: #FA8C16;
		font-weight: $font-weight-semibold;
	}
	
	.budget-card.budget-danger .warning-text {
		color: #F5222D;
	}

	.budget-percent {
		font-size: 48rpx;
		color: $primary-color;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
		flex-shrink: 0;
	}
	
	.budget-percent.percent-warning {
		color: #FA8C16;
	}
	
	.budget-percent.percent-danger {
		color: #F5222D;
	}

	.budget-bar {
		height: 20rpx;
		background: $bg-light;
		border-radius: $radius-lg;
		overflow: hidden;
		margin-bottom: $spacing-lg;
	}

	.budget-progress {
		height: 100%;
		background: $gradient-primary;
		border-radius: $radius-lg;
		transition: width $transition-base ease, background $transition-base ease;
		box-shadow: 0 0 12rpx rgba(82, 196, 26, 0.4);
	}
	
	.budget-progress.progress-warning {
		background: linear-gradient(90deg, #FAAD14 0%, #FA8C16 100%);
		box-shadow: 0 0 12rpx rgba(250, 173, 20, 0.4);
	}
	
	.budget-progress.progress-danger {
		background: linear-gradient(90deg, #FF4D4F 0%, #F5222D 100%);
		box-shadow: 0 0 12rpx rgba(245, 34, 45, 0.4);
		animation: progress-pulse 1.5s ease-in-out infinite;
	}
	
	@keyframes progress-pulse {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.8; }
	}
	
	.budget-footer {
		display: flex;
		justify-content: space-between;
		margin-bottom: $spacing-md;
		padding: $spacing-md 0;
		border-top: 1rpx solid $border-light;
	}
	
	.budget-info {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-xs;
	}
	
	.budget-label {
		font-size: $font-size-sm;
		color: $text-tertiary;
	}
	
	.budget-amount {
		font-size: $font-size-xl;
		color: $text-primary;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-used {
		font-size: $font-size-xl;
		color: $primary-color;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-used.over-budget {
		color: #F5222D;
	}
	
	.budget-remaining {
		font-size: $font-size-xl;
		color: $success-color; /* 使用主题色 */
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-remaining.negative {
		color: #F5222D;
	}

	.budget-edit {
		font-size: $font-size-sm;
		color: $primary-color;
		text-align: center;
		display: block;
		font-weight: $font-weight-medium;
	}
	
	/* 预算卡片 - 简化版（可折叠） */
	.budget-card-compact {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		border-radius: $radius-lg;
		padding: 32rpx 28rpx;
		margin-bottom: $spacing-xl;
		box-shadow: $shadow-card;
		transition: all $transition-fast;
		border: 1rpx solid $border-light;
	}
	
	.budget-card-compact.budget-warning {
		background: linear-gradient(135deg, #FFF9E6 0%, #F8F9FA 100%);
		border-color: rgba(250, 173, 20, 0.2);
		box-shadow: $shadow-card;
	}
	
	.budget-card-compact.budget-danger {
		background: linear-gradient(135deg, #FFF1F0 0%, #F8F9FA 100%);
		border-color: rgba(245, 34, 45, 0.2);
		box-shadow: $shadow-card;
	}
	
	.budget-header-compact {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $spacing-lg;
		cursor: pointer;
	}
	
	.budget-header-compact:active {
		opacity: 0.8;
	}
	
	.budget-title-wrapper {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
	}
	
	.budget-title-compact {
		font-size: $font-size-lg;
		color: $text-primary;
		font-weight: $font-weight-semibold;
	}
	
	.budget-warning-compact {
		display: flex;
		align-items: center;
		gap: 4rpx;
		padding: 4rpx 12rpx;
		background: rgba(250, 173, 20, 0.1);
		border-radius: $radius-md;
		margin-top: 4rpx;
	}
	
	.budget-card-compact.budget-danger .budget-warning-compact {
		background: rgba(245, 34, 45, 0.1);
	}
	
	.warning-icon-compact {
		font-size: $font-size-sm;
	}
	
	.warning-text-compact {
		font-size: $font-size-xs;
		color: $warning-color;
		font-weight: $font-weight-medium;
	}
	
	.budget-card-compact.budget-danger .warning-text-compact {
		color: $error-color;
	}
	
	.budget-percent-compact {
		font-size: 44rpx;
		color: $primary-color;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-percent-compact.percent-warning {
		color: $warning-color;
	}
	
	.budget-percent-compact.percent-danger {
		color: $error-color;
	}
	
	.budget-bar-compact {
		height: 16rpx;
		background: $bg-light;
		border-radius: $radius-sm;
		overflow: hidden;
		margin-bottom: $spacing-md;
		cursor: pointer;
	}
	
	.budget-bar-compact:active {
		opacity: 0.8;
	}
	
	.budget-progress-compact {
		height: 100%;
		background: $gradient-primary;
		border-radius: $radius-sm;
		transition: width $transition-base ease;
		box-shadow: none;
	}
	
	.budget-progress-compact.progress-warning {
		background: linear-gradient(90deg, #FAAD14 0%, #FA8C16 100%);
		box-shadow: none;
	}
	
	.budget-progress-compact.progress-danger {
		background: linear-gradient(90deg, #FF4D4F 0%, #F5222D 100%);
		box-shadow: none;
	}
	
	.budget-detail {
		animation: slideDown 0.3s ease;
		overflow: hidden;
	}
	
	@keyframes slideDown {
		from {
			max-height: 0;
			opacity: 0;
		}
		to {
			max-height: 300rpx;
			opacity: 1;
		}
	}
	
	.budget-footer-compact {
		display: flex;
		justify-content: space-between;
		padding: $spacing-md 0;
		border-top: 1rpx solid $border-light;
		margin-bottom: $spacing-md;
	}
	
	.budget-info-compact {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4rpx;
	}
	
	.budget-label-compact {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}
	
	.budget-amount-compact {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-used-compact {
		font-size: $font-size-base;
		color: $primary-color;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-used-compact.over-budget {
		color: $error-color;
	}
	
	.budget-remaining-compact {
		font-size: $font-size-base;
		color: $success-color;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.budget-remaining-compact.negative {
		color: #F5222D;
	}
	
	.budget-actions-row {
		display: flex;
		justify-content: center;
		padding-bottom: $spacing-sm;
	}
	
	.budget-edit-btn {
		display: flex;
		align-items: center;
		gap: 8rpx;
		padding: 12rpx 24rpx;
		background: transparent;
		border-radius: 24rpx;
		transition: all $transition-fast;
	}
	
	.budget-edit-btn:active {
		opacity: 0.6;
	}
	
	.edit-icon {
		font-size: 24rpx;
	}
	
	.edit-text {
		font-size: $font-size-sm;
		color: $primary-color;
		font-weight: $font-weight-medium;
	}
	
	.budget-toggle-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding-top: $spacing-xs;
		border-top: 1rpx solid $border-light;
		cursor: pointer;
	}
	
	.budget-toggle-hint:active {
		opacity: 0.7;
	}
	
	.toggle-text {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}
	
	.toggle-arrow {
		font-size: $font-size-xs;
		color: $text-tertiary;
		transition: transform $transition-fast;
	}
	
	.toggle-arrow.arrow-up {
		transform: rotate(180deg);
	}
	
	/* 预算设置弹窗 - 极简现代风格 */
	.budget-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.4);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10000;
		animation: fadeIn 0.2s ease-out;
		backdrop-filter: blur(10rpx);
	}
	
	.modal-content {
		width: 640rpx; /* 从580rpx增加到640rpx，增大弹框宽度 */
		background: #ffffff;
		border-radius: 24rpx;
		box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.1);
		animation: slideUp 0.25s ease-out;
		overflow: hidden;
	}
	
	@keyframes slideUp {
		from {
			transform: translateY(40rpx);
			opacity: 0;
		}
		to {
			transform: translateY(0);
			opacity: 1;
		}
	}
	
	.modal-header {
		text-align: center;
		padding: 48rpx 40rpx 32rpx;
		border-bottom: none;
		position: relative;
	}
	
	/* 顶部图标 */
	.modal-header::before {
		content: '💰';
		font-size: 64rpx;
		display: block;
		margin-bottom: 16rpx;
	}
	
	.modal-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #1a1a1a;
		margin: 0;
	}
	
	.modal-close {
		position: absolute;
		top: 24rpx;
		right: 24rpx;
		width: 48rpx;
		height: 48rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 24rpx;
		background: #f5f5f5;
		transition: all 0.2s;
	}
	
	.close-icon {
		font-size: 28rpx;
		color: #999;
		line-height: 1;
	}
	
	.modal-close:active {
		background: #e8e8e8;
		transform: scale(0.9);
	}
	
	.modal-body {
		padding: 0 40rpx 40rpx;
	}
	
	.input-section {
		margin-bottom: 40rpx;
		text-align: center;
	}
	
	.input-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		background: #f8f9fa;
		border: 2rpx solid transparent;
		border-radius: 16rpx;
		padding: 20rpx 24rpx;
		transition: all 0.2s;
		margin-bottom: 16rpx;
	}
	
	.input-wrapper:focus-within {
		border-color: #52c41a;
		background: #ffffff;
		box-shadow: 0 0 0 4rpx rgba(82, 196, 26, 0.1);
	}
	
	.budget-input {
		flex: 1;
		font-size: 32rpx;
		color: #1a1a1a;
		font-weight: 500;
		text-align: center;
		height: 44rpx;
		line-height: 44rpx;
	}
	
	/* 预算弹框中的货币符号 */
	.modal-content .currency-symbol {
		font-size: 32rpx;
		color: #52c41a;
		font-weight: 600;
		margin-right: 8rpx;
	}
	
	.input-hint {
		font-size: 24rpx;
		color: #999;
		line-height: 1.4;
	}
	
	.quick-amounts {
		margin-bottom: 20rpx;
	}
	
	.quick-title {
		font-size: 26rpx;
		color: #666;
		font-weight: 500;
		margin-bottom: 20rpx;
		display: block;
		text-align: center;
	}
	
	.amounts-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 12rpx;
	}
	
	.amount-chip {
		height: 72rpx;
		background: #f8f9fa;
		border: 1rpx solid #e8e8e8;
		border-radius: 12rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		color: #666;
		font-weight: 500;
		transition: all 0.15s;
	}
	
	.amount-chip:active {
		transform: scale(0.95);
	}
	
	.amount-chip.active {
		background: #E8F5E9 !important;
		border-color: #52c41a !important;
		color: #52c41a !important;
		font-weight: 600;
	}
	
	.modal-footer {
		padding: 0 40rpx 40rpx;
	}
	
	.footer-buttons {
		display: flex;
		gap: 12rpx;
	}
	
	.modal-btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 28rpx;
		border-radius: 16rpx;
		font-weight: 500;
		transition: all 0.2s;
		border: none;
	}
	
	.cancel-btn {
		background: #f5f5f5;
		color: #666;
	}
	
	.cancel-btn:active {
		background: #e8e8e8;
		transform: scale(0.98);
	}
	
	.confirm-btn {
		background: linear-gradient(135deg, #F0FFF4 0%, #E8F5E9 100%); /* 使用与账单页面选中按钮相同的浅绿色渐变背景 */
		color: #52C41A; /* 绿色文字 */
		border: 1rpx solid rgba(82, 196, 26, 0.3); /* 浅绿色边框 */
		font-weight: 600;
	}
	
	.confirm-btn:active {
		background: #52C41A; /* 按下时使用绿色背景 */
		color: #ffffff; /* 按下时文字变白色 */
		border-color: #52C41A;
		transform: scale(0.98);
	}

	/* 账单卡片 - 美团风格优化 */
	.bills-card {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
		padding: 20rpx; /* 减小内边距，从24rpx改为20rpx */
		margin-bottom: $spacing-xl;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		border: 1rpx solid $border-light;
	}

	.card-title {
		font-size: $font-size-base; /* 美团风格：标准字号 */
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-sm; /* 减小底部间距，从md改为sm */
		padding-bottom: $spacing-xs; /* 减小底部内边距，从sm改为xs */
		border-bottom: 1rpx solid $border-light;
	}

	.view-all {
		text-align: center;
		font-size: $font-size-sm;
		color: $primary-color;
		font-weight: $font-weight-normal;
		padding: $spacing-md 0;
		margin-top: $spacing-xs;
		transition: all $transition-fast;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4rpx;
	}
	
	.view-all::after {
		content: '→';
		font-size: $font-size-sm;
		transition: transform $transition-fast;
	}
	
	.view-all:active {
		opacity: 0.6;
	}
	
	.view-all:active::after {
		transform: translateX(4rpx);
	}

	.bills-list {
		display: flex;
		flex-direction: column;
		gap: $spacing-md;
	}

	.bill-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 16rpx;
		background: $bg-white;
		border-radius: 12rpx;
		transition: all $transition-fast;
		position: relative;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
		border: 1rpx solid #F0F0F0;
		overflow: hidden;
	}
	
	.bill-item:active {
		background: #FAFAFA;
		transform: scale(0.98);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.06);
	}

	.bill-left {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
	}


	
	.bill-info {
		flex: 1;
		min-width: 0;
		display: flex;
		align-items: flex-start;
		gap: $spacing-lg; /* 从 $spacing-sm 增大到 $spacing-lg，增加emoji和商家名称的距离 */
	}
	
	.bill-icon {
		font-size: 32rpx;
		flex-shrink: 0;
		width: 32rpx;
		text-align: center;
		margin-top: 2rpx; /* 微调垂直对齐 */
	}
	
	.bill-text-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 4rpx; /* 减小间距，从6rpx改为4rpx */
	}

	.bill-merchant {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	
	.bill-category {
		font-size: $font-size-xs;
		color: $text-tertiary;
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.bill-category-dot {
		width: 6rpx;
		height: 6rpx;
		background: #D9D9D9;
		border-radius: $radius-round;
	}

	.bill-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4rpx; /* 减小间距，从6rpx改为4rpx */
		flex-shrink: 0;
		margin-left: $spacing-sm; /* 减小左边距，从md改为sm */
	}

	.bill-amount {
		font-size: $font-size-xl;
		font-weight: $font-weight-semibold;
		font-family: 'DIN Alternate', monospace;
	}
	
	.bill-amount.expense {
		color: #FF4D4F;
	}
	
	.bill-amount.income {
		color: $success-color; /* 使用主题色 */
	}

	.bill-date {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}

	.empty-tip {
		font-size: $font-size-sm;
		color: $text-tertiary;
	}
	
	/* 近期账单空状态 - 美团风格优化 */
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 60rpx 0; /* 从100rpx减少到60rpx，让空状态往上移动 */
		text-align: center;
		background: $bg-white;
		border-radius: $radius-lg;
		margin: $spacing-md 0;
	}
	
	.empty-image {
		width: 200rpx;
		height: 200rpx;
		margin-bottom: $spacing-xl;
	}
	
	.empty-tip {
		font-size: $font-size-sm;
		color: $text-tertiary;
	}
	
	/* 悬浮记账按钮 */
	.float-add-btn {
		position: fixed;
		right: 30rpx;
		bottom: 150rpx;
		width: 120rpx;
		height: 120rpx;
		background: $primary-gradient; /* 使用主题色渐变 */
		border-radius: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.3);
		transition: all $transition-fast;
		overflow: hidden;
		z-index: 999;
	}
	
	.float-add-btn:active {
		transform: scale(0.95);
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.25);
	}
	
	.add-icon {
		font-size: 64rpx;
		color: $text-white;
		font-weight: 200;
		line-height: 1;
		z-index: 1;
	}
</style>

<style lang="scss">
/* 样式穿透修改picker确定按钮颜色 */
@import "@/styles/variables.scss";

/* 日期选择器确定按钮颜色 - 小程序 */
::v-deep .uni-picker-action-confirm {
	color: $primary-color !important;
}

::v-deep .uni-picker__action-btn-confirm {
	color: $primary-color !important;
}

/* 日期选择器确定按钮颜色 - APP端 */
/* #ifdef APP-PLUS */
::v-deep .uni-picker-action-confirm {
	color: $primary-color !important; /* 使用主题色 */
}

::v-deep .uni-picker__action-btn-confirm {
	color: $primary-color !important; /* 使用主题色 */
}

::v-deep .uni-picker-action .uni-picker-action-confirm {
	color: $primary-color !important; /* 使用主题色 */
}

::v-deep .uni-picker__action .uni-picker__action-btn-confirm {
	color: $primary-color !important; /* 使用主题色 */
}
/* #endif */
</style>
