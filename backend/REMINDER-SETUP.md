# 记账提醒定时任务配置指南

## 问题说明

生产环境下，用户订阅了记账提醒后，点击微信服务通知会跳转到空白页。

**根本原因：** 虽然已经实现了 HTTPS 接口和定时任务脚本，但没有配置自动执行，导致提醒消息实际上没有发送。

## 解决方案

### 方案一：使用 crontab（推荐）

#### 1. 自动配置（推荐）

```bash
cd backend
chmod +x setup-cron.sh
./setup-cron.sh
```

#### 2. 手动配置

```bash
# 编辑 crontab
crontab -e

# 添加以下内容（每 5 分钟执行一次）
*/5 * * * * cd /path/to/backend && node tasks/send-reminders.js >> logs/reminders.log 2>&1
```

**注意：** 将 `/path/to/backend` 替换为实际的后端目录路径。

### 方案二：使用 PM2 Cron（推荐用于已使用 PM2 的项目）

修改 `ecosystem.config.js`：

```javascript
module.exports = {
  apps: [
    {
      name: 'simplenote-api',
      script: './server.js',
      instances: 2,
      exec_mode: 'cluster',
      // ... 其他配置
    },
    {
      name: 'reminder-task',
      script: './tasks/send-reminders.js',
      cron_restart: '*/5 * * * *', // 每 5 分钟执行一次
      autorestart: false, // 执行完自动退出，不重启
      watch: false,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
```

然后重启 PM2：

```bash
pm2 delete reminder-task  # 如果已存在
pm2 start ecosystem.config.js
pm2 save
```

## 验证配置

### 1. 查看定时任务是否配置成功

```bash
# 查看 crontab
crontab -l

# 或查看 PM2
pm2 list
```

### 2. 手动测试任务

```bash
cd backend
node tasks/send-reminders.js
```

### 3. 查看执行日志

```bash
# crontab 日志
tail -f backend/logs/reminders.log

# PM2 日志
pm2 logs reminder-task
```

### 4. 测试完整流程

1. 在小程序中订阅提醒
2. 在数据库中确认订阅记录：
   ```sql
   SELECT * FROM reminders WHERE enabled = 1;
   ```
3. 等待定时任务执行（或手动执行）
4. 查看日志确认推送结果

## 时间配置说明

当前配置为每 5 分钟执行一次，配合任务脚本中的 10 分钟误差窗口：

- 用户设置 20:00 提醒
- 任务在 20:00-20:10 之间执行时会发送
- 每 5 分钟执行一次，确保及时送达

**Cron 表达式说明：**
- `*/5 * * * *` - 每 5 分钟（当前配置）
- `*/10 * * * *` - 每 10 分钟（降低服务器负载）
- `0 * * * *` - 每小时整点

## 常见问题

### Q1: 如何确认定时任务正在运行？

```bash
# 查看最近的执行日志
tail -20 backend/logs/reminders.log

# 查看进程
ps aux | grep send-reminders
```

### Q2: 定时任务没有执行怎么办？

1. 检查 crontab 是否配置正确：`crontab -l`
2. 检查路径是否正确（使用绝对路径）
3. 检查 Node.js 路径：`which node`
4. 检查日志文件权限
5. 手动执行测试：`node tasks/send-reminders.js`

### Q3: 如何停止定时任务？

```bash
# crontab 方式
crontab -e  # 删除对应行

# PM2 方式
pm2 delete reminder-task
pm2 save
```

### Q4: 云函数还需要吗？

不需要了。现在使用的是 HTTPS 后端 + crontab/PM2 定时任务的方案，云函数可以删除或保留作为备份。

## 环境变量检查

确保 `.env.production` 中配置了微信相关参数：

```env
WX_APPID=your_appid
WX_SECRET=your_secret
NODE_ENV=production
MINIPROGRAM_STATE=formal
```

## 部署清单

- [x] 后端 HTTPS 接口（`backend/routes/bills.js`）
- [x] 微信服务（`backend/services/wechat.js`）
- [x] 定时任务脚本（`backend/tasks/send-reminders.js`）
- [ ] **配置 crontab 或 PM2 定时执行**（需要手动配置）
- [ ] 测试完整流程
- [ ] 删除或停用云函数（可选）
