<template>
	<view class="privacy-page">
		<scroll-view class="privacy-content" scroll-y>
			<view class="container">
				<view class="title">钱哪去了 - 隐私政策</view>
				
				<view class="section">
					<text class="text">【钱哪去了】深知个人信息对您的重要性，我们将按法律法规要求，采取相应的安全保护措施，尽力保护您的个人信息安全可控。本隐私政策适用于"钱哪去了"提供的所有产品和服务。</text>
				</view>
				
				<view class="section">
					<text class="text">在使用"钱哪去了"各项产品或服务前，请您务必仔细阅读并透彻理解本政策，特别是以<text class="highlight">粗体标识的条款</text>，您应重点阅读。如对本政策内容有任何疑问、意见或建议，您可通过本政策提供的联系方式与我们联系。</text>
				</view>
				
				<view class="section-title">一、我们如何收集和使用您的信息</view>
				
				<view class="sub-title">（一）账户注册与登录</view>
				<view class="section">
					<text class="text">为了使用"钱哪去了"的记账服务，您需要注册账户。我们会收集您的<text class="highlight">手机号码</text>用于账户注册和登录。您也可以选择使用<text class="highlight">微信授权登录</text>，我们会获取您的<text class="highlight">微信昵称、头像</text>等基本信息。</text>
				</view>
				
				<view class="sub-title">（二）记账功能</view>
				<view class="section">
					<text class="text">当您使用记账功能时，我们会收集和存储您主动输入的<text class="highlight">账单信息</text>，包括：</text>
					<text class="list-item">• 金额、类型（收入/支出）、分类</text>
					<text class="list-item">• 日期、备注信息</text>
					<text class="list-item">• 账单关联的图片（如小票照片）</text>
					<text class="text">这些信息仅用于为您提供记账、统计分析等服务。</text>
				</view>
				
				<view class="sub-title">（三）OCR小票识别功能</view>
				<view class="section">
					<text class="text">当您使用拍照记账功能时，您需要授权我们访问您的<text class="highlight">相机权限</text>和<text class="highlight">相册权限</text>。我们会：</text>
					<text class="list-item">• 收集您拍摄或选择的<text class="highlight">小票图片</text></text>
					<text class="list-item">• 将图片发送至百度OCR服务进行文字识别</text>
					<text class="list-item">• 识别结果仅用于自动填充账单信息</text>
					<text class="text"><text class="highlight">重要提示</text>：小票图片会通过加密方式传输至百度OCR服务，识别完成后我们不会长期保存原始图片。</text>
				</view>
				
				<view class="section-title">二、我们如何共享、转让、公开披露您的信息</view>
				
				<view class="sub-title">（一）共享</view>
				<view class="section">
					<text class="text">我们不会与任何第三方共享您的个人账单数据，但以下情况除外：</text>
					<text class="list-item">1. <text class="highlight">百度AI服务</text>：当您使用OCR识别或语音识别功能时，相关图片或语音会发送至百度AI服务进行处理</text>
					<text class="list-item">2. <text class="highlight">微信登录</text>：当您选择微信登录时，我们会从微信获取您授权的基本信息</text>
					<text class="list-item">3. <text class="highlight">法律要求</text>：根据法律法规、诉讼、政府要求等情况</text>
				</view>
				
				<view class="section-title">三、我们如何保护您的信息</view>
				<view class="section">
					<text class="text">我们采取以下安全措施保护您的信息：</text>
					<text class="list-item">• <text class="highlight">数据加密</text>：使用HTTPS加密传输，数据库加密存储</text>
					<text class="list-item">• <text class="highlight">访问控制</text>：严格限制数据访问权限</text>
					<text class="list-item">• <text class="highlight">安全审计</text>：定期进行安全评估和漏洞扫描</text>
					<text class="list-item">• <text class="highlight">应急响应</text>：建立数据安全事件应急预案</text>
				</view>
				
				<view class="section-title">四、您的权利</view>
				<view class="section">
					<text class="text">您对自己的个人信息享有以下权利：</text>
					<text class="list-item">• <text class="highlight">查询和更正</text>：您可以在APP中查看和修改您的个人信息</text>
					<text class="list-item">• <text class="highlight">删除</text>：您可以删除您的账单记录或注销账户</text>
					<text class="list-item">• <text class="highlight">撤回同意</text>：您可以在设备设置中关闭相机、麦克风、相册等权限</text>
					<text class="list-item">• <text class="highlight">导出数据</text>：您可以导出您的账单数据</text>
				</view>
				
				<view class="section-title">五、如何联系我们</view>
				<view class="section">
					<text class="text">如您对本隐私政策有任何疑问、意见或建议，可通过以下方式联系我们：</text>
					<text class="list-item">• APP内客服反馈</text>
					<text class="list-item">• 邮箱：951123604@qq.com</text>
					<text class="text">我们将在15个工作日内回复您的请求。</text>
				</view>
				
				<view class="footer">
					<text class="footer-text">生效日期：2026年2月5日</text>
					<text class="footer-text">版本号：v1.0</text>
				</view>
			</view>
		</scroll-view>
	</view>
</template>

<script setup>
</script>

<style lang="scss" scoped>
.privacy-page {
	width: 100%;
	height: 100vh;
	background: #F7F8FA;
}

.privacy-content {
	width: 100%;
	height: 100%;
}

.container {
	padding: 32rpx;
	padding-bottom: 100rpx;
}

.title {
	font-size: 40rpx;
	font-weight: bold;
	color: #333;
	text-align: center;
	margin-bottom: 32rpx;
}

.section-title {
	font-size: 32rpx;
	font-weight: bold;
	color: #333;
	margin-top: 48rpx;
	margin-bottom: 24rpx;
}

.sub-title {
	font-size: 28rpx;
	font-weight: bold;
	color: #666;
	margin-top: 32rpx;
	margin-bottom: 16rpx;
}

.section {
	margin-bottom: 24rpx;
}

.text {
	font-size: 28rpx;
	color: #666;
	line-height: 1.8;
	display: block;
	margin-bottom: 16rpx;
}

.highlight {
	color: #333;
	font-weight: bold;
}

.list-item {
	font-size: 28rpx;
	color: #666;
	line-height: 1.8;
	display: block;
	margin-left: 16rpx;
	margin-bottom: 12rpx;
}

.footer {
	margin-top: 64rpx;
	padding-top: 32rpx;
	border-top: 1rpx solid #E8E8E8;
	text-align: center;
}

.footer-text {
	font-size: 24rpx;
	color: #999;
	display: block;
	margin-bottom: 8rpx;
}
</style>
