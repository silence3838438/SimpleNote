#!/bin/bash

# 管理后台快速部署脚本

echo "=========================================="
echo "开始构建并部署管理后台..."
echo "=========================================="

# 1. 构建
echo "📦 正在构建..."
cd "$(dirname "$0")"
npm run build

if [ $? -ne 0 ]; then
    echo "❌ 构建失败"
    exit 1
fi

echo "✅ 构建完成"

# 2. 打包
echo "📦 正在打包..."
tar -czf admin-dist.tar.gz -C dist .

# 3. 上传到服务器
echo "📤 正在上传到服务器..."
expect << 'EOF'
set timeout 60
spawn scp admin-dist.tar.gz root@8.218.209.109:/tmp/
expect "password:"
send "520silenceW\r"
expect eof
EOF

# 4. 在服务器上部署
echo "🚀 正在服务器上部署..."
expect << 'EOF'
set timeout 30
spawn ssh root@8.218.209.109
expect "password:"
send "520silenceW\r"
expect "#"
send "cd /www/admin && rm -rf * && tar -xzf /tmp/admin-dist.tar.gz && rm -f /tmp/admin-dist.tar.gz\r"
expect "#"
send "chown -R nginx:nginx /www/admin && chmod -R 755 /www/admin\r"
expect "#"
send "echo '✅ 部署完成'\r"
expect "#"
send "exit\r"
expect eof
EOF

# 5. 清理本地打包文件
rm -f admin-dist.tar.gz

echo ""
echo "=========================================="
echo "✅ 部署完成！"
echo "访问地址: https://api.qiannaqule.top/admin/"
echo "=========================================="
