#!/bin/bash

# AI 接口部署和测试脚本
# 部署 AI 增强功能到生产环境并自动测试

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

# 2. 上传测试脚本和辅助文件
echo "📤 上传测试脚本..."
cd ..
sshpass -p "$PASSWORD" scp test-server.js "$SERVER:$REMOTE_DIR/"
sshpass -p "$PASSWORD" scp create-test-user.js "$SERVER:$REMOTE_DIR/"

# 3. 上传测试图片
echo "📤 上传测试图片..."
sshpass -p "$PASSWORD" ssh "$SERVER" "mkdir -p $REMOTE_DIR/test-data/ocr-samples"
sshpass -p "$PASSWORD" scp test-data/ocr-samples/WechatIMG617.jpg "$SERVER:$REMOTE_DIR/test-data/ocr-samples/"
echo "✅ 测试文件上传成功"

cd backend

# 4. 重启后端服务
echo ""
echo "🔄 重启后端服务..."
sshpass -p "$PASSWORD" ssh "$SERVER" "/www/backend/restart-backend.sh"

if [ $? -ne 0 ]; then
    echo "❌ 服务重启失败"
    exit 1
fi

# 等待服务启动
echo "⏳ 等待服务启动..."
sleep 3

# 5. 运行测试
echo ""
echo "========================================="
echo "🧪 开始运行测试"
echo "========================================="

sshpass -p "$PASSWORD" ssh "$SERVER" << 'EOF'
cd /www/backend

# 确保测试用户存在
echo "📝 创建测试用户..."
node create-test-user.js

# 运行测试
echo ""
timeout 120 node test-server.js
TEST_EXIT_CODE=$?

if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ 部署和测试全部完成!"
    echo "========================================="
    exit 0
else
    echo ""
    echo "========================================="
    echo "❌ 测试失败"
    echo "========================================="
    exit 1
fi
EOF

FINAL_EXIT_CODE=$?

if [ $FINAL_EXIT_CODE -eq 0 ]; then
    echo ""
    echo "📝 API 接口:"
    echo "   POST https://api.qiannaqule.top/api/ai-enhance/ocr"
    echo "   POST https://api.qiannaqule.top/api/ai-enhance/voice"
    echo ""
    echo "📋 查看日志:"
    echo "   ssh root@8.218.209.109"
    echo "   tail -f /var/log/simplenote-api.log"
    echo ""
else
    echo ""
    echo "请检查服务器日志排查问题"
    exit 1
fi
