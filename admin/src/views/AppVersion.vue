<template>
  <div class="app-version-container">
    <el-card class="header-card">
      <div class="header-content">
        <div>
          <h2>APP版本管理</h2>
          <p class="subtitle">管理Android和iOS应用版本更新</p>
        </div>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          发布新版本
        </el-button>
      </div>
    </el-card>

    <!-- 平台切换 -->
    <el-tabs v-model="activePlatform" class="platform-tabs">
      <el-tab-pane label="Android" name="Android">
        <version-list 
          :versions="androidVersions" 
          platform="Android"
          @edit="handleEdit"
          @delete="handleDelete"
          @toggle-force="handleToggleForce"
        />
      </el-tab-pane>
      <el-tab-pane label="iOS" name="iOS">
        <version-list 
          :versions="iosVersions" 
          platform="iOS"
          @edit="handleEdit"
          @delete="handleDelete"
          @toggle-force="handleToggleForce"
        />
      </el-tab-pane>
    </el-tabs>

    <!-- 添加/编辑版本对话框 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form :model="form" :rules="rules" ref="formRef" label-width="100px">
        <el-form-item label="平台" prop="platform">
          <el-select v-model="form.platform" placeholder="请选择平台" :disabled="isEdit">
            <el-option label="Android" value="Android" />
            <el-option label="iOS" value="iOS" />
          </el-select>
        </el-form-item>

        <el-form-item label="版本号" prop="version">
          <el-input v-model="form.version" placeholder="如: 1.0.1" />
          <div class="form-tip">格式: 主版本号.次版本号.修订号</div>
        </el-form-item>

        <el-form-item label="更新内容" prop="updateContent">
          <el-input 
            v-model="updateContentText" 
            type="textarea" 
            :rows="4"
            placeholder="每行一条更新内容"
          />
          <div class="form-tip">每行一条更新内容,自动分行显示</div>
        </el-form-item>

        <el-form-item label="安装包大小" prop="packageSize" v-if="form.platform === 'Android'">
          <el-input v-model="form.packageSize" placeholder="如: 15.8MB" />
        </el-form-item>

        <el-form-item label="更新方式" v-if="form.platform === 'Android'">
          <el-radio-group v-model="form.updateType">
            <el-radio label="server">服务器下载</el-radio>
            <el-radio label="market">应用市场</el-radio>
          </el-radio-group>
          <div class="form-tip">
            服务器下载：用户直接从服务器下载APK安装<br/>
            应用市场：根据手机品牌跳转到对应应用市场更新
          </div>
        </el-form-item>

        <el-form-item label="下载地址" prop="downloadUrl" v-if="form.platform === 'Android' && form.updateType === 'server'">
          <el-input v-model="form.downloadUrl" placeholder="APK下载地址" />
          <div class="form-tip">
            服务器APK文件地址,用户点击更新后会下载此文件
          </div>
        </el-form-item>

        <!-- 应用市场配置 -->
        <el-card v-if="form.platform === 'Android' && form.updateType === 'market'" class="market-config-card">
          <template #header>
            <div class="card-header">
              <span>应用市场配置</span>
              <el-tag size="small" type="info">根据手机品牌自动跳转</el-tag>
            </div>
          </template>
          
          <el-form-item label="华为应用市场">
            <el-input v-model="form.markets.huawei" placeholder="appmarket://details?id=com.qiannaqule.money" />
          </el-form-item>
          
          <el-form-item label="小米应用商店">
            <el-input v-model="form.markets.xiaomi" placeholder="https://app.mi.com/details?id=com.qiannaqule.money" />
          </el-form-item>
          
          <el-form-item label="VIVO应用商店">
            <el-input v-model="form.markets.vivo" placeholder="vivomarket://details?id=com.qiannaqule.money" />
          </el-form-item>
          
          <el-form-item label="OPPO软件商店">
            <el-input v-model="form.markets.oppo" placeholder="market://details?id=com.qiannaqule.money" />
          </el-form-item>
          
          <el-form-item label="荣耀应用市场">
            <el-input v-model="form.markets.honor" placeholder="market://details?id=com.qiannaqule.money" />
          </el-form-item>

          <el-alert 
            title="应用市场链接说明" 
            type="info" 
            :closable="false"
            style="margin-top: 12px"
          >
            <ul style="margin: 8px 0; padding-left: 20px; line-height: 1.8;">
              <li>华为：appmarket://details?id=包名</li>
              <li>小米：https://app.mi.com/details?id=包名</li>
              <li>VIVO：vivomarket://details?id=包名</li>
              <li>OPPO/荣耀：market://details?id=包名</li>
              <li>当前包名：com.qiannaqule.money</li>
            </ul>
          </el-alert>
        </el-card>
        
        <el-alert 
          v-if="form.platform === 'iOS'" 
          title="iOS版本更新说明" 
          type="info" 
          :closable="false"
          style="margin-bottom: 16px"
        >
          iOS应用更新通过App Store进行,用户点击更新后会自动跳转到App Store
        </el-alert>

        <el-form-item label="强制更新">
          <el-switch v-model="form.isForce" />
          <div class="form-tip">开启后用户必须更新才能使用APP</div>
        </el-form-item>

        <el-form-item label="上传APK" v-if="form.platform === 'Android' && form.updateType === 'server'">
          <el-upload
            class="upload-demo"
            :action="uploadUrl"
            :headers="uploadHeaders"
            :on-success="handleUploadSuccess"
            :on-error="handleUploadError"
            :before-upload="beforeUpload"
            accept=".apk"
            :limit="1"
          >
            <el-button type="primary">点击上传APK</el-button>
            <template #tip>
              <div class="el-upload__tip">
                只能上传APK文件,且不超过100MB
              </div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmit" :loading="submitting">
          {{ isEdit ? '保存' : '发布' }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import VersionList from './components/VersionList.vue'
import request from '@/utils/request'

const activePlatform = ref('Android')
const androidVersions = ref([])
const iosVersions = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const submitting = ref(false)
const formRef = ref(null)

const form = reactive({
  id: null,
  platform: 'Android',
  version: '',
  updateContent: [],
  packageSize: '',
  downloadUrl: '',
  isForce: false,
  updateType: 'server', // server: 服务器下载, market: 应用市场
  markets: {
    huawei: 'appmarket://details?id=com.qiannaqule.money',
    xiaomi: 'https://app.mi.com/details?id=com.qiannaqule.money',
    vivo: 'vivomarket://details?id=com.qiannaqule.money',
    oppo: 'market://details?id=com.qiannaqule.money',
    honor: 'market://details?id=com.qiannaqule.money'
  }
})

const updateContentText = ref('')

const rules = {
  platform: [{ required: true, message: '请选择平台', trigger: 'change' }],
  version: [
    { required: true, message: '请输入版本号', trigger: 'blur' },
    { pattern: /^\d+\.\d+\.\d+$/, message: '版本号格式不正确', trigger: 'blur' }
  ],
  updateContent: [{ required: true, message: '请输入更新内容', trigger: 'blur' }],
  packageSize: [
    { 
      required: true, 
      validator: (rule, value, callback) => {
        if (form.platform === 'Android' && !value) {
          callback(new Error('请输入安装包大小'))
        } else {
          callback()
        }
      },
      trigger: 'blur' 
    }
  ],
  downloadUrl: [
    { 
      required: true, 
      validator: (rule, value, callback) => {
        if (form.platform === 'Android' && form.updateType === 'server' && !value) {
          callback(new Error('请输入下载地址'))
        } else {
          callback()
        }
      },
      trigger: 'blur' 
    }
  ]
}

const dialogTitle = computed(() => {
  return isEdit.value ? '编辑版本' : '发布新版本'
})

const uploadUrl = computed(() => {
  return 'https://api.qiannaqule.top/api/admin/upload-apk'
})

const uploadHeaders = computed(() => {
  return {
    'Authorization': `Bearer ${localStorage.getItem('admin_token')}`
  }
})

// 加载版本列表
const loadVersions = async () => {
  try {
    const res = await request.get('/admin/app-versions')
    if (res.success) {
      androidVersions.value = res.data.filter(v => v.platform === 'Android')
      iosVersions.value = res.data.filter(v => v.platform === 'iOS')
    }
  } catch (error) {
    ElMessage.error('加载版本列表失败')
  }
}

// 显示添加对话框
const showAddDialog = () => {
  isEdit.value = false
  resetForm()
  form.platform = activePlatform.value
  dialogVisible.value = true
}

// 编辑版本
const handleEdit = (version) => {
  isEdit.value = true
  Object.assign(form, version)
  updateContentText.value = version.updateContent.join('\n')
  dialogVisible.value = true
}

// 删除版本
const handleDelete = async (version) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除版本 ${version.version} 吗？`,
      '提示',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const res = await request.delete(`/admin/app-versions/${version.id}`)
    if (res.success) {
      ElMessage.success('删除成功')
      loadVersions()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// 切换强制更新
const handleToggleForce = async (version) => {
  try {
    const res = await request.put(`/admin/app-versions/${version.id}/force`, {
      isForce: !version.isForce
    })
    if (res.success) {
      ElMessage.success('更新成功')
      loadVersions()
    }
  } catch (error) {
    ElMessage.error('更新失败')
  }
}

// 提交表单
const handleSubmit = async () => {
  try {
    await formRef.value.validate()
    
    // 处理更新内容
    form.updateContent = updateContentText.value
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.trim())

    if (form.updateContent.length === 0) {
      ElMessage.error('请输入至少一条更新内容')
      return
    }

    // iOS平台不需要下载地址和包大小
    if (form.platform === 'iOS') {
      form.downloadUrl = 'https://apps.apple.com'
      form.packageSize = '-'
      form.updateType = 'market'
    }

    // Android应用市场模式不需要下载地址
    if (form.platform === 'Android' && form.updateType === 'market') {
      form.downloadUrl = 'market'
    }

    submitting.value = true

    const url = isEdit.value 
      ? `/admin/app-versions/${form.id}` 
      : '/admin/app-versions'
    
    const method = isEdit.value ? 'put' : 'post'
    
    const res = await request[method](url, form)
    
    if (res.success) {
      ElMessage.success(isEdit.value ? '保存成功' : '发布成功')
      dialogVisible.value = false
      loadVersions()
    }
  } catch (error) {
    if (error !== false) {
      ElMessage.error(isEdit.value ? '保存失败' : '发布失败')
    }
  } finally {
    submitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  Object.assign(form, {
    id: null,
    platform: 'Android',
    version: '',
    updateContent: [],
    packageSize: '',
    downloadUrl: '',
    isForce: false,
    updateType: 'server',
    markets: {
      huawei: 'appmarket://details?id=com.qiannaqule.money',
      xiaomi: 'https://app.mi.com/details?id=com.qiannaqule.money',
      vivo: 'vivomarket://details?id=com.qiannaqule.money',
      oppo: 'market://details?id=com.qiannaqule.money',
      honor: 'market://details?id=com.qiannaqule.money'
    }
  })
  updateContentText.value = ''
  formRef.value?.clearValidate()
}

// 上传前检查
const beforeUpload = (file) => {
  const isAPK = file.name.endsWith('.apk')
  const isLt100M = file.size / 1024 / 1024 < 100

  if (!isAPK) {
    ElMessage.error('只能上传APK文件!')
    return false
  }
  if (!isLt100M) {
    ElMessage.error('APK文件大小不能超过100MB!')
    return false
  }
  return true
}

// 上传成功
const handleUploadSuccess = (response) => {
  if (response.success) {
    form.downloadUrl = response.url
    form.packageSize = response.size
    ElMessage.success('上传成功')
  } else {
    ElMessage.error(response.message || '上传失败')
  }
}

// 上传失败
const handleUploadError = () => {
  ElMessage.error('上传失败，请重试')
}

onMounted(() => {
  loadVersions()
})
</script>

<style scoped>
.app-version-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: #303133;
}

.subtitle {
  margin: 0;
  font-size: 14px;
  color: #909399;
}

.platform-tabs {
  background: white;
  padding: 20px;
  border-radius: 4px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  line-height: 1.5;
}

.upload-demo {
  width: 100%;
}

.market-config-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.market-config-card :deep(.el-card__body) {
  padding-top: 0;
}
</style>
