# 后端部署说明

## 性能优化 ✨

当前后端已进行性能优化，采用PM2集群模式：

- **PM2集群** - 2个进程，自动负载均衡
- **数据库优化** - 连接池20个连接
- **响应压缩** - gzip压缩，减少带宽
- **内存缓存** - 热点数据缓存

**性能提升**: 并发用户从100-300人提升到500-800人

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
