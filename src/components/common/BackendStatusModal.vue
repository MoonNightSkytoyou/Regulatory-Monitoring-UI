<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  Activity,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Server,
  ExternalLink,
  ChevronDown,
  X,
  Copy,
  Check,
} from 'lucide-vue-next';
import { defaultApiConfig } from '@/services/api';

const props = defineProps<{
  isOnline: boolean;
  totalAlerts: number;
  totalRegulators: number;
  totalRegulations: number;
}>();

const emit = defineEmits<{
  (e: 'retry'): void;
  (e: 'updateBaseUrl', newUrl: string): void;
}>();

const isOpen = ref(false);
const inputUrl = ref(
  localStorage.getItem('hk_monitor_custom_api_url') || defaultApiConfig.baseUrl || 'http://localhost:8050/api/v1'
);
const copied = ref(false);

const handleSaveUrl = () => {
  const clean = inputUrl.value.trim().replace(/\/$/, '');
  localStorage.setItem('hk_monitor_custom_api_url', clean);
  emit('updateBaseUrl', clean);
  isOpen.value = false;
};

const handleCopy = (text: string) => {
  navigator.clipboard.writeText(text);
  copied.value = true;
  setTimeout(() => {
    copied.value = false;
  }, 2000);
};
</script>

<template>
  <div class="relative inline-block text-xs">
    <!-- Trigger Pill -->
    <button
      @click="isOpen = !isOpen"
      :class="`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all cursor-pointer shadow-2xs font-semibold ${
        isOnline
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
          : 'bg-neutral-100 text-neutral-700 border-neutral-300 hover:bg-neutral-200'
      }`"
      :title="isOnline ? 'Live Backend API Connected (200 OK)' : 'Autonomous Mock Dataset Active - Click to diagnose or connect live API'"
    >
      <span
        :class="`w-2 h-2 rounded-full ${
          isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-blue-500'
        }`"
      />
      <span>{{ isOnline ? 'Live API (200 OK)' : 'Mock API Active' }}</span>
      <ChevronDown class="w-3 h-3 opacity-60" />
    </button>

    <!-- Diagnostics Popover Dropdown -->
    <div
      v-if="isOpen"
      class="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-neutral-200 rounded-2xl shadow-2xl p-4 z-50 text-neutral-800 animate-in fade-in zoom-in-95 duration-150"
    >
      <div class="flex items-center justify-between pb-3 border-b border-neutral-100">
        <div class="flex items-center gap-2">
          <Server class="w-4 h-4 text-neutral-600" />
          <h4 class="font-bold text-sm text-neutral-900">API Connection Diagnoser</h4>
        </div>
        <button
          @click="isOpen = false"
          class="p-1 text-neutral-400 hover:text-neutral-700 rounded-lg transition-colors cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
      </div>

      <!-- Current Status -->
      <div class="mt-3 p-3 rounded-xl bg-neutral-50 border border-neutral-200/80 space-y-2">
        <div class="flex items-center justify-between text-xs">
          <span class="text-neutral-500">Connection State</span>
          <span
            :class="`font-bold flex items-center gap-1 ${
              isOnline ? 'text-emerald-600' : 'text-blue-600'
            }`"
          >
            <CheckCircle2 v-if="isOnline" class="w-3.5 h-3.5" />
            <CheckCircle2 v-else class="w-3.5 h-3.5 text-blue-600" />
            {{ isOnline ? 'Online (Live Backend 200 OK)' : 'Mock Engine (Standalone Active)' }}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs">
          <span class="text-neutral-500">Configured Base URL</span>
          <span class="font-mono text-[11px] text-neutral-800 truncate max-w-[180px]" :title="inputUrl">
            {{ inputUrl }}
          </span>
        </div>

        <div class="flex items-center justify-between text-xs pt-1 border-t border-neutral-200/60">
          <span class="text-neutral-500">Active Records</span>
          <span class="font-semibold text-neutral-800">
            {{ totalRegulators }} Regulators · {{ totalAlerts }} Alerts
          </span>
        </div>
      </div>

      <!-- If in mock mode: clear explanation -->
      <div v-if="!isOnline" class="mt-3 p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-2 text-xs text-blue-900">
        <p class="font-semibold flex items-center gap-1.5 text-blue-800">
          <CheckCircle2 class="w-3.5 h-3.5 text-blue-600 shrink-0" />
          Autonomous Mock Mode Running
        </p>
        <p class="text-xs leading-relaxed text-blue-800/90 font-normal">
          All UI features (News Feed, Regulators, Tasks, Directory) are 100% operational with the verified in-memory dataset.
          To hook up a live backend server running at <code>localhost:8050</code> or a remote server, enter its URL below.
        </p>
      </div>

      <!-- Quick Tunnel Command Helper -->
      <div v-if="!isOnline" class="mt-3 space-y-1.5">
        <label class="block text-xs font-semibold text-neutral-700">
          Solution: Expose your local port via an HTTPS tunnel
        </label>
        <div class="flex items-center gap-1 bg-neutral-900 text-neutral-100 p-2 rounded-lg font-mono text-xs">
          <span class="truncate flex-1">npx localtunnel --port 8050</span>
          <button
            @click="handleCopy('npx localtunnel --port 8050')"
            class="px-2 py-0.5 bg-neutral-700 hover:bg-neutral-600 rounded text-xs font-sans font-semibold transition-colors cursor-pointer"
          >
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>
        <p class="text-xs text-neutral-500 font-normal">
          Copy the generated public HTTPS URL (e.g. <code>https://xxx.loca.lt</code>) and paste it below.
        </p>
      </div>

      <!-- Custom Endpoint Input -->
      <div class="mt-3 space-y-1.5">
        <label class="block text-xs font-semibold text-neutral-700">
          Backend API Base URL
        </label>
        <div class="flex items-center gap-2">
          <input
            type="text"
            v-model="inputUrl"
            placeholder="e.g. https://xxx.loca.lt/api/v1 or http://localhost:8050/api/v1"
            class="flex-1 px-3 py-1.5 bg-neutral-50 border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
          <button
            @click="handleSaveUrl"
            class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-2xs"
          >
            Connect
          </button>
        </div>
      </div>

      <!-- Bottom Actions -->
      <div class="mt-4 pt-3 border-t border-neutral-100 flex items-center justify-between">
        <button
          @click="emit('retry')"
          class="flex items-center gap-1 text-neutral-600 hover:text-neutral-900 font-semibold cursor-pointer text-xs"
        >
          <RefreshCw class="w-3 h-3" />
          <span>Retry Connection</span>
        </button>
        <a
          href="http://localhost:8050/docs"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-xs font-semibold"
        >
          <span>Swagger Docs</span>
          <ExternalLink class="w-3 h-3" />
        </a>
      </div>
    </div>
  </div>
</template>
