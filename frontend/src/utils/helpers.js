export const gestureNames = {
    'sphere': '🖐 张手 (球体)',
    'text': '✌ 剪刀手 (Dyf)',
    'ring': '✊ 握拳 (圆环)',
    'star': '☝ 食指 (星星)',
    'heart': '👍 拇指 (爱心)'
};

export function translateError(error) {
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
