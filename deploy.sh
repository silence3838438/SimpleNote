#!/bin/bash

# 小票识别记账APP - 后端部署脚本
# 功能：部署后端代码、重启服务、测试OCR识别

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 服务器配置
SERVER_USER="root"
SERVER_HOST="8.218.209.109"
SERVER_PASSWORD="520silenceW"
BACKEND_PATH="/www/backend"

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# 显示帮助信息
show_help() {
    echo "用法: ./deploy.sh [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help          显示帮助信息"
    echo "  -d, --deploy        部署后端代码到服务器"
    echo "  -r, --restart       重启后端服务"
    echo "  -t, --test          测试OCR识别功能"
    echo "  -a, --all           执行完整流程（部署+重启+测试）"
    echo ""
    echo "示例:"
    echo "  ./deploy.sh -a              # 完整部署流程"
    echo "  ./deploy.sh -d              # 仅部署代码"
    echo "  ./deploy.sh -t              # 仅测试OCR"
    echo "  ./deploy.sh -d -r           # 部署并重启"
}

# 部署后端代码
deploy_backend() {
    print_info "开始部署后端代码..."
    
    # 使用expect自动输入密码
    expect << EOF
set timeout 30
spawn scp backend/routes/ocr.js ${SERVER_USER}@${SERVER_HOST}:${BACKEND_PATH}/routes/
expect "password:"
send "${SERVER_PASSWORD}\r"
expect eof
EOF
    
    if [ $? -eq 0 ]; then
        print_success "后端代码部署成功"
    else
        print_error "后端代码部署失败"
        exit 1
    fi
}

# 重启后端服务
restart_backend() {
    print_info "重启后端服务..."
    
    expect << EOF
set timeout 30
spawn ssh ${SERVER_USER}@${SERVER_HOST} "bash ${BACKEND_PATH}/restart-backend.sh"
expect "password:"
send "${SERVER_PASSWORD}\r"
expect eof
EOF
    
    if [ $? -eq 0 ]; then
        print_success "后端服务重启成功"
        sleep 2  # 等待服务完全启动
    else
        print_error "后端服务重启失败"
        exit 1
    fi
}

# 生成测试Token
generate_test_token() {
    # 使用Node.js生成JWT Token（静默输出）
    local token=$(node -e "
const jwt = require('./backend/node_modules/jsonwebtoken');
const token = jwt.sign(
    { userId: 1, openid: 'test-openid-123' },
    'a8f5f167f44f4964e6c998dee827110c8b9c7c8f9e3a2b1d4f6e8a7c9b5d3e1f',
    { expiresIn: '7d' }
);
console.log(token);
" 2>/dev/null)
    
    echo "$token"
}

# 测试OCR识别
test_ocr() {
    print_info "开始测试OCR识别功能..."
    
    # 检查测试图片目录
    if [ ! -d "test-data/ocr-samples" ]; then
        print_error "测试图片目录不存在: test-data/ocr-samples"
        exit 1
    fi
    
    # 生成测试Token
    local TEST_TOKEN=$(generate_test_token)
    
    # 获取当前目录的绝对路径
    local CURRENT_DIR=$(pwd)
    
    # 创建临时测试脚本
    cat > /tmp/test-ocr-temp.js << SCRIPT_EOF
const fs = require('fs');
const path = require('path');
const axios = require('${CURRENT_DIR}/backend/node_modules/axios');

const testImagesDir = '${CURRENT_DIR}/test-data/ocr-samples';
const OCR_API = 'http://8.218.209.109:3000/api/ocrRecognize';
const TEST_TOKEN = '${TEST_TOKEN}';

async function testOCR(imagePath) {
    try {
        const imageName = path.basename(imagePath);
        console.log('\\n========================================');
        console.log('测试图片:', imageName);
        console.log('========================================\\n');
        
        const imageBuffer = fs.readFileSync(imagePath);
        const imageBase64 = imageBuffer.toString('base64');
        
        const response = await axios.post(OCR_API, {
            imageBase64: imageBase64,
            useAI: false
        }, {
            headers: {
                'Authorization': \`Bearer \${TEST_TOKEN}\`,
                'Content-Type': 'application/json'
            },
            timeout: 30000
        });
        
        if (response.data.success) {
            console.log('✅ OCR 识别成功！\\n');
            console.log('识别结果:');
            console.log('- 类型:', response.data.data.type === 'expense' ? '支出' : '收入');
            console.log('- 金额:', response.data.data.amount);
            console.log('- 商家:', response.data.data.merchant);
            console.log('- 日期:', response.data.data.date);
            console.log('- 分类:', response.data.data.categoryName || '(未识别)');
            console.log('- 备注:', response.data.data.remark || '(空)');
        } else {
            console.log('❌ OCR 识别失败:', response.data.error);
        }
    } catch (error) {
        console.log('❌ 请求失败:', error.message);
    }
}

async function testAllImages() {
    const files = fs.readdirSync(testImagesDir);
    const imageFiles = files.filter(f => /\\.(jpg|jpeg|png)\$/i.test(f));
    
    console.log('找到', imageFiles.length, '张测试图片\\n');
    
    for (const file of imageFiles) {
        const imagePath = path.join(testImagesDir, file);
        await testOCR(imagePath);
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\\n========================================');
    console.log('所有测试完成！');
    console.log('========================================');
}

testAllImages().catch(console.error);
SCRIPT_EOF
    
    # 运行测试
    node /tmp/test-ocr-temp.js
    
    # 清理临时文件
    rm -f /tmp/test-ocr-temp.js
    
    print_success "OCR测试完成"
}

# 主函数
main() {
    # 检查expect是否安装
    if ! command -v expect &> /dev/null; then
        print_error "expect 未安装，请先安装: brew install expect"
        exit 1
    fi
    
    # 检查Node.js是否安装
    if ! command -v node &> /dev/null; then
        print_error "Node.js 未安装"
        exit 1
    fi
    
    # 解析命令行参数
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    local do_deploy=false
    local do_restart=false
    local do_test=false
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -d|--deploy)
                do_deploy=true
                shift
                ;;
            -r|--restart)
                do_restart=true
                shift
                ;;
            -t|--test)
                do_test=true
                shift
                ;;
            -a|--all)
                do_deploy=true
                do_restart=true
                do_test=true
                shift
                ;;
            *)
                print_error "未知选项: $1"
                show_help
                exit 1
                ;;
        esac
    done
    
    # 执行操作
    print_info "开始执行部署流程..."
    echo ""
    
    if [ "$do_deploy" = true ]; then
        deploy_backend
        echo ""
    fi
    
    if [ "$do_restart" = true ]; then
        restart_backend
        echo ""
    fi
    
    if [ "$do_test" = true ]; then
        test_ocr
        echo ""
    fi
    
    print_success "所有操作完成！"
}

# 运行主函数
main "$@"
