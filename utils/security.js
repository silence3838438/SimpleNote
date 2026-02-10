// 安全加密工具（uni-app 版本）

// 加密密钥（生产环境应该从配置文件读取）
const AES_KEY = 'qiannaqule2024!@#$%^&*()_+key'
const SIGN_KEY = 'qiannaqule2024!@#$%^&*()_+sign'

/**
 * MD5 加密（简化版）
 */
function md5(str) {
	// uni-app 环境下使用 uni.md5 或引入第三方库
	// 这里使用简单的哈希算法作为示例
	let hash = 0
	for (let i = 0; i < str.length; i++) {
		const char = str.charCodeAt(i)
		hash = ((hash << 5) - hash) + char
		hash = hash & hash
	}
	return Math.abs(hash).toString(16)
}

/**
 * Base64 编码
 */
function base64Encode(str) {
	return uni.base64Encode(str)
}

/**
 * Base64 解码
 */
function base64Decode(str) {
	return uni.base64Decode(str)
}

/**
 * 简单加密（XOR + Base64）
 */
export function encrypt(data) {
	const jsonStr = JSON.stringify(data)
	let encrypted = ''
	
	for (let i = 0; i < jsonStr.length; i++) {
		const charCode = jsonStr.charCodeAt(i) ^ AES_KEY.charCodeAt(i % AES_KEY.length)
		encrypted += String.fromCharCode(charCode)
	}
	
	return base64Encode(encrypted)
}

/**
 * 简单解密（XOR + Base64）
 */
export function decrypt(encryptedData) {
	const decoded = base64Decode(encryptedData)
	let decrypted = ''
	
	for (let i = 0; i < decoded.length; i++) {
		const charCode = decoded.charCodeAt(i) ^ AES_KEY.charCodeAt(i % AES_KEY.length)
		decrypted += String.fromCharCode(charCode)
	}
	
	return JSON.parse(decrypted)
}

/**
 * 生成签名
 * @param {Object} data - 请求数据
 * @param {Number} timestamp - 时间戳
 */
export function generateSign(data, timestamp) {
	// 将数据按 key 排序
	const keys = Object.keys(data).sort()
	const sortedData = {}
	keys.forEach(key => {
		sortedData[key] = data[key]
	})
	
	// 拼接字符串：data + timestamp + key
	const str = JSON.stringify(sortedData) + timestamp + SIGN_KEY
	
	// 生成签名
	const sign = md5(str)
	return sign
}

/**
 * 验证签名
 */
export function verifySign(data, timestamp, sign) {
	const expectedSign = generateSign(data, timestamp)
	return sign === expectedSign
}

/**
 * 验证时间戳（5分钟内有效）
 */
export function verifyTimestamp(timestamp) {
	const now = Date.now()
	const diff = Math.abs(now - timestamp)
	const maxDiff = 5 * 60 * 1000 // 5分钟
	return diff < maxDiff
}

/**
 * 加密请求数据
 */
export function encryptRequest(data) {
	const timestamp = Date.now()
	const sign = generateSign(data, timestamp)
	const encryptedData = encrypt(data)
	
	return {
		data: encryptedData,
		timestamp,
		sign
	}
}

/**
 * 解密响应数据
 */
export function decryptResponse(encryptedData) {
	return decrypt(encryptedData)
}

export default {
	encrypt,
	decrypt,
	generateSign,
	verifySign,
	verifyTimestamp,
	encryptRequest,
	decryptResponse
}
