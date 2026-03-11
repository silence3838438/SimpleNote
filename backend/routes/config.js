/**
 * 配置管理接口
 * 用于管理应用的各种配置项
 */
const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * GET /api/config/public
 * 获取公开配置（不需要登录）
 */
router.get('/public', async (req, res) => {
  try {
    // 从数据库获取所有配置
    const configs = await db.query('SELECT config_key, config_value, config_type FROM app_config');
    
    // 转换为对象格式
    const configData = {};
    configs.forEach(config => {
      const key = config.config_key;
      let value = config.config_value;
      
      // 根据类型转换值
      if (config.config_type === 'boolean') {
        value = value === 'true' || value === '1' || value === 1;
      } else if (config.config_type === 'number') {
        value = parseFloat(value);
      } else if (config.config_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          console.error('JSON解析失败:', key, value);
        }
      }
      
      configData[key] = value;
    });
    
    // 返回公开配置
    res.json({
      success: true,
      data: configData
    });
  } catch (error) {
    console.error('获取配置失败:', error);
    
    // 出错时返回默认配置
    res.json({
      success: true,
      data: {
        show_ai_advisor_wechat: false,  // 默认关闭
        show_ai_advisor_app: false,     // 默认关闭
      }
    });
  }
});

/**
 * GET /api/config/admin/list
 * 获取配置列表（管理后台使用）
 */
router.get('/admin/list', async (req, res) => {
  try {
    const configs = await db.query('SELECT * FROM app_config ORDER BY id ASC');
    
    res.json({
      success: true,
      data: configs
    });
  } catch (error) {
    console.error('获取配置列表失败:', error);
    res.json({
      success: false,
      message: error.message || '获取配置列表失败'
    });
  }
});

/**
 * PUT /api/config/admin/:id
 * 更新配置（管理后台使用）
 */
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { config_value } = req.body;
    
    if (config_value === undefined) {
      return res.json({
        success: false,
        message: '参数不完整'
      });
    }
    
    await db.query(
      'UPDATE app_config SET config_value = ?, updated_at = NOW() WHERE id = ?',
      [config_value, id]
    );
    
    res.json({
      success: true,
      message: '更新成功'
    });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.json({
      success: false,
      message: error.message || '更新配置失败'
    });
  }
});

/**
 * GET /api/config/android-qrcode
 * 获取最新的安卓APK下载二维码（公开接口，供官网使用）
 */
router.get('/android-qrcode', async (req, res) => {
  try {
    const result = await db.query('SELECT qrcode_url, apk_url FROM android_qrcode ORDER BY updated_at DESC LIMIT 1');
    
    if (result.length > 0) {
      res.json({
        success: true,
        data: {
          qrcodeUrl: result[0].qrcode_url,
          apkUrl: result[0].apk_url
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          qrcodeUrl: null,
          apkUrl: null
        }
      });
    }
  } catch (error) {
    console.error('获取安卓二维码失败:', error);
    res.json({
      success: false,
      message: error.message || '获取安卓二维码失败'
    });
  }
});

module.exports = router;

/**
 * GET /api/config/latest-android-apk
 * 获取最新的安卓APK下载地址（公开接口，供官网使用）
 */
router.get('/latest-android-apk', async (req, res) => {
  try {
    // 查询最新的Android版本
    const result = await db.query(`
      SELECT download_url as downloadUrl
      FROM app_versions
      WHERE platform = 'Android'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (result.length > 0 && result[0].downloadUrl) {
      res.json({
        success: true,
        data: {
          downloadUrl: result[0].downloadUrl
        }
      });
    } else {
      res.json({
        success: true,
        data: {
          downloadUrl: null
        }
      });
    }
  } catch (error) {
    console.error('获取最新APK下载地址失败:', error);
    res.json({
      success: false,
      message: error.message || '获取失败'
    });
  }
});

