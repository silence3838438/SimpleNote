# DeepSeek API 迁移指南

## 概述

将AI增强功能从腾讯云Cloudbase迁移到DeepSeek API，使用OpenAI SDK进行集成。

## 变更内容

### 1. 代码变更
- **文件**: `backend/routes/ai-enhance.js`
- **变更**: 
  - 移除腾讯云Cloudbase SDK依赖
  - 使用OpenAI SDK调用DeepSeek API
  - 保持相同的prompt和返回格式
  - 保持降级策略（AI不可用时返回原始数据）

### 2. 依赖变更
- **新增**: `openai` (OpenAI官方SDK)
- **可选移除**: `@cloudbase/node-sdk` (如果确认不再使用)

### 3. 环境变量
- **使用**: `DEEPSEEK_API_KEY` (已在 `.env.production` 中配置)
- **值**: `sk-8b90a414626f4aa593c2852d4286b649`

## 部署步骤

### 步骤1: 更新代码
```bash
# 在本地提交代码
git add backend/routes/ai-enhance.js
git commit -m "迁移AI增强功能到DeepSeek API"
git push origin main
```

### 步骤2: 登录服务器
```bash
ssh root@api.qiannaqule.top
# 密码: 520silenceW
```

### 步骤3: 更新代码和依赖
```bash
cd /root/SimpleNote

# 拉取最新代码
git pull origin main

# 进入backend目录
cd backend

# 安装 openai 包
npm install openai

# 确认环境变量已配置
grep DEEPSEEK_API_KEY .env.production
```

### 步骤4: 重启服务
```bash
# 重启后端服务
pm2 restart simplenote-backend

# 查看日志（确认DeepSeek初始化成功）
pm2 logs simplenote-backend --lines 50
```

应该看到类似的日志：
```
🔑 DeepSeek API Key: 已配置
✅ DeepSeek API 初始化成功
```

### 步骤5: 测试接口
```bash
# 在本地运行测试脚本
node test-deepseek-api.js
```

## 验证清单

- [ ] 代码已提交到GitHub
- [ ] 服务器已拉取最新代码
- [ ] `openai` 包已安装
- [ ] 环境变量 `DEEPSEEK_API_KEY` 已配置
- [ ] 后端服务已重启
- [ ] 日志显示 "DeepSeek API 初始化成功"
- [ ] OCR增强接口测试通过
- [ ] 语音增强接口测试通过

## DeepSeek API 优势

1. **成本优势**
   - 500万tokens免费额度
   - ¥1-2/百万tokens（超出免费额度后）
   - 比腾讯云Cloudbase便宜很多

2. **性能优势**
   - DeepSeek-V3性能接近GPT-4
   - 响应速度快
   - 支持128K上下文

3. **兼容性**
   - 完全兼容OpenAI API格式
   - 可以直接使用OpenAI SDK
   - 迁移成本低

## API使用说明

### 模型
- **模型名称**: `deepseek-chat`
- **版本**: DeepSeek-V3.2
- **上下文长度**: 128K tokens

### 参数配置
```javascript
{
  model: 'deepseek-chat',
  temperature: 0.3,  // 较低的温度，保证输出稳定
  max_tokens: 1000   // 最大输出长度
}
```

### 费用估算
- 每次OCR增强: ~500 tokens (输入) + ~100 tokens (输出) = 600 tokens
- 每次语音增强: ~300 tokens (输入) + ~100 tokens (输出) = 400 tokens
- 平均每次调用: ~500 tokens
- 免费额度可支持: 500万 / 500 = 1万次调用
- 超出后费用: ¥1/百万tokens = ¥0.0005/次

## 故障排查

### 问题1: DeepSeek API Key 未配置
**症状**: 日志显示 "DeepSeek API Key: 未配置"
**解决**: 
```bash
# 检查环境变量
cat backend/.env.production | grep DEEPSEEK_API_KEY

# 如果没有，添加
echo "DEEPSEEK_API_KEY=sk-8b90a414626f4aa593c2852d4286b649" >> backend/.env.production
```

### 问题2: openai 包未安装
**症状**: 日志显示 "Cannot find module 'openai'"
**解决**:
```bash
cd backend
npm install openai
pm2 restart simplenote-backend
```

### 问题3: API调用失败
**症状**: 日志显示 "DeepSeek 调用失败"
**解决**:
1. 检查API Key是否有效
2. 检查网络连接
3. 查看详细错误日志: `pm2 logs simplenote-backend`
4. 检查DeepSeek API状态: https://api-docs.deepseek.com/

### 问题4: AI功能降级
**症状**: 返回 `aiEnabled: false`
**原因**: DeepSeek API不可用时自动降级
**影响**: 返回后端/前端原始提取的数据，不影响基本功能

## 回滚方案

如果DeepSeek API出现问题，可以临时回滚到原来的代码：

```bash
# 在服务器上
cd /root/SimpleNote
git log --oneline -5  # 查看最近的提交
git revert <commit-hash>  # 回滚到迁移前的版本
cd backend
pm2 restart simplenote-backend
```

## 联系方式

如有问题，请查看：
- DeepSeek官方文档: https://api-docs.deepseek.com/
- OpenAI SDK文档: https://github.com/openai/openai-node
