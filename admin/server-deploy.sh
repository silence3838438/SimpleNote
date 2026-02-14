#!/bin/bash

# 服务器端部署脚本
# 在服务器上执行此脚本来部署管理后台

set -e

echo "=========================================="
echo "开始部署管理后台到服务器..."
echo "=========================================="

# 检查压缩包是否存在
if [ ! -f "/tmp/admin-dist.tar.gz" ]; then
  echo "❌ 错误：/tmp/admin-dist.tar.gz 不存在"
  echo "请先上传构建文件到服务器"
  exit 1
fi

# 1. 创建目录
echo "📁 创建部署目录..."
mkdir -p /www/admin

# 2. 备份旧版本
if [ "$(ls -A /www/admin 2>/dev/null)" ]; then
  echo "💾 备份旧版本..."
  BACKUP_DIR="/www/admin-backup-$(date +%Y%m%d-%H%M%S)"
  mkdir -p "$BACKUP_DIR"
  cp -r /www/admin/* "$BACKUP_DIR/" 2>/dev/null || true
  echo "✅ 备份到: $BACKUP_DIR"
  
  # 清空当前目录
  rm -rf /www/admin/*
fi

# 3. 解压新版本
echo "📦 解压新版本..."
tar -xzf /tmp/admin-dist.tar.gz -C /www/admin/

# 4. 设置权限
echo "🔐 设置权限..."
chown -R nginx:nginx /www/admin
chmod -R 755 /www/admin

# 5. 配置 Nginx（如果配置文件不存在）
NGINX_CONF="/etc/nginx/conf.d/admin.conf"
if [ ! -f "$NGINX_CONF" ]; then
  echo "⚙️  配置 Nginx..."
  cat > "$NGINX_CONF" << 'EOF'
# 管理后台配置
location /admin {
    alias /www/admin;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
    
    # 禁止访问隐藏文件
    location ~ /\. {
        deny all;
    }
}
EOF
  
  # 测试 Nginx 配置
  echo "🧪 测试 Nginx 配置..."
  nginx -t
  
  # 重载 Nginx
  echo "🔄 重载 Nginx..."
  systemctl reload nginx
  
  echo "✅ Nginx 配置完成"
else
  echo "ℹ️  Nginx 配置已存在，跳过配置"
  echo "💡 如需更新配置，请手动编辑: $NGINX_CONF"
fi

# 6. 清理临时文件
echo "🧹 清理临时文件..."
rm -f /tmp/admin-dist.tar.gz

echo "=========================================="
echo "✅ 部署完成！"
echo ""
echo "📊 部署信息："
echo "  - 部署目录: /www/admin"
echo "  - 访问地址: https://api.qiannaqule.top/admin/"
echo "  - Nginx 配置: $NGINX_CONF"
echo ""
echo "🔍 验证部署："
echo "  curl -I https://api.qiannaqule.top/admin/"
echo "=========================================="
