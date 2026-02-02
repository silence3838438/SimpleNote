// 日期工具类

// 格式化日期
export function formatDate(date, format = 'YYYY-MM-DD') {
	const d = new Date(date)
	const year = d.getFullYear()
	const month = String(d.getMonth() + 1).padStart(2, '0')
	const day = String(d.getDate()).padStart(2, '0')
	const hour = String(d.getHours()).padStart(2, '0')
	const minute = String(d.getMinutes()).padStart(2, '0')
	const second = String(d.getSeconds()).padStart(2, '0')
	
	return format
		.replace('YYYY', year)
		.replace('MM', month)
		.replace('DD', day)
		.replace('HH', hour)
		.replace('mm', minute)
		.replace('ss', second)
}

// 获取相对时间描述
export function getRelativeTime(date) {
	const d = new Date(date)
	const now = new Date()
	const diff = Math.floor((now - d) / (1000 * 60 * 60 * 24))
	
	if (diff === 0) return '今天'
	if (diff === 1) return '昨天'
	if (diff === 2) return '前天'
	if (diff < 7) return `${diff}天前`
	if (diff < 30) return `${Math.floor(diff / 7)}周前`
	if (diff < 365) return `${Math.floor(diff / 30)}月前`
	return `${Math.floor(diff / 365)}年前`
}

// 解析自然语言日期
export function parseNaturalDate(text) {
	const now = new Date()
	
	if (text.includes('今天') || text.includes('今日')) {
		return formatDate(now)
	}
	
	if (text.includes('昨天') || text.includes('昨日')) {
		const yesterday = new Date(now)
		yesterday.setDate(yesterday.getDate() - 1)
		return formatDate(yesterday)
	}
	
	if (text.includes('前天')) {
		const dayBefore = new Date(now)
		dayBefore.setDate(dayBefore.getDate() - 2)
		return formatDate(dayBefore)
	}
	
	// 匹配具体日期格式
	const dateMatch = text.match(/(\d{4})[年\-\/](\d{1,2})[月\-\/](\d{1,2})/)
	if (dateMatch) {
		const year = dateMatch[1]
		const month = dateMatch[2].padStart(2, '0')
		const day = dateMatch[3].padStart(2, '0')
		return `${year}-${month}-${day}`
	}
	
	return formatDate(now)
}

// 获取月份范围
export function getMonthRange(year, month) {
	const startDate = new Date(year, month - 1, 1)
	const endDate = new Date(year, month, 0)
	
	return {
		start: formatDate(startDate),
		end: formatDate(endDate)
	}
}

// 获取季度范围
export function getQuarterRange(year, quarter) {
	const startMonth = (quarter - 1) * 3
	const endMonth = startMonth + 2
	
	const startDate = new Date(year, startMonth, 1)
	const endDate = new Date(year, endMonth + 1, 0)
	
	return {
		start: formatDate(startDate),
		end: formatDate(endDate)
	}
}

// 获取年份范围
export function getYearRange(year) {
	const startDate = new Date(year, 0, 1)
	const endDate = new Date(year, 11, 31)
	
	return {
		start: formatDate(startDate),
		end: formatDate(endDate)
	}
}
