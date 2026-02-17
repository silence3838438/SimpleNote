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
	 * @param {String} method - 请求方法，默认POST
	 */
	async call(path, data = {}, method = 'POST') {
		return this.callHttpApi(path, data, method)
	}
	
	/**
	 * 调用HTTP API
	 */
	async callHttpApi(path, data, method = 'POST') {
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
				method: method,
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
		console.log('📤 [上传] 开始上传文件:', filePath)
		
		return new Promise((resolve, reject) => {
			const token = uni.getStorageSync('token') || ''
			
			const headers = {}
			
			// 只有在有 token 时才添加 Authorization 头
			if (token) {
				headers['Authorization'] = `Bearer ${token}`
			}
			
			// APP端需要转换文件路径为绝对路径
			let uploadPath = filePath
			
			// #ifdef APP-PLUS
			// 如果是相对路径，转换为绝对路径
			if (!filePath.startsWith('/') && !filePath.startsWith('file://')) {
				// 获取临时文件目录
				uploadPath = plus.io.convertLocalFileSystemURL(filePath)
				console.log('📤 [上传] 转换后的路径:', uploadPath)
			}
			// #endif
			
			console.log('📤 [上传] 上传配置:', {
				url: `${apiConfig.apiBaseUrl}/upload`,
				filePath: uploadPath,
				name: 'file',
				hasToken: !!token
			})
			
			uni.uploadFile({
				url: `${apiConfig.apiBaseUrl}/upload`,
				filePath: uploadPath,
				name: 'file',
				header: headers,
				success: (res) => {
					console.log('📤 [上传] 上传成功，响应状态:', res.statusCode)
					console.log('📤 [上传] 响应数据:', res.data)
					
					try {
						const data = JSON.parse(res.data)
						console.log('📤 [上传] 解析后的数据:', data)
						resolve(data)
					} catch (error) {
						console.error('📤 [上传] JSON解析失败:', error)
						reject(new Error('响应数据解析失败'))
					}
				},
				fail: (err) => {
					console.error('📤 [上传] 上传失败:', err)
					reject(new Error('文件上传失败：' + (err.errMsg || '网络错误')))
				}
			})
		})
	}
}

export default new Request()
