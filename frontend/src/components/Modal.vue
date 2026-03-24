<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="visible" class="ui-modal-overlay show" @click.self="handleOverlayClick">
        <div class="ui-modal show">
          <div class="ui-modal-header">{{ title }}</div>
          <div class="ui-modal-body">{{ content }}</div>
          <div class="ui-modal-footer">
            <button
              v-for="(btn, index) in buttons"
              :key="index"
              :class="['ui-btn', btn.primary ? 'ui-btn-primary' : 'ui-btn-default']"
              @click="btn.onClick"
            >
              {{ btn.text }}
            </button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: '提示'
  },
  content: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'alert'
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const visible = ref(props.modelValue);
const buttons = ref([]);

watch(() => props.modelValue, (val) => {
  visible.value = val;
  if (val) {
    setupButtons();
  }
});

watch(visible, (val) => {
  emit('update:modelValue', val);
});

const setupButtons = () => {
  if (props.type === 'confirm') {
    buttons.value = [
      { text: '取消', primary: false, onClick: handleCancel },
      { text: '确定', primary: true, onClick: handleConfirm }
    ];
  } else {
    buttons.value = [
      { text: '确定', primary: true, onClick: handleConfirm }
    ];
  }
};

const handleConfirm = () => {
  visible.value = false;
  emit('confirm');
};

const handleCancel = () => {
  visible.value = false;
  emit('cancel');
};

const handleOverlayClick = () => {
  if (props.type === 'alert') {
    handleConfirm();
  }
};

const show = (content, title = '提示', type = 'alert') => {
  return new Promise((resolve) => {
    props.content = content;
    props.title = title;
    props.type = type;
    visible.value = true;
    
    const onConfirm = () => {
      emit('confirm');
      resolve(true);
    };
    
    const onCancel = () => {
      emit('cancel');
      resolve(false);
    };
    
    setupButtons();
  });
};

defineExpose({ show });
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .ui-modal,
.modal-leave-active .ui-modal {
  transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.modal-enter-from .ui-modal,
.modal-leave-to .ui-modal {
  transform: scale(0.9);
}
</style>
