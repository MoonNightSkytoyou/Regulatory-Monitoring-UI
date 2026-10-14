<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  Radio,
  Building2,
  ClipboardList,
  SlidersHorizontal,
  ChevronRight,
  Pin,
} from 'lucide-vue-next';

export type MainNavView = 'news-feed' | 'regulator' | 'tasks';

const props = withDefaults(
  defineProps<{
    activeView: string;
    isExpanded?: boolean;
  }>(),
  {
    isExpanded: undefined,
  }
);

const emit = defineEmits<{
  (e: 'selectView', view: MainNavView): void;
  (e: 'navigate', view: MainNavView): void;
  (e: 'openScopeConfig'): void;
  (e: 'expandedChange', expanded: boolean): void;
}>();

const isHovered = ref(false);
const isPinned = ref(false);

const effectiveExpanded = computed(() => {
  if (isPinned.value) return true;
  if (isHovered.value) return true;
  if (props.isExpanded !== undefined) return props.isExpanded;
  return false;
});

watch([isHovered, isPinned], () => {
  emit('expandedChange', isHovered.value || isPinned.value);
});

const navItems = [
  {
    id: 'news-feed' as MainNavView,
    label: 'News Feed',
    icon: Radio,
  },
  {
    id: 'regulator' as MainNavView,
    label: 'Regulator',
    icon: Building2,
  },
  {
    id: 'tasks' as MainNavView,
    label: 'Tasks',
    icon: ClipboardList,
  },
];

const handleNavClick = (viewId: MainNavView) => {
  emit('selectView', viewId);
  emit('navigate', viewId);
};
</script>

<template>
  <aside
    id="monitor-global-sidebar"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    :style="{
      width: effectiveExpanded ? '16rem' : '4rem',
      transition: 'width 300ms cubic-bezier(0.4, 0, 0.2, 1)',
      willChange: 'width',
    }"
    class="monitor-sidebar relative shrink-0 h-full bg-white border-r border-neutral-200 flex flex-col z-20 select-none overflow-hidden"
  >
    <!-- Brand Header -->
    <div class="h-16 flex items-center px-3.5 border-b border-neutral-100 shrink-0">
      <div class="flex items-center gap-3 overflow-hidden w-full">
        <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-xs text-white">
          <svg
            class="w-5 h-5 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>

        <div v-if="effectiveExpanded" class="flex-1 min-w-0 transition-opacity duration-200">
          <h1 class="text-sm font-bold text-neutral-900 leading-tight truncate">
            Monitor
          </h1>
          <p class="text-xs text-neutral-500 truncate">
            Wizpresso Regulatory
          </p>
        </div>

        <button
          v-if="effectiveExpanded"
          @click="isPinned = !isPinned"
          :title="isPinned ? 'Unpin sidebar' : 'Pin sidebar'"
          :class="`p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer ${
            isPinned ? 'text-blue-600 bg-blue-50' : ''
          }`"
        >
          <Pin class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- Main Navigation Items -->
    <div class="flex-1 flex flex-col min-h-0 py-3 px-2 overflow-y-auto">
      <div class="space-y-1 shrink-0">
        <button
          v-for="item in navItems"
          :key="item.id"
          :id="`nav-item-${item.id}`"
          @click="handleNavClick(item.id)"
          :class="`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all relative group cursor-pointer ${
            activeView === item.id
              ? 'bg-blue-50 text-blue-600 font-semibold shadow-2xs'
              : 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900'
          }`"
          :title="!effectiveExpanded ? item.label : undefined"
        >
          <component
            :is="item.icon"
            :class="`w-5 h-5 shrink-0 transition-colors ${
              activeView === item.id ? 'text-blue-600' : 'text-neutral-500 group-hover:text-neutral-800'
            }`"
          />

          <span v-if="effectiveExpanded" class="truncate flex-1 text-left text-xs sm:text-sm font-medium">
            {{ item.label }}
          </span>
        </button>
      </div>
    </div>

    <!-- Bottom Configuration Shortcut -->
    <div class="p-2 border-t border-neutral-100 shrink-0">
      <button
        id="btn-open-scope-config-sidebar"
        @click="emit('openScopeConfig')"
        class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition-colors group cursor-pointer"
        :title="!effectiveExpanded ? 'Watchlist Search & Scope' : undefined"
      >
        <SlidersHorizontal class="w-5 h-5 text-neutral-500 group-hover:text-blue-600 shrink-0" />
        <div v-if="effectiveExpanded" class="flex items-center justify-between flex-1 truncate">
          <span class="text-neutral-700 font-medium">Watchlist Search</span>
          <ChevronRight class="w-3.5 h-3.5 text-neutral-400" />
        </div>
      </button>
    </div>
  </aside>
</template>
