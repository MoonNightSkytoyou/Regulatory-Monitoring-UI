<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check, Search, X } from 'lucide-vue-next';

interface ComboboxFilterProps {
  id?: string;
  label: string;
  options: readonly string[] | string[];
  selectedValues: string[];
  placeholder?: string;
  className?: string;
  badgeColor?: 'blue' | 'emerald' | 'indigo';
}

const props = withDefaults(defineProps<ComboboxFilterProps>(), {
  placeholder: 'All',
  className: '',
  badgeColor: 'blue',
});

const emit = defineEmits<{
  (e: 'update:selectedValues', value: string[]): void;
  (e: 'change', value: string[]): void;
}>();

const isOpen = ref(false);
const searchQuery = ref('');
const containerRef = ref<HTMLDivElement | null>(null);

const handleClickOutside = (event: MouseEvent) => {
  if (containerRef.value && !containerRef.value.contains(event.target as Node)) {
    isOpen.value = false;
  }
};

onMounted(() => {
  document.addEventListener('mousedown', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('mousedown', handleClickOutside);
});

const filteredOptions = computed(() => {
  return props.options.filter((opt) =>
    opt.toLowerCase().includes(searchQuery.value.toLowerCase())
  );
});

const toggleOption = (option: string) => {
  let updated: string[];
  if (props.selectedValues.includes(option)) {
    updated = props.selectedValues.filter((v) => v !== option);
  } else {
    updated = [...props.selectedValues, option];
  }
  emit('update:selectedValues', updated);
  emit('change', updated);
};

const handleSelectAll = () => {
  const updated = [...props.options];
  emit('update:selectedValues', updated);
  emit('change', updated);
};

const handleClear = () => {
  emit('update:selectedValues', []);
  emit('change', []);
};

const isAllSelected = computed(
  () => props.options.length > 0 && props.selectedValues.length === props.options.length
);
const isNoneSelected = computed(() => props.selectedValues.length === 0);
</script>

<template>
  <div ref="containerRef" :class="`relative ${className ? className : 'w-full'}`" :id="id">
    <button
      type="button"
      @click="isOpen = !isOpen"
      :class="`w-full h-8 px-3 bg-white rounded-lg border text-xs font-normal transition-all flex items-center justify-between gap-2 cursor-pointer select-none ${
        isOpen
          ? 'border-neutral-900 ring-1 ring-neutral-900 text-neutral-900'
          : selectedValues.length > 0
          ? 'border-neutral-300 bg-neutral-50/60 text-neutral-900'
          : 'border-neutral-200 hover:border-neutral-300 text-neutral-800'
      }`"
    >
      <div class="flex items-center gap-2 min-w-0 truncate">
        <slot name="icon" />
        <!-- If nothing is selected, display placeholder directly without Label prefix -->
        <template v-if="isNoneSelected">
          <span class="text-neutral-600 font-normal truncate">{{ placeholder }}</span>
        </template>
        <!-- If all options are selected, display placeholder or Label: All -->
        <template v-else-if="isAllSelected">
          <span class="text-neutral-600 font-normal truncate">{{ placeholder || `All ${label}` }}</span>
        </template>
        <!-- If 1 item selected: Label : Value -->
        <template v-else-if="selectedValues.length === 1">
          <span class="text-neutral-900 font-semibold shrink-0">{{ label }} :</span>
          <span class="truncate font-semibold text-neutral-900">{{ selectedValues[0] }}</span>
        </template>
        <!-- If multiple items selected: Label : N selected -->
        <template v-else>
          <span class="text-neutral-900 font-semibold shrink-0">{{ label }} :</span>
          <span class="truncate font-semibold text-neutral-900">{{ selectedValues.length }} selected</span>
        </template>
      </div>

      <div class="flex items-center gap-1.5 shrink-0">
        <span
          v-if="selectedValues.length > 0"
          class="bg-blue-600 text-white text-[11px] font-semibold rounded-full min-w-4 h-4 px-1 flex items-center justify-center shrink-0"
        >
          {{ selectedValues.length }}
        </span>
        <ChevronDown
          :class="`w-3.5 h-3.5 text-neutral-400 transition-transform duration-150 shrink-0 ${
            isOpen ? 'rotate-180 text-neutral-900' : ''
          }`"
        />
      </div>
    </button>

    <!-- Dropdown Menu -->
    <div
      v-if="isOpen"
      class="absolute z-50 mt-1.5 min-w-[240px] max-w-[320px] bg-white rounded-lg shadow-lg border border-neutral-200 py-1 animate-in fade-in zoom-in-95 duration-100"
    >
      <!-- Search Input -->
      <div v-if="options.length > 6" class="px-2 pb-1.5 border-b border-neutral-100">
        <div class="relative flex items-center">
          <Search class="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 pointer-events-none" />
          <input
            type="text"
            v-model="searchQuery"
            placeholder="Filter options..."
            class="w-full pl-8 pr-7 py-1 text-xs bg-neutral-50 border border-neutral-200 rounded-md focus:outline-none focus:border-neutral-900 focus:bg-white text-neutral-900"
          />
          <button
            v-if="searchQuery"
            type="button"
            @click="searchQuery = ''"
            class="absolute right-2 text-neutral-400 hover:text-neutral-600"
          >
            <X class="w-3 h-3" />
          </button>
        </div>
      </div>

      <!-- Quick Action Buttons -->
      <div class="flex items-center justify-between px-3 py-1.5 text-xs text-neutral-500 border-b border-neutral-100 bg-neutral-50/50">
        <button
          type="button"
          @click="handleSelectAll"
          class="hover:text-neutral-900 font-semibold cursor-pointer transition-colors"
        >
          Select All
        </button>
        <button
          type="button"
          @click="handleClear"
          class="hover:text-rose-600 font-normal cursor-pointer transition-colors"
        >
          Clear
        </button>
      </div>

      <!-- Options List -->
      <div class="max-h-60 overflow-y-auto py-1">
        <template v-if="filteredOptions.length === 0">
          <div class="px-3 py-4 text-center text-xs text-neutral-400">
            No matching options
          </div>
        </template>
        <template v-else>
          <div
            v-for="opt in filteredOptions"
            :key="opt"
            @click="toggleOption(opt)"
            class="flex items-center gap-2.5 px-3 py-1.5 text-xs cursor-pointer hover:bg-neutral-50 transition-colors"
          >
            <div
              :class="`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                selectedValues.includes(opt)
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-neutral-300 bg-white'
              }`"
            >
              <Check v-if="selectedValues.includes(opt)" class="w-3 h-3 stroke-[3]" />
            </div>
            <span
              :class="`truncate ${
                selectedValues.includes(opt)
                  ? 'font-semibold text-neutral-900'
                  : 'font-normal text-neutral-800'
              }`"
            >
              {{ opt }}
            </span>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
