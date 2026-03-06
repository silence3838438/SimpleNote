'use strict';

/**
 * 记账提醒推送云函数
 * 用于发送记账提醒通知
 */

const uniPush = uniCloud.getPushManager({
	appId: "__UNI__1BF73C1" // 小獭记账的 AppID
})

exports.main = async (event) => {
	try {
		// 解析请求参数（云函数 URL 化后参数在 body 中）
		const params = JSON.parse(event.body)
		console.log('📤 开始发送推送:', params)
		console.log('📤 push_clientid:', params.push_clientid)
		
		// 发送推送消息
		const result = await uniPush.sendMessage({
			push_clientid: params.push_clientid,
			title: params.title || '记账提醒',
			content: params.content || '别忘了记录今天的收支哦~',
			request_id: params.request_id || `reminder_${Date.now()}`,
			force_notification: true, // 强制显示通知
			
			// 厂商推送通道配置
			options: {
				// iOS APNs 透传
				apns: {
					custom_data: {
						type: "accounting_reminder", // 消息类型标识
						page: "/pages/tab/index/index" // 跳转页面
					}
				},
				
				// 小米推送配置
				XM: {
					"/extra.channel_id": "132703", // 小米消息分类ID（需要在小米开放平台申请）
					"/extra.notification_style_button_left_notify_effect": "1" // 1：打开应用
				}
			}
		})
		
		console.log('✅ 推送发送成功:', result)
		
		console.log('✅ 推送发送成功:', result)
		
		return {
			success: true,
			data: result,
			message: '推送发送成功'
		}
		
	} catch (error) {
		console.error('❌ 推送发送失败:', error)
		
		return {
			success: false,
			error: error.message || error.errMsg || error.code || String(error),
			errorCode: error.code,
			errorMsg: error.errMsg,
			message: '推送发送失败'
		}
	}
}
