/**
 * 定时任务：发送记账提醒
 * 运行方式：node backend/tasks/send-reminders.js
 * 支持：小程序订阅消息 + APP UniPush 2.0 推送
 */

require('dotenv').config();
const db = require('../db');
const wechatService = require('../services/wechat');
const axios = require('axios');

async function sendReminders() {
  try {
    console.log('========================================');
    console.log('🔔 开始执行记账提醒推送任务');
    console.log('========================================');
    
    // 获取当前时间（北京时间）
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTime = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
    
    console.log(`⏰ 当前时间: ${currentTime}`);
    
    // 获取所有已启用的提醒（包括小程序和APP用户）
    // 注意：reminders.user_id 可能是 openid(小程序) 或 user.id(APP)
    const reminders = await db.query(`
      SELECT 
        r.*,
        u.id as db_user_id,
        u.push_client_id,
        u.openid
      FROM reminders r
      LEFT JOIN users u ON (r.user_id = u.openid OR CAST(r.user_id AS CHAR) = CAST(u.id AS CHAR))
      WHERE r.enabled = 1 
      AND r.user_id IS NOT NULL
    `);
    
    console.log(`📋 找到 ${reminders.length} 个已订阅用户\n`);
    
    if (reminders.length === 0) {
      console.log('✅ 没有需要推送的用户');
      return;
    }
    
    let successCount = 0;
    let failCount = 0;
    let skipCount = 0;
    
    // 遍历所有提醒
    for (const reminder of reminders) {
      try {
        const reminderTime = reminder.time || '20:00';
        
        // 检查是否到了提醒时间（允许 5 分钟误差）
        if (isTimeMatch(currentTime, reminderTime)) {
          console.log(`⏰ 用户 ${reminder.user_id} 的提醒时间已到: ${reminderTime}`);
          
          // 检查今天是否已经推送过
          const today = now.toISOString().split('T')[0];
          if (reminder.last_push_date === today) {
            console.log(`   ⏭️  今天已推送过，跳过`);
            skipCount++;
            continue;
          }
          
          // 判断是小程序用户还是APP用户
          let result;
          if (reminder.push_client_id) {
            // APP用户：使用 UniPush 2.0
            console.log(`   📱 APP用户，使用 UniPush 2.0 推送`);
            result = await sendAppPushMessage(reminder);
          } else if (reminder.openid && reminder.template_id) {
            // 小程序用户：使用订阅消息
            console.log(`   📲 小程序用户，使用订阅消息推送`);
            result = await sendReminderMessage(reminder);
          } else {
            console.log(`   ⚠️  用户无有效推送渠道，跳过`);
            skipCount++;
            continue;
          }
          
          if (result.success) {
            successCount++;
            
            // 更新最后推送时间
            await db.query(`
              UPDATE reminders 
              SET last_push_date = ?, last_push_time = NOW(), updated_at = NOW()
              WHERE id = ?
            `, [today, reminder.id]);
            
            console.log(`   ✅ 推送成功\n`);
          } else {
            failCount++;
            console.log(`   ❌ 推送失败: ${result.errmsg || result.error}\n`);
            
            // 如果是用户拒绝或订阅过期（errcode: 43101, 47003），禁用提醒
            if (result.errcode === 43101 || result.errcode === 47003) {
              await db.query(`
                UPDATE reminders 
                SET enabled = 0, updated_at = NOW()
                WHERE id = ?
              `, [reminder.id]);
              console.log(`   ⚠️  用户订阅已过期，已禁用提醒\n`);
            }
          }
        } else {
          skipCount++;
        }
      } catch (error) {
        console.error(`❌ 处理用户 ${reminder.user_id} 时出错:`, error.message);
        failCount++;
      }
    }
    
    console.log('========================================');
    console.log('📊 推送统计:');
    console.log(`   ✅ 成功: ${successCount}`);
    console.log(`   ❌ 失败: ${failCount}`);
    console.log(`   ⏭️  跳过: ${skipCount}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('❌ 定时任务执行失败:', error);
  } finally {
    process.exit(0);
  }
}

/**
 * 检查时间是否匹配（当前时间在目标时间之后的 5 分钟内）
 */
function isTimeMatch(currentTime, targetTime) {
  const [currentHour, currentMinute] = currentTime.split(':').map(v => parseInt(v));
  const [targetHour, targetMinute] = targetTime.split(':').map(v => parseInt(v));
  
  const currentTotalMinutes = currentHour * 60 + currentMinute;
  const targetTotalMinutes = targetHour * 60 + targetMinute;
  
  // 计算时间差（当前时间 - 目标时间）
  const diff = currentTotalMinutes - targetTotalMinutes;
  
  // 如果当前时间在目标时间之后的 0-5 分钟内，则匹配
  return diff >= 0 && diff <= 5;
}

/**
 * 发送提醒消息（小程序订阅消息）
 */
async function sendReminderMessage(reminder) {
  try {
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`;
    const timeStr = reminder.time || '20:00';
    
    // 构造消息数据
    const data = {
      time1: {
        value: `${dateStr} ${timeStr}`
      },
      thing2: {
        value: '别忘了记录今天的收支哦~'
      }
    };
    
    // 发送订阅消息 - 直接跳转到首页
    return await wechatService.sendSubscribeMessage(
      reminder.openid,
      reminder.template_id,
      data,
      'pages/tab/index/index'
    );
  } catch (error) {
    console.error('发送提醒消息失败:', error);
    return { success: false, error: error.message };
  }
}

/**
 * 获取个推 auth_token
 * 注意：使用 uniCloud 云函数后，此函数已不再使用
 */
async function getGeTuiAuthToken() {
  // 此函数已废弃，保留仅供参考
  throw new Error('请使用 uniCloud 云函数发送推送');
}

/**
 * 发送 APP 推送消息（通过 uniCloud 云函数）
 */
async function sendAppPushMessage(reminder) {
  try {
    // 检查是否有 ClientID
    if (!reminder.push_client_id) {
      console.error('❌ 用户没有 push_client_id');
      return { success: false, error: '用户没有推送标识' };
    }
    
    const now = new Date();
    const dateStr = `${now.getFullYear()}年${(now.getMonth() + 1).toString().padStart(2, '0')}月${now.getDate().toString().padStart(2, '0')}日`;
    
    // 构造推送消息
    const message = {
      push_clientid: reminder.push_client_id,
      title: '记账提醒',
      content: `${dateStr} - 别忘了记录今天的收支哦~`,
      request_id: `reminder_${reminder.user_id}_${Date.now()}`
    };
    
    // 调用 uniCloud 云函数发送推送
    // 注意：这里需要配置 uniCloud 的 HTTP 访问地址
    // 在 uniCloud 控制台 -> 云函数 -> send-reminder -> 详情 -> 云函数URL化
    const cloudFunctionUrl = process.env.UNICLOUD_PUSH_URL || 'https://fc-mp-xxxxxxxx.next.bspapp.com/send-reminder';
    
    const response = await axios.post(cloudFunctionUrl, message, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (response.data && response.data.success) {
      return { success: true };
    } else {
      return { 
        success: false, 
        error: response.data?.message || '推送失败'
      };
    }
  } catch (error) {
    console.error('发送 APP 推送失败:', error);
    return { success: false, error: error.message };
  }
}

// 执行任务
sendReminders();
