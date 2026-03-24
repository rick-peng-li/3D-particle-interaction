<template>
  <div id="ui-container" class="toast-container">
    <TransitionGroup name="toast">
      <div
        v-for="toast in toasts"
        :key="toast.id"
        class="ui-toast"
        :class="`ui-toast-${toast.type}`"
      >
        {{ toast.message }}
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const toasts = ref([])
let toastId = 0

const show = (message, type = 'info', duration = 3000) => {
  const id = ++toastId
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

const success = (message, duration) => show(message, 'success', duration)
const error = (message, duration) => show(message, 'error', duration)
const warning = (message, duration) => show(message, 'warning', duration)
const info = (message, duration) => show(message, 'info', duration)

defineExpose({ show, success, error, warning, info })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  gap: 10px;
  pointer-events: none;
}

.ui-toast {
  background: rgba(20, 20, 30, 0.95);
  color: #fff;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 14px;
  border: 1px solid rgba(0, 255, 255, 0.3);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  min-width: 200px;
  text-align: center;
  backdrop-filter: blur(10px);
  pointer-events: auto;
}

.ui-toast-info { border-left: 4px solid #00e5ff; }
.ui-toast-success { border-left: 4px solid #00ff00; }
.ui-toast-warning { border-left: 4px solid #ffcc00; }
.ui-toast-error { border-left: 4px solid #ff3333; }

.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
