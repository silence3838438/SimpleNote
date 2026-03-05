<template>
	<view class="container">
		<!-- 顶部标题 -->
		<view class="header-section">
			<view class="header-title">确认账单信息</view>
			<view class="header-subtitle">请核对并完善账单详情</view>
		</view>
		
		<!-- 表单卡片 -->
		<view class="form-card">
			<!-- 类型切换 -->
			<view class="type-switcher">
				<view 
					class="type-btn" 
					:class="{ 'active': data.billData.type === 'expense' }"
					@click="switchType('expense')"
				>
					<text class="type-text">支出</text>
				</view>
				<view 
					class="type-btn" 
					:class="{ 'active': data.billData.type === 'income' }"
					@click="switchType('income')"
				>
					<text class="type-text">收入</text>
				</view>
			</view>
			
			<!-- 调试信息 -->
			<view class="debug-info" v-if="data.showDebug">
				<text class="debug-title">调试信息：</text>
				<text class="debug-text">历史商家数量: {{ data.recentMerchants.length }}</text>
				<text class="debug-text">历史商家: {{ JSON.stringify(data.recentMerchants) }}</text>
				<text class="debug-text">推荐分类ID: {{ data.recommendedCategoryId || '无' }}</text>
				<text class="debug-text">当前时间: {{ new Date().getHours() }}点</text>
				<text class="debug-text">是否显示历史商家: {{ data.recentMerchants.length > 0 ? '是' : '否' }}</text>
			</view>
			
			<!-- 金额 -->
			<view class="form-item amount-item">
				<view class="item-label">
					<text class="label-text">金额</text>
				</view>
				<view class="item-content amount-content">
					<text class="currency">¥</text>
					<input 
						class="amount-input" 
						type="number" 
						v-model="data.billData.amount"
						placeholder="0"
						placeholder-style="color: rgba(255, 111, 0, 0.3); font-size: 28px;"
					/>
				</view>
				<!-- 快捷金额按钮 -->
				<view class="quick-amounts">
					<view 
						class="quick-amount-btn" 
						v-for="amount in data.quickAmounts" 
						:key="amount"
						@click="selectQuickAmount(amount)"
					>
						{{ amount }}
					</view>
				</view>
			</view>
			
			<!-- 分类 -->
			<view class="form-item" @click="data.showCategoryPicker = true">
				<view class="item-label">
					<text class="label-text">分类</text>
				</view>
				<view class="item-content">
					<text class="category-value" v-if="data.selectedCategory.name">
						<text class="category-icon">{{ data.selectedCategory.icon }}</text>
						{{ data.selectedCategory.name }}
					</text>
					<text class="item-value placeholder" v-else>请选择分类</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			
			<!-- 日期 -->
			<view class="form-item" @click="openDatePicker">
				<view class="item-label">
					<text class="label-text">日期</text>
				</view>
				<view class="item-content">
					<text class="item-value" :class="{ 'placeholder': !data.billData.date }">
						{{ data.billData.date ? formatDate(data.billData.date) : '请选择日期' }}
					</text>
					<text class="item-arrow">›</text>
				</view>
			</view>
			
			<!-- 商家/来源 -->
			<view class="form-item" v-if="data.billData.type === 'expense' || data.billData.type === 'income'">
				<view class="item-label">
					<text class="label-text">{{ data.billData.type === 'income' ? '来源' : '商家' }}</text>
					<text class="label-optional">（可选）</text>
				</view>
				<view class="item-content">
					<input 
						class="text-input" 
						:class="{ 'fade-in': data.merchantUpdated }"
						v-model="data.billData.merchant"
						:placeholder="data.billData.type === 'income' ? '请输入具体来源，如：公司月薪、兼职收入' : '请输入商家名称，如：星巴克、麦当劳'"
					/>
				</view>
				<!-- 历史商家/来源快速选择 -->
				<view class="recent-merchants" v-if="data.recentMerchants.length > 0">
					<text class="recent-label">最近使用：</text>
					<view class="merchant-tags">
						<view 
							class="merchant-tag" 
							v-for="(merchant, index) in data.recentMerchants" 
							:key="index"
							@click="selectMerchant(merchant)"
						>
							{{ merchant }}
						</view>
					</view>
				</view>
			</view>
			
			<!-- 备注 -->
			<view class="form-item remark-item">
				<view class="item-label">
					<text class="label-text">备注</text>
					<text class="label-optional">（可选）</text>
				</view>
				<view class="item-content full">
					<input 
						class="text-input full" 
						:class="{ 'fade-in': data.remarkUpdated }"
						v-model="data.billData.remark"
						placeholder="添加备注信息"
					/>
				</view>
			</view>
		</view>
		
		<!-- 保存按钮 -->
		<view class="save-btn-area">
			<button class="save-btn" @click="saveBill" :disabled="data.saving">
				<text v-if="!data.saving">{{ data.editMode ? '更新账单' : '保存账单' }}</text>
				<text v-else>{{ data.editMode ? '更新中...' : '保存中...' }}</text>
			</button>
		</view>
		
		<!-- 分类选择器 -->
		<view class="category-picker" v-if="data.showCategoryPicker" @click="data.showCategoryPicker = false">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-title">选择分类</text>
					<text class="picker-close" @click="data.showCategoryPicker = false">✕</text>
				</view>
				<view class="category-grid">
					<view 
						class="category-item" 
						v-for="category in data.categories" 
						:key="category.id"
						:class="{ 
							'active': data.billData.categoryId === category.id,
							'recommended': !data.billData.categoryId && data.recommendedCategoryId === category.id
						}"
						@click="selectCategory(category)"
					>
						<view class="category-item-badge" v-if="!data.billData.categoryId && data.recommendedCategoryId === category.id">
							<text class="badge-text">推荐</text>
						</view>
						<text class="category-item-icon">{{ category.icon }}</text>
						<text class="category-item-name">{{ category.name }}</text>
					</view>
				</view>
			</view>
		</view>
		
		<!-- 日期选择器 -->
		<view class="date-picker-modal" v-if="data.showDatePicker" @click="closeDatePicker">
			<view class="picker-content" @click.stop>
				<view class="picker-header">
					<text class="picker-cancel" @click="closeDatePicker">取消</text>
					<text class="picker-title">选择日期</text>
					<text class="picker-confirm" @click="confirmDate">确定</text>
				</view>
				<picker-view class="picker-view" :value="data.pickerValue" @change="onPickerChange">
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[0] }"
							v-for="(year, index) in data.years" 
							:key="index">
							{{ year }}年
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[1] }"
							v-for="(month, index) in data.months" 
							:key="index">
							{{ month }}月
						</view>
					</picker-view-column>
					<picker-view-column>
						<view 
							class="picker-item" 
							:class="{ 'picker-item-selected': index === data.pickerValue[2] }"
							v-for="(day, index) in data.days" 
							:key="index">
							{{ day }}日
						</view>
					</picker-view-column>
				</picker-view>
			</view>
		</view>
		
		<!-- 拍照识别加载遮罩 -->
		<view class="loading-mask" v-if="data.isLoading">
			<view class="loading-card">
				<view class="loading-spinner">
					<view class="spinner-ring"></view>
					<view class="spinner-ring"></view>
					<view class="spinner-ring"></view>
				</view>
				<text class="loading-title">智能识别中</text>
				<text class="loading-text">正在识别小票信息...</text>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'
import { getExpenseCategories, getIncomeCategories } from '@/utils/category.js'

const data = reactive({
	billData: {
		amount: 0,
		merchant: '',
		categoryId: null,
		categoryName: '',
		date: '',
		remark: '',
		type: 'expense' // 默认为支出
	},
	categories: [],
	selectedCategory: {},
	showCategoryPicker: false,
	showDatePicker: false,
	saving: false,
	editMode: false, // 编辑模式
	billId: null, // 编辑的账单ID
	billCloudId: null, // 编辑的账单云端ID
	// 日期选择器相关
	pickerValue: [0, 0, 0],
	years: [],
	months: [],
	days: [],
	tempYear: '',
	tempMonth: '',
	tempDay: '',
	// 快捷金额
	quickAmounts: [10, 20, 50, 100, 200, 500],
	// 历史商家
	recentMerchants: [],
	// 推荐的分类ID
	recommendedCategoryId: null,
	// 调试模式
	showDebug: false,
	// 保存原始数据（用于类型切换时恢复）
	originalBillData: null,
	// 淡入动画标记
	merchantUpdated: false,
	remarkUpdated: false,
	// 拍照识别加载状态
	isLoading: false
})

onLoad((options) => {
	// #ifdef APP-PLUS
	// APP端：检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		uni.showModal({
			title: '提示',
			content: '请先登录后再使用记账功能',
			confirmText: '去登录',
			cancelText: '返回',
			success: (res) => {
				if (res.confirm) {
					uni.navigateTo({ url: '/pages/user/login' })
				} else {
					uni.navigateBack()
				}
			}
		})
		return
	}
	// #endif
	
	// #ifdef MP-WEIXIN
	// 小程序端：已自动登录，无需检查
	// #endif
	
	// 根据类型加载对应的分类
	const billType = options.type || 'expense'
	data.billData.type = billType
	data.categories = billType === 'income' ? getIncomeCategories() : getExpenseCategories()
	console.log('加载的分类列表:', data.categories)
	
	// 监听 AI 增强完成事件
	uni.$on('aiEnhanced', handleAIEnhanced)
	
	// 监听 OCR 识别完成事件（拍照识别）
	uni.$on('ocrRecognized', handleOCRRecognized)
	
	// 检查是否为加载状态（拍照识别）
	if (options.loading === 'true') {
		console.log('📸 拍照识别模式：显示加载状态')
		data.isLoading = true
		// 其他初始化逻辑照常执行
	}
	
	// 检查是否为编辑模式
	if (options.editMode === 'true' && options.billId) {
		data.editMode = true
		data.billId = parseInt(options.billId)
		loadBillForEdit()
	} else if (options.data) {
		try {
			const parsedData = JSON.parse(decodeURIComponent(options.data))
			console.log('✅ 接收到的语音识别数据:', parsedData)
			console.log('  - 金额:', parsedData.amount)
			console.log('  - 商家:', parsedData.merchant)
			console.log('  - 分类ID:', parsedData.categoryId)
			console.log('  - 分类名:', parsedData.categoryName)
			console.log('  - 日期:', parsedData.date)
			console.log('  - 类型:', parsedData.type)
			console.log('  - 备注:', parsedData.remark)
			
			// 先根据类型加载分类列表（必须在合并数据之前）
			const dataType = parsedData.type || billType
			data.categories = dataType === 'income' ? getIncomeCategories() : getExpenseCategories()
			console.log('✅ 根据类型加载分类列表:', dataType, '分类数量:', data.categories.length)
			
			// 然后合并数据
			data.billData = {
				...data.billData,
				...parsedData,
				amount: parsedData.amount || 0,
				type: dataType
			}
			
			console.log('✅ 合并后的billData:', JSON.stringify(data.billData, null, 2))
			
			// 验证关键字段
			if (!data.billData.merchant) {
				console.warn('⚠️ 警告：商家字段为空')
			}
			if (!data.billData.categoryId) {
				console.warn('⚠️ 警告：分类ID为空')
			}
			if (!data.billData.categoryName) {
				console.warn('⚠️ 警告：分类名称为空')
			}
			
			// 根据类型设置快捷金额
			if (data.billData.type === 'income') {
				data.quickAmounts = [100, 500, 1000, 2000, 5000, 10000]
			} else {
				data.quickAmounts = [10, 20, 50, 100, 200, 500]
			}
		} catch (error) {
			console.error('❌ 解析数据失败:', error)
			console.error('❌ 错误详情:', error.message)
			console.error('❌ 原始数据:', options.data)
		}
	}
	
	// 如果没有日期，设置默认日期为今天
	if (!data.billData.date) {
		const now = new Date()
		const year = now.getFullYear()
		const month = (now.getMonth() + 1).toString().padStart(2, '0')
		const day = now.getDate().toString().padStart(2, '0')
		data.billData.date = `${year}-${month}-${day}`
	}
	
	// 初始化日期选择器
	initDatePicker()
	
	// 更新分类显示
	updateSelectedCategory()
	
	// 智能推荐分类（如果还没有选择分类）
	if (!data.billData.categoryId) {
		recommendCategory()
	}
	
	// 延迟加载历史商家，确保页面已经渲染
	setTimeout(() => {
		loadRecentMerchants()
	}, 500)
	
	// 保存原始数据的深拷贝（用于类型切换时恢复）
	data.originalBillData = JSON.parse(JSON.stringify(data.billData))
	
	// 最终状态验证和调试输出
	console.log('📊 页面加载完成，最终状态:')
	console.log('  - billData:', JSON.stringify(data.billData, null, 2))
	console.log('  - selectedCategory:', JSON.stringify(data.selectedCategory, null, 2))
	console.log('  - categories数量:', data.categories.length)
	console.log('  - 商家显示:', data.billData.merchant || '(空)')
	console.log('  - 分类显示:', data.selectedCategory.name || '(空)')
	console.log('  - 备注显示:', data.billData.remark || '(空)')
	
	// 如果关键字段为空，输出警告
	if (!data.billData.merchant) {
		console.warn('⚠️⚠️⚠️ 商家字段为空！')
	}
	if (!data.selectedCategory.name) {
		console.warn('⚠️⚠️⚠️ 分类未正确设置！')
	}

})

// 页面卸载时移除事件监听
onUnmounted(() => {
	uni.$off('aiEnhanced', handleAIEnhanced)
	uni.$off('ocrRecognized', handleOCRRecognized)
})

// 处理 OCR 识别完成（拍照识别）
const handleOCRRecognized = (ocrResult) => {
	console.log('📸 收到 OCR 识别结果:', ocrResult)
	
	// 关闭加载状态
	data.isLoading = false
	
	// 如果识别失败，显示错误提示
	if (ocrResult.error) {
		uni.showToast({
			title: ocrResult.error,
			icon: 'none',
			duration: 2000
		})
	}
	
	// 更新账单数据
	const dataType = ocrResult.type || 'expense'
	data.categories = dataType === 'income' ? getIncomeCategories() : getExpenseCategories()
	
	data.billData = {
		...data.billData,
		...ocrResult,
		amount: ocrResult.amount || 0,
		type: dataType
	}
	
	// 更新分类显示
	updateSelectedCategory()
	
	// 智能推荐分类
	if (!data.billData.categoryId) {
		recommendCategory()
	}
	
	// 加载历史商家
	loadRecentMerchants()
}

// 处理 AI 增强完成
const handleAIEnhanced = (aiResult) => {
	console.log('🎯 收到 AI 增强结果:', aiResult)
	
	// 【修复】AI 提取的金额优先（如果 AI 提取到了且大于0）
	if (aiResult.amount && aiResult.amount > 0 && aiResult.amount !== data.billData.amount) {
		console.log('📝 更新金额:', data.billData.amount, '->', aiResult.amount)
		data.billData.amount = aiResult.amount
	}
	
	// 平滑更新，只更新更准确的字段
	if (aiResult.merchant && aiResult.merchant !== data.billData.merchant) {
		console.log('📝 更新商家:', data.billData.merchant, '->', aiResult.merchant)
		data.billData.merchant = aiResult.merchant
		// 触发淡入动画
		data.merchantUpdated = true
		setTimeout(() => {
			data.merchantUpdated = false
		}, 600)
	}
	
	// AI备注增强：AI提取的备注更完整，优先使用AI备注
	if (aiResult.remark && aiResult.remark !== data.billData.remark) {
		// AI备注通常更完整，直接使用
		console.log('📝 更新备注:', data.billData.remark, '->', aiResult.remark)
		data.billData.remark = aiResult.remark
		// 触发淡入动画
		data.remarkUpdated = true
		setTimeout(() => {
			data.remarkUpdated = false
		}, 600)
	}
	
	if (aiResult.categoryId && aiResult.categoryId !== data.billData.categoryId) {
		console.log('📝 更新分类:', data.billData.categoryName, '->', aiResult.categoryName)
		data.billData.categoryId = aiResult.categoryId
		data.billData.categoryName = aiResult.categoryName
		updateSelectedCategory()
	}
}

const initDatePicker = () => {
	const now = new Date()
	const currentYear = now.getFullYear()
	const currentMonth = now.getMonth() + 1
	const currentDay = now.getDate()
	
	// 生成年份列表（前后5年）
	data.years = []
	for (let i = currentYear - 5; i <= currentYear + 5; i++) {
		data.years.push(i)
	}
	
	// 生成月份列表
	data.months = []
	for (let i = 1; i <= 12; i++) {
		data.months.push(i.toString().padStart(2, '0'))
	}
	
	// 如果已有日期，使用已有日期；否则使用当前日期
	let year, month, day
	if (data.billData.date) {
		[year, month, day] = data.billData.date.split('-').map(v => parseInt(v))
	} else {
		year = currentYear
		month = currentMonth
		day = currentDay
	}
	
	// 生成日期列表
	updateDays(year, month)
	
	// 设置选择器位置
	const yearIndex = data.years.indexOf(year)
	const monthIndex = month - 1
	const dayIndex = day - 1
	data.pickerValue = [yearIndex, monthIndex, dayIndex]
	data.tempYear = year
	data.tempMonth = month
	data.tempDay = day
}

const updateDays = (year, month) => {
	const daysInMonth = new Date(year, month, 0).getDate()
	data.days = []
	for (let i = 1; i <= daysInMonth; i++) {
		data.days.push(i.toString().padStart(2, '0'))
	}
}

const updateSelectedCategory = () => {
	console.log('🔍 updateSelectedCategory 被调用');
	console.log('  - billData.categoryId:', data.billData.categoryId);
	console.log('  - billData.categoryName:', data.billData.categoryName);
	console.log('  - categories 数量:', data.categories.length);
	console.log('  - billData.type:', data.billData.type);
	
	// 如果有 categoryId，通过 ID 查找
	if (data.billData.categoryId) {
		const category = data.categories.find(c => c.id === data.billData.categoryId)
		console.log('  - 通过 ID 找到的分类:', category);
		
		if (category) {
			// 使用 Vue 的响应式赋值
			Object.assign(data.selectedCategory, category)
			data.billData.categoryName = category.name
			console.log('✅ 分类已更新:', JSON.stringify(category))
			
			// 强制触发视图更新
			console.log('✅ 当前 selectedCategory:', JSON.stringify(data.selectedCategory))
			return
		} else {
			console.log('⚠️ 未找到ID为', data.billData.categoryId, '的分类')
			console.log('  - 可用分类IDs:', data.categories.map(c => c.id).join(', '))
		}
	}
	
	// 如果有 categoryName 但没有 categoryId，通过名称查找
	if (data.billData.categoryName) {
		const categoryByName = data.categories.find(c => c.name === data.billData.categoryName)
		console.log('  - 通过名称找到的分类:', categoryByName);
		
		if (categoryByName) {
			// 使用 Vue 的响应式赋值
			Object.assign(data.selectedCategory, categoryByName)
			data.billData.categoryId = categoryByName.id
			console.log('✅ 通过名称找到分类并设置 ID:', JSON.stringify(categoryByName))
			return
		} else {
			console.log('⚠️ 未找到名称为', data.billData.categoryName, '的分类')
			console.log('  - 可用分类名称:', data.categories.map(c => c.name).join(', '))
		}
		
		// 如果找不到匹配的分类，创建临时对象
		const tempCategory = {
			id: data.billData.categoryId || null,
			name: data.billData.categoryName,
			icon: '📦' // 默认图标
		}
		Object.assign(data.selectedCategory, tempCategory)
		console.log('⚠️ 使用现有分类名称创建临时对象:', JSON.stringify(data.selectedCategory))
		return
	}
	
	// 都没有，清空
	console.log('⚠️ 没有分类信息，清空 selectedCategory');
	data.selectedCategory = {}
	data.billData.categoryName = ''
}

const loadBillForEdit = async () => {
	uni.showLoading({ title: '加载中...' })
	try {
		const bills = await billStorage.getFromAPI()
		const bill = bills.find(b => b.id === data.billId)
		
		if (bill) {
			data.billData = {
				amount: bill.amount,
				merchant: bill.merchant,
				categoryId: bill.categoryId,
				categoryName: bill.categoryName || '',
				date: bill.date,
				remark: bill.remark || '',
				type: bill.type || 'expense' // 添加类型字段，默认为支出
			}
			data.billCloudId = bill._id
			
			// 根据账单类型重新加载分类
			data.categories = data.billData.type === 'income' ? getIncomeCategories() : getExpenseCategories()
			
			// 根据类型设置快捷金额
			if (data.billData.type === 'income') {
				data.quickAmounts = [100, 500, 1000, 2000, 5000, 10000]
			} else {
				data.quickAmounts = [10, 20, 50, 100, 200, 500]
			}
			
			updateSelectedCategory()
		} else {
			uni.showToast({
				title: '账单不存在',
				icon: 'none'
			})
			setTimeout(() => {
				uni.navigateBack()
			}, 1500)
		}
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

const selectCategory = (category) => {
	data.billData.categoryId = category.id
	data.billData.categoryName = category.name
	updateSelectedCategory()
	data.showCategoryPicker = false
	
	// 收入类型时，不自动填充商家名称，让用户自己填写具体来源
	// 这样可以避免主标题和副标题显示重复的问题
}

const openDatePicker = () => {
	// 如果还没有初始化日期选择器，先初始化
	if (data.years.length === 0) {
		initDatePicker()
	}
	data.showDatePicker = true
}

const closeDatePicker = () => {
	data.showDatePicker = false
}

const onPickerChange = (e) => {
	const val = e.detail.value
	const newYear = data.years[val[0]]
	const newMonth = parseInt(data.months[val[1]])
	
	// 检查年月是否变化
	if (newYear !== data.tempYear || newMonth !== data.tempMonth) {
		// 更新天数列表
		const oldDaysCount = data.days.length
		updateDays(newYear, newMonth)
		
		// 如果当前选中的天数超出了新月份的天数，调整到最后一天
		const newDaysCount = data.days.length
		if (val[2] >= newDaysCount) {
			data.pickerValue = [val[0], val[1], newDaysCount - 1]
			data.tempDay = newDaysCount
		} else {
			data.pickerValue = val
			data.tempDay = parseInt(data.days[val[2]])
		}
	} else {
		data.pickerValue = val
		data.tempDay = parseInt(data.days[val[2]])
	}
	
	data.tempYear = newYear
	data.tempMonth = newMonth
}

const confirmDate = () => {
	const year = data.tempYear
	const month = data.tempMonth.toString().padStart(2, '0')
	const day = data.tempDay.toString().padStart(2, '0')
	data.billData.date = `${year}-${month}-${day}`
	data.showDatePicker = false
}

const formatDate = (dateStr) => {
	if (!dateStr) return ''
	
	// 解析日期字符串(格式: YYYY-MM-DD)
	const [year, month, day] = dateStr.split('-').map(Number)
	const date = new Date(year, month - 1, day) // 月份从0开始
	
	// 获取今天的日期(只比较日期部分,不比较时间)
	const now = new Date()
	const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
	const targetDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())
	
	// 计算天数差(只比较日期,不受时间影响)
	const diff = Math.floor((today - targetDate) / (1000 * 60 * 60 * 24))
	
	if (diff === 0) return '今天'
	if (diff === 1) return '昨天'
	if (diff === 2) return '前天'
	
	return `${year}年${month.toString().padStart(2, '0')}月${day.toString().padStart(2, '0')}日`
}

const onDateChange = (e) => {
	data.billData.date = e.detail.value
}

// 快捷金额选择
const selectQuickAmount = (amount) => {
	data.billData.amount = amount
	uni.vibrateShort()
}

// 切换收入/支出类型
const switchType = (type) => {
	if (data.billData.type === type) return
	
	// 如果切换回原始类型，恢复原始数据
	if (data.originalBillData && type === data.originalBillData.type) {
		data.billData = JSON.parse(JSON.stringify(data.originalBillData))
		data.categories = type === 'income' ? getIncomeCategories() : getExpenseCategories()
		updateSelectedCategory()
		
		// 根据类型设置快捷金额
		if (type === 'income') {
			data.quickAmounts = [100, 500, 1000, 2000, 5000, 10000]
		} else {
			data.quickAmounts = [10, 20, 50, 100, 200, 500]
		}
		
		// 重新加载历史记录
		loadRecentMerchants()
		
		uni.vibrateShort()
		return
	}
	
	// 切换到非原始类型，清空数据
	data.billData.type = type
	// 切换分类列表
	data.categories = type === 'income' ? getIncomeCategories() : getExpenseCategories()
	// 清空当前选择的分类
	data.billData.categoryId = null
	data.billData.categoryName = ''
	data.selectedCategory = {}
	// 清空金额和商家/来源，但保留日期
	data.billData.amount = 0
	data.billData.merchant = ''
	// 不清空日期，保持用户选择的日期或默认的今天
	// data.billData.date = '' // 移除这行，保留日期
	// 重新推荐分类
	recommendCategory()
	
	// 根据类型切换快捷金额
	if (type === 'income') {
		data.quickAmounts = [100, 500, 1000, 2000, 5000, 10000]
	} else {
		data.quickAmounts = [10, 20, 50, 100, 200, 500]
	}
	
	// 重新加载历史记录（根据新类型）
	loadRecentMerchants()
	
	uni.vibrateShort()
}

// 选择历史商家
const selectMerchant = (merchant) => {
	data.billData.merchant = merchant
	uni.vibrateShort()
}

// 加载历史商家/来源（根据类型筛选）
const loadRecentMerchants = () => {
	try {
		// 使用billStorage获取本地账单
		const bills = billStorage.getLocalBills()
		console.log('从billStorage读取账单数量:', bills.length)
		
		if (!bills || bills.length === 0) {
			console.log('本地存储中没有账单数据')
			return
		}
		
		// 根据当前类型筛选账单
		const currentType = data.billData.type || 'expense'
		const filteredBills = bills.filter(bill => {
			// 如果账单没有type字段，默认为支出
			const billType = bill.type || 'expense'
			return billType === currentType
		})
		
		console.log(`筛选后的${currentType === 'income' ? '收入' : '支出'}账单数量:`, filteredBills.length)
		
		// 统计商家/来源出现频率
		const merchantCount = {}
		filteredBills.forEach(bill => {
			if (bill.merchant && bill.merchant.trim()) {
				merchantCount[bill.merchant] = (merchantCount[bill.merchant] || 0) + 1
			}
		})
		
		console.log('商家/来源统计结果:', merchantCount)
		
		// 按频率排序，取前4个
		const sortedMerchants = Object.entries(merchantCount)
			.sort((a, b) => b[1] - a[1])
			.slice(0, 4)
			.map(item => item[0])
		
		// 使用splice强制触发响应式更新
		data.recentMerchants.splice(0, data.recentMerchants.length, ...sortedMerchants)
		console.log(`最终历史${currentType === 'income' ? '来源' : '商家'}列表:`, data.recentMerchants)
		
		// 如果没有历史记录，显示提示
		if (data.recentMerchants.length === 0) {
			console.log(`暂无历史${currentType === 'income' ? '来源' : '商家'}数据`)
		}
	} catch (error) {
		console.error('加载历史商家/来源失败:', error)
	}
}

// 智能推荐分类
const recommendCategory = () => {
	const now = new Date()
	const hour = now.getHours()
	const day = now.getDate()
	
	console.log('当前时间:', hour, '点，日期:', day, '号')
	
	let recommendedCategoryName = ''
	
	// 根据类型推荐不同的分类
	if (data.billData.type === 'income') {
		// 收入类型的推荐逻辑
		if (day >= 1 && day <= 10) {
			recommendedCategoryName = '工资' // 月初：工资发放
			console.log('推荐时段: 月初发工资')
		} else if (day >= 25 && day <= 31) {
			recommendedCategoryName = '工资' // 月末：工资发放
			console.log('推荐时段: 月末发工资')
		} else if (hour >= 9 && hour < 18) {
			recommendedCategoryName = '兼职' // 工作时间：可能是兼职收入
			console.log('推荐时段: 工作时间-兼职')
		} else if (hour >= 18 && hour < 22) {
			recommendedCategoryName = '红包' // 晚上：可能收到红包
			console.log('推荐时段: 晚上-红包')
		} else {
			recommendedCategoryName = '其他' // 其他时间
			console.log('推荐时段: 其他收入')
		}
	} else {
		// 支出类型的推荐逻辑（原有逻辑）
		if (hour >= 6 && hour < 11) {
			recommendedCategoryName = '餐饮' // 早餐时间：6-11点
			console.log('推荐时段: 早餐')
		} else if (hour >= 11 && hour < 15) {
			recommendedCategoryName = '餐饮' // 午餐时间：11-15点
			console.log('推荐时段: 午餐')
		} else if (hour >= 17 && hour < 22) {
			recommendedCategoryName = '餐饮' // 晚餐时间：17-22点
			console.log('推荐时段: 晚餐')
		} else if ((hour >= 7 && hour < 10) || (hour >= 16 && hour < 19)) {
			recommendedCategoryName = '交通' // 上下班时间：7-10点、16-19点
			console.log('推荐时段: 上下班')
		} else if (hour >= 15 && hour < 17) {
			recommendedCategoryName = '娱乐' // 下午茶/休闲时间：15-17点
			console.log('推荐时段: 休闲娱乐')
		} else if (hour >= 22 || hour < 6) {
			recommendedCategoryName = '娱乐' // 夜间娱乐：22点-6点
			console.log('推荐时段: 夜间娱乐')
		} else {
			console.log('当前时间不在推荐时段')
		}
	}
	
	// 如果有推荐的分类名，查找对应的分类
	if (recommendedCategoryName) {
		const category = data.categories.find(c => c.name === recommendedCategoryName)
		if (category) {
			data.recommendedCategoryId = category.id
			console.log('✅ 智能推荐分类:', category.name, '(ID:', category.id, ')')
		} else {
			console.log('❌ 未找到推荐的分类:', recommendedCategoryName)
			console.log('可用分类:', data.categories.map(c => c.name).join(', '))
		}
	}
}

const saveBill = async () => {
	// 必填字段验证
	if (!data.billData.amount || data.billData.amount <= 0) {
		uni.showToast({
			title: '请输入正确的金额',
			icon: 'none'
		})
		return
	}
	
	if (!data.billData.categoryId || !data.selectedCategory.name) {
		uni.showToast({
			title: '请选择分类',
			icon: 'none'
		})
		return
	}
	
	if (!data.billData.date) {
		uni.showToast({
			title: '请选择日期',
			icon: 'none'
		})
		return
	}
	
	// 商家/来源字段改为选填，不再强制验证
	// 如果用户没有填写，保存时会是空字符串，这是允许的
	
	if (data.saving) return
	data.saving = true
	
	// 立即标记今天已记账,避免返回首页时弹出"今天没记账"提示
	// 必须在保存前就设置,因为跳转回首页时 App.vue 的 onShow 会立即检查
	const today = new Date().toDateString()
	uni.setStorageSync('lastReminderDate', today)
	console.log('✅ 开始记账,已标记今天已记账:', today)
	
	uni.showLoading({ title: data.editMode ? '更新中...' : '保存中...' })
	
	let result
	if (data.editMode) {
		// 编辑模式：先删除旧账单，再保存新账单
		await billStorage.deleteBill(data.billId, data.billCloudId)
		result = await billStorage.saveBill({
			...data.billData,
			amount: parseFloat(data.billData.amount)
		})
	} else {
		// 新增模式
		result = await billStorage.saveBill({
			...data.billData,
			amount: parseFloat(data.billData.amount)
		})
	}
	
	data.saving = false
	uni.hideLoading()
	
	if (result.success) {
		// 立即通知首页和统计页刷新（通过全局事件）
		uni.$emit('billSaved')
		
		// 同时设置标记作为备用
		uni.setStorageSync('needRefreshHome', true)
		uni.setStorageSync('needRefreshStatistics', true)
		uni.setStorageSync('needRefreshBills', true)
		
		// 编辑模式：直接返回首页
		if (data.editMode) {
			uni.showToast({
				title: '更新成功',
				icon: 'success',
				duration: 1500
			})
			setTimeout(() => {
				uni.switchTab({
					url: '/pages/tab/index/index'
				})
			}, 1500)
		} else {
			// 新增模式：显示订阅引导弹框
			showReminderSubscribeGuide()
		}
	} else {
		uni.showToast({
			title: data.editMode ? '更新失败，请重试' : '保存失败，请重试',
			icon: 'none'
		})
	}
}

// 显示记账提醒订阅引导
const showReminderSubscribeGuide = () => {
	// 检查是否已经开启了提醒（通过reminderEnabled和reminderTime判断）
	const reminderEnabled = uni.getStorageSync('reminderEnabled') || false
	const reminderTime = uni.getStorageSync('reminderTime') || ''
	
	// 检查是否已经拒绝过（今天）
	const lastRefuseDate = uni.getStorageSync('lastRefuseReminderDate') || ''
	const today = new Date().toISOString().split('T')[0]
	
	// 如果已开启提醒或今天已拒绝过，直接返回首页
	if ((reminderEnabled && reminderTime) || lastRefuseDate === today) {
		uni.showToast({
			title: data.editMode ? '更新成功' : '记账成功',
			icon: 'success',
			duration: 1500
		})
		setTimeout(() => {
			uni.navigateBack({
				delta: data.editMode ? 1 : 2
			})
		}, 1500)
		return
	}
	
	uni.showModal({
		title: '✅ 记账成功',
		content: '开启每日提醒，养成记账好习惯？',
		confirmText: '开启提醒',
		cancelText: '暂不需要',
		confirmColor: '#52C41A',
		success: (res) => {
			if (res.confirm) {
				// 用户点击开启提醒，跳转到订阅页面
				subscribeReminder()
			} else {
				// 用户点击暂不需要，记录今天已拒绝，返回首页
				uni.setStorageSync('lastRefuseReminderDate', today)
				uni.switchTab({
					url: '/pages/tab/index/index'
				})
			}
		}
	})
}

// 订阅记账提醒 - 跳转到订阅设置页面
const subscribeReminder = () => {
	// 跳转到订阅设置页面，传递参数表示来自记账成功
	uni.navigateTo({
		url: '/pages/settings/reminder?from=billSuccess'
	})
}

</script>

<script>
// 分享功能配置
export default {
	onShareAppMessage() {
		return {
			title: '我刚记了一笔账，快来试试AI记账吧！',
			path: '/pages/tab/index/index?from=share',
			imageUrl: '/static/logo.png'
		}
	}
}
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.container {
		min-height: 100vh;
		background: linear-gradient(180deg, #E8F5E9 0%, #F5F7FA 50%, #FAFBFC 100%);
		padding: $spacing-lg $spacing-md;
		padding-bottom: 180rpx;
	}
	
	/* 顶部标题 */
	.header-section {
		text-align: center;
		padding: $spacing-lg 0 $spacing-xl;
		margin-bottom: $spacing-md;
		position: relative;
	}
	
	.header-title {
		font-size: $font-size-2xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
		margin-bottom: 4rpx;
		letter-spacing: 1rpx;
	}
	
	.header-subtitle {
		font-size: $font-size-sm;
		color: $text-tertiary;
		font-weight: $font-weight-normal;
	}

	/* 表单卡片 */
	.form-card {
		background: linear-gradient(135deg, #FFFFFF 0%, #FAFBFC 100%);
		border-radius: $radius-2xl;
		padding: $spacing-xl;
		box-shadow: 
			0 2rpx 8rpx rgba(0, 0, 0, 0.04),
			0 8rpx 24rpx rgba(0, 0, 0, 0.06),
			inset 0 1rpx 0 rgba(255, 255, 255, 0.8);
		border: 1rpx solid rgba(255, 255, 255, 0.8);
		position: relative;
		overflow: hidden;
	}
	
	.form-card::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 1rpx;
		background: linear-gradient(90deg, transparent, rgba(82, 196, 26, 0.15), transparent);
	}
	
	/* 分组分隔线 */
	.section-divider {
		display: flex;
		align-items: center;
		margin: $spacing-2xl 0 $spacing-xl;
		gap: $spacing-md;
	}
	
	.section-divider.optional-section {
		margin-top: $spacing-3xl;
	}
	
	.divider-line {
		flex: 1;
		height: 1rpx;
		background: linear-gradient(90deg, transparent 0%, rgba(0, 0, 0, 0.06) 50%, transparent 100%);
	}
	
	.divider-text {
		font-size: $font-size-xs;
		color: $text-tertiary;
		font-weight: $font-weight-medium;
		letter-spacing: 2rpx;
		padding: 0 $spacing-sm;
		white-space: nowrap;
	}
	
	/* 类型切换器 */
	.type-switcher {
		display: flex;
		gap: $spacing-md;
		margin-bottom: $spacing-lg;
		padding: $spacing-sm 8rpx;
		background: linear-gradient(135deg, #F5F7FA 0%, #E8EAED 100%);
		border-radius: $radius-2xl;
		box-shadow: inset 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}
	
	.type-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: $spacing-sm;
		padding: $spacing-lg;
		background: transparent;
		border-radius: $radius-xl;
		transition: all $transition-fast;
		position: relative;
		overflow: hidden;
	}
	
	.type-btn::before {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(115, 209, 61, 0.05) 100%);
		opacity: 0;
		transition: opacity $transition-fast;
	}
	
	.type-btn.active {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.08);
	}
	
	.type-btn.active::before {
		opacity: 1;
	}
	
	.type-btn:active {
		transform: scale(0.98);
	}
	
	.type-text {
		font-size: $font-size-lg;
		color: $text-secondary;
		font-weight: $font-weight-medium;
		transition: all $transition-fast;
	}
	
	.type-btn.active .type-text {
		color: $primary-color;
		font-weight: $font-weight-bold;
	}
	
	/* 调试信息 */
	.debug-info {
		background: linear-gradient(135deg, #FFF3E0 0%, #FFE0B2 100%);
		border-radius: $radius-lg;
		padding: $spacing-md;
		margin-bottom: $spacing-lg;
		border: 2rpx dashed #FF9800;
	}
	
	.debug-title {
		display: block;
		font-size: $font-size-sm;
		color: #E65100;
		font-weight: $font-weight-bold;
		margin-bottom: $spacing-xs;
	}
	
	.debug-text {
		display: block;
		font-size: $font-size-xs;
		color: #F57C00;
		line-height: $line-height-relaxed;
	}

	.form-item {
		padding: $spacing-lg $spacing-md;
		margin: 0 -#{$spacing-md};
		border-bottom: 2rpx solid rgba(0, 0, 0, 0.06);
		transition: all $transition-fast;
		position: relative;
	}
	
	.form-item::after {
		content: '';
		position: absolute;
		bottom: -2rpx;
		left: $spacing-md;
		right: $spacing-md;
		height: 2rpx;
		background: $gradient-primary;
		transform: scaleX(0);
		transition: transform $transition-fast;
	}
	
	.form-item:focus-within::after {
		transform: scaleX(1);
	}
	
	.form-item:active {
		background: rgba(82, 196, 26, 0.02);
	}

	.form-item:last-child {
		border-bottom: none;
	}
	
	.form-item.amount-item {
		background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 50%, #FFE082 100%);
		margin: 0 -#{$spacing-xl} $spacing-lg;
		padding: $spacing-2xl $spacing-xl;
		border-radius: $radius-xl;
		border-bottom: none;
		position: relative;
		overflow: hidden;
		box-shadow: 0 4rpx 16rpx rgba(255, 152, 0, 0.12);
	}
	
	.form-item.amount-item::before {
		content: '';
		position: absolute;
		top: -50%;
		right: -20%;
		width: 200rpx;
		height: 200rpx;
		background: radial-gradient(circle, rgba(255, 152, 0, 0.1) 0%, transparent 70%);
		border-radius: 50%;
	}
	
	/* 快捷金额按钮 */
	.quick-amounts {
		display: grid;
		grid-template-columns: repeat(6, 1fr);
		gap: $spacing-sm;
		margin-top: $spacing-lg;
	}
	
	.quick-amount-btn {
		height: 56rpx;
		background: linear-gradient(135deg, #FFFFFF 0%, #FFF8E1 100%);
		border-radius: $radius-lg;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: $font-size-base;
		color: #FF6F00;
		font-weight: $font-weight-semibold;
		border: 2rpx solid rgba(255, 152, 0, 0.2);
		transition: all $transition-fast;
		box-shadow: 0 2rpx 8rpx rgba(255, 152, 0, 0.08);
	}
	
	.quick-amount-btn:active {
		background: linear-gradient(135deg, #FF6F00 0%, #FF8F00 100%);
		color: $text-white;
		transform: scale(0.95);
		box-shadow: 0 4rpx 12rpx rgba(255, 111, 0, 0.25);
	}
	
	/* 历史商家 */
	.recent-merchants {
		margin-top: $spacing-lg;
		padding: $spacing-lg;
		background: linear-gradient(135deg, #E8F5E9 0%, #C8E6C9 100%);
		border-radius: $radius-xl;
		border: 2rpx solid rgba(76, 175, 80, 0.2);
		box-shadow: 0 2rpx 12rpx rgba(76, 175, 80, 0.08);
	}
	
	.recent-label {
		font-size: $font-size-xs;
		color: #52C41A;
		display: flex;
		align-items: center;
		margin-bottom: $spacing-md;
		font-weight: $font-weight-semibold;
		letter-spacing: 0.5rpx;
	}
	
	.recent-label::before {
		content: '⚡';
		font-size: $font-size-base;
		margin-right: $spacing-xs;
		animation: pulse-icon 2s ease-in-out infinite;
	}
	
	@keyframes pulse-icon {
		0%, 100% { opacity: 1; }
		50% { opacity: 0.6; }
	}
	
	.merchant-tags {
		display: flex;
		flex-wrap: wrap;
		gap: $spacing-sm;
	}
	
	.merchant-tag {
		padding: $spacing-sm $spacing-lg;
		background: linear-gradient(135deg, #FFFFFF 0%, #F1F8E9 100%);
		border-radius: $radius-2xl;
		font-size: $font-size-sm;
		color: #4CAF50;
		border: 2rpx solid rgba(76, 175, 80, 0.25);
		transition: all $transition-fast;
		font-weight: $font-weight-medium;
		box-shadow: 0 2rpx 8rpx rgba(76, 175, 80, 0.1);
		position: relative;
		overflow: hidden;
	}
	
	.merchant-tag::before {
		content: '';
		position: absolute;
		top: 0;
		left: -100%;
		width: 100%;
		height: 100%;
		background: linear-gradient(90deg, transparent, rgba(82, 196, 26, 0.1), transparent);
		transition: left 0.5s;
	}
	
	.merchant-tag:active::before {
		left: 100%;
	}
	
	.merchant-tag:active {
		background: linear-gradient(135deg, #4CAF50 0%, #66BB6A 100%);
		color: $text-white;
		transform: translateY(-2rpx);
		box-shadow: 0 6rpx 16rpx rgba(76, 175, 80, 0.3);
		border-color: #4CAF50;
	}
	
	.form-item.remark-item {
		border-bottom: none;
	}
	
	.form-item.remark-item .item-content.full {
		padding-right: 0;
	}
	
	.form-item.remark-item .text-input.full {
		margin-right: 0;
	}

	.item-label {
		font-size: $font-size-base;
		color: $text-secondary;
		margin-bottom: $spacing-md;
		display: flex;
		align-items: center;
		font-weight: $font-weight-semibold;
	}
	
	.label-text {
		font-weight: $font-weight-medium;
	}
	
	.label-optional {
		font-size: $font-size-sm;
		color: $text-tertiary;
		margin-left: $spacing-xs;
	}

	.item-content {
		display: flex;
		align-items: center;
		justify-content: space-between;
		min-height: 60rpx;
	}
	
	.item-content.amount-content {
		align-items: baseline;
	}

	.item-content.full {
		display: block;
	}

	.currency {
		font-size: $font-size-3xl;
		color: #FF6F00;
		font-weight: $font-weight-bold;
		margin-right: $spacing-xs;
		line-height: 1;
	}

	.amount-input {
		flex: 1;
		font-size: $font-size-3xl;
		color: #FF6F00;
		font-weight: $font-weight-bold;
		font-family: 'DIN Alternate', monospace;
		line-height: 1;
		height: auto;
	}
	
	/* 金额输入框 placeholder 样式 */
	.amount-input::placeholder {
		color: rgba(255, 111, 0, 0.3);
		font-size: 28px;
		font-weight: $font-weight-normal;
	}
	
	.amount-input::-webkit-input-placeholder {
		color: rgba(255, 111, 0, 0.3);
		font-size: 28px;
		font-weight: $font-weight-normal;
	}
	
	.amount-input::-moz-placeholder {
		color: rgba(255, 111, 0, 0.3);
		font-size: 28px;
		font-weight: $font-weight-normal;
	}
	
	.amount-input:-ms-input-placeholder {
		color: rgba(255, 111, 0, 0.3);
		font-size: 28px;
		font-weight: $font-weight-normal;
	}

	.text-input {
		flex: 1;
		font-size: $font-size-lg;
		color: $text-primary;
	}

	.text-input.full {
		width: calc(100% - 0rpx);
		background: linear-gradient(135deg, #F5F7FA 0%, #E8EAED 100%);
		border-radius: $radius-xl;
		padding: $spacing-lg $spacing-md;
		margin-top: $spacing-xs;
		margin-right: 0;
		min-height: 100rpx;
		border: 2rpx solid transparent;
		transition: all $transition-fast;
		box-shadow: inset 0 2rpx 6rpx rgba(0, 0, 0, 0.04);
		box-sizing: border-box;
	}
	
	.text-input.full:focus {
		background: linear-gradient(135deg, #FFFFFF 0%, #F8F9FA 100%);
		border-color: rgba(76, 175, 80, 0.3);
		box-shadow: 0 4rpx 12rpx rgba(76, 175, 80, 0.12);
	}

	.item-value {
		flex: 1;
		font-size: $font-size-lg;
		color: $text-primary;
	}
	
	.item-value.placeholder {
		color: #BFBFBF;
		font-weight: $font-weight-normal;
	}
	
	.item-arrow {
		font-size: 40rpx;
		color: $text-tertiary;
		margin-left: $spacing-md;
		font-weight: 300;
	}

	.category-value {
		flex: 1;
		font-size: $font-size-lg;
		color: $text-primary;
		display: flex;
		align-items: center;
	}

	.category-icon {
		font-size: $font-size-2xl;
		margin-right: $spacing-sm;
	}

	/* 保存按钮区域 */
	.save-btn-area {
		position: fixed;
		bottom: 0;
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
		border-radius: 44rpx;
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

	/* 分类选择器 */
	.category-picker {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background-color: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: flex-end;
		z-index: 9999;
		animation: fadeIn 0.25s ease;
	}
	
	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.picker-content {
		width: 100%;
		max-height: 80vh;
		background: $bg-white;
		border-radius: $radius-2xl $radius-2xl 0 0;
		padding: $spacing-lg;
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
		margin-bottom: $spacing-xl;
		padding-bottom: $spacing-md;
		border-bottom: 1rpx solid $border-light;
	}

	.picker-title {
		font-size: $font-size-xl;
		font-weight: $font-weight-bold;
		color: $text-primary;
	}

	.picker-close {
		width: 60rpx;
		height: 60rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 48rpx;
		color: $text-tertiary;
		font-weight: 300;
	}

	.category-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: $spacing-md;
		max-height: 60vh;
		overflow-y: auto;
	}

	.category-item {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: $spacing-lg $spacing-sm;
		border-radius: $radius-lg;
		background: $bg-light;
		transition: all $transition-fast;
		position: relative;
	}
	
	.category-item:active {
		transform: scale(0.95);
	}

	.category-item.active {
		background: $primary-lighter;
		border: 2rpx solid $primary-color;
		box-shadow: $shadow-primary;
	}
	
	.category-item.recommended {
		background: linear-gradient(135deg, #FFF8E1 0%, #FFECB3 100%);
		border: 2rpx solid #FFA726;
		box-shadow: 0 4rpx 16rpx rgba(255, 152, 0, 0.18);
		animation: recommend-pulse 2s ease-in-out infinite;
	}
	
	@keyframes recommend-pulse {
		0%, 100% {
			box-shadow: 0 4rpx 16rpx rgba(255, 152, 0, 0.18);
		}
		50% {
			box-shadow: 0 6rpx 20rpx rgba(255, 152, 0, 0.3);
		}
	}
	
	.category-item-badge {
		position: absolute;
		top: 4rpx;
		right: 4rpx;
		background: linear-gradient(135deg, #FF9800 0%, #FFB74D 100%);
		padding: 2rpx 8rpx;
		border-radius: 8rpx;
		z-index: 1;
	}
	
	.badge-text {
		font-size: 20rpx;
		color: $text-white;
		font-weight: $font-weight-bold;
		line-height: 1;
	}

	.category-item-icon {
		font-size: 48rpx;
		margin-bottom: $spacing-xs;
	}

	.category-item-name {
		font-size: $font-size-sm;
		color: $text-secondary;
		text-align: center;
	}

	.category-item.active .category-item-name {
		color: $primary-color;
		font-weight: $font-weight-semibold;
	}
	
	/* 日期选择器 */
	.date-picker-modal {
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
	
	.date-picker-modal .picker-content {
		width: 100%;
		background: $bg-white;
		border-radius: $radius-2xl $radius-2xl 0 0;
		animation: slideUp 0.3s ease;
		box-shadow: 0 -8rpx 32rpx rgba(0, 0, 0, 0.1);
		position: relative;
	}
	
	.date-picker-modal .picker-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: $spacing-xl $spacing-xl $spacing-md;
		border-bottom: 1rpx solid $border-light;
		position: relative;
	}
	
	.date-picker-modal .picker-header::before {
		content: '';
		position: absolute;
		top: 12rpx;
		left: 50%;
		transform: translateX(-50%);
		width: 60rpx;
		height: 6rpx;
		background: $border-light;
		border-radius: 3rpx;
	}
	
	.picker-cancel {
		font-size: $font-size-lg;
		color: $text-tertiary;
		padding: 8rpx 16rpx;
		transition: opacity 0.2s;
	}
	
	.picker-cancel:active {
		opacity: 0.6;
	}
	
	.picker-confirm {
		font-size: $font-size-lg;
		color: $primary-color;
		font-weight: $font-weight-bold;
		padding: 8rpx 16rpx;
		transition: opacity 0.2s;
	}
	
	.picker-confirm:active {
		opacity: 0.6;
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
		font-size: $font-size-md;
		color: $text-tertiary;
		transition: all 0.2s;
	}
	
	.picker-item-selected {
		font-size: $font-size-xl;
		color: $text-primary;
		font-weight: $font-weight-bold;
	}
	
	/* 淡入动画 */
	.fade-in {
		animation: fadeInContent 0.5s ease-out;
	}
	
	@keyframes fadeInContent {
		0% {
			opacity: 0;
			transform: translateY(-8rpx);
		}
		100% {
			opacity: 1;
			transform: translateY(0);
		}
	}
	
	/* 拍照识别加载遮罩 */
	.loading-mask {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		backdrop-filter: blur(8rpx);
	}
	
	.loading-card {
		background: $bg-white;
		border-radius: 24rpx;
		padding: 60rpx 80rpx;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: $spacing-lg;
		box-shadow: 0 20rpx 60rpx rgba(0, 0, 0, 0.3);
		animation: scaleIn 0.3s ease-out;
	}
	
	@keyframes scaleIn {
		0% {
			opacity: 0;
			transform: scale(0.8);
		}
		100% {
			opacity: 1;
			transform: scale(1);
		}
	}
	
	.loading-spinner {
		width: 80rpx;
		height: 80rpx;
		position: relative;
	}
	
	.spinner-ring {
		position: absolute;
		width: 100%;
		height: 100%;
		border: 6rpx solid transparent;
		border-top-color: $primary-color;
		border-radius: $radius-round;
		animation: spin 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
	}
	
	.spinner-ring:nth-child(1) {
		animation-delay: -0.45s;
	}
	
	.spinner-ring:nth-child(2) {
		animation-delay: -0.3s;
		border-top-color: $success-color;
	}
	
	.spinner-ring:nth-child(3) {
		animation-delay: -0.15s;
		border-top-color: $warning-color;
	}
	
	@keyframes spin {
		0% {
			transform: rotate(0deg);
		}
		100% {
			transform: rotate(360deg);
		}
	}
	
	.loading-title {
		font-size: $font-size-xl;
		color: $text-primary;
		font-weight: $font-weight-bold;
	}
	
	.loading-text {
		font-size: $font-size-sm;
		color: $text-tertiary;
	}
</style>
