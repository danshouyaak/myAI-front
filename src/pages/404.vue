<template>
  <div class="not-found-container">
    <div class="not-found-content">
      <h1 class="error-code">404</h1>
      <h2 class="error-message">页面未找到</h2>
      <p class="error-description">很抱歉，您请求的页面不存在或已被移动。</p>
      <router-link class="back-button" to="/">返回首页</router-link>
    </div>
    <div class="not-found-animation">
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
      <div class="box"></div>
    </div>
  </div>
</template>

<script setup>

</script>

<style scoped>
.not-found-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  font-family: 'Arial', sans-serif;
}

.not-found-content {
  text-align: center;
  z-index: 2;
}

.error-code {
  font-size: 150px;
  font-weight: bold;
  color: #4a5568;
  margin: 0;
  background: linear-gradient(to right, #4a90e2, #9b59b6);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: float 3s ease-in-out infinite;
}

.error-message {
  font-size: 36px;
  color: #4a5568;
  margin-top: 20px;
}

.error-description {
  font-size: 18px;
  color: #718096;
  margin: 20px 0;
  max-width: 500px;
}

.back-button {
  display: inline-block;
  padding: 12px 30px;
  background: linear-gradient(to right, #4a90e2, #9b59b6);
  color: white;
  text-decoration: none;
  border-radius: 30px;
  font-weight: bold;
  transition: transform 0.3s, box-shadow 0.3s;
  box-shadow: 0 4px 15px rgba(74, 144, 226, 0.3);
}

.back-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(74, 144, 226, 0.4);
}

.not-found-animation {
  position: absolute;
  width: 100%;
  height: 100%;
  top: 0;
  left: 0;
  z-index: 1;
}

.box {
  position: absolute;
  width: 50px;
  height: 50px;
  background-color: rgba(74, 144, 226, 0.2);
  border: 2px solid rgba(74, 144, 226, 0.5);
  animation: float 6s ease-in-out infinite;
}

.box:nth-child(1) {
  top: 20%;
  left: 20%;
  animation-delay: 0s;
}

.box:nth-child(2) {
  top: 30%;
  left: 50%;
  animation-delay: 1s;
}

.box:nth-child(3) {
  top: 70%;
  left: 30%;
  animation-delay: 2s;
}

.box:nth-child(4) {
  top: 80%;
  left: 70%;
  animation-delay: 3s;
}

@keyframes float {
  0%, 100% {
    transform: translateY(0) rotate(0deg);
  }
  50% {
    transform: translateY(-20px) rotate(10deg);
  }
}

@media (max-width: 768px) {
  .error-code {
    font-size: 100px;
  }

  .error-message {
    font-size: 28px;
  }

  .box {
    width: 30px;
    height: 30px;
  }
}
</style>
