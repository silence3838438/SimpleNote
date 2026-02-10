<template>
  <div class="bills-page">
    <el-card>
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户ID">
          <el-input v-model="searchForm.userId" placeholder="请输入用户ID" clearable />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="searchForm.category" placeholder="请选择分类" clearable>
            <el-option label="餐饮" value="餐饮" />
            <el-option label="交通" value="交通" />
            <el-option label="购物" value="购物" />
            <el-option label="娱乐" value="娱乐" />
          </el-select>
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 账单列表 -->
      <el-table :data="billList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="amount" label="金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'expense' ? '#f5222d' : '#52c41a' }">
              {{ row.type === 'expense' ? '-' : '+' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="category" label="分类" width="100" />
        <el-table-column prop="merchant" label="商家" show-overflow-tooltip />
        <el-table-column prop="note" label="备注" show-overflow-tooltip />
        <el-table-column label="记账方式" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.input_method === 'voice'" type="success">语音</el-tag>
            <el-tag v-else-if="row.input_method === 'photo'" type="warning">拍照</el-tag>
            <el-tag v-else>手动</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
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
        @size-change="fetchBills"
        @current-change="fetchBills"
        class="pagination"
      />
    </el-card>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const billList = ref([])

const searchForm = reactive({
  userId: '',
  category: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchBills = async () => {
  try {
    loading.value = true
    const res = await request.get('/admin/bills', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...searchForm
      }
    })
    
    if (res.success) {
      billList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取账单列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchBills()
}

const handleReset = () => {
  searchForm.userId = ''
  searchForm.category = ''
  handleSearch()
}

const handleDelete = (row) => {
  ElMessageBox.confirm('确定要删除这条账单吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/admin/bills/${row.id}`)
      if (res.success) {
        ElMessage.success('删除成功')
        fetchBills()
      }
    } catch (error) {
      console.error('删除失败:', error)
    }
  })
}

const formatDate = (date) => {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchBills()
})
</script>

<style scoped>
.bills-page {
  width: 100%;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}
</style>
