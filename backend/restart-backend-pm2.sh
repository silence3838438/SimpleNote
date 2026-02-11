#!/bin/bash

# PM2 重启脚本
cd /www/backend

echo "🔄 使用PM2重启服务..."

# 设置Node路径
export PATH=/usr/local/node-v16.20.2-linux-x64/bin:$PATH

# 检查PM2是否已安装
if ! command -v pm2 &> /dev/null; then
    echo "📦 安装PM2..."
    npm install -g pm2
fi

# 检查服务是否已经在运行
if pm2 list | grep -q "simplenote-api"; then
    echo "🔄 重启现有服务..."
    pm2 restart ecosystem.config.js
else
    echo "🚀 首次启动服务..."
    pm2 start ecosystem.config.js
fi

# 保存PM2配置
pm2 save

echo "✅ PM2服务重启完成"
pm2 status
