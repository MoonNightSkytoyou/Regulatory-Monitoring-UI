<script setup lang="ts">
import { ref, watch } from 'vue';
import { X, ClipboardList, FolderPlus } from 'lucide-vue-next';
import { useTaskStore } from '@/stores/taskStore';

const props = withDefaults(
  defineProps<{
    isOpen: boolean;
    initialTitle?: string;
    initialSummary?: string;
  }>(),
  {
    initialTitle: '',
    initialSummary: '',
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'taskCreated', taskId: string): void;
}>();

const taskStore = useTaskStore();

const taskTitle = ref(props.initialTitle || '');
const taskSummary = ref(props.initialSummary || '');
const isSubmitting = ref(false);

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      taskTitle.value = props.initialTitle || '';
      taskSummary.value = props.initialSummary || '';
    }
  }
);

const handleCreateTask = async () => {
  const title = taskTitle.value.trim();
  if (!title || isSubmitting.value) return;

  isSubmitting.value = true;
  try {
    const created = taskStore.createTask({
      title,
      summary: taskSummary.value.trim() || 'Regulatory compliance and multi-jurisdiction evaluation dossier.',
      topic: 'General Compliance',
      jurisdiction: 'Hong Kong ➔ Singapore, UK, US',
      homeJurisdiction: 'Hong Kong',
      targetJurisdictions: ['Hong Kong', 'Singapore', 'United Kingdom', 'United States'],
      rawQuestions: [],
    });

    emit('taskCreated', created.id);
    emit('close');
  } finally {
    isSubmitting.value = false;
  }
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs select-text overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-xl overflow-hidden flex flex-col my-8"
        @click.stop
      >
        <!-- Modal Header -->
        <div class="px-6 py-4.5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/70">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <FolderPlus class="w-5 h-5" />
            </div>
            <div>
              <h3 class="text-sm sm:text-base font-bold text-neutral-900">
                Create Task Container
              </h3>
              <p class="text-xs text-neutral-500">
                Organize and manage compliance question lists and multi-jurisdiction research
              </p>
            </div>
          </div>
          <button
            @click="emit('close')"
            class="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-100 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- Form Body: ONLY Task Title + Task Summary & Background Scope -->
        <form @submit.prevent="handleCreateTask" class="p-6 space-y-4.5">
          <!-- Field 1: Task Title -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-neutral-800">
              Task Title <span class="text-rose-500">*</span>
            </label>
            <input
              type="text"
              v-model="taskTitle"
              required
              autofocus
              placeholder="e.g. APAC Corporate Secretarial & TCSP Compliance Matrix"
              class="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none transition-colors"
            />
            <p class="text-[11px] text-neutral-400">
              A distinctive title identifying the compliance scope or corporate project folder.
            </p>
          </div>

          <!-- Field 2: Task Summary & Background Scope -->
          <div class="space-y-1.5">
            <label class="block text-xs font-bold text-neutral-800">
              Task Summary & Background Scope
            </label>
            <textarea
              v-model="taskSummary"
              rows="5"
              placeholder="Describe the background context, regulatory concerns, entity profile, or evaluation scope for this question list..."
              class="w-full px-3.5 py-2.5 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none transition-colors leading-relaxed font-sans"
            ></textarea>
            <p class="text-[11px] text-neutral-400">
              Provide context for internal audit and cross-border regulatory comparisons.
            </p>
          </div>

          <!-- Modal Actions Footer -->
          <div class="flex items-center justify-end gap-2.5 pt-3 border-t border-neutral-100">
            <button
              type="button"
              @click="emit('close')"
              class="px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="!taskTitle.trim() || isSubmitting"
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <ClipboardList class="w-3.5 h-3.5" />
              <span>{{ isSubmitting ? 'Creating...' : 'Create Task' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>
