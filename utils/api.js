// 统一API服务 - 替换所有云函数调用
import request from './request.js'

/**
 * 账单管理API
 */
export const billApi = {
	// 添加账单
	add: (data) => request.call('billManager', { action: 'add', data }),
	
	// 获取账单列表
	list: (data) => request.call('billManager', { action: 'list', data }),
	
	// 更新账单
	update: (data) => request.call('billManager', { action: 'update', data }),
	
	// 删除账单
	delete: (data) => request.call('billManager', { action: 'delete', data }),
	
	// 同步账单
	sync: (data) => request.call('billManager', { action: 'sync', data }),
	
	// 获取预算
	getBudget: () => request.call('billManager', { action: 'getBudget' }),
	
	// 设置预算
	setBudget: (data) => request.call('billManager', { action: 'setBudget', data })
}

/**
 * 积分管理API
 */
export const pointsApi = {
	// 获取积分
	getPoints: () => request.call('billManager', { action: 'getPoints' }),
	
	// 添加积分
	addPoints: (data) => request.call('billManager', { action: 'addPoints', data }),
	
	// 获取积分历史
	getPointsHistory: (data) => request.call('billManager', { action: 'getPointsHistory', data }),
	
	// 同步积分
	syncPoints: (data) => request.call('billManager', { action: 'syncPoints', data })
}

/**
 * 用户管理API
 */
export const userApi = {
	// 获取用户信息
	getUserInfo: () => request.call('billManager', { action: 'getUserInfo' }),
	
	// 更新用户信息
	updateUserInfo: (data) => request.call('billManager', { action: 'updateUserInfo', data })
}

/**
 * 提醒管理API
 */
export const reminderApi = {
	// 获取提醒设置
	getReminder: () => request.call('billManager', { action: 'getReminder' }),
	
	// 设置提醒
	setReminder: (data) => request.call('billManager', { action: 'setReminder', data })
}

/**
 * OCR识别API
 */
export const ocrApi = {
	// OCR识别
	recognize: (data) => request.call('ocrRecognize', data)
}

/**
 * 语音识别API
 */
export const asrApi = {
	// 语音识别
	recognize: (data) => request.call('baiduASR', data)
}

/**
 * 文件上传API
 */
export const uploadApi = {
	// 上传文件
	upload: (filePath) => request.uploadFile(filePath)
}

export default {
	bill: billApi,
	points: pointsApi,
	user: userApi,
	reminder: reminderApi,
	ocr: ocrApi,
	asr: asrApi,
	upload: uploadApi
}
