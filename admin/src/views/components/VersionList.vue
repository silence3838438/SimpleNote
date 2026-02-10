<template>
  <div class="version-list">
    <el-empty v-if="versions.length === 0" description="暂无版本记录" />
    
    <div v-else class="version-cards">
      <el-card 
        v-for="version in versions" 
        :key="version.id" 
        class="version-card"
        :class="{ 'is-force': version.isForce }"
      >
        <div class="card-header">
          <div class="version-info">
            <div class="version-number">
              <span class="version-text">v{{ version.version }}</span>
              <el-tag v-if="version.isForce" type="danger" size="small">强制更新</el-tag>
              <el-tag v-else type="success" size="small">可选更新</el-tag>
            </div>
            <div class="version-meta">
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ version.updateTime }}
              </span>
              <span class="meta-item">
                <el-icon><Document /></el-icon>
                {{ version.packageSize }}
              </span>
            </div>
          </div>
          
          <div class="card-actions">
            <el-switch
              v-model="version.isForce"
              active-text="强制"
              inactive-text="可选"
              @change="$emit('toggle-force', version)"
            />
            <el-button 
              type="primary" 
              size="small" 
              @click="$emit('edit', version)"
              link
            >
              <el-icon><Edit /></el-icon>
              编辑
            </el-button>
            <el-button 
              type="danger" 
              size="small" 
              @click="$emit('delete', version)"
              link
            >
              <el-icon><Delete /></el-icon>
              删除
            </el-button>
          </div>
        </div>

        <div class="card-body">
          <div class="update-content">
            <div class="content-title">更新内容:</div>
            <ul class="content-list">
              <li v-for="(item, index) in version.updateContent" :key="index">
                {{ item }}
              </li>
            </ul>
          </div>

          <div class="download-url">
            <div class="url-label">下载地址:</div>
            <el-input 
              :model-value="version.downloadUrl" 
              readonly
              size="small"
            >
              <template #append>
                <el-button @click="copyUrl(version.downloadUrl)">
                  <el-icon><CopyDocument /></el-icon>
                  复制
                </el-button>
              </template>
            </el-input>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { Calendar, Document, Edit, Delete, CopyDocument } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

defineProps({
  versions: {
    type: Array,
    default: () => []
  },
  platform: {
    type: String,
    required: true
  }
})

defineEmits(['edit', 'delete', 'toggle-force'])

const copyUrl = (url) => {
  navigator.clipboard.writeText(url).then(() => {
    ElMessage.success('已复制到剪贴板')
  }).catch(() => {
    ElMessage.error('复制失败')
  })
}
</script>

<style scoped>
.version-list {
  min-height: 400px;
}

.version-cards {
  display: grid;
  gap: 16px;
}

.version-card {
  transition: all 0.3s;
}

.version-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.version-card.is-force {
  border-left: 4px solid #f56c6c;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.version-info {
  flex: 1;
}

.version-number {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.version-text {
  font-size: 20px;
  font-weight: bold;
  color: #303133;
}

.version-meta {
  display: flex;
  gap: 16px;
  font-size: 14px;
  color: #909399;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.update-content {
  background: #f5f7fa;
  padding: 12px;
  border-radius: 4px;
}

.content-title {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
  margin-bottom: 8px;
}

.content-list {
  margin: 0;
  padding-left: 20px;
}

.content-list li {
  font-size: 14px;
  color: #606266;
  line-height: 1.8;
}

.download-url {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.url-label {
  font-size: 14px;
  font-weight: 500;
  color: #606266;
}
</style>
