# 管理后台部署指南

## 当前状态
❌ 管理后台未部署到服务器

## 访问地址
部署后访问：https://api.qiannaqule.top/admin

## 快速部署

### 方式一：使用已有构建文件（最快）

```bash
# 1. 打包现有构建文件
cd admin
tar -czf admin-dist.tar.gz dist-simple/index.html dist-cdn/app.js

# 2. 上传到服务器
scp admin-dist.tar.gz root@8.218.209.109:/tmp/

# 3. 在服务器上部署
ssh root@8.218.209.109 << 'EOF'
# 创建目录
mkdir -p /www/admin

# 解压文件
cd /www/admin
tar -xzf /tmp/admin-dist.tar.gz --strip-components=1

# 设置权限
chown -R nginx:nginx /www/admin
chmod -R 755 /www/admin

# 清理
rm /tmp/admin-dist.tar.gz

echo "✅ 部署完成！"
echo "访问地址: https://api.qiannaqule.top/admin"
EOF
```

### 方式二：完整构建部署

```bash
# 1. 本地构建
cd admin
npm install
npm run build

# 2. 打包
tar -czf admin-dist.tar.gz -C dist .

# 3. 上传
scp admin-dist.tar.gz root@8.218.209.109:/tmp/

# 4. 服务器部署
ssh root@8.218.209.109 "/www/admin/server-deploy.sh"
```

## Nginx 配置

确保 Nginx 配置文件 `/etc/nginx/conf.d/api.conf` 包含以下内容：

```nginx
# 管理后台
location /admin {
    alias /www/admin;
    index index.html;
    try_files $uri $uri/ /admin/index.html;
    
    # 缓存静态资源
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 7d;
        add_header Cache-Control "public, immutable";
    }
}
```

添加配置后重启 Nginx：
```bash
nginx -t && systemctl reload nginx
```

## 验证部署

```bash
# 检查文件
ssh root@8.218.209.109 "ls -la /www/admin"

# 测试访问
curl -I https://api.qiannaqule.top/admin

# 应该返回 200 状态码
```

## 默认登录信息

- 用户名：`admin`
- 密码：`admin123`

⚠️ **重要**：部署后请立即修改默认密码！

## 故障排查

### 404 错误
```bash
# 检查文件是否存在
ssh root@8.218.209.109 "ls -la /www/admin"

# 检查 Nginx 配置
ssh root@8.218.209.109 "cat /etc/nginx/conf.d/api.conf | grep -A 10 'location /admin'"

# 检查 Nginx 错误日志
ssh root@8.218.209.109 "tail -50 /var/log/nginx/error.log"
```

### 权限问题
```bash
ssh root@8.218.209.109 "chown -R nginx:nginx /www/admin && chmod -R 755 /www/admin"
```
