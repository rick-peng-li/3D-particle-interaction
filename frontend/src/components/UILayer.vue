<template>
  <div id="ui-layer">
    <div class="status">
      当前手势: <span id="gesture-name">{{ gestureName }}</span>
    </div>
    <div class="instruction">
      <span class="badge">🖐 张手: 球体</span>
      <span class="badge">✌ 剪刀手: Dyf</span>
      <span class="badge">✊ 握拳: 圆环</span>
      <span class="badge">☝ 食指: 星星</span>
      <span class="badge">👍 拇指: 爱心</span>
    </div>
    <div class="fps-counter">FPS: <span id="fps">{{ fps }}</span></div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { gestureNames } from '../utils/helpers.js';

const props = defineProps({
  gesture: {
    type: String,
    default: 'sphere'
  },
  fps: {
    type: Number,
    default: 0
  }
});

const gestureName = computed(() => {
  return gestureNames[props.gesture] || '等待识别...';
});
</script>
