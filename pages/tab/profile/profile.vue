<template>
	<view class="page">
		<!-- 自定义导航栏 -->
		<view class="custom-navbar" :style="{ paddingTop: statusBarHeight + 'px' }">
			<view class="navbar-content">
				<view class="navbar-left"></view>
				<view class="navbar-title"></view>
				<view class="navbar-right">
					<view class="navbar-icon" @click="showSettings">
						<text class="icon-dot">⋯</text>
					</view>
				</view>
			</view>
		</view>
		
		<view class="container" :style="{ paddingTop: (statusBarHeight + 24) + 'px' }">
			<!-- 用户信息卡片 -->
			<view class="user-card">
				<!-- 未登录状态 -->
				<view class="user-header" v-if="!data.userInfo.isLogin" @click="goToLogin">
					<view class="avatar-wrapper">
						<image 
							class="avatar" 
							src="https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png" 
							mode="aspectFill"
						></image>
					</view>
					<view class="user-info">
						<view class="nickname-row">
							<text class="nickname">未登录</text>
							<text class="login-hint">点击登录</text>
						</view>
						<text class="user-tip">登录后可同步数据、查看积分等级</text>
					</view>
				</view>
				
				<!-- 已登录状态 -->
				<view class="user-header" v-else>
					<view class="avatar-wrapper">
						<image 
							class="avatar" 
							:src="data.userInfo.avatarUrl" 
							mode="aspectFill"
							@click="changeAvatar"
						></image>
						<view class="level-badge" :style="{ background: data.memberLevel.gradient }">
							<text class="level-icon">{{ data.memberLevel.icon }}</text>
						</view>
					</view>
					<view class="user-info">
						<view class="nickname-row" @click="changeNickname">
							<text class="nickname">{{ data.userInfo.nickName }}</text>
							<text class="edit-icon">✏️</text>
						</view>
						<view class="level-row" @click="showLevelDetail">
							<text class="level-name">{{ data.memberLevel.name }}</text>
							<text class="level-arrow">›</text>
						</view>
						<text class="user-tip">点击头像更换 · 点击等级查看详情</text>
					</view>
				</view>
				
				<!-- 会员等级进度卡片 -->
				<view class="level-progress-card" @click="data.userInfo.isLogin ? showLevelDetail() : goToLogin()">
					<view class="progress-header">
						<view class="progress-title">
							<text class="title-icon">🌱</text>
							<text class="title-text">记账成长</text>
						</view>
						<view class="progress-points">
							<text class="points-number">{{ data.userPoints }}</text>
							<text class="points-unit">积分</text>
						</view>
					</view>
					
					<!-- 未登录状态 -->
					<view class="progress-bar-wrapper" v-if="!data.userInfo.isLogin">
						<view class="progress-bar">
							<view class="progress-fill" style="width: 0%; background: #d9d9d9;">
								<view class="progress-glow"></view>
							</view>
						</view>
						<view class="progress-labels">
							<text class="current-level"></text>
							<text class="next-level">登录后查看</text>
						</view>
					</view>
					
					<!-- 已登录状态 -->
					<view class="progress-bar-wrapper" v-else>
						<view class="progress-bar">
							<view 
								class="progress-fill" 
								:style="{ 
									width: (data.memberLevel.progress?.pointsProgress || 0) + '%',
									background: data.memberLevel.gradient 
								}"
							>
								<view class="progress-glow"></view>
							</view>
						</view>
						<view class="progress-labels">
							<text class="current-level">{{ data.memberLevel.name }}</text>
							<text class="next-level" v-if="data.memberLevel.nextLevel">
								{{ data.memberLevel.nextLevel.name }}
							</text>
							<text class="max-level" v-else>已满级</text>
						</view>
					</view>
					
					<!-- 未登录提示 -->
					<view class="progress-tip" v-if="!data.userInfo.isLogin">
						<text class="tip-text">登录后开启记账成长之旅</text>
						<text class="tip-icon">🚀</text>
					</view>
					<!-- 已登录-有下一等级 -->
					<view class="progress-tip" v-else-if="data.memberLevel.nextLevel">
						<text class="tip-text">再获得 {{ data.memberLevel.progress?.pointsNeeded || 0 }} 积分即可升级</text>
						<text class="tip-icon">✨</text>
					</view>
					<!-- 已登录-已满级 -->
					<view class="progress-tip max-tip" v-else>
						<text class="tip-text">恭喜达到最高等级</text>
						<text class="tip-icon">🎉</text>
					</view>
					
					<!-- 记账统计（移到卡片内部） -->
					<view class="stats-row-inner">
						<view class="stat-item">
							<text class="stat-value">{{ data.recordDays }}</text>
							<text class="stat-label">连续打卡</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item">
							<text class="stat-value">{{ data.totalBills }}</text>
							<text class="stat-label">记账笔数</text>
						</view>
						<view class="stat-divider"></view>
						<view class="stat-item" @click.stop="data.userInfo.isLogin ? showPointsDetail() : goToLogin()">
							<text class="stat-value">{{ getTodayPoints() }}</text>
							<text class="stat-label">今日积分</text>
						</view>
					</view>
				</view>
			</view>
			
			<!-- 功能列表 -->
			<view class="function-list">
				<!-- 记账提醒 -->
				<view class="function-item" @click="goToReminderSettings">
					<view class="function-left">
						<view class="function-icon reminder-icon">
							<text class="icon-text">⏰</text>
						</view>
						<text class="function-title">记账提醒</text>
					</view>
					<view class="function-right">
						<text class="function-desc" v-if="data.reminderTime">每天 {{ data.reminderTime }}</text>
						<text class="function-desc inactive" v-else>未开启</text>
						<text class="arrow">›</text>
					</view>
				</view>
				
				<!-- 推荐给好友 -->
				<button class="function-item share-button" open-type="share">
					<view class="function-left">
						<view class="function-icon share-icon">
							<text class="icon-text">📤</text>
						</view>
						<text class="function-title">推荐给好友</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</button>
				
				<!-- 检查更新（仅APP） -->
				<!-- #ifdef APP-PLUS -->
				<view class="function-item" @click="checkAppUpdate">
					<view class="function-left">
						<view class="function-icon update-icon">
							<text class="icon-text">🔄</text>
						</view>
						<text class="function-title">检查更新</text>
					</view>
					<view class="function-right">
						<text class="function-desc">v{{ data.appVersion }}</text>
						<text class="arrow">›</text>
					</view>
				</view>
				<!-- #endif -->
				
				<!-- 系统设置 -->
				<view class="function-item" @click="goToSettings">
					<view class="function-left">
						<view class="function-icon settings-icon">
							<text class="icon-text">⚙️</text>
						</view>
						<text class="function-title">系统设置</text>
					</view>
					<view class="function-right">
						<text class="arrow">›</text>
					</view>
				</view>
			</view>
			
		</view>
		
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
			@confirm="handleUpdate"
			@downloadComplete="handleDownloadComplete"
		/>
		<!-- #endif -->
		
		<!-- 等级详情弹框 -->
		<view class="level-modal" v-if="data.showLevelModal" @click="closeLevelModal">
			<view class="level-modal-content" @click.stop>
				<view class="modal-header">
					<view class="modal-icon" :style="{ background: data.memberLevel.gradient }">
						<text class="modal-icon-text">{{ data.memberLevel.icon }}</text>
					</view>
					<text class="modal-title">{{ data.memberLevel.name }}</text>
					<text class="modal-desc">{{ data.memberLevel.desc }}</text>
				</view>
				
				<view class="modal-body">
					<!-- 当前数据 -->
					<view class="data-card">
						<view class="data-item">
							<text class="data-value" :style="{ color: data.memberLevel.color }">{{ data.memberLevel.currentPoints }}</text>
							<text class="data-label">当前积分</text>
						</view>
						<view class="data-divider"></view>
						<view class="data-item">
							<text class="data-value">{{ data.totalBills }}</text>
							<text class="data-label">记账笔数</text>
						</view>
					</view>
					
					<!-- 下一等级 -->
					<view class="next-level-card" v-if="data.memberLevel.nextLevel">
						<view class="next-level-info">
							<view class="next-level-badge" :style="{ background: data.memberLevel.nextLevel.gradient }">
								<text class="next-level-icon">{{ data.memberLevel.nextLevel.icon }}</text>
							</view>
							<view class="next-level-text">
								<text class="next-level-name">{{ data.memberLevel.nextLevel.name }}</text>
								<text class="next-level-tip">还需 {{ data.memberLevel.progress?.pointsNeeded || 0 }} 积分</text>
							</view>
						</view>
					</view>
					
					<!-- 满级提示 -->
					<view class="max-level-card" v-else>
						<text class="max-level-icon">🎉</text>
						<text class="max-level-text">已达最高等级</text>
					</view>
				</view>
				
				<view class="modal-footer">
					<view class="modal-btn" :style="{ background: data.memberLevel.gradient }" @click="closeLevelModal">
						<text class="modal-btn-text">知道了</text>
					</view>
				</view>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { onLoad, onShow, onShareAppMessage, onShareTimeline } from '@dcloudio/uni-app'
import billStorage from '@/utils/billStorage.js'
import { getMemberLevel } from '@/utils/memberLevel.js'
import { rewardShareToFriend, rewardShareToTimeline } from '@/utils/pointsRules.js'
import { pullPointsFromCloud } from '@/utils/pointsSync.js'
import request from '@/utils/request.js'
// #ifdef APP-PLUS
import UpdateModal from '@/components/UpdateModal.vue'
import { checkUpdate } from '@/utils/appUpdate.js'
// #endif

const data = reactive({
	userInfo: {
		avatarUrl: 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
		nickName: '未登录',
		isLogin: false
	},
	recordDays: 0,
	totalBills: 0,
	userPoints: 0, // 用户积分
	memberLevel: {}, // 会员等级信息
	todayPoints: 0, // 今日获得积分
	showLevelModal: false, // 是否显示等级详情弹框
	reminderTime: '', // 提醒时间
	// APP更新相关
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
	appVersion: ''
})

// 获取今日积分（从云端获取）
const getTodayPoints = () => {
	// 返回响应式的今日积分
	return data.todayPoints
}

// 获取系统信息
const statusBarHeight = ref(0)
const navbarHeight = ref(0)

// 获取状态栏高度
const getSystemInfo = () => {
	const systemInfo = uni.getSystemInfoSync()
	statusBarHeight.value = systemInfo.statusBarHeight || 0
	// 导航栏高度 = 状态栏高度 + 导航栏内容高度(44px)
	navbarHeight.value = statusBarHeight.value + 44
}

// 设置按钮
const showSettings = () => {
	uni.showActionSheet({
		itemList: ['清除缓存', '关于我们'],
		success: (res) => {
			if (res.tapIndex === 0) {
				// 清除缓存
				uni.showModal({
					title: '提示',
					content: '确定要清除缓存吗？',
					success: (modalRes) => {
						if (modalRes.confirm) {
							uni.clearStorageSync()
							uni.showToast({
								title: '清除成功',
								icon: 'success'
							})
							setTimeout(() => {
								loadStats()
							}, 500)
						}
					}
				})
			} else if (res.tapIndex === 1) {
				showAbout()
			}
		}
	})
}

// 获取用户信息
const getUserInfo = () => {
	// #ifdef MP-WEIXIN
	uni.getUserProfile({
		desc: '用于完善用户资料',
		success: async (res) => {
			const nickName = res.userInfo.nickName
			const avatarUrl = res.userInfo.avatarUrl
			
			// 显示加载提示
			uni.showLoading({ title: '登录中...' })
			
			try {
				// 1. 获取微信登录凭证code
				const loginRes = await uni.login()
				const code = loginRes.code
				
				// 2. 调用后端登录接口
				const result = await request.call('auth/wechat-login', {
					code: code,
					nickName: nickName,
					avatarUrl: avatarUrl
				})
				
				console.log('登录接口返回:', result)
				
				if (result.success) {
					// 3. 保存用户信息和token
					console.log('准备保存用户信息')
					
					const newUserInfo = {
						avatarUrl: result.data?.avatarUrl || avatarUrl,
						nickName: result.data?.nickName || nickName,
						isLogin: true,
						token: result.token
					}
					
					console.log('newUserInfo:', newUserInfo)
					
					data.userInfo = newUserInfo
					uni.setStorageSync('userInfo', newUserInfo)
					uni.setStorageSync('token', result.token)
					
					console.log('用户信息已保存')
					console.log('data.userInfo:', data.userInfo)
					
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
				} else {
					throw new Error(result.message || '登录失败')
				}
			} catch (error) {
				uni.hideLoading()
				console.error('登录失败:', error)
				uni.showToast({
					title: error.message || '登录失败，请重试',
					icon: 'none'
				})
			}
		},
		fail: (err) => {
			console.error('获取用户信息失败:', err)
		}
	})
	// #endif
}

// 更换头像
const changeAvatar = () => {
	uni.showActionSheet({
		itemList: ['从相册选择', '拍照'],
		success: (res) => {
			if (res.tapIndex === 0) {
				// 从相册选择
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['album'],
					success: async (res) => {
						const tempFilePath = res.tempFilePaths[0]
						
						// 显示加载提示
						uni.showLoading({ title: '上传中...' })
						
						try {
							// 上传到服务器
							const uploadResult = await request.uploadFile(tempFilePath)
							
							if (uploadResult.success) {
								const avatarUrl = uploadResult.url
								
								// 更新到云端
								await updateUserInfoToCloud(data.userInfo.nickName, avatarUrl)
								
								// 更新本地
								data.userInfo.avatarUrl = avatarUrl
								uni.setStorageSync('userInfo', data.userInfo)
								
								uni.hideLoading()
								uni.showToast({
									title: '头像更换成功',
									icon: 'success'
								})
							} else {
								throw new Error(uploadResult.message || '上传失败')
							}
						} catch (error) {
							uni.hideLoading()
							console.error('上传头像失败:', error)
							uni.showToast({
								title: error.message || '上传失败',
								icon: 'none'
							})
						}
					}
				})
			} else if (res.tapIndex === 1) {
				// 拍照
				uni.chooseImage({
					count: 1,
					sizeType: ['compressed'],
					sourceType: ['camera'],
					success: async (res) => {
						const tempFilePath = res.tempFilePaths[0]
						
						// 显示加载提示
						uni.showLoading({ title: '上传中...' })
						
						try {
							// 上传到服务器
							const uploadResult = await request.uploadFile(tempFilePath)
							
							if (uploadResult.success) {
								const avatarUrl = uploadResult.url
								
								// 更新到云端
								await updateUserInfoToCloud(data.userInfo.nickName, avatarUrl)
								
								// 更新本地
								data.userInfo.avatarUrl = avatarUrl
								uni.setStorageSync('userInfo', data.userInfo)
								
								uni.hideLoading()
								uni.showToast({
									title: '头像更换成功',
									icon: 'success'
								})
							} else {
								throw new Error(uploadResult.message || '上传失败')
							}
						} catch (error) {
							uni.hideLoading()
							console.error('上传头像失败:', error)
							uni.showToast({
								title: error.message || '上传失败',
								icon: 'none'
							})
						}
					}
				})
			}
		}
	})
}

// 更新微信头像（不重新登录）
const updateWechatAvatar = () => {
	// #ifdef MP-WEIXIN
	uni.getUserProfile({
		desc: '用于更新头像',
		success: async (res) => {
			const avatarUrl = res.userInfo.avatarUrl
			
			// 显示加载提示
			uni.showLoading({ title: '更新中...' })
			
			try {
				// 更新到云端
				await updateUserInfoToCloud(data.userInfo.nickName, avatarUrl)
				
				// 更新本地
				data.userInfo.avatarUrl = avatarUrl
				uni.setStorageSync('userInfo', data.userInfo)
				
				uni.hideLoading()
				uni.showToast({
					title: '头像更换成功',
					icon: 'success'
				})
			} catch (error) {
				uni.hideLoading()
				console.error('更新头像失败:', error)
				uni.showToast({
					title: error.message || '更新失败',
					icon: 'none'
				})
			}
		},
		fail: (err) => {
			console.error('获取微信头像失败:', err)
			uni.showToast({
				title: '获取头像失败',
				icon: 'none'
			})
		}
	})
	// #endif
}

// 修改昵称
const changeNickname = () => {
	uni.showModal({
		title: '修改昵称',
		editable: true,
		placeholderText: '请输入昵称',
		content: data.userInfo.nickName,
		success: async (res) => {
			if (res.confirm && res.content) {
				const nickname = res.content.trim()
				if (!nickname) {
					uni.showToast({
						title: '昵称不能为空',
						icon: 'none'
					})
					return
				}
				
				// 显示加载提示
				uni.showLoading({ title: '保存中...' })
				
				try {
					// 更新到云端
					await updateUserInfoToCloud(nickname, data.userInfo.avatarUrl)
					
					// 更新本地
					data.userInfo.nickName = nickname
					uni.setStorageSync('userInfo', data.userInfo)
					
					uni.hideLoading()
					uni.showToast({
						title: '昵称修改成功',
						icon: 'success'
					})
				} catch (error) {
					uni.hideLoading()
					console.error('更新昵称失败:', error)
					uni.showToast({
						title: '保存失败',
						icon: 'none'
					})
				}
			}
		}
	})
}

// 更新用户信息到云端
const updateUserInfoToCloud = async (nickName, avatarUrl) => {
	return request.call('billManager', {
		action: 'updateUserInfo',
		data: { nickName, avatarUrl }
	})
}

// 从云端获取用户信息
const getUserInfoFromCloud = async () => {
	return request.call('billManager', {
		action: 'getUserInfo'
	})
}

// 加载统计数据（不显示升级提示）
const loadStatsWithoutLevelUpNotification = async () => {
	// 检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		// 未登录时显示默认值
		data.totalBills = 0
		data.recordDays = 0
		data.userPoints = 0
		data.todayPoints = 0
		data.memberLevel = getMemberLevel(0)
		return
	}
	
	try {
		const bills = await billStorage.getFromAPI() // 改为从API获取
		data.totalBills = bills.length
		
		// 计算记账天数（去重日期）
		const dates = new Set()
		bills.forEach(bill => {
			const date = new Date(bill.date).toDateString()
			dates.add(date)
		})
		data.recordDays = dates.size
		
		// 显示加载提示
		uni.showLoading({ title: '加载中...' })
		
		// 直接从云端获取最新积分（实时同步），但不显示升级提示
		try {
			// 获取云端积分，但不检查升级
			const res = await request.call('billManager', {
				action: 'getPoints'
			})
			
			if (res.success) {
				const cloudPoints = res.points || 0
				// 直接使用云端积分，不触发升级检查
				uni.setStorageSync('userPoints', cloudPoints)
				data.userPoints = cloudPoints
				// 计算会员等级（只通过积分）
				data.memberLevel = getMemberLevel(data.userPoints)
			} else {
				// 云端获取失败，使用本地数据
				data.userPoints = uni.getStorageSync('userPoints') || 0
				data.memberLevel = getMemberLevel(data.userPoints)
			}
			
			// 从云端获取今日积分
			const todayPointsResult = await getTodayPointsFromCloud()
			data.todayPoints = todayPointsResult
			
		} catch (error) {
			console.error('从云端获取数据失败:', error)
			// 云端获取失败，使用本地数据
			data.userPoints = uni.getStorageSync('userPoints') || 0
			data.memberLevel = getMemberLevel(data.userPoints)
			data.todayPoints = 0
		} finally {
			uni.hideLoading()
		}
		
		// 获取用户信息
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo) {
			data.userInfo = userInfo
		} else {
			// 本地没有，尝试从云端获取
			try {
				const result = await getUserInfoFromCloud()
				if (result.success && result.userInfo) {
					data.userInfo = result.userInfo
					uni.setStorageSync('userInfo', result.userInfo)
				}
			} catch (error) {
				console.error('获取云端用户信息失败:', error)
			}
		}
		
	} catch (error) {
		console.error('加载统计数据失败:', error)
		uni.hideLoading()
	}
}

// 静默加载统计数据（不显示loading，用于onShow刷新）
const loadStatsQuietly = async () => {
	// 检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		// 未登录时显示默认值
		data.totalBills = 0
		data.recordDays = 0
		data.userPoints = 0
		data.todayPoints = 0
		data.memberLevel = getMemberLevel(0)
		return
	}
	
	try {
		const bills = await billStorage.getFromAPI() // 改为从API获取
		data.totalBills = bills.length
		
		// 计算记账天数（去重日期）
		const dates = new Set()
		bills.forEach(bill => {
			const date = new Date(bill.date).toDateString()
			dates.add(date)
		})
		data.recordDays = dates.size
		
		// 静默从云端获取最新数据（不显示loading）
		try {
			// 获取云端积分
			const res = await request.call('billManager', {
				action: 'getPoints'
			})
			
			if (res.success) {
				const cloudPoints = res.points || 0
				uni.setStorageSync('userPoints', cloudPoints)
				data.userPoints = cloudPoints
				data.memberLevel = getMemberLevel(data.userPoints)
			}
			
			// 从云端获取今日积分
			const todayPointsResult = await getTodayPointsFromCloud()
			data.todayPoints = todayPointsResult
			
		} catch (error) {
			console.error('静默刷新失败:', error)
			// 失败时使用本地缓存，不影响用户体验
		}
		
	} catch (error) {
		console.error('静默加载失败:', error)
	}
}

// 加载统计数据
const loadStats = async () => {
	// 检查登录状态
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		// 未登录时显示默认值
		data.totalBills = 0
		data.recordDays = 0
		data.userPoints = 0
		data.todayPoints = 0
		data.memberLevel = getMemberLevel(0)
		return
	}
	
	try {
		const bills = await billStorage.getFromAPI() // 改为从API获取
		data.totalBills = bills.length
		
		// 计算记账天数（去重日期）
		const dates = new Set()
		bills.forEach(bill => {
			const date = new Date(bill.date).toDateString()
			dates.add(date)
		})
		data.recordDays = dates.size
		
		// 显示加载提示
		uni.showLoading({ title: '加载中...' })
		
		// 直接从云端获取最新积分（实时同步）
		try {
			// 获取云端积分，但不检查升级（升级检查应该在获得积分时进行）
			const res = await request.call('billManager', {
				action: 'getPoints'
			})
			
			if (res.success) {
				const cloudPoints = res.points || 0
				// 直接使用云端积分，不触发升级检查
				uni.setStorageSync('userPoints', cloudPoints)
				data.userPoints = cloudPoints
				// 计算会员等级（只通过积分）
				data.memberLevel = getMemberLevel(data.userPoints)
			} else {
				// 云端获取失败，使用本地数据
				data.userPoints = uni.getStorageSync('userPoints') || 0
				data.memberLevel = getMemberLevel(data.userPoints)
			}
			
			// 从云端获取今日积分
			const todayPointsResult = await getTodayPointsFromCloud()
			data.todayPoints = todayPointsResult
			
		} catch (error) {
			console.error('从云端获取数据失败:', error)
			// 云端获取失败，使用本地数据
			data.userPoints = uni.getStorageSync('userPoints') || 0
			data.memberLevel = getMemberLevel(data.userPoints)
			data.todayPoints = 0
		} finally {
			uni.hideLoading()
		}
		
		// 获取用户信息
		const userInfo = uni.getStorageSync('userInfo')
		if (userInfo) {
			data.userInfo = userInfo
		} else {
			// 本地没有，尝试从云端获取
			try {
				const result = await getUserInfoFromCloud()
				if (result.success && result.userInfo) {
					data.userInfo = result.userInfo
					uni.setStorageSync('userInfo', result.userInfo)
				}
			} catch (error) {
				console.error('获取云端用户信息失败:', error)
			}
		}
		
	} catch (error) {
		console.error('加载统计数据失败:', error)
		uni.hideLoading()
	}
}

// 从云端获取今日积分
const getTodayPointsFromCloud = async () => {
	try {
		const res = await request.call('billManager', {
			action: 'getPointsHistory',
			data: { limit: 100, skip: 0 }
		})
		
		if (res.success) {
			const history = res.data || []
			const today = new Date().toDateString()
			let todayTotal = 0
			
			console.log('=== 今日积分计算 ===')
			console.log('今天日期:', today)
			console.log('积分历史记录数:', history.length)
			
			history.forEach(record => {
				const recordDate = new Date(record.createTime).toDateString()
				console.log('记录日期:', recordDate, '积分:', record.points, '原因:', record.reason)
				if (recordDate === today) {
					todayTotal += record.points
					console.log('✓ 今日记录，累加积分:', record.points, '当前总计:', todayTotal)
				}
			})
			
			console.log('今日积分总计:', todayTotal)
			return todayTotal
		}
		return 0
	} catch (error) {
		console.error('获取今日积分失败:', error)
		return 0
	}
}

// 从云端获取提醒设置
// 显示积分详情
const showPointsDetail = () => {
	const todayPoints = getTodayPoints()
	
	let content = `总积分：${data.userPoints}分\n`
	content += `今日获得：+${todayPoints}分\n\n`
	content += `━━━━━━━━━━━━━━\n\n`
	content += `📝 每记一笔账 +2积分\n`
	content += `⭐ 每日首次记账额外 +5积分\n`
	content += `🧧 春节红包雨随机 +1~10积分\n`
	content += `🎯 完成成就任务获得更多积分\n\n`
	content += `积分越高，等级越高，成就感满满！`
	
	uni.showModal({
		title: '💰 我的积分',
		content: content,
		showCancel: false,
		confirmText: '继续加油',
		confirmColor: '#52C41A'
	})
}

// 显示等级详情
const showLevelDetail = () => {
	data.showLevelModal = true
}

// 关闭等级详情弹框
const closeLevelModal = () => {
	data.showLevelModal = false
}

// 关于我们
const showAbout = () => {
	uni.navigateTo({
		url: '/pages/settings/about'
	})
}

// 跳转到系统设置
const goToSettings = () => {
	uni.navigateTo({
		url: '/pages/settings/settings'
	})
}

// 跳转到登录页面
const goToLogin = () => {
	// #ifdef MP-WEIXIN
	// 小程序直接调用一键登录
	uni.getUserProfile({
		desc: '用于完善用户资料',
		success: async (res) => {
			uni.showLoading({ title: '登录中...' })
			
			try {
				// 获取微信登录凭证
				const loginRes = await uni.login()
				
				// 调用后端登录接口
				const result = await request.call('auth/wechat-login', {
					code: loginRes.code,
					nickName: res.userInfo.nickName,
					avatarUrl: res.userInfo.avatarUrl
				})
				
				if (result.success) {
					// 保存用户信息
					const userInfo = {
						nickName: result.data?.nickName || res.userInfo.nickName,
						avatarUrl: result.data?.avatarUrl || res.userInfo.avatarUrl,
						isLogin: true
					}
					
					uni.setStorageSync('userInfo', userInfo)
					uni.setStorageSync('token', result.token)
					
					// 更新本地状态
					data.userInfo = userInfo
					
					uni.hideLoading()
					uni.showToast({
						title: '登录成功',
						icon: 'success'
					})
					
					// 刷新数据
					setTimeout(() => {
						loadStats()
					}, 500)
				} else {
					throw new Error(result.message || '登录失败')
				}
			} catch (error) {
				uni.hideLoading()
				console.error('登录失败:', error)
				uni.showToast({
					title: error.message || '登录失败，请重试',
					icon: 'none'
				})
			}
		},
		fail: (err) => {
			console.error('获取用户信息失败:', err)
		}
	})
	// #endif
	
	// #ifdef APP-PLUS
	// APP跳转到登录页面
	uni.navigateTo({
		url: '/pages/user/login'
	})
	// #endif
}

// 退出登录
const handleLogout = () => {
	uni.showModal({
		title: '提示',
		content: '退出登录后，本地数据将被清除，云端数据已同步保存。确定要退出吗？',
		confirmText: '退出',
		cancelText: '取消',
		confirmColor: '#FF4D4F',
		success: async (res) => {
			if (res.confirm) {
				// 显示加载提示
				uni.showLoading({ title: '退出中...' })
				
				try {
					// 1. 先同步本地数据到云端（确保数据不丢失）
					try {
						await billStorage.syncToAPI()
						console.log('退出前数据已同步到云端')
					} catch (syncError) {
						console.error('同步数据失败:', syncError)
						// 继续退出流程，不阻塞
					}
					
					// 2. 调用后端退出接口
					try {
						await request.call('auth/logout')
					} catch (logoutError) {
						console.error('调用退出接口失败:', logoutError)
						// 继续退出流程，不阻塞
					}
					
					// 3. 清除所有本地数据
					uni.removeStorageSync('userInfo')
					uni.removeStorageSync('token')
					uni.removeStorageSync('userPoints')
					uni.removeStorageSync('bills') // 清除本地账单缓存
					uni.removeStorageSync('pendingLevelUp') // 清除升级提示
					
					// 4. 更新本地状态
					data.userInfo = {
						avatarUrl: 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
						nickName: '未登录',
						isLogin: false
					}
					data.totalBills = 0
					data.recordDays = 0
					data.userPoints = 0
					data.todayPoints = 0
					
					uni.hideLoading()
					uni.showToast({
						title: '已退出登录',
						icon: 'success'
					})
					
					// 5. 刷新页面数据
					setTimeout(() => {
						loadStats()
					}, 500)
					
				} catch (error) {
					uni.hideLoading()
					console.error('退出登录失败:', error)
					
					// 即使出错也清除本地数据
					uni.removeStorageSync('userInfo')
					uni.removeStorageSync('token')
					uni.removeStorageSync('userPoints')
					uni.removeStorageSync('bills')
					uni.removeStorageSync('pendingLevelUp')
					
					data.userInfo = {
						avatarUrl: 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
						nickName: '未登录',
						isLogin: false
					}
					data.totalBills = 0
					data.recordDays = 0
					data.userPoints = 0
					data.todayPoints = 0
					
					uni.showToast({
						title: '已退出登录',
						icon: 'success'
					})
					
					setTimeout(() => {
						loadStats()
					}, 500)
				}
			}
		}
	})
}

// 跳转到提醒设置
const goToReminderSettings = () => {
	// 检查登录
	const userInfo = uni.getStorageSync('userInfo')
	if (!userInfo || !userInfo.isLogin) {
		uni.showModal({
			title: '需要登录',
			content: '登录后可以设置记账提醒',
			confirmText: '去登录',
			cancelText: '稍后',
			success: (res) => {
				if (res.confirm) {
					goToLogin()
				}
			}
		})
		return
	}
	
	uni.navigateTo({
		url: '/pages/settings/reminder'
	})
}

// 加载提醒时间
const loadReminderTime = () => {
	// 统一使用 reminderEnabled 字段
	const reminderEnabled = uni.getStorageSync('reminderEnabled') || false
	if (reminderEnabled) {
		const reminderTime = uni.getStorageSync('reminderTime') || ''
		data.reminderTime = reminderTime
	} else {
		data.reminderTime = ''
	}
}

// 获取APP版本号
const getAppVersion = () => {
	// #ifdef APP-PLUS
	const appInfo = plus.runtime
	data.appVersion = appInfo.version || '1.0.0'
	// #endif
}

onLoad(() => {
	getSystemInfo()
	loadStats()
	loadReminderTime()
	// #ifdef APP-PLUS
	getAppVersion()
	// #endif
})

onShow(() => {
	// 重新加载用户信息（检查登录状态）
	const userInfo = uni.getStorageSync('userInfo')
	if (userInfo && userInfo.isLogin) {
		data.userInfo = userInfo
	} else {
		// 未登录状态
		data.userInfo = {
			avatarUrl: 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
			nickName: '未登录',
			isLogin: false
		}
	}
	
	// 每次显示页面时静默刷新数据（不显示loading）
	// 先显示本地缓存，然后在后台更新
	loadStatsQuietly()
	
	// 重新加载提醒时间（用户可能刚设置完）
	loadReminderTime()
	
	// 检查是否有升级（延迟检查，避免与数据加载冲突）
	setTimeout(() => {
		checkLevelUpStatus()
	}, 1000)
})

// 检查升级状态
const checkLevelUpStatus = () => {
	// 检查是否有待显示的升级信息
	const pendingLevelUp = uni.getStorageSync('pendingLevelUp')
	
	if (pendingLevelUp && pendingLevelUp.isLevelUp) {
		// 显示升级弹窗
		uni.showModal({
			title: '🎉 恭喜升级',
			content: `恭喜您从【${pendingLevelUp.oldLevel.name}】升级到【${pendingLevelUp.newLevel.name}】！\n\n${pendingLevelUp.newLevel.desc}\n\n继续记账，冲击更高等级~`,
			showCancel: false,
			confirmText: '太棒了',
			confirmColor: pendingLevelUp.newLevel.color,
			success: () => {
				// 清除待显示的升级信息
				uni.removeStorageSync('pendingLevelUp')
			}
		})
	}
}

// 分享配置
onShareAppMessage(async () => {
	// 分享给好友奖励
	const reward = await rewardShareToFriend()
	if (reward) {
		setTimeout(() => {
			uni.showToast({
				title: `+${reward.addedPoints}积分 ${reward.reason}`,
				icon: 'none',
				duration: 2000
			})
		}, 500)
	}
	
	return {
		title: '语音拍照记账，3秒搞定！消费一目了然',
		path: '/pages/tab/index/index',
		imageUrl: '/static/shareLine.png'
	}
})

onShareTimeline(async () => {
	// 分享到朋友圈奖励
	const reward = await rewardShareToTimeline()
	if (reward) {
		setTimeout(() => {
			uni.showToast({
				title: `+${reward.addedPoints}积分 ${reward.reason}`,
				icon: 'none',
				duration: 2000
			})
		}, 500)
	}
	
	return {
		title: '钱哪去了 - 语音拍照记账，轻松管理每一笔',
		imageUrl: '/static/shareLine.png'
	}
})

// APP更新相关函数
// #ifdef APP-PLUS
// 检查APP更新
const checkAppUpdate = async () => {
	try {
		uni.showLoading({ title: '检查中...' })
		const updateInfo = await checkUpdate()
		uni.hideLoading()
		
		if (updateInfo.hasUpdate) {
			data.updateInfo = updateInfo
			data.showUpdateModal = true
		} else {
			uni.showToast({
				title: '已是最新版本',
				icon: 'success'
			})
		}
	} catch (error) {
		uni.hideLoading()
		console.error('检查更新失败:', error)
		uni.showToast({
			title: '检查更新失败',
			icon: 'none'
		})
	}
}

// 关闭更新弹窗
const closeUpdateModal = () => {
	if (!data.updateInfo.isForce) {
		data.showUpdateModal = false
	}
}

// 确认更新
const handleUpdate = () => {
	console.log('开始更新')
}

// 下载完成
const handleDownloadComplete = () => {
	console.log('下载完成')
	data.showUpdateModal = false
}
// #endif
</script>

<style lang="scss" scoped>
@import "@/styles/variables.scss";

.page {
	width: 100%;
	min-height: 100vh;
	background: linear-gradient(180deg, #52C41A 0%, #A8E6A3 400rpx, #F5F5F5 100%);
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

.navbar-content {
	height: 44px;
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: 0 $spacing-lg;
}

.navbar-left {
	width: 80rpx;
}

.navbar-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-white;
}

.navbar-right {
	width: 80rpx;
	display: flex;
	justify-content: flex-end;
}

.navbar-icon {
	width: 60rpx;
	height: 60rpx;
	display: flex;
	align-items: center;
	justify-content: center;
	background: rgba(255, 255, 255, 0.25);
	border-radius: 50%;
	transition: all $transition-fast;
}

.navbar-icon:active {
	transform: scale(0.9);
	background: rgba(255, 255, 255, 0.4);
}

.icon-dot {
	font-size: 40rpx;
	font-weight: bold;
	color: $text-white;
	line-height: 1;
}

.container {
	min-height: 100vh;
	padding: 0;
	padding-bottom: 100rpx;
}

/* 用户信息卡片 */
.user-card {
	background: transparent;
	border-radius: 0;
	padding: $spacing-lg 0;
	margin-bottom: 0;
	position: relative;
	overflow: visible;
}

.user-card::before {
	display: none;
}

.user-header {
	display: flex;
	align-items: center;
	gap: $spacing-lg;
	margin-bottom: $spacing-2xl;
	padding: 0 $spacing-lg;
	position: relative;
	z-index: 1;
}

.avatar-wrapper {
	position: relative;
	width: 120rpx;
	height: 120rpx;
}

.avatar {
	width: 120rpx;
	height: 120rpx;
	border-radius: 50%;
	border: 4rpx solid rgba(255, 255, 255, 0.3);
	box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
}

.level-badge {
	position: absolute;
	bottom: -8rpx;
	right: -8rpx;
	width: 44rpx; /* 美团风格：稍小的徽章 */
	height: 44rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	border: 3rpx solid #FFFFFF;
	box-shadow: $shadow-sm; /* 美团风格：更轻的阴影 */
	animation: pulse-badge 2s ease-in-out infinite;
}

@keyframes pulse-badge {
	0%, 100% {
		transform: scale(1);
	}
	50% {
		transform: scale(1.1);
	}
}

.level-icon {
	font-size: 18rpx; /* 美团风格：稍小的字号 */
	font-weight: 700;
	color: #FFFFFF;
	font-family: 'DIN Alternate', 'Arial', sans-serif;
	letter-spacing: 0.5rpx;
	text-shadow: 0 1rpx 3rpx rgba(0, 0, 0, 0.3);
}

.user-info {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: $spacing-xs;
}

.nickname-row {
	display: flex;
	align-items: center;
	gap: $spacing-xs;
}

.nickname {
	font-size: $font-size-xl; /* 美团风格：稍小的字号 */
	font-weight: $font-weight-medium;
	color: $text-white;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.1);
}

.edit-icon {
	font-size: $font-size-base;
	opacity: 0.8;
}

.login-hint {
	font-size: $font-size-sm;
	color: rgba(255, 255, 255, 0.9);
	padding: 4rpx 16rpx;
	background: rgba(255, 255, 255, 0.2);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	backdrop-filter: blur(10rpx);
}

.level-row {
	display: flex;
	align-items: center;
	gap: $spacing-xs;
	padding: 4rpx 16rpx; /* 美团风格：更紧凑 */
	background: rgba(255, 255, 255, 0.95);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	backdrop-filter: blur(10rpx);
	width: fit-content;
	margin-top: $spacing-xs;
	box-shadow: $shadow-sm; /* 美团风格：更轻的阴影 */
}

.level-name {
	font-size: $font-size-base;
	font-weight: $font-weight-bold;
	color: #52C41A;
	text-shadow: none;
}

.level-arrow {
	font-size: $font-size-lg;
	color: #52C41A;
	font-weight: $font-weight-light;
}

.user-tip {
	font-size: $font-size-xs;
	color: rgba(255, 255, 255, 0.7);
	margin-top: $spacing-xs;
}

/* 会员等级进度卡片 - 美团风格 */
.level-progress-card {
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(255, 255, 255, 0.85) 100%);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	padding: $spacing-xl;
	margin: 0 $spacing-lg $spacing-xl;
	box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
	backdrop-filter: blur(20rpx);
	border: 2rpx solid rgba(255, 255, 255, 0.5);
	position: relative;
	overflow: hidden;
}

.level-progress-card::before {
	content: '';
	position: absolute;
	top: -50%;
	right: -50%;
	width: 200%;
	height: 200%;
	background: radial-gradient(circle, rgba(82, 196, 26, 0.08) 0%, transparent 70%);
	animation: rotate-bg 20s linear infinite;
}

@keyframes rotate-bg {
	0% {
		transform: rotate(0deg);
	}
	100% {
		transform: rotate(360deg);
	}
}

.progress-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-bottom: $spacing-lg;
	position: relative;
	z-index: 1;
}

.progress-title {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.title-icon {
	font-size: 28rpx; /* 美团风格：稍小的图标 */
}

.title-text {
	font-size: $font-size-lg; /* 美团风格：稍小的字号 */
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.progress-points {
	display: flex;
	align-items: baseline;
	gap: 4rpx;
	padding: 6rpx 16rpx; /* 美团风格：更紧凑 */
	background: linear-gradient(135deg, #FFD700 0%, #FFA500 100%);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	box-shadow: $shadow-sm; /* 美团风格：更轻的阴影 */
}

.points-number {
	font-size: 36rpx; /* 美团风格：稍小的字号 */
	font-weight: $font-weight-bold;
	color: #FFFFFF;
	font-family: 'DIN Alternate', monospace;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.2);
}

.points-unit {
	font-size: $font-size-sm;
	color: rgba(255, 255, 255, 0.9);
	font-weight: $font-weight-medium;
}

.progress-bar-wrapper {
	position: relative;
	z-index: 1;
	margin-bottom: $spacing-md;
}

.progress-bar {
	height: 12rpx; /* 美团风格：更细的进度条 */
	background: linear-gradient(90deg, #F0F0F0 0%, #E8E8E8 100%);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	overflow: hidden;
	position: relative;
	box-shadow: inset 0 2rpx 4rpx rgba(0, 0, 0, 0.1);
}

.progress-fill {
	height: 100%;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	transition: width 0.8s cubic-bezier(0.4, 0, 0.2, 1);
	position: relative;
	overflow: hidden;
	box-shadow: $shadow-sm; /* 美团风格：更轻的阴影 */
	/* 使用会员等级的渐变色，而不是固定的绿色 */
}

.progress-glow {
	position: absolute;
	top: 0;
	left: -100%;
	width: 100%;
	height: 100%;
	background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.6) 50%, transparent 100%);
	animation: progress-shine 2s ease-in-out infinite;
}

@keyframes progress-shine {
	0% {
		left: -100%;
	}
	100% {
		left: 200%;
	}
}

.progress-labels {
	display: flex;
	justify-content: space-between;
	align-items: center;
	margin-top: $spacing-sm;
}

.current-level {
	font-size: $font-size-sm;
	color: $text-secondary;
	font-weight: $font-weight-medium;
}

.next-level {
	font-size: $font-size-sm;
	color: $primary-color;
	font-weight: $font-weight-bold;
}

.max-level {
	font-size: $font-size-sm;
	color: #FF4D4F;
	font-weight: $font-weight-bold;
}

.progress-tip {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: $spacing-xs;
	padding: $spacing-sm $spacing-lg;
	background: linear-gradient(135deg, rgba(82, 196, 26, 0.1) 0%, rgba(115, 209, 61, 0.05) 100%);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	position: relative;
	z-index: 1;
}

.progress-tip.max-tip {
	background: linear-gradient(135deg, rgba(255, 77, 79, 0.1) 0%, rgba(255, 120, 117, 0.05) 100%);
}

.tip-text {
	font-size: $font-size-sm;
	color: $text-secondary;
	font-weight: $font-weight-medium;
}

.tip-icon {
	font-size: $font-size-base;
	animation: bounce-tip 1.5s ease-in-out infinite;
}

@keyframes bounce-tip {
	0%, 100% {
		transform: translateY(0);
	}
	50% {
		transform: translateY(-4rpx);
	}
}

.stats-row {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: linear-gradient(135deg, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.3) 100%);
	padding: $spacing-xl $spacing-lg;
	margin: 0 $spacing-lg;
	border-radius: $radius-2xl;
	backdrop-filter: blur(10rpx);
	box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.12);
}

/* 卡片内部的统计行 */
.stats-row-inner {
	display: flex;
	align-items: center;
	justify-content: space-around;
	background: linear-gradient(135deg, rgba(82, 196, 26, 0.08) 0%, rgba(115, 209, 61, 0.05) 100%);
	padding: $spacing-lg;
	margin-top: $spacing-lg;
	border-radius: $radius-xl;
	border-top: 2rpx solid rgba(82, 196, 26, 0.1);
}

.stat-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: $spacing-xs;
	position: relative;
}

.stat-value {
	font-size: 44rpx; /* 美团风格：稍小的字号 */
	font-weight: $font-weight-bold;
	color: #FFFFFF;
	font-family: 'DIN Alternate', monospace;
	text-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.3);
	line-height: 1;
}

/* 卡片内部的统计数值 */
.stats-row-inner .stat-value {
	color: #52C41A;
	text-shadow: none;
}

.stat-label {
	font-size: $font-size-sm;
	color: rgba(255, 255, 255, 0.95);
	text-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.2);
	font-weight: $font-weight-medium;
}

/* 卡片内部的统计标签 */
.stats-row-inner .stat-label {
	color: $text-secondary;
	text-shadow: none;
}

.stat-divider {
	width: 2rpx;
	height: 60rpx;
	background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.4) 50%, transparent 100%);
}

/* 卡片内部的分隔线 */
.stats-row-inner .stat-divider {
	height: 50rpx;
	background: linear-gradient(180deg, transparent 0%, rgba(82, 196, 26, 0.2) 50%, transparent 100%);
}

/* 功能列表 - 美团风格 */
.function-list {
	background: $bg-white;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	padding: $spacing-lg;
	margin: $spacing-sm $spacing-lg 0;
	box-shadow: $shadow-card; /* 美团风格：更轻的阴影 */
}

.function-item {
	display: flex;
	align-items: center;
	justify-content: space-between;
	padding: $spacing-lg;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	transition: all $transition-fast;
	margin-bottom: $spacing-xs;
}

.function-item:active {
	background: $bg-light;
	transform: scale(0.98);
}

/* 分享按钮样式重置 */
.share-button {
	background: transparent;
	border: none;
	padding: $spacing-lg;
	margin: 0;
	line-height: normal;
	text-align: left;
	width: 100%;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
}

.share-button::after {
	border: none;
}

.function-left {
	display: flex;
	align-items: center;
	gap: $spacing-lg;
}

.function-info {
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.function-icon {
	width: 64rpx; /* 美团风格：更小的图标容器 */
	height: 64rpx;
	border-radius: $radius-md; /* 美团风格：8rpx圆角 */
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: $shadow-sm; /* 美团风格：更轻的阴影 */
	flex-shrink: 0;
}

.share-icon {
	background: linear-gradient(135deg, #1890FF 0%, #40A9FF 100%);
}

.reminder-icon {
	background: linear-gradient(135deg, #52C41A 0%, #73D13D 100%);
}

.export-icon {
	background: linear-gradient(135deg, #13C2C2 0%, #36CFC9 100%);
}

.about-icon {
	background: linear-gradient(135deg, #722ED1 0%, #9254DE 100%);
}

.settings-icon {
	background: linear-gradient(135deg, #8C8C8C 0%, #BFBFBF 100%);
}

.update-icon {
	background: linear-gradient(135deg, #FA8C16 0%, #FFA940 100%);
}

.icon-text {
	font-size: 32rpx; /* 美团风格：稍小的图标 */
}

.function-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-normal;
	color: $text-primary;
}

.function-right {
	display: flex;
	align-items: center;
	gap: $spacing-sm;
}

.function-desc {
	font-size: $font-size-base;
	color: #52C41A;
	font-weight: $font-weight-medium;
}

.function-desc.inactive {
	color: $text-tertiary;
}

.arrow {
	font-size: $font-size-3xl;
	color: $text-tertiary;
	font-weight: $font-weight-light;
}

/* 退出登录区域 */
.logout-section {
	padding: 0 $spacing-lg;
	margin: $spacing-lg 0 0;
	display: flex;
	justify-content: center;
}

.logout-button {
	width: 100%;
	padding: $spacing-lg;
	background: #52C41A;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	text-align: center;
	box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
	transition: all $transition-fast;
	display: flex;
	align-items: center;
	justify-content: center;
}

.logout-button:active {
	transform: scale(0.98);
	background: #73D13D;
}

.logout-text {
	font-size: $font-size-lg;
	color: #FFFFFF;
	font-weight: $font-weight-medium;
}

/* 提醒时间选择弹窗 */
.reminder-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background-color: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: flex-end;
	z-index: 10000;
	animation: fadeIn 0.3s ease;
}

.reminder-picker {
	width: 100%;
	background: $bg-white;
	border-radius: $radius-xl $radius-xl 0 0; /* 美团风格：16rpx圆角 */
	animation: slideUp 0.3s ease;
}

.picker-header {
	display: flex;
	justify-content: space-between;
	align-items: center;
	padding: $spacing-lg $spacing-xl;
	border-bottom: 1rpx solid $border-light;
}

.picker-title {
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	color: $text-primary;
}

.picker-close {
	font-size: $font-size-2xl;
	color: $text-tertiary;
	width: 48rpx;
	height: 48rpx;
	display: flex;
	align-items: center;
	justify-content: center;
}

.picker-content {
	padding: $spacing-xl 0;
}

.picker-view {
	width: 100%;
	height: 400rpx;
}

.picker-item {
	display: flex;
	align-items: center;
	justify-content: center;
	font-size: $font-size-xl;
	color: $text-primary;
}

.picker-footer {
	display: flex;
	gap: $spacing-md;
	padding: $spacing-lg $spacing-xl;
	border-top: 1rpx solid $border-light;
}

.picker-btn {
	flex: 1;
	text-align: center;
	padding: $spacing-lg;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	font-size: $font-size-lg;
	font-weight: $font-weight-bold;
	transition: all $transition-fast;
}

.cancel-btn {
	background: $bg-light;
	color: $text-secondary;
}

.cancel-btn:active {
	transform: scale(0.96);
	background: #E8E8E8;
}

.confirm-btn {
	background: $gradient-primary;
	color: $text-white;
	box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
}

.confirm-btn:active {
	transform: scale(0.96);
}

@keyframes fadeIn {
	from { opacity: 0; }
	to { opacity: 1; }
}

@keyframes slideUp {
	from { transform: translateY(100%); }
	to { transform: translateY(0); }
}

/* 等级详情弹框 */
.level-modal {
	position: fixed;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: rgba(0, 0, 0, 0.6);
	display: flex;
	align-items: center;
	justify-content: center;
	z-index: 10000;
	animation: fadeIn 0.3s ease;
	padding: 80rpx;
}

.level-modal-content {
	width: 100%;
	max-width: 560rpx;
	background: #FFFFFF;
	border-radius: $radius-xl; /* 美团风格：16rpx圆角 */
	overflow: hidden;
	animation: scaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

@keyframes scaleIn {
	from {
		transform: scale(0.8);
		opacity: 0;
	}
	to {
		transform: scale(1);
		opacity: 1;
	}
}

.modal-header {
	padding: 48rpx 32rpx 32rpx;
	text-align: center;
	background: linear-gradient(180deg, #FAFAFA 0%, #FFFFFF 100%);
}

.modal-icon {
	width: 88rpx; /* 美团风格：稍小的图标 */
	height: 88rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	margin: 0 auto 20rpx;
	box-shadow: $shadow-md; /* 美团风格：更轻的阴影 */
}

.modal-icon-text {
	font-size: 44rpx; /* 美团风格：稍小的字号 */
	color: #FFFFFF;
	font-weight: bold;
}

.modal-title {
	display: block;
	font-size: 32rpx; /* 美团风格：稍小的字号 */
	font-weight: bold;
	color: #333;
	margin-bottom: 12rpx;
}

.modal-desc {
	display: block;
	font-size: 26rpx;
	color: #999;
	line-height: 1.5;
}

.modal-body {
	padding: 32rpx;
}

/* 当前数据卡片 - 美团风格 */
.data-card {
	display: flex;
	background: linear-gradient(135deg, #F8F8F8 0%, #FAFAFA 100%);
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	padding: 28rpx 20rpx; /* 美团风格：更紧凑 */
	margin-bottom: 24rpx;
}

.data-item {
	flex: 1;
	display: flex;
	flex-direction: column;
	align-items: center;
	gap: 8rpx;
}

.data-value {
	font-size: 40rpx; /* 美团风格：稍小的字号 */
	font-weight: bold;
	color: #333;
	font-family: 'DIN Alternate', monospace;
	line-height: 1;
}

.data-label {
	font-size: 24rpx;
	color: #999;
}

.data-divider {
	width: 2rpx;
	background: linear-gradient(180deg, transparent 0%, #E0E0E0 50%, transparent 100%);
	margin: 0 16rpx;
}

/* 下一等级卡片 - 美团风格 */
.next-level-card {
	background: #FFFFFF;
	border: 2rpx solid #F0F0F0;
	border-radius: $radius-lg; /* 美团风格：12rpx圆角 */
	padding: 20rpx; /* 美团风格：更紧凑 */
	margin-bottom: 24rpx;
}

.next-level-info {
	display: flex;
	align-items: center;
	gap: 16rpx;
}

.next-level-badge {
	width: 56rpx;
	height: 56rpx;
	border-radius: 50%;
	display: flex;
	align-items: center;
	justify-content: center;
	box-shadow: 0 4rpx 12rpx rgba(82, 196, 26, 0.2);
	flex-shrink: 0;
}

.next-level-icon {
	font-size: 28rpx;
	color: #FFFFFF;
	font-weight: bold;
}

.next-level-text {
	flex: 1;
	display: flex;
	flex-direction: column;
	gap: 4rpx;
}

.next-level-name {
	font-size: 28rpx;
	font-weight: bold;
	color: #333;
}

.next-level-tip {
	font-size: 24rpx;
	color: #999;
}

/* 满级卡片 */
.max-level-card {
	display: flex;
	align-items: center;
	justify-content: center;
	gap: 12rpx;
	padding: 32rpx;
	background: linear-gradient(135deg, #FFF7E6 0%, #FFF1F0 100%);
	border-radius: 20rpx;
	margin-bottom: 24rpx;
}

.max-level-icon {
	font-size: 48rpx;
}

.max-level-text {
	font-size: 28rpx;
	font-weight: bold;
	color: #FF4D4F;
}

/* 弹框底部 */
.modal-footer {
	padding: 0 32rpx 32rpx;
	display: flex;
}

.modal-btn {
	flex: 1;
	padding: 24rpx;
	border-radius: 24rpx;
	text-align: center;
	box-shadow: 0 8rpx 24rpx rgba(82, 196, 26, 0.3);
	transition: all 0.3s ease;
}

.modal-btn:active {
	transform: scale(0.96);
}

.modal-btn-text {
	font-size: 30rpx;
	font-weight: bold;
	color: #FFFFFF;
}
</style>
