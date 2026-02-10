/**
 * 腾讯云 Cloudbase 初始化配置
 * 用于 uni-app（小程序和APP）
 * 
 * 注意：AI功能暂时禁用，需要在Cloudbase控制台配置匿名登录
 */
import cloudbaseSDK from "@cloudbase/js-sdk"
import adapter from "@cloudbase/adapter-uni-app"

// Polyfill console方法
if (typeof console.group !== 'function') {
	console.group = function(label) { console.log('--- ' + label + ' ---') }
}
if (typeof console.groupEnd !== 'function') {
	console.groupEnd = function() { console.log('--- End ---') }
}
if (typeof console.groupCollapsed !== 'function') {
	console.groupCollapsed = function(label) { console.log('--- ' + label + ' (collapsed) ---') }
}

let cloudbaseInstance = null

// 暂时禁用Cloudbase初始化，避免错误日志
// 如需启用AI功能，请先在腾讯云Cloudbase控制台配置匿名登录
const ENABLE_CLOUDBASE = false

if (ENABLE_CLOUDBASE) {
	try {
		cloudbaseSDK.useAdapters(adapter, { uni: uni })
		cloudbaseInstance = cloudbaseSDK.init({
			env: "cloud1-8gxevfq393690dfe",
			region: "ap-shanghai"
		})
		console.log('✅ Cloudbase SDK 初始化成功')
	} catch (error) {
		console.error('❌ Cloudbase 初始化失败:', error.message)
	}
}

// 导出空实例（AI功能禁用）
export default cloudbaseInstance || {
	auth() {
		return {
			getLoginState() { return Promise.resolve(null) },
			anonymousAuthProvider() {
				return { signIn() { return Promise.reject(new Error('Cloudbase未启用')) } }
			}
		}
	},
	ai() {
		return {
			bot: {
				sendMessage() { return Promise.reject(new Error('Cloudbase未启用')) }
			}
		}
	}
}
