import * as THREE from 'three';
import { ShapeGenerator } from '../utils/ShapeGenerator';
import type { ShapeType } from '../types';

export class ParticleSystem {
  count = 16000;
  scene: THREE.Scene;
  geometry: THREE.BufferGeometry;
  material: THREE.PointsMaterial | null = null;
  points: THREE.Points | null = null;
  positions: Float32Array;
  velocities: Float32Array;
  targets: Float32Array;
  windForce: THREE.Vector3;
  currentScale = 1.0;
  targetScale = 1.0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.geometry = new THREE.BufferGeometry();
    this.positions = new Float32Array(this.count * 3);
    this.velocities = new Float32Array(this.count * 3);
    this.targets = new Float32Array(this.count * 3);
    this.windForce = new THREE.Vector3();
    this.init();
  }

  getTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,1)');
    grad.addColorStop(0.2, 'rgba(0,255,255,1)');
    grad.addColorStop(0.5, 'rgba(0,100,100,0.5)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
  }

  init() {
    for (let i = 0; i < this.count * 3; i++) {
      this.positions[i] = (Math.random() - 0.5) * 20;
      this.targets[i] = 0;
      this.velocities[i] = 0;
    }
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));
    this.material = new THREE.PointsMaterial({
      color: 0x00ffff,
      size: 0.12,
      sizeAttenuation: true,
      map: this.getTexture(),
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    this.points = new THREE.Points(this.geometry, this.material);
    this.scene.add(this.points);
    this.setTarget('sphere');
  }

  setTarget(shapeType: ShapeType) {
    let newTargets: Float32Array | null = null;
    try {
      switch (shapeType) {
        case 'sphere':
          newTargets = ShapeGenerator.generateSphere(2.0);
          break;
        case 'text':
          newTargets = ShapeGenerator.generateFromCanvasShape('我是 Dyf', 60);
          break;
        case 'ring':
          newTargets = ShapeGenerator.generateTorus(1.8, 0.6);
          break;
        case 'star':
          newTargets = ShapeGenerator.generateFromCanvasShape('★', 80);
          break;
        case 'heart':
          newTargets = ShapeGenerator.generateHeart(0.15);
          break;
        default:
          newTargets = ShapeGenerator.generateSphere(2.0);
      }
      if (newTargets && newTargets.length === this.targets.length) {
        this.targets.set(newTargets);
        this.explode();
      }
    } catch (e) {
      console.error('Error setting target shape:', e);
    }
  }

  explode() {
    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const x = this.positions[idx];
      const y = this.positions[idx + 1];
      const z = this.positions[idx + 2];
      const len = Math.sqrt(x * x + y * y + z * z) + 0.001;
      const force = 0.2 + Math.random() * 0.3;
      this.velocities[idx] += (x / len) * force;
      this.velocities[idx + 1] += (y / len) * force;
      this.velocities[idx + 2] += (z / len) * force;
    }
  }

  triggerStorm(velocity: THREE.Vector3) {
    const speed = velocity.length();
    if (speed > 30.0) {
      const force = 0.02 * speed;
      this.windForce.copy(velocity).normalize().multiplyScalar(force);
    }
  }

  setDepthScale(ratio: number) {
    let target = 1.0;
    if (ratio > 0) {
      target = 1.0 + (ratio - 0.05) * 10.0;
      target = Math.max(0.5, Math.min(target, 1.8));
    }
    this.targetScale = target;
  }

  update() {
    if (!this.points || !this.geometry.attributes.position) return;
    
    const positions = this.geometry.attributes.position.array as Float32Array;
    const spring = 0.05;
    const friction = 0.90;
    
    this.currentScale += (this.targetScale - this.currentScale) * 0.02;
    this.points.scale.setScalar(this.currentScale);

    for (let i = 0; i < this.count; i++) {
      const idx = i * 3;
      const px = positions[idx];
      const py = positions[idx + 1];
      const pz = positions[idx + 2];
      const tx = this.targets[idx];
      const ty = this.targets[idx + 1];
      const tz = this.targets[idx + 2];

      const ax = (tx - px) * spring;
      const ay = (ty - py) * spring;
      const az = (tz - pz) * spring;

      this.velocities[idx] += ax;
      this.velocities[idx + 1] += ay;
      this.velocities[idx + 2] += az;

      if (this.windForce.lengthSq() > 0.001) {
        this.velocities[idx] += this.windForce.x * (0.8 + Math.random() * 0.4);
        this.velocities[idx + 1] += this.windForce.y * (0.8 + Math.random() * 0.4);
        this.velocities[idx + 2] += this.windForce.z * (0.8 + Math.random() * 0.4);
      }

      this.velocities[idx] *= friction;
      this.velocities[idx + 1] *= friction;
      this.velocities[idx + 2] *= friction;

      const boundX = 8.0;
      const boundY = 6.0;
      const boundaryForce = 0.05;
      
      if (positions[idx] > boundX) this.velocities[idx] -= boundaryForce;
      if (positions[idx] < -boundX) this.velocities[idx] += boundaryForce;
      if (positions[idx + 1] > boundY) this.velocities[idx + 1] -= boundaryForce;
      if (positions[idx + 1] < -boundY) this.velocities[idx + 1] += boundaryForce;

      positions[idx] += this.velocities[idx];
      positions[idx + 1] += this.velocities[idx + 1];
      positions[idx + 2] += this.velocities[idx + 2];
    }

    this.geometry.attributes.position.needsUpdate = true;
    this.windForce.multiplyScalar(0.9);
  }
}
