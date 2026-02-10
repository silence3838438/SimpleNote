// 管理后台完整应用
const { createApp, ref, reactive, computed, onMounted } = Vue;
const { createRouter, createWebHashHistory } = VueRouter;

// Axios配置
const request = axios.create({
  baseURL: '/api',
  timeout: 10000
});

request.interceptors.request.use(config => {
  const token = localStorage.getItem('admin_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

request.interceptors.response.use(
  response => {
    const res = response.data;
    if (res.success === false) {
      ElementPlus.ElMessage.error(res.message || '请求失败');
      return Promise.reject(new Error(res.message));
    }
    return res;
  },
  error => {
    ElementPlus.ElMessage.error(error.message || '网络错误');
    return Promise.reject(error);
  }
);

// 登录页面
const Login = {
  template: `
    <div style="width:100%;height:100vh;background:linear-gradient(135deg,#52C41A 0%,#73D13D 100%);display:flex;align-items:center;justify-content:center">
      <div style="width:400px;padding:40px;background:white;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,0.15)">
        <div style="text-align:center;margin-bottom:40px">
          <h1 style="font-size:32px;color:#1a1a1a;margin-bottom:8px">💰 钱哪去了</h1>
          <p style="font-size:16px;color:#666">管理后台</p>
        </div>
        <el-form :model="form" :rules="rules" ref="formRef">
          <el-form-item prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" size="large" />
          </el-form-item>
          <el-form-item prop="password">
            <el-input v-model="form.password" type="password" placeholder="请输入密码" 
              size="large" @keyup.enter="handleLogin" />
          </el-form-item>
          <el-button type="primary" size="large" :loading="loading" 
            @click="handleLogin" style="width:100%">登录</el-button>
        </el-form>
      </div>
    </div>
  `,
  setup() {
    const router = VueRouter.useRouter();
    const formRef = ref(null);
    const loading = ref(false);
    const form = reactive({ username: '', password: '' });
    const rules = {
      username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
      password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
    };
    
    const handleLogin = async () => {
      try {
        await formRef.value.validate();
        loading.value = true;
        const res = await request.post('/admin/login', form);
        if (res.success) {
          localStorage.setItem('admin_token', res.token);
          ElementPlus.ElMessage.success('登录成功');
          router.push('/');
        }
      } catch (error) {
        console.error('登录失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    return { form, rules, formRef, loading, handleLogin };
  }
};

// 数据概览
const Dashboard = {
  template: `
    <div>
      <el-row :gutter="20" style="margin-bottom:20px">
        <el-col :span="6">
          <el-card style="cursor:pointer;transition:all 0.3s" @mouseenter="e=>e.currentTarget.style.transform='translateY(-4px)'" @mouseleave="e=>e.currentTarget.style.transform=''">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:60px;height:60px;border-radius:8px;background:#e6f7ff;display:flex;align-items:center;justify-content:center;font-size:32px">👥</div>
              <div>
                <div style="font-size:24px;font-weight:600;color:#1a1a1a">{{stats.totalUsers}}</div>
                <div style="font-size:14px;color:#666">总用户数</div>
                <div style="font-size:12px;color:#52c41a;margin-top:4px">今日+{{stats.todayNew}}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card style="cursor:pointer;transition:all 0.3s" @mouseenter="e=>e.currentTarget.style.transform='translateY(-4px)'" @mouseleave="e=>e.currentTarget.style.transform=''">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:60px;height:60px;border-radius:8px;background:#f0f9ff;display:flex;align-items:center;justify-content:center;font-size:32px">📊</div>
              <div>
                <div style="font-size:24px;font-weight:600;color:#1a1a1a">{{stats.totalBills}}</div>
                <div style="font-size:14px;color:#666">总账单数</div>
                <div style="font-size:12px;color:#1890ff;margin-top:4px">本周+{{stats.weekNew}}人</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card style="cursor:pointer;transition:all 0.3s" @mouseenter="e=>e.currentTarget.style.transform='translateY(-4px)'" @mouseleave="e=>e.currentTarget.style.transform=''">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:60px;height:60px;border-radius:8px;background:#fff0f6;display:flex;align-items:center;justify-content:center;font-size:32px">💰</div>
              <div>
                <div style="font-size:24px;font-weight:600;color:#f5222d">¥{{stats.totalExpense}}</div>
                <div style="font-size:14px;color:#666">总支出</div>
                <div style="font-size:12px;color:#52c41a;margin-top:4px">收入¥{{stats.totalIncome}}</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card style="cursor:pointer;transition:all 0.3s" @mouseenter="e=>e.currentTarget.style.transform='translateY(-4px)'" @mouseleave="e=>e.currentTarget.style.transform=''">
            <div style="display:flex;align-items:center;gap:16px">
              <div style="width:60px;height:60px;border-radius:8px;background:#fff7e6;display:flex;align-items:center;justify-content:center;font-size:32px">📈</div>
              <div>
                <div style="font-size:24px;font-weight:600;color:#1a1a1a">{{stats.todayActive}}</div>
                <div style="font-size:14px;color:#666">今日活跃</div>
                <div style="font-size:12px;color:#faad14;margin-top:4px">本月+{{stats.monthNew}}人</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-bottom:20px">
        <el-col :span="12">
          <el-card>
            <template #header><span>账单数量趋势（最近7天）</span></template>
            <div ref="trendChartRef" style="height:300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header><span>收支对比（最近7天）</span></template>
            <div ref="incomeExpenseChartRef" style="height:300px"></div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :span="12">
          <el-card>
            <template #header><span>用户增长趋势（最近30天）</span></template>
            <div ref="userGrowthChartRef" style="height:300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header><span>支出分类占比（Top10）</span></template>
            <div ref="categoryChartRef" style="height:300px"></div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20" style="margin-top:20px">
        <el-col :span="12">
          <el-card>
            <template #header><span>用户平台分布</span></template>
            <div ref="platformChartRef" style="height:300px"></div>
          </el-card>
        </el-col>
        <el-col :span="12">
          <el-card>
            <template #header><span>用户来源分布</span></template>
            <div ref="sourceChartRef" style="height:300px"></div>
          </el-card>
        </el-col>
      </el-row>
    </div>
  `,
  setup() {
    const stats = ref({ 
      totalUsers: 0, totalBills: 0, todayActive: 0, 
      todayNew: 0, weekNew: 0, monthNew: 0,
      totalIncome: 0, totalExpense: 0 
    });
    const trendChartRef = ref(null);
    const incomeExpenseChartRef = ref(null);
    const userGrowthChartRef = ref(null);
    const categoryChartRef = ref(null);
    const platformChartRef = ref(null);
    const sourceChartRef = ref(null);
    
    const fetchStats = async () => {
      try {
        const res = await request.get('/admin/stats');
        if (res.success) stats.value = res.data;
      } catch (error) {
        console.error('获取统计失败:', error);
      }
    };
    
    const fetchTrend = async () => {
      try {
        const res = await request.get('/admin/stats/trend');
        if (res.success && trendChartRef.value && window.echarts) {
          const chart = echarts.init(trendChartRef.value);
          chart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: res.data.days },
            yAxis: { type: 'value', name: '账单数量' },
            series: [{ 
              name: '账单数量',
              data: res.data.counts, 
              type: 'line', 
              smooth: true, 
              itemStyle: { color: '#52C41A' },
              areaStyle: { color: 'rgba(82, 196, 26, 0.1)' }
            }]
          });
        }
      } catch (error) {
        console.error('获取趋势数据失败:', error);
      }
    };
    
    const fetchIncomeExpense = async () => {
      try {
        const res = await request.get('/admin/stats/income-expense?days=7');
        if (res.success && incomeExpenseChartRef.value && window.echarts) {
          const chart = echarts.init(incomeExpenseChartRef.value);
          const days = res.data.map(item => {
            const date = new Date(item.day);
            return `${date.getMonth()+1}/${date.getDate()}`;
          });
          const income = res.data.map(item => parseFloat(item.income || 0));
          const expense = res.data.map(item => parseFloat(item.expense || 0));
          
          chart.setOption({
            tooltip: { trigger: 'axis' },
            legend: { data: ['收入', '支出'] },
            xAxis: { type: 'category', data: days },
            yAxis: { type: 'value', name: '金额（元）' },
            series: [
              { 
                name: '收入',
                data: income, 
                type: 'bar', 
                itemStyle: { color: '#52c41a' }
              },
              { 
                name: '支出',
                data: expense, 
                type: 'bar', 
                itemStyle: { color: '#f5222d' }
              }
            ]
          });
        }
      } catch (error) {
        console.error('获取收支数据失败:', error);
      }
    };
    
    const fetchUserGrowth = async () => {
      try {
        const res = await request.get('/admin/stats/user-growth?days=30');
        if (res.success && userGrowthChartRef.value && window.echarts) {
          const chart = echarts.init(userGrowthChartRef.value);
          const days = res.data.map(item => {
            const date = new Date(item.day);
            return `${date.getMonth()+1}/${date.getDate()}`;
          });
          const counts = res.data.map(item => item.count);
          
          chart.setOption({
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: days },
            yAxis: { type: 'value', name: '新增用户数' },
            series: [{ 
              name: '新增用户',
              data: counts, 
              type: 'line', 
              smooth: true, 
              itemStyle: { color: '#1890ff' },
              areaStyle: { color: 'rgba(24, 144, 255, 0.1)' }
            }]
          });
        }
      } catch (error) {
        console.error('获取用户增长数据失败:', error);
      }
    };
    
    const fetchCategory = async () => {
      try {
        const res = await request.get('/admin/stats/category');
        if (res.success && categoryChartRef.value && window.echarts) {
          const chart = echarts.init(categoryChartRef.value);
          const data = res.data.map(item => ({
            name: item.category_name,
            value: parseFloat(item.total)
          }));
          
          chart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
            legend: { orient: 'vertical', left: 'left' },
            series: [{
              type: 'pie',
              radius: '60%',
              data: data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          });
        }
      } catch (error) {
        console.error('获取分类数据失败:', error);
      }
    };
    
    const fetchPlatform = async () => {
      try {
        const res = await request.get('/admin/stats/platform');
        if (res.success && platformChartRef.value && window.echarts) {
          const chart = echarts.init(platformChartRef.value);
          const platformNames = {
            'wechat_miniprogram': '📱 微信小程序',
            'android': '🤖 Android',
            'ios': '🍎 iOS',
            'web': '🌐 Web',
            'unknown': '❓ 未知'
          };
          const data = res.data.map(item => ({
            name: platformNames[item.platform] || item.platform,
            value: item.count
          }));
          
          chart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              avoidLabelOverlap: false,
              data: data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          });
        }
      } catch (error) {
        console.error('获取平台数据失败:', error);
      }
    };
    
    const fetchSource = async () => {
      try {
        const res = await request.get('/admin/stats/source');
        if (res.success && sourceChartRef.value && window.echarts) {
          const chart = echarts.init(sourceChartRef.value);
          const sourceNames = {
            'organic': '自然流量',
            'invite': '好友邀请',
            'ad': '广告投放',
            'promotion': '推广活动'
          };
          const data = res.data.map(item => ({
            name: sourceNames[item.source] || item.source,
            value: item.count
          }));
          
          chart.setOption({
            tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
            legend: { orient: 'vertical', right: 10, top: 'center' },
            series: [{
              type: 'pie',
              radius: ['40%', '70%'],
              data: data,
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
              }
            }]
          });
        }
      } catch (error) {
        console.error('获取来源数据失败:', error);
      }
    };
    
    onMounted(() => {
      fetchStats();
      setTimeout(() => {
        fetchTrend();
        fetchIncomeExpense();
        fetchUserGrowth();
        fetchCategory();
        fetchPlatform();
        fetchSource();
      }, 100);
    });
    
    return { stats, trendChartRef, incomeExpenseChartRef, userGrowthChartRef, categoryChartRef, platformChartRef, sourceChartRef };
  }
};

// 用户管理
const Users = {
  template: `
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>用户管理</span>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <el-input v-model="searchForm.nickname" placeholder="搜索昵称" style="width:120px" clearable @clear="fetchUsers" />
            <el-input v-model="searchForm.phone" placeholder="搜索手机号" style="width:130px" clearable @clear="fetchUsers" />
            <el-select v-model="searchForm.platform" placeholder="平台" clearable style="width:130px" @change="fetchUsers">
              <el-option label="📱 微信小程序" value="wechat_miniprogram" />
              <el-option label="🤖 Android" value="android" />
              <el-option label="🍎 iOS" value="ios" />
              <el-option label="🌐 Web" value="web" />
            </el-select>
            <el-select v-model="searchForm.source" placeholder="来源" clearable style="width:120px" @change="fetchUsers">
              <el-option label="自然流量" value="organic" />
              <el-option label="好友邀请" value="invite" />
              <el-option label="广告投放" value="ad" />
              <el-option label="推广活动" value="promotion" />
            </el-select>
            <el-button type="primary" @click="handleSearch">搜索</el-button>
            <el-button @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="userList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="130" />
        <el-table-column label="平台" width="140">
          <template #default="{row}">
            <el-tag v-if="row.platform==='wechat_miniprogram'" type="success" size="small">📱 小程序</el-tag>
            <el-tag v-else-if="row.platform==='android'" type="info" size="small">🤖 Android</el-tag>
            <el-tag v-else-if="row.platform==='ios'" type="warning" size="small">🍎 iOS</el-tag>
            <el-tag v-else-if="row.platform==='web'" type="primary" size="small">🌐 Web</el-tag>
            <el-tag v-else type="info" size="small">❓ 未知</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="来源" width="100">
          <template #default="{row}">
            <span v-if="row.source==='organic'">自然</span>
            <span v-else-if="row.source==='invite'">邀请</span>
            <span v-else-if="row.source==='ad'">广告</span>
            <span v-else-if="row.source==='promotion'">推广</span>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="账单数" width="90">
          <template #default="{row}">{{row.bill_count || 0}}</template>
        </el-table-column>
        <el-table-column label="总支出" width="110">
          <template #default="{row}">
            <span style="color:#f5222d">¥{{parseFloat(row.total_expense || 0).toFixed(2)}}</span>
          </template>
        </el-table-column>
        <el-table-column label="积分" width="80">
          <template #default="{row}">{{row.points || 0}}</template>
        </el-table-column>
        <el-table-column label="注册时间" width="180">
          <template #default="{row}">{{formatDate(row.created_at)}}</template>
        </el-table-column>
        <el-table-column label="操作" width="250" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
            <el-button type="warning" link @click="handleAdjustPoints(row)">调整积分</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" @current-change="fetchUsers" style="margin-top:20px;justify-content:flex-end" />
      
      <!-- 用户详情弹窗 -->
      <el-dialog v-model="detailVisible" title="用户详情" width="800px">
        <div v-if="currentUser">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户ID">{{currentUser.user.id}}</el-descriptions-item>
            <el-descriptions-item label="昵称">{{currentUser.user.nickname}}</el-descriptions-item>
            <el-descriptions-item label="手机号">{{currentUser.user.phone || '-'}}</el-descriptions-item>
            <el-descriptions-item label="注册时间">{{formatDate(currentUser.user.created_at)}}</el-descriptions-item>
            <el-descriptions-item label="账单数">{{currentUser.stats.bill_count}}</el-descriptions-item>
            <el-descriptions-item label="总支出">¥{{parseFloat(currentUser.stats.total_expense).toFixed(2)}}</el-descriptions-item>
            <el-descriptions-item label="总收入">¥{{parseFloat(currentUser.stats.total_income).toFixed(2)}}</el-descriptions-item>
            <el-descriptions-item label="积分">{{currentUser.stats.points}}</el-descriptions-item>
          </el-descriptions>
          <el-divider>最近账单</el-divider>
          <el-table :data="currentUser.recentBills" size="small" max-height="200">
            <el-table-column prop="date" label="日期" width="120" />
            <el-table-column label="金额" width="120">
              <template #default="{row}">
                <span :style="{color:row.type==='expense'?'#f5222d':'#52c41a'}">
                  {{row.type==='expense'?'-':'+'}}¥{{row.amount}}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="category_name" label="分类" width="100" />
            <el-table-column prop="merchant" label="商家" show-overflow-tooltip />
          </el-table>
        </div>
      </el-dialog>
      
      <!-- 调整积分弹窗 -->
      <el-dialog v-model="pointsVisible" title="调整积分" width="400px">
        <el-form :model="pointsForm" label-width="80px">
          <el-form-item label="用户">
            <span>{{pointsForm.nickname}}</span>
          </el-form-item>
          <el-form-item label="积分变动">
            <el-input-number v-model="pointsForm.points" :min="-10000" :max="10000" />
            <div style="font-size:12px;color:#999;margin-top:5px">正数为增加，负数为扣除</div>
          </el-form-item>
          <el-form-item label="原因">
            <el-input v-model="pointsForm.reason" type="textarea" :rows="3" placeholder="请输入调整原因" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="pointsVisible=false">取消</el-button>
          <el-button type="primary" @click="handleConfirmPoints">确定</el-button>
        </template>
      </el-dialog>
    </el-card>
  `,
  setup() {
    const loading = ref(false);
    const userList = ref([]);
    const page = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    const searchForm = reactive({ nickname: '', phone: '', platform: '', source: '' });
    const detailVisible = ref(false);
    const currentUser = ref(null);
    const pointsVisible = ref(false);
    const pointsForm = reactive({ userId: '', nickname: '', points: 0, reason: '' });
    
    const fetchUsers = async () => {
      try {
        loading.value = true;
        const res = await request.get('/admin/users', { 
          params: { 
            page: page.value, 
            pageSize: pageSize.value,
            nickname: searchForm.nickname,
            phone: searchForm.phone,
            platform: searchForm.platform,
            source: searchForm.source
          } 
        });
        if (res.success) {
          userList.value = res.data.list;
          total.value = res.data.total;
        }
      } catch (error) {
        console.error('获取用户失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleSearch = () => {
      page.value = 1;
      fetchUsers();
    };
    
    const handleViewDetail = async (row) => {
      try {
        const res = await request.get(`/admin/users/${row.id}/detail`);
        if (res.success) {
          currentUser.value = res.data;
          detailVisible.value = true;
        }
      } catch (error) {
        console.error('获取用户详情失败:', error);
      }
    };
    
    const handleAdjustPoints = (row) => {
      pointsForm.userId = row.id;
      pointsForm.nickname = row.nickname;
      pointsForm.points = 0;
      pointsForm.reason = '';
      pointsVisible.value = true;
    };
    
    const handleConfirmPoints = async () => {
      if (!pointsForm.points || !pointsForm.reason) {
        ElementPlus.ElMessage.warning('请填写完整信息');
        return;
      }
      try {
        const res = await request.post(`/admin/users/${pointsForm.userId}/points`, {
          points: pointsForm.points,
          reason: pointsForm.reason
        });
        if (res.success) {
          ElementPlus.ElMessage.success('积分调整成功');
          pointsVisible.value = false;
          fetchUsers();
        }
      } catch (error) {
        console.error('调整积分失败:', error);
      }
    };
    
    const handleExport = async () => {
      try {
        const res = await request.get('/admin/users/export');
        if (res.success) {
          const csv = [
            ['ID', '昵称', '手机号', '注册时间', '账单数', '总支出', '积分'].join(','),
            ...res.data.map(u => [
              u.id,
              u.nickname,
              u.phone || '',
              new Date(u.created_at).toLocaleString('zh-CN'),
              u.bill_count,
              u.total_expense,
              u.points
            ].join(','))
          ].join('\n');
          const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `用户数据_${new Date().toLocaleDateString()}.csv`;
          link.click();
          ElementPlus.ElMessage.success('导出成功');
        }
      } catch (error) {
        console.error('导出失败:', error);
      }
    };
    
    const handleDelete = (row) => {
      ElementPlus.ElMessageBox.confirm(`确定删除用户 ${row.nickname}？`, '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await request.delete(`/admin/users/${row.id}`);
          ElementPlus.ElMessage.success('删除成功');
          fetchUsers();
        } catch (error) {
          console.error('删除失败:', error);
        }
      });
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleString('zh-CN');
    };
    
    onMounted(fetchUsers);
    
    return { 
      loading, userList, page, pageSize, total, searchForm,
      detailVisible, currentUser, pointsVisible, pointsForm,
      fetchUsers, handleSearch, handleViewDetail, handleAdjustPoints,
      handleConfirmPoints, handleExport, handleDelete, formatDate
    };
  }
};

// 系统日志
const Logs = {
  template: `
    <el-card>
      <el-table :data="logList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="action" label="操作" width="150" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column prop="ip" label="IP地址" width="150" />
        <el-table-column prop="details" label="详情" show-overflow-tooltip />
        <el-table-column label="时间" width="180">
          <template #default="{row}">{{formatDate(row.create_time)}}</template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" @current-change="fetchLogs" style="margin-top:20px;justify-content:flex-end" />
    </el-card>
  `,
  setup() {
    const loading = ref(false);
    const logList = ref([]);
    const page = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    
    const fetchLogs = async () => {
      try {
        loading.value = true;
        const res = await request.get('/admin/logs', { params: { page: page.value, pageSize: pageSize.value } });
        if (res.success) {
          logList.value = res.data.list;
          total.value = res.data.total;
        }
      } catch (error) {
        console.error('获取日志失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleString('zh-CN');
    };
    
    onMounted(fetchLogs);
    
    return { loading, logList, page, pageSize, total, fetchLogs, formatDate };
  }
};

// 积分管理
const Points = {
  template: `
    <div>
      <el-tabs v-model="activeTab">
        <el-tab-pane label="用户积分" name="users">
          <el-card>
            <template #header>
              <div style="display:flex;justify-content:space-between;align-items:center">
                <span>用户积分列表</span>
                <div style="display:flex;gap:10px">
                  <el-input v-model="searchNickname" placeholder="搜索昵称" style="width:150px" clearable />
                  <el-button type="primary" @click="fetchPointsUsers">搜索</el-button>
                </div>
              </div>
            </template>
            <el-table :data="pointsUserList" v-loading="loading" border>
              <el-table-column prop="id" label="用户ID" width="100" />
              <el-table-column prop="nickname" label="昵称" width="150" />
              <el-table-column prop="phone" label="手机号" width="150" />
              <el-table-column label="当前积分" width="120">
                <template #default="{row}">
                  <span style="color:#faad14;font-weight:bold">{{row.points}}</span>
                </template>
              </el-table-column>
              <el-table-column label="累计获得" width="120">
                <template #default="{row}">{{row.total_earned}}</template>
              </el-table-column>
              <el-table-column label="操作" width="150">
                <template #default="{row}">
                  <el-button type="primary" link @click="handleAdjustPoints(row)">调整积分</el-button>
                </template>
              </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="pointsPage" v-model:page-size="pointsPageSize"
              :total="pointsTotal" @current-change="fetchPointsUsers" style="margin-top:20px;justify-content:flex-end" />
          </el-card>
        </el-tab-pane>
        
        <el-tab-pane label="积分记录" name="history">
          <el-card>
            <el-table :data="historyList" v-loading="historyLoading" border>
              <el-table-column prop="id" label="ID" width="80" />
              <el-table-column prop="nickname" label="用户" width="150" />
              <el-table-column label="积分变动" width="120">
                <template #default="{row}">
                  <span :style="{color:row.points>0?'#52c41a':'#f5222d',fontWeight:'bold'}">
                    {{row.points>0?'+':''}}{{row.points}}
                  </span>
                </template>
              </el-table-column>
              <el-table-column prop="reason" label="原因" show-overflow-tooltip />
              <el-table-column label="时间" width="180">
                <template #default="{row}">{{formatDate(row.create_time)}}</template>
              </el-table-column>
            </el-table>
            <el-pagination v-model:current-page="historyPage" v-model:page-size="historyPageSize"
              :total="historyTotal" @current-change="fetchHistory" style="margin-top:20px;justify-content:flex-end" />
          </el-card>
        </el-tab-pane>
      </el-tabs>
      
      <!-- 调整积分弹窗 -->
      <el-dialog v-model="adjustVisible" title="调整积分" width="400px">
        <el-form :model="adjustForm" label-width="80px">
          <el-form-item label="用户">
            <span>{{adjustForm.nickname}}</span>
          </el-form-item>
          <el-form-item label="积分变动">
            <el-input-number v-model="adjustForm.points" :min="-10000" :max="10000" />
            <div style="font-size:12px;color:#999;margin-top:5px">正数为增加，负数为扣除</div>
          </el-form-item>
          <el-form-item label="原因">
            <el-input v-model="adjustForm.reason" type="textarea" :rows="3" placeholder="请输入调整原因" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="adjustVisible=false">取消</el-button>
          <el-button type="primary" @click="handleConfirmAdjust">确定</el-button>
        </template>
      </el-dialog>
    </div>
  `,
  setup() {
    const activeTab = ref('users');
    const loading = ref(false);
    const historyLoading = ref(false);
    const pointsUserList = ref([]);
    const historyList = ref([]);
    const pointsPage = ref(1);
    const pointsPageSize = ref(10);
    const pointsTotal = ref(0);
    const historyPage = ref(1);
    const historyPageSize = ref(10);
    const historyTotal = ref(0);
    const searchNickname = ref('');
    const adjustVisible = ref(false);
    const adjustForm = reactive({ userId: '', nickname: '', points: 0, reason: '' });
    
    const fetchPointsUsers = async () => {
      try {
        loading.value = true;
        const res = await request.get('/admin/points/users', { 
          params: { 
            page: pointsPage.value, 
            pageSize: pointsPageSize.value,
            nickname: searchNickname.value
          } 
        });
        if (res.success) {
          pointsUserList.value = res.data.list;
          pointsTotal.value = res.data.total;
        }
      } catch (error) {
        console.error('获取积分用户失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const fetchHistory = async () => {
      try {
        historyLoading.value = true;
        const res = await request.get('/admin/points/history', { 
          params: { 
            page: historyPage.value, 
            pageSize: historyPageSize.value
          } 
        });
        if (res.success) {
          historyList.value = res.data.list;
          historyTotal.value = res.data.total;
        }
      } catch (error) {
        console.error('获取积分历史失败:', error);
      } finally {
        historyLoading.value = false;
      }
    };
    
    const handleAdjustPoints = (row) => {
      adjustForm.userId = row.id;
      adjustForm.nickname = row.nickname;
      adjustForm.points = 0;
      adjustForm.reason = '';
      adjustVisible.value = true;
    };
    
    const handleConfirmAdjust = async () => {
      if (!adjustForm.points || !adjustForm.reason) {
        ElementPlus.ElMessage.warning('请填写完整信息');
        return;
      }
      try {
        const res = await request.post('/admin/points/adjust', {
          userId: adjustForm.userId,
          points: adjustForm.points,
          reason: adjustForm.reason
        });
        if (res.success) {
          ElementPlus.ElMessage.success('积分调整成功');
          adjustVisible.value = false;
          fetchPointsUsers();
          fetchHistory();
        }
      } catch (error) {
        console.error('调整积分失败:', error);
      }
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleString('zh-CN');
    };
    
    onMounted(() => {
      fetchPointsUsers();
      fetchHistory();
    });
    
    return { 
      activeTab, loading, historyLoading, pointsUserList, historyList,
      pointsPage, pointsPageSize, pointsTotal,
      historyPage, historyPageSize, historyTotal,
      searchNickname, adjustVisible, adjustForm,
      fetchPointsUsers, fetchHistory, handleAdjustPoints, handleConfirmAdjust, formatDate
    };
  }
};

// 账单管理
const Bills = {
  template: `
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px">
          <span>账单管理</span>
          <div style="display:flex;gap:10px;flex-wrap:wrap">
            <el-date-picker v-model="dateRange" type="daterange" range-separator="至" 
              start-placeholder="开始日期" end-placeholder="结束日期" style="width:240px" />
            <el-select v-model="filterForm.type" placeholder="类型" clearable style="width:100px">
              <el-option label="支出" value="expense" />
              <el-option label="收入" value="income" />
            </el-select>
            <el-input v-model="filterForm.category" placeholder="分类" clearable style="width:120px" />
            <el-button type="primary" @click="handleFilter">筛选</el-button>
            <el-button @click="handleExport">导出</el-button>
          </div>
        </div>
      </template>
      <el-table :data="billList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="user_id" label="用户ID" width="100" />
        <el-table-column label="类型" width="80">
          <template #default="{row}">
            <el-tag :type="row.type==='expense'?'danger':'success'" size="small">
              {{row.type==='expense'?'支出':'收入'}}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{row}">
            <span :style="{color:row.type==='expense'?'#f5222d':'#52c41a'}">
              {{row.type==='expense'?'-':'+'}}¥{{row.amount}}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="category_name" label="分类" width="100" />
        <el-table-column prop="merchant" label="商家" show-overflow-tooltip />
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="创建时间" width="180">
          <template #default="{row}">{{formatDate(row.create_time)}}</template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{row}">
            <el-button type="primary" link @click="handleViewDetail(row)">详情</el-button>
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination v-model:current-page="page" v-model:page-size="pageSize"
        :total="total" @current-change="fetchBills" style="margin-top:20px;justify-content:flex-end" />
      
      <!-- 账单详情弹窗 -->
      <el-dialog v-model="detailVisible" title="账单详情" width="600px">
        <div v-if="currentBill">
          <el-descriptions :column="2" border>
            <el-descriptions-item label="账单ID">{{currentBill.bill.id}}</el-descriptions-item>
            <el-descriptions-item label="用户">
              {{currentBill.user?.nickname || '-'}} (ID: {{currentBill.bill.user_id}})
            </el-descriptions-item>
            <el-descriptions-item label="类型">
              <el-tag :type="currentBill.bill.type==='expense'?'danger':'success'">
                {{currentBill.bill.type==='expense'?'支出':'收入'}}
              </el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="金额">
              <span :style="{color:currentBill.bill.type==='expense'?'#f5222d':'#52c41a',fontSize:'18px',fontWeight:'bold'}">
                {{currentBill.bill.type==='expense'?'-':'+'}}¥{{currentBill.bill.amount}}
              </span>
            </el-descriptions-item>
            <el-descriptions-item label="分类">{{currentBill.bill.category_name || '-'}}</el-descriptions-item>
            <el-descriptions-item label="商家">{{currentBill.bill.merchant || '-'}}</el-descriptions-item>
            <el-descriptions-item label="日期">{{currentBill.bill.date}}</el-descriptions-item>
            <el-descriptions-item label="创建时间">{{formatDate(currentBill.bill.create_time)}}</el-descriptions-item>
            <el-descriptions-item label="备注" :span="2">{{currentBill.bill.note || '-'}}</el-descriptions-item>
          </el-descriptions>
        </div>
      </el-dialog>
    </el-card>
  `,
  setup() {
    const loading = ref(false);
    const billList = ref([]);
    const page = ref(1);
    const pageSize = ref(10);
    const total = ref(0);
    const dateRange = ref([]);
    const filterForm = reactive({ type: '', category: '' });
    const detailVisible = ref(false);
    const currentBill = ref(null);
    
    const fetchBills = async () => {
      try {
        loading.value = true;
        const params = { 
          page: page.value, 
          pageSize: pageSize.value,
          type: filterForm.type,
          category: filterForm.category
        };
        if (dateRange.value && dateRange.value.length === 2) {
          params.startDate = dateRange.value[0].toISOString().split('T')[0];
          params.endDate = dateRange.value[1].toISOString().split('T')[0];
        }
        const res = await request.get('/admin/bills', { params });
        if (res.success) {
          billList.value = res.data.list;
          total.value = res.data.total;
        }
      } catch (error) {
        console.error('获取账单失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleFilter = () => {
      page.value = 1;
      fetchBills();
    };
    
    const handleViewDetail = async (row) => {
      try {
        const res = await request.get(`/admin/bills/${row.id}/detail`);
        if (res.success) {
          currentBill.value = res.data;
          detailVisible.value = true;
        }
      } catch (error) {
        console.error('获取账单详情失败:', error);
      }
    };
    
    const handleExport = async () => {
      try {
        const params = { 
          type: filterForm.type,
          category: filterForm.category
        };
        if (dateRange.value && dateRange.value.length === 2) {
          params.startDate = dateRange.value[0].toISOString().split('T')[0];
          params.endDate = dateRange.value[1].toISOString().split('T')[0];
        }
        const res = await request.get('/admin/bills/export', { params });
        if (res.success) {
          const csv = [
            ['ID', '用户ID', '类型', '金额', '分类', '商家', '日期', '创建时间'].join(','),
            ...res.data.map(b => [
              b.id,
              b.user_id,
              b.type === 'expense' ? '支出' : '收入',
              b.amount,
              b.category_name || '',
              b.merchant || '',
              b.date,
              new Date(b.create_time).toLocaleString('zh-CN')
            ].join(','))
          ].join('\n');
          const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          link.href = URL.createObjectURL(blob);
          link.download = `账单数据_${new Date().toLocaleDateString()}.csv`;
          link.click();
          ElementPlus.ElMessage.success('导出成功');
        }
      } catch (error) {
        console.error('导出失败:', error);
      }
    };
    
    const handleDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确定删除这条账单？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await request.delete(`/admin/bills/${row.id}`);
          ElementPlus.ElMessage.success('删除成功');
          fetchBills();
        } catch (error) {
          console.error('删除失败:', error);
        }
      });
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleString('zh-CN');
    };
    
    onMounted(fetchBills);
    
    return { 
      loading, billList, page, pageSize, total, dateRange, filterForm,
      detailVisible, currentBill,
      fetchBills, handleFilter, handleViewDetail, handleExport, handleDelete, formatDate 
    };
  }
};

// 意见反馈
const Feedback = {
  template: `
    <el-card>
      <template #header>
        <div style="display:flex;justify-content:space-between;align-items:center">
          <span>意见反馈列表</span>
        </div>
      </template>
      <el-table :data="feedbackList" v-loading="loading" border>
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="nickname" label="用户昵称" width="150" />
        <el-table-column prop="phone" label="手机号" width="150" />
        <el-table-column prop="content" label="反馈内容" show-overflow-tooltip min-width="200" />
        <el-table-column label="图片" width="100">
          <template #default="{row}">
            <span v-if="row.images && row.images.length > 0">
              <el-image 
                v-for="(img, idx) in row.images.slice(0, 1)" 
                :key="idx"
                :src="img" 
                :preview-src-list="row.images"
                style="width:40px;height:40px;border-radius:4px;cursor:pointer"
                fit="cover"
              />
              <span v-if="row.images.length > 1" style="margin-left:5px;color:#999;font-size:12px">
                +{{row.images.length - 1}}
              </span>
            </span>
            <span v-else style="color:#999">无</span>
          </template>
        </el-table-column>
        <el-table-column label="提交时间" width="180">
          <template #default="{row}">{{formatDate(row.create_time)}}</template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{row}">
            <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-pagination 
        v-model:current-page="page" 
        v-model:page-size="pageSize"
        :total="total" 
        @current-change="fetchFeedback" 
        style="margin-top:20px;justify-content:flex-end" 
      />
    </el-card>
  `,
  setup() {
    const loading = ref(false);
    const feedbackList = ref([]);
    const page = ref(1);
    const pageSize = ref(20);
    const total = ref(0);
    
    const fetchFeedback = async () => {
      try {
        loading.value = true;
        const res = await request.get('/admin/feedback', { 
          params: { page: page.value, pageSize: pageSize.value } 
        });
        if (res.success) {
          feedbackList.value = res.data.list.map(item => ({
            ...item,
            images: item.images ? JSON.parse(item.images) : []
          }));
          total.value = res.data.total;
        }
      } catch (error) {
        console.error('获取反馈失败:', error);
      } finally {
        loading.value = false;
      }
    };
    
    const handleDelete = (row) => {
      ElementPlus.ElMessageBox.confirm('确定删除这条反馈？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(async () => {
        try {
          await request.delete(`/admin/feedback/${row.id}`);
          ElementPlus.ElMessage.success('删除成功');
          fetchFeedback();
        } catch (error) {
          console.error('删除失败:', error);
        }
      });
    };
    
    const formatDate = (date) => {
      if (!date) return '-';
      return new Date(date).toLocaleString('zh-CN');
    };
    
    onMounted(fetchFeedback);
    
    return { loading, feedbackList, page, pageSize, total, fetchFeedback, handleDelete, formatDate };
  }
};

// 布局组件
const Layout = {
  template: `
    <el-container style="height:100vh">
      <el-aside width="200px" style="background-color:#001529">
        <div style="height:60px;display:flex;align-items:center;justify-content:center;color:white;border-bottom:1px solid rgba(255,255,255,0.1)">
          <h2 style="font-size:18px;font-weight:600">💰 管理后台</h2>
        </div>
        <el-menu :default-active="activeMenu" router background-color="#001529" 
          text-color="#fff" active-text-color="#52C41A">
          <el-menu-item index="/dashboard">📊 数据概览</el-menu-item>
          <el-menu-item index="/users">👥 用户管理</el-menu-item>
          <el-menu-item index="/bills">📋 账单管理</el-menu-item>
          <el-menu-item index="/points">💎 积分管理</el-menu-item>
          <el-menu-item index="/logs">📝 系统日志</el-menu-item>
          <el-menu-item index="/feedback">💬 意见反馈</el-menu-item>
        </el-menu>
      </el-aside>
      <el-container>
        <el-header style="background:white;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;padding:0 24px">
          <div><h3 style="font-size:18px;color:#1a1a1a">{{currentTitle}}</h3></div>
          <el-dropdown @command="handleCommand">
            <span style="cursor:pointer">管理员 ▼</span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="logout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </el-header>
        <el-main style="background:#f0f2f5;padding:24px;overflow-y:auto">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  `,
  setup() {
    const router = VueRouter.useRouter();
    const route = VueRouter.useRoute();
    
    const routes = [
      { path: '/dashboard', title: '数据概览' },
      { path: '/users', title: '用户管理' },
      { path: '/bills', title: '账单管理' },
      { path: '/points', title: '积分管理' },
      { path: '/logs', title: '系统日志' },
      { path: '/feedback', title: '意见反馈' }
    ];
    
    const activeMenu = computed(() => route.path);
    const currentTitle = computed(() => {
      const current = routes.find(r => r.path === route.path);
      return current?.title || '';
    });
    
    const handleCommand = (command) => {
      if (command === 'logout') {
        ElementPlus.ElMessageBox.confirm('确定退出登录？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          localStorage.removeItem('admin_token');
          router.push('/login');
        });
      }
    };
    
    return { activeMenu, currentTitle, handleCommand };
  }
};

// 路由配置
const routes = [
  { path: '/login', component: Login },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard',
    children: [
      { path: '/dashboard', component: Dashboard },
      { path: '/users', component: Users },
      { path: '/bills', component: Bills },
      { path: '/points', component: Points },
      { path: '/logs', component: Logs },
      { path: '/feedback', component: Feedback }
    ]
  }
];

const router = createRouter({
  history: createWebHashHistory(),
  routes
});

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('admin_token');
  if (to.path === '/login') {
    next();
  } else {
    token ? next() : next('/login');
  }
});

// 创建应用
const app = createApp({
  template: '<router-view />'
});

app.use(router);
app.use(ElementPlus);
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}
app.mount('#app');
