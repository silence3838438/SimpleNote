# 钱哪去了 - 管理后台

基于 Vue3 + Element Plus 的轻量级管理后台系统

## 功能特性

- 📊 数据概览：用户统计、账单统计、活跃度分析
- 👥 用户管理：用户列表、搜索、删除
- 💰 账单管理：账单列表、分类筛选、删除
- � 积分管理：用户积分、积分记录
- 💬 意见反馈：查看用户反馈、删除反馈
- �📝 系统日志：操作日志查看

## 技术栈

- Vue 3
- Vue Router 4
- Element Plus
- ECharts 5
- Axios
- Vite

## 快速开始

### 安装依赖

```bash
cd admin
npm install
```

### 开发环境

```bash
npm run dev
```

访问：http://localhost:5173

### 生产环境

访问：https://api.qiannaqule.top/admin/

### 生产构建

```bash
npm run build
```

构建产物在 `dist` 目录

## 默认账号

- 用户名：`admin`
- 密码：`admin123`

**⚠️ 生产环境请务必修改默认密码！**

## 部署到服务器

### 方式一：直接修改 app.js（推荐，快速）

适用于小改动，如添加菜单、修改路由等。

```bash
# 1. 修改本地 admin/dist-cdn/app.js 文件

# 2. 上传到服务器
scp admin/dist-cdn/app.js root@8.218.209.109:/www/admin/app.js

# 3. 刷新浏览器即可看到更新
```

**优点**：
- 无需安装依赖
- 部署速度快（几秒钟）
- 适合小改动和快速迭代

**注意**：
- app.js 是单文件应用，包含所有组件和路由
- 修改时注意保持 JavaScript 语法正确
- 建议先在本地测试后再上传

### 方式二：完整构建部署

适用于大改动或首次部署。

#### 本地构建（推荐）

```bash
# 1. 安装依赖（首次需要）
cd admin
npm install --registry=https://registry.npmmirror.com

# 2. 构建
npm run build

# 3. 打包
tar -czf /tmp/admin-dist.tar.gz -C dist .

# 4. 上传到服务器
scp /tmp/admin-dist.tar.gz root@8.218.209.109:/tmp/

# 5. 在服务器上解压
ssh root@8.218.209.109 "cd /www/admin && tar -xzf /tmp/admin-dist.tar.gz && rm /tmp/admin-dist.tar.gz"
```

#### 服务器构建（不推荐，内存不足）

服务器内存较小（1GB），npm install 可能会被 killed，建议使用本地构建。

### 3. 配置 Nginx

在 `/etc/nginx/conf.d/admin.conf` 添加：

```nginx
server {
    listen 80;
    server_name admin.qiannaqule.top;
    
    root /www/admin;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass https://api.qiannaqule.top;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### 4. 重启 Nginx

```bash
nginx -t && systemctl reload nginx
```

## 目录结构

```
admin/
├── src/
│   ├── layout/          # 布局组件
│   ├── router/          # 路由配置
│   ├── utils/           # 工具函数
│   ├── views/           # 页面组件
│   │   ├── Dashboard.vue   # 数据概览
│   │   ├── Users.vue       # 用户管理
│   │   ├── Bills.vue       # 账单管理
│   │   ├── Feedback.vue    # 意见反馈
│   │   ├── Logs.vue        # 系统日志
│   │   └── Login.vue       # 登录页
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js
└── package.json
```

## API 接口

所有接口基于 `/api/admin` 前缀：

- `POST /api/admin/login` - 管理员登录
- `GET /api/admin/stats` - 获取统计数据
- `GET /api/admin/users` - 获取用户列表
- `DELETE /api/admin/users/:id` - 删除用户
- `GET /api/admin/bills` - 获取账单列表
- `DELETE /api/admin/bills/:id` - 删除账单
- `GET /api/admin/feedback` - 获取意见反馈列表
- `DELETE /api/admin/feedback/:id` - 删除反馈
- `GET /api/admin/logs` - 获取系统日志

## 注意事项

1. 生产环境请修改默认管理员密码
2. 建议配置 HTTPS
3. 建议添加 IP 白名单限制
4. 定期备份数据库

## License

MIT
