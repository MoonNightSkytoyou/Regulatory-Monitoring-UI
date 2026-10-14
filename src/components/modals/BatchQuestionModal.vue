<script setup lang="ts">
import { ref, computed } from 'vue';
import {
  X,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Sparkles,
  Layers,
  HelpCircle,
  Check,
  Search,
  Globe,
  ChevronDown,
  Bookmark,
} from 'lucide-vue-next';
import { ALL_AVAILABLE_JURISDICTIONS, INITIAL_JURISDICTION_PRESETS } from '@/data/matrixMockData';
import { ALL_JURISDICTIONS } from '@/types';
import type { JurisdictionPreset } from '@/types';

const props = defineProps<{
  isOpen: boolean;
  taskId: string;
  taskTitle: string;
  existingBatchCount?: number;
  initialJurisdictions?: string[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
  (
    e: 'submit',
    payload: {
      questions: string[];
      targetJurisdictions: string[];
      clarificationNotes?: string;
    }
  ): void;
}>();

// Batch Questions Raw Input (textarea)
const rawQuestionsText = ref('');
const clarificationNotes = ref('');

// Parsed Questions List (for fine-tuning, ordering, inline editing, deleting)
const parsedQuestions = ref<string[]>([]);
const isManualTuning = ref(false);

// Preset Jurisdictions & Custom Presets
const savedPresets = ref<JurisdictionPreset[]>([...INITIAL_JURISDICTION_PRESETS]);
const customPresetName = ref('');
const isSavingPreset = ref(false);

// Available Jurisdictions (union of matrix jurisdictions and global jurisdictions)
const availableJurisdictions = computed(() => {
  const map = new Map<string, { code: string; name: string }>();
  // Start with well-known matrix items
  ALL_AVAILABLE_JURISDICTIONS.forEach((j) => {
    map.set(j.code, { code: j.code, name: j.name });
  });

  // Map other global jurisdictions
  ALL_JURISDICTIONS.forEach((name) => {
    let code = name.slice(0, 2).toUpperCase();
    if (name === 'Hong Kong') code = 'HK';
    else if (name === 'Singapore') code = 'SG';
    else if (name === 'United Kingdom') code = 'UK';
    else if (name === 'United States') code = 'US';
    else if (name === 'Australia') code = 'AU';
    else if (name === 'Japan') code = 'JP';
    else if (name === 'European Union') code = 'EU';
    else if (name === 'Indonesia') code = 'ID';
    else if (name === 'China') code = 'CN';
    else if (name === 'Germany') code = 'DE';
    else if (name === 'France') code = 'FR';
    else if (name === 'Canada') code = 'CA';
    else if (name === 'India') code = 'IN';

    if (!map.has(code)) {
      map.set(code, { code, name });
    }
  });

  return Array.from(map.values());
});

// Selected jurisdictions (codes or names)
const selectedJurisdictionCodes = ref<string[]>(['HK', 'SG']);

// Search & dropdown filter
const jurisdictionSearch = ref('');
const isJurisdictionDropdownOpen = ref(false);

const filteredJurisdictions = computed(() => {
  const q = jurisdictionSearch.value.trim().toLowerCase();
  if (!q) return availableJurisdictions.value;
  return availableJurisdictions.value.filter(
    (j) => j.name.toLowerCase().includes(q) || j.code.toLowerCase().includes(q)
  );
});

// Parse raw textarea questions into array automatically using regex
// Supports: "1. ", "Q1: ", "Question 1: ", "1) ", newlines
const parseInputQuestions = () => {
  if (!rawQuestionsText.value.trim()) {
    parsedQuestions.value = [];
    return;
  }

  const rawLines = rawQuestionsText.value.split(/\r?\n/);
  const items: string[] = [];
  let currentQ = '';

  for (const line of rawLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect if this line starts a new question: e.g. "1. ", "1) ", "Q1:", "Question 1:"
    const questionMatch = trimmed.match(/^(?:(?:\d+[\.\)]|Q\d+[:\.]|Question\s*\d+[:\.])\s*)(.*)$/i);
    if (questionMatch) {
      if (currentQ) items.push(currentQ.trim());
      currentQ = questionMatch[1];
    } else {
      if (currentQ) {
        currentQ += ' ' + trimmed;
      } else {
        currentQ = trimmed;
      }
    }
  }

  if (currentQ) items.push(currentQ.trim());
  parsedQuestions.value = items.filter((q) => q.length > 0);
};

// Re-sync parsed list when typing in textarea if user hasn't switched to manual tuning
const onTextareaInput = () => {
  parseInputQuestions();
};

// Fine-tuning helpers
const moveQuestionUp = (index: number) => {
  if (index <= 0) return;
  const temp = parsedQuestions.value[index];
  parsedQuestions.value[index] = parsedQuestions.value[index - 1];
  parsedQuestions.value[index - 1] = temp;
};

const moveQuestionDown = (index: number) => {
  if (index >= parsedQuestions.value.length - 1) return;
  const temp = parsedQuestions.value[index];
  parsedQuestions.value[index] = parsedQuestions.value[index + 1];
  parsedQuestions.value[index + 1] = temp;
};

const deleteQuestion = (index: number) => {
  parsedQuestions.value.splice(index, 1);
};

const addEmptyQuestion = () => {
  parsedQuestions.value.push('');
};

// Jurisdiction selection
const toggleJurisdiction = (code: string) => {
  if (selectedJurisdictionCodes.value.includes(code)) {
    if (selectedJurisdictionCodes.value.length > 1) {
      selectedJurisdictionCodes.value = selectedJurisdictionCodes.value.filter((c) => c !== code);
    }
  } else {
    selectedJurisdictionCodes.value.push(code);
  }
};

const applyPreset = (preset: JurisdictionPreset) => {
  selectedJurisdictionCodes.value = [...preset.jurisdictionCodes];
};

const handleSaveCustomPreset = () => {
  if (!customPresetName.value.trim() || selectedJurisdictionCodes.value.length === 0) return;
  const newPreset: JurisdictionPreset = {
    id: `preset-custom-${Date.now()}`,
    name: customPresetName.value.trim(),
    description: `Custom preset with ${selectedJurisdictionCodes.value.join(', ')}`,
    jurisdictionCodes: [...selectedJurisdictionCodes.value],
  };
  savedPresets.value.push(newPreset);
  customPresetName.value = '';
  isSavingPreset.value = false;
};

const handleSubmit = () => {
  // Ensure we have questions
  let finalQuestions = parsedQuestions.value.map((q) => q.trim()).filter(Boolean);
  if (finalQuestions.length === 0 && rawQuestionsText.value.trim()) {
    parseInputQuestions();
    finalQuestions = parsedQuestions.value.map((q) => q.trim()).filter(Boolean);
  }

  if (finalQuestions.length === 0) return;

  const targetJurisdictionNames = selectedJurisdictionCodes.value.map((code) => {
    const item = availableJurisdictions.value.find((j) => j.code === code);
    return item ? item.name : code;
  });

  emit('submit', {
    questions: finalQuestions,
    targetJurisdictions: targetJurisdictionNames,
    clarificationNotes: clarificationNotes.value.trim(),
  });
};
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/50 backdrop-blur-xs select-text overflow-y-auto animate-in fade-in duration-150"
    >
      <div
        class="bg-white rounded-2xl shadow-2xl border border-neutral-200 w-full max-w-3xl overflow-hidden flex flex-col my-8 max-h-[92vh]"
        @click.stop
      >
        <!-- Modal Top Header -->
        <div class="px-6 py-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/70">
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-2xs">
              <Layers class="w-5 h-5" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-sm sm:text-base font-bold text-neutral-900">
                  Create Question (Batch Questions Input & Clarification)
                </h3>
                <span class="text-[11px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200">
                  Batch {{ (existingBatchCount || 0) + 1 }}
                </span>
              </div>
              <p class="text-xs text-neutral-500 mt-0.5 truncate max-w-lg">
                Task Container: <span class="font-semibold text-neutral-700">{{ taskTitle }}</span>
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

        <!-- Modal Body Content -->
        <div class="p-6 space-y-5 overflow-y-auto flex-1 text-xs sm:text-sm">
          <!-- SECTION 1: Batch Questions Multi-line Input -->
          <div class="space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                <Sparkles class="w-4 h-4 text-blue-600" />
                <span>Batch Questions Input & Clarification</span>
                <span class="text-rose-500">*</span>
              </label>
              <div class="flex items-center gap-2">
                <span class="text-[11px] font-bold text-neutral-500">
                  Parsed: <span class="text-blue-600">{{ parsedQuestions.length }} Questions</span>
                </span>
                <button
                  type="button"
                  @click="isManualTuning = !isManualTuning"
                  class="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                >
                  {{ isManualTuning ? 'Switch to Raw Textarea' : 'Tune Question List (Order / Edit)' }}
                </button>
              </div>
            </div>

            <!-- Mode A: Fast Raw Multi-line Input with Auto Split -->
            <div v-show="!isManualTuning" class="space-y-1.5">
              <textarea
                v-model="rawQuestionsText"
                @input="onTextareaInput"
                rows="6"
                placeholder="Paste multiple questions here directly. Auto-splits by:&#10;1. Can a body corporate serve as a company secretary in this jurisdiction?&#10;2. What anti-avoidance restrictions apply to sole directors appointing corporate secretarial entities?&#10;3. What statutory filing deadlines and regulatory licensing (e.g. TCSP/ACSP) apply?"
                class="w-full px-3.5 py-3 bg-white border border-neutral-200 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 font-sans leading-relaxed transition-all"
              ></textarea>
              <p class="text-[11px] text-neutral-400">
                Tip: You can paste multiple questions prefixed with numbers (1., 2.), Q1:, Question 1:, or one question per paragraph.
              </p>
            </div>

            <!-- Mode B: Fine-Tuning List with Up/Down Sorting, Inline Editing, and Deletion -->
            <div v-show="isManualTuning" class="space-y-2 p-3 bg-neutral-50 rounded-xl border border-neutral-200">
              <div class="flex items-center justify-between text-xs font-bold text-neutral-700 pb-1 border-b border-neutral-200">
                <span>Fine-Tune & Sort Question Sequence</span>
                <button
                  type="button"
                  @click="addEmptyQuestion"
                  class="flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>Add Question</span>
                </button>
              </div>

              <div v-if="parsedQuestions.length === 0" class="py-4 text-center text-xs text-neutral-400 italic">
                No questions entered yet. Switch back to raw textarea or click "Add Question".
              </div>

              <div
                v-for="(q, idx) in parsedQuestions"
                :key="`q-item-${idx}`"
                class="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-neutral-200 shadow-2xs group"
              >
                <div class="shrink-0 flex items-center justify-center w-6 h-6 rounded-md bg-blue-50 text-blue-700 text-xs font-bold mt-1">
                  Q{{ idx + 1 }}
                </div>
                <div class="flex-1">
                  <textarea
                    v-model="parsedQuestions[idx]"
                    rows="2"
                    class="w-full p-1.5 text-xs text-neutral-800 border border-neutral-200 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                  ></textarea>
                </div>
                <div class="shrink-0 flex flex-col gap-1 items-center">
                  <button
                    type="button"
                    @click="moveQuestionUp(idx)"
                    :disabled="idx === 0"
                    class="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Move up"
                  >
                    <ArrowUp class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    @click="moveQuestionDown(idx)"
                    :disabled="idx === parsedQuestions.length - 1"
                    class="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    title="Move down"
                  >
                    <ArrowDown class="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    @click="deleteQuestion(idx)"
                    class="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete question"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Clarification Notes (Optional) -->
            <div class="pt-1">
              <label class="text-[11px] font-bold text-neutral-600 block mb-1">
                Contextual Clarification & Scoping Notes (Optional)
              </label>
              <input
                type="text"
                v-model="clarificationNotes"
                placeholder="e.g. Focus specifically on recent 2026 TCSP amendments and sanctions compliance standards."
                class="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- SECTION 2: Target Jurisdiction(s) & Presets -->
          <div class="space-y-3 p-4 bg-neutral-50/80 rounded-2xl border border-neutral-200">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <div>
                <label class="text-xs font-bold text-neutral-900 flex items-center gap-1.5">
                  <Globe class="w-4 h-4 text-blue-600" />
                  <span>Target Jurisdiction(s) (All Directory Jurisdictions Available)</span>
                  <span class="text-rose-500">*</span>
                </label>
                <p class="text-[11px] text-neutral-500 mt-0.5">
                  Select comparison jurisdictions. Supports Hong Kong, Singapore, UK, US, Australia, and all global directory jurisdictions.
                </p>
              </div>

              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="text-[11px] font-bold text-neutral-500">Presets:</span>
                <button
                  v-for="preset in savedPresets"
                  :key="preset.id"
                  type="button"
                  @click="applyPreset(preset)"
                  class="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-white hover:bg-blue-50 hover:text-blue-700 text-neutral-700 border border-neutral-200 transition-colors shadow-2xs cursor-pointer"
                  :title="preset.description"
                >
                  {{ preset.name.split(',')[0] }} ({{ preset.jurisdictionCodes.length }})
                </button>
              </div>
            </div>

            <!-- Jurisdiction Selector Grid -->
            <div class="space-y-2">
              <!-- Search filter -->
              <div class="relative">
                <Search class="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  v-model="jurisdictionSearch"
                  placeholder="Filter jurisdictions (e.g. HK, SG, UK, US, Australia, Japan)..."
                  class="w-full pl-8 pr-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-xs text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- Available Jurisdictions Badges / Checkboxes -->
              <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1 bg-white rounded-xl border border-neutral-200">
                <button
                  v-for="jur in filteredJurisdictions"
                  :key="jur.code"
                  type="button"
                  @click="toggleJurisdiction(jur.code)"
                  :class="`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    selectedJurisdictionCodes.includes(jur.code)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`"
                >
                  <Check v-if="selectedJurisdictionCodes.includes(jur.code)" class="w-3 h-3 stroke-[3]" />
                  <span>{{ jur.name }} ({{ jur.code }})</span>
                </button>
              </div>

              <!-- Custom Preset Saver -->
              <div class="flex items-center justify-between pt-1">
                <div class="text-[11px] text-neutral-500 font-medium">
                  Currently selected: <span class="font-bold text-neutral-900">{{ selectedJurisdictionCodes.join(', ') }}</span> ({{ selectedJurisdictionCodes.length }} jurisdictions)
                </div>

                <div v-if="!isSavingPreset">
                  <button
                    type="button"
                    @click="isSavingPreset = true"
                    class="text-[11px] text-blue-600 hover:underline font-semibold cursor-pointer"
                  >
                    + Save as Custom Preset
                  </button>
                </div>
                <div v-else class="flex items-center gap-1.5">
                  <input
                    type="text"
                    v-model="customPresetName"
                    placeholder="Preset name (e.g. APAC Quad)"
                    class="px-2 py-0.5 text-[11px] bg-white border border-neutral-200 rounded"
                  />
                  <button
                    type="button"
                    @click="handleSaveCustomPreset"
                    class="px-2 py-0.5 text-[11px] bg-blue-600 text-white font-bold rounded cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    @click="isSavingPreset = false"
                    class="px-1.5 py-0.5 text-[11px] text-neutral-500 hover:text-neutral-800 cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="px-6 py-3.5 border-t border-neutral-200 flex items-center justify-between bg-neutral-50">
          <div class="text-xs text-neutral-500">
            Batch output will append to current Task Question list and generate multi-dimensional matrix findings.
          </div>

          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="emit('close')"
              class="px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              @click="handleSubmit"
              :disabled="parsedQuestions.length === 0 && !rawQuestionsText.trim()"
              class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            >
              <Sparkles class="w-3.5 h-3.5" />
              <span>Submit & Generate Matrix Findings</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
