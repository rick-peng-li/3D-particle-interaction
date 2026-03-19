class HandTracker {
    constructor(videoElement, onGesture, onInteraction) {
        this.video = videoElement;
        this.onGesture = onGesture;
        this.onInteraction = onInteraction;
        
        this.hands = new Hands({
            locateFile: (file) => {
                return `https://unpkg.com/@mediapipe/hands/${file}`;
            }
        });
        
        this.hands.setOptions({
            maxNumHands: 1,
            modelComplexity: 1,
            minDetectionConfidence: 0.6,
            minTrackingConfidence: 0.5
        });
        
        this.hands.onResults(this.onResults.bind(this));
        
        this.camera = new Camera(this.video, {
            onFrame: async () => {
                await this.hands.send({ image: this.video });
            },
            width: 640,
            height: 480
        });
        
        this.lastPalmPos = null;
        this.lastTimestamp = 0;
        this.currentGesture = 'sphere';
        this.gestureHistory = [];
        this.palmHistory = [];
        this.lastArea = 0.1;
    }
    
    start() {
        this.camera.start()
            .then(() => {
                const loader = document.getElementById('loading');
                if (loader) loader.style.display = 'none';
            })
            .catch(err => {
                const translatedMsg = UI.translateError(err);
                UI.alert(translatedMsg, "摄像头启动失败");
            });
    }
    
    onResults(results) {
        if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            const rawGesture = this.detectGesture(landmarks);
            const gesture = this.stabilizeGesture(rawGesture);
            
            if (gesture && gesture !== this.currentGesture) {
                this.currentGesture = gesture;
                this.onGesture(gesture);
                this.interactionCooldown = 20;
                
                const uiName = {
                    'sphere': '🖐 张手 (球体)',
                    'text': '✌ 剪刀手 (Dyf)',
                    'ring': '✊ 握拳 (圆环)',
                    'star': '☝ 食指 (星星)',
                    'heart': '👍 拇指 (爱心)'
                }[gesture] || gesture;
                
                const el = document.getElementById('gesture-name');
                if (el) el.innerText = uiName;
            }
            
            if (this.interactionCooldown > 0) {
                this.interactionCooldown--;
                const palm = landmarks[9];
                this.lastPalmPos = { x: palm.x, y: palm.y };
                this.lastTimestamp = performance.now();
            } else {
                this.processInteraction(landmarks);
            }
        }
    }
    
    stabilizeGesture(gesture) {
        if (!gesture) return null;
        this.gestureHistory.push(gesture);
        if (this.gestureHistory.length > 5) this.gestureHistory.shift();
        
        const counts = {};
        this.gestureHistory.forEach(g => counts[g] = (counts[g] || 0) + 1);
        
        if (counts[gesture] >= 3) return gesture;
        return null;
    }
    
    detectGesture(landmarks) {
        const wrist = landmarks[0];
        
        const isExtended = (tipIdx, pipIdx) => {
            return this.dist(landmarks[tipIdx], wrist) > this.dist(landmarks[pipIdx], wrist) * 1.0;
        };
        
        const thumbExtended = this.dist(landmarks[4], wrist) > this.dist(landmarks[3], wrist) * 1.0;
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
    }
    
    processInteraction(landmarks) {
        const palm = landmarks[9];
        const now = performance.now();
        
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        for (let p of landmarks) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        
        const width = maxX - minX;
        const height = maxY - minY;
        let rawArea = width * height;
        const alpha = 0.1;
        this.lastArea = this.lastArea + (rawArea - this.lastArea) * alpha;
        const area = this.lastArea;
        
        let velocity = { x: 0, y: 0, z: 0 };
        
        if (this.lastPalmPos) {
            const dt = (now - this.lastTimestamp) / 1000;
            if (dt > 0.01) {
                const scale = 50.0;
                let dx = (palm.x - this.lastPalmPos.x) * scale;
                let dy = -(palm.y - this.lastPalmPos.y) * scale;
                
                if (Math.abs(dx) < 2.0) dx = 0;
                if (Math.abs(dy) < 2.0) dy = 0;
                
                velocity = { x: dx / dt, y: dy / dt, z: 0 };
                
                this.palmHistory.push({ x: palm.x, y: palm.y });
                if (this.palmHistory.length > 6) this.palmHistory.shift();
                
                const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
                if (speed > 30.0) {
                    if (this.palmHistory.length >= 2) {
                        const oldest = this.palmHistory[0];
                        const dispX = (palm.x - oldest.x) * scale;
                        const dispY = (palm.y - oldest.y) * scale;
                        const totalDisp = Math.sqrt(dispX * dispX + dispY * dispY);
                        if (totalDisp < 5.0) {
                            velocity = { x: 0, y: 0, z: 0 };
                        }
                    }
                }
            }
        }
        
        this.lastPalmPos = { x: palm.x, y: palm.y };
        this.lastTimestamp = now;
        
        this.onInteraction({
            velocity: velocity,
            area: area
        });
    }
    
    dist(p1, p2) {
        return Math.sqrt(
            Math.pow(p1.x - p2.x, 2) +
            Math.pow(p1.y - p2.y, 2) +
            Math.pow(p1.z - p2.z, 2)
        );
    }
}
