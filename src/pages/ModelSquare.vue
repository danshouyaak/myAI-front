<template>
  <div class="model-square-container">
    <!-- 分类导航 -->
    <div class="category-nav">
      <el-menu
        :default-active="activeCategory"
        mode="horizontal"
        @select="handleCategorySelect"
      >
        <el-menu-item
          v-for="category in categories"
          :key="category.categoryKey"
          :index="category.categoryKey"
        >
          {{ category.categoryName }}
        </el-menu-item>
      </el-menu>
    </div>

    <!-- 模型列表 -->
    <div class="models-section">
      <h2 class="section-title">{{ getCategoryTitle() }}</h2>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span>加载中...</span>
      </div>

      <!-- 模型网格 -->
      <div v-else class="model-grid">
        <div
          v-for="model in currentModels"
          :key="model.id"
          class="model-card"
          @click="handleModelSelect(model)"
        >
          <div class="model-icon">
            <img :alt="model.name" :src="getAssetsFile(model.icon)" />
          </div>
          <div class="model-info">
            <h3 class="model-name">
              {{ model.name }}
              <el-tag v-if="model.isOfficial" size="small" type="primary">官方</el-tag>
            </h3>
            <p class="model-desc">{{ model.description }}</p>
            <div class="model-meta">
              <span class="model-source">来自 {{ model.source }}</span>
              <span class="model-usage">使用 {{ model.usageCount || 0 }} 次</span>
            </div>
            <div v-if="model.tagList && model.tagList.length > 0" class="model-tags">
              <el-tag
                v-for="tag in model.tagList.slice(0, 3)"
                :key="tag"
                size="small"
                type="info"
              >
                {{ tag }}
              </el-tag>
            </div>
          </div>
        </div>
      </div>

      <!-- 空状态 -->
      <div v-if="!loading && currentModels.length === 0" class="empty-state">
        <p>暂无模型</p>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAssetsFile } from '@/utils/pub-use';
import request from '@/utils/request';
import { ElMessage } from 'element-plus';
import { Loading } from '@element-plus/icons-vue';
import { newConversationId, newConversationMessage } from '@/global/MessageCommon';

const router = useRouter();
const activeCategory = ref('recommend');

// 数据状态
const categories = ref([]);
const models = ref([]);
const loading = ref(false);

// API调用方法
const fetchCategories = async () => {
  try {
    const response = await request.get('/aimodel/category/list');
    if (response.code === 0) {
      categories.value = response.data;
      console.log('✅ 获取分类成功:', categories.value);
    } else {
      throw new Error(response.message || '获取分类失败');
    }
  } catch (error) {
    console.error('❌ 获取分类失败:', error);
    ElMessage.error('获取分类失败');
  }
};

const fetchModelsByCategory = async (category: string) => {
  try {
    loading.value = true;
    let response;

    if (category === 'recommend') {
      // 获取推荐模型
      response = await request.get('/aimodel/list/recommend');
    } else {
      // 根据分类获取模型
      response = await request.get(`/aimodel/list/category?category=${category}`);
    }

    if (response.code === 0) {
      models.value = response.data;
      console.log(`✅ 获取${category}分类模型成功:`, models.value);
    } else {
      throw new Error(response.message || '获取模型失败');
    }
  } catch (error) {
    console.error(`❌ 获取${category}分类模型失败:`, error);
    ElMessage.error('获取模型失败');
    models.value = [];
  } finally {
    loading.value = false;
  }
};
// 计算当前显示的模型列表
const currentModels = computed(() => {
  return models.value || [];
});

const getCategoryTitle = () => {
  const category = categories.value.find(cat => cat.categoryKey === activeCategory.value);
  return category ? category.categoryName : '模型广场';
};

const handleCategorySelect = async (category: string) => {
  activeCategory.value = category;
  await fetchModelsByCategory(category);
};

const handleModelSelect = async (model: any) => {
  try {
    console.log('🎯 选择模型:', model);

    // 获取模型详情（包含prompt）
    const response = await request.get(`/aimodel/detail?id=${model.id}`);
    if (response.code !== 0) {
      throw new Error(response.message || '获取模型详情失败');
    }

    const modelDetail = response.data;
    console.log('📋 模型详情:', modelDetail);

    // 创建新会话，使用模型的prompt
    const conversationResponse = await request.post('/conversation/addConversation', {
      aiId: model.id,
      prompt: modelDetail.prompt // 使用模型的专用prompt
    });

    if (conversationResponse.code !== 0) {
      throw new Error(conversationResponse.message || '创建会话失败');
    }

    const conversationId = conversationResponse.data;
    console.log('✅ 会话创建成功，ID:', conversationId);

    // 设置新会话信息
    newConversationId.value = conversationId;
    newConversationMessage.value = `你好！我想使用${model.name}来帮助我。`;

    // 跳转到聊天页面
    router.push(`/main/${conversationId}`);

    ElMessage.success(`已选择${model.name}，开始对话`);

  } catch (error) {
    console.error('❌ 选择模型失败:', error);
    ElMessage.error('选择模型失败，请重试');
  }
};

// 组件挂载时初始化
onMounted(async () => {
  console.log('🚀 模型广场组件挂载');

  // 获取分类列表
  await fetchCategories();

  // 获取默认分类的模型
  await fetchModelsByCategory(activeCategory.value);
});
</script>

<style scoped>
.model-square-container {
  padding: 0 20px;
  height: 100%;
  overflow-y: auto;
}

.category-nav {
  position: sticky;
  top: 0;
  background-color: #fff;
  z-index: 1;
  border-bottom: 1px solid var(--el-border-color-light);
}

.category-nav :deep(.el-menu) {
  --el-menu-hover-bg-color: var(--el-color-primary-light-9);
  border-bottom: none;
}

.category-nav :deep(.el-menu-item) {
  font-size: 15px;
}

.category-nav :deep(.el-menu-item.is-active) {
  font-weight: 600;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 24px 0 16px;
}

.loading-container {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  color: #666;
  gap: 8px;
}

.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}

.model-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  padding-bottom: 24px;
}

.model-card {
  background: #fff;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.model-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-color: var(--el-color-primary-light-5);
}

.model-icon {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.model-icon img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.model-info {
  flex: 1;
}

.model-name {
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.model-desc {
  font-size: 14px;
  color: #666;
  margin: 0 0 12px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.model-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.model-source {
  font-size: 13px;
  color: #999;
}

.model-usage {
  font-size: 12px;
  color: #999;
}

.model-tags {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .model-square-container {
    padding: 0 12px;
  }

  .model-grid {
    grid-template-columns: 1fr;
  }

  .section-title {
    font-size: 18px;
    margin: 16px 0 12px;
  }

  .category-nav :deep(.el-menu-item) {
    padding: 0 12px;
    font-size: 14px;
  }
}
</style>
