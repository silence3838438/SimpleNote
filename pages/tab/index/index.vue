<template>
	<view class="page">
		<!-- 自定义导航栏（活动期间显示） -->
		<view class="custom-navbar" v-if="data.isFestivalActive" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left">
					<view class="lantern">🏮</view>
				</view>
				<view class="navbar-title">
					<text class="title-text">💰 钱哪去了</text>
				</view>
				<view class="navbar-right">
					<view class="lantern">🏮</view>
				</view>
			</view>
		</view>
		
		<!-- 系统样式导航栏（非活动期间显示） -->
		<view class="system-navbar" v-if="!data.isFestivalActive" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<text class="navbar-title-text">钱哪去了</text>
			</view>
		</view>
		
		<!-- 春节横幅背景（活动期间显示） -->
		<view class="festival-bg" v-if="data.isFestivalActive" :style="{ paddingTop: (statusBarHeight + 44) + 'px' }">
			<text class="festival-text">🎊 新春快乐 · 马年大吉 🎊</text>
			<!-- 红包入口提示 -->
			<view class="red-packet-entry" @click="showRedPacketGuide" :class="{ 'active': data.isRedPacketTime }">
				<view class="entry-content">
					<view class="entry-icon">🧧</view>
					<view class="entry-text">
						<text class="entry-title">{{ data.isRedPacketTime ? '红包雨进行中' : '春节红包' }}</text>
						<text class="entry-subtitle">{{ data.remainingTime }}</text>
					</view>
					<view class="entry-badge" v-if="data.isRedPacketTime">
						<text class="badge-text">抢</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 下拉抢红包提示 -->
		<view class="pull-hint" :class="{ 'show': data.pullDistance > 50 }">
			<text class="hint-icon">🧧</text>
			<text class="hint-text">{{ getPullHintText() }}</text>
		</view>
		
		<!-- 抢红包动画（已废弃，使用新的开红包动画） -->
		
		<!-- 红包雨（可点击抢红包） -->
		<view class="red-packet-rain" v-if="data.showRedPackets">
			<view 
				class="red-packet" 
				:class="{ 'red-packet-big': packet.isBig }"
				v-for="(packet, index) in data.redPackets" 
				:key="index"
				:style="{ left: packet.left + '%', animationDelay: packet.delay + 's', animationDuration: packet.duration + 's' }"
				@click="clickRedPacket(index)"
			>
				🧧
			</view>
		</view>
		
		<!-- 开红包炸裂动画 -->
		<view class="open-packet-animation" v-if="data.showOpenAnimation">
			<view class="packet-bg"></view>
			<view class="packet-content">
				<!-- 红包炸开效果 -->
				<view class="packet-explode">
					<view class="packet-half packet-left"></view>
					<view class="packet-half packet-right"></view>
				</view>
				<!-- 金币飞出效果 -->
				<view class="coins-fly">
					<text class="coin" v-for="i in 12" :key="i">💰</text>
				</view>
				<!-- 结果显示 -->
				<view class="result-show">
					<text class="result-text">{{ data.grabResult }}</text>
				</view>
			</view>
		</view>
		
		<!-- 新手引导弹窗 -->
		<view class="guide-modal" v-if="data.showGuide" @click="closeGuide">
			<view class="guide-content" @click.stop>
				<view class="guide-header">
					<text class="guide-title">🧧 春节红包来啦！</text>
					<text class="guide-close" @click="closeGuide">✕</text>
				</view>
				<view class="guide-body">
					<view class="guide-packet">🧧</view>
					<view class="guide-arrow">👆</view>
					<text class="guide-tip">点击飘落的红包即可抢</text>
					<view class="guide-rules">
						<text class="rule-item">• 每30分钟一场，每场2分钟</text>
						<text class="rule-item">• 随机获得积分或祝福语</text>
						<text class="rule-item">• 积分可在个人页面查看</text>
					</view>
				</view>
				<view class="guide-footer">
					<view class="guide-btn" @click="closeGuide">我知道了</view>
				</view>
			</view>
		</view>
		
		<!-- 红包雨结算弹窗 -->
		<view class="result-modal" v-if="data.showResultModal" @click="closeResultModal">
			<view class="result-content" @click.stop>
				<view class="result-header">
					<text class="result-title">🎉 红包雨结束</text>
				</view>
				<view class="result-body">
					<!-- 积分统计 -->
					<view class="result-points" v-if="data.currentSessionPoints > 0">
						<text class="points-label">本场获得</text>
						<text class="points-value">{{ data.currentSessionPoints }}</text>
						<text class="points-unit">积分</text>
					</view>
					
					<!-- 祝福语统计 -->
					<view class="result-blessings" v-if="data.currentSessionBlessings.length > 0">
						<text class="blessings-label">收到祝福</text>
						<view class="blessings-list">
							<text class="blessing-item" v-for="(blessing, index) in data.currentSessionBlessings" :key="index">
								{{ blessing }}
							</text>
						</view>
					</view>
					
					<!-- 空状态提示 -->
					<view class="result-empty" v-if="data.currentSessionPoints === 0 && data.currentSessionBlessings.length === 0">
						<text class="empty-text">下次再来试试吧~</text>
					</view>
					
					<view class="result-tip">
						<text class="tip-text">{{ data.remainingTime }}</text>
					</view>
				</view>
				<view class="result-footer">
					<view class="result-btn" @click="closeResultModal">知道了</view>
				</view>
			</view>
		</view>
		
		<!-- 烟花特效 -->
		<canvas 
			class="fireworks-canvas" 
			canvas-id="fireworksCanvas" 
			v-if="data.showFireworks"
		></canvas>
		
		<view class="container" :style="{ paddingTop: data.isFestivalActive ? (statusBarHeight + 44 + 140) + 'px' : (statusBarHeight + 44) + 'px' }">
			<!-- 顶部月份选择器 -->
			<view class="header">
				<picker mode="date" fields="month" :value="data.currentMonth" @change="onMonthChange">
					<view class="month-picker">
						{{ data.currentMonthText }} <text class="arrow">▼</text>
					</view>
				</picker>
			</view>
			
			<!-- 收支结余卡片（美团风格优化） -->
		<view class="finance-summary-card">
			<!-- 收支数据 -->
			<view class="finance-data">
				<view class="finance-item income-item">
					<view class="finance-label-row">
						<view class="finance-label">本月收入</view>
						<image class="eye-icon-img" :src="data.hideIncome ? '/static/miwen.png' : '/static/mingwen.png'" @click="toggleIncome" mode="aspectFit"></image>
					</view>
					<view class="finance-amount income-color" v-if="!data.hideIncome">¥{{ formatAmount(data.totalIncome) }}</view>
					<view class="finance-amount income-color" v-else>****</view>
				</view>
				<view class="finance-divider"></view>
				<view class="finance-item expense-item">
					<view class="finance-label-row">
						<view class="finance-label">本月支出</view>
						<image class="eye-icon-img" :src="data.hideExpense ? '/static/miwen.png' : '/static/mingwen.png'" @click="toggleExpense" mode="aspectFit"></image>
					</view>
					<view class="finance-amount expense-color" v-if="!data.hideExpense">-¥{{ formatAmount(data.totalExpense) }}</view>
					<view class="finance-amount expense-color" v-else>****</view>
				</view>
			</view>
			
			<!-- 结余信息 -->
			<view class="balance-section" :class="{ 'positive': data.balance >= 0, 'negative': data.balance < 0 }">
				<view class="balance-label-row">
					<text class="balance-label">本月结余</text>
					<image class="eye-icon-img balance-eye-icon" :src="data.hideBalance ? '/static/miwen.png' : '/static/mingwen.png'" @click="toggleBalance" mode="aspectFit"></image>
				</view>
				<view class="balance-amount" v-if="!data.hideBalance">{{ data.balance >= 0 ? '+' : '-' }}¥{{ formatAmount(Math.abs(data.balance)) }}</view>
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
			<view class="action-btn-compact voice-btn-compact" @click="goToVoice">
				<text class="btn-icon-compact">🎤</text>
				<text class="btn-text-compact">语音记账</text>
			</view>
		</view>

		<!-- 预算进度（简化版） -->
		<view class="budget-card-compact" :class="getBudgetCardClass()" @click="toggleBudgetDetail">
			<view class="budget-header-compact">
				<view class="budget-title-wrapper">
					<text class="budget-title-compact">预算使用率</text>
					<view class="budget-warning-compact" v-if="data.budgetPercent >= 80">
						<text class="warning-icon-compact">{{ data.budgetPercent >= 100 ? '⚠️' : '⚡' }}</text>
						<text class="warning-text-compact">{{ getBudgetWarningText() }}</text>
					</view>
				</view>
				<text class="budget-percent-compact" :class="getBudgetPercentClass()">{{ data.budgetPercent }}%</text>
			</view>
			<view class="budget-bar-compact">
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
				<text class="budget-edit-compact" @click.stop="openBudgetModal">点击修改预算</text>
			</view>
			
			<!-- 展开/收起提示 -->
			<view class="budget-toggle-hint">
				<text class="toggle-text">{{ data.showBudgetDetail ? '收起' : '展开详情' }}</text>
				<text class="toggle-arrow" :class="{ 'arrow-up': data.showBudgetDetail }">▼</text>
			</view>
		</view>
		
		<!-- 预算设置弹窗 -->
		<view class="budget-modal" v-if="data.showBudgetModal" @click="closeBudgetModal">
			<view class="modal-content" @click.stop>
				<view class="modal-header">
					<text class="modal-title">设置月预算</text>
					<text class="modal-close" @click="closeBudgetModal">✕</text>
				</view>
				<view class="modal-body">
					<view class="input-group">
						<text class="input-label">预算金额</text>
						<view class="input-wrapper">
							<text class="input-prefix">¥</text>
							<input 
								class="budget-input" 
								type="digit" 
								v-model="data.tempBudget" 
								placeholder="请输入预算金额"
								:focus="data.showBudgetModal"
							/>
						</view>
					</view>
					<view class="quick-amounts">
						<view 
							class="amount-btn" 
							v-for="amount in data.quickAmounts" 
							:key="amount"
							@click="data.tempBudget = amount"
						>
							{{ amount }}
						</view>
					</view>
				</view>
				<view class="modal-footer">
					<view class="modal-btn cancel-btn" @click="closeBudgetModal">取消</view>
					<view class="modal-btn confirm-btn" @click="confirmBudget">确定</view>
				</view>
			</view>
		</view>

		<!-- 近期账单 -->
		<view class="bills-card">
			<view class="card-title">近期账单</view>
			<view class="bills-list">
				<view class="bill-item" v-for="(bill, index) in data.recentBills" :key="bill._id || index" @click="goToBillDetail(bill)">
					<view class="bill-left">
						<text class="bill-icon">{{ bill.categoryIcon }}</text>
						<view class="bill-info">
							<text class="bill-merchant">{{ bill.merchant }}</text>
							<view class="bill-category">
								<text class="bill-category-dot"></text>
								<text>{{ bill.categoryName }}</text>
							</view>
						</view>
					</view>
					<view class="bill-right">
						<text class="bill-amount" :class="bill.type === 'income' ? 'income' : 'expense'">
							{{ bill.type === 'expense' ? '-' : '+' }}¥{{ bill.amount.toFixed(2) }}
						</text>
						<text class="bill-date">{{ bill.dateText }}</text>
					</view>
				</view>
			</view>
			<view class="empty-tip" v-if="data.recentBills.length === 0">
				暂无账单记录，快去记账吧~
			</view>
			<view class="view-all" v-if="data.recentBills.length > 0" @click="goToBills">查看全部账单</view>
		</view>
	</view>
	
	<!-- 悬浮记账按钮 -->
	<movable-area class="float-btn-area">
		<movable-view 
			class="float-add-btn" 
			direction="all" 
			:x="data.floatBtnX" 
			:y="data.floatBtnY"
			@click="goToManualRecord"
			:animation="false"
			damping="20"
			friction="2"
		>
			<text class="add-icon">+</text>
		</movable-view>
	</movable-area>
	
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
import { rewardRecord, checkRecordAchievements, checkContinuousAchievements, rewardSetBudget } from '@/utils/pointsRules.js'
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
	showBudgetDetail: false, // 显示预算详情
	hideAmount: false, // 隐藏金额
	hideIncome: false, // 隐藏收入
	hideExpense: false, // 隐藏支出
	hideBalance: false, // 隐藏结余
	isFestivalActive: true, // 春节活动是否进行中
	// 春节元素
	showRedPackets: false, // 显示红包雨（只在红包雨时段显示）
	showFireworks: false, // 显示烟花
	redPackets: [], // 红包数组
	// 红包雨系统
	isRedPacketTime: false, // 是否是红包雨时间
	redPacketEndTime: 0, // 红包雨结束时间
	nextRedPacketTime: 0, // 下次红包雨时间
	currentSessionPoints: 0, // 本场红包雨获得的积分
	currentSessionBlessings: [], // 本场红包雨获得的祝福语
	redPacketTimer: null, // 倒计时定时器
	remainingTime: '', // 剩余时间文字
	showResultModal: false, // 显示结算弹窗
	bgMusicContext: null, // 背景音乐上下文
	isPageVisible: true, // 页面是否可见
	// 下拉抢红包（废弃）
	startY: 0,
	pullDistance: 0,
	isGrabbingRedPacket: false,
	grabResult: '',
	lastGrabTime: 0,
	grabAttemptCount: 0,
	isGrabbingMode: false,
	showOpenAnimation: false, // 显示开红包动画
	canGrabToday: true,
	morningGrabCount: 0,
	afternoonGrabCount: 0,
	showGuide: false, // 显示新手引导
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
		isForce: false
	}
})

const initData = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = (now.getMonth() + 1).toString().padStart(2, '0')
	data.currentMonth = `${year}-${month}`
	data.currentMonthText = `${year}年${month}月`
	data.categories = uni.getStorageSync('categories') || []
	
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
	uni.showLoading({ title: '刷新中...' })
	try {
		// 并行执行数据获取和预算加载
		const [bills] = await Promise.all([
			billStorage.getFromAPI(), // 直接从API获取
			loadBudget()
		])
		
		data.allBills = bills
		recalculateData()
		await nextTick()
		
		// 并行执行奖励检查（静默）
		Promise.all([
			rewardRecord(),
			checkRecordAchievements(bills.length),
			checkContinuousAchievements(new Set(bills.map(b => new Date(b.date).toDateString())).size)
		]).catch(err => console.error('奖励检查失败:', err))
		
	} catch (error) {
		console.error('刷新失败:', error)
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
		confirmColor: '#52C41A',
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
			console.log('订阅结果:', res)
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
			console.log('订阅信息保存成功')
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
		console.log('同步失败:', error)
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
	const userInfo = uni.getStorageSync('userInfo')
	return userInfo && userInfo.isLogin
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
	console.log('用户点击去记账')
}

// 处理提醒弹框取消
const handleReminderCancel = () => {
	// 不记录已提醒，下次打开继续提醒
	console.log('用户点击稍后')
}

// 检查APP更新
const checkAppUpdate = async () => {
	// #ifdef APP-PLUS
	try {
		const updateInfo = await checkUpdate()
		
		if (updateInfo.hasUpdate) {
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
	console.log('开始下载更新')
}

// 下载完成
const handleDownloadComplete = () => {
	data.showUpdateModal = false
}

// 初始化春节元素
const initFestivalElements = () => {
	// 检查红包雨时间
	checkRedPacketTime()
	
	// 启动定时器，每秒更新一次
	data.redPacketTimer = setInterval(() => {
		checkRedPacketTime()
	}, 1000)
}

// 检查红包雨时间
const checkRedPacketTime = () => {
	const now = Date.now()
	const currentDate = new Date()
	
	// 春节活动时间：2026年2月3日到2月18日
	const festivalStartDate = new Date('2026/02/03 00:00:00')
	const festivalEndDate = new Date('2026/02/18 23:59:59')
	
	// 检查是否在活动期间
	if (now < festivalStartDate.getTime() || now > festivalEndDate.getTime()) {
		// 活动未开始或已结束
		data.isFestivalActive = false
		data.isRedPacketTime = false
		data.showRedPackets = false
		data.remainingTime = now < festivalStartDate.getTime() ? '活动未开始' : '活动已结束'
		return
	}
	
	// 活动进行中
	data.isFestivalActive = true
	
	// 红包雨规则：每天固定时间段，每次2分钟
	// 时间段：10:00, 14:00, 18:00, 21:00
	const DURATION = 2 * 60 * 1000 // 2分钟持续时间
	const RED_PACKET_HOURS = [10, 14, 18, 21] // 红包雨时段（小时）
	
	const currentHour = currentDate.getHours()
	const currentMinute = currentDate.getMinutes()
	const currentSecond = currentDate.getSeconds()
	
	// 计算当前时间距离今天0点的毫秒数
	const todayStart = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate()).getTime()
	const currentTimeInDay = now - todayStart
	
	// 检查是否在任何一个红包雨时段内
	let isInRedPacketPeriod = false
	let currentPeriodStart = 0
	let nextPeriodStart = 0
	
	for (let hour of RED_PACKET_HOURS) {
		const periodStart = todayStart + hour * 60 * 60 * 1000
		const periodEnd = periodStart + DURATION
		
		if (now >= periodStart && now < periodEnd) {
			// 当前在红包雨时段内
			isInRedPacketPeriod = true
			currentPeriodStart = periodStart
			break
		} else if (now < periodStart) {
			// 找到下一个红包雨时段
			nextPeriodStart = periodStart
			break
		}
	}
	
	// 如果今天所有时段都过了，计算明天第一个时段
	if (!isInRedPacketPeriod && nextPeriodStart === 0) {
		const tomorrowStart = todayStart + 24 * 60 * 60 * 1000
		nextPeriodStart = tomorrowStart + RED_PACKET_HOURS[0] * 60 * 60 * 1000
	}
	
	if (isInRedPacketPeriod) {
		// 正在红包雨时段内
		if (!data.isRedPacketTime) {
			data.isRedPacketTime = true
			data.currentSessionPoints = 0
			data.currentSessionBlessings = []
			startRedPacketRain()
		}
		
		// 更新剩余时间
		const remainSeconds = Math.ceil((currentPeriodStart + DURATION - now) / 1000)
		const minutes = Math.floor(remainSeconds / 60)
		const seconds = remainSeconds % 60
		data.remainingTime = `剩余 ${minutes}:${seconds.toString().padStart(2, '0')}`
		return
	}
	
	// 不在红包雨时段内
	if (data.isRedPacketTime) {
		// 刚结束红包雨
		data.isRedPacketTime = false
		endRedPacketRain()
		// 注意：currentSessionPoints 的重置已经在 closeResultModal() 中完成
	}
	
	data.isRedPacketTime = false
	data.showRedPackets = false
	
	// 显示下次红包雨倒计时
	const remainMs = nextPeriodStart - now
	const remainMinutes = Math.floor(remainMs / (60 * 1000))
	const remainSeconds = Math.floor((remainMs % (60 * 1000)) / 1000)
	
	if (remainMinutes >= 60) {
		const hours = Math.floor(remainMinutes / 60)
		const mins = remainMinutes % 60
		data.remainingTime = `${hours}小时${mins}分后开始`
	} else if (remainMinutes > 0) {
		data.remainingTime = `${remainMinutes}分钟后开始`
	} else if (remainSeconds > 0) {
		data.remainingTime = `${remainSeconds}秒后开始`
	} else {
		data.remainingTime = '即将开始'
	}
}

// 开始红包雨
const startRedPacketRain = () => {
	data.showRedPackets = true
	generateRedPackets()
	
	// 只在页面可见时播放音乐和显示提示
	if (!data.isPageVisible) {
		console.log('页面不可见，不播放音乐和提示')
		return
	}
	
	// 先播放红包雨来了的提示音
	try {
		const notifyAudio = uni.createInnerAudioContext()
		notifyAudio.src = '/static/audio/red-packet-scome.mp3'
		notifyAudio.volume = 0.8
		notifyAudio.onError((err) => {
			console.log('提示音播放失败:', err)
			notifyAudio.destroy()
		})
		notifyAudio.play()
		notifyAudio.onEnded(() => {
			notifyAudio.destroy()
			// 提示音播放完后，开始循环播放背景音乐
			startBgMusic()
		})
	} catch (e) {
		console.log('提示音播放异常:', e)
		// 如果提示音失败，直接播放背景音乐
		startBgMusic()
	}
	
	// 显示提示
	uni.showToast({
		title: '🧧 红包雨来啦！',
		icon: 'none',
		duration: 2000
	})
}

// 开始背景音乐
const startBgMusic = () => {
	try {
		// 如果已有音乐在播放，先停止
		if (data.bgMusicContext) {
			data.bgMusicContext.stop()
			data.bgMusicContext.destroy()
		}
		
		data.bgMusicContext = uni.createInnerAudioContext()
		data.bgMusicContext.src = '/static/audio/red-packet-start.mp3'
		data.bgMusicContext.loop = true // 循环播放
		data.bgMusicContext.volume = 0.6 // 音量60%
		data.bgMusicContext.onError((err) => {
			console.log('背景音乐播放失败:', err)
		})
		data.bgMusicContext.play()
	} catch (e) {
		console.log('背景音乐播放异常:', e)
	}
}

// 结束红包雨
const endRedPacketRain = () => {
	console.log('=== 红包雨结束 ===')
	console.log('当前积分:', data.currentSessionPoints)
	console.log('当前祝福语:', data.currentSessionBlessings)
	console.log('页面可见:', data.isPageVisible)
	
	data.showRedPackets = false
	data.redPackets = []
	
	// 停止背景音乐
	if (data.bgMusicContext) {
		data.bgMusicContext.stop()
		data.bgMusicContext.destroy()
		data.bgMusicContext = null
	}
	
	// 只在页面可见时显示结算弹窗（有积分或祝福语时才显示）
	if ((data.currentSessionPoints > 0 || data.currentSessionBlessings.length > 0) && data.isPageVisible) {
		console.log('✅ 显示结算弹窗')
		data.showResultModal = true
		
		// 保存积分到总积分
		if (data.currentSessionPoints > 0) {
			let totalPoints = uni.getStorageSync('userPoints') || 0
			totalPoints += data.currentSessionPoints
			uni.setStorageSync('userPoints', totalPoints)
			console.log('积分已保存，总积分:', totalPoints)
		}
		// 注意：不在这里重置数据，等弹窗关闭时再重置
	} else if ((data.currentSessionPoints > 0 || data.currentSessionBlessings.length > 0) && !data.isPageVisible) {
		console.log('⚠️ 页面不可见，静默保存积分')
		// 页面不可见时,静默保存积分,不显示弹窗
		if (data.currentSessionPoints > 0) {
			let totalPoints = uni.getStorageSync('userPoints') || 0
			totalPoints += data.currentSessionPoints
			uni.setStorageSync('userPoints', totalPoints)
		}
		// 页面不可见时立即重置
		data.currentSessionPoints = 0
		data.currentSessionBlessings = []
	} else {
		console.log('❌ 不显示弹窗，原因：')
		console.log('  - 积分为0:', data.currentSessionPoints === 0)
		console.log('  - 祝福语为空:', data.currentSessionBlessings.length === 0)
		console.log('  - 页面不可见:', !data.isPageVisible)
		// 没有数据时也重置
		data.currentSessionPoints = 0
		data.currentSessionBlessings = []
	}
}

// 生成红包雨
const generateRedPackets = () => {
	if (!data.isRedPacketTime) return
	
	const packets = []
	// 生成15个红包，其中2-3个是大红包
	const bigPacketCount = Math.floor(Math.random() * 2) + 2 // 2-3个大红包
	const bigPacketIndexes = []
	
	// 随机选择哪些是大红包
	while (bigPacketIndexes.length < bigPacketCount) {
		const randomIndex = Math.floor(Math.random() * 15)
		if (!bigPacketIndexes.includes(randomIndex)) {
			bigPacketIndexes.push(randomIndex)
		}
	}
	
	for (let i = 0; i < 15; i++) {
		const isBig = bigPacketIndexes.includes(i)
		packets.push({
			left: Math.random() * 90 + 5,
			delay: Math.random() * 2,
			duration: isBig ? 5 + Math.random() * 2 : 4 + Math.random() * 2, // 大红包下落慢一点
			clicked: false,
			isBig: isBig // 标记是否是大红包
		})
	}
	data.redPackets = packets
	
	// 6秒后重新生成（确保红包持续）
	setTimeout(() => {
		if (data.isRedPacketTime) {
			generateRedPackets()
		}
	}, 6000)
}

// 点击红包
const clickRedPacket = (index) => {
	if (!data.isRedPacketTime) {
		uni.showToast({
			title: '红包雨已结束',
			icon: 'none'
		})
		return
	}
	
	// 防止重复点击
	if (data.redPackets[index].clicked) return
	data.redPackets[index].clicked = true
	
	// 判断是否是大红包
	const isBig = data.redPackets[index].isBig
	
	// 50%概率获得积分，50%概率获得祝福语
	const isPoints = Math.random() < 0.5
	let resultText = ''
	
	if (isPoints) {
		// 积分红包
		let points = 0
		if (isBig) {
			// 大红包：15-30积分
			points = Math.floor(Math.random() * 16) + 15
		} else {
			// 小红包：1-10积分
			points = Math.floor(Math.random() * 10) + 1
		}
		
		data.currentSessionPoints += points
		resultText = isBig ? `🎉 +${points}积分` : `+${points}积分`
		console.log(`✅ 获得积分: +${points}，当前总积分: ${data.currentSessionPoints}`)
	} else {
		// 祝福语红包
		const blessings = [
			'🐴 马到成功',
			'💰 财源滚滚',
			'🎊 万事如意',
			'🌟 心想事成',
			'🎉 大吉大利',
			'✨ 好运连连',
			'🏆 一马当先',
			'🎯 马上有钱',
			'🌈 福星高照',
			'🎁 喜事连连',
			'🔥 红红火火',
			'💎 财运亨通',
			'🌸 花开富贵',
			'🎪 笑口常开',
			'🎨 锦绣前程'
		]
		
		const blessing = blessings[Math.floor(Math.random() * blessings.length)]
		data.currentSessionBlessings.push(blessing)
		resultText = blessing
		console.log(`✅ 获得祝福: ${blessing}，当前祝福数: ${data.currentSessionBlessings.length}`)
	}
	
	// 播放抢红包音效
	try {
		const audioContext = uni.createInnerAudioContext()
		audioContext.src = '/static/audio/red-packet-open.mp3'
		audioContext.onError((err) => {
			console.log('音效播放失败:', err)
			audioContext.destroy()
		})
		audioContext.play()
		audioContext.onEnded(() => {
			audioContext.destroy()
		})
	} catch (e) {
		console.log('音效播放异常:', e)
	}
	
	// 显示开红包动画
	data.showOpenAnimation = true
	data.grabResult = resultText
	
	// 震动反馈（大红包震动更强）
	if (isBig) {
		uni.vibrateLong()
	} else {
		uni.vibrateShort()
	}
	
	// 1.5秒后隐藏动画
	setTimeout(() => {
		data.showOpenAnimation = false
	}, 1500)
}

// 关闭结算弹窗
const closeResultModal = () => {
	console.log('关闭结算弹窗，重置数据')
	data.showResultModal = false
	// 关闭弹窗时才重置数据
	data.currentSessionPoints = 0
	data.currentSessionBlessings = []
}

// 从云端获取抢红包次数
const loadRedPacketCount = async () => {
	try {
		const res = await request.call('billManager', {
			action: 'getRedPacketCount'
		})
		
		if (res.success) {
			data.morningGrabCount = res.morningCount || 0
			data.afternoonGrabCount = res.afternoonCount || 0
			data.lastGrabTime = res.lastGrabTime || 0
			console.log('抢红包次数加载成功:', res)
		}
	} catch (error) {
		console.error('获取抢红包次数失败:', error)
		// 失败时使用本地缓存
		data.morningGrabCount = uni.getStorageSync('morningGrabCount') || 0
		data.afternoonGrabCount = uni.getStorageSync('afternoonGrabCount') || 0
		data.lastGrabTime = uni.getStorageSync('lastGrabTime') || 0
	}
}

// 下拉抢红包相关函数
const onTouchStart = (e) => {
	// 如果有弹框打开，不处理触摸事件
	if (data.showMonthPicker || data.showBudgetModal) return
	
	// 记录起始位置
	data.startY = e.touches[0].pageY
	data.isGrabbingMode = false
	console.log('触摸开始，Y坐标:', data.startY)
}

const onTouchMove = (e) => {
	// 如果有弹框打开，不处理触摸事件
	if (data.showMonthPicker || data.showBudgetModal) return
	
	if (data.startY === 0) return
	const currentY = e.touches[0].pageY
	const distance = currentY - data.startY
	
	// 只处理下拉
	if (distance > 0) {
		data.pullDistance = Math.min(distance, 150)
		
		console.log('下拉距离:', distance)
		
		// 如果下拉距离超过100，进入抢红包模式
		if (distance > 100) {
			data.isGrabbingMode = true
			console.log('进入抢红包模式')
		} else {
			// 下拉距离小于100，普通刷新模式
			data.isGrabbingMode = false
		}
	}
}

const onTouchEnd = async () => {
	// 如果有弹框打开，不处理触摸事件
	if (data.showMonthPicker || data.showBudgetModal) return
	
	console.log('触摸结束，下拉距离:', data.pullDistance, '抢红包模式:', data.isGrabbingMode)
	
	const distance = data.pullDistance
	
	// 下拉距离超过100，触发抢红包
	if (distance > 100) {
		console.log('触发抢红包！')
		grabRedPacket()
	}
	// 下拉距离在50-100之间，触发数据刷新
	else if (distance > 50 && distance <= 100) {
		console.log('触发数据刷新')
		uni.showLoading({ title: '刷新中...' })
		try {
			// 直接从API获取最新数据
			data.allBills = await billStorage.getFromAPI()
			await loadBudget()
			recalculateData()
			
			// 同时刷新抢红包次数
			await loadRedPacketCount()
			
			uni.hideLoading()
			uni.showToast({
				title: '刷新成功',
				icon: 'success',
				duration: 1500
			})
		} catch (error) {
			console.error('刷新失败:', error)
			uni.hideLoading()
			uni.showToast({
				title: '刷新失败',
				icon: 'none'
			})
		}
	}
	
	data.startY = 0
	data.pullDistance = 0
	
	// 延迟重置抢红包模式
	setTimeout(() => {
		data.isGrabbingMode = false
	}, 300)
}

// 获取下拉提示文字
const getPullHintText = () => {
	const currentHour = new Date().getHours()
	const isAfternoon = currentHour >= 12 // 12点及以后算下午
	
	// 获取上午和下午的抢红包次数（优先使用云端数据）
	let morningGrabCount = data.morningGrabCount || 0
	let afternoonGrabCount = data.afternoonGrabCount || 0
	
	// 检查当前时段的次数
	const currentPeriodCount = isAfternoon ? afternoonGrabCount : morningGrabCount
	
	// 根据下拉距离显示不同提示
	if (data.pullDistance <= 50) {
		return '下拉刷新数据'
	} else if (data.pullDistance <= 100) {
		return '松手刷新数据'
	}
	
	// 下拉距离超过100，显示抢红包相关提示
	// 检查次数限制（上午20次，下午20次）
	if (currentPeriodCount >= 20) {
		data.canGrabToday = false
		if (isAfternoon) {
			return '今日红包已抢完~'
		} else {
			return '上午红包已抢完，下午再来~'
		}
	}
	
	// 还有次数，可以抢
	data.canGrabToday = true
	return '松手抢红包！'
}

// 抢红包
const grabRedPacket = async () => {
	const now = Date.now()
	const currentHour = new Date().getHours()
	const isAfternoon = currentHour >= 12 // 12点及以后算下午
	
	// 检查当前时段的次数限制（上午20次，下午20次）
	const currentPeriodCount = isAfternoon ? data.afternoonGrabCount : data.morningGrabCount
	if (currentPeriodCount >= 20) {
		if (isAfternoon) {
			uni.showToast({
				title: '今日红包已抢完，明天再来吧~',
				icon: 'none',
				duration: 2000
			})
		} else {
			uni.showToast({
				title: '上午红包已抢完，下午再来~',
				icon: 'none',
				duration: 2000
			})
		}
		return
	}
	
	// 可以抢红包了！显示开红包动画
	data.showOpenAnimation = true
	
	// 完全随机决定是积分还是祝福语（50%概率）
	const isPoints = Math.random() < 0.5
	
	let resultText = ''
	let toastText = ''
	let points = 0
	
	if (isPoints) {
		// 积分红包：1-10分随机
		points = Math.floor(Math.random() * 10) + 1
		resultText = `+${points}积分`
		toastText = `恭喜获得${points}积分！`
	} else {
		// 祝福语红包：随机选择
		const blessings = [
			'🐴 马到成功',
			'💰 财源滚滚',
			'🎊 万事如意',
			'🌟 心想事成',
			'🎉 大吉大利',
			'✨ 好运连连',
			'🏆 一马当先',
			'🎯 马上有钱',
			'🌈 福星高照',
			'🎁 喜事连连',
			'🔥 红红火火',
			'💎 财运亨通',
			'🌸 花开富贵',
			'🎪 笑口常开',
			'🎨 锦绣前程'
		]
		
		const blessing = blessings[Math.floor(Math.random() * blessings.length)]
		resultText = blessing
		toastText = `收到祝福：${blessing}`
	}
	
	// 调用API记录抢红包
	try {
		const res = await request.call('billManager', {
			action: 'grabRedPacket',
			data: {
				isAfternoon: isAfternoon,
				points: isPoints ? points : 0,
				reason: '抢红包'
			}
		})
		
		if (res.success) {
			// 更新本地次数
			data.morningGrabCount = res.morningCount
			data.afternoonGrabCount = res.afternoonCount
			data.lastGrabTime = res.lastGrabTime
			
			// 如果是积分红包，检查是否升级
			if (isPoints) {
				// 获取当前积分
				const currentPoints = uni.getStorageSync('userPoints') || 0
				const oldPoints = currentPoints - points
				
				const levelUpInfo = checkLevelUp(oldPoints, currentPoints)
				
				if (levelUpInfo && levelUpInfo.isLevelUp) {
					// 检查是否已经提示过这个等级
					const notifiedLevel = uni.getStorageSync('notifiedLevel') || 0
					const newLevel = levelUpInfo.newLevel.level
					
					if (notifiedLevel < newLevel) {
						// 记录已提示的等级
						uni.setStorageSync('notifiedLevel', newLevel)
						
						setTimeout(() => {
							uni.showModal({
								title: '🎉 恭喜升级',
								content: `恭喜您从【${levelUpInfo.oldLevel.name}】升级到【${levelUpInfo.newLevel.name}】！\n\n${levelUpInfo.newLevel.desc}\n\n继续记账，冲击更高等级~`,
								showCancel: false,
								confirmText: '太棒了',
								confirmColor: levelUpInfo.newLevel.color
							})
						}, 2500)
					}
				}
			}
		} else {
			// API调用失败
			uni.showToast({
				title: res.message || '抢红包失败',
				icon: 'none',
				duration: 2000
			})
			data.showOpenAnimation = false
			return
		}
		
	} catch (error) {
		console.error('抢红包失败:', error)
		uni.showToast({
			title: '网络错误，请重试',
			icon: 'none',
			duration: 2000
		})
		data.showOpenAnimation = false
		return
	}
	
	// 显示结果
	data.grabResult = resultText
	
	// 震动反馈
	uni.vibrateShort()
	
	// 1.5秒后隐藏开红包动画，显示toast
	setTimeout(() => {
		data.showOpenAnimation = false
		uni.showToast({
			title: toastText,
			icon: isPoints ? 'success' : 'none',
			duration: 2000
		})
	}, 1500)
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

// 获取剩余抢红包次数
const getRemainCount = () => {
	const currentHour = new Date().getHours()
	const isAfternoon = currentHour >= 12
	const currentPeriodCount = isAfternoon ? data.afternoonGrabCount : data.morningGrabCount
	return Math.max(0, 20 - currentPeriodCount)
}

// 显示红包引导（用户点击红包入口时触发）
const showRedPacketGuide = () => {
	data.showGuide = true
}

// 关闭引导
const closeGuide = () => {
	data.showGuide = false
	// 标记用户已看过引导
	uni.setStorageSync('hasSeenRedPacketGuide', true)
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

onLoad((options) => {
	// 先初始化悬浮按钮位置（在其他初始化之前）
	const systemInfo = uni.getSystemInfoSync()
	const rpxToPx = systemInfo.windowWidth / 750
	data.floatBtnX = systemInfo.windowWidth - (180 * rpxToPx)
	data.floatBtnY = systemInfo.windowHeight - (250 * rpxToPx)
	
	initData()
	loadBudget()
	loadData()
	
	// 初始化春节元素（会设置 isFestivalActive）
	initFestivalElements()
	
	// 监听账单保存事件
	uni.$on('billSaved', handleBillSaved)
	
	// 监听显示提醒弹框事件
	uni.$on('showReminderModal', () => {
		console.log('收到显示提醒弹框事件')
		console.log('reminderModalRef.value:', reminderModalRef.value)
		
		// 使用 nextTick 确保组件已经挂载
		nextTick(() => {
			if (reminderModalRef.value && typeof reminderModalRef.value.showModal === 'function') {
				console.log('调用 showModal 方法')
				reminderModalRef.value.showModal()
			} else {
				console.error('reminderModalRef 未准备好或 showModal 方法不存在')
				// 降级方案：使用系统弹框
				uni.showModal({
					title: '记账提醒',
					content: '今天还没记账哦~\n养成每天记账的好习惯，让收支更清晰！',
					confirmText: '去记账',
					cancelText: '稍后',
					success: (res) => {
						if (res.confirm) {
							// 用户点击去记账，不做任何操作（已在首页）
							console.log('用户点击去记账')
						} else {
							// 用户点击稍后，不做任何操作
							console.log('用户点击稍后')
						}
					}
				})
			}
		})
	})
	
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
	// 页面显示时滚动到顶部
	uni.pageScrollTo({
		scrollTop: 0,
		duration: 0
	})
	
	// 标记页面可见
	data.isPageVisible = true
	
	// 恢复红包雨定时器
	if (!data.redPacketTimer && data.isFestivalActive) {
		data.redPacketTimer = setInterval(() => {
			checkRedPacketTime()
		}, 1000)
		// 立即检查一次
		checkRedPacketTime()
	}
	
	// 如果红包雨正在进行且音乐未播放，开始播放背景音乐（不播放提示音）
	if (data.isRedPacketTime && !data.bgMusicContext) {
		startBgMusic()
	}
	
	// 检查是否需要刷新数据
	const needRefresh = uni.getStorageSync('needRefreshHome')
	
	if (needRefresh) {
		// 清除标记
		uni.removeStorageSync('needRefreshHome')
		// 立即显示加载提示
		uni.showLoading({ title: '刷新中...' })
		// 直接从API获取最新数据并刷新
		billStorage.getFromAPI().then(bills => {
			console.log('从API获取到的账单数量:', bills ? bills.length : 0)
			data.allBills = bills || []
			// 重新加载预算
			loadBudget()
			// 重新计算所有数据
			recalculateData()
			uni.hideLoading()
			console.log('数据刷新完成，分类排行:', data.topCategories)
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
	// 标记页面不可见
	data.isPageVisible = false
	
	// 暂停红包雨定时器(但不清除,切回来时继续)
	if (data.redPacketTimer) {
		clearInterval(data.redPacketTimer)
		data.redPacketTimer = null
	}
	
	// 停止背景音乐
	if (data.bgMusicContext) {
		data.bgMusicContext.stop()
		data.bgMusicContext.destroy()
		data.bgMusicContext = null
	}
})

onUnload(() => {
	// 移除事件监听
	uni.$off('billSaved', handleBillSaved)
	uni.$off('showReminderModal')
	
	// 清除定时器
	if (data.redPacketTimer) {
		clearInterval(data.redPacketTimer)
		data.redPacketTimer = null
	}
	
	// 停止背景音乐
	if (data.bgMusicContext) {
		data.bgMusicContext.stop()
		data.bgMusicContext.destroy()
		data.bgMusicContext = null
	}
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
		background: #F7F8FA;
		position: relative;
		overflow: hidden;
	}
	
	/* 自定义导航栏 */
	.custom-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: transparent;
		z-index: 1000;
	}
	
	/* 系统样式导航栏（非活动期间） */
	.system-navbar {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: #52C41A;
		z-index: 1000;
		
		.navbar-content {
			height: 44px;
			display: flex;
			align-items: center;
			justify-content: center;
		}
		
		.navbar-title-text {
			font-size: 36rpx;
			font-weight: $font-weight-bold;
			color: $text-white;
		}
	}
	
	.navbar-content {
		height: 44px;
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
		font-size: 36rpx;
		font-weight: $font-weight-bold;
		color: $text-white;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		letter-spacing: 1rpx;
	}
	
	/* 灯笼装饰 */
	.lantern {
		font-size: 48rpx;
		animation: swing 3s ease-in-out infinite;
		filter: drop-shadow(0 2rpx 8rpx rgba(255, 255, 255, 0.5));
	}
	
	.navbar-right .lantern {
		animation-delay: 1.5s;
	}
	
	@keyframes swing {
		0%, 100% {
			transform: rotate(-8deg);
		}
		50% {
			transform: rotate(8deg);
		}
	}
	
	/* 春节横幅背景 */
	.festival-bg {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		background: linear-gradient(180deg, #FF4D4F 0%, #FF6B6B 100%);
		padding-bottom: 48rpx;
		text-align: center;
		box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.3);
		z-index: 999;
	}
	
	.festival-text {
		font-size: 28rpx;
		font-weight: $font-weight-bold;
		color: $text-white;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
		letter-spacing: 2rpx;
		display: inline-block;
		animation: shine-text 3s ease-in-out infinite;
	}
	
	@keyframes shine-text {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.85;
		}
	}
	
	/* 红包入口 */
	.red-packet-entry {
		margin: 24rpx 32rpx 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
		border-radius: 24rpx;
		padding: 24rpx 32rpx;
		display: flex;
		justify-content: center;
		box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
		animation: pulse-entry 2s ease-in-out infinite;
	}
	
	.entry-content {
		display: flex;
		align-items: center;
		gap: 24rpx;
		position: relative;
		margin-right: 60rpx;
	}
	
	@keyframes pulse-entry {
		0%, 100% {
			transform: scale(1);
			box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.15);
		}
		50% {
			transform: scale(1.02);
			box-shadow: 0 12rpx 32rpx rgba(255, 215, 0, 0.4);
		}
	}
	
	.entry-icon {
		font-size: 72rpx;
		animation: shake-packet 1s ease-in-out infinite;
		flex-shrink: 0;
	}
	
	@keyframes shake-packet {
		0%, 100% {
			transform: rotate(0deg);
		}
		25% {
			transform: rotate(-10deg);
		}
		75% {
			transform: rotate(10deg);
		}
	}
	
	.entry-text {
		display: flex;
		flex-direction: column;
		gap: 8rpx;
		align-items: center;
		text-align: center;
	}
	
	.entry-title {
		font-size: 32rpx;
		font-weight: $font-weight-bold;
		color: #FF4D4F;
	}
	
	.entry-subtitle {
		font-size: 24rpx;
		color: #999;
	}
	
	.entry-count {
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		padding: 12rpx 24rpx;
		border-radius: 32rpx;
		box-shadow: 0 4rpx 12rpx rgba(255, 215, 0, 0.4);
	}
	
	.count-text {
		font-size: 24rpx;
		font-weight: $font-weight-bold;
		color: #8B4513;
	}
	
	/* 新手引导弹窗 */
	.guide-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10002;
		animation: fadeIn 0.3s ease;
	}
	
	.guide-content {
		width: 600rpx;
		background: linear-gradient(180deg, #FFF 0%, #FFF9F0 100%);
		border-radius: 32rpx;
		overflow: hidden;
		animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	.guide-header {
		background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
		padding: 32rpx;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	
	.guide-title {
		font-size: 36rpx;
		font-weight: $font-weight-bold;
		color: $text-white;
	}
	
	.guide-close {
		font-size: 48rpx;
		color: rgba(255, 255, 255, 0.9);
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.guide-body {
		padding: 48rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 24rpx;
	}
	
	.guide-packet {
		font-size: 160rpx;
		animation: bounce-guide 1s ease-in-out infinite;
	}
	
	@keyframes bounce-guide {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-20rpx);
		}
	}
	
	.guide-arrow {
		font-size: 64rpx;
		animation: arrow-down 1s ease-in-out infinite;
	}
	
	@keyframes arrow-down {
		0%, 100% {
			transform: translateY(0);
			opacity: 1;
		}
		50% {
			transform: translateY(20rpx);
			opacity: 0.5;
		}
	}
	
	.guide-tip {
		font-size: 32rpx;
		font-weight: $font-weight-bold;
		color: #FF4D4F;
		margin-bottom: 16rpx;
	}
	
	.guide-rules {
		width: 100%;
		background: rgba(255, 77, 79, 0.05);
		border-radius: 16rpx;
		padding: 24rpx;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	
	.rule-item {
		font-size: 26rpx;
		color: #666;
		line-height: 1.6;
	}
	
	.guide-footer {
		padding: 0 32rpx 32rpx;
	}
	
	.guide-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: $font-weight-bold;
		color: $text-white;
		box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.4);
	}
	
	/* 红包雨结算弹窗 */
	.result-modal {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10003;
		animation: fadeIn 0.3s ease;
	}
	
	.result-content {
		width: 600rpx;
		background: linear-gradient(180deg, #FFF 0%, #FFF9F0 100%);
		border-radius: 32rpx;
		overflow: hidden;
		animation: scaleIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	.result-header {
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		padding: 32rpx;
		text-align: center;
	}
	
	.result-title {
		font-size: 36rpx;
		font-weight: $font-weight-bold;
		color: #8B4513;
	}
	
	.result-body {
		padding: 48rpx 32rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 32rpx;
	}
	
	.result-points {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
	}
	
	.points-label {
		font-size: 28rpx;
		color: #999;
	}
	
	.points-value {
		font-size: 120rpx;
		font-weight: $font-weight-bold;
		color: #FF4D4F;
		font-family: 'DIN Alternate', monospace;
		text-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.3);
		animation: pulse-points 1s ease-in-out infinite;
	}
	
	@keyframes pulse-points {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.05);
		}
	}
	
	.points-unit {
		font-size: 32rpx;
		color: #666;
	}
	
	/* 祝福语统计 */
	.result-blessings {
		width: 100%;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16rpx;
	}
	
	.blessings-label {
		font-size: 28rpx;
		color: #999;
	}
	
	.blessings-list {
		width: 100%;
		display: flex;
		flex-wrap: wrap;
		gap: 16rpx;
		justify-content: center;
		max-height: 300rpx;
		overflow-y: auto;
	}
	
	.blessing-item {
		background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%);
		padding: 12rpx 24rpx;
		border-radius: 32rpx;
		font-size: 24rpx;
		color: #FF4D4F;
		font-weight: $font-weight-semibold;
		box-shadow: 0 4rpx 12rpx rgba(255, 77, 79, 0.15);
		animation: fadeInUp 0.5s ease;
	}
	
	@keyframes fadeInUp {
		from {
			opacity: 0;
			transform: translateY(20rpx);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* 空状态 */
	.result-empty {
		padding: 48rpx 0;
	}
	
	.empty-text {
		font-size: 28rpx;
		color: #999;
	}
	
	.result-tip {
		width: 100%;
		background: rgba(255, 77, 79, 0.05);
		border-radius: 16rpx;
		padding: 24rpx;
		text-align: center;
	}
	
	.tip-text {
		font-size: 28rpx;
		color: #FF4D4F;
		font-weight: $font-weight-semibold;
	}
	
	.result-footer {
		padding: 0 32rpx 32rpx;
	}
	
	.result-btn {
		width: 100%;
		height: 88rpx;
		background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
		border-radius: 44rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 32rpx;
		font-weight: $font-weight-bold;
		color: #8B4513;
		box-shadow: 0 8rpx 24rpx rgba(255, 165, 0, 0.4);
	}
	
	/* 红包入口激活状态 */
	.red-packet-entry.active {
		animation: pulse-active 1s ease-in-out infinite;
		background: linear-gradient(135deg, #FFE5E5 0%, #FFD4D4 100%);
	}
	
	@keyframes pulse-active {
		0%, 100% {
			transform: scale(1);
			box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.3);
		}
		50% {
			transform: scale(1.03);
			box-shadow: 0 12rpx 32rpx rgba(255, 77, 79, 0.4);
		}
	}
	
	.entry-badge {
		background: #FF4D4F;
		color: $text-white;
		font-size: 24rpx;
		font-weight: $font-weight-bold;
		padding: 8rpx 16rpx;
		border-radius: 32rpx;
		animation: blink 1s ease-in-out infinite;
		position: absolute;
		right: -80rpx;
	}
	
	@keyframes blink {
		0%, 100% {
			opacity: 1;
		}
		50% {
			opacity: 0.6;
		}
	}
	
	.badge-text {
		color: $text-white;
	}
	
	/* 下拉抢红包提示 */
	.pull-hint {
		position: fixed;
		top: 120rpx;
		left: 50%;
		transform: translateX(-50%) translateY(-100rpx);
		background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
		padding: 20rpx 40rpx;
		border-radius: 60rpx;
		display: flex;
		align-items: center;
		gap: 16rpx;
		box-shadow: 0 8rpx 24rpx rgba(255, 77, 79, 0.4);
		z-index: 101;
		opacity: 0;
		transition: all 0.3s ease;
		border: 3rpx solid rgba(255, 255, 255, 0.5);
	}
	
	.pull-hint.show {
		opacity: 1;
		transform: translateX(-50%) translateY(0);
	}
	
	.hint-icon {
		font-size: 48rpx;
		animation: bounce-hint 0.6s ease-in-out infinite;
	}
	
	@keyframes bounce-hint {
		0%, 100% {
			transform: translateY(0);
		}
		50% {
			transform: translateY(-8rpx);
		}
	}
	
	.hint-text {
		font-size: 28rpx;
		color: $text-white;
		font-weight: $font-weight-bold;
		text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
	}
	
	/* 开红包炸裂动画 */
	.open-packet-animation {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		z-index: 10001;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	
	.packet-bg {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.7);
		animation: fadeIn 0.3s ease;
	}
	
	.packet-content {
		position: relative;
		z-index: 1;
	}
	
	/* 红包炸开效果 */
	.packet-explode {
		position: relative;
		width: 300rpx;
		height: 400rpx;
		margin: 0 auto;
	}
	
	.packet-half {
		position: absolute;
		width: 150rpx;
		height: 400rpx;
		background: linear-gradient(135deg, #FF4D4F 0%, #FF7875 100%);
		border-radius: 20rpx;
		box-shadow: 0 8rpx 32rpx rgba(255, 0, 0, 0.6);
	}
	
	.packet-left {
		left: 0;
		animation: explode-left 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
		transform-origin: right center;
	}
	
	.packet-right {
		right: 0;
		animation: explode-right 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55);
		transform-origin: left center;
	}
	
	@keyframes explode-left {
		0% {
			transform: translateX(0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateX(-200rpx) rotate(-45deg);
			opacity: 0;
		}
	}
	
	@keyframes explode-right {
		0% {
			transform: translateX(0) rotate(0deg);
			opacity: 1;
		}
		100% {
			transform: translateX(200rpx) rotate(45deg);
			opacity: 0;
		}
	}
	
	/* 金币飞出效果 */
	.coins-fly {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
	}
	
	.coin {
		position: absolute;
		font-size: 60rpx;
		animation: coin-fly 0.8s ease-out forwards;
		opacity: 0;
	}
	
	.coin:nth-child(1) { animation-delay: 0.3s; --angle: 0deg; }
	.coin:nth-child(2) { animation-delay: 0.35s; --angle: 30deg; }
	.coin:nth-child(3) { animation-delay: 0.4s; --angle: 60deg; }
	.coin:nth-child(4) { animation-delay: 0.45s; --angle: 90deg; }
	.coin:nth-child(5) { animation-delay: 0.5s; --angle: 120deg; }
	.coin:nth-child(6) { animation-delay: 0.55s; --angle: 150deg; }
	.coin:nth-child(7) { animation-delay: 0.6s; --angle: 180deg; }
	.coin:nth-child(8) { animation-delay: 0.65s; --angle: 210deg; }
	.coin:nth-child(9) { animation-delay: 0.7s; --angle: 240deg; }
	.coin:nth-child(10) { animation-delay: 0.75s; --angle: 270deg; }
	.coin:nth-child(11) { animation-delay: 0.8s; --angle: 300deg; }
	.coin:nth-child(12) { animation-delay: 0.85s; --angle: 330deg; }
	
	@keyframes coin-fly {
		0% {
			transform: translate(0, 0) scale(0);
			opacity: 0;
		}
		50% {
			opacity: 1;
		}
		100% {
			transform: translate(
				calc(cos(var(--angle)) * 200rpx),
				calc(sin(var(--angle)) * 200rpx)
			) scale(1);
			opacity: 0;
		}
	}
	
	/* 结果显示 */
	.result-show {
		position: absolute;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		animation: result-show 0.5s 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
		opacity: 0;
	}
	
	.result-text {
		font-size: 80rpx;
		font-weight: $font-weight-bold;
		color: #FFD700;
		text-shadow: 0 4rpx 20rpx rgba(255, 215, 0, 0.8),
		             0 0 40rpx rgba(255, 215, 0, 0.6);
		white-space: nowrap;
	}
	
	@keyframes result-show {
		0% {
			transform: translate(-50%, -50%) scale(0);
			opacity: 0;
		}
		100% {
			transform: translate(-50%, -50%) scale(1);
			opacity: 1;
		}
	}
	
	/* 抢红包动画（旧版，已废弃） */
	.red-packet-grab {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 10001;
		animation: fadeIn 0.3s ease;
	}
	
	.grab-animation {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 40rpx;
		animation: scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	
	@keyframes scaleIn {
		0% {
			transform: scale(0);
			opacity: 0;
		}
		100% {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	.grab-packet {
		font-size: 200rpx;
		animation: rotate-packet 1s ease-in-out;
		filter: drop-shadow(0 8rpx 24rpx rgba(255, 0, 0, 0.6));
	}
	
	@keyframes rotate-packet {
		0% {
			transform: rotate(0deg) scale(0.5);
		}
		50% {
			transform: rotate(180deg) scale(1.2);
		}
		100% {
			transform: rotate(360deg) scale(1);
		}
	}
	
	.grab-text {
		font-size: 64rpx;
		font-weight: $font-weight-bold;
		color: #FFD700;
		text-shadow: 0 4rpx 12rpx rgba(255, 215, 0, 0.6);
		animation: pulse-text 0.8s ease-in-out infinite;
	}
	
	@keyframes pulse-text {
		0%, 100% {
			transform: scale(1);
		}
		50% {
			transform: scale(1.1);
		}
	}
	
	/* 春节装饰：灯笼 */
	.lantern {
		position: absolute;
		top: calc(constant(safe-area-inset-top) + 10rpx);
		top: calc(env(safe-area-inset-top) + 10rpx);
		font-size: 64rpx;
		z-index: 1001;
		animation: swing 3s ease-in-out infinite;
		filter: drop-shadow(0 4rpx 12rpx rgba(255, 255, 255, 0.5));
	}
	
	.lantern-left {
		left: 20rpx;
	}
	
	.lantern-right {
		right: 20rpx;
		animation-delay: 1.5s;
	}
	
	@keyframes swing {
		0%, 100% {
			transform: rotate(-8deg);
		}
		50% {
			transform: rotate(8deg);
		}
	}
	
	/* 红包雨 */
	.red-packet-rain {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		pointer-events: none; /* 容器不拦截点击 */
		z-index: 99;
	}
	
	.red-packet {
		position: absolute;
		top: -100rpx;
		font-size: 80rpx;
		animation: fall linear infinite;
		filter: drop-shadow(0 4rpx 12rpx rgba(255, 0, 0, 0.5));
		pointer-events: auto; /* 红包可以点击 */
		cursor: pointer;
		transition: transform 0.1s ease;
	}
	
	.red-packet:active {
		transform: scale(1.2);
		filter: drop-shadow(0 8rpx 24rpx rgba(255, 215, 0, 0.8));
	}
	
	/* 大红包样式 */
	.red-packet-big {
		font-size: 120rpx;
		filter: drop-shadow(0 8rpx 24rpx rgba(255, 215, 0, 0.8));
		animation: fall-big linear infinite, glow 1.5s ease-in-out infinite;
		z-index: 100;
	}
	
	.red-packet-big:active {
		transform: scale(1.3);
		filter: drop-shadow(0 12rpx 32rpx rgba(255, 215, 0, 1));
	}
	
	@keyframes fall {
		0% {
			top: -100rpx;
			transform: rotate(0deg);
		}
		100% {
			top: 100vh;
			transform: rotate(360deg);
		}
	}
	
	@keyframes fall-big {
		0% {
			top: -150rpx;
			transform: rotate(0deg) scale(1);
		}
		50% {
			transform: rotate(180deg) scale(1.1);
		}
		100% {
			top: 100vh;
			transform: rotate(360deg) scale(1);
		}
	}
	
	@keyframes glow {
		0%, 100% {
			filter: drop-shadow(0 8rpx 24rpx rgba(255, 215, 0, 0.8));
		}
		50% {
			filter: drop-shadow(0 12rpx 32rpx rgba(255, 215, 0, 1));
		}
	}
	
	/* 烟花画布 */
	.fireworks-canvas {
		position: fixed;
		top: 0;
		left: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 98;
	}
	
	.container {
		padding: $spacing-md;
		padding-bottom: 100rpx;
		box-sizing: border-box;
	}

	.header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: $spacing-lg;
		padding-top: $spacing-sm;
		position: relative;
		z-index: 100;
	}

	.month-picker {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		cursor: pointer;
		display: flex;
		align-items: center;
		padding: $spacing-md $spacing-lg;
		background: $bg-white;
		border-radius: $radius-2xl;
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.08);
		transition: all $transition-fast;
		border: 2rpx solid rgba(82, 196, 26, 0.08);
		position: relative;
		overflow: hidden;
	}
	
	.month-picker::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 6rpx;
		background: $gradient-primary;
		border-radius: 0 3rpx 3rpx 0;
	}
	
	.month-picker:active {
		transform: scale(0.98);
		box-shadow: 0 8rpx 20rpx rgba(82, 196, 26, 0.15);
		border-color: $primary-color;
	}

	.arrow {
		font-size: 20rpx;
		margin-left: $spacing-sm;
		color: $text-tertiary;
		opacity: 0.7;
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
		margin-bottom: $spacing-lg;
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
		margin-bottom: $spacing-lg;
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
		margin-bottom: $spacing-lg;
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
		margin-bottom: $spacing-lg;
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
	
	.action-btn-compact:active {
		transform: scale(0.98); /* 美团风格：更轻微的缩放 */
	}
	
	.voice-btn-compact {
		background: $bg-white;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		border: 1rpx solid $border-light;
	}
	
	.voice-btn-compact:active {
		background: $bg-gray;
		box-shadow: $shadow-sm;
	}
	
	.photo-btn-compact {
		background: linear-gradient(135deg, #F6FFED 0%, #E6F7E0 100%);
		box-shadow: $shadow-card;
		border: 1rpx solid rgba(82, 196, 26, 0.15);
	}
	
	.photo-btn-compact:active {
		background: linear-gradient(135deg, #E6F7E0 0%, #D9F7BE 100%);
		box-shadow: $shadow-sm;
	}
	
	.btn-icon-compact {
		font-size: 44rpx; /* 美团风格：稍小的图标 */
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}
	
	.btn-text-compact {
		font-size: $font-size-base; /* 美团风格：标准字号 */
		color: $text-primary;
		font-weight: $font-weight-semibold;
		letter-spacing: 0.5rpx;
	}
	
	.voice-btn-compact .btn-text-compact {
		color: $text-primary;
		text-shadow: none;
	}
	
	.photo-btn-compact .btn-text-compact {
		color: $primary-color;
		text-shadow: none;
	}
	
	.voice-btn-compact .btn-icon-compact {
		filter: drop-shadow(0 2rpx 4rpx rgba(0, 0, 0, 0.1));
	}
	
	.photo-btn-compact .btn-icon-compact {
		filter: drop-shadow(0 2rpx 4rpx rgba(82, 196, 26, 0.2));
	}
	
	.photo-btn-compact .btn-icon-compact {
		filter: drop-shadow(0 2rpx 4rpx rgba(82, 196, 26, 0.25));
	}
	
	/* 收支结余合并卡片 - 美团风格优化 */
	.finance-summary-card {
		background: $bg-white;
		border-radius: $radius-xl; /* 美团风格：更小的圆角 */
		padding: 32rpx 24rpx;
		margin-bottom: $spacing-md;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		border: 1rpx solid $border-light;
	}
	
	.finance-data {
		display: flex;
		align-items: center;
		margin-bottom: 24rpx;
		padding-bottom: 24rpx;
		border-bottom: 1rpx solid $border-light;
	}
	
	.finance-item {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 12rpx;
	}
	
	.income-item {
		align-items: flex-end;
		padding-right: $spacing-lg;
	}
	
	.expense-item {
		align-items: flex-start;
		padding-left: $spacing-lg;
	}
	
	.finance-divider {
		width: 1rpx;
		height: 60rpx;
		background: $border-light;
		margin: 0 $spacing-lg;
		flex-shrink: 0;
	}
	
	.finance-label {
		font-size: $font-size-sm;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
	}
	
	.finance-label-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.finance-amount-row {
		display: flex;
		align-items: center;
		gap: 8rpx;
	}
	
	.finance-amount {
		font-size: 40rpx; /* 美团风格：稍小的字号 */
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
		line-height: 1;
		margin-top: 8rpx;
	}
	
	.eye-icon-img {
		width: 28rpx;
		height: 28rpx;
		display: block;
		cursor: pointer;
		transition: all $transition-fast;
		opacity: 0.5;
	}
	
	.eye-icon-img:active {
		transform: scale(0.9);
		opacity: 0.8;
	}
	
	.balance-eye-icon {
		position: relative;
		top: -2rpx;
	}
	
	.income-color {
		color: $success-color;
	}
	
	.expense-color {
		color: $error-color;
	}
	
	.balance-section {
		text-align: center;
		padding: 20rpx 0 8rpx;
	}
	
	.balance-section.positive {
		background: transparent;
	}
	
	.balance-section.negative {
		background: transparent;
	}
	
	.balance-section .balance-label {
		font-size: $font-size-sm;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
		line-height: 1;
	}
	
	.balance-label-row {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		margin-bottom: 8rpx;
	}
	
	.balance-label {
		font-size: $font-size-base;
		color: $text-secondary;
		line-height: 1;
	}
	
	.balance-amount-wrapper {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		margin-bottom: 8rpx;
	}
	
	.balance-section .balance-amount {
		font-size: 40rpx; /* 美团风格：稍小的字号 */
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
		line-height: 1;
		margin-top: 8rpx;
	}
	
	.eye-icon-img-large {
		width: 36rpx;
		height: 36rpx;
		cursor: pointer;
		transition: all $transition-fast;
		opacity: 0.5;
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
		margin-bottom: $spacing-lg;
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
		color: #52C41A;
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
	
	/* 简化版预算卡片 - 美团风格优化 */
	.budget-card-compact {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：更小的圆角 */
		padding: 24rpx;
		margin-bottom: $spacing-lg;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		transition: all $transition-fast;
		cursor: pointer;
		border: 1rpx solid $border-light;
	}
	
	.budget-card-compact:active {
		transform: scale(0.99);
		box-shadow: $shadow-md;
	}
	
	.budget-card-compact.budget-warning {
		background: linear-gradient(135deg, #FFF9E6 0%, #FFFFFF 100%);
		border-color: rgba(250, 173, 20, 0.2);
		box-shadow: $shadow-card;
	}
	
	.budget-card-compact.budget-danger {
		background: linear-gradient(135deg, #FFF1F0 0%, #FFFFFF 100%);
		border-color: rgba(245, 34, 45, 0.2);
		box-shadow: $shadow-card;
	}
	
	.budget-header-compact {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: $spacing-md;
	}
	
	.budget-title-compact {
		font-size: $font-size-base;
		color: $text-primary;
		font-weight: $font-weight-semibold;
	}
	
	.budget-warning-compact {
		display: flex;
		align-items: center;
		gap: 4rpx;
		padding: 4rpx 12rpx;
		background: rgba(250, 173, 20, 0.1);
		border-radius: $radius-md; /* 美团风格：更小的圆角 */
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
		font-size: 36rpx; /* 美团风格：稍小的字号 */
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
		height: 12rpx; /* 美团风格：更细的进度条 */
		background: $bg-light;
		border-radius: $radius-sm; /* 美团风格：更小的圆角 */
		overflow: hidden;
		margin-bottom: $spacing-md;
	}
	
	.budget-progress-compact {
		height: 100%;
		background: $gradient-primary;
		border-radius: $radius-sm;
		transition: width $transition-base ease;
		box-shadow: none; /* 美团风格：去掉发光效果 */
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
		margin-bottom: $spacing-sm;
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
		font-size: $font-size-base; /* 美团风格：标准字号 */
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
	
	.budget-edit-compact {
		font-size: $font-size-xs;
		color: $primary-color;
		text-align: center;
		display: block;
		font-weight: $font-weight-medium;
		padding: $spacing-xs 0;
	}
	
	.budget-toggle-hint {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8rpx;
		padding-top: $spacing-xs;
		border-top: 1rpx solid $border-light;
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
	
	/* 预算设置弹窗 */
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
		animation: fadeIn 0.3s cubic-bezier(0.4, 0, 0.2, 1);
		padding-top: 0;
		overflow-y: auto;
	}
	
	.modal-content {
		width: 640rpx;
		background: linear-gradient(135deg, #ffffff 0%, #f6ffed 100%);
		border-radius: 32rpx;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.15);
		animation: scaleInModal 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
		overflow: hidden;
		margin: -10vh auto 0;
	}
	
	@keyframes scaleInModal {
		from {
			transform: scale(0.9);
			opacity: 0;
		}
		to {
			transform: scale(1);
			opacity: 1;
		}
	}
	
	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 40rpx 32rpx 24rpx;
		background: $gradient-primary;
	}
	
	.modal-title {
		font-size: 32rpx;
		font-weight: 600;
		color: #ffffff;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
	}
	
	.modal-close {
		font-size: 40rpx;
		color: rgba(255, 255, 255, 0.9);
		width: 56rpx;
		height: 56rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s;
	}
	
	.modal-close:active {
		transform: scale(0.9);
		opacity: 0.7;
	}
	
	.modal-body {
		padding: 32rpx;
	}
	
	.input-group {
		margin-bottom: 24rpx;
	}
	
	.input-label {
		font-size: 24rpx;
		color: #666;
		margin-bottom: 12rpx;
		display: block;
		font-weight: 500;
	}
	
	.input-wrapper {
		display: flex;
		align-items: center;
		background: #ffffff;
		border-radius: 20rpx;
		padding: 16rpx 24rpx;
		min-height: 100rpx;
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.08);
		border: 2rpx solid transparent;
		transition: all 0.3s;
	}
	
	.input-wrapper:focus-within {
		border-color: $primary-color;
		box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.15);
	}
	
	.input-prefix {
		font-size: 36rpx;
		color: $primary-color;
		font-weight: 600;
		margin-right: 8rpx;
		line-height: 1;
	}
	
	.budget-input {
		flex: 1;
		font-size: 32rpx;
		color: #333;
		font-weight: 500;
		line-height: 1.2;
		height: 60rpx;
	}
	
	.quick-amounts {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 16rpx;
	}
	
	.amount-btn {
		height: 76rpx;
		background: linear-gradient(135deg, #f6ffed 0%, #ffffff 100%);
		border-radius: 16rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 26rpx;
		color: $primary-color;
		font-weight: 500;
		transition: all 0.2s;
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.06);
		border: 2rpx solid #d9f7be;
	}
	
	.amount-btn:active {
		background: $gradient-primary;
		color: #ffffff;
		transform: scale(0.96);
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.2);
	}
	
	.modal-footer {
		display: flex;
		padding: 0 32rpx 32rpx;
		gap: 16rpx;
	}
	
	.modal-btn {
		flex: 1;
		height: 88rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 30rpx;
		border-radius: 44rpx;
		font-weight: 500;
		transition: all 0.2s;
	}
	
	.cancel-btn {
		background: #f5f7fa;
		color: #666;
	}
	
	.cancel-btn:active {
		background: #e8ecf0;
		transform: scale(0.98);
	}
	
	.confirm-btn {
		background: $gradient-primary;
		color: #ffffff;
		box-shadow: 0 8rpx 20rpx rgba(82, 196, 26, 0.3);
	}
	
	.confirm-btn:active {
		transform: scale(0.98);
		box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.3);
	}

	/* 账单卡片 - 美团风格优化 */
	.bills-card {
		background: $bg-white;
		border-radius: $radius-lg; /* 美团风格：更小的圆角 */
		padding: 24rpx;
		margin-bottom: $spacing-xl;
		box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
		border: 1rpx solid $border-light;
	}

	.card-title {
		font-size: $font-size-base; /* 美团风格：标准字号 */
		font-weight: $font-weight-semibold;
		color: $text-primary;
		margin-bottom: $spacing-md;
		padding-bottom: $spacing-sm;
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
		gap: $spacing-sm;
	}

	.bill-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 20rpx 16rpx; /* 美团风格：更紧凑的内边距 */
		background: $bg-white;
		border-radius: $radius-md; /* 美团风格：更小的圆角 */
		transition: all $transition-fast;
		position: relative;
		box-shadow: none; /* 美团风格：去掉阴影 */
		border: 1rpx solid $border-light;
		overflow: hidden;
	}
	
	/* 左侧绿色装饰线 */
	.bill-item::before {
		content: '';
		position: absolute;
		left: 0;
		top: 0;
		bottom: 0;
		width: 4rpx; /* 美团风格：更细的装饰线 */
		background: linear-gradient(180deg, #52C41A 0%, #73D13D 100%);
		border-radius: 0 2rpx 2rpx 0;
	}
	
	.bill-item:active {
		background: $bg-gray;
		transform: scale(0.99);
		box-shadow: none;
	}

	.bill-left {
		display: flex;
		align-items: center;
		flex: 1;
		min-width: 0;
		padding-left: $spacing-sm;
	}

	.bill-icon {
		font-size: 40rpx; /* 美团风格：稍小的图标 */
		margin-right: $spacing-md;
		width: 64rpx; /* 美团风格：更小的图标容器 */
		height: 64rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: $bg-light;
		border-radius: $radius-md; /* 美团风格：更小的圆角 */
		flex-shrink: 0;
	}
	
	.bill-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 6rpx;
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
		gap: 6rpx;
		flex-shrink: 0;
		margin-left: $spacing-md;
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
		color: #52C41A;
	}

	.bill-date {
		font-size: $font-size-xs;
		color: $text-tertiary;
	}

	.empty-tip {
		text-align: center;
		padding: 60rpx 0;
		font-size: $font-size-md;
		color: $text-tertiary;
	}
	
	/* 悬浮记账按钮区域 */
	.float-btn-area {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		height: 100%;
		pointer-events: none;
		z-index: 999;
	}
	
	/* 悬浮记账按钮 */
	.float-add-btn {
		position: relative;
		width: 120rpx;
		height: 120rpx;
		background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
		border-radius: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		box-shadow: 0 16rpx 40rpx rgba(82, 196, 26, 0.45), 0 4rpx 12rpx rgba(82, 196, 26, 0.25);
		transition: all $transition-fast;
		overflow: hidden;
		border: 3rpx solid rgba(255, 255, 255, 0.5);
		pointer-events: auto;
	}
	
	.float-add-btn::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -50%;
		width: 200%;
		height: 200%;
		background: radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%);
		animation: shimmer 3s ease-in-out infinite;
	}
	
	@keyframes shimmer {
		0%, 100% {
			transform: translate(0, 0);
			opacity: 0.6;
		}
		50% {
			transform: translate(-20%, -20%);
			opacity: 0.3;
		}
	}
	
	.float-add-btn::after {
		content: '';
		position: absolute;
		inset: 0;
		border-radius: 60rpx;
		padding: 3rpx;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%);
		-webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
		-webkit-mask-composite: xor;
		mask-composite: exclude;
		pointer-events: none;
	}
	
	.float-add-btn:active {
		transform: scale(0.92);
		box-shadow: 0 12rpx 32rpx rgba(82, 196, 26, 0.4), 0 4rpx 12rpx rgba(82, 196, 26, 0.2);
	}
	
	.add-icon {
		font-size: 64rpx;
		color: $text-white;
		font-weight: 200;
		line-height: 1;
		text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.15);
		z-index: 1;
	}
</style>

<style lang="scss">
/* 样式穿透修改picker确定按钮颜色 */
@import "@/styles/variables.scss";

::v-deep .uni-picker-action-confirm,
::v-deep .uni-picker__action-btn-confirm {
	color: $primary-color !important;
}
</style>
