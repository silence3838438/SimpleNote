# 数据库连接配置

## 生产环境数据库信息

- **数据库类型**: MySQL 8.0
- **主机**: localhost（仅服务器内部访问）
- **端口**: 3306
- **用户名**: root
- **密码**: Simplenote@123
- **数据库名**: simplenote

## 使用Navicat连接生产数据库

由于MySQL只监听localhost，不对外开放3306端口，必须使用SSH隧道连接。

### 配置步骤

#### 1. 常规标签页
- **连接名称**: 钱哪去了-生产库（或任意名称）
- **主机**: `127.0.0.1`（重要：不是服务器IP）
- **端口**: `3306`
- **用户名**: `root`
- **密码**: `Simplenote@123`
- ✅ 勾选"保存密码"

#### 2. SSH标签页（必须配置）
- ✅ 勾选"使用SSH通道"
- **主机**: `8.218.209.109`
- **端口**: `22`
- **用户名**: `root`
- **密码**: `520silenceW`

#### 3. 测试连接
点击"测试连接"按钮，应该显示"连接成功"。

### 连接原理

```
你的电脑 → SSH(22端口) → 服务器 → MySQL(3306端口，localhost)
```

Navicat先通过SSH连接到服务器，然后从服务器内部连接MySQL，这样既保证了安全性，又能远程管理数据库。

## 其他数据库工具连接方法

### MySQL Workbench
1. 创建新连接
2. Connection Method: Standard TCP/IP over SSH
3. SSH Hostname: 8.218.209.109:22
4. SSH Username: root
5. SSH Password: 520silenceW
6. MySQL Hostname: 127.0.0.1
7. MySQL Server Port: 3306
8. Username: root
9. Password: Simplenote@123

### DBeaver
1. 新建连接 → MySQL
2. 主机: 127.0.0.1
3. 端口: 3306
4. 数据库: simplenote
5. 用户名: root
6. 密码: Simplenote@123
7. SSH标签页:
   - 使用SSH隧道: ✅
   - 主机: 8.218.209.109
   - 端口: 22
   - 用户名: root
   - 密码: 520silenceW

### 命令行连接（从服务器内部）

```bash
# SSH到服务器
ssh root@8.218.209.109

# 进入MySQL容器
docker exec -it mysql mysql -uroot -p'Simplenote@123' simplenote

# 或者直接执行SQL
docker exec mysql mysql -uroot -p'Simplenote@123' simplenote -e "SELECT COUNT(*) FROM users;"
```

## 常用查询

```sql
-- 查看所有表
SHOW TABLES;

-- 查看用户数量
SELECT COUNT(*) FROM users;

-- 查看账单数量
SELECT COUNT(*) FROM bills;

-- 查看用户积分
SELECT * FROM user_points;

-- 查看某个用户的信息
SELECT * FROM users WHERE id = 14;

-- 查看某个用户的账单
SELECT * FROM bills WHERE user_id = 14 ORDER BY create_time DESC LIMIT 20;
```

## 注意事项

1. **不要直接暴露3306端口**：MySQL只监听localhost是安全的配置，不要修改
2. **密码安全**：数据库密码已在.gitignore中排除，不会提交到Git
3. **备份重要**：定期备份数据库，使用 `mysqldump` 或管理工具导出
4. **SSH密钥**：建议配置SSH密钥认证，更安全

## 数据库备份

```bash
# 备份整个数据库
docker exec mysql mysqldump -uroot -p'Simplenote@123' simplenote > backup_$(date +%Y%m%d).sql

# 恢复数据库
docker exec -i mysql mysql -uroot -p'Simplenote@123' simplenote < backup_20260227.sql
```
