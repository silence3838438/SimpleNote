# 测试数据目录

此目录包含用于开发和测试的数据文件，**不会被打包到小程序或APP中**。

## 📁 目录结构

```
test-data/
├── ocr-samples/          # OCR识别测试图片
│   ├── WechatIMG617.jpg  # 超市小票样本
│   ├── WechatIMG618.jpg  # 外卖订单样本
│   ├── WechatIMG619.jpg  # 电子发票样本
│   ├── WechatIMG620.jpg  # 餐饮小票样本
│   ├── WechatIMG621.jpg  # 便利店小票样本
│   └── WechatIMG622.jpg  # 其他小票样本
└── README.md             # 本说明文件
```

## 🎯 用途

### OCR测试图片 (`ocr-samples/`)
用于测试拍照识别功能，包含各种类型的小票和发票样本。

**使用方法**：
1. 运行测试脚本：
   ```bash
   node test-ai-enhance.js
   ```

2. 手动测试：
   - 在APP/小程序中进入拍照识别页面
   - 从相册选择 `test-data/ocr-samples` 中的图片
   - 观察识别结果

## 📝 注意事项

1. **不会打包**：此目录的内容不会被打包到小程序或APP中，不影响包体积
2. **版本控制**：测试图片已加入Git版本控制，方便团队协作测试
3. **添加样本**：如需添加新的测试样本，请放在对应的子目录中

## 🔧 相关文件

- `test-server.js` - 服务器端测试脚本（项目根目录）
- `create-test-user.js` - 创建测试用户脚本（项目根目录）
- `backend/deploy-and-test.sh` - 自动化部署和测试脚本
