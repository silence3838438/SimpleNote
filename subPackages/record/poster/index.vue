<template>
	<view class="page">
		<view class="container">
			<!-- 海报预览区 -->
			<view class="poster-preview">
				<image v-if="data.posterImage" :src="data.posterImage" mode="widthFix" class="poster-image"></image>
				<view v-else class="poster-loading">
					<text class="loading-text">生成中...</text>
				</view>
			</view>
			
			<!-- Canvas绘制区（隐藏） -->
			<canvas canvas-id="posterCanvas" :style="{ width: canvasWidth + 'px', height: canvasHeight + 'px', position: 'fixed', left: '-9999px' }"></canvas>
			
			<!-- 操作按钮 -->
			<view class="actions">
				<button class="action-btn secondary" @click="goBack">
					<text>返回</text>
				</button>
				<button class="action-btn primary" @click="savePoster" :disabled="!data.posterImage">
					<text>保存到相册</text>
				</button>
			</view>
		</view>
	</view>
</template>

<script setup>
import { reactive, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const canvasWidth = 375
const canvasHeight = 667

const data = reactive({
	filterType: 'month',
	filterLabel: '月度',
	totalExpense: 0,
	totalIncome: 0,
	balance: 0,
	billCount: 0,
	topCategories: [],
	insights: [], // 财务分析洞察
	budgetPercent: 0, // 预算使用率
	posterImage: ''
})

const getCurrentDate = () => {
	const now = new Date()
	const year = now.getFullYear()
	const month = (now.getMonth() + 1).toString().padStart(2, '0')
	
	if (data.filterType === 'month') {
		return `${year}年${month}月`
	} else if (data.filterType === 'quarter') {
		const quarter = Math.floor(now.getMonth() / 3) + 1
		return `${year}年第${quarter}季度`
	} else {
		return `${year}年`
	}
}

const drawPoster = () => {
	const ctx = uni.createCanvasContext('posterCanvas')
	
	// ========== 背景 ==========
	// 主背景渐变（从深绿到浅绿）
	const bgGradient = ctx.createLinearGradient(0, 0, 0, canvasHeight)
	bgGradient.addColorStop(0, '#3AA76D')
	bgGradient.addColorStop(0.5, '#52C41A')
	bgGradient.addColorStop(1, '#73D13D')
	ctx.setFillStyle(bgGradient)
	ctx.fillRect(0, 0, canvasWidth, canvasHeight)
	
	// 装饰圆形（左上）
	ctx.setFillStyle('rgba(255, 255, 255, 0.08)')
	ctx.beginPath()
	ctx.arc(-30, 80, 120, 0, 2 * Math.PI)
	ctx.fill()
	
	// 装饰圆形（右上）
	ctx.setFillStyle('rgba(255, 255, 255, 0.06)')
	ctx.beginPath()
	ctx.arc(canvasWidth + 20, 150, 100, 0, 2 * Math.PI)
	ctx.fill()
	
	// 装饰圆形（右下）
	ctx.setFillStyle('rgba(255, 255, 255, 0.05)')
	ctx.beginPath()
	ctx.arc(canvasWidth - 40, canvasHeight - 100, 150, 0, 2 * Math.PI)
	ctx.fill()
	
	// ========== 顶部标题区 ==========
	ctx.setFillStyle('#FFFFFF')
	ctx.setFontSize(32)
	ctx.setTextAlign('center')
	ctx.fillText(`我的${data.filterLabel}账单`, canvasWidth / 2, 60)
	
	ctx.setFillStyle('rgba(255, 255, 255, 0.85)')
	ctx.setFontSize(15)
	ctx.fillText(getCurrentDate(), canvasWidth / 2, 90)
	
	// 新增：收支对比标签
	if (data.totalIncome > 0) {
		const balanceText = data.balance >= 0 ? `结余 ¥${data.balance.toFixed(0)}` : `赤字 ¥${Math.abs(data.balance).toFixed(0)}`
		const balanceColor = data.balance >= 0 ? '#4CAF50' : '#F44336'
		
		ctx.setFillStyle('rgba(255, 255, 255, 0.2)')
		roundRect(ctx, canvasWidth / 2 - 80, 100, 160, 28, 14)
		ctx.fill()
		
		ctx.setFillStyle(balanceColor)
		ctx.setFontSize(13)
		ctx.fillText(balanceText, canvasWidth / 2, 118)
	}
	
	// ========== 主卡片区域 ==========
	const cardY = 140
	const cardPadding = 20
	const cardWidth = canvasWidth - cardPadding * 2
	
	// 白色主卡片（增加高度以容纳更多内容）
	ctx.setFillStyle('#FFFFFF')
	ctx.setShadow(0, 8, 24, 'rgba(0, 0, 0, 0.15)')
	roundRect(ctx, cardPadding, cardY, cardWidth, 460, 20)
	ctx.fill()
	ctx.setShadow(0, 0, 0, 'transparent')
	
	// ========== 总支出区域 ==========
	// 顶部装饰条
	const accentGradient = ctx.createLinearGradient(cardPadding, cardY, cardPadding + cardWidth, cardY)
	accentGradient.addColorStop(0, '#52C41A')
	accentGradient.addColorStop(1, '#73D13D')
	ctx.setFillStyle(accentGradient)
	roundRect(ctx, cardPadding, cardY, cardWidth, 6, 20)
	ctx.fill()
	
	// 总支出标签
	ctx.setFillStyle('#8C8C8C')
	ctx.setFontSize(14)
	ctx.setTextAlign('center')
	ctx.fillText('总支出', canvasWidth / 2, cardY + 50)
	
	// 总支出金额（超大字体）
	ctx.setFillStyle('#1A1A1A')
	ctx.setFontSize(56)
	ctx.setTextAlign('center')
	const amountText = `¥${data.totalExpense.toFixed(2)}`
	ctx.fillText(amountText, canvasWidth / 2, cardY + 115)
	
	// 金额下方的装饰线
	ctx.setFillStyle('rgba(82, 196, 26, 0.2)')
	ctx.fillRect(canvasWidth / 2 - 60, cardY + 125, 120, 2)
	
	// 账单笔数标签
	ctx.setFillStyle('rgba(82, 196, 26, 0.1)')
	roundRect(ctx, canvasWidth / 2 - 65, cardY + 140, 130, 28, 14)
	ctx.fill()
	
	ctx.setFillStyle('#52C41A')
	ctx.setFontSize(13)
	ctx.setTextAlign('center')
	ctx.fillText(`共 ${data.billCount} 笔消费`, canvasWidth / 2, cardY + 158)
	
	// ========== 新增：收支对比区域 ==========
	if (data.totalIncome > 0) {
		// 分割线
		ctx.setFillStyle('#F0F0F0')
		ctx.fillRect(cardPadding + 30, cardY + 180, cardWidth - 60, 1)
		
		// 收入支出对比
		const compareY = cardY + 210
		
		// 收入
		ctx.setFillStyle('#52C41A')
		ctx.setFontSize(12)
		ctx.setTextAlign('left')
		ctx.fillText('收入', cardPadding + 40, compareY)
		
		ctx.setFillStyle('#1A1A1A')
		ctx.setFontSize(18)
		ctx.setTextAlign('right')
		ctx.fillText(`¥${data.totalIncome.toFixed(0)}`, canvasWidth / 2 - 20, compareY)
		
		// 支出
		ctx.setFillStyle('#F5222D')
		ctx.setFontSize(12)
		ctx.setTextAlign('left')
		ctx.fillText('支出', canvasWidth / 2 + 20, compareY)
		
		ctx.setFillStyle('#1A1A1A')
		ctx.setFontSize(18)
		ctx.setTextAlign('right')
		ctx.fillText(`¥${data.totalExpense.toFixed(0)}`, cardPadding + cardWidth - 40, compareY)
		
		// 预算使用率（如果有）
		if (data.budgetPercent > 0) {
			const budgetY = cardY + 245
			
			ctx.setFillStyle('#8C8C8C')
			ctx.setFontSize(12)
			ctx.setTextAlign('left')
			ctx.fillText('预算使用', cardPadding + 40, budgetY)
			
			// 预算进度条
			const barX = cardPadding + 120
			const barY = budgetY - 8
			const barWidth = cardWidth - 160
			const barHeight = 12
			
			// 背景
			ctx.setFillStyle('#F0F0F0')
			roundRect(ctx, barX, barY, barWidth, barHeight, 6)
			ctx.fill()
			
			// 进度
			const progressWidth = Math.min(barWidth * (data.budgetPercent / 100), barWidth)
			const progressColor = data.budgetPercent >= 100 ? '#F5222D' : data.budgetPercent >= 80 ? '#FA8C16' : '#52C41A'
			ctx.setFillStyle(progressColor)
			roundRect(ctx, barX, barY, progressWidth, barHeight, 6)
			ctx.fill()
			
			// 百分比
			ctx.setFillStyle(progressColor)
			ctx.setFontSize(13)
			ctx.setTextAlign('right')
			ctx.fillText(`${data.budgetPercent}%`, cardPadding + cardWidth - 40, budgetY)
		}
	}
	
	// ========== TOP3分类区域 ==========
	if (data.topCategories.length > 0) {
		// 分割线
		const top3StartY = data.totalIncome > 0 && data.budgetPercent > 0 ? cardY + 270 : cardY + 185
		ctx.setFillStyle('#F0F0F0')
		ctx.fillRect(cardPadding + 30, top3StartY, cardWidth - 60, 1)
		
		// TOP3标题
		ctx.setFillStyle('#1A1A1A')
		ctx.setFontSize(16)
		ctx.setTextAlign('left')
		ctx.fillText('消费分类 TOP3', cardPadding + 30, top3StartY + 30)
		
		// 绘制TOP3分类（紧凑版）
		data.topCategories.forEach((item, index) => {
			const itemY = top3StartY + 55 + index * 45
			const itemX = cardPadding + 30
			
			// 排名徽章
			const badgeColors = [
				{ bg: '#FFD700', shadow: 'rgba(255, 215, 0, 0.3)' },
				{ bg: '#C0C0C0', shadow: 'rgba(192, 192, 192, 0.3)' },
				{ bg: '#CD7F32', shadow: 'rgba(205, 127, 50, 0.3)' }
			]
			
			const badge = badgeColors[index] || { bg: '#52C41A', shadow: 'rgba(82, 196, 26, 0.3)' }
			
			ctx.setFillStyle(badge.bg)
			ctx.setShadow(0, 2, 6, badge.shadow)
			ctx.beginPath()
			ctx.arc(itemX + 12, itemY, 12, 0, 2 * Math.PI)
			ctx.fill()
			ctx.setShadow(0, 0, 0, 'transparent')
			
			ctx.setFillStyle('#FFFFFF')
			ctx.setFontSize(12)
			ctx.setTextAlign('center')
			ctx.fillText(`${index + 1}`, itemX + 12, itemY + 4)
			
			// 图标
			ctx.setFillStyle('#1A1A1A')
			ctx.setFontSize(22)
			ctx.setTextAlign('left')
			ctx.fillText(item.icon, itemX + 35, itemY + 6)
			
			// 分类名称
			ctx.setFillStyle('#262626')
			ctx.setFontSize(15)
			ctx.fillText(item.name, itemX + 65, itemY + 6)
			
			// 占比标签
			ctx.setFillStyle('rgba(82, 196, 26, 0.1)')
			roundRect(ctx, itemX + 120, itemY - 10, 45, 20, 10)
			ctx.fill()
			
			ctx.setFillStyle('#52C41A')
			ctx.setFontSize(11)
			ctx.setTextAlign('center')
			ctx.fillText(`${item.percent}%`, itemX + 142.5, itemY + 4)
			
			// 金额（右对齐）
			ctx.setFillStyle('#1A1A1A')
			ctx.setFontSize(17)
			ctx.setTextAlign('right')
			ctx.fillText(`¥${item.amount.toFixed(0)}`, cardPadding + cardWidth - 30, itemY + 6)
		})
	}
	
	// ========== 底部区域 ==========
	const footerY = 620
	
	// 底部卡片
	ctx.setFillStyle('rgba(255, 255, 255, 0.95)')
	ctx.setShadow(0, 4, 16, 'rgba(0, 0, 0, 0.1)')
	roundRect(ctx, cardPadding, footerY, cardWidth, 120, 16)
	ctx.fill()
	ctx.setShadow(0, 0, 0, 'transparent')
	
	// 小程序码
	const qrcodeSize = 70
	const qrcodeX = cardPadding + 25
	const qrcodeY = footerY + 25
	
	// 小程序码白色背景
	ctx.setFillStyle('#FFFFFF')
	ctx.setShadow(0, 2, 8, 'rgba(0, 0, 0, 0.08)')
	ctx.fillRect(qrcodeX - 3, qrcodeY - 3, qrcodeSize + 6, qrcodeSize + 6)
	ctx.setShadow(0, 0, 0, 'transparent')
	
	// 绘制小程序码
	ctx.drawImage('/static/code.jpg', qrcodeX, qrcodeY, qrcodeSize, qrcodeSize)
	
	// 右侧文案区域
	const textX = qrcodeX + qrcodeSize + 20
	
	// 品牌名称
	ctx.setFillStyle('#1A1A1A')
	ctx.setFontSize(20)
	ctx.setTextAlign('left')
	ctx.fillText('钱哪去了？', textX, footerY + 45)
	
	// 副标题
	ctx.setFillStyle('#8C8C8C')
	ctx.setFontSize(12)
	ctx.fillText('AI智能记账助手', textX, footerY + 68)
	
	// 扫码提示
	ctx.setFillStyle('#52C41A')
	ctx.setFontSize(11)
	ctx.fillText('长按识别小程序码', textX, footerY + 90)
	
	// 装饰元素 - 右上角图标
	ctx.setFillStyle('rgba(82, 196, 26, 0.1)')
	ctx.beginPath()
	ctx.arc(cardPadding + cardWidth - 20, footerY + 20, 25, 0, 2 * Math.PI)
	ctx.fill()
	
	ctx.setFillStyle('#52C41A')
	ctx.setFontSize(24)
	ctx.setTextAlign('center')
	ctx.fillText('💰', cardPadding + cardWidth - 20, footerY + 28)
	
	ctx.draw(false, () => {
		// 绘制完成后，将canvas转为图片
		setTimeout(() => {
			uni.canvasToTempFilePath({
				canvasId: 'posterCanvas',
				fileType: 'png',
				quality: 1,
				success: (res) => {
					data.posterImage = res.tempFilePath
					uni.hideLoading()
				},
				fail: (err) => {
					console.error('生成海报失败:', err)
					uni.hideLoading()
					uni.showToast({
						title: '生成失败',
						icon: 'none'
					})
				}
			})
		}, 500)
	})
}

// 绘制圆角矩形
const roundRect = (ctx, x, y, w, h, r) => {
	ctx.beginPath()
	ctx.arc(x + r, y + r, r, Math.PI, Math.PI * 1.5)
	ctx.arc(x + w - r, y + r, r, Math.PI * 1.5, Math.PI * 2)
	ctx.arc(x + w - r, y + h - r, r, 0, Math.PI * 0.5)
	ctx.arc(x + r, y + h - r, r, Math.PI * 0.5, Math.PI)
	ctx.closePath()
}

const savePoster = async () => {
	if (!data.posterImage) {
		uni.showToast({
			title: '海报生成中',
			icon: 'none'
		})
		return
	}
	
	try {
		await uni.saveImageToPhotosAlbum({
			filePath: data.posterImage
		})
		
		uni.showToast({
			title: '已保存到相册',
			icon: 'success'
		})
	} catch (error) {
		console.error('保存失败:', error)
		
		// 如果是权限问题，引导用户授权
		if (error.errMsg && error.errMsg.includes('auth')) {
			uni.showModal({
				title: '需要相册权限',
				content: '请在设置中允许访问相册',
				confirmText: '去设置',
				success: (res) => {
					if (res.confirm) {
						uni.openSetting()
					}
				}
			})
		} else {
			uni.showToast({
				title: '保存失败',
				icon: 'none'
			})
		}
	}
}

const goBack = () => {
	uni.navigateBack()
}

onLoad((options) => {
	if (options.data) {
		try {
			const posterData = JSON.parse(decodeURIComponent(options.data))
			Object.assign(data, posterData)
			
			// 显示加载提示
			uni.showLoading({ title: '生成海报中...' })
			
			// 延迟绘制，确保页面渲染完成
			setTimeout(() => {
				drawPoster()
			}, 300)
		} catch (error) {
			console.error('解析数据失败:', error)
			uni.hideLoading()
		}
	}
})
</script>

<style lang="scss" scoped>
	@import "@/styles/variables.scss";
	
	.page {
		width: 100%;
		min-height: 100vh;
		background: linear-gradient(180deg, #F0FFF4 0%, #FAFAFA 100%);
	}
	
	.container {
		padding: $spacing-xl;
		display: flex;
		flex-direction: column;
		align-items: center;
		min-height: 100vh;
	}
	
	.poster-preview {
		width: 100%;
		margin-bottom: $spacing-2xl;
		border-radius: $radius-2xl;
		overflow: hidden;
		box-shadow: 0 16rpx 48rpx rgba(0, 0, 0, 0.12);
		background: $bg-white;
	}
	
	.poster-image {
		width: 100%;
		display: block;
	}
	
	.poster-loading {
		width: 100%;
		height: 1000rpx;
		display: flex;
		align-items: center;
		justify-content: center;
		background: linear-gradient(135deg, #FFFFFF 0%, #F6FFED 100%);
	}
	
	.loading-text {
		font-size: $font-size-lg;
		color: $text-tertiary;
	}
	
	/* 操作按钮 */
	.actions {
		display: flex;
		gap: $spacing-md;
		width: 100%;
		padding: $spacing-lg $spacing-xl;
		position: fixed;
		bottom: 0;
		left: 0;
		right: 0;
		background: linear-gradient(180deg, transparent 0%, rgba(255, 255, 255, 0.98) 20%, #FFFFFF 100%);
		padding-bottom: calc($spacing-lg + env(safe-area-inset-bottom));
		box-sizing: border-box;
	}
	
	.action-btn {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: $spacing-md $spacing-lg;
		border-radius: $radius-xl;
		font-size: $font-size-base;
		font-weight: $font-weight-semibold;
		border: none;
		transition: all $transition-fast;
		position: relative;
		overflow: hidden;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
		letter-spacing: 0.5rpx;
	}
	
	.action-btn::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 50%;
		width: 0;
		height: 0;
		border-radius: 50%;
		background: rgba(255, 255, 255, 0.3);
		transform: translate(-50%, -50%);
		transition: width 0.6s, height 0.6s;
	}
	
	.action-btn:active::before {
		width: 300rpx;
		height: 300rpx;
	}
	
	.action-btn.secondary {
		background: $bg-white;
		color: $text-secondary;
		border: 2rpx solid rgba(0, 0, 0, 0.08);
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04);
	}
	
	.action-btn.secondary:active {
		background: $bg-light;
		transform: scale(0.98);
		box-shadow: 0 1rpx 4rpx rgba(0, 0, 0, 0.06);
	}
	
	.action-btn.primary {
		background: $gradient-primary;
		color: $text-white;
		box-shadow: 0 4rpx 16rpx rgba(82, 196, 26, 0.3);
		position: relative;
	}
	
	.action-btn.primary::after {
		content: '';
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: linear-gradient(135deg, rgba(255, 255, 255, 0.15) 0%, transparent 50%, rgba(0, 0, 0, 0.05) 100%);
		border-radius: $radius-xl;
		pointer-events: none;
	}
	
	.action-btn.primary:active {
		transform: scale(0.98);
		box-shadow: 0 2rpx 8rpx rgba(82, 196, 26, 0.25);
	}
	
	.action-btn[disabled] {
		opacity: 0.5;
		transform: none !important;
		box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.04) !important;
	}
</style>
