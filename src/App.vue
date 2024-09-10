<script lang="ts" setup>
import AiChatPage from './pages/AiChat/AiChatPage.vue';
import HomePage from './layout/Home/HomePage.vue';
import { RouterView } from 'vue-router';
</script>

<template>
  <div style="height: 100vh; margin: 0; padding: 0">
    <!--    <AiChatPage />-->
    <!--    <HomePage/>-->
    <RouterView />
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
