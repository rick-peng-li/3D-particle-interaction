import { ref, onUnmounted } from 'vue'

export const GESTURES = {
  OPEN_PALM: 'open_palm',
  CLOSED_FIST: 'closed_fist',
  POINTING_UP: 'pointing_up',
  VICTORY: 'victory',
  THUMB_UP: 'thumb_up',
  UNKNOWN: 'unknown'
}

export const GESTURE_NAMES = {
  [GESTURES.OPEN_PALM]: '张手',
  [GESTURES.CLOSED_FIST]: '握拳',
  [GESTURES.POINTING_UP]: '食指',
  [GESTURES.VICTORY]: '剪刀手',
  [GESTURES.THUMB_UP]: '拇指',
  [GESTURES.UNKNOWN]: '等待识别...'
}

export function useHandTracking(videoRef, onGestureDetected, onHandMove) {
  const hands = ref(null)
  const camera = ref(null)
  const isInitialized = ref(false)
  const lastGesture = ref(GESTURES.UNKNOWN)
  const gestureStartTime = ref(0)
  const GESTURE_HOLD_DURATION = 500 // ms
  
  // Wind detection
  const handHistory = ref([])
  const MAX_HISTORY = 10
  const lastWindTime = ref(0)
  const WIND_COOLDOWN = 1000 // ms
  
  const init = async () => {
    if (!videoRef.value) return
    
    // Dynamically import MediaPipe from CDN
    const Hands = window.Hands || (await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js')).Hands
    const Camera = window.Camera || (await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')).Camera
    
    hands.value = new Hands({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`
      }
    })
    
    hands.value.setOptions({
      maxNumHands: 1,
      modelComplexity: 1,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    })
    
    hands.value.onResults(onResults)
    
    camera.value = new Camera(videoRef.value, {
      onFrame: async () => {
        await hands.value.send({ image: videoRef.value })
      },
      width: 640,
      height: 480
    })
    
    try {
      await camera.value.start()
      isInitialized.value = true
    } catch (error) {
      console.error('Failed to start camera:', error)
      throw error
    }
  }
  
  // Helper to load scripts from CDN
  const loadScript = (src) => {
    return new Promise((resolve, reject) => {
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve(window)
        return
      }
      const script = document.createElement('script')
      script.src = src
      script.crossOrigin = 'anonymous'
      script.onload = () => resolve(window)
      script.onerror = reject
      document.head.appendChild(script)
    })
  }
  
  const onResults = (results) => {
    if (!results.multiHandLandmarks || results.multiHandLandmarks.length === 0) return
    
    const landmarks = results.multiHandLandmarks[0]
    const gesture = detectGesture(landmarks)
    const now = Date.now()
    
    // Handle gesture detection with debounce
    if (gesture !== lastGesture.value) {
      gestureStartTime.value = now
      lastGesture.value = gesture
    } else if (now - gestureStartTime.value > GESTURE_HOLD_DURATION) {
      if (onGestureDetected) {
        onGestureDetected(gesture)
      }
    }
    
    // Track hand movement for wind effect
    trackHandMovement(landmarks, now)
    
    // Calculate hand scale for depth effect
    const scale = calculateHandScale(landmarks)
    if (onHandMove) {
      onHandMove({ scale, landmarks })
    }
  }
  
  const detectGesture = (landmarks) => {
    const fingerStates = {
      thumb: isThumbExtended(landmarks),
      index: isFingerExtended(landmarks, 8, 6),
      middle: isFingerExtended(landmarks, 12, 10),
      ring: isFingerExtended(landmarks, 16, 14),
      pinky: isFingerExtended(landmarks, 20, 18)
    }
    
    const extendedCount = Object.values(fingerStates).filter(Boolean).length
    
    // Check specific gestures
    if (extendedCount === 5) return GESTURES.OPEN_PALM
    if (extendedCount === 0) return GESTURES.CLOSED_FIST
    if (extendedCount === 1 && fingerStates.thumb) return GESTURES.THUMB_UP
    if (extendedCount === 1 && fingerStates.index) return GESTURES.POINTING_UP
    if (extendedCount === 2 && fingerStates.index && fingerStates.middle) return GESTURES.VICTORY
    
    return GESTURES.UNKNOWN
  }
  
  const isFingerExtended = (landmarks, tipIdx, pipIdx) => {
    return landmarks[tipIdx].y < landmarks[pipIdx].y
  }
  
  const isThumbExtended = (landmarks) => {
    const thumbTip = landmarks[4]
    const thumbIp = landmarks[3]
    const thumbMcp = landmarks[2]
    return thumbTip.x > thumbMcp.x
  }
  
  const trackHandMovement = (landmarks, now) => {
    const palmCenter = {
      x: landmarks[9].x,
      y: landmarks[9].y
    }
    
    handHistory.value.push({ ...palmCenter, time: now })
    if (handHistory.value.length > MAX_HISTORY) {
      handHistory.value.shift()
    }
    
    // Detect wind gesture (fast horizontal movement)
    if (handHistory.value.length >= MAX_HISTORY && now - lastWindTime.value > WIND_COOLDOWN) {
      const old = handHistory.value[0]
      const recent = handHistory.value[handHistory.value.length - 1]
      const timeDiff = recent.time - old.time
      const xDiff = recent.x - old.x
      const velocity = Math.abs(xDiff) / timeDiff * 1000 // pixels per second
      
      if (velocity > 2) { // Threshold for wind
        lastWindTime.value = now
        if (onHandMove) {
          onHandMove({ wind: { x: xDiff > 0 ? 1 : -1, force: velocity } })
        }
      }
    }
  }
  
  const calculateHandScale = (landmarks) => {
    const wrist = landmarks[0]
    const middleFingerTip = landmarks[12]
    const distance = Math.sqrt(
      Math.pow(middleFingerTip.x - wrist.x, 2) +
      Math.pow(middleFingerTip.y - wrist.y, 2)
    )
    // Normalize scale based on hand size (0.5 to 1.5 range)
    return Math.max(0.5, Math.min(1.5, distance * 3))
  }
  
  const dispose = () => {
    if (camera.value) {
      camera.value.stop()
    }
    if (hands.value) {
      hands.value.close()
    }
    isInitialized.value = false
  }
  
  onUnmounted(() => {
    dispose()
  })
  
  return {
    init,
    dispose,
    isInitialized,
    lastGesture
  }
}
