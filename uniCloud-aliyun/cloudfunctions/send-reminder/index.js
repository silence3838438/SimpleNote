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
			
			// 通知显示配置
			notification: {
				title: params.title || '记账提醒',
				body: params.content || '别忘了记录今天的收支哦~',
				icon: 'icon', // 应用图标
				sound: 'default', // 提示音
				badge: 1, // 角标数字
				vibrate: true, // 震动
				lights: true, // 呼吸灯
				priority: 'high', // 高优先级
				importance: 'high', // 重要性：高
				visibility: 'public', // 可见性：公开
				show_when: true, // 显示时间
				auto_cancel: true, // 点击后自动取消
				ongoing: false, // 不是持续通知
				channel_id: 'reminder_channel' // 通知渠道ID
			},
			
			// 厂商推送通道配置
			options: {
				// Android 通用配置
				android: {
					notification: {
						title: params.title || '记账提醒',
						body: params.content || '别忘了记录今天的收支哦~',
						icon: 'icon',
						sound: 'default',
						priority: 'high',
						importance: 'high',
						channel_id: 'reminder_channel',
						click_action: 'FLUTTER_NOTIFICATION_CLICK'
					}
				},
				
				// iOS APNs 配置
				apns: {
					aps: {
						alert: {
							title: params.title || '记账提醒',
							body: params.content || '别忘了记录今天的收支哦~'
						},
						sound: 'default',
						badge: 1,
						'content-available': 1,
						'mutable-content': 1
					},
					custom_data: {
						type: "accounting_reminder",
						page: "/pages/tab/index/index"
					}
				},
				
				// 华为推送配置
				HW: {
					"/message/notification/title": params.title || '记账提醒',
					"/message/notification/body": params.content || '别忘了记录今天的收支哦~',
					"/message/notification/importance": "HIGH",
					"/message/notification/channel_id": "reminder_channel",
					"/message/notification/sound": "default",
					"/message/notification/vibrate_config": ["200", "300", "200"],
					"/message/notification/visibility": "PUBLIC"
				},
				
				// 小米推送配置（使用通用渠道）
				XM: {
					"/extra.channel_id": "reminder_channel",
					"/extra.notification_style_button_left_notify_effect": "1",
					"/extra.notification_style_button_left_name": "打开应用",
					"/extra.notification_style_type": "1",
					"/extra.sound_uri": "default",
					"/extra.ticker": params.title || '记账提醒'
				},
				
				// OPPO推送配置
				OP: {
					"/notification/channel_id": "reminder_channel",
					"/notification/title": params.title || '记账提醒',
					"/notification/content": params.content || '别忘了记录今天的收支哦~',
					"/notification/style": "1",
					"/notification/small_icon": "icon",
					"/notification/large_icon": "icon"
				},
				
				// VIVO推送配置
				VV: {
					"/notification/title": params.title || '记账提醒',
					"/notification/content": params.content || '别忘了记录今天的收支哦~',
					"/notification/notifyType": "4",
					"/notification/sound": "1",
					"/notification/vibrate": "1"
				}
			}
		})
		
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
