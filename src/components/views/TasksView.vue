<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  ClipboardList,
  Search,
  Plus,
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  AlertCircle,
  Layers,
  FileText,
  Building2,
  Trash2,
  Share2,
  Download,
  Copy,
  Check,
  X,
  Pin,
  UserPlus,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
  ShieldCheck,
} from 'lucide-vue-next';
import { useTaskStore, type ComplianceTask, type TaskQuestion } from '@/stores/taskStore';
import { useDirectoryStore } from '@/stores/directoryStore';
import { ALL_JURISDICTIONS, type RegulatorInScope, type MatrixSessionState } from '@/types';
import BatchQuestionModal from '../modals/BatchQuestionModal.vue';
import ResearchMatrixWorkbench from './ResearchMatrixWorkbench.vue';
import { createDynamicMatrixSession, initialMatrixSession1 } from '@/data/matrixMockData';

const props = defineProps<{
  initialSelectedTaskId?: string | null;
  regulators?: RegulatorInScope[];
}>();

const emit = defineEmits<{
  (e: 'openCreateTaskModal'): void;
  (e: 'navigateToNewsDetail', item: any): void;
  (e: 'navigateToRegulatorDetail', regulatorId: string): void;
  (e: 'toggleFollowRegulator', regulatorId: string): void;
  (e: 'toggleFollowRegulatorByAcronym', acronym: string, targetFollow: boolean): void;
  (e: 'showToast', title: string, message: string, type: 'success' | 'info' | 'warning'): void;
}>();

const taskStore = useTaskStore();
const directoryStore = useDirectoryStore();

// Collapse/Expand state for Linked News & Regulators
const isLinkedContextCollapsed = ref(false);
const isNewsCollapsed = ref(false);
const isRegulatorsCollapsed = ref(false);

// Search & Multi-Select Filter state
const searchQuery = ref('');
const selectedStatuses = ref<string[]>([]);
const selectedJurisdictions = ref<string[]>([]);
const selectedLinkages = ref<string[]>([]);

const hasActiveFilters = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    selectedStatuses.value.length > 0 ||
    selectedJurisdictions.value.length > 0 ||
    selectedLinkages.value.length > 0
  );
});

const handleClearAllFilters = () => {
  searchQuery.value = '';
  selectedStatuses.value = [];
  selectedJurisdictions.value = [];
  selectedLinkages.value = [];
};

// Selected task for detail view - defaults to initialSelectedTaskId or first task so questions are immediately visible
const selectedTaskId = ref<string | null>(
  props.initialSelectedTaskId || (taskStore.tasks.length > 0 ? taskStore.tasks[0].id : null)
);

watch(
  () => props.initialSelectedTaskId,
  (newVal) => {
    if (newVal) {
      selectedTaskId.value = newVal;
      isMatrixMode.value = false;
      activeMatrixSession.value = null;
    }
  }
);

// Batch Questions Modal state
const isBatchModalOpen = ref(false);

// Matrix Workbench Mode State (viewing matrix for a question/task)
const isMatrixMode = ref(false);
const activeMatrixSession = ref<MatrixSessionState | null>(null);

// Table Display View Mode: Flat Table vs Collapsible Batch Grouping
const isBatchGroupedView = ref(false);
const expandedBatches = ref<Record<string, boolean>>({});

const toggleBatchCollapse = (batchLabel: string) => {
  expandedBatches.value[batchLabel] = !expandedBatches.value[batchLabel];
};

// Report Modal
const isReportModalOpen = ref(false);

// Active citation pin modal
const activeCitation = ref<{ pin: string; sourceTitle: string; url: string; excerpt: string; clause?: string } | null>(null);

const currentTask = computed<ComplianceTask | null>(() => {
  if (!selectedTaskId.value) return null;
  return taskStore.tasks.find((t) => t.id === selectedTaskId.value) || null;
});

interface AggregatedTaskSource {
  title: string;
  authority: string;
  jurisdiction: string;
  url: string;
  publishDate?: string;
  rationale?: string;
  excerpt?: string;
  count: number;
}

const taskAggregatedSources = computed<AggregatedTaskSource[]>(() => {
  if (!currentTask.value || !currentTask.value.questions) return [];
  const map = new Map<string, AggregatedTaskSource>();

  currentTask.value.questions.forEach((q) => {
    if (q.retrievedUrls && q.retrievedUrls.length > 0) {
      q.retrievedUrls.forEach((u) => {
        const key = u.title.trim().toLowerCase();
        if (map.has(key)) {
          map.get(key)!.count++;
        } else {
          map.set(key, {
            title: u.title,
            authority: u.authority,
            jurisdiction: u.jurisdiction,
            url: u.url,
            publishDate: u.publishDate,
            rationale: u.rationale,
            excerpt: u.excerpt,
            count: 1,
          });
        }
      });
    }
  });

  return Array.from(map.values());
});

const taskAggregatedRegulators = computed(() => {
  const authorities = new Set<string>();
  taskAggregatedSources.value.forEach((s) => {
    if (s.authority) authorities.add(s.authority);
  });
  return Array.from(authorities);
});

// Deduplicated regulatory authorities with detailed names & jurisdictions (主管機關)
const taskDeduplicatedRegulatorsDetail = computed(() => {
  const map = new Map<string, { acronym: string; name: string; jurisdiction: string; id?: string }>();

  taskAggregatedSources.value.forEach((s) => {
    const acronym = (s.authority || '').trim();
    if (acronym && !map.has(acronym.toUpperCase())) {
      const matched = props.regulators?.find(
        (r) => r.acronym?.toUpperCase() === acronym.toUpperCase() || r.name?.toUpperCase() === acronym.toUpperCase()
      );
      map.set(acronym.toUpperCase(), {
        acronym: acronym,
        name: matched?.name || (acronym.length > 5 ? acronym : `${acronym} Regulatory Authority`),
        jurisdiction: matched?.jurisdiction || s.jurisdiction || 'Global',
        id: matched?.id || `reg-${acronym.toLowerCase()}`,
      });
    }
  });

  if (currentTask.value?.linkedRegulatorIds) {
    currentTask.value.linkedRegulatorIds.forEach((regId) => {
      const norm = regId.replace('reg-', '').toUpperCase();
      if (norm && !map.has(norm)) {
        const matched = props.regulators?.find((r) => r.id === regId || r.acronym?.toUpperCase() === norm);
        map.set(norm, {
          acronym: matched?.acronym || norm,
          name: matched?.name || `${norm} Regulatory Authority`,
          jurisdiction: matched?.jurisdiction || 'Global',
          id: matched?.id || regId,
        });
      }
    });
  }

  return Array.from(map.values());
});

const taskAggregatedJurisdictions = computed(() => {
  const jurSet = new Set<string>();
  taskAggregatedSources.value.forEach((s) => {
    if (s.jurisdiction) jurSet.add(s.jurisdiction);
  });
  if (currentTask.value?.homeJurisdiction) jurSet.add(currentTask.value.homeJurisdiction);
  if (currentTask.value?.targetJurisdictions) {
    currentTask.value.targetJurisdictions.forEach((tj) => jurSet.add(tj));
  }
  return Array.from(jurSet);
});

const filteredTasks = computed(() => {
  return taskStore.tasks.filter((t) => {
    if (searchQuery.value.trim()) {
      const q = searchQuery.value.toLowerCase().trim();
      const match =
        t.title.toLowerCase().includes(q) ||
        (t.topic && t.topic.toLowerCase().includes(q)) ||
        t.jurisdiction.toLowerCase().includes(q) ||
        t.questions.some((qu) => qu.questionText.toLowerCase().includes(q));
      if (!match) return false;
    }

    // Status multi-select
    if (selectedStatuses.value.length > 0 && !selectedStatuses.value.includes(t.status)) {
      return false;
    }

    // Jurisdiction multi-select
    if (selectedJurisdictions.value.length > 0) {
      const matchJur = selectedJurisdictions.value.some((jur) => {
        const jLower = jur.toLowerCase();
        if (t.jurisdiction && t.jurisdiction.toLowerCase().includes(jLower)) return true;
        if (t.homeJurisdiction && t.homeJurisdiction.toLowerCase().includes(jLower)) return true;
        if (t.targetJurisdiction && t.targetJurisdiction.toLowerCase().includes(jLower)) return true;
        if (t.targetJurisdictions && t.targetJurisdictions.some((tj) => tj.toLowerCase().includes(jLower))) return true;
        return false;
      });
      if (!matchJur) return false;
    }

    // Linkage multi-select
    if (selectedLinkages.value.length > 0) {
      const hasNews = t.linkedNewsIds && t.linkedNewsIds.length > 0;
      const hasRegs = t.linkedRegulatorIds && t.linkedRegulatorIds.length > 0;
      const hasNoLinks = !hasNews && !hasRegs;

      const matchNews = selectedLinkages.value.includes('Has Linked News') && hasNews;
      const matchRegs = selectedLinkages.value.includes('Has Linked Regulators') && hasRegs;
      const matchNone = selectedLinkages.value.includes('No Links') && hasNoLinks;

      if (!matchNews && !matchRegs && !matchNone) return false;
    }

    return true;
  });
});

// Pagination for Tasks View (default 20, options 40, 60, 100)
const pageSize = ref<number>(20);
const currentPage = ref<number>(1);

const paginatedTasks = computed(() => {
  const start = (currentPage.value - 1) * pageSize.value;
  return filteredTasks.value.slice(start, start + pageSize.value);
});

watch([searchQuery, selectedStatuses, selectedJurisdictions, selectedLinkages], () => {
  currentPage.value = 1;
});

const selectTask = (task: ComplianceTask) => {
  selectedTaskId.value = task.id;
  isMatrixMode.value = false;
  activeMatrixSession.value = null;
};

const handleBackToList = () => {
  selectedTaskId.value = null;
  isMatrixMode.value = false;
  activeMatrixSession.value = null;
};

// Handle in-place batch question creation
const handleBatchQuestionsSubmit = (payload: {
  questions: string[];
  targetJurisdictions: string[];
  clarificationNotes?: string;
}) => {
  if (!currentTask.value) return;

  const added = taskStore.addBatchQuestionsToTask(currentTask.value.id, payload);
  isBatchModalOpen.value = false;
  emit(
    'showToast',
    'Questions Added',
    `Successfully added ${added.length} questions in Batch ${(currentTask.value.batches?.length || 1)}.`,
    'success'
  );

  // Automatically open Research Matrix for all task questions starting at the first newly added question
  const newFocusIdx = currentTask.value.questions.findIndex((q) => q.id === added[0]?.id);
  openMatrixForQuestions(
    currentTask.value,
    currentTask.value.questions.map((q) => q.questionText),
    undefined,
    newFocusIdx >= 0 ? newFocusIdx : 0
  );
};

// Open Research Matrix Workbench for all questions or selected question
const openMatrixForQuestions = (
  task: ComplianceTask,
  questionsList?: string[],
  jurisdictionsList?: string[],
  focusQuestionIndex = 0
) => {
  const qs = questionsList && questionsList.length > 0
    ? questionsList
    : task.questions.map((q) => q.questionText);

  // Collect all jurisdictions relevant to this task
  let jurs: string[] = [];
  if (jurisdictionsList && jurisdictionsList.length > 0) {
    jurs = jurisdictionsList;
  } else {
    const set = new Set<string>();
    if (task.homeJurisdiction) set.add(task.homeJurisdiction);
    if (task.targetJurisdictions) task.targetJurisdictions.forEach((tj) => set.add(tj));
    task.questions.forEach((q) => {
      if (q.targetJurisdictions) q.targetJurisdictions.forEach((tj) => set.add(tj));
    });
    jurs = set.size > 0 ? Array.from(set) : ['Hong Kong', 'Singapore', 'United Kingdom', 'United States'];
  }

  // Map jurisdiction names to standard 2-letter codes
  const jurCodes = jurs.map((j) => {
    const jLow = j.toLowerCase();
    if (jLow.includes('hong kong') || jLow === 'hk') return 'HK';
    if (jLow.includes('singapore') || jLow === 'sg') return 'SG';
    if (jLow.includes('united kingdom') || jLow === 'uk') return 'UK';
    if (jLow.includes('united states') || jLow === 'us') return 'US';
    if (jLow.includes('australia') || jLow === 'au') return 'AU';
    if (jLow.includes('japan') || jLow === 'jp') return 'JP';
    if (jLow.includes('european union') || jLow === 'eu') return 'EU';
    if (jLow.includes('indonesia') || jLow === 'id') return 'ID';
    return j.slice(0, 2).toUpperCase();
  });

  const uniqueCodes = Array.from(new Set(jurCodes));
  const session = createDynamicMatrixSession(qs, uniqueCodes, `${task.title} Matrix`);
  session.activeQuestionIndex = focusQuestionIndex >= 0 && focusQuestionIndex < qs.length ? focusQuestionIndex : 0;
  activeMatrixSession.value = session;
  isMatrixMode.value = true;
};

// Export Questions CSV
const handleExportTaskQuestionsCsv = (task: ComplianceTask) => {
  const headers = [
    'Global Index (#)',
    'Question Text',
    'Batch Q#',
    'Batch',
    'Target Jurisdiction(s)',
    'Status',
    'Summary Findings',
    'Created At',
  ];

  const rows = task.questions.map((q, idx) => {
    const globalIdx = (idx + 1).toString().padStart(2, '0');
    const batchQ = `${q.batchIndex || (idx + 1)}Q`;
    const batchLabel = q.batchLabel || (q.batchNumber ? `Batch ${q.batchNumber}` : 'Batch 1');
    const jurs = (q.targetJurisdictions && q.targetJurisdictions.length > 0 ? q.targetJurisdictions : task.targetJurisdictions || [task.jurisdiction]).join(', ');

    return [
      `"${globalIdx}"`,
      `"${q.questionText.replace(/"/g, '""')}"`,
      `"${batchQ}"`,
      `"${batchLabel}"`,
      `"${jurs}"`,
      `"${q.status}"`,
      `"${(q.summary || '').replace(/"/g, '""')}"`,
      `"${q.createdAt || task.updatedAt}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${task.title.replace(/[^a-zA-Z0-9]/g, '_')}_questions_${Date.now()}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);

  emit('showToast', 'Export Successful', `Exported ${task.questions.length} questions to CSV.`, 'success');
};

const handleDeleteTask = (taskId: string) => {
  taskStore.deleteTask(taskId);
  selectedTaskId.value = null;
  emit('showToast', 'Task Removed', 'Analysis task has been deleted.', 'info');
};

const handleUnlinkNews = (taskId: string, newsId: string) => {
  taskStore.unlinkNewsFromTask(taskId, newsId);
  emit('showToast', 'Link Removed', 'News item unlinked from this task.', 'info');
};

const handleUnlinkRegulator = (taskId: string, regulatorId: string) => {
  taskStore.unlinkRegulatorFromTask(taskId, regulatorId);
  emit('showToast', 'Link Removed', 'Regulator unlinked from this task.', 'info');
};

const handleOpenSourceInDrawer = (url: any) => {
  emit('navigateToNewsDetail', {
    id: url.id,
    title: url.title,
    officialUrl: url.url,
    regulator: url.authority,
    regulatorAcronym: url.authority,
    jurisdiction: url.jurisdiction,
    whyRelevantExplanation: url.rationale || 'Primary supervisory standard addressing the compliance task requirements.',
    authenticExcerpt: url.excerpt || url.title,
    publishDate: url.publishDate || '2026-03-20',
    docType: url.docType || 'Guideline',
  });
};

const handleToggleUrlBookmark = (taskId: string, questionId: string, url: any) => {
  const isNowBookmarked = taskStore.toggleUrlBookmark(taskId, questionId, url.id);
  if (isNowBookmarked) {
    directoryStore.addBookmark({
      id: url.id,
      title: url.title,
      referenceNumber: `REF-${url.authority}-2026`,
      docType: url.docType || 'Guideline',
      regulator: url.authority,
      regulatorAcronym: url.authority,
      jurisdiction: url.jurisdiction,
      category: 'Financial Services & Capital Markets',
      themes: ['Operational resilience and incident reporting'],
      publishDate: url.publishDate || '2026-03-20',
      effectiveDate: '2026-06-30',
      aiRelevanceScore: 92,
      materiality: 'Relevant',
      diligenceStatus: 'None',
      status: 'None',
      owner: 'Ivan Choy',
      officialUrl: url.url,
      executiveSummary: url.rationale || url.title,
      operationalImpact: 'Monitored regulatory document identified via Compliance Task.',
      affectedBusinessUnits: ['Compliance', 'Legal'],
      authenticExcerpt: url.excerpt || url.title,
      auditTimeline: [],
      whyRelevantExplanation: url.rationale,
    });
    emit('showToast', 'URL Bookmarked', `"${url.title.slice(0, 36)}..." saved to Directory Bookmarks.`, 'success');
  } else {
    directoryStore.removeBookmark(url.id, undefined, url.title);
    emit('showToast', 'Bookmark Removed', `"${url.title.slice(0, 36)}..." removed from Directory Bookmarks.`, 'info');
  }
};

const handleToggleUrlFollow = (taskId: string, questionId: string, url: any) => {
  const isNowFollowed = taskStore.toggleUrlFollow(taskId, questionId, url.id);
  emit(
    'showToast',
    isNowFollowed ? 'Authority Followed' : 'Authority Unfollowed',
    `${url.authority} (${url.jurisdiction}) is now ${isNowFollowed ? 'followed for active surveillance' : 'unfollowed'}.`,
    isNowFollowed ? 'success' : 'info'
  );
};

// Grounding Confidence Helper: Confidence (Statutory Grounding & Verification)
const getSourceConfidence = (url: any, idx = 0) => {
  const docType = (url.docType || '').toLowerCase();
  let score = 98;
  if (docType.includes('legislation') || docType.includes('act') || docType.includes('rulebook')) {
    score = 99;
  } else if (docType.includes('circular') || docType.includes('guideline') || docType.includes('standard')) {
    score = 98;
  } else if (docType.includes('consultation')) {
    score = 93;
  } else {
    score = 96 + ((idx * 2) % 3);
  }
  const level = score >= 95 ? 'High (Verified)' : score >= 88 ? 'Med (Substantiated)' : 'Moderate';
  return {
    score,
    level,
    description: 'High grounding certainty: anchored directly in official statutory gazettes and explicit regulatory provisions.',
  };
};

// All unique sources used across task questions (Linked News & Publications)
const allTaskSources = computed(() => {
  if (!currentTask.value) return [];
  const map = new Map<string, any>();

  // Gather from all questions' retrievedUrls
  for (const q of currentTask.value.questions) {
    for (const url of q.retrievedUrls || []) {
      const key = url.id || url.url || url.title;
      if (!map.has(key)) {
        map.set(key, {
          ...url,
          questionId: q.id,
          isBookmarked: directoryStore.isBookmarked(url.id, undefined, url.title),
        });
      }
    }
  }

  return Array.from(map.values());
});

// All unique regulatory authorities involved across task questions (Linked Regulatory Authorities)
const allTaskAuthorities = computed(() => {
  if (!currentTask.value) return [];
  const map = new Map<string, any>();

  // 1. Gather from retrievedUrls authorities
  for (const q of currentTask.value.questions) {
    for (const url of q.retrievedUrls || []) {
      const acronym = (url.authority || '').trim().toUpperCase();
      if (acronym && !map.has(acronym)) {
        const matched = props.regulators?.find(
          (r) => r.acronym?.toUpperCase() === acronym || r.name?.toUpperCase() === acronym
        );

        map.set(acronym, {
          acronym,
          name: matched?.name || `${acronym} Regulatory Authority`,
          jurisdiction: matched?.jurisdiction || url.jurisdiction || 'Global',
          id: matched?.id || `reg-${acronym.toLowerCase()}`,
          isFollowed: matched ? matched.isFollowed : url.isFollowed ?? true,
        });
      }
    }
  }

  // 2. Also check currentTask.linkedRegulatorIds
  for (const regId of currentTask.value.linkedRegulatorIds || []) {
    const norm = regId.replace('reg-', '').toUpperCase();
    if (norm && !map.has(norm)) {
      const matched = props.regulators?.find(
        (r) => r.id === regId || r.acronym?.toUpperCase() === norm
      );
      map.set(norm, {
        acronym: norm,
        name: matched?.name || `${norm} Regulatory Authority`,
        jurisdiction: matched?.jurisdiction || 'Global',
        id: matched?.id || regId,
        isFollowed: matched ? matched.isFollowed : true,
      });
    }
  }

  return Array.from(map.values());
});

const handleToggleSourceBookmark = (source: any) => {
  const isAlreadyBookmarked = directoryStore.isBookmarked(source.id, undefined, source.title);
  if (isAlreadyBookmarked) {
    directoryStore.removeBookmark(source.id, undefined, source.title);
    if (currentTask.value) {
      for (const q of currentTask.value.questions) {
        for (const u of q.retrievedUrls) {
          if (u.id === source.id || u.title === source.title) {
            u.isBookmarked = false;
          }
        }
      }
    }
    emit('showToast', 'Bookmark Removed', `"${source.title.slice(0, 36)}..." removed from Directory Bookmarks.`, 'info');
  } else {
    directoryStore.addBookmark({
      id: source.id,
      title: source.title,
      referenceNumber: `REF-${source.authority}-2026`,
      docType: source.docType || 'Guideline',
      regulator: source.authority,
      regulatorAcronym: source.authority,
      jurisdiction: source.jurisdiction,
      category: 'Financial Services & Capital Markets',
      themes: ['Operational resilience and incident reporting'],
      publishDate: source.publishDate || '2026-03-20',
      effectiveDate: '2026-06-30',
      aiRelevanceScore: 92,
      materiality: 'Relevant',
      diligenceStatus: 'None',
      status: 'None',
      owner: 'Ivan Choy',
      officialUrl: source.url,
      executiveSummary: source.rationale || source.title,
      operationalImpact: 'Monitored regulatory document referenced in Compliance Task.',
      affectedBusinessUnits: ['Compliance', 'Legal'],
      authenticExcerpt: source.excerpt || source.title,
      auditTimeline: [],
      whyRelevantExplanation: source.rationale,
    });
    if (currentTask.value) {
      for (const q of currentTask.value.questions) {
        for (const u of q.retrievedUrls) {
          if (u.id === source.id || u.title === source.title) {
            u.isBookmarked = true;
          }
        }
      }
    }
    emit('showToast', 'Bookmarked to Directory', `"${source.title.slice(0, 36)}..." saved to Directory > Bookmarks.`, 'success');
  }
};

const handleToggleAuthorityFollow = (authority: any) => {
  const targetFollow = !authority.isFollowed;
  if (authority.id) {
    emit('toggleFollowRegulator', authority.id);
  } else {
    emit('toggleFollowRegulatorByAcronym', authority.acronym, targetFollow);
  }

  // Also update task questions url.isFollowed
  if (currentTask.value) {
    for (const q of currentTask.value.questions) {
      for (const u of q.retrievedUrls) {
        if (u.authority?.toUpperCase() === authority.acronym?.toUpperCase()) {
          u.isFollowed = targetFollow;
        }
      }
    }
  }

  emit(
    'showToast',
    targetFollow ? 'Authority Followed' : 'Authority Unfollowed',
    `${authority.name} (${authority.acronym}) is now ${targetFollow ? 'followed in Regulator Surveillance Scope' : 'unfollowed'}.`,
    targetFollow ? 'success' : 'info'
  );
};

// Starter Templates for Empty State
const starterTemplates = [
  {
    title: 'Cross-Border Operational Resilience & Outsourcing',
    topic: 'Operational Resilience',
    jurisdiction: 'Hong Kong & Singapore',
    questions: [
      'What are the mandatory statutory notification timelines for severe cybersecurity or operational disruptions?',
      'Are financial institutions required to enforce direct inspection and audit rights in cloud vendor contracts?',
    ],
  },
  {
    title: 'Corporate Secretarial & Beneficial Ownership Review',
    topic: 'Corporate Governance & AML/CFT',
    jurisdiction: 'Hong Kong & United Kingdom',
    questions: [
      'Can a body corporate serve as sole director or company secretary in this jurisdiction?',
      'What are the statutory filing deadlines and regulatory licensing for corporate service providers?',
    ],
  },
  {
    title: 'Virtual Asset Service Provider (VASP) Licensing Scope',
    topic: 'VASP & Market Conduct',
    jurisdiction: 'Hong Kong & European Union',
    questions: [
      'What licensing triggers apply to cross-border virtual asset trading platforms serving retail customers?',
      'What client asset segregation and custody requirements are mandated?',
    ],
  },
];

const handleCreateFromTemplate = (tpl: (typeof starterTemplates)[0]) => {
  const created = taskStore.createTask({
    title: tpl.title,
    topic: tpl.topic,
    jurisdiction: tpl.jurisdiction,
    rawQuestions: tpl.questions,
  });
  selectedTaskId.value = created.id;
  emit('showToast', 'Task Created', `"${created.title}" initialized with analysis.`, 'success');
};
</script>

<template>
  <div class="tasks-view w-full p-4 sm:p-6 lg:p-8 space-y-5 animate-in fade-in">
    <!-- ============================================================= -->
    <!-- VIEW A: TASK DETAIL VIEW (When a task is selected)           -->
    <!-- ============================================================= -->
    <div v-if="currentTask" class="space-y-6">
      <!-- Detail Header: Retain ONLY Title (+ Back navigation) -->
      <div class="flex items-center justify-between gap-4 border-b border-neutral-200 pb-4 flex-wrap">
        <div class="flex items-center gap-3 flex-wrap">
          <button
            @click="handleBackToList"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-xs font-semibold text-neutral-700 transition-all shadow-2xs cursor-pointer"
          >
            <ArrowLeft class="w-4 h-4" />
            <span>Back to All Tasks</span>
          </button>
          <h1 class="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
            {{ currentTask.title }}
          </h1>
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          <!-- Open Research Matrix Workbench -->
          <button
            @click="openMatrixForQuestions(currentTask)"
            class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
            title="Open Interactive Research Matrix Workbench"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>Research Matrix</span>
          </button>

          <!-- Delete Task -->
          <button
            @click="handleDeleteTask(currentTask.id)"
            class="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-neutral-400 transition-colors cursor-pointer"
            title="Delete Task"
          >
            <Trash2 class="w-4 h-4" />
          </button>
        </div>
      </div>

      <!-- ============================================================= -->
      <!-- SUB-VIEW 1: RESEARCH MATRIX WORKBENCH (When active)           -->
      <!-- ============================================================= -->
      <ResearchMatrixWorkbench
        v-if="isMatrixMode && activeMatrixSession"
        :session="activeMatrixSession"
        :taskId="currentTask.id"
        :taskTitle="currentTask.title"
        @back="isMatrixMode = false"
        @openNewMatrixSetup="isBatchModalOpen = true"
        @showToast="(title, msg, type) => emit('showToast', title, msg, type)"
      />

      <!-- ============================================================= -->
      <!-- SUB-VIEW 2: QUESTION LIST & BATCH MANAGEMENT (Default Detail) -->
      <!-- ============================================================= -->
      <div v-else class="space-y-6">
        <!-- TASK CONTEXT & EVALUATION SCOPE: Grounded on aggregated sources & regulators from all questions -->
        <div class="bg-white rounded-2xl border border-neutral-200 p-5 sm:p-6 shadow-2xs space-y-4">
          <div class="flex items-center justify-between flex-wrap gap-2 border-b border-neutral-100 pb-3">
            <div class="flex items-center gap-2.5">
              <div class="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-2xs">
                <FileText class="w-4 h-4" />
              </div>
              <div>
                <h2 class="text-sm sm:text-base font-bold text-neutral-900 tracking-tight">
                  Task Context & Evaluation Scope
                </h2>
                <p class="text-[11px] text-neutral-500">
                  Authoritative regulatory inventory aggregated across all {{ currentTask.questions.length }} compliance inquiries in this task container.
                </p>
              </div>
            </div>

            <div class="flex items-center gap-2 flex-wrap text-xs">
              <span class="font-bold bg-neutral-100 text-neutral-800 px-2.5 py-1 rounded-md border border-neutral-200">
                {{ taskAggregatedRegulators.length }} Regulators in Scope
              </span>
              <span class="font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-md border border-blue-200 font-mono">
                {{ taskAggregatedSources.length }} Grounding Sources
              </span>
            </div>
          </div>

          <!-- Task Summary & Background Context -->
          <div class="p-3.5 rounded-xl bg-neutral-50 border border-neutral-200/80 text-xs text-neutral-700 leading-relaxed space-y-1.5">
            <div class="font-bold text-neutral-800 text-[11px] uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles class="w-3.5 h-3.5 text-blue-600" />
              <span>Supervisory Context & Cross-Border Scope</span>
            </div>
            <p class="leading-relaxed font-sans">
              {{ currentTask.summary || 'Comprehensive multi-jurisdictional evaluation scope benchmarking operational compliance standards, incident reporting requirements, and statutory governance.' }}
            </p>
          </div>

          <!-- Two-column Layout: Sources on Left (only title and official link) & Deduplicated Regulators on Right -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-1 items-start">
            <!-- Left Side: Sources (only need the title and Official link) -->
            <div class="lg:col-span-7 xl:col-span-8 space-y-2.5">
              <div class="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                <div class="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText class="w-3.5 h-3.5 text-blue-600" />
                  <span>Sources ({{ taskAggregatedSources.length }})</span>
                </div>
                <span class="text-[11px] text-neutral-400">All Question Grounding Authorities</span>
              </div>

              <div v-if="taskAggregatedSources.length === 0" class="p-6 text-center text-xs text-neutral-400 italic bg-neutral-50/70 rounded-xl border border-neutral-200">
                No external sources recorded for this task.
              </div>

              <!-- List of sources: ONLY title and Official link as requested -->
              <div v-else class="space-y-2">
                <div
                  v-for="(source, sIdx) in taskAggregatedSources"
                  :key="`agg-src-${sIdx}`"
                  class="p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200 shadow-2xs hover:border-neutral-300 flex items-center justify-between gap-3 transition-colors text-xs"
                >
                  <div class="font-semibold text-neutral-900 leading-snug line-clamp-2 pr-2">
                    {{ source.title }}
                  </div>
                  <a
                    :href="source.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 transition-colors"
                  >
                    <span>Official Link</span>
                    <ExternalLink class="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            <!-- Right Side: 去重集合主管機關 (Deduplicated Regulators in Scope) -->
            <div class="lg:col-span-5 xl:col-span-4 space-y-2.5">
              <div class="flex items-center justify-between pb-1.5 border-b border-neutral-100">
                <div class="text-[11px] font-bold text-neutral-600 uppercase tracking-wider flex items-center gap-1.5">
                  <Building2 class="w-3.5 h-3.5 text-blue-600" />
                  <span>主管機關 ({{ taskDeduplicatedRegulatorsDetail.length }})</span>
                </div>
                <span class="text-[11px] text-neutral-400 font-mono">Deduplicated</span>
              </div>

              <div v-if="taskDeduplicatedRegulatorsDetail.length === 0" class="p-6 text-center text-xs text-neutral-400 italic bg-neutral-50/70 rounded-xl border border-neutral-200">
                No supervisory authorities identified in task scope.
              </div>

              <div v-else class="space-y-2">
                <div
                  v-for="reg in taskDeduplicatedRegulatorsDetail"
                  :key="reg.acronym"
                  class="p-3 sm:p-3.5 rounded-xl bg-white border border-neutral-200 shadow-2xs flex items-center justify-between gap-3 text-xs"
                >
                  <div class="flex items-center gap-2.5 min-w-0">
                    <span class="text-xs font-bold bg-blue-600 text-white px-2.5 py-1 rounded-md shadow-2xs shrink-0">
                      {{ reg.acronym }}
                    </span>
                    <div class="min-w-0">
                      <div class="font-bold text-neutral-900 truncate">
                        {{ reg.name }}
                      </div>
                      <div class="text-[10px] text-neutral-500 font-medium">
                        {{ reg.jurisdiction }}
                      </div>
                    </div>
                  </div>

                  <span class="shrink-0 text-[10px] font-semibold text-neutral-600 bg-neutral-100 border border-neutral-200 px-2 py-0.5 rounded">
                    In Scope
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- QUESTIONS MASTER TABLE: Total Counter & Batch Tracking (As Specified) -->
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden space-y-0">
          <!-- Table Header Controls Bar -->
          <div class="p-4 sm:p-5 border-b border-neutral-200 flex items-center justify-between flex-wrap gap-3 bg-neutral-50/70">
            <div>
              <div class="flex items-center gap-2.5 flex-wrap">
                <h2 class="text-sm sm:text-base font-bold text-neutral-900 flex items-center gap-2">
                  <ClipboardList class="w-4 h-4 text-blue-600" />
                  <span>Question Master List</span>
                </h2>

                <!-- Total Counter (Total X Questions across Y Batches) -->
                <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Total {{ currentTask.questions.length }} Questions
                </span>

                <span
                  v-if="currentTask.batches && currentTask.batches.length > 0"
                  class="text-[11px] font-semibold text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded-full border border-neutral-200"
                >
                  {{ currentTask.batches.length }} Batches Recorded
                </span>
              </div>
              <p class="text-xs text-neutral-500 mt-1">
                Accumulated multi-batch questions categorized by source batch and applicable target jurisdictions.
              </p>
            </div>

            <!-- View Layout & Actions Bar -->
            <div class="flex items-center gap-2 flex-wrap">
              <!-- Flat Table vs Collapsible Batch Grouping Switch -->
              <div class="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
                <button
                  type="button"
                  @click="isBatchGroupedView = false"
                  :class="`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    !isBatchGroupedView
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`"
                >
                  Flat Table
                </button>
                <button
                  type="button"
                  @click="isBatchGroupedView = true"
                  :class="`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    isBatchGroupedView
                      ? 'bg-white text-neutral-900 shadow-2xs'
                      : 'text-neutral-500 hover:text-neutral-900'
                  }`"
                >
                  Grouped by Batch
                </button>
              </div>

              <!-- Create Question (In-Place Batch Add) -->
              <button
                type="button"
                @click="isBatchModalOpen = true"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>Create Question</span>
              </button>

              <!-- Export CSV -->
              <button
                type="button"
                @click="handleExportTaskQuestionsCsv(currentTask)"
                class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold transition-all shadow-2xs cursor-pointer"
                title="Export Questions to CSV"
              >
                <Download class="w-3.5 h-3.5" />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          <!-- TABLE: Flat Table View -->
          <div v-if="!isBatchGroupedView" class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-700">
                <tr>
                  <th class="p-3 w-16 text-center font-mono">全局序號 (#)</th>
                  <th class="p-3">問題標題 / 內容 (Question)</th>
                  <th class="p-3 w-28 text-center">批次內序號 (Batch Q#)</th>
                  <th class="p-3 w-32">所屬批次 (Batch)</th>
                  <th class="p-3 w-44">目標法域 (Target Jurisdiction)</th>
                  <th class="p-3 w-28 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-neutral-100">
                <tr
                  v-for="(q, idx) in currentTask.questions"
                  :key="q.id"
                  class="hover:bg-neutral-50/80 transition-colors group cursor-pointer"
                  @click="openMatrixForQuestions(currentTask, currentTask.questions.map((qu) => qu.questionText), undefined, idx)"
                >
                  <!-- 全局序號 (#): 01, 02, 03... -->
                  <td class="p-3 text-center font-mono text-neutral-500 font-bold">
                    {{ (idx + 1).toString().padStart(2, '0') }}
                  </td>

                  <!-- 問題標題 / 內容 (Question) -->
                  <td class="p-3">
                    <div class="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                      {{ q.questionText }}
                    </div>
                    <div v-if="q.summary" class="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">
                      {{ q.summary }}
                    </div>
                  </td>

                  <!-- 批次內序號 (Batch Q#): 1Q, 2Q, 3Q... -->
                  <td class="p-3 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded-md font-mono font-bold text-[11px] bg-blue-50 text-blue-700 border border-blue-200">
                      {{ q.batchIndex || idx + 1 }}Q
                    </span>
                  </td>

                  <!-- 所屬批次 (Batch): Batch 1, Batch 2... -->
                  <td class="p-3">
                    <span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-neutral-100 text-neutral-800 border border-neutral-200">
                      <Layers class="w-3 h-3 text-neutral-500" />
                      <span>{{ q.batchLabel || (q.batchNumber ? `Batch ${q.batchNumber}` : 'Batch 1') }}</span>
                    </span>
                  </td>

                  <!-- 目標法域 (Target Jurisdiction): HK, SG, UK, US... -->
                  <td class="p-3">
                    <div class="flex items-center gap-1 flex-wrap">
                      <template v-if="q.targetJurisdictions && q.targetJurisdictions.length > 0">
                        <span
                          v-for="jur in q.targetJurisdictions"
                          :key="jur"
                          class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/80"
                        >
                          {{ jur === 'Hong Kong' ? 'HK' : jur === 'Singapore' ? 'SG' : jur === 'United Kingdom' ? 'UK' : jur === 'United States' ? 'US' : jur === 'European Union' ? 'EU' : jur }}
                        </span>
                      </template>
                      <template v-else-if="currentTask.targetJurisdictions && currentTask.targetJurisdictions.length > 0">
                        <span
                          v-for="jur in currentTask.targetJurisdictions"
                          :key="jur"
                          class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/80"
                        >
                          {{ jur === 'Hong Kong' ? 'HK' : jur === 'Singapore' ? 'SG' : jur === 'United Kingdom' ? 'UK' : jur === 'United States' ? 'US' : jur }}
                        </span>
                      </template>
                      <span v-else class="text-[11px] text-neutral-500">{{ currentTask.jurisdiction }}</span>
                    </div>
                  </td>

                  <!-- Actions: View in Matrix -->
                  <td class="p-3 text-right" @click.stop>
                    <button
                      type="button"
                      @click="openMatrixForQuestions(currentTask, currentTask.questions.map((qu) => qu.questionText), undefined, idx)"
                      class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 transition-colors cursor-pointer"
                    >
                      <span>View Matrix</span>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- TABLE: Grouped by Batch View (Collapsible Grouping) -->
          <div v-else class="divide-y divide-neutral-200">
            <div
              v-for="batch in (currentTask.batches && currentTask.batches.length > 0 ? currentTask.batches : [{ batchNumber: 1, batchLabel: 'Batch 1', createdAt: currentTask.createdAt, targetJurisdictions: currentTask.targetJurisdictions || ['Hong Kong', 'Singapore'], questionCount: currentTask.questions.length }])"
              :key="batch.batchLabel"
              class="space-y-0"
            >
              <!-- Batch Collapsible Accordion Header -->
              <div
                @click="toggleBatchCollapse(batch.batchLabel)"
                class="p-3.5 bg-neutral-50/90 hover:bg-neutral-100/90 transition-colors flex items-center justify-between cursor-pointer border-b border-neutral-200"
              >
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span class="font-bold text-xs bg-neutral-900 text-white px-2 py-0.5 rounded-md">
                    {{ batch.batchLabel }}
                  </span>
                  <span class="text-xs font-bold text-neutral-800">
                    {{ currentTask.questions.filter((q) => (q.batchLabel === batch.batchLabel) || (!q.batchLabel && batch.batchNumber === 1)).length }} Questions
                  </span>
                  <span class="text-[11px] text-neutral-500">
                    &bull; Target: {{ batch.targetJurisdictions.join(', ') }}
                  </span>
                  <span v-if="batch.createdAt" class="text-[11px] font-mono text-neutral-400">
                    &bull; Added: {{ batch.createdAt }}
                  </span>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click.stop="openMatrixForQuestions(currentTask, currentTask.questions.map((qu) => qu.questionText), undefined, 0)"
                    class="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-neutral-700 bg-white hover:bg-neutral-100 border border-neutral-200 cursor-pointer transition-colors"
                  >
                    <span>Open Batch Matrix</span>
                  </button>
                  <ChevronUp v-if="!expandedBatches[batch.batchLabel]" class="w-4 h-4 text-neutral-500" />
                  <ChevronDown v-else class="w-4 h-4 text-neutral-500" />
                </div>
              </div>

              <!-- Batch Questions Sub-table -->
              <div v-show="!expandedBatches[batch.batchLabel]" class="overflow-x-auto">
                <table class="w-full text-left text-xs">
                  <thead class="bg-neutral-50/40 border-b border-neutral-100 text-[11px] font-semibold text-neutral-500">
                    <tr>
                      <th class="p-2.5 w-16 text-center font-mono">全局序號 (#)</th>
                      <th class="p-2.5">問題標題 / 內容 (Question)</th>
                      <th class="p-2.5 w-28 text-center">批次內序號 (Batch Q#)</th>
                      <th class="p-2.5 w-44">目標法域 (Target Jurisdiction)</th>
                      <th class="p-2.5 w-28 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-neutral-100">
                    <tr
                      v-for="(q, qIdx) in currentTask.questions.filter((q) => (q.batchLabel === batch.batchLabel) || (!q.batchLabel && batch.batchNumber === 1))"
                      :key="q.id"
                      class="hover:bg-neutral-50/60 transition-colors cursor-pointer"
                      @click="openMatrixForQuestions(currentTask, currentTask.questions.map((qu) => qu.questionText), undefined, (q.globalIndex ? q.globalIndex - 1 : qIdx))"
                    >
                      <td class="p-2.5 text-center font-mono text-neutral-500 font-bold">
                        {{ (q.globalIndex || qIdx + 1).toString().padStart(2, '0') }}
                      </td>
                      <td class="p-2.5 font-medium text-neutral-900">
                        {{ q.questionText }}
                      </td>
                      <td class="p-2.5 text-center">
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-blue-50 text-blue-700 border border-blue-200">
                          {{ q.batchIndex || qIdx + 1 }}Q
                        </span>
                      </td>
                      <td class="p-2.5">
                        <div class="flex items-center gap-1 flex-wrap">
                          <span
                            v-for="jur in (q.targetJurisdictions || batch.targetJurisdictions)"
                            :key="jur"
                            class="px-1.5 py-0.2 rounded text-[10px] font-bold bg-neutral-100 text-neutral-700 border border-neutral-200/80"
                          >
                            {{ jur === 'Hong Kong' ? 'HK' : jur === 'Singapore' ? 'SG' : jur === 'United Kingdom' ? 'UK' : jur === 'United States' ? 'US' : jur }}
                          </span>
                        </div>
                      </td>
                      <td class="p-2.5 text-right" @click.stop>
                        <button
                          type="button"
                          @click="openMatrixForQuestions(currentTask, currentTask.questions.map((qu) => qu.questionText), undefined, (q.globalIndex ? q.globalIndex - 1 : qIdx))"
                          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 cursor-pointer transition-colors"
                        >
                          <span>View Matrix</span>
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- VIEW B: TASK LIST VIEW (When no specific task is selected)   -->
    <!-- ============================================================= -->
    <div v-else class="space-y-5">
      <!-- Top Bar: Title & Create Task Button -->
      <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-b border-neutral-200 pb-4">
        <div>
          <h2 class="text-base sm:text-lg font-bold text-neutral-900 tracking-tight flex items-center gap-2">
            <ClipboardList class="w-5 h-5 text-blue-600" />
            <span>Task Management</span>
          </h2>
        </div>

        <button
          @click="emit('openCreateTaskModal')"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer self-start sm:self-auto"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Create Task</span>
        </button>
      </div>

      <!-- Filter Bar (All Multi-Select) -->
      <div class="bg-white p-3 rounded-xl border border-neutral-200 shadow-2xs space-y-2.5">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-2 items-center">
          <!-- Search -->
          <div class="relative md:col-span-4">
            <Search class="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              v-model="searchQuery"
              placeholder="Search historical tasks by title, jurisdiction, or inquiry..."
              class="w-full pl-9 pr-3 h-8 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors"
            />
          </div>

          <!-- Status Multi-Select -->
          <div class="md:col-span-3">
            <ComboboxFilter
              label="Status"
              placeholder="All Statuses"
              :options="['Completed', 'Action Required', 'Running']"
              v-model:selectedValues="selectedStatuses"
            />
          </div>

          <!-- Jurisdiction Multi-Select -->
          <div class="md:col-span-3">
            <ComboboxFilter
              label="Jurisdiction"
              placeholder="All Jurisdictions"
              :options="ALL_JURISDICTIONS"
              v-model:selectedValues="selectedJurisdictions"
            />
          </div>

          <!-- Linkage Multi-Select -->
          <div class="md:col-span-2">
            <ComboboxFilter
              label="Linkage"
              placeholder="All Linkage"
              :options="['Has Linked News', 'Has Linked Regulators', 'No Links']"
              v-model:selectedValues="selectedLinkages"
            />
          </div>
        </div>

        <!-- Active Filters Tag Bar with Clear All -->
        <div v-if="hasActiveFilters" class="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs flex-wrap">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-neutral-500 text-[11px] font-normal">Active filters:</span>

            <span
              v-for="st in selectedStatuses"
              :key="st"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ st }}</span>
              <button @click="selectedStatuses = selectedStatuses.filter(s => s !== st)" class="hover:text-neutral-900 cursor-pointer">
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>

            <span
              v-for="jur in selectedJurisdictions"
              :key="jur"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ jur }}</span>
              <button @click="selectedJurisdictions = selectedJurisdictions.filter(j => j !== jur)" class="hover:text-neutral-900 cursor-pointer">
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>

            <span
              v-for="lnk in selectedLinkages"
              :key="lnk"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ lnk }}</span>
              <button @click="selectedLinkages = selectedLinkages.filter(l => l !== lnk)" class="hover:text-neutral-900 cursor-pointer">
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>
          </div>

          <button
            @click="handleClearAllFilters"
            class="text-neutral-500 hover:text-rose-600 font-normal text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
          >
            <X class="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div
        v-if="taskStore.tasks.length === 0"
        class="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center space-y-6"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600 shadow-2xs">
          <ClipboardList class="w-8 h-8" />
        </div>
        <div class="space-y-1 max-w-md mx-auto">
          <h3 class="text-base font-bold text-neutral-900">No Regulatory Tasks Yet</h3>
          <p class="text-xs text-neutral-500 leading-relaxed">
            Create an analysis task to batch-query compliance questions across official sources. You can also select news or authorities from other tabs to link them directly.
          </p>
        </div>

        <button
          @click="emit('openCreateTaskModal')"
          class="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs cursor-pointer transition-all"
        >
          <Plus class="w-4 h-4" />
          <span>Create Your First Task</span>
        </button>

        <!-- Quick Starter Templates -->
        <div class="pt-6 border-t border-neutral-100 max-w-3xl mx-auto">
          <div class="text-xs font-bold text-neutral-500 uppercase tracking-wider mb-3">
            Or Start With a Pre-Configured Dossier Template
          </div>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3 text-left">
            <div
              v-for="tpl in starterTemplates"
              :key="tpl.title"
              @click="handleCreateFromTemplate(tpl)"
              class="p-4 rounded-xl border border-neutral-200 hover:border-blue-400 bg-neutral-50/50 hover:bg-white transition-all cursor-pointer group"
            >
              <div class="text-[10px] font-bold text-blue-600 uppercase tracking-wide">
                {{ tpl.jurisdiction }}
              </div>
              <h4 class="text-xs font-bold text-neutral-900 group-hover:text-blue-600 transition-colors mt-1">
                {{ tpl.title }}
              </h4>
              <p class="text-[11px] text-neutral-500 mt-1 line-clamp-2">
                {{ tpl.questions[0] }}
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- TASK LIST TABLE -->
      <div v-else class="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-700">
            <tr>
              <th class="p-3">Task Title & Scope</th>
              <th class="p-3 w-40">Jurisdiction</th>
              <th class="p-3 w-28">Status</th>
              <th class="p-3 w-24">Inquiries</th>
              <th class="p-3 w-28">Linked Context</th>
              <th class="p-3 w-32">Last Updated</th>
              <th class="p-3 w-28 text-right"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="task in paginatedTasks"
              :key="task.id"
              class="hover:bg-neutral-50/70 transition-colors group cursor-pointer"
              @click="selectTask(task)"
            >
              <td class="p-3">
                <div class="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                  {{ task.title }}
                </div>
                <div class="text-[11px] text-neutral-500 mt-0.5">
                  {{ task.topic || 'General Compliance' }}
                </div>
              </td>
              <td class="p-3">
                <template v-if="task.targetJurisdictions && task.targetJurisdictions.length > 1">
                  <div class="flex items-center gap-1 flex-wrap">
                    <span class="font-semibold text-neutral-700 bg-neutral-100 px-1.5 py-0.5 rounded text-[10px]">
                      {{ task.homeJurisdiction || 'HK' }} ➔
                    </span>
                    <span
                      v-for="tj in task.targetJurisdictions"
                      :key="tj"
                      class="font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[10px]"
                    >
                      {{ tj }}
                    </span>
                  </div>
                </template>
                <span v-else class="font-semibold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                  {{ task.jurisdiction }}
                </span>
              </td>
              <td class="p-3">
                <span
                  class="inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-neutral-100 text-neutral-800 border border-neutral-200"
                >
                  <span
                    :class="`w-1.5 h-1.5 rounded-full ${
                      task.status === 'Completed'
                        ? 'bg-emerald-500'
                        : task.status === 'Running'
                        ? 'bg-blue-600 animate-pulse'
                        : 'bg-amber-500'
                    }`"
                  />
                  <span>{{ task.status }}</span>
                </span>
              </td>
              <td class="p-3 text-neutral-600 font-semibold">
                {{ task.questions.length }} Question{{ task.questions.length > 1 ? 's' : '' }}
              </td>
              <td class="p-3">
                <span
                  :class="`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    task.linkedNewsIds.length + task.linkedRegulatorIds.length > 0
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-neutral-400'
                  }`"
                >
                  <Layers class="w-3 h-3" />
                  <span>{{ task.linkedNewsIds.length + task.linkedRegulatorIds.length }} items</span>
                </span>
              </td>
              <td class="p-3 text-neutral-500 font-mono text-[11px]">{{ task.updatedAt }}</td>
              <td class="p-3 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    @click.stop="selectTask(task)"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 cursor-pointer"
                  >
                    View
                  </button>
                  <button
                    @click.stop="handleDeleteTask(task.id)"
                    class="p-1 rounded text-neutral-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Delete"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination for Tasks View -->
        <PaginationController
          v-if="filteredTasks.length > 0"
          :totalItems="filteredTasks.length"
          v-model:currentPage="currentPage"
          v-model:pageSize="pageSize"
        />
      </div>
    </div>

    <!-- Phase 2 Report Export Modal -->
    <TaskReportModal
      v-if="isReportModalOpen"
      :isOpen="isReportModalOpen"
      :task="currentTask"
      @close="isReportModalOpen = false"
    />

    <!-- Interactive Citation Excerpt Modal -->
    <Teleport to="body">
      <div
        v-if="activeCitation"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/40 backdrop-blur-xs select-text animate-in fade-in duration-150"
      >
        <div class="bg-white rounded-2xl shadow-2xl border border-neutral-200 max-w-lg w-full p-6 space-y-4">
          <div class="flex items-center justify-between border-b border-neutral-100 pb-3">
            <div class="flex items-center gap-2">
              <span class="font-bold text-xs bg-blue-600 text-white px-2 py-0.5 rounded-md">
                {{ activeCitation.pin }}
              </span>
              <span class="text-xs font-semibold text-neutral-700 truncate">
                {{ activeCitation.sourceTitle }}
              </span>
            </div>
            <button
              @click="activeCitation = null"
              class="text-neutral-400 hover:text-neutral-700 p-1 rounded-lg hover:bg-neutral-100"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <div class="space-y-2 text-xs sm:text-sm">
            <div v-if="activeCitation.clause" class="font-bold text-neutral-900">
              {{ activeCitation.clause }}
            </div>
            <p class="text-neutral-700 leading-relaxed italic bg-neutral-50 p-4 rounded-xl border border-neutral-200">
              "{{ activeCitation.excerpt }}"
            </p>
          </div>

          <div class="flex items-center justify-between pt-2">
            <a
              :href="activeCitation.url"
              target="_blank"
              rel="noopener noreferrer"
              class="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
            >
              <span>View Official Source</span>
              <ExternalLink class="w-3 h-3" />
            </a>
            <button
              @click="activeCitation = null"
              class="px-3.5 py-1.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-semibold rounded-xl"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </Teleport>

    <!-- In-Place Batch Question Input Modal -->
    <BatchQuestionModal
      v-if="isBatchModalOpen && currentTask"
      :isOpen="isBatchModalOpen"
      :taskId="currentTask.id"
      :taskTitle="currentTask.title"
      :existingBatchCount="currentTask.batches?.length || 1"
      :initialJurisdictions="currentTask.targetJurisdictions"
      @close="isBatchModalOpen = false"
      @submit="handleBatchQuestionsSubmit"
    />
  </div>
</template>
