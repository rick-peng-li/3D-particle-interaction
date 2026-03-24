<template>
  <Loading :visible="loading" :message="loadingMessage" />
  <UILayer :gesture="currentGesture" :fps="fps" />
  <Toast ref="toastRef" />
  <Modal ref="modalRef" />
  <video ref="videoRef" class="input_video" playsinline></video>
  <canvas ref="canvasRef"></canvas>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import * as THREE from 'three';
import { ParticleSystem } from './core/ParticleSystem.js';
import { HandTracker } from './core/HandTracker.js';
import { translateError, gestureNames } from './utils/helpers.js';
import Loading from './components/Loading.vue';
import UILayer from './components/UILayer.vue';
import Toast from './components/Toast.vue';
import Modal from './components/Modal.vue';

const loading = ref(true);
const loadingMessage = ref('系统初始化中...\n请允许摄像头权限');
const currentGesture = ref('sphere');
const fps = ref(0);

const videoRef = ref(null);
const canvasRef = ref(null);
const toastRef = ref(null);
const modalRef = ref(null);

let scene = null;
let camera = null;
let renderer = null;
let particles = null;
let handTracker = null;
let animationId = null;
let lastTime = 0;
let frameCount = 0;
let lastFpsTime = 0;

const initThree = () => {
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x000000, 0.03);
  
  camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 15;

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
    alpha: true
  });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  particles = new ParticleSystem(scene);
};

const initHandTracker = async () => {
  handTracker = new HandTracker(
    videoRef.value,
    (gesture) => {
      particles.setTarget(gesture);
      currentGesture.value = gesture;
    },
    () => {}
  );

  try {
    await handTracker.start();
    loading.value = false;
  } catch (err) {
    const translatedMsg = translateError(err);
    loadingMessage.value = translatedMsg;
    modalRef.value?.show(translatedMsg, '摄像头启动失败', 'alert');
  }
};

const animate = (time) => {
  animationId = requestAnimationFrame(animate);

  const dt = time - lastTime;
  lastTime = time;

  particles.update();
  renderer.render(scene, camera);

  frameCount++;
  if (time - lastFpsTime >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (time - lastFpsTime));
    frameCount = 0;
    lastFpsTime = time;
  }
};

const onWindowResize = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
};

onMounted(async () => {
  initThree();
  await initHandTracker();
  animate(0);
  window.addEventListener('resize', onWindowResize);
});

onUnmounted(() => {
  if (animationId) {
    cancelAnimationFrame(animationId);
  }
  window.removeEventListener('resize', onWindowResize);
});
</script>

<style scoped>
canvas {
  display: block;
  width: 100vw;
  height: 100vh;
}
</style>
