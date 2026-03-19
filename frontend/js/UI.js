class UI {
    static init() {
        if (document.getElementById('ui-container')) return;
        const container = document.createElement('div');
        container.id = 'ui-container';
        container.style.position = 'fixed';
        container.style.top = '20px';
        container.style.left = '50%';
        container.style.transform = 'translateX(-50%)';
        container.style.zIndex = '10000';
        container.style.display = 'flex';
        container.style.flexDirection = 'column';
        container.style.gap = '10px';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }
    static toast(message, type = 'info', duration = 3000) {
        this.init();
        const container = document.getElementById('ui-container');
        const toast = document.createElement('div');
        toast.className = `ui-toast ui-toast-${type}`;
        toast.innerText = message;
        toast.style.background = 'rgba(20, 20, 30, 0.95)';
        toast.style.color = '#fff';
        toast.style.padding = '12px 24px';
        toast.style.borderRadius = '8px';
        toast.style.fontSize = '14px';
        toast.style.marginTop = '10px';
        toast.style.border = '1px solid rgba(0, 255, 255, 0.3)';
        toast.style.boxShadow = '0 4px 12px rgba(0,0,0,0.5)';
        toast.style.minWidth = '200px';
        toast.style.textAlign = 'center';
        toast.style.opacity = '1';
        toast.style.transition = 'all 0.3s ease';
        if (type === 'success') toast.style.borderLeft = '4px solid #00ff00';
        else if (type === 'error') toast.style.borderLeft = '4px solid #ff3333';
        else if (type === 'warning') toast.style.borderLeft = '4px solid #ffcc00';
        else toast.style.borderLeft = '4px solid #00e5ff';
        container.appendChild(toast);
        toast.style.transform = 'translateY(-20px)';
        toast.style.opacity = '0';
        toast.offsetHeight;
        toast.style.transform = 'translateY(0)';
        toast.style.opacity = '1';
        toast.classList.add('show');
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateY(-20px)';
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, duration);
    }
    static alert(message, title = '提示') {
        return new Promise((resolve) => {
            this._createModal(title, message, [
                { text: '确定', primary: true, onClick: resolve }
            ]);
        });
    }
    static confirm(message, title = '确认') {
        return new Promise((resolve) => {
            this._createModal(title, message, [
                { text: '取消', onClick: () => resolve(false) },
                { text: '确定', primary: true, onClick: () => resolve(true) }
            ]);
        });
    }
    static _createModal(title, content, buttons) {
        this.init();
        const overlay = document.createElement('div');
        overlay.className = 'ui-modal-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.background = 'rgba(0, 0, 0, 0.6)';
        overlay.style.backdropFilter = 'blur(5px)';
        overlay.style.zIndex = '10001';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.opacity = '0';
        overlay.style.transition = 'opacity 0.3s ease';
        const modal = document.createElement('div');
        modal.className = 'ui-modal';
        modal.style.background = 'rgba(20, 20, 30, 0.95)';
        modal.style.border = '1px solid rgba(0, 255, 255, 0.3)';
        modal.style.borderRadius = '12px';
        modal.style.width = '90%';
        modal.style.maxWidth = '400px';
        modal.style.boxShadow = '0 0 20px rgba(0, 255, 255, 0.2)';
        modal.style.transform = 'scale(0.9)';
        modal.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
        modal.style.overflow = 'hidden';
        modal.style.color = '#fff';
        const header = document.createElement('div');
        header.className = 'ui-modal-header';
        header.innerText = title;
        header.style.padding = '16px 20px';
        header.style.fontSize = '18px';
        header.style.fontWeight = 'bold';
        header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
        header.style.color = '#00e5ff';
        const body = document.createElement('div');
        body.className = 'ui-modal-body';
        body.innerText = content;
        body.style.padding = '20px';
        body.style.fontSize = '15px';
        body.style.lineHeight = '1.5';
        body.style.color = '#e0e0e0';
        const footer = document.createElement('div');
        footer.className = 'ui-modal-footer';
        footer.style.padding = '16px 20px';
        footer.style.display = 'flex';
        footer.style.justifyContent = 'flex-end';
        footer.style.gap = '10px';
        buttons.forEach(btn => {
            const button = document.createElement('button');
            button.className = `ui-btn ${btn.primary ? 'ui-btn-primary' : 'ui-btn-default'}`;
            button.innerText = btn.text;
            button.style.padding = '8px 20px';
            button.style.borderRadius = '6px';
            button.style.border = 'none';
            button.style.cursor = 'pointer';
            button.style.fontSize = '14px';
            button.style.transition = 'all 0.2s';
            if (btn.primary) {
                button.style.background = '#00e5ff';
                button.style.color = '#000';
                button.style.fontWeight = 'bold';
            } else {
                button.style.background = 'rgba(255, 255, 255, 0.1)';
                button.style.color = '#fff';
            }
            button.onclick = () => {
                if (btn.onClick) btn.onClick();
                overlay.style.opacity = '0';
                modal.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (overlay.parentNode) document.body.removeChild(overlay);
                }, 300);
            };
            footer.appendChild(button);
        });
        modal.appendChild(header);
        modal.appendChild(body);
        modal.appendChild(footer);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        requestAnimationFrame(() => {
            overlay.style.opacity = '1';
            modal.style.transform = 'scale(1)';
            overlay.classList.add('show');
            modal.classList.add('show');
        });
    }
    static translateError(error) {
        const msg = (error && error.message) ? error.message : String(error);
        const str = msg.toLowerCase();
        if (str.includes('permission dismissed') || str.includes('permission denied') || str.includes('notallowederror')) {
            return '用户拒绝了摄像头权限，请允许访问以继续使用。';
        }
        if (str.includes('device in use') || str.includes('notreadableerror') || str.includes('could not start video source')) {
            return '摄像头被其他应用占用，请关闭后重试。';
        }
        if (str.includes('constraintnotsatisfiederror') || str.includes('overconstrainederror')) {
            return '无法满足摄像头分辨率要求，请尝试更换设备。';
        }
        if (str.includes('notfounderror') || str.includes('devicesnotfounderror') || str.includes('no device found')) {
            return '未检测到摄像头设备，请检查连接。';
        }
        if (str.includes('failed to acquire camera feed')) {
            return '无法获取摄像头画面，可能是权限被拒绝或设备不可用。';
        }
        if (str.includes('webgl not supported')) {
            return '您的浏览器不支持 WebGL，无法渲染3D效果。';
        }
        if (str.includes('failed to fetch') || str.includes('networkerror')) {
            return '网络连接失败，请检查网络设置。';
        }
        return msg;
    }
}
document.addEventListener('DOMContentLoaded', () => UI.init());
