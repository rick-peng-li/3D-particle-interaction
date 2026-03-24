<template>
  <Teleport to="body">
    <div id="ui-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          :class="['ui-toast', `ui-toast-${toast.type}`, { show: toast.visible }]"
        >
          {{ toast.message }}
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const toasts = ref([]);
let toastId = 0;

const show = (message, type = 'info', duration = 3000) => {
  const id = ++toastId;
  const toast = {
    id,
    message,
    type,
    visible: false
  };
  toasts.value.push(toast);
  
  requestAnimationFrame(() => {
    const t = toasts.value.find(item => item.id === id);
    if (t) t.visible = true;
  });

  setTimeout(() => {
    const t = toasts.value.find(item => item.id === id);
    if (t) t.visible = false;
    setTimeout(() => {
      toasts.value = toasts.value.filter(item => item.id !== id);
    }, 300);
  }, duration);
};

defineExpose({ show });

const toastListeners = {
  toast: (e) => show(e.message, e.type, e.duration)
};

onMounted(() => {
  Object.entries(toastListeners).forEach(([event, handler]) => {
    window.addEventListener(event, handler);
  });
});

onUnmounted(() => {
  Object.entries(toastListeners).forEach(([event, handler]) => {
    window.removeEventListener(event, handler);
  });
});
</script>

<style scoped>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>
