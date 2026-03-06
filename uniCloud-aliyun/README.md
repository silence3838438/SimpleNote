# UniPush 2.0 推送功能部署指南

## � 部署清单

- [ ] 1. UniApp 项目集成 UniPush
- [ ] 2. 创建 uniCloud 数据库表
- [ ] 3. 上传云函数
- [ ] 4. 配置云函数 URL
- [ ] 5. 配置后端环境变量
- [ ] 6. 配置定时任务
- [ ] 7. 测试推送功能

---

## 1️⃣ UniApp 项目集成 UniPush

### 1.1 配置 manifest.json

在 `manifest.json` 中配置 UniPush 2.0：

```json
{
  "appid": "__UNI__1BF73C1",
  "app-plus": {
    "modules": {
      "Push": {}
    },
    "distribute": {
      "sdkConfigs": {
        "push": {
          "unipush": {
            "version": "2",
            "offline": true,
            "appid": "32yYnvGJLC6lmw8W1Ga4S8",
            "appkey": "KChlP8PRJ46o22fX8NFS04",
            "appsecret": "4kOWXlIrfi61gYuzGT9Ek3"
          }
        }
      }
    }
  }
}
```

**配置说明：**
- `appid`: 从 DCloud 开发者中心获取
- `appkey`: 从 DCloud 开发者中心获取
- `appsecret`: 从 DCloud 开发者中心获取

### 1.2 在 App.vue 中初始化推送

```javascript
// App.vue
const initUniPush = async () => {
  // #ifdef APP-PLUS
  try {
    // 获取推送客户端ID
    const clientInfo = await uni.getPushClientId()
    const clientId = clientInfo.cid
    
    if (clientId) {
      // 保存到本地
      uni.setStorageSync('pushClientId', clientId)
      
      // 上传到服务器
      const token = uni.getStorageSync('token')
      if (token) {
        await request.call('billManager', {
          action: 'savePushClientId',
          data: { clientId }
        })
      }
    }
    
    // 监听推送消息
    uni.onPushMessage((res) => {
      if (res.type === 'click') {
        // 点击推送跳转到首页
        uni.switchTab({ url: '/pages/tab/index/index' })
      }
    })
  } catch (error) {
    console.error('UniPush 初始化失败:', error)
  }
  // #endif
}

onLaunch(async () => {
  await initUniPush()
})
```

### 1.3 获取 UniPush 配置信息

1. 登录 [DCloud 开发者中心](https://dev.dcloud.net.cn/)
2. 进入"我的应用" → 选择应用
3. 进入"uniPush" → "配置管理"
4. 复制 AppID、AppKey、AppSecret

---

## 2️⃣ 创建 uniCloud 数据库表

**必须创建 `opendb-tempdata` 表，否则推送会失败！**

### 方法 1：HBuilderX 上传（推荐）

1. 右键 `uniCloud-aliyun/database/opendb-tempdata.schema.json`
2. 选择"上传 DB Schema"

### 方法 2：控制台创建

1. 登录 [uniCloud 控制台](https://unicloud.dcloud.net.cn/)
2. 进入"云数据库" → "数据库"
3. 点击"新建表"，表名：`opendb-tempdata`

---

## 3️⃣ 上传云函数

### 3.1 关联 uniCloud 服务空间

1. 在 HBuilderX 中右键 `uniCloud-aliyun` 目录
2. 选择"关联云服务空间或项目"
3. 选择"阿里云"，选择或创建服务空间

### 3.2 上传云函数

1. 右键 `uniCloud-aliyun/cloudfunctions/send-reminder`
2. 选择"上传部署"
3. 等待上传完成

---

## 4️⃣ 配置云函数 URL

### 4.1 绑定域名

1. 登录 [uniCloud 控制台](https://unicloud.dcloud.net.cn/)
2. 进入"云函数/云对象" → "云函数列表"
3. 点击右上角"云函数域名绑定"
4. 点击"新增域名" → 选择"默认域名"
5. 等待域名绑定成功

### 4.2 开启 URL 化

1. 在云函数列表找到 `send-reminder`
2. 点击"详情" → "云函数URL化"
3. path 输入：`/send-reminder`
4. 点击"开启"
5. 复制生成的 URL（格式：`https://fc-xxx.next.bspapp.com/send-reminder`）

---

## 5️⃣ 配置后端环境变量

编辑 `backend/.env.production`：

```bash
# uniCloud 云函数 URL
UNICLOUD_PUSH_URL=https://fc-mp-15dbe83d-4164-48c2-8f42-ae207c4d3b38.next.bspapp.com/send-reminder
```

---

## 6️⃣ 配置定时任务

在服务器上执行：

```bash
cd backend
bash setup-push-cron.sh
```

验证：

```bash
crontab -l
# 应该看到：
# */5 * * * * cd /www/backend && /usr/bin/node tasks/send-reminders.js >> /www/backend/logs/push-reminders.log 2>&1
```

---

## 7️⃣ 测试推送功能

### 7.1 测试云函数

```bash
cd backend
node test-unipush.js
```

### 7.2 测试完整流程

1. 在真机上运行 APP
2. 查看控制台确认获取到 ClientID
3. 进入"设置" → "记账提醒"
4. 设置提醒时间（建议设置为当前时间后 10 分钟）
5. 等待推送到达

### 7.3 查看推送日志

```bash
tail -f /www/backend/logs/push-reminders.log
```

---

## � 常见问题

### 1. 推送报错：mongo_cell_decision_not_found

**原因**：没有创建 `opendb-tempdata` 表

**解决**：按照步骤 2 创建数据库表

### 2. 云函数 URL 化提示"不可用"

**原因**：没有绑定域名

**解决**：按照步骤 4.1 绑定域名

### 3. 推送收不到

**检查项：**
- ClientID 是否已上传到服务器
- 用户是否授权了通知权限
- 定时任务是否正常运行
- 云函数日志是否有错误

### 4. iOS 推送收不到

**注意**：
- 必须使用真机测试（模拟器不支持）
- 需要配置正式的推送证书

---

## 📝 推送流程说明

```
用户打开 APP
  ↓
获取 ClientID
  ↓
上传到服务器
  ↓
用户设置提醒时间
  ↓
定时任务扫描（每 5 分钟）
  ↓
调用云函数发送推送
  ↓
推送到达设备
```

---

## 📚 参考文档

- [UniPush 2.0 官方文档](https://uniapp.dcloud.net.cn/unipush-v2.html)
- [uniCloud 云函数文档](https://uniapp.dcloud.net.cn/uniCloud/cf-functions.html)
