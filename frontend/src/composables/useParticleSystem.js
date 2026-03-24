import * as THREE from 'three'
import { ref, onUnmounted, shallowRef } from 'vue'
import { useShapeGenerator, PARTICLE_COUNT } from './useShapeGenerator'

export function useParticleSystem(containerRef) {
  const { generateSphere, generateTorus, generateHeart, generateStar, generateText } = useShapeGenerator()
  
  // Use shallowRef for Three.js objects to avoid Vue reactivity issues
  const scene = shallowRef(null)
  const camera = shallowRef(null)
  const renderer = shallowRef(null)
  const particleSystem = shallowRef(null)
  const animationId = ref(null)
  const isInitialized = ref(false)
  
  // Particle physics state - use plain variables for performance
  let positions = null
  let velocities = null
  let targetPositions = null
  
  const init = () => {
    if (!containerRef.value) return
    
    // Scene setup
    scene.value = new THREE.Scene()
    
    // Camera setup
    camera.value = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    )
    camera.value.position.z = 5
    
    // Renderer setup
    renderer.value = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.value.setSize(window.innerWidth, window.innerHeight)
    renderer.value.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    containerRef.value.appendChild(renderer.value.domElement)
    
    // Initialize particle system
    createParticleSystem()
    
    // Handle resize
    window.addEventListener('resize', handleResize)
    
    isInitialized.value = true
  }
  
  const createParticleSystem = () => {
    const geometry = new THREE.BufferGeometry()
    
    // Initialize positions as plain arrays for better performance
    positions = new Float32Array(PARTICLE_COUNT * 3)
    velocities = new Float32Array(PARTICLE_COUNT * 3)
    targetPositions = new Float32Array(PARTICLE_COUNT * 3)
    const colors = new Float32Array(PARTICLE_COUNT * 3)
    
    // Generate initial sphere shape
    const spherePositions = generateSphere(2)
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      positions[i * 3] = spherePositions[i * 3]
      positions[i * 3 + 1] = spherePositions[i * 3 + 1]
      positions[i * 3 + 2] = spherePositions[i * 3 + 2]
      
      targetPositions[i * 3] = spherePositions[i * 3]
      targetPositions[i * 3 + 1] = spherePositions[i * 3 + 1]
      targetPositions[i * 3 + 2] = spherePositions[i * 3 + 2]
      
      velocities[i * 3] = 0
      velocities[i * 3 + 1] = 0
      velocities[i * 3 + 2] = 0
      
      // Cyan color with variations
      colors[i * 3] = 0.0 + Math.random() * 0.2
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2
      colors[i * 3 + 2] = 1.0
    }
    
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    
    // Create shader material for particles
    const material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: 0.8
    })
    
    particleSystem.value = new THREE.Points(geometry, material)
    scene.value.add(particleSystem.value)
  }
  
  const morphToShape = (shapeType) => {
    if (!particleSystem.value) return
    
    let newPositions
    switch (shapeType) {
      case 'sphere':
        newPositions = generateSphere(2)
        break
      case 'torus':
        newPositions = generateTorus(1.5, 0.6)
        break
      case 'heart':
        newPositions = generateHeart(0.15)
        break
      case 'star':
        newPositions = generateStar(2.5)
        break
      case 'text':
        newPositions = generateText('我是 Dyf', 10)
        break
      default:
        newPositions = generateSphere(2)
    }
    
    // Apply explosion effect before morphing
    explodeParticles()
    
    // Set new target positions
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      targetPositions[i * 3] = newPositions[i * 3]
      targetPositions[i * 3 + 1] = newPositions[i * 3 + 1]
      targetPositions[i * 3 + 2] = newPositions[i * 3 + 2]
    }
  }
  
  const explodeParticles = () => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      velocities[i * 3] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 1] = (Math.random() - 0.5) * 0.5
      velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.5
    }
  }
  
  const applyWindForce = (forceX, forceY) => {
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      velocities[i * 3] += forceX * (0.5 + Math.random() * 0.5)
      velocities[i * 3 + 1] += forceY * (0.5 + Math.random() * 0.5)
    }
  }
  
  const updateScale = (scale) => {
    if (particleSystem.value) {
      particleSystem.value.scale.setScalar(scale)
    }
  }
  
  const animate = () => {
    if (!isInitialized.value) return
    
    animationId.value = requestAnimationFrame(animate)
    
    const positionArray = particleSystem.value.geometry.attributes.position.array
    
    // Update particle positions with physics
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3
      
      // Apply velocity
      positionArray[idx] += velocities[idx]
      positionArray[idx + 1] += velocities[idx + 1]
      positionArray[idx + 2] += velocities[idx + 2]
      
      // Spring force towards target
      const springStrength = 0.05
      velocities[idx] += (targetPositions[idx] - positionArray[idx]) * springStrength
      velocities[idx + 1] += (targetPositions[idx + 1] - positionArray[idx + 1]) * springStrength
      velocities[idx + 2] += (targetPositions[idx + 2] - positionArray[idx + 2]) * springStrength
      
      // Damping
      velocities[idx] *= 0.95
      velocities[idx + 1] *= 0.95
      velocities[idx + 2] *= 0.95
    }
    
    particleSystem.value.geometry.attributes.position.needsUpdate = true
    
    // Rotate particle system slowly
    particleSystem.value.rotation.y += 0.002
    particleSystem.value.rotation.x += 0.001
    
    renderer.value.render(scene.value, camera.value)
  }
  
  const handleResize = () => {
    if (!camera.value || !renderer.value) return
    
    camera.value.aspect = window.innerWidth / window.innerHeight
    camera.value.updateProjectionMatrix()
    renderer.value.setSize(window.innerWidth, window.innerHeight)
  }
  
  const startAnimation = () => {
    animate()
  }
  
  const stopAnimation = () => {
    if (animationId.value) {
      cancelAnimationFrame(animationId.value)
      animationId.value = null
    }
  }
  
  const dispose = () => {
    stopAnimation()
    window.removeEventListener('resize', handleResize)
    
    if (renderer.value) {
      renderer.value.dispose()
      if (containerRef.value && renderer.value.domElement) {
        containerRef.value.removeChild(renderer.value.domElement)
      }
    }
    
    if (particleSystem.value) {
      particleSystem.value.geometry.dispose()
      particleSystem.value.material.dispose()
    }
    
    isInitialized.value = false
  }
  
  onUnmounted(() => {
    dispose()
  })
  
  return {
    init,
    startAnimation,
    stopAnimation,
    dispose,
    morphToShape,
    applyWindForce,
    updateScale,
    isInitialized
  }
}
