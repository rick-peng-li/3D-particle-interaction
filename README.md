# WebAR 粒子互动系统 (WebAR Particle Interactive System)

## 🛠 技术栈
- **Frontend**: Three.js + MediaPipe Hands (HTML/CSS/JS)
- **Infrastructure**: Docker / Node.js / Python

## ✨ 功能特性
- **16,000 青色流体粒子**: 极致丝滑的视觉体验。
- **WebAR 手势互动**: 基于 MediaPipe Hands 的实时手势识别。
- **五态手势变形**:
  - 🖐 张手 -> 球体
  - ✌ 剪刀手 -> "我是 Dyf" 文字
  - ✊ 握拳 -> 圆环
  - ☝ 食指 -> 星星 (Star)
  - 👍 拇指 -> 爱心 (Heart)
- **物理反馈**:
  - **挥手风暴**: 快速挥手产生物理风力吹散粒子（含防误触位移检测）。
  - **深度推拉**: 根据手掌远近（屏幕占比）实时缩放粒子系统。
  - **爆炸过渡**: 切换形状时带有爆炸特效。

## 🚀 启动指南 (How to Run)

### 方式 1: Docker (推荐)
确保 Docker 已安装。
```bash
docker-compose up -d --build
```
访问: http://localhost:3000

### 方式 2: Node.js
使用 `http-server` 快速启动。
```bash
npx http-server frontend -p 3000 --cors
```
访问: http://localhost:3000

### 方式 3: Python
如果你安装了 Python 3。
```bash
cd frontend
python -m http.server 3000
```
访问: http://localhost:3000

### 方式 4: 直接运行（不推荐）
直接用浏览器打开 `frontend/index.html` 文件。

**⚠️ 常见问题**:
- **摄像头无法启动**: 现代浏览器（如 Chrome）出于安全考虑，通常只允许在 HTTPS 或 `localhost` 环境下调用摄像头（MediaDevices API），`file://` 协议下通常会被直接拦截。
- **CORS 跨域错误**: 可能会遇到 `Access to script ... from origin 'null' has been blocked by CORS policy` 错误，导致 ES Modules 或 MediaPipe 的 Web Worker 无法加载，页面会一直卡在 Loading 状态。

**建议**: 请务必使用上述 Docker、Node.js 或 Python 启动本地服务器以获得完整体验。

## 🔗 服务地址
- 主页: http://localhost:3000

## ⚠️ 注意事项
- 项目需要调用**摄像头权限**，请允许浏览器访问摄像头。
- 建议使用 Chrome 或 Edge 浏览器以获得最佳 WebGL 性能。
- 首次加载 MediaPipe 模型可能需要几秒钟，请耐心等待。
