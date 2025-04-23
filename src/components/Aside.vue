<template>
  <div style="display: flex;flex-direction: column;align-items: center;justify-items: center">
    <el-card
      shadow="hover"
      style="display: flex;align-items: center; margin-top: 5%;background-color: #ffffff;width: 224px; height: 45px; border-radius: 15px;">
      <div style="display: flex;">
        <el-tag disabled style="background-color: transparent;border: none" type="primary">
          <img alt="" src="../assets/messgeLog.svg" />
          <el-text style="font-size: 16px">
            新建消息
          </el-text>
        </el-tag>
        <div style="">
          <el-tag disabled style="margin: 0 0 0 2px;padding: 0 4px" type="primary">
            <el-text style="font-size: 14px">
              Ctrl
            </el-text>
          </el-tag>
          <el-tag disabled style="margin: 0 0 0 2px;padding: 0 4px" type="primary">
            <el-text style="font-size: 14px">
              K
            </el-text>
          </el-tag>
        </div>
      </div>
    </el-card>
    <el-scrollbar height="50vh" style="margin-top: 10%;width: 224px">
      <p v-for="item in 20" :key="item" class="scrollbar-demo-item">{{ item }}</p>
    </el-scrollbar>
  </div>
</template>

<style scoped>
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}
</style>
<script lang="ts" setup>
</script>
