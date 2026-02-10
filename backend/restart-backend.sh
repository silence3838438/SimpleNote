#!/bin/bash

echo "正在停止后端服务..."

# 方法1: 通过进程名杀死
pkill -9 -f "node server.js"

# 方法2: 通过端口杀死
fuser -k 3000/tcp 2>/dev/null

# 等待端口释放
sleep 2

# 确认端口已释放
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "端口3000仍被占用,强制释放..."
    PID=$(netstat -tlnp | grep :3000 | awk '{print $7}' | cut -d'/' -f1)
    if [ ! -z "$PID" ]; then
        kill -9 $PID
        sleep 1
    fi
fi

echo "启动后端服务..."
cd /www/backend
nohup node server.js > /var/log/simplenote-api.log 2>&1 < /dev/null &

sleep 2

echo "检查服务状态..."
if netstat -tlnp | grep :3000 > /dev/null; then
    echo "✅ 后端服务启动成功"
    tail -5 /var/log/simplenote-api.log
else
    echo "❌ 后端服务启动失败"
    tail -10 /var/log/simplenote-api.log
fi
