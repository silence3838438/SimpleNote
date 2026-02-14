#!/bin/bash

# 官网部署脚本 - 部署到后端服务器
echo "开始部署官网文件到后端服务器..."

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# 服务器信息（使用后端服务器）
SERVER_USER="root"
SERVER_HOST="8.218.209.109"
SERVER_PASSWORD="520silenceW"
REMOTE_PATH="/www/website/"

# 检查expect是否安装
if ! command -v expect &> /dev/null; then
    echo "❌ expect 未安装，请先安装: brew install expect"
    exit 1
fi

echo "上传文件到服务器..."

# 使用expect上传每个文件
for file in index.html privacy.html terms.html miniprogram-qrcode.jpg androidCode.jpg gongzhonghao.jpg; do
    if [ -f "$SCRIPT_DIR/$file" ]; then
        echo "上传: $file"
        expect << EOF
set timeout 30
spawn scp $SCRIPT_DIR/$file ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}
expect "password:"
send "${SERVER_PASSWORD}\r"
expect eof
EOF
    fi
done

if [ $? -eq 0 ]; then
    echo "✅ 官网部署成功！"
    echo "访问地址: https://api.qiannaqule.top"
else
    echo "❌ 部署失败，请检查服务器连接"
    exit 1
fi
