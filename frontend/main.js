let scene, camera, renderer;
let particles;
let handTracker;
let lastTime = 0;
let frameCount = 0;
let lastFpsTime = 0;

function init() {
    const container = document.body;
    scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x000000, 0.03);
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 15;
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    particles = new ParticleSystem(scene);
    const video = document.querySelector('.input_video');
    handTracker = new HandTracker(
        video,
        (gesture) => {
            particles.setTarget(gesture);
        },
        (interaction) => {
            if (interaction.velocity) {
                const v3 = new THREE.Vector3(interaction.velocity.x, interaction.velocity.y, 0);
                particles.triggerStorm(v3);
            }
            if (interaction.area) {
                particles.setDepthScale(interaction.area);
            }
        }
    );
    handTracker.start();
    animate();
    window.addEventListener('resize', onWindowResize, false);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate(time) {
    requestAnimationFrame(animate);
    const dt = time - lastTime;
    lastTime = time;
    particles.update();
    renderer.render(scene, camera);
    frameCount++;
    if (time - lastFpsTime >= 1000) {
        const fps = Math.round((frameCount * 1000) / (time - lastFpsTime));
        const fpsEl = document.getElementById('fps');
        if (fpsEl) fpsEl.innerText = fps;
        frameCount = 0;
        lastFpsTime = time;
    }
}

window.onload = init;
