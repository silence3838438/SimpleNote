# 后端部署说明

## 性能优化 ✨

当前后端已进行性能优化，采用PM2集群模式：

- **PM2集群** - 2个进程，自动负载均衡
- **数据库优化** - 连接池20个连接
- **响应压缩** - gzip压缩，减少带宽
- **内存缓存** - 热点数据缓存

**性能提升**: 并发用户从100-300人提升到500-800人

---

## 数据库连接

详细的数据库连接配置请查看：[DATABASE-CONNECTION.md](./DATABASE-CONNECTION.md)

**快速连接（Navicat）：**
- 主机：`127.0.0.1`，端口：`3306`，用户：`root`，密码：`Simplenote@123`
- SSH：主机`8.218.209.109`，端口`22`，用户`root`，密码`520silenceW`

---

## 快速部署

### 完整部署（推荐）

```bash
cd backend
./deploy.sh
```

这会自动执行：
1. 上传所有routes文件到服务器
2. 执行数据库迁移
3. 重启后端服务
4. 运行自动化测试
5. 输出测试结果

### 单文件部署

```bash
cd backend
./deploy.sh routes/bills.js
```

只上传指定文件，然后重启服务并运行测试。

## 自动化测试

部署后会自动运行 `test-all-features.js` 测试脚本，测试内容包括：

- ✅ 用户认证（注册、登录）
- ✅ 账单管理（创建、查询、更新、删除）
- ✅ OCR识别 + AI增强
- ✅ 语音识别 + AI增强
- ✅ 管理后台接口
- ✅ 文件上传
- ✅ 版本检查

测试报告保存在服务器：`/www/test-report.json`

## 查看测试报告

```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "cat /www/test-report.json"
```

## 环境信息

- **服务器**: 8.218.209.109
- **部署目录**: /www/backend
- **测试脚本**: /www/test-all-features.js
- **测试账号**: test001 / test123456
- **管理员账号**: admin / admin123
- **运行模式**: PM2集群模式 (2进程)

## PM2管理命令

### 查看服务状态
```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "export PATH=/usr/local/node-v16.20.2-linux-x64/bin:\$PATH && pm2 status"
```

### 查看实时日志
```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "export PATH=/usr/local/node-v16.20.2-linux-x64/bin:\$PATH && pm2 logs simplenote-api"
```

### 查看内存监控
```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "export PATH=/usr/local/node-v16.20.2-linux-x64/bin:\$PATH && pm2 monit"
```

### 重启服务
```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "export PATH=/usr/local/node-v16.20.2-linux-x64/bin:\$PATH && pm2 restart simplenote-api"
```

## 故障排查

### 查看服务状态

```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "ps aux | grep node"
```

### 查看服务日志

```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "tail -n 50 /www/backend/server.log"
```

### 手动重启服务

```bash
sshpass -p '520silenceW' ssh root@8.218.209.109 "/www/backend/restart-backend.sh"
```


## 数据备份与恢复

### 执行备份

```bash
cd backend
./backup-production.sh
```

备份内容包括：
- 数据库完整备份（所有表和数据）
- .env.production（环境变量配置）
- ecosystem.config.js（PM2配置）
- nginx配置文件
- uploads目录（用户上传文件）

备份文件保存在：`backups/YYYYMMDD_HHMMSS/`

### 备份内容说明

数据库包含17个表：
- `users` - 用户信息
- `bills` - 账单记录
- `reminders` - 记账提醒设置
- `budgets` - 预算设置
- `ai_chat_usage` - AI对话记录
- `feedback` - 用户反馈
- `app_versions` - APP版本管理
- `app_config` - 应用配置
- `user_points` - 用户积分
- `points_history` - 积分历史
- `red_packet_records` - 红包记录
- `verification_codes` - 验证码
- `registration_logs` - 注册日志
- `logs` - 系统日志
- `ip_blacklist` - IP黑名单
- `phone_blacklist` - 手机号黑名单
- `android_qrcode` - Android二维码

### 恢复数据库

```bash
# 1. 上传备份文件到服务器
scp backups/YYYYMMDD_HHMMSS/simplenote_backup.sql root@8.218.209.109:/tmp/

# 2. 恢复数据库
sshpass -p '520silenceW' ssh root@8.218.209.109 "mysql -u root -p'Simplenote@123' simplenote < /tmp/simplenote_backup.sql"

# 3. 重启服务
sshpass -p '520silenceW' ssh root@8.218.209.109 "export PATH=/usr/local/node-v16.20.2-linux-x64/bin:\$PATH && pm2 restart simplenote-api"
```

### 定期备份建议

建议每周执行一次完整备份，重要更新前也应该备份。备份文件建议保存到云存储或其他安全位置。
