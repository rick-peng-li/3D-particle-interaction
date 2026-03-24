<template>
  <div id="loading" v-show="visible">
    <div class="spinner"></div>
    <div class="text">{{ message }}</div>
  </div>
</template>

<script setup>
defineProps({
  visible: {
    type: Boolean,
    default: true
  },
  message: {
    type: String,
    default: '系统初始化中...\n请允许摄像头权限'
  }
});
</script>
