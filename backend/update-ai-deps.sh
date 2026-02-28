#!/bin/bash

# 更新AI依赖脚本
# 将腾讯云Cloudbase改为DeepSeek API（使用OpenAI SDK）

echo "🔄 开始更新AI依赖..."

# 进入backend目录
cd "$(dirname "$0")"

# 安装 openai 包
echo "📦 安装 openai 包..."
npm install openai

# 可选：卸载不再使用的 @cloudbase/node-sdk（如果确认不再使用）
# npm uninstall @cloudbase/node-sdk

echo "✅ AI依赖更新完成！"
echo ""
echo "📝 接下来的步骤："
echo "1. 确认 .env.production 中已配置 DEEPSEEK_API_KEY"
echo "2. 重启后端服务: pm2 restart simplenote-backend"
echo "3. 查看日志: pm2 logs simplenote-backend"
