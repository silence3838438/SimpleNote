// API配置文件 - 统一使用Node.js后端
const config = {
	// 统一使用HTTPS API
	useCloudFunction: false,
	// 后端API地址
	// 生产环境使用香港服务器（无需备案）
	apiBaseUrl: 'https://api.qiannaqule.top/api'
	// 本地测试环境
	// apiBaseUrl: 'http://localhost:3000/api'
}

export default config
