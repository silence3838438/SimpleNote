<template>
  <div class="logs-page">
    <el-card>
      <el-table :data="logList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="级别" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.level === 'error'" type="danger">错误</el-tag>
            <el-tag v-else-if="row.level === 'warn'" type="warning">警告</el-tag>
            <el-tag v-else type="info">信息</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="message" label="消息" show-overflow-tooltip />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <el-pagination
        v-model:current-page="pagination.page"
        v-model:page-size="pagination.pageSize"
        :total="pagination.total"
        :page-sizes="[10, 20, 50, 100]"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchLogs"
        @current-change="fetchLogs"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import request from '@/utils/request'

const loading = ref(false)
const logList = ref([])

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchLogs = async () => {
  try {
    loading.value = true
    const res = await request.get('/admin/logs', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize
      }
    })
    
    if (res.success) {
      logList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取日志失败:', error)
  } finally {
    loading.value = false
  }
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchLogs()
})
</script>

<style scoped>
.logs-page {
  width: 100%;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
