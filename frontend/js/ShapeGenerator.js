const ShapeGenerator = {
    count: 16000,
    getRandomSpherePoint(radius) {
        const u = Math.random();
        const v = Math.random();
        const theta = 2 * Math.PI * u;
        const phi = Math.acos(2 * v - 1);
        const r = Math.cbrt(Math.random()) * radius;
        const sinPhi = Math.sin(phi);
        return {
            x: r * sinPhi * Math.cos(theta),
            y: r * sinPhi * Math.sin(theta),
            z: r * Math.cos(phi)
        };
    },
    generateSphere(radius = 2) {
        const positions = new Float32Array(this.count * 3);
        for (let i = 0; i < this.count; i++) {
            const phi = Math.acos(-1 + (2 * i) / this.count);
            const theta = Math.sqrt(this.count * Math.PI) * phi;
            const r = radius + (Math.random() - 0.5) * 0.2;
            positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = r * Math.cos(phi);
        }
        return positions;
    },
    generateTorus(radius = 1.5, tube = 0.6) {
        const positions = new Float32Array(this.count * 3);
        for (let i = 0; i < this.count; i++) {
            const u = Math.random() * Math.PI * 2;
            const v = Math.random() * Math.PI * 2;
            positions[i * 3] = (radius + tube * Math.cos(v)) * Math.cos(u);
            positions[i * 3 + 1] = (radius + tube * Math.cos(v)) * Math.sin(u);
            positions[i * 3 + 2] = tube * Math.sin(v);
        }
        return positions;
    },
    generateHeart(scale = 0.15) {
        const positions = new Float32Array(this.count * 3);
        for (let i = 0; i < this.count; i++) {
            const t = Math.random() * Math.PI * 2;
            const r = 1 - Math.abs(Math.random() - 0.5) * 0.5;
            const x = 16 * Math.pow(Math.sin(t), 3);
            const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            const z = (Math.random() - 0.5) * 10;
            positions[i * 3] = x * scale * r;
            positions[i * 3 + 1] = y * scale * r;
            positions[i * 3 + 2] = z * scale;
        }
        return positions;
    },
    generateStar(outerRadius = 2.5, innerRadius = 1.0, thickness = 0.5) {
        return this.generateFromCanvasShape('★', outerRadius * 20);
    },
    generateText(text, size = 10) {
        return this.generateFromCanvasShape(text, 60, 2);
    },
    generateFromCanvasShape(text, fontSize, densityFactor = 1) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const width = 400;
        const height = 400;
        canvas.width = width;
        canvas.height = height;
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, width, height);
        ctx.fillStyle = '#ffffff';
        ctx.font = `bold ${fontSize}px "Microsoft YaHei", sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, width / 2, height / 2);
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const validPixels = [];
        for (let y = 0; y < height; y += 2) {
            for (let x = 0; x < width; x += 2) {
                if (data[(y * width + x) * 4] > 50) {
                    validPixels.push({x: x - width / 2, y: -(y - height / 2)});
                }
            }
        }
        const positions = new Float32Array(this.count * 3);
        if (validPixels.length === 0) return positions;
        for (let i = 0; i < this.count; i++) {
            const pixel = validPixels[i % validPixels.length];
            const scale = 0.05;
            positions[i * 3] = pixel.x * scale;
            positions[i * 3 + 1] = pixel.y * scale;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1.0;
        }
        return positions;
    }
};
