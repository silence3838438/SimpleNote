<script setup>
	import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
	const initCategories = () => {
		const categories = [
			{ id: 1, name: '餐饮', icon: '🍜', keywords: ['餐厅', '饭店', '食堂', '外卖', '麦当劳', '肯德基', '星巴克', '咖啡'] },
			{ id: 2, name: '交通', icon: '🚗', keywords: ['滴滴', '出租', '地铁', '公交', '加油', '停车'] },
			{ id: 3, name: '购物', icon: '🛒', keywords: ['超市', '商场', '淘宝', '京东', '拼多多'] },
			{ id: 4, name: '娱乐', icon: '🎮', keywords: ['电影', '游戏', 'KTV', '健身'] },
			{ id: 5, name: '住房', icon: '🏠', keywords: ['房租', '物业', '水电', '燃气'] },
			{ id: 6, name: '医疗', icon: '💊', keywords: ['医院', '药店', '体检'] },
			{ id: 7, name: '通讯', icon: '📱', keywords: ['话费', '流量', '宽带'] },
			{ id: 8, name: '服饰', icon: '👔', keywords: ['衣服', '鞋子', '包包'] },
			{ id: 9, name: '美容', icon: '💄', keywords: ['美发', '美甲', '化妆品'] },
			{ id: 10, name: '学习', icon: '📚', keywords: ['书籍', '课程', '培训'] },
			{ id: 11, name: '社交', icon: '👥', keywords: ['聚餐', '礼物', '红包'] },
			{ id: 12, name: '其他', icon: '📦', keywords: [] }
		]
		uni.setStorageSync('categories', categories)
	}
	
	// 从云端加载提醒设置
	const loadReminderSettingsFromCloud = async () => {
		try {
			// #ifdef MP-WEIXIN
			const result = await wx.cloud.callFunction({
				name: 'billManager',
				data: {
					action: 'getReminder',
					data: {}
				}
			})
			
			if (result.result.success && result.result.reminder) {
				const reminder = result.result.reminder
				console.log('从云端加载提醒设置:', reminder)
				
				// 同步到本地存储
				uni.setStorageSync('reminderEnabled', reminder.enabled)
				uni.setStorageSync('reminderTime', reminder.time)
			}
			// #endif
		} catch (error) {
			console.error('加载提醒设置失败:', error)
			// 加载失败不影响应用启动，使用本地缓存
		}
	}
	
	// 检查是否需要提醒记账
	const checkReminderAndNotify = () => {
		try {
			console.log('=== 开始检查提醒 ===')
			
			// 1. 检查是否开启了提醒
			const reminderEnabled = uni.getStorageSync('reminderEnabled')
			console.log('1. 提醒开关:', reminderEnabled)
			if (!reminderEnabled) {
				console.log('❌ 提醒未开启')
				return
			}
			
			// 2. 获取提醒时间
			const reminderTime = uni.getStorageSync('reminderTime')
			console.log('2. 提醒时间:', reminderTime)
			if (!reminderTime) {
				console.log('❌ 未设置提醒时间')
				return
			}
			
			// 3. 检查今天是否已经提醒过（每天只提醒一次）
			const today = new Date().toDateString()
			const lastReminderDate = uni.getStorageSync('lastReminderDate')
			console.log('3. 今天日期:', today)
			console.log('3. 上次提醒日期:', lastReminderDate)
			
			if (lastReminderDate === today) {
				console.log('❌ 今天已经提醒过了')
				return
			}
			
			// 4. 检查当前时间是否已经过了提醒时间
			const now = new Date()
			const currentHour = now.getHours()
			const currentMinute = now.getMinutes()
			const currentTime = currentHour * 60 + currentMinute // 转换为分钟数
			
			const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
			const reminderTimeInMinutes = reminderHour * 60 + reminderMinute
			
			console.log('4. 当前时间:', `${currentHour}:${currentMinute}`, '(', currentTime, '分钟)')
			console.log('4. 提醒时间:', reminderTime, '(', reminderTimeInMinutes, '分钟)')
			
			if (currentTime < reminderTimeInMinutes) {
				console.log('❌ 还没到提醒时间')
				return
			}
			
			// 5. 检查今天是否已经记过账
			const bills = uni.getStorageSync('bills') || []
			const todayBills = bills.filter(bill => {
				const billDate = new Date(bill.date).toDateString()
				return billDate === today
			})
			
			console.log('5. 今天的账单数:', todayBills.length)
			
			if (todayBills.length > 0) {
				console.log('❌ 今天已经记过账了，自动停止提醒')
				return
			}
			
			// 6. 检查应用是否刚启动（避免频繁弹窗）
			const lastShowTime = uni.getStorageSync('lastAppShowTime') || 0
			const timeSinceLastShow = Date.now() - lastShowTime
			
			// 如果距离上次显示不到30秒，不弹窗（避免频繁切换应用时重复弹窗）
			if (timeSinceLastShow < 30000) {
				console.log('❌ 应用刚显示不久，避免频繁弹窗')
				return
			}
			
			// 记录本次显示时间
			uni.setStorageSync('lastAppShowTime', Date.now())
			
			// 7. 显示提醒弹窗（使用自定义弹框）
			console.log('✅ 满足所有条件，显示提醒弹框')
			showReminderModal()
			
			// 记录今天已提醒，避免重复弹窗
			uni.setStorageSync('lastReminderDate', today)
			console.log('已触发提醒事件并记录提醒日期')
		} catch (error) {
			console.error('检查提醒失败:', error)
		}
	}
	
	// 显示精美的提醒弹框
	const showReminderModal = () => {
		// 延迟触发，确保首页已经加载完成
		setTimeout(() => {
			console.log('触发显示提醒弹框事件')
			uni.$emit('showReminderModal')
		}, 800)
	}
	
	onLaunch(async () => {
		console.log('App Launch')
		// 初始化云开发环境
		// #ifdef MP-WEIXIN
		if (!wx.cloud) {
			console.error('请使用 2.2.3 或以上的基础库以使用云能力')
		} else {
			wx.cloud.init({
				env: 'cloud1-8gxevfq393690dfe',
				traceUser: true
			})
		}
		// #endif
		
		// 初始化分类数据
		initCategories()
		
		// 从云端加载提醒设置（等待加载完成）
		await loadReminderSettingsFromCloud()
	})
	
	onShow(() => {
		console.log('App Show')
		// 延迟检查，确保云端数据已加载
		setTimeout(() => {
			checkReminderAndNotify()
		}, 500)
	})
	
	onHide(() => {
		console.log('App Hide')
	})
</script>

<style lang="scss">
@import "@/styles/variables.scss";

page {
	background-color: $bg-page;
	font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
}

/* 隐藏导航栏下边框 */
page::before {
	display: none !important;
}

/* 隐藏TabBar上边框 */
uni-tabbar .uni-tabbar-border {
	display: none !important;
	height: 0 !important;
	background-color: transparent !important;
}

/* 通用样式类 */
.flex {
	display: flex;
}

.flex-center {
	display: flex;
	align-items: center;
	justify-content: center;
}

.flex-between {
	display: flex;
	align-items: center;
	justify-content: space-between;
}

.flex-column {
	display: flex;
	flex-direction: column;
}

.text-center {
	text-align: center;
}

.text-right {
	text-align: right;
}

.ellipsis {
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.ellipsis-2 {
	overflow: hidden;
	text-overflow: ellipsis;
	display: -webkit-box;
	-webkit-line-clamp: 2;
	-webkit-box-orient: vertical;
}
</style>
