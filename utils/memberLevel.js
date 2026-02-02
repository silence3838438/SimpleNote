// 会员等级配置（简化版 - 纯展示，无实际权益）
const MEMBER_LEVELS = [
	{
		level: 1,
		name: '记账新手',
		icon: 'Lv1',
		color: '#95DE64',
		gradient: 'linear-gradient(135deg, #95DE64 0%, #73D13D 100%)',
		requiredPoints: 0,
		desc: '开启记账之旅，迈出理财第一步'
	},
	{
		level: 2,
		name: '记账达人',
		icon: 'Lv2',
		color: '#73D13D',
		gradient: 'linear-gradient(135deg, #73D13D 0%, #52C41A 100%)',
		requiredPoints: 100,
		desc: '坚持记账，养成良好习惯'
	},
	{
		level: 3,
		name: '理财能手',
		icon: 'Lv3',
		color: '#52C41A',
		gradient: 'linear-gradient(135deg, #52C41A 0%, #389E0D 100%)',
		requiredPoints: 300,
		desc: '精打细算，收支清晰明了'
	},
	{
		level: 4,
		name: '财务专家',
		icon: 'Lv4',
		color: '#389E0D',
		gradient: 'linear-gradient(135deg, #389E0D 0%, #237804 100%)',
		requiredPoints: 600,
		desc: '掌控财务，规划有条不紊'
	},
	{
		level: 5,
		name: '理财高手',
		icon: 'Lv5',
		color: '#237804',
		gradient: 'linear-gradient(135deg, #237804 0%, #135200 100%)',
		requiredPoints: 1000,
		desc: '财富管理，游刃有余'
	},
	{
		level: 6,
		name: '记账大师',
		icon: 'Lv6',
		color: '#135200',
		gradient: 'linear-gradient(135deg, #135200 0%, #092B00 100%)',
		requiredPoints: 2000,
		desc: '财务自由，人生赢家'
	}
]

/**
 * 根据积分计算会员等级
 * @param {number} points - 用户积分
 * @returns {object} 会员等级信息
 */
export const getMemberLevel = (points = 0) => {
	// 从高到低遍历等级，找到第一个满足条件的等级
	for (let i = MEMBER_LEVELS.length - 1; i >= 0; i--) {
		const level = MEMBER_LEVELS[i]
		if (points >= level.requiredPoints) {
			return {
				...level,
				currentPoints: points,
				// 计算到下一等级的进度
				nextLevel: i < MEMBER_LEVELS.length - 1 ? MEMBER_LEVELS[i + 1] : null,
				progress: calculateProgress(points, level, MEMBER_LEVELS[i + 1])
			}
		}
	}
	
	// 默认返回第一级
	return {
		...MEMBER_LEVELS[0],
		currentPoints: points,
		nextLevel: MEMBER_LEVELS[1],
		progress: calculateProgress(points, MEMBER_LEVELS[0], MEMBER_LEVELS[1])
	}
}

/**
 * 计算升级进度
 * @param {number} points - 当前积分
 * @param {object} currentLevel - 当前等级
 * @param {object} nextLevel - 下一等级
 * @returns {object} 进度信息
 */
const calculateProgress = (points, currentLevel, nextLevel) => {
	if (!nextLevel) {
		return {
			pointsProgress: 100,
			pointsNeeded: 0,
			isMaxLevel: true
		}
	}
	
	// 计算积分进度
	const pointsRange = nextLevel.requiredPoints - currentLevel.requiredPoints
	const pointsGained = points - currentLevel.requiredPoints
	const pointsProgress = pointsRange > 0 ? Math.min(Math.round((pointsGained / pointsRange) * 100), 100) : 100
	const pointsNeeded = Math.max(nextLevel.requiredPoints - points, 0)
	
	return {
		pointsProgress,
		pointsNeeded,
		isMaxLevel: false
	}
}

/**
 * 获取所有等级列表
 * @returns {array} 等级列表
 */
export const getAllLevels = () => {
	return MEMBER_LEVELS
}

/**
 * 检查是否升级
 * @param {number} oldPoints - 旧积分
 * @param {number} newPoints - 新积分
 * @returns {object|null} 如果升级返回新等级信息，否则返回null
 */
export const checkLevelUp = (oldPoints, newPoints) => {
	const oldLevel = getMemberLevel(oldPoints)
	const newLevel = getMemberLevel(newPoints)
	
	if (newLevel.level > oldLevel.level) {
		return {
			oldLevel,
			newLevel,
			isLevelUp: true
		}
	}
	
	return null
}

export default {
	getMemberLevel,
	getAllLevels,
	checkLevelUp,
	MEMBER_LEVELS
}
