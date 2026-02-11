<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #e6f7ff;">
              <el-icon color="#1890ff" :size="32"><User /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalUsers }}</div>
              <div class="stat-label">总用户数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #f0f9ff;">
              <el-icon color="#52c41a" :size="32"><Tickets /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.totalBills }}</div>
              <div class="stat-label">总账单数</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fff7e6;">
              <el-icon color="#faad14" :size="32"><TrendCharts /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">{{ stats.todayActive }}</div>
              <div class="stat-label">今日活跃</div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="6">
        <el-card class="stat-card">
          <div class="stat-content">
            <div class="stat-icon" style="background: #fff0f6;">
              <el-icon color="#eb2f96" :size="32"><Money /></el-icon>
            </div>
            <div class="stat-info">
              <div class="stat-value">¥{{ stats.totalAmount }}</div>
              <div class="stat-label">总记账金额</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
    
    <!-- 图表区域 -->
    <el-row :gutter="20" class="charts-row">
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>用户增长趋势</span>
          </template>
          <div ref="userChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
      
      <el-col :span="12">
        <el-card>
          <template #header>
            <span>账单分类统计</span>
          </template>
          <div ref="billChartRef" style="height: 300px;"></div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import * as echarts from 'echarts'
import request from '@/utils/request'

const stats = ref({
  totalUsers: 0,
  totalBills: 0,
  todayActive: 0,
  totalAmount: 0
})

const userChartRef = ref(null)
const billChartRef = ref(null)
let userChart = null
let billChart = null

const fetchStats = async () => {
  try {
    const res = await request.get('/admin/stats')
    if (res.success) {
      const data = res.data
      stats.value = {
        totalUsers: data.totalUsers,
        totalBills: data.totalBills,
        todayActive: data.todayActive,
        totalAmount: (parseFloat(data.totalExpense) + parseFloat(data.totalIncome)).toFixed(2)
      }
    }
  } catch (error) {
    console.error('获取统计数据失败:', error)
  }
}

const fetchUserGrowth = async () => {
  try {
    const res = await request.get('/admin/stats/trend')
    if (res.success && res.data) {
      const { days, counts } = res.data
      initUserChart(days, counts)
    }
  } catch (error) {
    console.error('获取用户增长趋势失败:', error)
    // 使用默认数据
    initUserChart(['周一', '周二', '周三', '周四', '周五', '周六', '周日'], [0, 0, 0, 0, 0, 0, 0])
  }
}

const fetchCategoryStats = async () => {
  try {
    const res = await request.get('/admin/stats/category')
    if (res.success && res.data) {
      const data = res.data.map(item => ({
        value: parseFloat(item.total),
        name: item.category_name
      }))
      initBillChart(data)
    }
  } catch (error) {
    console.error('获取分类统计失败:', error)
    // 使用默认数据
    initBillChart([])
  }
}

const initUserChart = (days, counts) => {
  if (!userChartRef.value) return
  
  if (!userChart) {
    userChart = echarts.init(userChartRef.value)
  }
  
  userChart.setOption({
    tooltip: { 
      trigger: 'axis',
      formatter: '{b}: {c}笔账单'
    },
    xAxis: {
      type: 'category',
      data: days
    },
    yAxis: { 
      type: 'value',
      minInterval: 1
    },
    series: [{
      data: counts,
      type: 'line',
      smooth: true,
      itemStyle: { color: '#52c41a' },
      areaStyle: {
        color: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [{
            offset: 0, color: 'rgba(82, 196, 26, 0.3)'
          }, {
            offset: 1, color: 'rgba(82, 196, 26, 0.05)'
          }]
        }
      }
    }]
  })
}

const initBillChart = (data) => {
  if (!billChartRef.value) return
  
  if (!billChart) {
    billChart = echarts.init(billChartRef.value)
  }
  
  if (data.length === 0) {
    billChart.setOption({
      title: {
        text: '暂无数据',
        left: 'center',
        top: 'center',
        textStyle: {
          color: '#999',
          fontSize: 14
        }
      }
    })
    return
  }
  
  billChart.setOption({
    tooltip: { 
      trigger: 'item',
      formatter: '{b}: ¥{c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      right: 10,
      top: 'center'
    },
    series: [{
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['40%', '50%'],
      data: data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  })
}

onMounted(() => {
  fetchStats()
  fetchUserGrowth()
  fetchCategoryStats()
})
</script>

<style scoped>
.dashboard {
  width: 100%;
}

.stats-row {
  margin-bottom: 20px;
}

.stat-card {
  cursor: pointer;
  transition: all 0.3s;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.stat-content {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #666;
}

.charts-row {
  margin-top: 20px;
}
</style>
