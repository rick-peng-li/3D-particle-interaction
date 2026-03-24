<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-screen">
      <div class="spinner"></div>
      <div class="text" v-html="message"></div>
    </div>
  </Transition>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(true)
const message = ref('系统初始化中...<br>请允许摄像头权限')

const show = (msg) => {
  if (msg) message.value = msg
  visible.value = true
}

const hide = () => {
  visible.value = false
}

const updateMessage = (msg) => {
  message.value = msg
}

defineExpose({ show, hide, updateMessage })
</script>

<style scoped>
.loading-screen {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: #000;
  z-index: 999;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #0ff;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid rgba(0, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #0ff;
  animation: spin 1s ease-in-out infinite;
  margin-bottom: 20px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.text {
  text-align: center;
  line-height: 1.6;
}

.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-leave-to {
  opacity: 0;
}
</style>
