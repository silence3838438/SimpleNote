<template>
  <div class="feedback-container">
    <h2>意见反馈管理</h2>
    
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ total }}</div>
        <div class="stat-label">总反馈数</div>
      </div>
    </div>
    
    <!-- 反馈列表 -->
    <div class="feedback-list">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="feedbackList.length === 0" class="empty">暂无反馈</div>
      <div v-else>
        <div v-for="item in feedbackList" :key="item.id" class="feedback-item">
          <div class="feedback-header">
            <span class="feedback-id">#{{ item.id }}</span>
            <span class="feedback-time">{{ formatTime(item.created_at) }}</span>
          </div>
          <div class="feedback-content">{{ item.content }}</div>
          <div v-if="item.images && item.images.length > 0" class="feedback-images">
            <img v-for="(img, index) in item.images" :key="index" :src="img" class="feedback-image" />
          </div>
          <div class="feedback-footer">
            <span v-if="item.user_info" class="user-info">
              用户：{{ item.user_info.nickname || item.user_info.phone || '匿名' }}
            </span>
            <span v-else class="user-info">匿名反馈</span>
            <button @click="deleteFeedback(item.id)" class="delete-btn">删除</button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 分页 -->
    <div class="pagination" v-if="total > pageSize">
      <button @click="prevPage" :disabled="currentPage === 1">上一页</button>
      <span>第 {{ currentPage }} / {{ totalPages }} 页</span>
      <button @click="nextPage" :disabled="currentPage === totalPages">下一页</button>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'Feedback',
  data() {
    return {
      feedbackList: [],
      loading: false,
      currentPage: 1,
      pageSize: 20,
      total: 0
    };
  },
  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize);
    }
  },
  mounted() {
    this.loadFeedback();
  },
  methods: {
    async loadFeedback() {
      this.loading = true;
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.get(`/api/admin/feedback?page=${this.currentPage}&pageSize=${this.pageSize}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          this.feedbackList = response.data.data;
          this.total = response.data.total;
        } else {
          alert('加载失败：' + response.data.message);
        }
      } catch (error) {
        console.error('加载反馈失败:', error);
        alert('加载失败');
      } finally {
        this.loading = false;
      }
    },
    async deleteFeedback(id) {
      if (!confirm('确定要删除这条反馈吗？')) return;
      
      try {
        const token = localStorage.getItem('adminToken');
        const response = await axios.delete(`/api/admin/feedback/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          alert('删除成功');
          this.loadFeedback();
        } else {
          alert('删除失败：' + response.data.message);
        }
      } catch (error) {
        console.error('删除反馈失败:', error);
        alert('删除失败');
      }
    },
    formatTime(time) {
      const date = new Date(time);
      return date.toLocaleString('zh-CN');
    },
    prevPage() {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.loadFeedback();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages) {
        this.currentPage++;
        this.loadFeedback();
      }
    }
  }
};
</script>

<style scoped>
.feedback-container {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
  color: #333;
}

.stats-cards {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
  border-radius: 12px;
  color: white;
  min-width: 150px;
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.9;
}

.feedback-list {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.loading, .empty {
  text-align: center;
  padding: 40px;
  color: #999;
}

.feedback-item {
  border: 1px solid #e8e8e8;
  border-radius: 8px;
  padding: 15px;
  margin-bottom: 15px;
  transition: all 0.3s;
}

.feedback-item:hover {
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.feedback-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 12px;
  color: #999;
}

.feedback-id {
  font-weight: bold;
  color: #667eea;
}

.feedback-content {
  font-size: 14px;
  line-height: 1.6;
  color: #333;
  margin-bottom: 10px;
  white-space: pre-wrap;
}

.feedback-images {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.feedback-image {
  width: 100px;
  height: 100px;
  object-fit: cover;
  border-radius: 8px;
  cursor: pointer;
}

.feedback-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid #f0f0f0;
}

.user-info {
  font-size: 12px;
  color: #666;
}

.delete-btn {
  padding: 5px 15px;
  background: #ff4d4f;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.delete-btn:hover {
  background: #ff7875;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;
  margin-top: 20px;
}

.pagination button {
  padding: 8px 16px;
  background: #52C41A;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #d9d9d9;
  cursor: not-allowed;
}

.pagination button:not(:disabled):hover {
  background: #73d13d;
}
</style>
