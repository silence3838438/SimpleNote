<script setup>
	import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
	import { updateTabBarText } from '@/utils/i18nHelper'
	import request from '@/utils/request.js'
	
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
			const token = uni.getStorageSync('token')
			if (!token) {
				return
			}
			
			// 使用request.call调用billManager的getReminder action
			const result = await request.call('billManager', {
				action: 'getReminder'
			})
			
			if (result.success && result.reminder) {
				const reminder = result.reminder
				
				// 同步到本地存储
				uni.setStorageSync('reminderEnabled', reminder.enabled || false)
				uni.setStorageSync('reminderTime', reminder.time || '20:00')
			}
		} catch (error) {
			console.error('加载提醒设置失败:', error)
			// 加载失败不影响应用启动，使用本地缓存
		}
	}
	
	// 检查是否需要提醒记账
	const checkReminderAndNotify = () => {
		try {
			// 1. 检查是否开启了提醒
			const reminderEnabled = uni.getStorageSync('reminderEnabled')
			if (!reminderEnabled) {
				return
			}
			
			// 2. 获取提醒时间
			const reminderTime = uni.getStorageSync('reminderTime')
			if (!reminderTime) {
				return
			}
			
			// 3. 检查今天是否已经提醒过（每天只提醒一次）
			const today = new Date().toDateString()
			const lastReminderDate = uni.getStorageSync('lastReminderDate')
			
			if (lastReminderDate === today) {
				return
			}
			
			// 4. 检查当前时间是否已经过了提醒时间
			const now = new Date()
			const currentHour = now.getHours()
			const currentMinute = now.getMinutes()
			const currentTime = currentHour * 60 + currentMinute // 转换为分钟数
			
			const [reminderHour, reminderMinute] = reminderTime.split(':').map(Number)
			const reminderTimeInMinutes = reminderHour * 60 + reminderMinute
			
			if (currentTime < reminderTimeInMinutes) {
				return
			}
			
			// 5. 检查应用是否刚启动（避免频繁弹窗）
			const lastShowTime = uni.getStorageSync('lastAppShowTime') || 0
			const timeSinceLastShow = Date.now() - lastShowTime
			
			// 如果距离上次显示不到30秒，不弹窗（避免频繁切换应用时重复弹窗）
			if (timeSinceLastShow < 30000) {
				return
			}
			
			// 记录本次显示时间
			uni.setStorageSync('lastAppShowTime', Date.now())
			
			// 6. 显示提醒弹窗（使用自定义弹框）
			showReminderModal()
			
			// 记录今天已提醒，避免重复弹窗
			uni.setStorageSync('lastReminderDate', today)
		} catch (error) {
			console.error('检查提醒失败:', error)
		}
	}
	
	// 显示精美的提醒弹框
	const showReminderModal = () => {
		// 延迟触发，确保首页已经加载完成
		setTimeout(() => {
			uni.$emit('showReminderModal')
		}, 800)
	}
	
	// 自动登录（小程序和APP通用）
	const autoLogin = async () => {
		try {
			// 检查本地是否有用户信息和token
			const userInfo = uni.getStorageSync('userInfo')
			const token = uni.getStorageSync('token')
			
			// #ifdef MP-WEIXIN
			// 小程序端：始终自动登录（无论是否有本地token）
			try {
				console.log('🔄 小程序自动登录开始...')
				console.log('📦 本地用户信息:', userInfo)
				
				// 获取微信登录凭证
				const loginRes = await uni.login()
				
				if (loginRes.code) {
					// 调用后端接口，使用code换取token
					// 注意：这里传递本地的昵称和头像，后端会优先使用数据库中的数据
					const result = await uni.request({
						url: 'https://api.qiannaqule.top/api/auth/wechat-login',
						method: 'POST',
						data: {
							code: loginRes.code,
							nickName: userInfo?.nickName || '微信用户',
							avatarUrl: userInfo?.avatarUrl || ''
						},
						header: {
							'Content-Type': 'application/json'
						}
					})
					
					if (result.statusCode === 200 && result.data.success) {
						// 后端返回的数据优先级：
						// 1. 如果后端返回了用户信息（数据库中有记录），使用后端返回的
						// 2. 如果后端没有返回，使用本地存储的
						// 3. 如果本地也没有，使用默认值
						const newUserInfo = {
							nickName: result.data.data?.nickName || userInfo?.nickName || '微信用户',
							avatarUrl: result.data.data?.avatarUrl || userInfo?.avatarUrl || '',
							isLogin: true
						}
						
						uni.setStorageSync('userInfo', newUserInfo)
						uni.setStorageSync('token', result.data.token)
						
						console.log('✅ 小程序自动登录成功')
						console.log('📦 更新后的用户信息:', newUserInfo)
					} else {
						console.error('❌ 小程序自动登录失败:', result.data.message)
					}
				}
			} catch (error) {
				console.error('❌ 小程序自动登录异常:', error)
				// 失败不影响应用启动，用户可以继续使用
			}
			// #endif
			
			// #ifdef APP-PLUS
			// APP端：只有已登录用户才验证token
			if (userInfo && userInfo.isLogin && token) {
				try {
					const result = await uni.request({
						url: 'https://api.qiannaqule.top/api/auth/verify-token',
						method: 'GET',
						header: {
							'Authorization': `Bearer ${token}`
						}
					})
					
					if (result.statusCode === 200 && result.data.success) {
						// token有效，更新用户信息（可能昵称头像有变化）
						if (result.data.data) {
							const updatedUserInfo = {
								nickName: result.data.data.nickName || userInfo.nickName,
								avatarUrl: result.data.data.avatarUrl || userInfo.avatarUrl,
								isLogin: true
							}
							uni.setStorageSync('userInfo', updatedUserInfo)
						}
					} else {
						// token无效，清除登录状态
						uni.removeStorageSync('userInfo')
						uni.removeStorageSync('token')
					}
				} catch (error) {
					console.error('验证token异常:', error)
					// 验证失败，但不清除登录状态，让用户继续使用
				}
			}
			// #endif
		} catch (error) {
			console.error('自动登录失败:', error)
			// 失败不影响应用启动
		}
	}
	
	// 初始化 UniPush 2.0（仅APP端）
	const initUniPush = async () => {
		// #ifdef APP-PLUS
		try {
			console.log('🔔 初始化 UniPush 2.0...')
			
			// 获取推送客户端ID
			const clientInfo = await uni.getPushClientId()
			const clientId = clientInfo.cid
			
			if (clientId) {
				console.log('✅ 获取到 ClientID:', clientId)
				// 保存到本地
				uni.setStorageSync('pushClientId', clientId)
				
				// 上传到服务器（需要等待登录完成）
				const token = uni.getStorageSync('token')
				if (token) {
					try {
						await request.call('billManager', {
							action: 'savePushClientId',
							data: { clientId }
						})
						console.log('✅ ClientID 已上传到服务器')
					} catch (error) {
						console.error('❌ 上传 ClientID 失败:', error)
						// 失败不影响应用使用，下次启动会重试
					}
				} else {
					console.log('⚠️  用户未登录，ClientID 将在登录后上传')
				}
			} else {
				console.error('❌ 获取 ClientID 失败')
			}
			
			// 监听推送消息点击事件
			uni.onPushMessage((res) => {
				console.log('📬 收到推送消息:', res)
				
				const { type, data } = res
				
				// 点击通知栏消息
				if (type === 'click') {
					console.log('👆 用户点击了推送消息')
					// 跳转到记账页面
					uni.switchTab({
						url: '/pages/tab/index/index'
					})
				}
				
				// 收到透传消息（APP在前台时）
				if (type === 'receive') {
					console.log('📨 收到透传消息:', data)
					// 可以显示自定义弹窗
					uni.showModal({
						title: '记账提醒',
						content: data?.content || '该记账啦！',
						confirmText: '去记账',
						success: (modalRes) => {
							if (modalRes.confirm) {
								uni.switchTab({
									url: '/pages/tab/index/index'
								})
							}
						}
					})
				}
			})
			
			console.log('✅ UniPush 2.0 初始化完成')
		} catch (error) {
			console.error('❌ UniPush 2.0 初始化失败:', error)
		}
		// #endif
	}
	
	onLaunch(async () => {
		// #ifdef MP-WEIXIN
		// 初始化云开发环境
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
		
		// 更新 tabBar 文字（支持国际化）- 延迟执行确保 tabBar 已准备好
		setTimeout(() => {
			updateTabBarText()
		}, 100)
		
		// 自动登录（小程序和APP通用，在加载提醒设置之前）
		await autoLogin()
		
		// 从云端加载提醒设置（等待加载完成）
		await loadReminderSettingsFromCloud()
		
		// 初始化 UniPush 2.0（仅APP端）
		await initUniPush()
	})
	
	onShow(() => {
		// 弹框提醒已移除，改为使用系统推送通知
		// setTimeout(() => {
		// 	checkReminderAndNotify()
		// }, 500)
	})
	
	onHide(() => {
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
