// 积分云端同步管理
import { checkLevelUp } from './memberLevel.js'
import request from './request.js'

/**
 * 从云端获取积分
 * @returns {Promise<number>}
 */
export const getPointsFromCloud = async () => {
	try {
		const res = await request.call('billManager', {
			action: 'getPoints'
		})
		
		if (res.success) {
			return res.points || 0
		}
		return 0
	} catch (error) {
		console.error('获取云端积分失败:', error)
		return 0
	}
}

/**
 * 添加积分到云端
 * @param {number} points - 积分数量
 * @param {string} reason - 获得原因
 * @param {object} metadata - 额外元数据
 * @returns {Promise<object>}
 */
export const addPointsToCloud = async (points, reason, metadata = {}) => {
	try {
		const res = await request.call('billManager', {
			action: 'addPoints',
			data: {
				points,
				reason,
				metadata
			}
		})
		
		if (res.success) {
			return {
				success: true,
				totalPoints: res.points,
				addedPoints: res.addedPoints
			}
		}
		return { success: false }
	} catch (error) {
		console.error('添加云端积分失败:', error)
		return { success: false, error }
	}
}

/**
 * 同步本地积分到云端
 * @returns {Promise<boolean>}
 */
export const syncPointsToCloud = async () => {
	try {
		const localPoints = uni.getStorageSync('userPoints') || 0
		const pointsHistory = uni.getStorageSync('pointsHistory') || []
		
		const res = await request.call('billManager', {
			action: 'syncPoints',
			data: {
				totalPoints: localPoints,
				pointsHistory: pointsHistory
			}
		})
		
		return res.success
	} catch (error) {
		console.error('同步积分到云端失败:', error)
		return false
	}
}

/**
 * 从云端拉取积分并更新本地
 * @returns {Promise<object>}
 */
export const pullPointsFromCloud = async () => {
	try {
		const res = await request.call('billManager', {
			action: 'getPoints'
		})
		
		if (res.success) {
			const cloudPoints = res.points || 0
			const localPoints = uni.getStorageSync('userPoints') || 0
			
			// 使用云端数据（云端为准）
			uni.setStorageSync('userPoints', cloudPoints)
			
			// 检查是否升级
			let levelUpInfo = checkLevelUp(localPoints, cloudPoints)
			
			// 如果升级了，检查是否已经提示过这个等级
			if (levelUpInfo && levelUpInfo.isLevelUp) {
				const notifiedLevel = uni.getStorageSync('notifiedLevel') || 0
				const newLevel = levelUpInfo.newLevel.level
				
				// 如果已经提示过这个等级，不再提示
				if (notifiedLevel >= newLevel) {
					console.log('该等级已提示过，不再重复提示')
					levelUpInfo = null
				} else {
					// 记录已提示的等级
					uni.setStorageSync('notifiedLevel', newLevel)
					console.log('首次升级到等级', newLevel, '，显示提示')
				}
			}
			
			console.log('从云端拉取积分成功:', cloudPoints)
			
			return {
				success: true,
				points: cloudPoints,
				levelUpInfo
			}
		}
		
		console.error('从云端拉取积分失败:', res)
		return { success: false }
	} catch (error) {
		console.error('拉取云端积分失败:', error)
		return { success: false, error }
	}
}

/**
 * 获取积分历史记录
 * @param {number} limit - 限制数量
 * @param {number} skip - 跳过数量
 * @returns {Promise<array>}
 */
export const getPointsHistoryFromCloud = async (limit = 50, skip = 0) => {
	try {
		const res = await request.call('billManager', {
			action: 'getPointsHistory',
			data: { limit, skip }
		})
		
		if (res.success) {
			return res.data || []
		}
		return []
	} catch (error) {
		console.error('获取积分历史失败:', error)
		return []
	}
}

/**
 * 混合模式：添加积分（本地+云端）
 * @param {number} points - 积分数量
 * @param {string} reason - 获得原因
 * @returns {Promise<object>}
 */
export const addPointsHybrid = async (points, reason) => {
	// 1. 立即更新本地（快速响应）
	let currentPoints = uni.getStorageSync('userPoints') || 0
	const oldPoints = currentPoints
	currentPoints += points
	uni.setStorageSync('userPoints', currentPoints)
	
	// 记录本地历史
	let pointsHistory = uni.getStorageSync('pointsHistory') || []
	pointsHistory.unshift({
		points: points,
		reason: reason,
		timestamp: Date.now(),
		totalPoints: currentPoints
	})
	if (pointsHistory.length > 100) {
		pointsHistory = pointsHistory.slice(0, 100)
	}
	uni.setStorageSync('pointsHistory', pointsHistory)
	
	// 2. 异步同步到云端（不阻塞用户操作）
	addPointsToCloud(points, reason).catch(err => {
		console.error('云端同步失败，但本地已保存:', err)
	})
	
	// 3. 检查升级
	const levelUpInfo = checkLevelUp(oldPoints, currentPoints)
	
	// 如果升级了，保存到本地存储，等待在"我的"页面显示
	if (levelUpInfo && levelUpInfo.isLevelUp) {
		uni.setStorageSync('pendingLevelUp', levelUpInfo)
	}
	
	return {
		success: true,
		oldPoints,
		newPoints: currentPoints,
		addedPoints: points,
		reason,
		levelUpInfo
	}
}

/**
 * 初始化积分（页面加载时调用）
 * 先显示本地，后台拉取云端
 * @returns {Promise<object>}
 */
export const initPoints = async () => {
	// 1. 先返回本地积分（快速显示）
	const localPoints = uni.getStorageSync('userPoints') || 0
	
	// 2. 后台从云端拉取最新数据（静默同步，不显示升级提示）
	pullPointsFromCloud().then(result => {
		if (result.success && result.levelUpInfo && result.levelUpInfo.isLevelUp) {
			// 如果升级了，保存到本地存储，等待在"我的"页面显示
			uni.setStorageSync('pendingLevelUp', result.levelUpInfo)
		}
	}).catch(err => {
		console.error('后台拉取积分失败:', err)
	})
	
	return {
		points: localPoints,
		fromCache: true
	}
}

export default {
	getPointsFromCloud,
	addPointsToCloud,
	syncPointsToCloud,
	pullPointsFromCloud,
	getPointsHistoryFromCloud,
	addPointsHybrid,
	initPoints
}
