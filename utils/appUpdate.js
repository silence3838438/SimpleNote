/**
 * APP版本更新工具
 */

// 检查版本更新
export const checkUpdate = async () => {
	// #ifdef APP-PLUS
	try {
		// 获取当前版本
		const currentVersion = plus.runtime.version
		
		// 调用后端接口检查更新
		const res = await uni.request({
			url: 'https://api.qiannaqule.top/api/app/check-update',
			method: 'POST',
			data: {
				version: currentVersion,
				platform: plus.os.name // 'Android' 或 'iOS'
			}
		})
		
		if (res.statusCode === 200 && res.data.success) {
			const updateInfo = res.data.data
			
			if (updateInfo.hasUpdate) {
				return {
					hasUpdate: true,
					newVersion: updateInfo.version,
					currentVersion: currentVersion,
					updateContent: updateInfo.updateContent || [],
					packageSize: updateInfo.packageSize || '未知',
					updateTime: updateInfo.updateTime || '',
					downloadUrl: updateInfo.downloadUrl || '',
					isForce: updateInfo.isForce || false, // 是否强制更新
					updateType: updateInfo.updateType || 'server', // server: 服务器下载, market: 应用市场
					markets: updateInfo.markets || {} // 应用市场链接配置
				}
			}
		}
		
		return {
			hasUpdate: false
		}
	} catch (error) {
		console.error('检查更新失败:', error)
		return {
			hasUpdate: false
		}
	}
	// #endif
	
	// #ifndef APP-PLUS
	return {
		hasUpdate: false
	}
	// #endif
}

// 比较版本号
export const compareVersion = (v1, v2) => {
	const arr1 = v1.split('.')
	const arr2 = v2.split('.')
	const len = Math.max(arr1.length, arr2.length)
	
	for (let i = 0; i < len; i++) {
		const num1 = parseInt(arr1[i] || 0)
		const num2 = parseInt(arr2[i] || 0)
		
		if (num1 > num2) {
			return 1
		} else if (num1 < num2) {
			return -1
		}
	}
	
	return 0
}

// 格式化文件大小
export const formatFileSize = (bytes) => {
	if (bytes < 1024) {
		return bytes + 'B'
	} else if (bytes < 1024 * 1024) {
		return (bytes / 1024).toFixed(1) + 'KB'
	} else {
		return (bytes / (1024 * 1024)).toFixed(1) + 'MB'
	}
}
