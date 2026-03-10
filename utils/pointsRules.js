// 积分获取规则配置
import { addPointsHybrid } from './pointsSync.js'

const POINTS_RULES = {
	// 记账换算规则
	recordConversion: {
		pointsPerRecord: 2, // 每记一笔账获得2积分
		dailyFirstBonus: 5, // 每日首次记账额外获得5积分
		desc: '每记一笔账可获得2积分，每日首次记账额外获得5积分'
	},
	
	// 春节活动
	festivalTasks: {
		grabRedPacket: {
			name: '抢红包',
			points: '1-10',
			icon: '🧧',
			desc: '红包雨抢红包随机获得1-10积分'
		}
	},
	
	// 成就任务（纯荣誉展示，不给积分）
	achievementTasks: {
		record10: {
			name: '记账新手',
			icon: '🎯',
			desc: '累计记账10笔',
			target: 10,
			key: 'achievement_record10'
		},
		record50: {
			name: '记账达人',
			icon: '🏆',
			desc: '累计记账50笔',
			target: 50,
			key: 'achievement_record50'
		},
		record100: {
			name: '记账专家',
			icon: '💎',
			desc: '累计记账100笔',
			target: 100,
			key: 'achievement_record100'
		},
		record500: {
			name: '记账大师',
			icon: '👑',
			desc: '累计记账500笔',
			target: 500,
			key: 'achievement_record500'
		},
		continuous7: {
			name: '坚持一周',
			icon: '📅',
			desc: '连续记账7天',
			target: 7,
			key: 'achievement_continuous7'
		},
		continuous30: {
			name: '坚持一月',
			icon: '🌙',
			desc: '连续记账30天',
			target: 30,
			key: 'achievement_continuous30'
		},
		continuous100: {
			name: '百日坚持',
			icon: '⭐',
			desc: '连续记账100天',
			target: 100,
			key: 'achievement_continuous100'
		}
	},
	
	// 特殊任务（一次性奖励）
	specialTasks: {
		setBudget: {
			name: '设置预算',
			points: 5,
			icon: '💰',
			desc: '首次设置月预算可获得5积分',
			limit: 1,
			key: 'setBudget'
		},
		setReminder: {
			name: '设置提醒',
			points: 5,
			icon: '⏰',
			desc: '设置记账提醒可获得5积分',
			limit: 1,
			key: 'setReminder'
		}
	}
}

/**
 * 检查成就任务是否已完成
 * @param {string} taskKey - 任务key
 * @returns {boolean}
 */
const isAchievementCompleted = (taskKey) => {
	return uni.getStorageSync(taskKey) === true
}

/**
 * 标记成就任务为已完成
 * @param {string} taskKey - 任务key
 */
const markAchievementCompleted = (taskKey) => {
	uni.setStorageSync(taskKey, true)
}

/**
 * 添加积分（混合模式：本地+云端）
 * @param {number} points - 积分数量
 * @param {string} reason - 获得原因
 * @returns {object} 结果信息
 */
const addPoints = async (points, reason = '') => {
	// 使用混合模式添加积分
	return await addPointsHybrid(points, reason)
}

/**
 * 记账奖励（每笔2积分 + 每日首次额外5积分）
 * @param {boolean} isDailyFirst - 是否为今日首次记账
 * @returns {Promise<object>}
 */
export const rewardRecord = async (isDailyFirst = false) => {
	const recordPoints = POINTS_RULES.recordConversion.pointsPerRecord
	const bonusPoints = isDailyFirst ? POINTS_RULES.recordConversion.dailyFirstBonus : 0
	const totalPoints = recordPoints + bonusPoints
	
	const reason = isDailyFirst ? '记账（今日首次+5）' : '记账'
	return await addPoints(totalPoints, reason)
}

/**
 * 抢红包奖励（已在抢红包逻辑中处理）
 * @param {number} points - 获得的积分
 * @returns {Promise<object>}
 */
export const rewardGrabRedPacket = async (points) => {
	return await addPoints(points, '抢红包')
}

/**
 * 分享给好友奖励
 * @returns {Promise<null>}
 */
export const rewardShareToFriend = async () => {
	// 分享功能暂未配置积分奖励
	return null
}

/**
 * 分享到朋友圈奖励
 * @returns {Promise<null>}
 */
export const rewardShareToTimeline = async () => {
	// 分享功能暂未配置积分奖励
	return null
}

/**
 * 邀请好友奖励
 * @returns {Promise<null>}
 */
export const rewardInviteFriend = async () => {
	// 邀请功能暂未配置积分奖励
	return null
}

/**
 * 检查并解锁记账成就（不给积分，纯荣誉）
 * @param {number} totalBills - 总记账笔数
 * @returns {Promise<array>} 解锁的成就列表
 */
export const checkRecordAchievements = async (totalBills) => {
	const achievements = []
	const tasks = POINTS_RULES.achievementTasks
	
	// 检查记账笔数成就
	const recordTasks = [tasks.record10, tasks.record50, tasks.record100, tasks.record500]
	for (const task of recordTasks) {
		if (totalBills >= task.target && !isAchievementCompleted(task.key)) {
			markAchievementCompleted(task.key)
			achievements.push({
				...task,
				unlocked: true
			})
		}
	}
	
	return achievements
}

/**
 * 检查并解锁连续记账成就（不给积分，纯荣誉）
 * @param {number} continuousDays - 连续记账天数
 * @returns {Promise<array>} 解锁的成就列表
 */
export const checkContinuousAchievements = async (continuousDays) => {
	const achievements = []
	const tasks = POINTS_RULES.achievementTasks
	
	// 检查连续记账成就
	const continuousTasks = [tasks.continuous7, tasks.continuous30, tasks.continuous100]
	for (const task of continuousTasks) {
		if (continuousDays >= task.target && !isAchievementCompleted(task.key)) {
			markAchievementCompleted(task.key)
			achievements.push({
				...task,
				unlocked: true
			})
		}
	}
	
	return achievements
}

/**
 * 设置预算奖励
 * @returns {Promise<object|null>}
 */
export const rewardSetBudget = async () => {
	const task = POINTS_RULES.specialTasks.setBudget
	if (!isAchievementCompleted(task.key)) {
		markAchievementCompleted(task.key)
		return await addPoints(task.points, task.name)
	}
	return null
}

/**
 * 设置提醒奖励
 * @returns {Promise<object|null>}
 */
export const rewardSetReminder = async () => {
	const task = POINTS_RULES.specialTasks.setReminder
	if (!isAchievementCompleted(task.key)) {
		markAchievementCompleted(task.key)
		return await addPoints(task.points, task.name)
	}
	return null
}

/**
 * 获取所有积分规则
 * @returns {object}
 */
export const getAllPointsRules = () => {
	return POINTS_RULES
}

/**
 * 获取积分历史记录
 * @returns {array}
 */
export const getPointsHistory = () => {
	return uni.getStorageSync('pointsHistory') || []
}

/**
 * 获取今日已完成的任务
 * @returns {object}
 */
export const getTodayCompletedTasks = () => {
	// 简化后只需要记录抢红包次数
	const grabRedPacketCount = uni.getStorageSync('todayGrabCount') || 0
	
	return {
		grabRedPacket: grabRedPacketCount
	}
}

export default {
	POINTS_RULES,
	rewardRecord,
	rewardGrabRedPacket,
	checkRecordAchievements,
	checkContinuousAchievements,
	rewardSetBudget,
	rewardSetReminder,
	getAllPointsRules,
	getPointsHistory,
	getTodayCompletedTasks
}
