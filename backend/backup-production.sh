#!/bin/bash

# 生产环境备份脚本
# 备份数据库和重要配置文件

BACKUP_DIR="backups/$(date +%Y%m%d_%H%M%S)"
SERVER="8.218.209.109"
USER="root"
PASSWORD="520silenceW"

# 使用 sshpass 自动登录
export SSHPASS="$PASSWORD"
SSH_CMD="sshpass -e ssh -o StrictHostKeyChecking=no ${USER}@${SERVER}"
SCP_CMD="sshpass -e scp -o StrictHostKeyChecking=no"

echo "========================================="
echo "🔄 开始备份生产环境"
echo "========================================="

# 创建本地备份目录
mkdir -p "$BACKUP_DIR"

echo "📦 1. 备份数据库..."
# 从服务器导出数据库
$SSH_CMD "mysqldump -u root -p'Simplenote@123' simplenote > /tmp/simplenote_backup.sql"

# 下载数据库备份
$SCP_CMD ${USER}@${SERVER}:/tmp/simplenote_backup.sql "$BACKUP_DIR/"

# 清理服务器临时文件
$SSH_CMD "rm /tmp/simplenote_backup.sql"

echo "✅ 数据库备份完成: $BACKUP_DIR/simplenote_backup.sql"

echo ""
echo "📦 2. 备份配置文件..."

# 备份 .env.production
$SCP_CMD ${USER}@${SERVER}:/www/backend/.env.production "$BACKUP_DIR/"

# 备份 ecosystem.config.js
$SCP_CMD ${USER}@${SERVER}:/www/backend/ecosystem.config.js "$BACKUP_DIR/"

# 备份 nginx 配置
$SSH_CMD "cat /etc/nginx/sites-available/simplenote" > "$BACKUP_DIR/nginx-simplenote.conf"

echo "✅ 配置文件备份完成"

echo ""
echo "📦 3. 备份上传文件..."
# 备份 uploads 目录（如果有）
$SCP_CMD -r ${USER}@${SERVER}:/www/backend/uploads "$BACKUP_DIR/" 2>/dev/null || echo "⚠️ uploads目录不存在或为空"

echo ""
echo "📊 4. 生成备份信息..."

# 创建备份信息文件
cat > "$BACKUP_DIR/backup-info.txt" << EOF
备份时间: $(date '+%Y-%m-%d %H:%M:%S')
服务器: ${USER}@${SERVER}
数据库: simplenote

备份内容:
- simplenote_backup.sql (数据库)
- .env.production (环境变量)
- ecosystem.config.js (PM2配置)
- nginx-simplenote.conf (Nginx配置)
- uploads/ (上传文件目录)

恢复说明:
1. 恢复数据库: mysql -u root -p simplenote < simplenote_backup.sql
2. 恢复配置文件到对应位置
3. 重启服务: pm2 restart simplenote-api
EOF

echo "✅ 备份信息已生成"

echo ""
echo "📦 5. 压缩备份文件..."
cd backups
tar -czf "$(basename $BACKUP_DIR).tar.gz" "$(basename $BACKUP_DIR)"
cd ..

echo "✅ 备份已压缩: backups/$(basename $BACKUP_DIR).tar.gz"

echo ""
echo "========================================="
echo "✅ 备份完成！"
echo "========================================="
echo "备份位置: $BACKUP_DIR"
echo "压缩包: backups/$(basename $BACKUP_DIR).tar.gz"
echo ""
echo "备份大小:"
du -sh "$BACKUP_DIR"
du -sh "backups/$(basename $BACKUP_DIR).tar.gz"
