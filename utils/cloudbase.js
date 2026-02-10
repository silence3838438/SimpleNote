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

// 禁用前端 Cloudbase（改用后端 API）
const ENABLE_CLOUDBASE = false

if (ENABLE_CLOUDBASE) {
	try {
		console.log('🔧 [Cloudbase] 开始初始化...')
		
		// 传入 uni 对象，用于跨平台兼容
		const options = {
			uni: uni // 传入 uni 对象，用于跨平台验证功能
		}
		
		console.log('🔧 [Cloudbase] 配置 adapter...')
		cloudbaseSDK.useAdapters(adapter, options)
		
		console.log('🔧 [Cloudbase] 调用 init...')
		cloudbaseInstance = cloudbaseSDK.init({
			env: "cloud1-8gxevfq393690dfe",
			region: "ap-shanghai",
			// 访问密钥，用于身份认证（匿名登录）
			accessKey: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2Nsb3VkMS04Z3hldmZxMzkzNjkwZGZlLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsImV4cCI6NDA3MzUyODQ5OCwiaWF0IjoxNzY5ODQ1Mjk4LCJub25jZSI6IlBIVEpiS0VaUkktUmo5LXlxTjdGT2ciLCJhdF9oYXNoIjoiUEhUSmJLRVpSSS1SajkteXFON0ZPZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.o7cQi9-7kvHf_QdACOPxLAo36GOgGkzrkL93QLjXbBo71daeJOyIkjQJFle4_YpfrY2vwHcZ-EPG8COprAR3Vf6cfN9djeZZFzjLkK6t7EZTjBaafHwf244JEJWE7lWmmFEslY2V9INWlQ0Ib5_lhnyX-btdgmEJAbTB0zn2jHbk4sPxi9fvnhvaLdkTFIcEW5K_dn-_uU6mlcY1U2owdsLB6XJ7sNgLJVOYf1BtzjJJCB1p17ZwBaIp9YLV5MWibPS0WX6c-PDcgb4DBIeh4aIKjBVSnZPXTjrwZUSH1s63swdL79d1gsp3ipwUTg5nXupSll5bdxDfVYhW2f4yKA"
		})
		
		if (cloudbaseInstance) {
			console.log('✅ Cloudbase SDK 初始化成功')
			console.log('🔧 [Cloudbase] 实例类型:', typeof cloudbaseInstance)
		} else {
			console.error('❌ Cloudbase 初始化返回 null')
		}
	} catch (error) {
		console.error('❌ Cloudbase 初始化失败:', error.message)
		console.error('❌ 错误堆栈:', error.stack)
		cloudbaseInstance = null
	}
} else {
	console.log('ℹ️ [Cloudbase] 前端 SDK 已禁用，使用后端 API 调用')
}

// 导出 Cloudbase 实例（如果初始化失败，导出 null）
export default cloudbaseInstance
