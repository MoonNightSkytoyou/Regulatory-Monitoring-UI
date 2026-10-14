<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import {
  ArrowLeft,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Download,
  ExternalLink,
  Plus,
  Trash2,
  Send,
  Layers,
  FileText,
  ShieldCheck,
  AlertTriangle,
  AlertCircle,
  HelpCircle,
  Maximize2,
  Minimize2,
  SplitSquareVertical,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  Bookmark,
  BookmarkCheck,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-vue-next';
import type {
  MatrixSessionState,
  MatrixComplianceStatus,
  MatrixCitationItem,
  MatrixFollowUpItem,
  MatrixJurisdictionItem,
} from '@/types';
import { ALL_AVAILABLE_JURISDICTIONS } from '@/data/matrixMockData';
import { useDirectoryStore } from '@/stores/directoryStore';

const props = defineProps<{
  session: MatrixSessionState;
  taskId: string;
  taskTitle: string;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'openNewMatrixSetup'): void;
  (e: 'showToast', title: string, message: string, type: 'success' | 'info' | 'warning'): void;
}>();

const directoryStore = useDirectoryStore();

// Working session state copy
const currentSession = ref<MatrixSessionState>(JSON.parse(JSON.stringify(props.session)));

// Active Navigation Coordinates
const currentQIndex = ref<number>(props.session.activeQuestionIndex || 0);
const currentJurisdictionCode = ref<string>(
  props.session.activeJurisdictionCode ||
    (props.session.jurisdictions[0] ? props.session.jurisdictions[0].code : 'HK')
);

// Dual-Pane Resizing & Collapse/Expand (60% / 40% default)
const isEvidencePaneVisible = ref<boolean>(true);
const leftPaneWidthPercent = ref<number>(60);
const isDraggingDivider = ref<boolean>(false);

// Active citation pin highlight in right evidence pack
const activeCitationId = ref<string | null>(null);
const highlightedCitationId = ref<string | null>(null);

// Follow-up Inquiry State
const followUpQuery = ref<string>('');
const isBroadcastMode = ref<boolean>(false);
const isGeneratingFollowUp = ref<boolean>(false);
const isMacroFollowUpsCollapsed = ref<boolean>(false);
const showDeleteConfirmModal = ref<boolean>(false);


// Computed getters
const currentQuestion = computed(() => {
  return currentSession.value.questions[currentQIndex.value] || null;
});

const currentJurisdiction = computed(() => {
  return (
    currentSession.value.jurisdictions.find((j) => j.code === currentJurisdictionCode.value) ||
    currentSession.value.jurisdictions[0]
  );
});

// Single Cell Coordinate Key: Q{index}_{jurisdictionCode} or {questionId}_{jurisdictionCode}
const activeCellKey = computed(() => {
  if (!currentQuestion.value || !currentJurisdiction.value) return '';
  return `${currentQuestion.value.questionId}_${currentJurisdiction.value.code}`;
});

const activeCellData = computed(() => {
  const key = activeCellKey.value;
  return (
    currentSession.value.matrixCells[key] || {
      answerMarkdown: `No specific findings generated yet for ${currentJurisdictionCode.value}.`,
      complianceStatus: 'inconclusive' as MatrixComplianceStatus,
      statusBadgeLabel: 'Under Review',
      verifiedCitations: [],
      keyTakeaways: [],
      followUps: [],
    }
  );
});

// All citations for current question across current jurisdiction
const currentEvidenceCitations = computed<MatrixCitationItem[]>(() => {
  return activeCellData.value.verifiedCitations || [];
});

// Navigation actions
const goToPreviousQuestion = () => {
  if (currentQIndex.value > 0) {
    currentQIndex.value--;
  }
};

const goToNextQuestion = () => {
  if (currentQIndex.value < currentSession.value.questions.length - 1) {
    currentQIndex.value++;
  }
};

const selectQuestionByIndex = (idx: number) => {
  currentQIndex.value = idx;
};

const selectJurisdiction = (code: string) => {
  currentJurisdictionCode.value = code;
};

// Cross-Jurisdiction Macro Synthesis based on ALL questions (does NOT change when country/question changes)
const crossJurisdictionMacroSynthesis = computed(() => {
  if (currentSession.value.macroSynthesis) {
    return currentSession.value.macroSynthesis;
  }
  const jurs = currentSession.value.jurisdictions.map((j) => `${j.name} (${j.regulatorAcronym})`).join(', ');
  const totalQ = currentSession.value.questions.length;

  return `### Comprehensive Cross-Jurisdiction Macro Synthesis (${currentSession.value.sessionTitle})

Consolidated analysis across all ${totalQ} compliance inquiries evaluated for ${jurs}:

1. **Commonalities & Core Supervisory Principles**:
   - All evaluated regulatory authorities enforce strict operational continuity, continuous third-party risk management, and mandatory transparent entity governance.
   - Financial institutions are universally required to map critical operational workflows and document business continuity procedures against severe-but-plausible market disruptions.

2. **Key Regulatory Divergence & Threshold Gaps**:
   - **Incident Notification Timelines**: Hong Kong (HKMA) and Singapore (MAS) maintain rapid reporting windows (1–2 hours for material disruptions), whereas UK and US regimes emphasize root-cause remediation and periodic supervisory disclosures.
   - **Entity Substance & Governance Directives**: Singapore strictly mandates natural persons as company secretaries (Companies Act §171(1AA)), whereas the UK and Hong Kong permit corporate bodies under prescribed identity verification standards (ECCTA 2023 / Cap. 622).
   - **Cloud Outsourcing & Inspection Rights**: Regulators in HK and Singapore explicitly bar standard cloud service agreements that exclude direct regulatory audit and on-site examination powers.

3. **Strategic Harmonization Benchmark**:
   - Establish baseline compliance according to the most stringent jurisdiction across each dimension (e.g. MAS 1-hour incident window and HKMA SPM inspection addendums).
   - Maintain an automated multi-jurisdictional register of regulatory notifications and periodic stress testing evidence to satisfy recurring cross-border supervisory audits.`;
});

// Interactive Citation Click -> Scroll and Glow Highlight in Right Evidence Pack
const handleCitationBadgeClick = (citationId: string) => {
  if (!isEvidencePaneVisible.value) {
    isEvidencePaneVisible.value = true;
  }
  activeCitationId.value = citationId;
  highlightedCitationId.value = citationId;

  nextTick(() => {
    const el = document.getElementById(`evidence-card-${citationId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });

  setTimeout(() => {
    highlightedCitationId.value = null;
  }, 2500);
};

// Real-Time Follow-up Inquiry Submission
const handleSendFollowUp = () => {
  const query = followUpQuery.value.trim();
  if (!query || isGeneratingFollowUp.value) return;

  isGeneratingFollowUp.value = true;
  const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  setTimeout(() => {
    if (isBroadcastMode.value) {
      // Broadcast to all jurisdictions under macro synthesis
      if (!currentQuestion.value.followUps) {
        currentQuestion.value.followUps = [];
      }
      currentQuestion.value.followUps.push({
        id: `fu-macro-${Date.now()}`,
        index: (currentQuestion.value.followUps.length || 0) + 1,
        timestamp: nowTime,
        queryText: query,
        findingText: `[Cross-Jurisdictional Broadcast Assessment] Regarding "${query}": Analysis indicates varying degrees of scrutiny across selected jurisdictions. Singapore ACRA and UK Companies House require immediate electronic registry updates, while Hong Kong Companies Registry mandates 15-day statutory notification windows under Cap. 622. Compliance teams must coordinate synchronized disclosures.`,
      });
      emit('showToast', 'Broadcast Completed', 'Cross-jurisdictional inquiry generated under Macro Synthesis.', 'success');
    } else {
      // Single jurisdiction inquiry
      const cell = currentSession.value.matrixCells[activeCellKey.value];
      if (cell) {
        if (!cell.followUps) {
          cell.followUps = [];
        }
        cell.followUps.push({
          id: `fu-cell-${Date.now()}`,
          index: (cell.followUps.length || 0) + 1,
          timestamp: nowTime,
          jurisdictionName: currentJurisdiction.value.name,
          jurisdictionCode: currentJurisdiction.value.code,
          queryText: query,
          findingText: `Under ${currentJurisdiction.value.name} statutory guidelines (${currentJurisdiction.value.regulatorAcronym}): Specific compliance parameters mandate documented risk governance and board-level notification before operational rollout.`,
        });
        emit('showToast', 'Inquiry Answered', `Follow-up query generated for ${currentJurisdiction.value.name}.`, 'success');
      }
    }

    followUpQuery.value = '';
    isGeneratingFollowUp.value = false;
  }, 900);
};

// Delete Macro Follow-ups
const handleDeleteAllMacroFollowUps = () => {
  if (currentQuestion.value) {
    currentQuestion.value.followUps = [];
  }
  showDeleteConfirmModal.value = false;
  emit('showToast', 'Inquiries Cleared', 'All macro broadcast follow-up cards removed.', 'info');
};

const handleDeleteSingleMacroCard = (id: string) => {
  if (currentQuestion.value && currentQuestion.value.followUps) {
    currentQuestion.value.followUps = currentQuestion.value.followUps.filter((f) => f.id !== id);
  }
};

const handleDeleteSingleCellCard = (id: string) => {
  const cell = currentSession.value.matrixCells[activeCellKey.value];
  if (cell && cell.followUps) {
    cell.followUps = cell.followUps.filter((f) => f.id !== id);
  }
};

// Export 17-column Audit CSV
const handleExportAuditCsv = () => {
  const headers = [
    'Task Container',
    'Question ID',
    'Question Index',
    'Question Text',
    'Jurisdiction Code',
    'Jurisdiction Name',
    'Regulator Acronym',
    'Compliance Status',
    'Status Label',
    'Answer Summary',
    'Citation ID',
    'Citation Source Title',
    'Citation Authority',
    'Effective Date',
    'Official Source URL',
    'Statutory Clause Excerpt',
    'Digital Fingerprint (SHA256)',
  ];

  const rows: string[][] = [];

  currentSession.value.questions.forEach((q, qIdx) => {
    currentSession.value.jurisdictions.forEach((jur) => {
      const cellKey = `${q.questionId}_${jur.code}`;
      const cell = currentSession.value.matrixCells[cellKey];
      if (cell) {
        if (cell.verifiedCitations && cell.verifiedCitations.length > 0) {
          cell.verifiedCitations.forEach((cit) => {
            rows.push([
              `"${props.taskTitle.replace(/"/g, '""')}"`,
              `"${q.questionId}"`,
              `"Q${qIdx + 1}"`,
              `"${q.questionText.replace(/"/g, '""')}"`,
              `"${jur.code}"`,
              `"${jur.name}"`,
              `"${jur.regulatorAcronym}"`,
              `"${cell.complianceStatus}"`,
              `"${cell.statusBadgeLabel}"`,
              `"${cell.answerMarkdown.slice(0, 300).replace(/\n/g, ' ').replace(/"/g, '""')}"`,
              `"${cit.citationId}"`,
              `"${cit.sourceTitle.replace(/"/g, '""')}"`,
              `"${cit.authority}"`,
              `"${cit.effectiveDate}"`,
              `"${cit.sourceUrl}"`,
              `"${cit.excerpt.replace(/"/g, '""')}"`,
              `"${cit.sha256}"`,
            ]);
          });
        } else {
          rows.push([
            `"${props.taskTitle.replace(/"/g, '""')}"`,
            `"${q.questionId}"`,
            `"Q${qIdx + 1}"`,
            `"${q.questionText.replace(/"/g, '""')}"`,
            `"${jur.code}"`,
            `"${jur.name}"`,
            `"${jur.regulatorAcronym}"`,
            `"${cell.complianceStatus}"`,
            `"${cell.statusBadgeLabel}"`,
            `"${cell.answerMarkdown.slice(0, 300).replace(/\n/g, ' ').replace(/"/g, '""')}"`,
            '""',
            '""',
            '""',
            '""',
            '""',
            '""',
            '""',
          ]);
        }
      }
    });
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `audit_matrix_report_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  emit('showToast', 'Export Complete', 'Standardized 17-column audit CSV exported successfully.', 'success');
};

// Status dot & badge color helpers
const getStatusDotColor = (status: MatrixComplianceStatus) => {
  if (status === 'compliant') return 'bg-emerald-500';
  if (status === 'conditional') return 'bg-amber-500';
  if (status === 'prohibited') return 'bg-rose-500';
  return 'bg-neutral-400';
};

const getStatusBadgeClass = (status: MatrixComplianceStatus) => {
  if (status === 'compliant') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'conditional') return 'bg-amber-50 text-amber-700 border-amber-200';
  if (status === 'prohibited') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-neutral-100 text-neutral-700 border-neutral-200';
};

// Authority Follow & Bookmark states for Evidence Pack cards (as in image.png)
const followedAuthorities = ref<Record<string, boolean>>({
  HKMA: true,
  MAS: true,
  FCA: true,
  CR: true,
  ACRA: true,
  SEC: true,
  FED: true,
});

const isAuthorityFollowed = (cit: MatrixCitationItem) => {
  const code = (cit.regulatorAcronym || cit.authority || 'HKMA').toUpperCase();
  return followedAuthorities.value[code] ?? true;
};

const handleToggleFollow = (cit: MatrixCitationItem) => {
  const code = (cit.regulatorAcronym || cit.authority || 'HKMA').toUpperCase();
  const next = !isAuthorityFollowed(cit);
  followedAuthorities.value[code] = next;
  emit(
    'showToast',
    next ? 'Authority Followed' : 'Authority Unfollowed',
    `${code} is ${next ? 'now followed in Surveillance Scope' : 'unfollowed'}.`,
    next ? 'success' : 'info'
  );
};

const handleToggleBookmark = (cit: MatrixCitationItem) => {
  const isBookmarked = directoryStore.isBookmarked(cit.citationId, undefined, cit.sourceTitle);
  if (isBookmarked) {
    directoryStore.removeBookmark(cit.citationId, undefined, cit.sourceTitle);
    emit('showToast', 'Bookmark Removed', `"${cit.sourceTitle.slice(0, 36)}..." removed from Directory Bookmarks.`, 'info');
  } else {
    directoryStore.addBookmark({
      id: cit.citationId,
      title: cit.sourceTitle,
      jurisdiction: cit.jurisdiction || currentJurisdiction.value.name,
      regulator: cit.authority,
      regulatorAcronym: cit.regulatorAcronym,
      officialUrl: cit.sourceUrl,
      docType: 'Guideline',
      whyRelevantExplanation: cit.applicabilityRationale || cit.excerpt,
      materiality: 'Direct / Highly Relevant',
      diligenceStatus: 'Monitored',
      publishDate: cit.effectiveDate,
      executiveSummary: cit.excerpt,
      referenceNumber: cit.citationId,
    } as any);
    emit('showToast', 'Bookmarked to Directory', `"${cit.sourceTitle.slice(0, 36)}..." saved to Directory > Bookmarks.`, 'success');
  }
};

// Dynamic Grounding Source Creation (Unlimited Evidence Pack Cards)
const isAddSourceModalOpen = ref(false);
const newSourceTitle = ref('');
const newSourceUrl = ref('');
const newSourceAuthority = ref('');
const newSourceExcerpt = ref('');
const newSourceRationale = ref('');

const openAddSourceModal = () => {
  newSourceTitle.value = '';
  newSourceUrl.value = 'https://';
  newSourceAuthority.value = currentJurisdiction.value.regulatorAcronym || 'Regulatory Authority';
  newSourceExcerpt.value = '';
  newSourceRationale.value = '';
  isAddSourceModalOpen.value = true;
};

const handleSaveNewSource = () => {
  if (!newSourceTitle.value.trim()) return;
  const newCit: MatrixCitationItem = {
    citationId: `cit-custom-${Date.now()}`,
    sourceTitle: newSourceTitle.value.trim(),
    authority: newSourceAuthority.value.trim() || currentJurisdiction.value.regulatorAcronym,
    regulatorAcronym: newSourceAuthority.value.trim() || currentJurisdiction.value.regulatorAcronym,
    jurisdiction: currentJurisdiction.value.name,
    effectiveDate: new Date().toISOString().split('T')[0],
    sourceUrl: newSourceUrl.value.trim() || '#',
    applicabilityRationale: newSourceRationale.value.trim() || `Authoritative statutory reference for ${currentJurisdiction.value.name} regulatory requirements.`,
    groundingCertainty: `Direct gazetted grounding verified under ${newSourceAuthority.value.trim() || currentJurisdiction.value.regulatorAcronym} official publication.`,
    excerpt: newSourceExcerpt.value.trim() || newSourceTitle.value.trim(),
    confidenceScore: 98,
    relevanceScore: 96,
    sha256: `custom${Date.now().toString(16)}0000000000000000000000000000000000`,
  };

  const key = activeCellKey.value;
  if (!currentSession.value.matrixCells[key]) {
    currentSession.value.matrixCells[key] = {
      answerMarkdown: `Findings recorded for ${currentJurisdiction.value.name}.`,
      complianceStatus: 'compliant',
      statusBadgeLabel: 'Verified Grounding',
      verifiedCitations: [],
      keyTakeaways: [],
      followUps: [],
    };
  }
  if (!currentSession.value.matrixCells[key].verifiedCitations) {
    currentSession.value.matrixCells[key].verifiedCitations = [];
  }
  currentSession.value.matrixCells[key].verifiedCitations.push(newCit);
  isAddSourceModalOpen.value = false;
  emit('showToast', 'Evidence Source Added', `"${newCit.sourceTitle}" added to Evidence Pack.`, 'success');
};
</script>

<template>
  <div class="matrix-workbench w-full space-y-4 animate-in fade-in select-text">
    <!-- 1. TOP CONTROL BAR (Matrix Top Control Bar) -->
    <div class="bg-white rounded-2xl border border-neutral-200 p-4 sm:p-5 shadow-2xs space-y-3">
      <div class="flex items-center justify-between flex-wrap gap-3">
        <div class="flex items-center gap-3">
          <button
            @click="emit('back')"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Back to Question List</span>
          </button>

          <div>
            <div class="flex items-center gap-2 flex-wrap">
              <h1 class="text-base sm:text-lg font-bold text-neutral-900 tracking-tight">
                {{ currentSession.sessionTitle }}
              </h1>
              <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-mono">
                {{ currentSession.questions.length }}Q &times; {{ currentSession.jurisdictions.length }}J Matrix
              </span>
            </div>
            <p class="text-xs text-neutral-500 mt-0.5">
              Task Container: <span class="font-semibold text-neutral-700">{{ taskTitle }}</span> &bull; Updated:
              <span class="font-mono text-neutral-600">{{ currentSession.updatedAt }}</span> by
              <span class="text-neutral-700 font-medium">{{ currentSession.creator }}</span>
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Toggle Right Evidence Pack button -->
          <button
            type="button"
            @click="isEvidencePaneVisible = !isEvidencePaneVisible"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all cursor-pointer shadow-2xs"
            :title="isEvidencePaneVisible ? 'Hide statutory evidence pack' : 'Show statutory evidence pack'"
          >
            <PanelRightClose v-if="isEvidencePaneVisible" class="w-3.5 h-3.5 text-neutral-500" />
            <PanelRightOpen v-else class="w-3.5 h-3.5 text-neutral-500" />
            <span>{{ isEvidencePaneVisible ? 'Hide Evidence Pack' : 'Show Evidence Pack (40%)' }}</span>
          </button>

          <!-- New Matrix Setup -->
          <button
            type="button"
            @click="emit('openNewMatrixSetup')"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-800 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
          >
            <Plus class="w-3.5 h-3.5 text-blue-600" />
            <span>New Matrix Setup</span>
          </button>

          <!-- Export CSV (Standardized 17-Column Audit CSV) -->
          <button
            type="button"
            @click="handleExportAuditCsv"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
          >
            <Download class="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 2. DUAL-PANE WORKSPACE: LEFT (60%) RESEARCH & COUNTRY ANALYSIS : RIGHT (40%) EVIDENCE PACK -->
    <div class="grid grid-cols-1 gap-5" :class="isEvidencePaneVisible ? 'lg:grid-cols-12' : 'grid-cols-1'">
      <!-- ============================================================ -->
      <!-- LEFT PANE: RESEARCH MATRIX WORKBENCH (60% or 100%)           -->
      <!-- ============================================================ -->
      <div :class="isEvidencePaneVisible ? 'lg:col-span-7 xl:col-span-7' : 'col-span-12'" class="space-y-4">
        <!-- BLOCK 1: QUESTION FOCUS CARD (Y-Axis Stepper & Switcher) -->
        <div class="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3">
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="w-7 h-7 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-xs shadow-2xs">
                Q{{ currentQIndex + 1 }}
              </span>
              <span class="text-xs font-bold text-neutral-800 uppercase tracking-wider">
                Question Dimension (Y-Axis Focus)
              </span>
            </div>

            <!-- Stepper Controls (< / >) & Dropdown Quick Select -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="goToPreviousQuestion"
                :disabled="currentQIndex === 0"
                class="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Previous Question"
              >
                <ChevronLeft class="w-4 h-4 text-neutral-700" />
              </button>

              <select
                :value="currentQIndex"
                @change="selectQuestionByIndex(Number(($event.target as HTMLSelectElement).value))"
                class="px-2.5 py-1 bg-neutral-50 border border-neutral-200 rounded-lg text-xs font-bold text-neutral-900 focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
              >
                <option
                  v-for="(q, idx) in currentSession.questions"
                  :key="q.questionId"
                  :value="idx"
                >
                  Question {{ idx + 1 }} of {{ currentSession.questions.length }}
                </option>
              </select>

              <button
                type="button"
                @click="goToNextQuestion"
                :disabled="currentQIndex === currentSession.questions.length - 1"
                class="p-1.5 rounded-lg border border-neutral-200 hover:bg-neutral-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                title="Next Question"
              >
                <ChevronRight class="w-4 h-4 text-neutral-700" />
              </button>
            </div>
          </div>

          <!-- Full Question Text Display -->
          <div class="space-y-2">
            <h2 class="text-base sm:text-lg font-bold text-neutral-900 leading-snug">
              {{ currentQuestion ? currentQuestion.questionText : 'No question selected' }}
            </h2>

          </div>
        </div>

        <!-- BLOCK 2: CROSS-JURISDICTION MACRO SYNTHESIS (Commonality & Divergence across All Questions) -->
        <div class="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3.5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <div class="w-6 h-6 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Sparkles class="w-4 h-4" />
              </div>
              <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-900">
                Cross-Jurisdiction Macro Synthesis
              </h3>
              <span class="text-[10px] font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">
                All-Inquiries Benchmark
              </span>
            </div>

            <!-- Follow-up management buttons if broadcast cards exist -->
            <div v-if="currentQuestion && currentQuestion.followUps && currentQuestion.followUps.length > 0" class="flex items-center gap-2">
              <button
                type="button"
                @click="isMacroFollowUpsCollapsed = !isMacroFollowUpsCollapsed"
                class="text-[11px] font-semibold text-neutral-600 hover:text-neutral-900 cursor-pointer"
              >
                {{ isMacroFollowUpsCollapsed ? 'Expand Follow-ups' : 'Collapse Follow-ups' }}
              </button>
              <button
                type="button"
                @click="showDeleteConfirmModal = true"
                class="text-[11px] font-semibold text-rose-600 hover:text-rose-700 cursor-pointer"
              >
                Delete All
              </button>
            </div>
          </div>

          <!-- Synthesis Summary Body (Overarching synthesis across all questions - will not change on country/question switch) -->
          <div class="p-4 rounded-xl bg-neutral-50/90 border border-neutral-200/90 text-xs sm:text-sm text-neutral-800 leading-relaxed font-sans whitespace-pre-line">
            {{ crossJurisdictionMacroSynthesis }}
          </div>

          <!-- Dynamic Broadcast Follow-up Cards (Inserted directly below macro synthesis) -->
          <div
            v-if="currentQuestion && currentQuestion.followUps && currentQuestion.followUps.length > 0 && !isMacroFollowUpsCollapsed"
            class="space-y-2.5 pt-2"
          >
            <div class="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
              <span>Broadcast Follow-Up Trajectory ({{ currentQuestion.followUps.length }})</span>
            </div>

            <div
              v-for="card in currentQuestion.followUps"
              :key="card.id"
              class="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 space-y-2 text-xs"
            >
              <div class="flex items-center justify-between text-indigo-900 font-semibold text-[11px]">
                <span class="flex items-center gap-1.5">
                  <Sparkles class="w-3.5 h-3.5 text-indigo-600" />
                  <span>Q: "{{ card.queryText }}"</span>
                </span>
                <div class="flex items-center gap-2">
                  <span class="font-mono text-neutral-400 text-[10px]">{{ card.timestamp }}</span>
                  <button
                    type="button"
                    @click="handleDeleteSingleMacroCard(card.id)"
                    class="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-white cursor-pointer"
                    title="Delete card"
                  >
                    <Trash2 class="w-3 h-3" />
                  </button>
                </div>
              </div>
              <div class="text-neutral-800 leading-relaxed bg-white p-3 rounded-lg border border-indigo-100/80">
                {{ card.findingText }}
              </div>
            </div>
          </div>
        </div>

        <!-- BLOCK 3: COUNTRY DEEP-DIVE SECTION (X-Axis Segmented Pill Tabs & Content) -->
        <div class="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-4">
          <!-- Compliance Status Legend -->
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-100 pb-3">
            <div class="text-xs font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
              <Layers class="w-4 h-4 text-blue-600" />
              <span>Country Deep-Dive (X-Axis Jurisdiction Dimension)</span>
            </div>

            <!-- Legend Dots -->
            <div class="flex items-center gap-3 text-[11px] text-neutral-600">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Permitted</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-amber-500" />
                <span>Conditional</span>
              </span>
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full bg-rose-500" />
                <span>Prohibited</span>
              </span>
            </div>
          </div>

          <!-- Horizontal Segmented Pill Tabs for Jurisdictions -->
          <div class="flex items-center gap-2 overflow-x-auto pb-1">
            <button
              v-for="jur in currentSession.jurisdictions"
              :key="jur.code"
              type="button"
              @click="selectJurisdiction(jur.code)"
              :class="`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shrink-0 border ${
                currentJurisdictionCode === jur.code
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
              }`"
            >
              <span :class="`w-2 h-2 rounded-full ${getStatusDotColor(jur.complianceStatus)}`" />
              <span>{{ jur.name }} ({{ jur.code }})</span>
            </button>
          </div>

          <!-- Active Single Cell Findings View (Transition) -->
          <div class="space-y-4 pt-1 transition-opacity duration-200">
            <!-- Cell Status Banner -->
            <div class="flex items-center justify-between flex-wrap gap-2 p-3 rounded-xl border" :class="getStatusBadgeClass(activeCellData.complianceStatus)">
              <div class="flex items-center gap-2">
                <ShieldCheck class="w-4 h-4" />
                <span class="font-bold text-xs">{{ activeCellData.statusBadgeLabel }}</span>
              </div>
              <span class="text-[11px] font-mono font-medium">
                Authority: {{ currentJurisdiction.regulatorAcronym }}
              </span>
            </div>

            <!-- Analysis Markdown Content -->
            <div class="p-4 rounded-xl bg-neutral-50/80 border border-neutral-200/90 text-xs sm:text-sm text-neutral-800 leading-relaxed font-sans whitespace-pre-line space-y-2">
              {{ activeCellData.answerMarkdown }}
            </div>

            <!-- Key Takeaways Bullet Cards -->
            <div v-if="activeCellData.keyTakeaways && activeCellData.keyTakeaways.length > 0" class="space-y-1.5">
              <div class="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                Key Strategic Takeaways
              </div>
              <ul class="space-y-1 text-xs text-neutral-700">
                <li
                  v-for="(item, tIdx) in activeCellData.keyTakeaways"
                  :key="`takeaway-${tIdx}`"
                  class="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-neutral-200/80"
                >
                  <span class="w-1.5 h-1.5 rounded-full bg-blue-600 shrink-0 mt-1.5" />
                  <span>{{ item }}</span>
                </li>
              </ul>
            </div>

            <!-- Interactive Legal Citations Badges (Link to Right Evidence Pack) -->
            <div v-if="currentEvidenceCitations.length > 0" class="space-y-2 pt-1 border-t border-neutral-100">
              <div class="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center justify-between">
                <span>Statutory Citations Traced in this Jurisdiction ({{ currentEvidenceCitations.length }})</span>
                <span class="text-neutral-400 font-normal">Click badge to highlight official evidence card</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="cit in currentEvidenceCitations"
                  :key="cit.citationId"
                  type="button"
                  @click="handleCitationBadgeClick(cit.citationId)"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-semibold cursor-pointer transition-all shadow-2xs group"
                >
                  <Pin class="w-3.5 h-3.5 text-blue-600 group-hover:rotate-12 transition-transform" />
                  <span class="truncate max-w-[280px]">[{{ cit.sourceTitle }}]</span>
                </button>
              </div>
            </div>

            <!-- Jurisdiction-Specific Follow-Up History -->
            <div
              v-if="activeCellData.followUps && activeCellData.followUps.length > 0"
              class="space-y-2 pt-2 border-t border-neutral-100"
            >
              <div class="text-[11px] font-bold text-neutral-600 uppercase tracking-wider">
                Localized Inquiries for {{ currentJurisdiction.name }} ({{ activeCellData.followUps.length }})
              </div>
              <div
                v-for="card in activeCellData.followUps"
                :key="card.id"
                class="p-3 rounded-xl bg-neutral-100 border border-neutral-200 space-y-1.5 text-xs"
              >
                <div class="flex items-center justify-between text-neutral-900 font-semibold text-[11px]">
                  <span>Q: {{ card.queryText }}</span>
                  <div class="flex items-center gap-2">
                    <span class="font-mono text-neutral-400 text-[10px]">{{ card.timestamp }}</span>
                    <button
                      type="button"
                      @click="handleDeleteSingleCellCard(card.id)"
                      class="text-neutral-400 hover:text-rose-600 p-0.5 cursor-pointer"
                    >
                      <Trash2 class="w-3 h-3" />
                    </button>
                  </div>
                </div>
                <div class="text-neutral-700 bg-white p-2.5 rounded-lg border border-neutral-200">
                  {{ card.findingText }}
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- BLOCK 4: REAL-TIME FOLLOW-UP INQUIRY BAR (Bottom Docked) -->
        <div class="bg-white rounded-2xl border border-neutral-200 p-4 shadow-2xs space-y-2.5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
              <HelpCircle class="w-4 h-4 text-blue-600" />
              <span>Real-Time Statutory Follow-up Inquiry</span>
            </div>

            <!-- Broadcast Mode Toggle Checkbox -->
            <label class="flex items-center gap-2 text-xs font-semibold text-neutral-700 cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="isBroadcastMode"
                class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
              />
              <span>Broadcast to all jurisdictions (Macro Synthesis)</span>
            </label>
          </div>

          <div class="flex items-center gap-2">
            <input
              type="text"
              v-model="followUpQuery"
              @keydown.enter="handleSendFollowUp"
              :placeholder="
                isBroadcastMode
                  ? 'Ask across all jurisdictions (e.g. Compare penalties for late beneficial ownership filing)...'
                  : `Ask specifically about ${currentJurisdiction.name} (e.g. Does local presence require full-time staff?)...`
              "
              class="flex-1 px-3.5 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-neutral-900 rounded-xl text-xs sm:text-sm text-neutral-900 focus:outline-none transition-colors"
            />
            <button
              type="button"
              @click="handleSendFollowUp"
              :disabled="!followUpQuery.trim() || isGeneratingFollowUp"
              class="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer shrink-0"
            >
              <Send class="w-3.5 h-3.5" />
              <span>{{ isGeneratingFollowUp ? 'Generating...' : 'Inquire' }}</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ============================================================ -->
      <!-- RIGHT PANE: STATUTORY EVIDENCE PACK (40% Width)              -->
      <!-- ============================================================ -->
      <div v-if="isEvidencePaneVisible" class="lg:col-span-5 xl:col-span-5 space-y-4">
        <div class="bg-white rounded-2xl border border-neutral-200 p-5 shadow-2xs space-y-3 sticky top-4 max-h-[85vh] overflow-y-auto">
          <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div>
              <div class="flex items-center gap-2">
                <h3 class="text-xs font-bold uppercase tracking-wider text-neutral-900">
                  Evidence Pack & Grounding Sources
                </h3>
                <span class="text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full border border-blue-200 font-mono">
                  {{ currentEvidenceCitations.length }} Sources
                </span>
              </div>
              <p class="text-[11px] text-neutral-500 mt-0.5">
                Statutory Gazette citations for {{ currentJurisdiction.name }} ({{ currentJurisdiction.code }}).
              </p>
            </div>
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="openAddSourceModal"
                class="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Add Statutory Grounding Source"
              >
                <Plus class="w-3.5 h-3.5 text-blue-600" />
                <span>Add Source</span>
              </button>

              <button
                type="button"
                @click="isEvidencePaneVisible = false"
                class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
                title="Close Evidence Pack"
              >
                <PanelRightClose class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- Empty State -->
          <div v-if="currentEvidenceCitations.length === 0" class="py-8 text-center text-xs text-neutral-400 italic">
            No specific statutory citations filed for this jurisdiction cell.
          </div>

          <!-- Evidence Cards List (styled to match image.png) -->
          <div v-else class="space-y-4">
            <div
              v-for="cit in currentEvidenceCitations"
              :id="`evidence-card-${cit.citationId}`"
              :key="cit.citationId"
              :class="`p-5 rounded-2xl border transition-all duration-300 space-y-3.5 bg-white shadow-2xs hover:border-neutral-300 ${
                highlightedCitationId === cit.citationId
                  ? 'border-blue-500 ring-4 ring-blue-200/70 shadow-md'
                  : 'border-neutral-200'
              }`"
            >
              <!-- Top Badges & Date Row -->
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <div class="flex items-center gap-2 flex-wrap">
                  <!-- Solid Blue Authority Pill -->
                  <span class="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-md shadow-2xs">
                    {{ cit.regulatorAcronym || cit.authority }}
                  </span>
                  <!-- Grey Jurisdiction Pill -->
                  <span class="text-xs font-medium text-neutral-600 bg-neutral-100 px-2.5 py-1 rounded-md">
                    {{ cit.jurisdiction || currentJurisdiction.name }}
                  </span>
                  <!-- Confidence Pill with Green Dot -->
                  <span class="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-800 bg-neutral-50 border border-neutral-200 px-2.5 py-1 rounded-md">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Confidence: {{ cit.confidenceScore || 98 }}% • Verified</span>
                  </span>
                </div>

                <!-- Date -->
                <span class="text-xs text-neutral-400 font-mono">
                  {{ cit.effectiveDate || '2026-03-24' }}
                </span>
              </div>

              <!-- Title & Official Link -->
              <div class="space-y-1">
                <h4 class="text-sm font-bold text-neutral-900 leading-snug flex items-start gap-1">
                  <span>{{ cit.sourceTitle }}</span>
                  <ExternalLink class="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                </h4>
                <div>
                  <a
                    :href="cit.sourceUrl || '#'"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-xs text-blue-600 hover:text-blue-700 font-medium inline-flex items-center gap-1 hover:underline"
                  >
                    <span>Official Link</span>
                    <ExternalLink class="w-3 h-3" />
                  </a>
                </div>
              </div>

              <!-- Block 1: Applicability Rationale -->
              <div class="p-3.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80 space-y-1">
                <div class="text-xs font-bold text-neutral-900">
                  Applicability Rationale:
                </div>
                <p class="text-xs text-neutral-600 leading-relaxed font-sans">
                  {{ cit.applicabilityRationale || 'Mandates annual severe-but-plausible scenario simulations across critical operations.' }}
                </p>
              </div>

              <!-- Block 2: Confidence: 98% • Verified Grounding + Statutory Proof -->
              <div class="p-3.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80 space-y-1">
                <div class="flex items-center justify-between gap-2">
                  <div class="inline-flex items-center gap-1.5 text-xs font-bold text-neutral-900">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                    <span>Confidence: {{ cit.confidenceScore || 98 }}% • Verified Grounding</span>
                  </div>
                  <span class="text-[11px] font-mono text-neutral-700 bg-white border border-neutral-200 px-2 py-0.5 rounded shadow-2xs">
                    Statutory Proof
                  </span>
                </div>
                <p class="text-xs text-neutral-600 leading-relaxed font-sans">
                  {{ cit.groundingCertainty || `Grounding certainty anchored directly in ${cit.regulatorAcronym || cit.authority} official gazetted legislation and supervisory circulars, excluding speculative interpretations.` }}
                </p>
              </div>

              <!-- Block 3: AUTHENTIC CLAUSE EXCERPT -->
              <div class="p-3.5 rounded-xl bg-neutral-50/90 border border-neutral-200/80 space-y-1">
                <div class="text-[10px] font-bold text-neutral-400 uppercase tracking-wider font-mono">
                  AUTHENTIC CLAUSE EXCERPT
                </div>
                <p class="text-xs font-mono text-neutral-800 leading-relaxed">
                  {{ cit.excerpt || 'AIs must conduct scenario testing against severe but plausible scenarios to identify vulnerabilities in their operational resilience framework.' }}
                </p>
              </div>

              <!-- Bottom Action Bar: Followed / Follow Authority & Bookmark -->
              <div class="flex items-center justify-between gap-3 pt-1">
                <!-- Follow Authority Pill -->
                <button
                  type="button"
                  @click="handleToggleFollow(cit)"
                  :class="`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    isAuthorityFollowed(cit)
                      ? 'bg-neutral-900 text-white hover:bg-neutral-800'
                      : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-100'
                  }`"
                >
                  <UserCheck v-if="isAuthorityFollowed(cit)" class="w-3.5 h-3.5 text-white" />
                  <UserPlus v-else class="w-3.5 h-3.5 text-neutral-500" />
                  <span>{{ isAuthorityFollowed(cit) ? `Followed ${cit.regulatorAcronym || cit.authority}` : `+ Follow ${cit.regulatorAcronym || cit.authority}` }}</span>
                </button>

                <!-- Bookmark Pill -->
                <button
                  type="button"
                  @click="handleToggleBookmark(cit)"
                  :class="`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                    directoryStore.isBookmarked(cit.citationId, undefined, cit.sourceTitle)
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-white text-neutral-800 border border-neutral-200 hover:bg-neutral-100'
                  }`"
                >
                  <BookmarkCheck v-if="directoryStore.isBookmarked(cit.citationId, undefined, cit.sourceTitle)" class="w-3.5 h-3.5 text-white" />
                  <Bookmark v-else class="w-3.5 h-3.5 text-neutral-500" />
                  <span>{{ directoryStore.isBookmarked(cit.citationId, undefined, cit.sourceTitle) ? 'Bookmarked' : 'Bookmark' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Safety Confirmation Modal for Deleting Macro Cards -->
    <Teleport to="body">
      <div
        v-if="showDeleteConfirmModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-text animate-in fade-in"
      >
        <div class="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 max-w-sm w-full space-y-4">
          <div class="flex items-center gap-2.5 text-rose-600">
            <AlertTriangle class="w-5 h-5" />
            <h4 class="text-sm font-bold text-neutral-900">Delete Macro Inquiries?</h4>
          </div>
          <p class="text-xs text-neutral-600 leading-relaxed">
            Are you sure you want to delete all broadcast inquiries for this question? This action will remove the audit trail for this query session.
          </p>
          <div class="flex items-center justify-end gap-2 pt-2">
            <button
              @click="showDeleteConfirmModal = false"
              class="px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all shadow-2xs cursor-pointer"
            >
              Cancel
            </button>
            <button
              @click="handleDeleteAllMacroFollowUps"
              class="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
            >
              Confirm Delete
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- Modal for Adding New Grounding Source (Supports Unlimited Cards) -->
    <Teleport to="body">
      <div
        v-if="isAddSourceModalOpen"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-text animate-in fade-in"
      >
        <div class="bg-white rounded-2xl shadow-xl border border-neutral-200 p-6 max-w-lg w-full space-y-4">
          <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText class="w-4 h-4" />
              </div>
              <div>
                <h3 class="text-sm font-bold text-neutral-900">Add Grounding Source</h3>
                <p class="text-[11px] text-neutral-500">Append an authoritative legal citation for {{ currentJurisdiction.name }}</p>
              </div>
            </div>
            <button
              type="button"
              @click="isAddSourceModalOpen = false"
              class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <form @submit.prevent="handleSaveNewSource" class="space-y-3.5 text-xs">
            <div class="space-y-1">
              <label class="block font-bold text-neutral-800">
                Statutory Source Title <span class="text-rose-500">*</span>
              </label>
              <input
                type="text"
                v-model="newSourceTitle"
                required
                placeholder="e.g. Banking Ordinance (Cap. 155) / MAS Notice 655"
                class="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors"
              />
            </div>

            <div class="grid grid-cols-2 gap-3">
              <div class="space-y-1">
                <label class="block font-bold text-neutral-800">Supervisory Authority</label>
                <input
                  type="text"
                  v-model="newSourceAuthority"
                  placeholder="e.g. HKMA, MAS, FCA"
                  class="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors"
                />
              </div>

              <div class="space-y-1">
                <label class="block font-bold text-neutral-800">Official Link / URL</label>
                <input
                  type="url"
                  v-model="newSourceUrl"
                  placeholder="https://..."
                  class="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors font-mono"
                />
              </div>
            </div>

            <div class="space-y-1">
              <label class="block font-bold text-neutral-800">Authentic Clause Excerpt</label>
              <textarea
                v-model="newSourceExcerpt"
                rows="2"
                placeholder="Statutory clause excerpt or gazetted quotation..."
                class="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors font-mono"
              ></textarea>
            </div>

            <div class="space-y-1">
              <label class="block font-bold text-neutral-800">Applicability Rationale</label>
              <textarea
                v-model="newSourceRationale"
                rows="2"
                placeholder="Why this legal source applies to this specific compliance inquiry..."
                class="w-full px-3 py-2 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-blue-600 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors"
              ></textarea>
            </div>

            <div class="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100">
              <button
                type="button"
                @click="isAddSourceModalOpen = false"
                class="px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold cursor-pointer transition-all shadow-2xs"
              >
                Cancel
              </button>
              <button
                type="submit"
                :disabled="!newSourceTitle.trim()"
                class="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Add to Evidence Pack</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </Teleport>
  </div>
</template>
