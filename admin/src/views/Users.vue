<template>
  <div class="users-page">
    <el-card>
      <!-- 搜索栏 -->
      <el-form :inline="true" :model="searchForm" class="search-form">
        <el-form-item label="用户昵称">
          <el-input v-model="searchForm.nickname" placeholder="请输入用户昵称" clearable />
        </el-form-item>
        <el-form-item label="手机号">
          <el-input v-model="searchForm.phone" placeholder="请输入手机号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>
      
      <!-- 用户列表 -->
      <el-table :data="userList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column label="头像" width="80">
          <template #default="{ row }">
            <el-avatar :src="row.avatar_url" />
          </template>
        </el-table-column>
        <el-table-column prop="nickname" label="昵称" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="openid" label="OpenID" show-overflow-tooltip />
        <el-table-column label="注册时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.created_at) }}
          </template>
        </el-table-column>
        <el-table-column label="最后登录" width="180">
          <template #default="{ row }">
            {{ formatDate(row.last_login) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link @click="viewDetail(row)">详情</el-button>
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
        @size-change="fetchUsers"
        @current-change="fetchUsers"
        class="pagination"
      />
    </el-card>
    
    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="detailDialogVisible"
      title="用户详情"
      width="900px"
      :close-on-click-modal="false"
      class="user-detail-dialog"
    >
      <div v-if="currentUserDetail" class="user-detail-content">
        <!-- 用户头部卡片 -->
        <div class="user-header-card">
          <div class="user-avatar">
            <el-avatar :size="64" :src="currentUserDetail.user.avatar_url">
              <el-icon :size="32"><User /></el-icon>
            </el-avatar>
          </div>
          <div class="user-info">
            <div class="user-name">{{ currentUserDetail.user.nickname || '未设置昵称' }}</div>
            <div class="user-meta">
              <span class="meta-item">
                <el-icon><Iphone /></el-icon>
                {{ currentUserDetail.user.phone || '未绑定' }}
              </span>
              <span class="meta-item">
                <el-icon><Calendar /></el-icon>
                {{ formatDate(currentUserDetail.user.created_at) }}
              </span>
            </div>
          </div>
        </div>
        
        <!-- 统计数据卡片 -->
        <div class="stats-cards">
          <div class="stat-card expense">
            <div class="stat-icon">
              <el-icon><TrendCharts /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总支出</div>
              <div class="stat-value">¥{{ currentUserDetail.stats.total_expense }}</div>
            </div>
          </div>
          <div class="stat-card income">
            <div class="stat-icon">
              <el-icon><Money /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">总收入</div>
              <div class="stat-value">¥{{ currentUserDetail.stats.total_income }}</div>
            </div>
          </div>
          <div class="stat-card bills">
            <div class="stat-icon">
              <el-icon><Tickets /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">账单数</div>
              <div class="stat-value">{{ currentUserDetail.stats.bill_count }}笔</div>
            </div>
          </div>
          <div class="stat-card points">
            <div class="stat-icon">
              <el-icon><Star /></el-icon>
            </div>
            <div class="stat-content">
              <div class="stat-label">积分</div>
              <div class="stat-value">{{ currentUserDetail.stats.points }}</div>
            </div>
          </div>
        </div>
        
        <!-- 详细信息卡片 -->
        <div class="info-card">
          <div class="card-title">详细信息</div>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">用户ID</span>
              <span class="value">{{ currentUserDetail.user.id }}</span>
            </div>
            <div class="info-item">
              <span class="label">OpenID</span>
              <span class="value text-ellipsis">{{ currentUserDetail.user.openid || '-' }}</span>
            </div>
            <div class="info-item">
              <span class="label">最后登录</span>
              <span class="value">{{ formatDate(currentUserDetail.user.last_login) }}</span>
            </div>
          </div>
        </div>
        
        <!-- 最近账单卡片 -->
        <div class="bills-card">
          <div class="card-title">最近账单</div>
          <div v-if="currentUserDetail.recentBills.length > 0" class="bills-list">
            <div 
              v-for="bill in currentUserDetail.recentBills.slice(0, 8)" 
              :key="bill.id"
              class="bill-item"
            >
              <div class="bill-left">
                <div class="bill-merchant">{{ bill.merchant || '未知商家' }}</div>
                <div class="bill-meta">
                  <span>{{ bill.date }}</span>
                  <span class="divider">·</span>
                  <span>{{ bill.category_name || '其他' }}</span>
                </div>
              </div>
              <div class="bill-right">
                <div :class="['bill-amount', bill.type]">
                  {{ bill.type === 'expense' ? '-' : '+' }}¥{{ bill.amount }}
                </div>
              </div>
            </div>
          </div>
          <el-empty v-else description="暂无账单记录" :image-size="60" />
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const userList = ref([])

const searchForm = reactive({
  nickname: '',
  phone: ''
})

const pagination = reactive({
  page: 1,
  pageSize: 10,
  total: 0
})

const fetchUsers = async () => {
  try {
    loading.value = true
    const res = await request.get('/admin/users', {
      params: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        ...searchForm
      }
    })
    
    if (res.success) {
      userList.value = res.data.list
      pagination.total = res.data.total
    }
  } catch (error) {
    console.error('获取用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  pagination.page = 1
  fetchUsers()
}

const handleReset = () => {
  searchForm.nickname = ''
  searchForm.phone = ''
  handleSearch()
}

const detailDialogVisible = ref(false)
const currentUserDetail = ref(null)

const viewDetail = async (row) => {
  try {
    const res = await request.get(`/admin/users/${row.id}/detail`)
    if (res.success) {
      currentUserDetail.value = res.data
      detailDialogVisible.value = true
    }
  } catch (error) {
    console.error('获取用户详情失败:', error)
    ElMessage.error('获取用户详情失败')
  }
}

const handleDelete = (row) => {
  ElMessageBox.confirm(`确定要删除用户 ${row.nickname} 吗？`, '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    try {
      const res = await request.delete(`/admin/users/${row.id}`)
      if (res.success) {
        ElMessage.success('删除成功')
        fetchUsers()
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
  fetchUsers()
})
</script>

<style scoped>
.users-page {
  width: 100%;
}

.search-form {
  margin-bottom: 20px;
}

.pagination {
  margin-top: 20px;
  justify-content: flex-end;
}

/* 对话框样式 */
.user-detail-dialog :deep(.el-dialog__body) {
  padding: 20px 24px;
  max-height: 70vh;
  overflow-y: auto;
}

.user-detail-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* 用户头部卡片 */
.user-header-card {
  display: flex;
  align-items: center;
  gap: 20px;
  padding: 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.user-avatar {
  flex-shrink: 0;
}

.user-avatar :deep(.el-avatar) {
  border: 3px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 22px;
  font-weight: 600;
  margin-bottom: 8px;
}

.user-meta {
  display: flex;
  gap: 20px;
  font-size: 14px;
  opacity: 0.95;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
}

/* 统计卡片 */
.stats-cards {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 12px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 10px;
  background: white;
  border: 1px solid #f0f0f0;
  transition: all 0.3s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
}

.stat-card .stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.stat-card.expense .stat-icon {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
  color: white;
}

.stat-card.income .stat-icon {
  background: linear-gradient(135deg, #51cf66 0%, #37b24d 100%);
  color: white;
}

.stat-card.bills .stat-icon {
  background: linear-gradient(135deg, #ffd43b 0%, #fab005 100%);
  color: white;
}

.stat-card.points .stat-icon {
  background: linear-gradient(135deg, #4dabf7 0%, #228be6 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-label {
  font-size: 13px;
  color: #868e96;
  margin-bottom: 4px;
}

.stat-value {
  font-size: 20px;
  font-weight: 700;
  color: #212529;
}

/* 详细信息卡片 */
.info-card {
  padding: 20px;
  background: white;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #212529;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 2px solid #f1f3f5;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.info-item .label {
  font-size: 12px;
  color: #868e96;
}

.info-item .value {
  font-size: 14px;
  color: #212529;
  font-weight: 500;
}

.text-ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 账单卡片 */
.bills-card {
  padding: 20px;
  background: white;
  border-radius: 10px;
  border: 1px solid #f0f0f0;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.bills-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.bill-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #f8f9fa;
  border-radius: 8px;
  border: 1px solid transparent;
  transition: all 0.2s;
}

.bill-item:hover {
  background: #f1f3f5;
  border-color: #dee2e6;
}

.bill-left {
  flex: 1;
}

.bill-merchant {
  font-size: 14px;
  font-weight: 500;
  color: #212529;
  margin-bottom: 4px;
}

.bill-meta {
  font-size: 12px;
  color: #868e96;
}

.bill-meta .divider {
  margin: 0 6px;
}

.bill-right {
  margin-left: 16px;
}

.bill-amount {
  font-size: 16px;
  font-weight: 700;
}

.bill-amount.expense {
  color: #ff6b6b;
}

.bill-amount.income {
  color: #51cf66;
}
</style>
