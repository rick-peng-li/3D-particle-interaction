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
    <div class="fps-counter">
      FPS: <span id="fps">{{ fps }}</span>
    </div>
  </div>
</template>

<script setup>
defineProps({
  gestureName: {
    type: String,
    default: '等待识别...'
  },
  fps: {
    type: Number,
    default: 0
  }
})
</script>

<style scoped>
#ui-layer {
  position: absolute;
  top: 20px;
  left: 20px;
  color: white;
  z-index: 10;
  pointer-events: none;
}

.status {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  text-shadow: 0 0 10px #0ff;
}

.instruction {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  max-width: 80vw;
}

.badge {
  background: rgba(0, 255, 255, 0.1);
  border: 1px solid rgba(0, 255, 255, 0.3);
  padding: 5px 10px;
  border-radius: 15px;
  backdrop-filter: blur(5px);
}

.fps-counter {
  position: absolute;
  top: 0;
  right: -90vw;
  font-family: monospace;
  color: #0ff;
}

@media (max-width: 600px) {
  .status {
    font-size: 18px;
  }
  .instruction {
    font-size: 12px;
  }
  .badge {
    padding: 3px 8px;
  }
}
</style>
