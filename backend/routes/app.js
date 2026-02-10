const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * 检查APP版本更新
 * POST /api/app/check-update
 * 
 * 请求参数：
 * - version: 当前版本号 (如 "1.0.0")
 * - platform: 平台 ("Android" 或 "iOS")
 * 
 * 返回：
 * - success: 是否成功
 * - data: 更新信息
 *   - hasUpdate: 是否有更新
 *   - version: 新版本号
 *   - updateContent: 更新内容数组
 *   - packageSize: 安装包大小
 *   - updateTime: 更新时间
 *   - downloadUrl: 下载地址
 *   - isForce: 是否强制更新
 */
router.post('/check-update', async (req, res) => {
  try {
    const { version, platform } = req.body;
    
    if (!version || !platform) {
      return res.json({
        success: false,
        message: '缺少必要参数'
      });
    }
    
    // 从数据库获取最新版本
    const versionResult = await db.query(
      `SELECT 
        version,
        update_content,
        package_size,
        download_url,
        is_force,
        DATE_FORMAT(update_time, '%Y-%m-%d') as update_time
      FROM app_versions
      WHERE platform = ?
      ORDER BY created_at DESC
      LIMIT 1`,
      [platform]
    );
    
    if (versionResult.length === 0) {
      return res.json({
        success: true,
        data: {
          hasUpdate: false
        }
      });
    }
    
    const latestVersion = versionResult[0];
    
    // 解析更新内容
    let updateContent = [];
    try {
      updateContent = typeof latestVersion.update_content === 'string' 
        ? JSON.parse(latestVersion.update_content) 
        : latestVersion.update_content;
    } catch (e) {
      console.error('解析更新内容失败:', e);
    }
    
    // 比较版本号
    const hasUpdate = compareVersion(latestVersion.version, version) > 0;
    
    res.json({
      success: true,
      data: {
        hasUpdate,
        version: latestVersion.version,
        updateContent,
        packageSize: latestVersion.package_size,
        updateTime: latestVersion.update_time,
        downloadUrl: latestVersion.download_url,
        isForce: Boolean(latestVersion.is_force)
      }
    });
    
  } catch (error) {
    console.error('检查更新失败:', error);
    res.json({
      success: false,
      message: '检查更新失败'
    });
  }
});

/**
 * 比较版本号
 * @param {string} v1 - 版本1
 * @param {string} v2 - 版本2
 * @returns {number} - 1: v1 > v2, 0: v1 = v2, -1: v1 < v2
 */
function compareVersion(v1, v2) {
  const arr1 = v1.split('.');
  const arr2 = v2.split('.');
  const len = Math.max(arr1.length, arr2.length);
  
  for (let i = 0; i < len; i++) {
    const num1 = parseInt(arr1[i] || 0);
    const num2 = parseInt(arr2[i] || 0);
    
    if (num1 > num2) {
      return 1;
    } else if (num1 < num2) {
      return -1;
    }
  }
  
  return 0;
}

module.exports = router;
