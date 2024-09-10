<script lang="ts" setup>
import MainPage from './components/MainPage.vue';
</script>
<template>

  <div
    style="
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
    "
  >
    <div class="container">
      <div class="aside">
        <div class="flex flex-wrap gap-4">

          <el-card shadow="hover">
            <template #header>
              <el-avatar size="large" src="src/assets/doctor.png" />
              <el-text class="mx-1" size="large" tag="b">AI. 张医生</el-text>
            </template>
            <template #default>
              <el-text class="mx-1" size="large" tag="b">当医生已经30年了</el-text>
            </template>
          </el-card>
        </div>
      </div>
      <div class="main">
        <MainPage />
      </div>
    </div>
  </div>
</template>

<style scoped>
.container {
  display: flex;
  width: 98%;
  height: 95%;
  border: #e5e7eb 1px solid;
  box-shadow: 3px 3px 3px rgba(229, 231, 235, 1); /* 添加阴影 */
}

.aside {
  min-width: 260px;
  overflow: auto;
  border-right: #dfdfdf 1px solid;
  //background-color: darkkhaki;
}

.main {
  flex: 5;
  //background-color: chartreuse;
}
</style>
