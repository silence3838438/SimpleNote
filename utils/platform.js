// 平台判断工具
import request from './request.js'

export const isWeixin = () => {
	// #ifdef MP-WEIXIN
	return true
	// #endif
	// #ifndef MP-WEIXIN
	return false
	// #endif
}

export const isApp = () => {
	// #ifdef APP-PLUS
	return true
	// #endif
	// #ifndef APP-PLUS
	return false
	// #endif
}

export const isH5 = () => {
	// #ifdef H5
	return true
	// #endif
	// #ifndef H5
	return false
	// #endif
}

// 获取平台名称
export const getPlatform = () => {
	// #ifdef MP-WEIXIN
	return 'weixin'
	// #endif
	// #ifdef APP-PLUS
	return 'app'
	// #endif
	// #ifdef H5
	return 'h5'
	// #endif
	return 'unknown'
}

// 上传图片（兼容不同平台）
export const uploadImage = async (tempFilePath) => {
	// #ifdef MP-WEIXIN
	// 小程序使用云存储
	return new Promise((resolve, reject) => {
		const cloudPath = `ocr/${Date.now()}-${Math.random().toString(36).substr(2)}.jpg`
		wx.cloud.uploadFile({
			cloudPath: cloudPath,
			filePath: tempFilePath,
			success: (res) => {
				resolve(res.fileID)
			},
			fail: reject
		})
	})
	// #endif
	
	// #ifdef APP-PLUS
	// APP端直接返回本地路径，后续直接读取
	return Promise.resolve(tempFilePath)
	// #endif
	
	// #ifdef H5
	// H5端上传到服务器
	const result = await request.uploadFile(tempFilePath, `ocr/${Date.now()}.jpg`)
	return result.url
	// #endif
}

// 语音识别（兼容不同平台）
export const recognizeVoice = async (tempFilePath, duration) => {
	// #ifdef MP-WEIXIN
	// 小程序使用云函数
	const cloudPath = `voice/${Date.now()}-${Math.random().toString(36).substr(2)}.mp3`
	const uploadRes = await wx.cloud.uploadFile({
		cloudPath: cloudPath,
		filePath: tempFilePath
	})
	
	const result = await wx.cloud.callFunction({
		name: 'baiduASR',
		data: {
			fileID: uploadRes.fileID,
			duration: duration
		}
	})
	
	return result.result
	// #endif
	
	// #ifdef APP-PLUS
	// APP端直接调用百度API
	return request.call('baiduASR', {
		filePath: tempFilePath,
		duration: duration
	})
	// #endif
}

export default {
	isWeixin,
	isApp,
	isH5,
	getPlatform,
	uploadImage,
	recognizeVoice
}
