// 统一请求封装 - 统一使用Node.js后端API
import apiConfig from './apiConfig.js'
import security from './security.js'

// 是否启用加密（可以通过配置控制）
const ENABLE_ENCRYPTION = false // 设置为 true 启用加密

class Request {
	/**
	 * 调用HTTP API
	 * @param {String} path - API路径
	 * @param {Object} data - 请求数据
	 */
	async call(path, data = {}) {
		return this.callHttpApi(path, data)
	}
	
	/**
	 * 调用HTTP API
	 */
	async callHttpApi(path, data) {
		return new Promise((resolve, reject) => {
			const token = uni.getStorageSync('token') || ''
			
			const headers = {
				'Content-Type': 'application/json'
			}
			
			// 只有在有 token 时才添加 Authorization 头
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
			
			// 处理加密
			let requestData = data
			if (ENABLE_ENCRYPTION) {
				headers['X-Encrypted'] = 'true'
				requestData = security.encryptRequest(data)
			}
			
			uni.request({
				url: `${apiConfig.apiBaseUrl}/${path}`,
				method: 'POST',
				data: requestData,
				header: headers,
				timeout: 10000, // 10秒超时
				success: (res) => {
					console.log(`API请求成功 [${path}]:`, res)
					if (res.statusCode === 200) {
						let responseData = res.data
						
						// 处理加密响应
						if (ENABLE_ENCRYPTION && responseData.encrypted) {
							try {
								responseData = security.decryptResponse(responseData.data)
							} catch (error) {
								console.error('响应解密失败:', error)
								reject(new Error('响应解密失败'))
								return
							}
						}
						
						resolve(responseData)
					} else {
						console.error(`API请求失败 [${path}]:`, res)
						reject(new Error(res.data?.message || '请求失败'))
					}
				},
				fail: (err) => {
					console.error(`API请求异常 [${path}]:`, err)
					reject(err)
				}
			})
		})
	}
	
	/**
	 * 上传文件
	 */
	async uploadFile(filePath) {
		return new Promise((resolve, reject) => {
			const token = uni.getStorageSync('token') || ''
			
			const headers = {}
			
			// 只有在有 token 时才添加 Authorization 头
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
			
			uni.uploadFile({
				url: `${apiConfig.apiBaseUrl}/upload`,
				filePath: filePath,
				name: 'file',
				header: headers,
				success: (res) => {
					const data = JSON.parse(res.data)
					resolve(data)
				},
				fail: (err) => {
					reject(err)
				}
			})
		})
	}
}

export default new Request()
