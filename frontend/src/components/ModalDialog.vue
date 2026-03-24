<template>
  <Teleport to="body">
    <Transition name="modal-overlay">
      <div v-if="visible" class="ui-modal-overlay" @click="handleOverlayClick">
        <Transition name="modal">
          <div v-if="visible" class="ui-modal" @click.stop>
            <div class="ui-modal-header">{{ title }}</div>
            <div class="ui-modal-body">{{ content }}</div>
            <div class="ui-modal-footer">
              <button
                v-if="showCancel"
                class="ui-btn ui-btn-default"
                @click="handleCancel"
              >
                {{ cancelText }}
              </button>
              <button
                class="ui-btn ui-btn-primary"
                @click="handleConfirm"
              >
                {{ confirmText }}
              </button>
            </div>
          </div>
        </Transition>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref } from 'vue'

const visible = ref(false)
const title = ref('提示')
const content = ref('')
const showCancel = ref(false)
const confirmText = ref('确定')
const cancelText = ref('取消')
let resolvePromise = null

const open = (options = {}) => {
  title.value = options.title || '提示'
  content.value = options.content || ''
  showCancel.value = options.showCancel || false
  confirmText.value = options.confirmText || '确定'
  cancelText.value = options.cancelText || '取消'
  visible.value = true
  return new Promise((resolve) => {
    resolvePromise = resolve
  })
}

const handleConfirm = () => {
  visible.value = false
  if (resolvePromise) resolvePromise(true)
}

const handleCancel = () => {
  visible.value = false
  if (resolvePromise) resolvePromise(false)
}

const handleOverlayClick = () => {
  if (showCancel.value) {
    handleCancel()
  } else {
    handleConfirm()
  }
}

defineExpose({ open })
</script>

<style scoped>
.ui-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  z-index: 10001;
  display: flex;
  justify-content: center;
  align-items: center;
}

.ui-modal {
  background: rgba(20, 20, 30, 0.95);
  border: 1px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  width: 90%;
  max-width: 400px;
  box-shadow: 0 0 20px rgba(0, 255, 255, 0.2);
  overflow: hidden;
  color: #fff;
}

.ui-modal-header {
  padding: 16px 20px;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: #00e5ff;
}

.ui-modal-body {
  padding: 20px;
  font-size: 15px;
  line-height: 1.5;
  color: #e0e0e0;
}

.ui-modal-footer {
  padding: 16px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  background: rgba(0, 0, 0, 0.2);
}

.ui-btn {
  padding: 8px 20px;
  border-radius: 6px;
  border: none;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: 500;
}

.ui-btn-default {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.ui-btn-default:hover {
  background: rgba(255, 255, 255, 0.2);
}

.ui-btn-primary {
  background: linear-gradient(135deg, #00e5ff 0%, #0099cc 100%);
  color: #000;
  font-weight: bold;
}

.ui-btn-primary:hover {
  box-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
  transform: translateY(-1px);
}

.ui-btn:active {
  transform: translateY(1px);
}

.modal-overlay-enter-active,
.modal-overlay-leave-active {
  transition: opacity 0.3s ease;
}

.modal-overlay-enter-from,
.modal-overlay-leave-to {
  opacity: 0;
}

.modal-enter-active,
.modal-leave-active {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from,
.modal-leave-to {
  transform: scale(0.9);
}
</style>
