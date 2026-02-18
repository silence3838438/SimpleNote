#!/bin/bash

# 记账提醒定时任务配置脚本
# 用途：配置 crontab 定时执行提醒推送任务

echo "=========================================="
echo "配置记账提醒定时任务"
echo "=========================================="

# 获取当前脚本所在目录的绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR"

echo "后端目录: $BACKEND_DIR"

# 检查 send-reminders.js 是否存在
if [ ! -f "$BACKEND_DIR/tasks/send-reminders.js" ]; then
    echo "❌ 错误: 找不到 tasks/send-reminders.js"
    exit 1
fi

# 检查 node 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未安装 Node.js"
    exit 1
fi

NODE_PATH=$(which node)
echo "Node.js 路径: $NODE_PATH"

# 创建日志目录
LOG_DIR="$BACKEND_DIR/logs"
mkdir -p "$LOG_DIR"
echo "✅ 日志目录: $LOG_DIR"

# 定时任务配置（每 5 分钟执行一次）
CRON_JOB="*/5 * * * * cd $BACKEND_DIR && $NODE_PATH tasks/send-reminders.js >> $LOG_DIR/reminders.log 2>&1"

echo ""
echo "=========================================="
echo "将添加以下定时任务："
echo "=========================================="
echo "$CRON_JOB"
echo ""
echo "执行频率: 每 5 分钟一次"
echo "日志文件: $LOG_DIR/reminders.log"
echo "=========================================="
echo ""

# 询问用户是否继续
read -p "是否继续配置？(y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ 已取消配置"
    exit 0
fi

# 检查是否已存在相同的定时任务
if crontab -l 2>/dev/null | grep -q "send-reminders.js"; then
    echo "⚠️  检测到已存在的提醒任务，将先删除旧任务"
    crontab -l 2>/dev/null | grep -v "send-reminders.js" | crontab -
fi

# 添加新的定时任务
(crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -

echo ""
echo "=========================================="
echo "✅ 定时任务配置成功！"
echo "=========================================="
echo ""
echo "当前 crontab 配置："
crontab -l | grep "send-reminders.js"
echo ""
echo "=========================================="
echo "📝 使用说明："
echo "=========================================="
echo "1. 查看定时任务: crontab -l"
echo "2. 查看执行日志: tail -f $LOG_DIR/reminders.log"
echo "3. 手动测试任务: cd $BACKEND_DIR && node tasks/send-reminders.js"
echo "4. 删除定时任务: crontab -e (然后删除对应行)"
echo "=========================================="
