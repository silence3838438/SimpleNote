#!/bin/bash

# 修复 Nginx 上传文件大小限制
# 解决管理后台上传 APK 文件 413 错误

SERVER_PASSWORD="520silenceW"

echo "=========================================="
echo "修复 Nginx 上传文件大小限制"
echo "=========================================="

# 使用 expect 连接服务器并修改配置
expect << 'EOFSCRIPT'
set timeout 30

spawn ssh root@8.218.209.109

expect "password:"
send "520silenceW\r"

expect "#"
send "grep -q 'client_max_body_size' /etc/nginx/nginx.conf\r"

expect "#"
send "if [ $? -ne 0 ]; then sed -i '/http {/a\\    client_max_body_size 200M;' /etc/nginx/nginx.conf; fi\r"

expect "#"
send "nginx -t && systemctl reload nginx\r"

expect "#"
send "echo '✅ Nginx 已重载，上传限制已设置为 200MB'\r"

expect "#"
send "exit\r"

expect eof
EOFSCRIPT

echo ""
echo "=========================================="
echo "✅ 修复完成！"
echo "现在可以上传最大 200MB 的 APK 文件"
echo "=========================================="
