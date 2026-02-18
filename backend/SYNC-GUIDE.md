# 微信云开发数据同步指南

## 背景

旧版本小程序使用微信云开发存储数据，新版本使用独立MySQL数据库。在过渡期间，需要定期将微信云开发的新增数据同步到MySQL。

## 同步方案

### 方案1：从导出文件同步（推荐）

**适用场景：** 定期手动同步，数据量不大

**步骤：**

1. **导出微信云开发数据**
   - 登录[微信云开发控制台](https://console.cloud.tencent.com/tcb)
   - 进入数据库管理
   - 分别导出以下集合（JSON格式）：
     - `users` - 用户表
     - `bills` - 账单表
     - `points_history` - 积分表

2. **准备数据文件**
   ```bash
   # 创建数据目录
   mkdir -p backend/cloud-data
   
   # 将导出的文件放入目录
   # backend/cloud-data/users.json
   # backend/cloud-data/bills.json
   # backend/cloud-data/points_history.json
   ```

3. **运行同步脚本**
   ```bash
   cd backend
   node sync-from-export.js
   ```

4. **查看同步结果**
   - 脚本会显示新增和跳过的记录数
   - 已存在的数据会自动跳过（通过cloud_id判断）

### 方案2：API实时同步（高级）

**适用场景：** 需要实时同步，数据量大

**步骤：**

1. **配置云开发API密钥**
   ```bash
   # 编辑 backend/.env.production
   CLOUDBASE_SECRET_ID=your_secret_id
   CLOUDBASE_SECRET_KEY=your_secret_key
   ```

2. **运行同步脚本**
   ```bash
   cd backend
   node sync-from-cloud.js
   ```

3. **设置定时任务（可选）**
   ```bash
   # 使用cron每小时同步一次
   0 * * * * cd /www/backend && node sync-from-cloud.js >> /var/log/cloud-sync.log 2>&1
   ```

## 数据库表结构要求

确保MySQL表中有 `cloud_id` 字段用于去重：

```sql
-- 账单表
ALTER TABLE bills ADD COLUMN cloud_id VARCHAR(50) UNIQUE COMMENT '微信云开发ID';

-- 积分表
ALTER TABLE points_history ADD COLUMN cloud_id VARCHAR(50) UNIQUE COMMENT '微信云开发ID';
```

## 同步逻辑

### 用户同步
- 通过 `openid` 判断用户是否已存在
- 新用户：直接插入
- 已存在：更新昵称和头像（如果有变化）

### 账单同步
- 通过 `cloud_id` 判断账单是否已存在
- 先确保用户存在（通过openid查找user_id）
- 新账单：插入并关联到user_id
- 已存在：跳过

### 积分同步
- 通过 `cloud_id` 判断积分记录是否已存在
- 先确保用户存在
- 新记录：插入并关联到user_id
- 已存在：跳过

## 注意事项

1. **数据一致性**
   - 同步前建议备份MySQL数据库
   - 同步过程中避免用户操作

2. **openid映射**
   - 确保微信云开发导出的数据包含 `_openid` 字段
   - 这是关联新旧数据的唯一标识

3. **时间字段**
   - 云开发的时间通常是时间戳（毫秒）
   - 脚本会自动转换为MySQL的DATETIME格式

4. **错误处理**
   - 脚本会跳过无法同步的数据并记录日志
   - 不会因为单条数据失败而中断整个同步过程

## 常见问题

### Q: 同步后用户看不到历史数据？
A: 检查以下几点：
- MySQL的users表中是否有该用户的openid
- bills表中的user_id是否正确关联
- 用户是否使用相同的微信账号登录

### Q: 如何验证同步是否成功？
A: 运行验证脚本：
```bash
node backend/verify-production-data.js
```

### Q: 可以重复运行同步脚本吗？
A: 可以。脚本会自动跳过已存在的数据（通过cloud_id判断），不会产生重复数据。

### Q: 同步需要多长时间？
A: 取决于数据量：
- 1000条账单：约10-30秒
- 10000条账单：约1-3分钟

## 迁移完成后

当所有用户都升级到新版本后：

1. **停止旧版本小程序**
   - 在微信小程序后台下架旧版本

2. **停止同步任务**
   - 删除cron定时任务
   - 删除同步脚本（可选）

3. **清理云开发资源**
   - 保留数据备份
   - 可以关闭云开发环境以节省费用
ni