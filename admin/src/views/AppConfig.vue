<template>
  <div class="app-config-container">
    <el-card class="header-card">
      <div class="header">
        <h2>配置管理</h2>
        <el-button type="primary" @click="showAddDialog">
          <el-icon><Plus /></el-icon>
          添加配置
        </el-button>
      </div>
    </el-card>

    <el-card class="table-card">
      <el-table :data="configList" v-loading="loading" stripe>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="config_key" label="配置键" width="200" />
        <el-table-column label="配置值" width="150">
          <template #default="{ row }">
            <el-tag v-if="row.config_type === 'boolean'" :type="row.config_value === 'true' ? 'success' : 'danger'">
              {{ row.config_value === 'true' ? '开启' : '关闭' }}
            </el-tag>
            <span v-else>{{ row.config_value }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="config_type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.config_type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="updated_at" label="更新时间" width="180" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" size="small" @click="editConfig(row)">编辑</el-button>
            <el-button type="danger" size="small" @click="deleteConfig(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <el-dialog 
      v-model="dialogVisible" 
      :title="dialogTitle"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item label="配置键">
          <el-input v-model="formData.config_key" :disabled="isEdit" placeholder="例如: show_ai_advisor" />
        </el-form-item>
        <el-form-item label="配置类型">
          <el-select v-model="formData.config_type" :disabled="isEdit">
            <el-option label="布尔值" value="boolean" />
            <el-option label="字符串" value="string" />
            <el-option label="数字" value="number" />
            <el-option label="JSON" value="json" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置值">
          <el-switch 
            v-if="formData.config_type === 'boolean'"
            v-model="booleanValue"
            active-text="开启"
            inactive-text="关闭"
          />
          <el-input-number 
            v-else-if="formData.config_type === 'number'"
            v-model="formData.config_value"
            style="width: 100%"
          />
          <el-input 
            v-else
            v-model="formData.config_value"
            :type="formData.config_type === 'json' ? 'textarea' : 'text'"
            :rows="4"
            placeholder="请输入配置值"
          />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="formData.description" type="textarea" :rows="3" placeholder="请输入配置描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveConfig">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus } from '@element-plus/icons-vue'
import request from '../utils/request'

const loading = ref(false)
const configList = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const formData = ref({
  id: null,
  config_key: '',
  config_value: '',
  config_type: 'string',
  description: ''
})

const dialogTitle = computed(() => isEdit.value ? '编辑配置' : '添加配置')

const booleanValue = computed({
  get: () => formData.value.config_value === 'true',
  set: (val) => {
    formData.value.config_value = val ? 'true' : 'false'
  }
})

const fetchConfigList = async () => {
  loading.value = true
  try {
    const res = await request.get('/config/admin/list')
    if (res.success) {
      configList.value = res.data
    }
  } catch (error) {
    ElMessage.error('获取配置列表失败')
  } finally {
    loading.value = false
  }
}

const showAddDialog = () => {
  isEdit.value = false
  formData.value = {
    id: null,
    config_key: '',
    config_value: '',
    config_type: 'string',
    description: ''
  }
  dialogVisible.value = true
}

const editConfig = (row) => {
  isEdit.value = true
  formData.value = { ...row }
  dialogVisible.value = true
}

const saveConfig = async () => {
  try {
    if (isEdit.value) {
      const res = await request.put(`/config/admin/${formData.value.id}`, {
        config_value: formData.value.config_value,
        description: formData.value.description
      })
      if (res.success) {
        ElMessage.success('配置更新成功')
        dialogVisible.value = false
        fetchConfigList()
      }
    } else {
      const res = await request.post('/config/admin', formData.value)
      if (res.success) {
        ElMessage.success('配置添加成功')
        dialogVisible.value = false
        fetchConfigList()
      }
    }
  } catch (error) {
    ElMessage.error(error.message || '操作失败')
  }
}

const deleteConfig = async (row) => {
  try {
    await ElMessageBox.confirm('确定要删除这个配置吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    const res = await request.delete(`/config/admin/${row.id}`)
    if (res.success) {
      ElMessage.success('删除成功')
      fetchConfigList()
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => {
  fetchConfigList()
})
</script>

<style scoped>
.app-config-container {
  padding: 20px;
}

.header-card {
  margin-bottom: 20px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header h2 {
  margin: 0;
  font-size: 20px;
  color: #303133;
}

.table-card {
  min-height: 400px;
}
</style>
