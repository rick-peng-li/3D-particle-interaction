<template>
  <div class="app-container">
    <!-- 3D Canvas Container -->
    <div ref="canvasContainer" class="canvas-container"></div>
    
    <!-- Hidden Video for Hand Tracking -->
    <video
      ref="videoElement"
      class="input-video"
      playsinline
      style="display: none;"
    ></video>
    
    <!-- UI Components -->
    <GestureUI
      :gesture-name="currentGestureName"
      :fps="fps"
    />
    
    <LoadingScreen
      ref="loadingScreen"
      :message="loadingMessage"
    />
    
    <ToastContainer ref="toastContainer" />
    <ModalDialog ref="modalDialog" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useParticleSystem } from './composables/useParticleSystem'
import { useHandTracking, GESTURES, GESTURE_NAMES } from './composables/useHandTracking'
import GestureUI from './components/GestureUI.vue'
import LoadingScreen from './components/LoadingScreen.vue'
import ToastContainer from './components/ToastContainer.vue'
import ModalDialog from './components/ModalDialog.vue'

// Refs
const canvasContainer = ref(null)
const videoElement = ref(null)
const loadingScreen = ref(null)
const toastContainer = ref(null)
const modalDialog = ref(null)

// State
const currentGesture = ref(GESTURES.UNKNOWN)
const fps = ref(0)
const loadingMessage = ref('系统初始化中...<br>请允许摄像头权限')
let lastFrameTime = performance.now()
let frameCount = 0

// Computed
const currentGestureName = computed(() => GESTURE_NAMES[currentGesture.value] || '等待识别...')

// Initialize particle system
const { init: initParticles, startAnimation, morphToShape, applyWindForce, updateScale } = useParticleSystem(canvasContainer)

// Gesture to shape mapping
const GESTURE_TO_SHAPE = {
  [GESTURES.OPEN_PALM]: 'sphere',
  [GESTURES.VICTORY]: 'text',
  [GESTURES.CLOSED_FIST]: 'torus',
  [GESTURES.POINTING_UP]: 'star',
  [GESTURES.THUMB_UP]: 'heart'
}

// Handle gesture detection
const handleGestureDetected = (gesture) => {
  if (gesture !== currentGesture.value && GESTURE_TO_SHAPE[gesture]) {
    currentGesture.value = gesture
    morphToShape(GESTURE_TO_SHAPE[gesture])
    
    if (toastContainer.value) {
      toastContainer.value.info(`检测到手势: ${GESTURE_NAMES[gesture]}`, 2000)
    }
  }
}

// Handle hand movement
const handleHandMove = (data) => {
  if (data.wind) {
    applyWindForce(data.wind.x * 0.1, 0)
  }
  if (data.scale) {
    updateScale(data.scale)
  }
}

// Initialize hand tracking
const { init: initHandTracking } = useHandTracking(
  videoElement,
  handleGestureDetected,
  handleHandMove
)

// FPS counter
const updateFPS = () => {
  const now = performance.now()
  frameCount++
  
  if (now - lastFrameTime >= 1000) {
    fps.value = frameCount
    frameCount = 0
    lastFrameTime = now
  }
  
  requestAnimationFrame(updateFPS)
}

// Error translation
const translateError = (error) => {
  const msg = error?.message ? error.message : String(error)
  const str = msg.toLowerCase()
  
  if (str.includes('permission dismissed') || str.includes('permission denied') || str.includes('notallowederror')) {
    return '用户拒绝了摄像头权限，请允许访问以继续使用。'
  }
  if (str.includes('device in use') || str.includes('notreadableerror') || str.includes('could not start video source')) {
    return '摄像头被其他应用占用，请关闭后重试。'
  }
  if (str.includes('constraintnotsatisfiederror') || str.includes('overconstrainederror')) {
    return '无法满足摄像头分辨率要求，请尝试更换设备。'
  }
  if (str.includes('notfounderror') || str.includes('devicesnotfounderror') || str.includes('no device found')) {
    return '未检测到摄像头设备，请检查连接。'
  }
  if (str.includes('failed to acquire camera feed')) {
    return '无法获取摄像头画面，可能是权限被拒绝或设备不可用。'
  }
  if (str.includes('webgl not supported')) {
    return '您的浏览器不支持 WebGL，无法渲染3D效果。'
  }
  if (str.includes('failed to fetch') || str.includes('networkerror')) {
    return '网络连接失败，请检查网络设置。'
  }
  return msg
}

// Initialize everything
onMounted(async () => {
  try {
    // Initialize 3D scene
    initParticles()
    startAnimation()
    updateFPS()
    
    // Initialize hand tracking
    await initHandTracking()
    
    // Hide loading screen
    setTimeout(() => {
      if (loadingScreen.value) {
        loadingScreen.value.hide()
      }
      if (toastContainer.value) {
        toastContainer.value.success('系统初始化完成！', 3000)
      }
    }, 1000)
    
  } catch (error) {
    console.error('Initialization error:', error)
    const errorMsg = translateError(error)
    
    if (loadingScreen.value) {
      loadingScreen.value.updateMessage(`初始化失败<br>${errorMsg}`)
    }
    
    if (modalDialog.value) {
      await modalDialog.value.open({
        title: '初始化失败',
        content: errorMsg,
        showCancel: false
      })
    }
  }
})
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  position: relative;
  overflow: hidden;
  background: #000;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.canvas-container canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.input-video {
  display: none;
}
</style>
