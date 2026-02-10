// 分类工具类

// 支出分类（参考主流记账应用优化）
export const expenseCategories = [
	{ id: 1, name: '餐饮', icon: '🍜', type: 'expense', keywords: ['餐厅', '饭店', '食堂', '外卖', '麦当劳', '肯德基', '星巴克', '咖啡', '火锅', '烧烤', '美食', '小吃', '茶饮', '奶茶', '快餐', '早餐', '午餐', '晚餐', '宵夜', '饿了么', '美团外卖'] },
	{ id: 2, name: '交通', icon: '🚗', type: 'expense', keywords: ['滴滴', '出租', '地铁', '公交', '加油', '停车', '打车', '运输', '客运', '旅客', '票务', '车费', '出行', '享道', '曹操', '高德', '高铁', '飞机', '火车', '动车', '汽车', '船票', '哈啰', '青桔', '美团单车'] },
	{ id: 3, name: '购物', icon: '🛒', type: 'expense', keywords: ['超市', '商场', '淘宝', '京东', '拼多多', '便利店', '电商', '网购', '商务', '百货', '购物中心', '沃尔玛', '家乐福', '大润发', '永辉', '华润', '7-11', '全家', '罗森', '买', '购', '盒马', '叮咚买菜'] },
	{ id: 4, name: '娱乐', icon: '🎮', type: 'expense', keywords: ['电影', '游戏', 'KTV', '健身', '娱乐', '影院', '网吧', '台球', '保龄球', '旅游', '景点', '唱歌', '玩', '看电影', '运动', '球类', '乐刻', '超级猩猩', 'Keep'] },
	{ id: 5, name: '住房', icon: '🏠', type: 'expense', keywords: ['房租', '物业', '水电', '燃气', '水费', '电费', '宽带', '房贷', '租房', '房屋', '维修', '装修'] },
	{ id: 6, name: '医疗', icon: '💊', type: 'expense', keywords: ['医院', '药店', '体检', '诊所', '卫生院', '医疗', '门诊', '挂号', '药房', '医药', '就诊', '治疗', '检查', '化验', '看病', '买药', '配药', '平安好医生', '微医', '丁香医生', '美年大健康', '爱康国宾'] },
	{ id: 7, name: '通讯', icon: '📱', type: 'expense', keywords: ['话费', '流量', '宽带', '手机', '移动', '联通', '电信', '充值', '套餐', '网费'] },
	{ id: 8, name: '服饰', icon: '👔', type: 'expense', keywords: ['衣服', '鞋子', '包包', '服装', '配饰', '优衣库', 'ZARA', 'H&M', '裤子', '裙子', '外套', '内衣', '袜子', '帽子', '围巾', '手表', '眼镜', 'GAP', 'UR', '海澜之家', '太平鸟'] },
	{ id: 9, name: '美容', icon: '💄', type: 'expense', keywords: ['美发', '美甲', '化妆品', '护肤', '理发', '美容院', '美容', '化妆', '洗头', '染发', '烫发', '面膜', '口红', '香水', '屈臣氏', '丝芙兰', '娇兰佳人', '快剪', '文峰', '永琪'] },
	{ id: 10, name: '学习', icon: '📚', type: 'expense', keywords: ['书籍', '课程', '培训', '教育', '学费', '书店', '文具', '学习', '考试', '报名', '辅导', '补习', '网课', '教材', '学而思', '猿辅导', '作业帮', '新东方', '英孚', '达内'] },
	{ id: 11, name: '社交', icon: '👥', type: 'expense', keywords: ['聚餐', '礼物', '红包', '请客', '送礼', '份子钱', '婚礼', '生日', '聚会', '宴请'] },
	{ id: 13, name: '零食', icon: '🍿', type: 'expense', keywords: ['零食', '饮料', '水果', '小食', '坚果', '薯片', '饼干', '糖果', '巧克力', '果汁', '可乐', '雪碧', '矿泉水', '苹果', '香蕉', '橙子', '葡萄', '西瓜', '草莓'] },
	{ id: 14, name: '数码', icon: '💻', type: 'expense', keywords: ['手机', '电脑', '平板', '相机', '耳机', '音箱', '键盘', '鼠标', '充电器', '数据线', '移动硬盘', 'U盘', '苹果', 'iPhone', 'iPad', 'Mac', '华为', '小米', '戴尔', '联想'] },
	{ id: 15, name: '家居', icon: '🛋️', type: 'expense', keywords: ['家具', '家电', '日用品', '厨具', '床上用品', '沙发', '桌椅', '冰箱', '洗衣机', '空调', '电视', '微波炉', '电饭煲', '宜家', '无印良品', 'MUJI', '名创优品'] },
	{ id: 16, name: '汽车', icon: '🚙', type: 'expense', keywords: ['车贷', '保养', '维修', '保险', '洗车', '年检', '违章', '车险', '4S店', '汽修', '换油', '轮胎', '中石油', '中石化', '壳牌'] },
	{ id: 17, name: '宠物', icon: '🐾', type: 'expense', keywords: ['宠物', '猫粮', '狗粮', '宠物医院', '宠物店', '宠物美容', '猫砂', '宠物用品', '疫苗', '驱虫', '绝育', '瑞鹏', '芭比堂', '波奇', 'E宠'] },
	{ id: 12, name: '其他', icon: '📦', type: 'expense', keywords: [] }
]

// 收入分类
export const incomeCategories = [
	{ id: 101, name: '工资', icon: '💰', type: 'income', keywords: ['工资', '薪水', '薪资', '月薪', '年薪', '发工资', '工资收入'] },
	{ id: 102, name: '兼职', icon: '💼', type: 'income', keywords: ['兼职', '外快', '副业', '临时工', '兼职收入', '美团众包', '饿了么', '闪送', '接单', '设计', '写作', '咨询'] },
	{ id: 103, name: '奖金', icon: '🎁', type: 'income', keywords: ['奖金', '年终奖', '提成', '绩效', '奖励', '季度奖', '项目奖'] },
	{ id: 104, name: '红包', icon: '🧧', type: 'income', keywords: ['红包', '压岁钱'] },
	{ id: 105, name: '退款', icon: '↩️', type: 'income', keywords: ['退款', '退货', '退费', '返现', '退税'] },
	{ id: 106, name: '报销', icon: '📋', type: 'income', keywords: ['报销', '补贴', '津贴', '餐补', '交通补贴'] },
	{ id: 107, name: '投资', icon: '📈', type: 'income', keywords: ['利息', '分红', '股息', '理财', '投资', '股票', '基金', '收益', '投资收益', '支付宝', '微信理财通', '天天基金', '雪球'] },
	{ id: 109, name: '礼金', icon: '🎀', type: 'income', keywords: ['礼金', '份子钱', '收礼', '随礼'] },
	{ id: 110, name: '出售', icon: '💸', type: 'income', keywords: ['出售', '卖', '二手', '闲置', '转让', '闲鱼', '转转'] },
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
