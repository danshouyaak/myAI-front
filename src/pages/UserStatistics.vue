<template>
  <div class="statistics-container">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1 class="page-title">使用统计</h1>
      <p class="page-subtitle">查看您的AI助手使用情况和数据分析</p>

    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <el-icon class="is-loading">
        <Loading />
      </el-icon>
      <span>加载统计数据中...</span>
    </div>

    <!-- 统计内容 -->
    <div v-else class="statistics-content">
      <!-- 无数据提示 -->
      <div v-if="isEmptyData" class="empty-data-container">
        <el-empty description="暂无使用数据">
          <template #description>
            <p>您还没有使用过AI助手</p>
            <p>开始与AI对话后，这里将显示您的使用统计</p>
          </template>
          <el-button type="primary" @click="goToNewMessage">开始对话</el-button>
        </el-empty>
      </div>

      <!-- 有数据时显示统计 -->
      <div v-else>
        <!-- 基本统计卡片 -->
        <div class="stats-cards">
          <div :style="{ animationDelay: getCardDelay(0) }" class="stats-card">
            <div class="stats-icon conversations">
              <el-icon>
                <ChatDotRound />
              </el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.basicStats?.totalConversations || 0 }}</div>
              <div class="stats-label">总会话数</div>
            </div>
          </div>

          <div :style="{ animationDelay: getCardDelay(1) }" class="stats-card">
            <div class="stats-icon messages">
              <el-icon>
                <Message />
              </el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.basicStats?.totalMessages || 0 }}</div>
              <div class="stats-label">总消息数</div>
            </div>
          </div>

          <div :style="{ animationDelay: getCardDelay(2) }" class="stats-card">
            <div class="stats-icon tokens">
              <el-icon>
                <Cpu />
              </el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ formatNumber(statistics.basicStats?.totalTokensUsed || 0) }}</div>
              <div class="stats-label">Token使用量</div>
            </div>
          </div>

          <div :style="{ animationDelay: getCardDelay(3) }" class="stats-card">
            <div class="stats-icon days">
              <el-icon>
                <Calendar />
              </el-icon>
            </div>
            <div class="stats-info">
              <div class="stats-number">{{ statistics.basicStats?.activeDays || 0 }}</div>
              <div class="stats-label">活跃天数</div>
            </div>
          </div>
        </div>

        <!-- 图表区域 -->
        <div class="charts-section">
          <!-- AI模型使用分布 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>AI模型使用分布</h3>
              <span class="chart-subtitle">最常用：{{ statistics.basicStats?.mostUsedAiModelName || '暂无' }}</span>
            </div>
            <div class="chart-content">
              <div v-if="!statistics.aiModelUsage || statistics.aiModelUsage.length === 0" class="empty-chart">
                <el-empty description="暂无AI模型使用数据" />
              </div>
              <div v-else ref="aiModelChart" class="chart"></div>
            </div>
          </div>

          <!-- 活跃度趋势 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>活跃度趋势</h3>
              <span class="chart-subtitle">最近30天消息发送趋势</span>
            </div>
            <div class="chart-content">
              <div v-if="!statistics.activityTrend || statistics.activityTrend.length === 0" class="empty-chart">
                <el-empty description="暂无活跃度数据" />
              </div>
              <div v-else ref="activityChart" class="chart"></div>
            </div>
          </div>

          <!-- 时段分布 -->
          <div class="chart-card">
            <div class="chart-header">
              <h3>使用时段分布</h3>
              <span class="chart-subtitle">24小时活跃度分布</span>
            </div>
            <div class="chart-content">
              <div v-if="!statistics.hourlyDistribution || Object.keys(statistics.hourlyDistribution).length === 0"
                   class="empty-chart">
                <el-empty description="暂无时段分布数据" />
              </div>
              <div v-else ref="hourlyChart" class="chart"></div>
            </div>
          </div>
        </div>

        <!-- 详细数据表格 -->
        <div class="table-section">
          <el-card>
            <template #header>
              <h3>AI模型使用详情</h3>
            </template>
            <el-table :data="statistics.aiModelUsage" style="width: 100%">
              <el-table-column label="AI模型" min-width="150">
                <template #default="{ row }">
                  <div class="model-info">
                    <img :src="getAssetsFile(row.aiModelIcon)" class="model-icon" />
                    <span>{{ row.aiModelName }}</span>
                  </div>
                </template>
              </el-table-column>
              <el-table-column label="使用次数" prop="usageCount" width="100" />
              <el-table-column label="消息数" prop="totalMessages" width="100" />
              <el-table-column label="Token数" prop="totalTokens" width="120" />
              <el-table-column label="使用占比" width="120">
                <template #default="{ row }">
                  <el-progress
                    :percentage="row.usagePercentage || 0"
                    :show-text="false"
                    :stroke-width="8"
                  />
                  <span class="percentage-text">{{ formatPercentage(row.usagePercentage || 0) }}</span>
                </template>
              </el-table-column>
            </el-table>
          </el-card>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, nextTick, computed } from 'vue';
import { ElMessage } from 'element-plus';
import {
  Loading,
  ChatDotRound,
  Message,
  Cpu,
  Calendar
} from '@element-plus/icons-vue';
import { useRouter } from 'vue-router';
import * as echarts from 'echarts';
import request from '@/utils/request';
import { getAssetsFile } from '@/utils/pub-use';

// 响应式数据
const loading = ref(true);
const statistics = ref<any>({});
const router = useRouter();

// 图表引用
const aiModelChart = ref<HTMLElement>();
const activityChart = ref<HTMLElement>();
const hourlyChart = ref<HTMLElement>();

// 判断是否为空数据
const isEmptyData = computed(() => {
  const basicStats = statistics.value.basicStats;
  return !basicStats || (
    (basicStats.totalConversations || 0) === 0 &&
    (basicStats.totalMessages || 0) === 0
  );
});

// 获取统计数据
const fetchStatistics = async () => {
  try {
    loading.value = true;
    console.log('📊 获取用户统计数据...');

    const response = await request.get('/user/statistics/my');
    if (response.code === 0) {
      statistics.value = response.data;
      console.log('✅ 统计数据获取成功:', statistics.value);

      // 等待DOM更新后渲染图表
      await nextTick();

      // 再等待一下确保DOM完全渲染
      setTimeout(() => {
        renderCharts();
      }, 100);
    } else {
      throw new Error(response.message || '获取统计数据失败');
    }
  } catch (error) {
    console.error('❌ 获取统计数据失败:', error);
    ElMessage.error('获取统计数据失败');
  } finally {
    loading.value = false;
  }
};


// 格式化数字
const formatNumber = (num: number) => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// 格式化百分比
const formatPercentage = (percentage: number) => {
  return percentage ? percentage.toFixed(1) + '%' : '0%';
};

// 获取统计卡片的动画延迟
const getCardDelay = (index: number) => {
  return `${index * 0.1}s`;
};

// 跳转到新建消息页面
const goToNewMessage = () => {
  router.push('/new-message');
};

// 测试ECharts是否工作
const testECharts = () => {
  console.log('🧪 测试ECharts...');

  if (aiModelChart.value) {
    try {
      const testChart = echarts.init(aiModelChart.value);
      const testOption = {
        title: { text: '测试图表' },
        series: [{
          type: 'pie',
          data: [
            { name: '测试1', value: 10 },
            { name: '测试2', value: 20 }
          ]
        }]
      };
      testChart.setOption(testOption);
      console.log('✅ ECharts测试成功');
    } catch (error) {
      console.error('❌ ECharts测试失败:', error);
    }
  }
};

// 渲染图表
const renderCharts = () => {
  console.log('🎨 开始渲染图表...');
  console.log('📊 统计数据:', statistics.value);

  // 先测试ECharts
  testECharts();

  renderAiModelChart();
  renderActivityChart();
  renderHourlyChart();
};

// 渲染AI模型使用分布图
const renderAiModelChart = () => {
  console.log('🥧 渲染AI模型分布图...');
  console.log('📊 AI模型数据:', statistics.value.aiModelUsage);
  console.log('🎯 图表容器:', aiModelChart.value);

  if (!aiModelChart.value) {
    console.warn('⚠️ AI模型图表容器不存在');
    return;
  }

  // 检查容器尺寸
  const rect = aiModelChart.value.getBoundingClientRect();
  console.log('📏 AI模型图表容器尺寸:', rect);

  if (rect.width === 0 || rect.height === 0) {
    console.warn('⚠️ AI模型图表容器尺寸为0');
    return;
  }

  if (!statistics.value.aiModelUsage || statistics.value.aiModelUsage.length === 0) {
    console.warn('⚠️ AI模型使用数据为空');
    return;
  }

  const chart = echarts.init(aiModelChart.value);
  const data = statistics.value.aiModelUsage.map((item: any) => ({
    name: item.aiModelName,
    value: item.usageCount
  }));

  console.log('📈 AI模型图表数据:', data);

  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} 次 ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'center'
    },
    series: [{
      name: 'AI模型使用',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      data: data,
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      },
      label: {
        show: true,
        formatter: '{b}: {d}%'
      }
    }]
  };

  chart.setOption(option);
  console.log('✅ AI模型分布图渲染完成');

  // 响应式处理
  window.addEventListener('resize', () => {
    chart.resize();
  });
};

// 渲染活跃度趋势图
const renderActivityChart = () => {
  console.log('📈 渲染活跃度趋势图...');
  console.log('📊 活跃度数据:', statistics.value.activityTrend);

  if (!activityChart.value) {
    console.warn('⚠️ 活跃度图表容器不存在');
    return;
  }

  if (!statistics.value.activityTrend || statistics.value.activityTrend.length === 0) {
    console.warn('⚠️ 活跃度趋势数据为空');
    return;
  }

  const chart = echarts.init(activityChart.value);
  const dates = statistics.value.activityTrend.map((item: any) => {
    // 格式化日期显示
    const date = new Date(item.date);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
  const messages = statistics.value.activityTrend.map((item: any) => item.messageCount || 0);
  const conversations = statistics.value.activityTrend.map((item: any) => item.conversationCount || 0);

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross'
      }
    },
    legend: {
      data: ['消息数', '会话数']
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: dates,
      axisLabel: {
        rotate: 45
      }
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '消息数',
        type: 'line',
        data: messages,
        smooth: true,
        areaStyle: {
          opacity: 0.3
        },
        itemStyle: {
          color: '#409EFF'
        }
      },
      {
        name: '会话数',
        type: 'line',
        data: conversations,
        smooth: true,
        itemStyle: {
          color: '#67C23A'
        }
      }
    ]
  };

  chart.setOption(option);

  // 响应式处理
  window.addEventListener('resize', () => {
    chart.resize();
  });
};

// 渲染时段分布图
const renderHourlyChart = () => {
  console.log('⏰ 渲染时段分布图...');
  console.log('📊 时段分布数据:', statistics.value.hourlyDistribution);

  if (!hourlyChart.value) {
    console.warn('⚠️ 时段分布图表容器不存在');
    return;
  }

  if (!statistics.value.hourlyDistribution) {
    console.warn('⚠️ 时段分布数据为空');
    return;
  }

  const chart = echarts.init(hourlyChart.value);
  const hours = Array.from({ length: 24 }, (_, i) => {
    if (i === 0) return '00:00';
    if (i < 10) return `0${i}:00`;
    return `${i}:00`;
  });
  const data = Array.from({ length: 24 }, (_, i) => statistics.value.hourlyDistribution[i] || 0);

  // 找出最活跃的时段
  const maxValue = Math.max(...data);

  const option = {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        const hour = params[0].axisValue;
        const value = params[0].value;
        return `${hour}<br/>消息数: ${value}`;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: hours,
      axisLabel: {
        interval: 1,
        rotate: 45
      }
    },
    yAxis: {
      type: 'value',
      name: '消息数'
    },
    series: [{
      name: '消息数',
      type: 'bar',
      data: data,
      itemStyle: {
        color: (params: any) => {
          // 最活跃时段使用不同颜色
          return params.value === maxValue ? '#F56C6C' : '#409EFF';
        }
      },
      markPoint: {
        data: [
          {
            type: 'max',
            name: '最大值',
            itemStyle: {
              color: '#F56C6C'
            }
          }
        ]
      }
    }]
  };

  chart.setOption(option);

  // 响应式处理
  window.addEventListener('resize', () => {
    chart.resize();
  });
};

// 组件挂载
onMounted(() => {
  console.log('📊 UserStatistics组件已挂载');
  fetchStatistics();
});
</script>

<style scoped>
.statistics-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: calc(100vh - 60px);
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.page-title {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.page-subtitle {
  margin: 4px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
  background: white;
  border-radius: 8px;
  gap: 12px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stats-card {
  display: flex;
  align-items: center;
  padding: 24px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  animation: slideInUp 0.6s ease-out forwards;
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.3s ease;
}

.stats-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

@keyframes slideInUp {
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.stats-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stats-icon.conversations {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stats-icon.messages {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stats-icon.tokens {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stats-icon.days {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stats-number {
  font-size: 28px;
  font-weight: 600;
  color: #303133;
  line-height: 1;
}

.stats-label {
  font-size: 14px;
  color: #909399;
  margin-top: 4px;
}

.charts-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 24px;
  margin-bottom: 24px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.chart-header {
  padding: 20px 24px;
  border-bottom: 1px solid #ebeef5;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart-subtitle {
  font-size: 12px;
  color: #909399;
}

.chart {
  height: 300px;
  width: 100%;
}

.empty-chart {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.table-section {
  margin-top: 24px;
}

.model-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-icon {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.percentage-text {
  margin-left: 8px;
  font-size: 12px;
  color: #909399;
}

.empty-data-container {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
