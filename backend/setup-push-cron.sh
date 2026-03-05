#!/bin/bash

# 配置推送提醒的定时任务
# 每10分钟执行一次推送检查

BACKEND_DIR="/www/backend"
LOG_DIR="/var/log/simplenote"

echo "========================================="
echo "🔧 配置推送提醒定时任务"
echo "========================================="

# 创建日志目录
mkdir -p "$LOG_DIR"

# 检查是否已存在定时任务
if crontab -l 2>/dev/null | grep -q "send-reminders.js"; then
    echo "⚠️  定时任务已存在，跳过配置"
    echo ""
    echo "当前定时任务："
    crontab -l | grep "send-reminders.js"
    exit 0
fi

# 添加定时任务
(crontab -l 2>/dev/null; echo "*/10 * * * * cd $BACKEND_DIR && node tasks/send-reminders.js >> $LOG_DIR/push-reminders.log 2>&1") | crontab -

if [ $? -eq 0 ]; then
    echo "✅ 定时任务配置成功"
    echo ""
    echo "定时任务详情："
    echo "  执行频率: 每10分钟"
    echo "  执行脚本: $BACKEND_DIR/tasks/send-reminders.js"
    echo "  日志文件: $LOG_DIR/push-reminders.log"
    echo ""
    echo "查看日志命令："
    echo "  tail -f $LOG_DIR/push-reminders.log"
else
    echo "❌ 定时任务配置失败"
    exit 1
fi

echo "========================================="
echo "✅ 配置完成"
echo "========================================="
