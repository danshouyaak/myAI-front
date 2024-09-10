<script lang="ts" setup></script>


<template>
  <div class="common-layout" style="height: 100%">
    <el-container style="height: 100%">
      <el-aside class="aside" style="min-width: 260px;
    overflow: auto;" width="200px">Aside
      </el-aside>
      <el-container>
        <el-main style="background-color: black">Main</el-main>
        <el-footer style="background-color: darkkhaki">Footer</el-footer>
      </el-container>
    </el-container>
  </div>
</template>


<style scoped>
.aside {
  background-color: aqua;
}

.head {
  background-color: brown;
  height: 20%;
}

.main {
  background-color: darkkhaki;
}
</style>
