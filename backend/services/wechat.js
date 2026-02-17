/**
 * 微信服务 - 处理微信 API 相关功能
 */

const axios = require('axios');

class WeChatService {
  constructor() {
    this.appId = process.env.WX_APPID;
    this.appSecret = process.env.WX_SECRET;
    this.accessToken = null;
    this.tokenExpireTime = 0;
  }

  /**
   * 获取微信 access_token
   */
  async getAccessToken() {
    try {
      // 如果 token 还有效，直接返回
      if (this.accessToken && Date.now() < this.tokenExpireTime) {
        return this.accessToken;
      }

      // 获取新的 access_token
      const url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${this.appId}&secret=${this.appSecret}`;
      const response = await axios.get(url);

      if (response.data.access_token) {
        this.accessToken = response.data.access_token;
        // 提前 5 分钟过期，避免边界情况
        this.tokenExpireTime = Date.now() + (response.data.expires_in - 300) * 1000;
        console.log('✅ 获取微信 access_token 成功');
        return this.accessToken;
      } else {
        throw new Error(`获取 access_token 失败: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.error('❌ 获取微信 access_token 失败:', error.message);
      throw error;
    }
  }

  /**
   * 发送订阅消息
   * @param {string} openid - 用户 openid
   * @param {string} templateId - 模板 ID
   * @param {object} data - 消息数据
   * @param {string} page - 跳转页面（可选，不传则跳转到首页）
   */
  async sendSubscribeMessage(openid, templateId, data, page) {
    try {
      const accessToken = await this.getAccessToken();
      const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;

      // 小程序状态：developer(开发版), trial(体验版), formal(正式版)
      // 可以通过环境变量 MINIPROGRAM_STATE 来指定，默认根据 NODE_ENV 判断
      let miniprogramState = process.env.MINIPROGRAM_STATE;
      if (!miniprogramState) {
        // 如果没有指定，根据 NODE_ENV 判断
        // 生产环境使用正式版，其他环境使用 trial（体验版）兼容性最好
        miniprogramState = process.env.NODE_ENV === 'production' ? 'formal' : 'trial';
      }

      console.log(`📱 发送订阅消息 - 环境: ${miniprogramState}, 页面: ${page || '默认首页'}`);

      const payload = {
        touser: openid,
        template_id: templateId,
        data: data,
        miniprogram_state: miniprogramState
      };
      
      // 只有指定了 page 才添加到 payload 中
      if (page) {
        payload.page = page;
      }

      const response = await axios.post(url, payload);

      if (response.data.errcode === 0) {
        console.log(`✅ 订阅消息发送成功 - openid: ${openid}`);
        return { success: true, errcode: 0 };
      } else {
        console.error(`❌ 订阅消息发送失败 - openid: ${openid}, errcode: ${response.data.errcode}, errmsg: ${response.data.errmsg}`);
        return { 
          success: false, 
          errcode: response.data.errcode, 
          errmsg: response.data.errmsg 
        };
      }
    } catch (error) {
      console.error(`❌ 订阅消息发送异常 - openid: ${openid}:`, error.message);
      return { 
        success: false, 
        error: error.message 
      };
    }
  }
}

// 导出单例
module.exports = new WeChatService();
