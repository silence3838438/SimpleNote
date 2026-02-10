#!/bin/bash

# AI 接口部署脚本
# 部署 AI 增强功能到生产环境

SERVER="root@8.218.209.109"
PASSWORD="520silenceW"
REMOTE_DIR="/www/backend"

echo "========================================="
echo "🤖 开始部署 AI 增强功能"
echo "========================================="

# 1. 上传 AI 路由文件
echo "📤 上传 AI 路由文件..."
sshpass -p "$PASSWORD" scp routes/ai-enhance.js "$SERVER:$REMOTE_DIR/routes/"
if [ $? -ne 0 ]; then
    echo "❌ AI 路由文件上传失败"
    exit 1
fi
echo "✅ AI 路由文件上传成功"

# 2. 上传更新后的 server.js
echo "📤 上传 server.js..."
sshpass -p "$PASSWORD" scp server.js "$SERVER:$REMOTE_DIR/"
if [ $? -ne 0 ]; then
    echo "❌ server.js 上传失败"
    exit 1
fi
echo "✅ server.js 上传成功"

# 3. 上传 package.json
echo "📤 上传 package.json..."
sshpass -p "$PASSWORD" scp package.json "$SERVER:$REMOTE_DIR/"
if [ $? -ne 0 ]; then
    echo "❌ package.json 上传失败"
    exit 1
fi
echo "✅ package.json 上传成功"

# 4. 配置环境变量
echo ""
echo "⚙️  配置环境变量..."
sshpass -p "$PASSWORD" ssh "$SERVER" << 'EOF'
cd /www/backend

# 检查 .env 文件是否存在
if [ ! -f .env ]; then
    echo "❌ .env 文件不存在"
    exit 1
fi

# 检查是否已有 Cloudbase 配置
if grep -q "CLOUDBASE_ENV" .env; then
    echo "✅ Cloudbase 配置已存在"
else
    echo "📝 添加 Cloudbase 配置..."
    cat >> .env << 'ENVEOF'

# 腾讯云 Cloudbase 配置
CLOUDBASE_ENV=cloud1-8gxevfq393690dfe
CLOUDBASE_APIKEY=eyJhbGciOiJSUzI1NiIsImtpZCI6IjlkMWRjMzFlLWI0ZDAtNDQ4Yi1hNzZmLWIwY2M2M2Q4MTQ5OCJ9.eyJpc3MiOiJodHRwczovL2Nsb3VkMS04Z3hldmZxMzkzNjkwZGZlLmFwLXNoYW5naGFpLnRjYi1hcGkudGVuY2VudGNsb3VkYXBpLmNvbSIsInN1YiI6ImFub24iLCJhdWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsImV4cCI6NDA3MzUyODQ5OCwiaWF0IjoxNzY5ODQ1Mjk4LCJub25jZSI6IlBIVEpiS0VaUkktUmo5LXlxTjdGT2ciLCJhdF9oYXNoIjoiUEhUSmJLRVpSSS1SajkteXFON0ZPZyIsIm5hbWUiOiJBbm9ueW1vdXMiLCJzY29wZSI6ImFub255bW91cyIsInByb2plY3RfaWQiOiJjbG91ZDEtOGd4ZXZmcTM5MzY5MGRmZSIsInVzZXJfdHlwZSI6IiIsImNsaWVudF90eXBlIjoiY2xpZW50X3VzZXIiLCJpc19zeXN0ZW1fYWRtaW4iOmZhbHNlfQ.o7cQi9-7kvHf_QdACOPxLAo36GOgGkzrkL93QLjXbBo71daeJOyIkjQJFle4_YpfrY2vwHcZ-EPG8COprAR3Vf6cfN9djeZZFzjLkK6t7EZTjBaafHwf244JEJWE7lWmmFEslY2V9INWlQ0Ib5_lhnyX-btdgmEJAbTB0zn2jHbk4sPxi9fvnhvaLdkTFIcEW5K_dn-_uU6mlcY1U2owdsLB6XJ7sNgLJVOYf1BtzjJJCB1p17ZwBaIp9YLV5MWibPS0WX6c-PDcgb4DBIeh4aIKjBVSnZPXTjrwZUSH1s63swdL79d1gsp3ipwUTg5nXupSll5bdxDfVYhW2f4yKA
ENVEOF
    echo "✅ Cloudbase 配置已添加"
fi
EOF

if [ $? -ne 0 ]; then
    echo "❌ 环境变量配置失败"
    exit 1
fi

# 5. 安装依赖
echo ""
echo "📦 安装 Cloudbase SDK..."
sshpass -p "$PASSWORD" ssh "$SERVER" << 'EOF'
cd /www/backend
npm install @cloudbase/node-sdk
EOF

if [ $? -ne 0 ]; then
    echo "❌ 依赖安装失败"
    exit 1
fi
echo "✅ 依赖安装成功"

# 6. 重启后端服务
echo ""
echo "🔄 重启后端服务..."
sshpass -p "$PASSWORD" ssh "$SERVER" "/www/backend/restart-backend.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ AI 增强功能部署完成!"
    echo "========================================="
    echo ""
    echo "📝 测试接口:"
    echo "   POST https://api.qiannaqule.top/api/ai-enhance/ocr"
    echo ""
    echo "📋 查看日志:"
    echo "   ssh root@8.218.209.109"
    echo "   pm2 logs backend"
    echo ""
else
    echo ""
    echo "========================================="
    echo "❌ 部署失败,请检查日志"
    echo "========================================="
    exit 1
fi
