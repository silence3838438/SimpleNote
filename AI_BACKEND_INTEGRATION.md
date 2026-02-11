# AI 增强功能 - 后端集成方案

## 问题原因

前端直接使用 `@cloudbase/js-sdk` 在 APP 环境中报错：`invalid appSecret`

原因：APP 环境需要配置"安全应用来源"，配置复杂且不稳定。

## 解决方案

**改用后端调用方式**：前端通过后端 API 调用 Cloudbase AI

## 架构

```
APP 前端
  ↓ HTTP请求
后端 API (/api/ai-enhance/ocr)
  ↓ 调用
Cloudbase Node SDK
  ↓ 调用
腾讯云 AI Agent
```

## 已完成的配置

### 1. 后端配置

✅ 安装依赖：
```bash
cd backend
npm install @cloudbase/node-sdk
```

✅ 环境变量配置（`backend/.env.local`）：
```env
CLOUDBASE_ENV=cloud1-8gxevfq393690dfe
CLOUDBASE_APIKEY=eyJhbGci...（完整的 accessKey）
```

✅ 创建 AI 增强路由（`backend/routes/ai-enhance.js`）：
- POST `/api/ai-enhance/ocr` - OCR 识别增强接口

✅ 注册路由（`backend/server.js`）：
```javascript
const aiEnhanceRoutes = require('./routes/ai-enhance');
app.use('/api/ai-enhance', optionalAuthMiddleware, aiEnhanceRoutes);
```

### 2. 前端配置

✅ 修改 `utils/cloudbaseAI.js`：
- `enhanceOCR()` 方法改为调用后端 API
- 移除了前端 Cloudbase SDK 的直接调用

✅ 禁用前端 Cloudbase 初始化（`utils/cloudbase.js`）：
```javascript
const ENABLE_CLOUDBASE = false  // 改为 false
```

## 测试步骤

### 方法一：本地测试

#### 1. 启动后端服务器

```bash
cd backend
node server.js
```

应该看到：
```
✅ Cloudbase Node SDK 初始化成功
📦 环境 ID: cloud1-8gxevfq393690dfe
🚀 服务器启动成功！
```

#### 2. 重新运行 APP

在 HBuilderX 中重新编译运行 APP

#### 3. 测试 OCR 识别

1. 进入拍照识别页面
2. 选择 `test-data/ocr-samples` 中的小票图片
3. 查看控制台日志

**预期日志**：
```
⏱️ [AI增强] 开始 OCR 语义增强（通过后端API）
📋 后端已提取: {...}
✅ AI增强完成: {...}
```

**后端日志**：
```
📤 [AI增强] 开始调用 Cloudbase AI...
📥 [AI增强] AI 响应完成，长度: xxx
✅ [AI增强] 增强完成
```

### 方法二：服务器自动化测试

#### 1. 部署并测试

```bash
cd backend
./deploy-and-test.sh
```

脚本会自动：
1. 上传 AI 路由文件
2. 上传测试脚本和测试图片
3. 重启后端服务
4. 创建测试用户
5. 运行完整测试（OCR识别、OCR AI增强、语音识别、语音AI增强）

**测试输出示例**：
```
🚀 开始测试识别和AI增强功能（服务器端）

============================================================
测试 1: 注册并获取Token
============================================================
✅ 注册并获取Token - 通过

============================================================
测试 2: OCR 识别
============================================================
图片读取成功，大小: 103.07 KB
OCR 识别耗时: 651ms
✅ OCR识别 - 通过

============================================================
测试 3: OCR AI 增强
============================================================
AI 增强耗时: 2181ms
AI 增强生效，字段已优化
✅ OCR AI增强 - 通过

============================================================
测试 4: 语音识别 (模拟)
============================================================
✅ 语音识别(模拟) - 通过

============================================================
测试 5: 语音 AI 增强
============================================================
AI 增强耗时: 1686ms
AI 增强生效，字段已优化
✅ 语音 AI增强 - 通过

============================================================
测试报告
============================================================
总测试数: 5
通过: 5
失败: 0
总耗时: 8.69秒

通过率: 100.0%

🎉 所有测试通过！
```

#### 2. 手动运行测试（可选）

如果需要单独运行测试：

```bash
# SSH 到服务器
ssh root@8.218.209.109

# 进入后端目录
cd /www/backend

# 创建测试用户（首次运行）
node create-test-user.js

# 运行测试
node test-server.js
```

## API 接口文档

### POST /api/ai-enhance/ocr

OCR 识别增强接口

**请求**：
```json
{
  "ocrText": "OCR识别的原始文本",
  "baseInfo": {
    "type": "expense",
    "amount": 55,
    "merchant": "星巴克国贸店",
    "date": "2024-01-31",
    "categoryName": "餐饮"
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "type": "expense",
    "amount": 55,
    "merchant": "星巴克国贸店",
    "date": "2024-01-31",
    "categoryName": "餐饮",
    "categoryId": 1,
    "remark": "美式咖啡、拿铁咖啡"
  },
  "aiEnabled": true
}
```

### POST /api/ai-enhance/voice

语音识别增强接口

**请求**：
```json
{
  "voiceText": "今天在星巴克花了35块钱买了美式咖啡",
  "baseInfo": {
    "type": "expense",
    "amount": 35,
    "merchant": "星巴克",
    "date": "2024-01-31",
    "categoryName": "餐饮",
    "categoryId": 1,
    "remark": "今天在星巴克花了35块钱买了美式咖啡"
  }
}
```

**响应**：
```json
{
  "success": true,
  "data": {
    "type": "expense",
    "amount": 35,
    "merchant": "星巴克",
    "date": "2024-01-31",
    "categoryName": "餐饮",
    "categoryId": 1,
    "remark": "美式咖啡"
  },
  "aiEnabled": true
}
```

## 优势

1. ✅ **稳定性**：后端环境更稳定，不受 APP 环境限制
2. ✅ **安全性**：API Key 保存在后端，不暴露给前端
3. ✅ **可维护性**：集中管理 AI 调用逻辑
4. ✅ **降级处理**：AI 失败时自动返回后端正则提取结果

## 注意事项

⚠️ **环境变量**：
- `CLOUDBASE_APIKEY` 是敏感信息，不要提交到 GitHub
- 已添加到 `.gitignore`

⚠️ **后端服务**：
- 确保后端服务器正常运行
- APP 需要能访问后端 API（本地测试或部署到服务器）

## 下一步

测试完成后，可以：
1. 部署后端到服务器
2. 更新 APP 的 `apiBaseUrl` 指向服务器地址
3. 发布新版本
