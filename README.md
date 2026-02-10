# 钱哪去了 - 智能记账应用

一款简单易用的跨平台记账应用，支持微信小程序、iOS和Android。

## ✨ 核心功能

### 📸 多种记账方式
- **拍照记账**：拍摄小票，AI自动识别金额和类别
- **语音记账**：说一句话，自动记录账单
- **手动记账**：传统输入方式，灵活记录

### 📊 数据分析
- 月度消费统计
- 分类支出分析
- 收支趋势图表
- Excel数据导出

### 🎮 游戏化体验
- 春节红包雨活动
- 积分系统
- 会员等级升级
- 成就勋章

### ⏰ 智能提醒
- 每日记账提醒
- 自定义提醒时间

## 🛠 技术栈

- **前端框架**：uni-app (Vue 3)
- **小程序**：微信云开发
- **APP端**：独立后端API
- **AI能力**：
  - 百度OCR文字识别
  - 百度语音识别
  - AI智能分类

## 📁 项目结构

```
SimpleNote/
├── pages/              # 页面文件
│   ├── index/         # 首页
│   ├── bills/         # 账单列表
│   ├── statistics/    # 统计分析
│   ├── profile/       # 个人中心
│   └── reminder/      # 记账提醒
├── subPackages/       # 分包页面
│   └── record/        # 记账相关页面
├── cloudfunctions/    # 云函数（小程序端）
├── components/        # 组件
├── utils/            # 工具函数
│   ├── apiConfig.js  # API配置
│   ├── request.js    # 统一请求封装
│   ├── platform.js   # 平台判断工具
│   └── billStorage.js # 账单存储
└── static/           # 静态资源
```

## 🚀 快速开始

### 环境要求
- Node.js 14+
- HBuilderX 或 微信开发者工具
- （小程序）微信云开发环境
- （APP）独立后端API服务
- expect（用于自动化部署）

### 安装expect
```bash
# macOS
brew install expect

# Linux
sudo apt-get install expect
```

### 后端部署脚本

项目提供统一的部署脚本 `deploy.sh`，支持以下功能：

```bash
# 查看帮助
./deploy.sh -h

# 完整部署流程（部署+重启+测试）
./deploy.sh -a

# 仅部署代码
./deploy.sh -d

# 仅重启服务
./deploy.sh -r

# 仅测试OCR识别
./deploy.sh -t

# 组合使用
./deploy.sh -d -r    # 部署并重启
```

**配置服务器信息**：编辑 `deploy.sh` 修改以下配置
```bash
SERVER_USER="root"
SERVER_HOST="your-server-ip"
SERVER_PASSWORD="your-password"
BACKEND_PATH="/www/backend"
```

### 小程序开发

1. 克隆项目
```bash
git clone https://github.com/silence3838438/SimpleNote.git
cd SimpleNote
```

2. 安装依赖
```bash
npm install
```

3. 配置云环境
- 在微信开发者工具中打开项目
- 开通云开发服务
- 修改云环境ID

4. 部署云函数
- 右键各个云函数目录
- 选择"上传并部署：云端安装依赖"

5. 配置API密钥
- 百度AI开放平台申请OCR和语音识别API
- 在对应云函数的`config.json`中配置密钥

### APP开发

1. 搭建后端API
- 参考 `backend-api-guide.txt` 搭建后端服务
- 实现账单管理、OCR识别、语音识别等API

2. 配置API地址
- 修改 `utils/apiConfig.js` 中的 `apiBaseUrl`
- 配置百度API密钥

3. 使用HBuilderX打包
- 打开项目
- 发行 → 原生App-云打包
- 选择Android或iOS平台
- 填写应用信息和证书

### iOS上架准备

1. **开发者账号**
   - 注册Apple Developer账号（$99/年）
   - 创建App ID和证书

2. **应用配置**
   - 准备1024x1024的应用图标
   - 准备启动图
   - 准备应用截图（多种尺寸）

3. **隐私政策**
   - 准备隐私政策文档
   - 说明数据收集和使用方式

4. **App Store Connect**
   - 创建应用
   - 填写应用信息
   - 上传构建版本
   - 提交审核

### Android上架准备

1. **开发者账号**
   - Google Play: $25一次性费用
   - 国内应用商店：免费（华为、小米、OPPO等）

2. **应用签名**
   - 生成签名证书
   - 配置签名信息

3. **应用信息**
   - 准备512x512的应用图标
   - 准备应用截图
   - 编写应用描述

4. **上架流程**
   - Google Play Console创建应用
   - 上传APK/AAB
   - 填写商店详情
   - 提交审核

## 📝 云函数说明（小程序端）

### billManager
账单管理云函数，处理账单的增删改查操作

### ocrRecognize
OCR识别云函数，识别小票图片中的金额和商品信息

### baiduASR
语音识别云函数，将语音转换为文字并提取记账信息

### sendReminder
定时提醒云函数，每5分钟检查并推送记账提醒

### exportExcel
数据导出云函数，生成Excel格式的账单报表

## 🔐 隐私说明

- 所有数据加密传输
- 仅用户本人可访问
- 支持数据导出和删除
- 小程序：数据存储在微信云数据库
- APP：数据存储在独立后端服务器

## 📱 体验

- **微信小程序**：搜索"钱哪去了"
- **iOS App**：App Store搜索"钱哪去了"（待上架）
- **Android App**：各大应用商店搜索"钱哪去了"（待上架）

## 📄 开源协议

MIT License

## 👨‍💻 作者

silence3838438

## 🙏 致谢

- uni-app
- lime-painter
- 微信云开发
- 百度AI开放平台
