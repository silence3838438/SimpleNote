#!/bin/bash

echo "=========================================="
echo "启动本地测试环境"
echo "=========================================="

# 使用本地测试配置
cp .env.local .env

echo "✅ 已切换到本地测试环境配置"
echo "📍 数据库: simplenote_test (服务器)"
echo "📍 端口: 3000"
echo ""

# 启动服务
node server.js
