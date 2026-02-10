/**
 * 腾讯云 Cloudbase 初始化配置
 * 用于 uni-app（小程序和APP）
 * 
 * 注意：使用懒加载模式，避免在模块加载时就初始化 SDK
 */
import cloudbaseSDK from "@cloudbase/js-sdk"
import adapter from "@cloudbase/adapter-uni-app"

let cloudbaseInstance = null
let isInitializing = false

// 懒加载初始化函数
function initCloudbase() {
	if (cloudbaseInstance) {
		return cloudbaseInstance
	}
	
	if (isInitializing) {
		// 正在初始化，等待完成
		return new Promise((resolve) => {
			const checkInterval = setInterval(() => {
				if (cloudbaseInstance) {
					clearInterval(checkInterval)
					resolve(cloudbaseInstance)
				}
			}, 100)
		})
	}
	
	isInitializing = true
	
	try {
		// 传入配置选项
		const options = {
			uni: uni // 传入 uni 对象，用于图形验证码功能
		}
		
		cloudbaseSDK.useAdapters(adapter, options)
		
		cloudbaseInstance = cloudbaseSDK.init({
			// 环境 ID
			env: "cloud1-8gxevfq393690dfe",
			// 地域
			region: "ap-shanghai",
			// 匿名访问令牌
			accessKey: "eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2Nsb3VkMS04Z3hldmZxMzkzNjkwZGZlLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsImV4cCI6NDA3MzUyODQ5OCwiaWF0IjoxNzY5ODQ1Mjk4LCJub25jZSI6IlBIVEpiS0VaUkktUmo5LXlxTjdGT2ciLCJhdF9oYXNoIjoiUEhUSmJLRVpSSS1SajkteXFON0ZPZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.o7cQi9-7kvHf_QdACOPxLAo36GOgGkzrkL93QLjXbBo71daeJOyIkjQJFle4_YpfrY2vwHcZ-EPG8COprAR3Vf6cfN9djeZZFzjLkK6t7EZTjBaafHwf244JEJWE7lWmmFEslY2V9INWlQ0Ib5_lhnyX-btdgmEJAbTB0zn2jHbk4sPxi9fvnhvaLdkTFIcEW5K_dn-_uU6mlcY1U2owdsLB6XJ7sNgLJVOYf1BtzjJJCB1p17ZwBaIp9YLV5MWibPS0WX6c-PDcgb4DBIeh4aIKjBVSnZPXTjrwZUSH1s63swdL79d1gsp3ipwUTg5nXupSll5bdxDfVYhW2f4yKA"
		})
		
		isInitializing = false
		return cloudbaseInstance
	} catch (error) {
		isInitializing = false
		console.error('Cloudbase 初始化失败:', error)
		throw error
	}
}

// 导出一个 Proxy 对象，延迟初始化
export default new Proxy({}, {
	get(target, prop) {
		const instance = initCloudbase()
		return instance[prop]
	}
})
