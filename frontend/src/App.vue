<template>
  <div class="app-container">
    <!-- Loading Screen -->
    <div id="loading" v-if="isLoading">
      <div class="spinner"></div>
      <div class="text">系统初始化中...<br>请允许摄像头权限</div>
    </div>

    <!-- UI Layer -->
    <div id="ui-layer">
      <div class="status">当前手势: <span id="gesture-name">{{ gestureName }}</span></div>
      <div class="instruction">
        <span class="badge">🖐 张手: 球体</span>
        <span class="badge">✌ 剪刀手: Dyf</span>
        <span class="badge">✊ 握拳: 圆环</span>
        <span class="badge">☝ 食指: 星星</span>
        <span class="badge">👍 拇指: 爱心</span>
      </div>
      <div class="fps-counter">FPS: <span id="fps">{{ fps }}</span></div>
    </div>

    <!-- Video Element for MediaPipe -->
    <video ref="videoElement" class="input_video" playsinline style="display: none;"></video>

    <!-- Three.js Canvas Container -->
    <div ref="canvasContainer" class="canvas-container"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { ParticleSystem } from './components/ParticleSystem';
import { UI } from './utils/UI';
const isLoading = ref(true);
const fps = ref(0);
const currentGesture = ref('sphere');
const videoElement = ref<HTMLVideoElement | null>(null);
const canvasContainer = ref<HTMLDivElement | null>(null);
let scene: THREE.Scene | null = null;
let camera: THREE.PerspectiveCamera | null = null;
let renderer: THREE.WebGLRenderer | null = null;
let particles: ParticleSystem | null = null;
let animationId: number | null = null;
let frameCount = 0;
let lastFpsTime = 0;
const gestureNameMap: Record<string, string> = {
 'sphere': '🖐 张手 (球体)',
 'text': '✌ 剪刀手 (Dyf)',
 'ring': '✊ 握拳 (圆环)',
 'star': '☝ 食指 (星星)',
 'heart': '👍 拇指 (爱心)'
};
const gestureName = ref(gestureNameMap['sphere']);
function initThreeJS() {
 if (!canvasContainer.value)
 return;
 const container = canvasContainer.value;
 scene = new THREE.Scene();
 scene.fog = new THREE.FogExp2(0x000000, 0.02);
 camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
 camera.position.z = 12;
 renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
 renderer.setSize(window.innerWidth, window.innerHeight);
 renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
 container.appendChild(renderer.domElement);
 particles = new ParticleSystem(scene);
 window.addEventListener('resize', onWindowResize, false);
}
function onWindowResize() {
 if (!camera || !renderer)
 return;
 camera.aspect = window.innerWidth / window.innerHeight;
 camera.updateProjectionMatrix();
 renderer.setSize(window.innerWidth, window.innerHeight);
}
function animate(time: number) {
 animationId = requestAnimationFrame(animate);
 if (particles) {
 particles.update();
 }
 if (renderer && scene && camera) {
 renderer.render(scene, camera);
 }
 // FPS calculation
 frameCount++;
 if (time - lastFpsTime >= 1000) {
 fps.value = Math.round((frameCount * 1000) / (time - lastFpsTime));
 frameCount = 0;
 lastFpsTime = time;
 }
}
function onGestureChange(gesture: string) {
 currentGesture.value = gesture;
 gestureName.value = gestureNameMap[gesture] || gesture;
 if (particles) {
 particles.setTarget(gesture as any);
 }
}
onMounted(async () => {
  UI.init();
  initThreeJS();

  if (videoElement.value) {
    try {
      // Import and initialize MediaPipe directly
      const HandsModule = await import('@mediapipe/hands');
      const CameraModule = await import('@mediapipe/camera_utils');
      
      const hands = new HandsModule.Hands({
        locateFile: (file: string) => {
          return `https://unpkg.com/@mediapipe/hands/${file}`;
        }
      });

      hands.setOptions({
        maxNumHands: 1,
        modelComplexity: 1,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.5
      });

      let lastPalmPos: { x: number; y: number } | null = null;
      let lastTimestamp = 0;
      let gestureHistory: string[] = [];
      let palmHistory: { x: number; y: number }[] = [];
      let lastArea = 0.1;
      let interactionCooldown = 0;

      const dist = (p1: any, p2: any) => {
        return Math.sqrt(
          Math.pow(p1.x - p2.x, 2) +
          Math.pow(p1.y - p2.y, 2) +
          Math.pow(p1.z - p2.z, 2)
        );
      };

      const detectGesture = (landmarks: any[]): string | null => {
        const wrist = landmarks[0];
        
        const isExtended = (tipIdx: number, pipIdx: number) => {
          return dist(landmarks[tipIdx], wrist) > dist(landmarks[pipIdx], wrist) * 1.0;
        };

        const thumbExtended = dist(landmarks[4], wrist) > dist(landmarks[3], wrist) * 1.0;
        const indexExtended = isExtended(8, 6);
        const middleExtended = isExtended(12, 10);
        const ringExtended = isExtended(16, 14);
        const pinkyExtended = isExtended(20, 18);

        const fingerCount = (indexExtended ? 1 : 0) +
          (middleExtended ? 1 : 0) +
          (ringExtended ? 1 : 0) +
          (pinkyExtended ? 1 : 0);

        if (fingerCount >= 4) return 'sphere';
        if (indexExtended && middleExtended && fingerCount === 2) return 'text';
        if (indexExtended && fingerCount === 1) return 'star';
        if (fingerCount === 0) {
          if (thumbExtended) return 'heart';
          return 'ring';
        }
        return null;
      };

      const stabilizeGesture = (gesture: string | null): string | null => {
        if (!gesture) return null;
        gestureHistory.push(gesture);
        if (gestureHistory.length > 5) gestureHistory.shift();
        
        const counts: Record<string, number> = {};
        gestureHistory.forEach(g => counts[g] = (counts[g] || 0) + 1);
        
        if (counts[gesture] >= 3) return gesture;
        return null;
      };

      let noHandCounter = 0;
      const NO_HAND_THRESHOLD = 60;
      
      hands.onResults((results: any) => {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
          noHandCounter = 0;
          const landmarks = results.multiHandLandmarks[0];
          const rawGesture = detectGesture(landmarks);
          const gesture = stabilizeGesture(rawGesture);
          
          if (gesture && gesture !== currentGesture.value) {
            onGestureChange(gesture);
            interactionCooldown = 20;
          }

          if (interactionCooldown > 0) {
            interactionCooldown--;
            const palm = landmarks[9];
            lastPalmPos = { x: palm.x, y: palm.y };
            lastTimestamp = performance.now();
          } else {
            const palm = landmarks[9];
            const now = performance.now();
            let minX = 1, maxX = 0, minY = 1, maxY = 0;
            
            for (const p of landmarks) {
              if (p.x < minX) minX = p.x;
              if (p.x > maxX) maxX = p.x;
              if (p.y < minY) minY = p.y;
              if (p.y > maxY) maxY = p.y;
            }
            
            const width = maxX - minX;
            const height = maxY - minY;
            const rawArea = width * height;
            const alpha = 0.1;
            lastArea = lastArea + (rawArea - lastArea) * alpha;
            const area = lastArea;

            if (lastPalmPos && particles) {
              const dt = (now - lastTimestamp) / 1000;
              if (dt > 0.01) {
                const scale = 50.0;
                let dx = (palm.x - lastPalmPos.x) * scale;
                let dy = -(palm.y - lastPalmPos.y) * scale;
                
                if (Math.abs(dx) < 2.0) dx = 0;
                if (Math.abs(dy) < 2.0) dy = 0;
                
                const velocity = { x: dx / dt, y: dy / dt, z: 0 };
                
                palmHistory.push({ x: palm.x, y: palm.y });
                if (palmHistory.length > 6) palmHistory.shift();
                
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                if (speed > 30.0) {
                  if (palmHistory.length >= 2) {
                    const oldest = palmHistory[0];
                    const dispX = (palm.x - oldest.x) * scale;
                    const dispY = (palm.y - oldest.y) * scale;
                    const totalDisp = Math.sqrt(dispX * dispX + dispY * dispY);
                    if (totalDisp >= 5.0) {
                      particles.triggerStorm(new THREE.Vector3(velocity.x, velocity.y, 0));
                    }
                  }
                }
                
                particles.setDepthScale(area);
              }
            }

            lastPalmPos = { x: palm.x, y: palm.y };
            lastTimestamp = now;
          }
        } else {
          noHandCounter++;
          if (noHandCounter > NO_HAND_THRESHOLD && currentGesture.value !== 'sphere') {
            onGestureChange('sphere');
            noHandCounter = 0;
          }
        }
      });

      const camera = new CameraModule.Camera(videoElement.value!, {
        onFrame: async () => {
          if (videoElement.value) {
            await hands.send({ image: videoElement.value });
          }
        },
        width: 640,
        height: 480
      });

      await camera.start();
      isLoading.value = false;
    } catch (err) {
      const translatedMsg = UI.translateError(err);
      UI.alert(translatedMsg, "摄像头启动失败");
      isLoading.value = false;
    }
  }

  animate(0);
});
onUnmounted(() => {
 if (animationId) {
 cancelAnimationFrame(animationId);
 }
 window.removeEventListener('resize', onWindowResize);
 if (renderer && canvasContainer.value && renderer.domElement.parentNode === canvasContainer.value) {
 canvasContainer.value.removeChild(renderer.domElement);
 renderer.dispose();
 }
});
</script>

<style scoped>
.app-container {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  position: relative;
}

.canvas-container {
  width: 100%;
  height: 100%;
}

.input_video {
  display: none;
}
</style>
