# 钱哪去了 - 智能记账应用

一款简单易用的跨平台记账应用，支持微信小程序、iOS和Android。通过AI技术让记账变得更简单、更智能、更有趣。

## ✨ 核心功能

### 📸 多种记账方式
- **拍照记账**：拍摄小票，AI自动识别金额、商家和类别，3秒完成记账
- **语音记账**：说一句话（如"今天午饭花了25块"），自动记录账单
- **手动记账**：传统输入方式，支持收入/支出分类，灵活记录

### 📊 数据分析与统计
- **月度统计**：收入、支出、结余一目了然
- **分类分析**：按类别统计支出占比，饼图可视化展示
- **趋势分析**：查看消费趋势，对比上月变化
- **预算管理**：设置月度预算，实时监控使用率，超支预警
- **数据导出**：支持导出Excel格式账单，方便备份和分析

### 🎮 游戏化体验
- **春节红包雨**：每天固定时段（10:00/14:00/18:00/21:00）红包雨活动，点击红包获得积分或祝福语
- **积分系统**：记账、设置预算等操作获得积分奖励
- **会员等级**：根据积分自动升级，从"记账新手"到"理财大师"
- **成就勋章**：完成特定任务解锁成就，记录你的记账历程
- **等级特权**：不同等级享受不同的功能权限和视觉效果

### 💰 金额隐私保护
- **分项隐藏**：收入、支出、结余可独立隐藏/显示
- **一键切换**：点击眼睛图标快速切换显示状态
- **状态记忆**：隐藏状态自动保存，下次打开保持

### ⏰ 智能提醒
- **每日提醒**：自定义提醒时间，养成记账好习惯
- **订阅消息**：微信小程序订阅消息推送
- **温馨提示**：贴心的记账提醒文案

### 🔐 数据安全
- **云端同步**：小程序端使用微信云开发，数据自动同步
- **本地缓存**：APP端支持本地存储，离线也能记账
- **数据加密**：所有数据传输加密，保护隐私安全

## 🛠 技术栈

### 前端技术
- **框架**：uni-app (Vue 3 Composition API)
- **UI组件**：自定义组件库
- **图表**：lime-painter（海报生成）
- **状态管理**：Vue 3 Reactive API
- **样式**：SCSS + 美团风格设计规范

### 后端技术
- **小程序端**：微信云开发
  - 云函数：Node.js
  - 云数据库：MongoDB
  - 云存储：图片、文件存储
- **APP端**：独立后端API
  - Node.js + Express
  - MySQL数据库
  - JWT身份认证

### AI能力
- **OCR识别**：百度OCR API（小票识别）
- **语音识别**：百度语音识别API
- **智能分类**：基于关键词的AI分类算法

## 📁 项目结构

```
SimpleNote/
├── pages/                          # 主包页面
│   ├── tab/                       # 底部导航页面
│   │   ├── index/                # 首页（月度统计、红包雨）
│   │   ├── bills/                # 账单列表
│   │   ├── statistics/           # 统计分析（分类占比、趋势图）
│   │   └── profile/              # 个人中心（等级、积分、成就）
│   ├── bills/                     # 账单相关
│   │   └── detail.vue            # 账单详情
│   ├── user/                      # 用户相关
│   │   ├── login.vue             # 登录
│   │   ├── register.vue          # 注册
│   │   └── forgot-password.vue   # 忘记密码
│   ├── settings/                  # 设置页面
│   │   ├── settings.vue          # 设置中心
│   │   ├── reminder.vue          # 提醒设置
│   │   ├── feedback.vue          # 意见反馈
│   │   └── about.vue             # 关于我们
│   ├── record/                    # 记账页面
│   │   ├── photo/                # 拍照记账
│   │   ├── voice/                # 语音记账
│   │   ├── confirm/              # 确认记账
│   │   └── poster/               # 分享海报
│   └── cloudfunctions/            # 云函数（小程序端）
│       ├── billManager/          # 账单管理
│       ├── ocrRecognize/         # OCR识别
│       ├── baiduASR/             # 语音识别
│       ├── sendReminder/         # 定时提醒
│       ├── exportExcel/          # 数据导出
│       ├── voiceRecognize/       # 语音识别（备用）
│       └── config.js             # 云函数配置
├── backend/                       # 后端API（APP端）
│   ├── server.js                 # 服务入口
│   ├── db.js                     # 数据库配置
│   ├── migrate-db.js             # 数据库迁移
│   ├── routes/                   # 路由
│   │   ├── auth.js              # 认证相关
│   │   ├── bills.js             # 账单管理
│   │   ├── ocr.js               # OCR识别
│   │   ├── voice.js             # 语音识别
│   │   ├── user.js              # 用户管理
│   │   └── feedback.js          # 反馈管理
│   ├── middleware/               # 中间件
│   │   ├── auth.js              # 身份验证
│   │   ├── rate-limit.js        # 限流
│   │   └── security.js          # 安全防护
│   ├── uploads/                  # 上传文件目录
│   ├── deploy.sh                 # 部署脚本
│   ├── restart-backend.sh        # 重启脚本
│   ├── START-LOCAL.sh            # 本地启动脚本
│   ├── .env                      # 环境变量（生产）
│   ├── .env.local                # 环境变量（本地）
│   └── 运维手册.md               # 运维文档
├── admin/                         # 管理后台（Vue 3 + Vite）
│   ├── src/
│   │   ├── views/                # 页面
│   │   │   ├── Dashboard.vue    # 数据概览
│   │   │   ├── Users.vue        # 用户管理
│   │   │   ├── Bills.vue        # 账单管理
│   │   │   ├── Feedback.vue     # 反馈管理
│   │   │   ├── Logs.vue         # 日志管理
│   │   │   └── AppVersion.vue   # 版本管理
│   │   ├── layout/               # 布局组件
│   │   ├── router/               # 路由配置
│   │   └── utils/
│   │       └── request.js       # 请求封装
│   ├── dist/                     # 构建输出
│   ├── vite.config.js            # Vite配置
│   ├── nginx-admin.conf          # Nginx配置
│   └── server-deploy.sh          # 部署脚本
├── components/                    # 公共组件
│   ├── ReminderModal.vue         # 提醒弹窗
│   └── UpdateModal.vue           # 更新提示
├── utils/                         # 工具函数
│   ├── apiConfig.js              # API配置
│   ├── request.js                # 统一请求封装
│   ├── platform.js               # 平台判断
│   ├── billStorage.js            # 账单存储
│   ├── cloudbase.js              # 云开发初始化
│   ├── cloudbaseAI.js            # 云开发AI能力
│   ├── category.js               # 分类管理
│   ├── memberLevel.js            # 会员等级
│   ├── pointsRules.js            # 积分规则
│   ├── pointsSync.js             # 积分同步
│   ├── excelExport.js            # Excel导出
│   ├── security.js               # 安全工具
│   ├── voice.js                  # 语音处理
│   ├── date.js                   # 日期工具
│   ├── aiHelper.js               # AI助手
│   └── aiChat.js                 # AI对话
├── static/                        # 静态资源
│   ├── logo.png                  # 应用图标
│   ├── code.jpg                  # 小程序二维码
│   ├── hmBg.png                  # 红包背景
│   ├── mingwen.png               # 显示图标
│   ├── miwen.png                 # 隐藏图标
│   ├── shareLine.png             # 分享线条
│   ├── tabbar/                   # 底部导航图标
│   │   ├── tabbar-home.png
│   │   ├── tabbar-homeSelected.png
│   │   ├── zhangdan.png
│   │   ├── zhangdan-Selected.png
│   │   ├── tabbar-statics.png
│   │   ├── tabbar-staticsSelected.png
│   │   ├── my.png
│   │   └── mySelected.png
│   ├── audio/                    # 音效文件
│   │   ├── red-packet-open.mp3  # 开红包音效
│   │   ├── red-packet-scome.mp3 # 红包来了音效
│   │   └── red-packet-start.mp3 # 红包雨背景音乐
├── styles/                        # 全局样式
│   └── variables.scss            # SCSS变量（美团风格）
├── test-data/                     # 测试数据（不会打包到小程序）
│   └── ocr-samples/              # OCR测试图片（小票样本）
├── uni_modules/                   # uni-app插件
│   └── lime-painter/             # 海报生成插件
├── website/                       # 官网页面
│   ├── index.html                # 首页
│   ├── privacy.html              # 隐私政策
│   ├── terms.html                # 用户协议
│   └── miniprogram-qrcode.jpg    # 小程序码
├── 图片素材/                      # 设计素材
├── .hbuilderx/                    # HBuilderX配置
│   └── launch.json               # 运行配置
├── .vscode/                       # VSCode配置
│   └── settings.json
├── deploy.sh                      # 后端部署脚本（根目录）
├── manifest.json                  # uni-app应用配置
├── pages.json                     # 页面路由配置
├── App.vue                        # 应用入口
├── main.js                        # 主入口文件
├── uni.scss                       # uni-app全局样式
├── theme.json                     # 主题配置
├── androidPrivacy.json            # Android隐私配置
├── privacy.html                   # 隐私政策页面
├── user-agreement.html            # 用户协议页面
├── share-poster.html              # 分享海报页面
├── package.json                   # 项目依赖
└── README.md                      # 项目文档
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
**功能**：账单管理云函数，处理账单的增删改查操作
- 创建账单
- 查询账单列表（支持筛选）
- 更新账单
- 删除账单
- 获取/设置月度预算
- 红包雨积分记录

### ocrRecognize
**功能**：OCR识别云函数，识别小票图片中的金额和商品信息
- 调用百度OCR API
- 智能提取金额、商家名称
- 自动分类识别
- 返回结构化数据

### baiduASR
**功能**：语音识别云函数，将语音转换为文字并提取记账信息
- 调用百度语音识别API
- 智能解析语音内容
- 提取金额、类别、备注
- 支持自然语言理解

### sendReminder
**功能**：定时提醒云函数，每5分钟检查并推送记账提醒
- 定时触发（云函数定时器）
- 检查用户提醒设置
- 推送订阅消息
- 记录提醒历史

### exportExcel
**功能**：数据导出云函数，生成Excel格式的账单报表
- 查询指定时间范围账单
- 生成Excel文件
- 返回临时下载链接
- 支持自定义导出字段

## 🔐 隐私与安全

### 数据安全
- **传输加密**：所有数据使用HTTPS加密传输
- **存储安全**：
  - 小程序：数据存储在微信云数据库，腾讯云安全保障
  - APP：数据存储在独立后端服务器，支持数据加密
- **权限控制**：仅用户本人可访问自己的数据
- **数据备份**：支持数据导出，随时备份

### 隐私保护
- **最小化收集**：仅收集记账必需的信息
- **透明使用**：明确告知数据用途
- **用户控制**：支持数据查看、导出、删除
- **第三方服务**：
  - 百度AI：仅用于OCR和语音识别，不存储用户数据
  - 微信云开发：遵循微信隐私政策

### 权限说明
- **相机权限**：用于拍照记账
- **麦克风权限**：用于语音记账
- **存储权限**：用于保存账单数据和导出文件
- **网络权限**：用于数据同步和AI识别

## 📱 体验小程序

微信扫描下方二维码，立即体验：

<div align="center">
  <img src="./static/code.jpg" width="200" alt="小程序二维码">
  <p>微信扫一扫，体验"钱哪去了"小程序</p>
</div>

或在微信中搜索"钱哪去了"小程序

**APP版本**：
- **iOS App**：App Store搜索"钱哪去了"（开发中）
- **Android App**：各大应用商店搜索"钱哪去了"（开发中）

## 📄 开源协议

MIT License

## 👨‍💻 作者

silence3838438

## 🙏 致谢

感谢以下开源项目和服务：

- [uni-app](https://uniapp.dcloud.io/) - 跨平台应用开发框架
- [Vue.js](https://vuejs.org/) - 渐进式JavaScript框架
- [lime-painter](https://github.com/liangei/lime-painter) - 海报生成组件
- [微信云开发](https://developers.weixin.qq.com/miniprogram/dev/wxcloud/basis/getting-started.html) - 小程序云服务
- [百度AI开放平台](https://ai.baidu.com/) - OCR和语音识别服务
- [Element Plus](https://element-plus.org/) - 管理后台UI组件库

## 📞 联系方式

- **GitHub**：[@silence3838438](https://github.com/silence3838438)
- **邮箱**：951123604@qq.com
- **问题反馈**：[GitHub Issues](https://github.com/silence3838438/SimpleNote/issues)

## 📋 小程序审核说明

尊敬的审核人员：关于您提到的"财务顾问"、"语音记账"、"绑定手机号"、"注册页面"等功能，这些功能在微信小程序版本中不存在，仅在APP版本中提供。小程序用户无法看到这些功能的入口，也无法通过任何方式访问。注册和忘记密码页面已通过条件编译完全移除，小程序使用授权登录无需注册。语音记账、财务顾问、绑定手机号功能在小程序中均无入口。感谢您的审核！

## 🌟 Star History

如果这个项目对你有帮助，欢迎 Star ⭐️

## 📜 更新日志

### v1.0.0 (2026-02-10)
- ✨ 初始版本发布
- 📸 支持拍照记账
- 🎤 支持语音记账
- 📊 数据统计分析
- 🎮 春节红包雨活动
- 💰 金额隐私保护
- ⏰ 记账提醒功能
