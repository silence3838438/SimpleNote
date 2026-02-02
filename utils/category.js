// 分类工具类

// 支出分类（参考主流记账应用优化）
export const expenseCategories = [
	{ id: 1, name: '餐饮', icon: '🍜', type: 'expense', keywords: ['餐厅', '饭店', '食堂', '外卖', '麦当劳', '肯德基', '星巴克', '咖啡', '火锅', '烧烤', '美食', '小吃', '茶饮', '奶茶', '快餐', '早餐', '午餐', '晚餐', '宵夜'] },
	{ id: 2, name: '交通', icon: '🚗', type: 'expense', keywords: ['滴滴', '出租', '地铁', '公交', '加油', '停车', '打车', '运输', '客运', '旅客', '票务', '车费', '出行', '享道', '曹操', '高德', '高铁', '飞机', '火车', '动车', '汽车', '船票'] },
	{ id: 3, name: '购物', icon: '🛒', type: 'expense', keywords: ['超市', '商场', '淘宝', '京东', '拼多多', '便利店', '电商', '网购', '商务', '百货', '购物中心', '沃尔玛', '家乐福', '大润发', '永辉', '华润', '7-11', '全家', '罗森', '买', '购'] },
	{ id: 4, name: '娱乐', icon: '🎮', type: 'expense', keywords: ['电影', '游戏', 'KTV', '健身', '娱乐', '影院', '网吧', '台球', '保龄球', '旅游', '景点', '唱歌', '玩', '看电影', '运动', '球类'] },
	{ id: 5, name: '住房', icon: '🏠', type: 'expense', keywords: ['房租', '物业', '水电', '燃气', '水费', '电费', '宽带', '房贷', '租房', '房屋', '维修', '装修'] },
	{ id: 6, name: '医疗', icon: '💊', type: 'expense', keywords: ['医院', '药店', '体检', '诊所', '卫生院', '医疗', '门诊', '挂号', '药房', '医药', '就诊', '治疗', '检查', '化验', '看病', '买药', '配药'] },
	{ id: 7, name: '通讯', icon: '📱', type: 'expense', keywords: ['话费', '流量', '宽带', '手机', '移动', '联通', '电信', '充值', '套餐', '网费'] },
	{ id: 8, name: '服饰', icon: '👔', type: 'expense', keywords: ['衣服', '鞋子', '包包', '服装', '配饰', '优衣库', 'ZARA', 'H&M', '裤子', '裙子', '外套', '内衣', '袜子', '帽子', '围巾', '手表', '眼镜'] },
	{ id: 9, name: '美容', icon: '💄', type: 'expense', keywords: ['美发', '美甲', '化妆品', '护肤', '理发', '美容院', '美容', '化妆', '洗头', '染发', '烫发', '面膜', '口红', '香水'] },
	{ id: 10, name: '学习', icon: '📚', type: 'expense', keywords: ['书籍', '课程', '培训', '教育', '学费', '书店', '文具', '学习', '考试', '报名', '辅导', '补习', '网课', '教材'] },
	{ id: 11, name: '社交', icon: '👥', type: 'expense', keywords: ['聚餐', '礼物', '红包', '请客', '送礼', '份子钱', '婚礼', '生日', '聚会', '宴请'] },
	{ id: 12, name: '其他', icon: '📦', type: 'expense', keywords: [] }
]

// 收入分类
export const incomeCategories = [
	{ id: 101, name: '工资', icon: '💰', type: 'income', keywords: ['工资', '薪水', '薪资', '月薪', '年薪', '发工资', '工资收入'] },
	{ id: 102, name: '兼职', icon: '💼', type: 'income', keywords: ['兼职', '外快', '副业', '临时工', '兼职收入'] },
	{ id: 103, name: '奖金', icon: '🎁', type: 'income', keywords: ['奖金', '年终奖', '提成', '绩效', '奖励', '季度奖', '项目奖'] },
	{ id: 104, name: '红包', icon: '🧧', type: 'income', keywords: ['红包', '压岁钱', '礼金', '份子钱'] },
	{ id: 105, name: '退款', icon: '↩️', type: 'income', keywords: ['退款', '退货', '退费', '返现', '退税'] },
	{ id: 106, name: '报销', icon: '📋', type: 'income', keywords: ['报销', '补贴', '津贴', '餐补', '交通补贴'] },
	{ id: 107, name: '投资', icon: '📈', type: 'income', keywords: ['利息', '分红', '股息', '理财', '投资', '股票', '基金', '收益', '投资收益'] },
	{ id: 108, name: '其他', icon: '💵', type: 'income', keywords: ['收入', '赚', '挣', '收到', '到账', '其他收入'] }
]

// 所有分类（兼容旧代码）
export const categories = expenseCategories

// 智能分类（支持收入和支出）
export function smartClassify(text, merchant = '', type = 'expense') {
	const searchText = (text + ' ' + merchant).toLowerCase()
	const categoryList = type === 'income' ? incomeCategories : expenseCategories
	
	for (const category of categoryList) {
		for (const keyword of category.keywords) {
			if (searchText.includes(keyword)) {
				return category
			}
		}
	}
	
	// 默认返回"其他"
	return categoryList[categoryList.length - 1]
}

// 根据ID获取分类
export function getCategoryById(id) {
	const allCategories = [...expenseCategories, ...incomeCategories]
	return allCategories.find(c => c.id === id) || expenseCategories[11]
}

// 获取所有分类（根据类型）
export function getAllCategories(type = 'expense') {
	return type === 'income' ? incomeCategories : expenseCategories
}

// 获取支出分类
export function getExpenseCategories() {
	return expenseCategories
}

// 获取收入分类
export function getIncomeCategories() {
	return incomeCategories
}
