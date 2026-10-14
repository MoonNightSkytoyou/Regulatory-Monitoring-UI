<script setup lang="ts">
import { watch, onUnmounted } from 'vue';
import { AlertTriangle, CheckCircle2, Info, XCircle, X } from 'lucide-vue-next';

export interface ToastMessage {
  id: string;
  title: string;
  message?: string;
  type?: 'success' | 'info' | 'warning' | 'error';
  duration?: number;
}

const props = defineProps<{
  toasts: ToastMessage[];
}>();

const emit = defineEmits<{
  (e: 'remove', id: string): void;
}>();

// Map tracking active timers for safety auto-dismissal
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

const scheduleAutoDismiss = (toast: ToastMessage) => {
  if (activeTimers.has(toast.id)) return;
  const timeoutMs = toast.duration ?? 4500;
  if (timeoutMs > 0) {
    const timer = setTimeout(() => {
      activeTimers.delete(toast.id);
      emit('remove', toast.id);
    }, timeoutMs);
    activeTimers.set(toast.id, timer);
  }
};

watch(
  () => props.toasts,
  (newToasts) => {
    newToasts.forEach(scheduleAutoDismiss);
  },
  { deep: true, immediate: true }
);

// Clean up timers on unmount
onUnmounted(() => {
  activeTimers.forEach((timer) => clearTimeout(timer));
  activeTimers.clear();
});
</script>

<template>
  <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
    <div
      v-for="toast in toasts"
      :key="toast.id"
      class="pointer-events-auto p-4 rounded-xl border shadow-lg bg-white flex items-start gap-3 transition-all duration-200 animate-in slide-in-from-bottom-5"
      :class="{
        'border-emerald-200 bg-emerald-50/90 text-emerald-900': toast.type === 'success',
        'border-amber-200 bg-amber-50/90 text-amber-900': toast.type === 'warning',
        'border-red-200 bg-red-50/90 text-red-900': toast.type === 'error',
        'border-blue-200 bg-blue-50/90 text-blue-900': !toast.type || toast.type === 'info',
      }"
    >
      <div class="shrink-0 mt-0.5">
        <CheckCircle2 v-if="toast.type === 'success'" class="w-4 h-4 text-emerald-600" />
        <AlertTriangle v-else-if="toast.type === 'warning'" class="w-4 h-4 text-amber-600" />
        <XCircle v-else-if="toast.type === 'error'" class="w-4 h-4 text-red-600" />
        <Info v-else class="w-4 h-4 text-blue-600" />
      </div>

      <div class="flex-1 min-w-0">
        <div class="text-xs sm:text-sm font-bold leading-tight">{{ toast.title }}</div>
        <div v-if="toast.message" class="text-xs opacity-80 mt-1 leading-normal">{{ toast.message }}</div>
      </div>

      <button
        @click="emit('remove', toast.id)"
        class="shrink-0 text-neutral-400 hover:text-neutral-700 p-1 rounded-md hover:bg-black/5 transition-colors cursor-pointer"
      >
        <X class="w-3.5 h-3.5" />
      </button>
    </div>
  </div>
</template>
