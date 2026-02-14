#!/bin/bash

# 后端自动部署脚本
# 用法: ./deploy.sh [文件路径]
# 示例: ./deploy.sh routes/bills.js
#
# 重要注意事项:
# 1. 数据库迁移会自动执行 migrate-db.js，包含所有表结构变更
# 2. 如果新增了数据库表，需要同时更新 db.js 的 initTables() 和 migrate-db.js
# 3. 生产环境使用 .env 文件，本地开发使用 .env.local
# 4. 部署会自动重启 PM2 服务并运行测试

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
    # 否则上传所有routes文件和middleware
    echo "📤 上传所有routes文件和middleware..."
    sshpass -p "$PASSWORD" scp -r routes/ "$SERVER:$REMOTE_DIR/"
    sshpass -p "$PASSWORD" scp -r middleware/ "$SERVER:$REMOTE_DIR/"
    sshpass -p "$PASSWORD" scp server.js db.js "$SERVER:$REMOTE_DIR/"
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

# 上传PM2配置文件
sshpass -p "$PASSWORD" scp ecosystem.config.js "$SERVER:$REMOTE_DIR/"
sshpass -p "$PASSWORD" scp restart-backend-pm2.sh "$SERVER:$REMOTE_DIR/"
sshpass -p "$PASSWORD" ssh "$SERVER" "chmod +x /www/backend/restart-backend-pm2.sh"

# 安装新依赖（compression和pm2）
echo "📦 安装依赖..."
sshpass -p "$PASSWORD" ssh "$SERVER" "cd $REMOTE_DIR && npm install compression pm2 --save"

# 使用PM2重启服务
sshpass -p "$PASSWORD" ssh "$SERVER" "/www/backend/restart-backend-pm2.sh"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ 服务重启成功"
    
    # 等待服务启动
    echo ""
    echo "⏳ 等待服务启动 (5秒)..."
    sleep 5
    
    # 上传测试脚本到backend目录（使用backend的node_modules）
    echo ""
    echo "📤 上传测试脚本..."
    sshpass -p "$PASSWORD" scp ../test-all-features.js "$SERVER:$REMOTE_DIR/"
    
    # 运行自动化测试
    echo ""
    echo "🧪 运行自动化测试..."
    sshpass -p "$PASSWORD" ssh "$SERVER" "cd $REMOTE_DIR && node test-all-features.js"
    
    TEST_EXIT_CODE=$?
    
    echo ""
    echo "========================================="
    if [ $TEST_EXIT_CODE -eq 0 ]; then
        echo "✅ 部署完成! 所有测试通过"
    else
        echo "⚠️  部署完成，但部分测试失败"
        echo "请查看测试报告: $REMOTE_DIR/test-report.json"
    fi
    echo "========================================="
else
    echo ""
    echo "========================================="
    echo "❌ 部署失败,请检查日志"
    echo "========================================="
    exit 1
fi
