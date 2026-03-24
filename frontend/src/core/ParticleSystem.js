import * as THREE from 'three';
import { ShapeGenerator } from '../utils/ShapeGenerator.js';

export class ParticleSystem {
    constructor(scene) {
        this.count = 16000;
        this.scene = scene;
        this.geometry = new THREE.BufferGeometry();
        this.material = null;
        this.points = null;
        this.positions = new Float32Array(this.count * 3);
        this.velocities = new Float32Array(this.count * 3);
        this.targets = new Float32Array(this.count * 3);
        this.init();
    }

    getTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
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
            size: 0.15,
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

    setTarget(shapeType) {
        let newTargets;
        try {
            switch (shapeType) {
                case 'sphere':
                    newTargets = ShapeGenerator.generateSphere(3.5);
                    break;
                case 'text':
                    newTargets = ShapeGenerator.generateText('我是 Dyf', 150);
                    break;
                case 'ring':
                    newTargets = ShapeGenerator.generateTorus(3.0, 1.0);
                    break;
                case 'star':
                    newTargets = ShapeGenerator.generateFromCanvasShape('★', 180);
                    break;
                case 'heart':
                    newTargets = ShapeGenerator.generateHeart(0.25);
                    break;
                default:
                    newTargets = ShapeGenerator.generateSphere(3.5);
            }
            if (newTargets && newTargets.length === this.targets.length) {
                this.targets.set(newTargets);
                this.triggerTransition();
            }
        } catch (e) {
            console.error('Error setting target:', e);
        }
    }

    triggerTransition() {
        for (let i = 0; i < this.count; i++) {
            const idx = i * 3;
            const x = this.positions[idx];
            const y = this.positions[idx + 1];
            const z = this.positions[idx + 2];
            const len = Math.sqrt(x * x + y * y + z * z) + 0.001;
            const force = 0.5 + Math.random() * 0.8;
            this.velocities[idx] += (x / len) * force;
            this.velocities[idx + 1] += (y / len) * force;
            this.velocities[idx + 2] += (z / len) * force;
        }
    }

    update() {
        const positions = this.geometry.attributes.position.array;
        const spring = 0.03;
        const friction = 0.92;

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

            this.velocities[idx] *= friction;
            this.velocities[idx + 1] *= friction;
            this.velocities[idx + 2] *= friction;

            positions[idx] += this.velocities[idx];
            positions[idx + 1] += this.velocities[idx + 1];
            positions[idx + 2] += this.velocities[idx + 2];
        }

        this.geometry.attributes.position.needsUpdate = true;
    }
}
