#!/bin/bash

# 服务监控和自动重启脚本
# 用途：监控Node.js服务状态，自动清理重复进程，内存过高时重启

LOG_FILE="/www/backend/logs/monitor.log"
PID_FILE="/www/backend/service.pid"
MAX_MEMORY_MB=200  # 内存超过200MB时重启

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# 检查是否有多个服务进程
check_duplicate_processes() {
    local count=$(ps aux | grep 'node.*server.js' | grep -v grep | wc -l)
    if [ $count -gt 1 ]; then
        log "⚠️ 检测到 $count 个重复进程，正在清理..."
        pkill -f 'node.*server.js'
        sleep 2
        cd /www/backend && nohup node server.js > /dev/null 2>&1 &
        echo $! > "$PID_FILE"
        log "✅ 服务已重启，PID: $(cat $PID_FILE)"
        return 1
    fi
    return 0
}

# 检查服务是否运行
check_service_running() {
    local pid=$(ps aux | grep 'node.*server.js' | grep -v grep | awk '{print $2}' | head -1)
    if [ -z "$pid" ]; then
        log "❌ 服务未运行，正在启动..."
        cd /www/backend && nohup node server.js > /dev/null 2>&1 &
        echo $! > "$PID_FILE"
        log "✅ 服务已启动，PID: $(cat $PID_FILE)"
        return 1
    fi
    return 0
}

# 检查内存使用
check_memory_usage() {
    local pid=$(ps aux | grep 'node.*server.js' | grep -v grep | awk '{print $2}' | head -1)
    if [ -n "$pid" ]; then
        local mem=$(ps -p $pid -o rss= | awk '{print int($1/1024)}')
        if [ $mem -gt $MAX_MEMORY_MB ]; then
            log "⚠️ 内存使用过高: ${mem}MB，正在重启服务..."
            kill $pid
            sleep 2
            cd /www/backend && nohup node server.js > /dev/null 2>&1 &
            echo $! > "$PID_FILE"
            log "✅ 服务已重启，PID: $(cat $PID_FILE)"
            return 1
        fi
    fi
    return 0
}

# 检查接口响应
check_api_health() {
    local response=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 https://api.qiannaqule.top/api/config/public)
    if [ "$response" != "200" ]; then
        log "❌ API健康检查失败，HTTP状态码: $response"
        local pid=$(ps aux | grep 'node.*server.js' | grep -v grep | awk '{print $2}' | head -1)
        if [ -n "$pid" ]; then
            kill $pid
            sleep 2
        fi
        cd /www/backend && nohup node server.js > /dev/null 2>&1 &
        echo $! > "$PID_FILE"
        log "✅ 服务已重启，PID: $(cat $PID_FILE)"
        return 1
    fi
    return 0
}

# 主监控逻辑
main() {
    log "🔍 开始监控检查..."
    
    # 1. 检查重复进程
    check_duplicate_processes
    
    # 2. 检查服务是否运行
    check_service_running
    
    # 3. 检查内存使用
    check_memory_usage
    
    # 4. 检查API健康
    check_api_health
    
    log "✅ 监控检查完成"
}

# 执行监控
main
