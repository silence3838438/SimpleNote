const express = require('express');
const router = express.Router();
const axios = require('axios');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { checkIPLimit, checkSMSLimit, getClientIP } = require('../middleware/rate-limit');

// 微信小程序登录
router.post('/wxLogin', async (req, res) => {
  try {
    const { code } = req.body;
    
    if (!code) {
      return res.json({
        success: false,
        message: '缺少code参数'
      });
    }

    // 调用微信接口获取openid和session_key
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    
    const wxRes = await axios.get(wxUrl);
    
    if (wxRes.data.errcode) {
      return res.json({
        success: false,
        message: wxRes.data.errmsg || '微信登录失败'
      });
    }

    const { openid, session_key } = wxRes.data;

    // 查询或创建用户
    const users = await db.query(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );

    let userId;
    if (users.length > 0) {
      userId = users[0].id;
      // 更新session_key和登录时间
      await db.query(
        'UPDATE users SET session_key = ?, last_login = NOW() WHERE id = ?',
        [session_key, userId]
      );
    } else {
      // 创建新用户
      const result = await db.query(
        'INSERT INTO users (openid, session_key, created_at, last_login) VALUES (?, ?, NOW(), NOW())',
        [openid, session_key]
      );
      userId = result.insertId;
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId, openid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      data: {
        token,
        userId,
        openid
      }
    });

  } catch (error) {
    console.error('微信登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 微信登录（APP端和小程序通用）
router.post('/wechat-login', async (req, res) => {
  try {
    const { code, nickName, avatarUrl } = req.body;
    
    if (!code) {
      return res.json({
        success: false,
        message: '缺少code参数'
      });
    }

    // 调用微信接口获取openid和session_key
    const wxUrl = `https://api.weixin.qq.com/sns/jscode2session?appid=${process.env.WX_APPID}&secret=${process.env.WX_SECRET}&js_code=${code}&grant_type=authorization_code`;
    
    const wxRes = await axios.get(wxUrl);
    
    if (wxRes.data.errcode) {
      return res.json({
        success: false,
        message: wxRes.data.errmsg || '微信登录失败'
      });
    }

    const { openid, session_key } = wxRes.data;

    // 查询或创建用户
    const users = await db.query(
      'SELECT * FROM users WHERE openid = ?',
      [openid]
    );

    let userId, userNickName, userAvatarUrl;
    if (users.length > 0) {
      userId = users[0].id;
      // 老用户：只更新session_key和登录时间，不更新昵称和头像（保留用户修改的值）
      await db.query(
        'UPDATE users SET session_key = ?, last_login = NOW() WHERE id = ?',
        [session_key, userId]
      );
      // 从数据库获取用户的昵称和头像
      userNickName = users[0].nickname || nickName || '微信用户';
      userAvatarUrl = users[0].avatar_url || avatarUrl || '';
      
      console.log('=== 老用户登录 ===');
      console.log('数据库中的昵称:', users[0].nickname);
      console.log('数据库中的头像:', users[0].avatar_url);
      console.log('返回的昵称:', userNickName);
      console.log('返回的头像:', userAvatarUrl);
    } else {
      // 新用户：使用微信的昵称和头像创建账号
      const result = await db.query(
        'INSERT INTO users (openid, session_key, nickname, avatar_url, created_at, last_login) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [openid, session_key, nickName || '微信用户', avatarUrl || '']
      );
      userId = result.insertId;
      userNickName = nickName || '微信用户';
      userAvatarUrl = avatarUrl || '';
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId, openid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      data: {
        userId,
        openid,
        nickName: userNickName,
        avatarUrl: userAvatarUrl
      }
    });

  } catch (error) {
    console.error('微信登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 微信APP登录（使用微信开放平台）
router.post('/wechat-app-login', async (req, res) => {
  try {
    console.log('=== 微信APP登录接口被调用 ===');
    console.log('请求体:', req.body);
    
    const { code } = req.body;
    
    if (!code) {
      console.error('❌ 缺少code参数');
      return res.json({
        success: false,
        message: '缺少code参数'
      });
    }

    console.log('✅ 收到code:', code);

    // 检查环境变量配置
    console.log('检查环境变量配置...');
    console.log('WX_OPEN_APPID:', process.env.WX_OPEN_APPID ? '已配置' : '未配置');
    console.log('WX_OPEN_SECRET:', process.env.WX_OPEN_SECRET ? '已配置' : '未配置');
    
    if (!process.env.WX_OPEN_APPID || !process.env.WX_OPEN_SECRET) {
      console.error('❌ 微信开放平台配置缺失');
      return res.json({
        success: false,
        message: '微信登录功能暂未配置，请联系管理员'
      });
    }

    // 调用微信开放平台接口获取access_token
    const wxUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${process.env.WX_OPEN_APPID}&secret=${process.env.WX_OPEN_SECRET}&code=${code}&grant_type=authorization_code`;
    
    console.log('📡 调用微信开放平台API:', wxUrl.replace(process.env.WX_OPEN_SECRET, '***'));
    
    const wxRes = await axios.get(wxUrl);
    
    console.log('📡 微信开放平台返回:', JSON.stringify(wxRes.data));
    
    if (wxRes.data.errcode) {
      console.error('❌ 微信API返回错误:', wxRes.data.errcode, wxRes.data.errmsg);
      return res.json({
        success: false,
        message: `微信登录失败: ${wxRes.data.errmsg} (错误码: ${wxRes.data.errcode})`
      });
    }

    const { access_token, openid, unionid } = wxRes.data;
    console.log('✅ 获取到access_token和openid');
    console.log('openid:', openid);
    console.log('unionid:', unionid || '无');

    // 获取用户信息
    const userInfoUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    console.log('📡 获取用户信息...');
    
    const userInfoRes = await axios.get(userInfoUrl);
    
    console.log('📡 用户信息返回:', JSON.stringify(userInfoRes.data));
    
    if (userInfoRes.data.errcode) {
      console.error('❌ 获取用户信息失败:', userInfoRes.data.errcode, userInfoRes.data.errmsg);
      return res.json({
        success: false,
        message: `获取用户信息失败: ${userInfoRes.data.errmsg}`
      });
    }

    const { nickname, headimgurl } = userInfoRes.data;
    console.log('✅ 用户信息:', { nickname, headimgurl });

    // 查询或创建用户
    let users;
    if (unionid) {
      console.log('🔍 使用unionid查询用户...');
      // 优先使用unionid查询（可以关联小程序和APP的同一用户）
      users = await db.query(
        'SELECT * FROM users WHERE unionid = ?',
        [unionid]
      );
    } else {
      console.log('🔍 使用app_openid查询用户...');
      // 如果没有unionid，使用app_openid查询
      users = await db.query(
        'SELECT * FROM users WHERE app_openid = ?',
        [openid]
      );
    }

    console.log('🔍 查询结果:', users.length > 0 ? '找到用户' : '新用户');

    let userId;
    if (users.length > 0) {
      userId = users[0].id;
      // 更新用户信息和登录时间
      await db.query(
        'UPDATE users SET app_openid = ?, unionid = ?, nickname = ?, avatar_url = ?, last_login = NOW() WHERE id = ?',
        [openid, unionid || users[0].unionid, nickname, headimgurl, userId]
      );
    } else {
      // 创建新用户
      const result = await db.query(
        'INSERT INTO users (app_openid, unionid, nickname, avatar_url, created_at, last_login) VALUES (?, ?, ?, ?, NOW(), NOW())',
        [openid, unionid || null, nickname, headimgurl]
      );
      userId = result.insertId;
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId, openid, unionid },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      data: {
        userId,
        openid,
        unionid,
        nickName: nickname,
        avatarUrl: headimgurl
      }
    });

  } catch (error) {
    console.error('微信APP登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// Apple登录
router.post('/apple-login', async (req, res) => {
  try {
    const { identityToken, user } = req.body;
    
    if (!identityToken) {
      return res.json({
        success: false,
        message: '缺少identityToken参数'
      });
    }

    // TODO: 验证Apple identityToken
    // 这里需要使用Apple的公钥验证JWT token
    // 参考: https://developer.apple.com/documentation/sign_in_with_apple/sign_in_with_apple_rest_api/verifying_a_user
    
    // 临时实现：直接创建用户
    const appleId = user || `apple_${Date.now()}`;
    
    // 查询或创建用户
    const users = await db.query(
      'SELECT * FROM users WHERE apple_id = ?',
      [appleId]
    );

    let userId;
    if (users.length > 0) {
      userId = users[0].id;
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [userId]
      );
    } else {
      const result = await db.query(
        'INSERT INTO users (apple_id, created_at, last_login) VALUES (?, NOW(), NOW())',
        [appleId]
      );
      userId = result.insertId;
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId, appleId },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      data: {
        userId,
        appleId
      }
    });

  } catch (error) {
    console.error('Apple登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 手机号登录
router.post('/phone-login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    if (!phone || !code) {
      return res.json({
        success: false,
        message: '缺少手机号或验证码'
      });
    }

    // TODO: 验证短信验证码
    // 这里需要对接短信服务商的API验证验证码
    
    // 临时实现：简单验证（生产环境需要真实验证）
    if (code !== '123456') {
      return res.json({
        success: false,
        message: '验证码错误'
      });
    }

    // 查询或创建用户
    const users = await db.query(
      'SELECT * FROM users WHERE phone = ?',
      [phone]
    );

    let userId;
    if (users.length > 0) {
      userId = users[0].id;
      await db.query(
        'UPDATE users SET last_login = NOW() WHERE id = ?',
        [userId]
      );
    } else {
      const result = await db.query(
        'INSERT INTO users (phone, created_at, last_login) VALUES (?, NOW(), NOW())',
        [phone]
      );
      userId = result.insertId;
    }

    // 生成JWT token
    const token = jwt.sign(
      { userId, phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      data: {
        userId,
        phone
      }
    });

  } catch (error) {
    console.error('手机号登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// APP端登录（可以使用手机号或其他方式）
router.post('/appLogin', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    // 这里实现你的APP登录逻辑
    // 可以是手机号+验证码，或者第三方登录
    
    res.json({
      success: true,
      message: 'APP登录接口待实现'
    });

  } catch (error) {
    console.error('APP登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 退出登录
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.json({
        success: false,
        message: '未提供token'
      });
    }

    // 验证token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      const userId = decoded.userId;
      
      // 可以在这里记录退出日志或更新用户状态
      // 例如：更新最后活动时间
      await db.query(
        'UPDATE users SET last_logout = NOW() WHERE id = ?',
        [userId]
      );
      
      res.json({
        success: true,
        message: '退出成功'
      });
    } catch (error) {
      // token无效或过期
      res.json({
        success: true,
        message: '退出成功'
      });
    }

  } catch (error) {
    console.error('退出登录失败:', error);
    res.json({
      success: false,
      message: error.message || '退出失败'
    });
  }
});

// 账号密码登录
router.post('/account-login', async (req, res) => {
  try {
    const { account, password } = req.body;
    
    if (!account || !password) {
      return res.json({
        success: false,
        message: '请输入账号和密码'
      });
    }

    // 查询用户（支持手机号或账号登录）
    const users = await db.query(
      'SELECT * FROM users WHERE (phone = ? OR account = ?) AND password IS NOT NULL',
      [account, account]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: '账号不存在或未设置密码'
      });
    }

    const user = users[0];

    // 验证密码（使用bcrypt）
    const bcrypt = require('bcryptjs');
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.json({
        success: false,
        message: '密码错误'
      });
    }

    // 更新登录时间
    await db.query(
      'UPDATE users SET last_login = NOW() WHERE id = ?',
      [user.id]
    );

    // 生成JWT token
    const token = jwt.sign(
      { userId: user.id, phone: user.phone, account: user.account },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      data: {
        userId: user.id,
        nickName: user.nickname || user.phone || user.account,
        avatarUrl: user.avatar_url || 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png'
      }
    });

  } catch (error) {
    console.error('账号密码登录失败:', error);
    res.json({
      success: false,
      message: error.message || '登录失败'
    });
  }
});

// 发送验证码（添加安全检查）
router.post('/send-code', checkSMSLimit, async (req, res) => {
  try {
    const { phone, type } = req.body; // type: register, reset, bind
    
    if (!phone) {
      return res.json({
        success: false,
        message: '请输入手机号'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 如果是注册，检查手机号是否已存在
    if (type === 'register') {
      const existingUsers = await db.query(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      
      if (existingUsers.length > 0) {
        return res.json({
          success: false,
          message: '该手机号已注册'
        });
      }
    }

    // 如果是重置密码，检查手机号是否存在
    if (type === 'reset') {
      const existingUsers = await db.query(
        'SELECT id FROM users WHERE phone = ?',
        [phone]
      );
      
      if (existingUsers.length === 0) {
        return res.json({
          success: false,
          message: '该手机号未注册'
        });
      }
    }

    // 如果是绑定手机号，不做额外检查（允许绑定已存在或不存在的手机号）
    // 绑定逻辑会在 /bind-phone 接口中处理

    // 检查发送频率限制
    // 1. 检查60秒内是否已发送
    const recentCodes = await db.query(
      'SELECT * FROM verification_codes WHERE phone = ? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)',
      [phone]
    );
    
    if (recentCodes.length > 0) {
      return res.json({
        success: false,
        message: '验证码发送过于频繁，请稍后再试'
      });
    }

    // 2. 检查今天发送次数（最多5次）
    const todayCodes = await db.query(
      'SELECT COUNT(*) as count FROM verification_codes WHERE phone = ? AND DATE(created_at) = CURDATE()',
      [phone]
    );
    
    if (todayCodes[0].count >= 5) {
      return res.json({
        success: false,
        message: '今日验证码发送次数已达上限'
      });
    }

    // 生成验证码
    const isDev = process.env.NODE_ENV === 'development';
    const code = isDev ? '888888' : Math.floor(100000 + Math.random() * 900000).toString();
    
    // 保存验证码到数据库（5分钟有效期）
    const expireTime = new Date(Date.now() + 5 * 60 * 1000);
    
    // 先删除该手机号的旧验证码
    await db.query(
      'DELETE FROM verification_codes WHERE phone = ?',
      [phone]
    );
    
    // 插入新验证码
    await db.query(
      'INSERT INTO verification_codes (phone, code, type, expire_time, created_at) VALUES (?, ?, ?, ?, NOW())',
      [phone, code, type, expireTime]
    );

    // 发送短信
    if (isDev) {
      // 开发环境：直接返回固定验证码
      console.log(`[开发环境] 发送验证码到 ${phone}: ${code}`);
      res.json({
        success: true,
        message: '验证码已发送',
        code: code // 开发环境返回验证码
      });
    } else {
      // 生产环境：尝试发送短信，如果失败则返回验证码
      const hasAliyunConfig = process.env.ALIYUN_ACCESS_KEY_ID && 
                              process.env.ALIYUN_ACCESS_KEY_ID !== 'YOUR_ACCESS_KEY_ID';
      
      if (hasAliyunConfig) {
        // 已配置阿里云，尝试发送短信
        try {
          await sendSmsCode(phone, code, type);
          console.log(`[生产环境] 短信发送成功到 ${phone}`);
          res.json({
            success: true,
            message: '验证码已发送'
          });
        } catch (smsError) {
          console.error('短信发送失败:', smsError);
          // 短信发送失败，删除验证码记录
          await db.query(
            'DELETE FROM verification_codes WHERE phone = ? AND code = ?',
            [phone, code]
          );
          res.json({
            success: false,
            message: '验证码发送失败，请稍后重试'
          });
        }
      } else {
        // 未配置阿里云，临时方案：返回验证码到前端
        console.log(`[临时方案] 生成验证码 ${phone}: ${code}`);
        res.json({
          success: true,
          message: '验证码已生成（临时方案，请记住验证码）',
          code: code, // 临时返回验证码
          tip: '当前为测试模式，验证码直接显示。正式上线后将通过短信发送。'
        });
      }
    }

  } catch (error) {
    console.error('发送验证码失败:', error);
    res.json({
      success: false,
      message: error.message || '发送失败'
    });
  }
});

// 阿里云短信发送函数
async function sendSmsCode(phone, code, type) {
  const Core = require('@alicloud/pop-core');
  
  const client = new Core({
    accessKeyId: process.env.ALIYUN_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIYUN_ACCESS_KEY_SECRET,
    endpoint: 'https://dysmsapi.aliyuncs.com',
    apiVersion: '2017-05-25'
  });

  // 根据类型选择短信模板
  const templateCode = type === 'register' 
    ? process.env.ALIYUN_SMS_TEMPLATE_REGISTER 
    : process.env.ALIYUN_SMS_TEMPLATE_RESET;

  const params = {
    "RegionId": "cn-hangzhou",
    "PhoneNumbers": phone,
    "SignName": process.env.ALIYUN_SMS_SIGN_NAME,
    "TemplateCode": templateCode,
    "TemplateParam": JSON.stringify({ code })
  };

  const requestOption = {
    method: 'POST'
  };

  const result = await client.request('SendSms', params, requestOption);
  
  if (result.Code !== 'OK') {
    throw new Error(result.Message || '短信发送失败');
  }
  
  return result;
}

// 注册（添加安全检查）
router.post('/register', checkIPLimit, async (req, res) => {
  try {
    const { phone, code, password } = req.body;
    
    if (!phone || !code || !password) {
      return res.json({
        success: false,
        message: '请填写完整信息'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 验证密码长度
    if (password.length < 6 || password.length > 20) {
      return res.json({
        success: false,
        message: '密码长度为6-20位'
      });
    }

    // 验证验证码
    const codes = await db.query(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND type = ? AND expire_time > NOW()',
      [phone, code, 'register']
    );

    if (codes.length === 0) {
      return res.json({
        success: false,
        message: '验证码错误或已过期'
      });
    }

    // 检查手机号是否已注册
    const existingUsers = await db.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (existingUsers.length > 0) {
      return res.json({
        success: false,
        message: '该手机号已注册'
      });
    }

    // 加密密码
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);

    // 获取客户端IP
    const clientIP = req.clientIP || getClientIP(req);
    const userAgent = req.headers['user-agent'] || '';

    // 创建用户（记录IP）
    const result = await db.query(
      'INSERT INTO users (phone, password, nickname, avatar_url, last_login_ip, created_at, last_login) VALUES (?, ?, ?, ?, ?, NOW(), NOW())',
      [
        phone,
        hashedPassword,
        phone, // 默认昵称为手机号
        'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png',
        clientIP
      ]
    );

    const userId = result.insertId;

    // 记录注册日志
    await db.query(
      'INSERT INTO registration_logs (phone, ip_address, user_agent, status, created_at) VALUES (?, ?, ?, ?, NOW())',
      [phone, clientIP, userAgent, 'success']
    );

    // 删除已使用的验证码
    await db.query(
      'DELETE FROM verification_codes WHERE phone = ?',
      [phone]
    );

    // 生成JWT token
    const token = jwt.sign(
      { userId, phone },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      data: {
        userId,
        nickName: phone,
        avatarUrl: 'https://hdkc-oss-core.oss-cn-hangzhou.aliyuncs.com/avatar/20251212/dataIcon17.png'
      }
    });

  } catch (error) {
    console.error('注册失败:', error);
    res.json({
      success: false,
      message: error.message || '注册失败'
    });
  }
});

// 重置密码
router.post('/reset-password', async (req, res) => {
  try {
    const { phone, code, newPassword } = req.body;
    
    if (!phone || !code || !newPassword) {
      return res.json({
        success: false,
        message: '请填写完整信息'
      });
    }

    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.json({
        success: false,
        message: '手机号格式不正确'
      });
    }

    // 验证密码长度
    if (newPassword.length < 6 || newPassword.length > 20) {
      return res.json({
        success: false,
        message: '密码长度为6-20位'
      });
    }

    // 验证验证码
    const codes = await db.query(
      'SELECT * FROM verification_codes WHERE phone = ? AND code = ? AND type = ? AND expire_time > NOW()',
      [phone, code, 'reset']
    );

    if (codes.length === 0) {
      return res.json({
        success: false,
        message: '验证码错误或已过期'
      });
    }

    // 检查用户是否存在
    const users = await db.query(
      'SELECT id FROM users WHERE phone = ?',
      [phone]
    );

    if (users.length === 0) {
      return res.json({
        success: false,
        message: '该手机号未注册'
      });
    }

    // 加密新密码
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await db.query(
      'UPDATE users SET password = ? WHERE phone = ?',
      [hashedPassword, phone]
    );

    // 删除已使用的验证码
    await db.query(
      'DELETE FROM verification_codes WHERE phone = ?',
      [phone]
    );

    res.json({
      success: true,
      message: '密码重置成功'
    });

  } catch (error) {
    console.error('重置密码失败:', error);
    res.json({
      success: false,
      message: error.message || '重置失败'
    });
  }
});

// 意见反馈
router.post('/feedback/submit', async (req, res) => {
  try {
    const { content, images } = req.body;
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!content || !content.trim()) {
      return res.json({
        success: false,
        message: '反馈内容不能为空'
      });
    }

    let userId = null;
    let userInfo = null;

    // 尝试获取用户信息（如果已登录）
    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        userId = decoded.userId;
        
        // 获取用户信息
        const users = await db.query('SELECT nickname, phone FROM users WHERE id = ?', [userId]);
        if (users.length > 0) {
          userInfo = users[0];
        }
      } catch (error) {
        // token无效，作为匿名反馈处理
        console.log('token无效，作为匿名反馈');
      }
    }

    // 保存反馈到数据库
    await db.query(
      'INSERT INTO feedback (user_id, content, images, user_info, created_at) VALUES (?, ?, ?, ?, NOW())',
      [userId, content.trim(), images ? JSON.stringify(images) : null, userInfo ? JSON.stringify(userInfo) : null]
    );

    res.json({
      success: true,
      message: '感谢您的反馈'
    });

  } catch (error) {
    console.error('提交反馈失败:', error);
    res.json({
      success: false,
      message: error.message || '提交失败'
    });
  }
});

// 注销账号
router.post('/delete-account', async (req, res) => {
  const connection = await db.pool.getConnection();
  
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      connection.release();
      return res.json({
        success: false,
        message: '未登录'
      });
    }

    // 验证token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    // 检查用户是否存在
    const [users] = await connection.execute('SELECT id FROM users WHERE id = ?', [userId]);
    
    if (users.length === 0) {
      connection.release();
      return res.json({
        success: false,
        message: '用户不存在或已被注销'
      });
    }

    // 开始事务
    await connection.beginTransaction();

    try {
      // 1. 删除用户的所有账单
      await connection.execute('DELETE FROM bills WHERE user_id = ?', [userId]);

      // 2. 删除用户的积分记录
      await connection.execute('DELETE FROM points_history WHERE user_id = ?', [userId]);

      // 3. 删除用户的提醒设置
      await connection.execute('DELETE FROM reminders WHERE user_id = ?', [userId]);
      
      // 4. 删除用户的预算设置
      await connection.execute('DELETE FROM budgets WHERE user_id = ?', [userId]);

      // 5. 删除用户记录
      await connection.execute('DELETE FROM users WHERE id = ?', [userId]);

      // 提交事务
      await connection.commit();
      connection.release();

      res.json({
        success: true,
        message: '账号已注销'
      });

    } catch (error) {
      // 回滚事务
      await connection.rollback();
      connection.release();
      throw error;
    }

  } catch (error) {
    if (connection) {
      connection.release();
    }
    console.error('注销账号失败:', error);
    res.json({
      success: false,
      message: error.message || '注销失败'
    });
  }
});


module.exports = router;
