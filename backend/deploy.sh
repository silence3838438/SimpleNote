#!/bin/bash

# 后端自动部署脚本
# 用法: ./deploy.sh [文件路径]
# 示例: ./deploy.sh routes/bills.js

SERVER="root@8.218.209.109"
PASSWORD="520silenceW"
REMOTE_DIR="/www/backend"

echo "========================================="
echo "🚀 开始部署后端服务"
echo "========================================="

# 如果指定了文件,只上传该文件
if [ ! -z "$1" ]; then
    echo "📤 上传文件: $1"
    sshpass -p "$PASSWORD" scp "$1" "$SERVER:$REMOTE_DIR/$1"
    if [ $? -ne 0 ]; then
        echo "❌ 文件上传失败"
        exit 1
    fi
    echo "✅ 文件上传成功"
else
    # 否则上传所有routes文件
    echo "📤 上传所有routes文件..."
    sshpass -p "$PASSWORD" scp -r routes/ "$SERVER:$REMOTE_DIR/"
    if [ $? -ne 0 ]; then
        echo "❌ 文件上传失败"
        exit 1
    fi
    echo "✅ 文件上传成功"
fi

echo ""
echo "🔄 执行数据库迁移..."

# 先上传迁移脚本
sshpass -p "$PASSWORD" scp migrate-db.js "$SERVER:$REMOTE_DIR/"

# 执行数据库迁移
sshpass -p "$PASSWORD" ssh "$SERVER" "cd /www/backend && node migrate-db.js"

if [ $? -ne 0 ]; then
    echo "⚠️  数据库迁移失败，但继续部署..."
fi

echo ""
echo "🔄 重启后端服务..."

# 执行远程重启脚本
sshpass -p "$PASSWORD" ssh "$SERVER" "/www/backend/restart-backend.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================="
    echo "✅ 部署完成!"
    echo "========================================="
else
    echo ""
    echo "========================================="
    echo "❌ 部署失败,请检查日志"
    echo "========================================="
    exit 1
fi
