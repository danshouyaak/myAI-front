<script lang="ts" setup>
import AiChatPage from './pages/AiChat/AiChatPage.vue';
import HomePage from './layout/Home/HomePage.vue';
</script>

<template>
  <!--  <div>-->
  <!--    <a href="https://vitejs.dev" target="_blank">-->
  <!--      <img src="/vite.svg" class="logo" alt="Vite logo" />-->
  <!--    </a>-->
  <!--    <a href="https://vuejs.org/" target="_blank">-->
  <!--      <img src="./assets/vue.svg" class="logo vue" alt="Vue logo" />-->
  <!--    </a>-->
  <!--  </div>-->
  <!--  <HelloWorld msg="Vite + Vue" />-->
  <!--  <HomePage />-->
  <div style="height: 100vh; margin: 0; padding: 0">
    <AiChatPage />
    <!--    <HomePage/>-->
  </div>
</template>

<style scoped>
/**
.logo {
  height: 6em;
  padding: 1.5em;
  will-change: filter;
  transition: filter 300ms;
}
.logo:hover {
  filter: drop-shadow(0 0 2em #646cffaa);
}
.logo.vue:hover {
  filter: drop-shadow(0 0 2em #42b883aa);
}
 */
</style>
