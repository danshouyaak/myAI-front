<template>
  <el-watermark :content="[user?.id, user?.userRole]" :font="font">
    <div class="common-layout">
      <el-container class="container">
        <el-header>
          <Header />
        </el-header>
        <el-container>
          <el-aside :class="{ 'is-collapse': isCollapse }" :width="isCollapse ? '0' : '300px'" class="aside">
            <Aside />
          </el-aside>
          <div class="aside-toggle" @click="toggleAside">
            <el-icon>
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </div>
          <el-container>
            <el-main>
              <RouterView />
            </el-main>
          </el-container>
        </el-container>
      </el-container>
    </div>
  </el-watermark>
</template>
<script lang="ts" setup>
import Header from '@/components/Header.vue';
import { reactive, ref, watchEffect } from 'vue';
import { getUser } from '@/global/UserStatue.ts';
import { useRouter } from 'vue-router';
import { Expand, Fold } from '@element-plus/icons-vue';

const router = useRouter();
import { UserModel } from '@/models/UserModels';
import Aside from '@/components/Aside.vue';

const isCollapse = ref(false);
const toggleAside = () => {
  isCollapse.value = !isCollapse.value;
};

const font = reactive({
  color: 'rgba(0, 0, 0, .15)'
});

let user = reactive({} as UserModel);
watchEffect(() => {
  // user = getUser();
  // if (user == null) {
  //   router.push('/login');
  // }
});
</script>
<style scoped>
.container {
  height: 100vh;
  border: #e5e7eb 1px solid;
  box-shadow: 3px 3px 3px rgba(229, 231, 235, 1);
  position: relative;
}

.aside {
  transition: all 0.3s ease;
  position: relative;
  background-color: white;
  overflow: hidden;
}

.aside-toggle {
  position: fixed;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 20px;
  height: 40px;
  background-color: white;
  border-radius: 0 8px 8px 0;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 3px 0 5px rgba(0, 0, 0, 0.1);
  z-index: 999;
  transition: all 0.3s ease;
}

.is-collapse {
  padding: 0;
}

/* 修改断点为 1200px，让更多屏幕使用手机端样式 */
@media (max-width: 1200px) {
  .aside {
    position: fixed;
    left: 0;
    top: 60px;
    bottom: 0;
    z-index: 998;
    background-color: white;
    box-shadow: 2px 0 8px rgba(0, 0, 0, 0.1);
    transform: translateX(0);
  }

  .is-collapse {
    transform: translateX(-100%);
  }

  .aside-toggle {
    left: 0;
  }

  .is-collapse + .aside-toggle {
    left: 0;
  }
}
</style>
