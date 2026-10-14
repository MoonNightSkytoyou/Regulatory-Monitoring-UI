<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import {
  Radio,
  Search,
  Bookmark,
  CheckCircle2,
  BookmarkCheck,
  Plus,
  ExternalLink,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Filter,
  ArrowUpDown,
  FileText,
  Clock,
  Check,
  Layers,
  Sparkles,
  Share2,
  Trash2,
  RotateCcw,
  X,
  Compass,
  ArrowRight,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Folder,
  Tag,
  RefreshCw,
  History,
} from 'lucide-vue-next';
import type {
  PriorityAlert,
  RegulationItem,
  RegulatoryDirectoryItem,
  DirectoryFilterState,
  RegulatorInScope,
} from '@/types';
import { normalizeRelevance, ALL_JURISDICTIONS, SECTOR_GROUPS } from '@/types';
import { useDirectoryStore } from '@/stores/directoryStore';
import { useTaskStore } from '@/stores/taskStore';
import ComboboxFilter from '@/components/common/ComboboxFilter.vue';
import DirectoryFilterPanel from '@/components/directory/DirectoryFilterPanel.vue';
import PaginationController from '@/components/common/PaginationController.vue';

const props = defineProps<{
  alerts: PriorityAlert[];
  directoryItems: RegulatoryDirectoryItem[];
  regulators?: RegulatorInScope[];
  isSyncing?: boolean;
  lastSyncTime?: Date | string | null;
}>();

const emit = defineEmits<{
  (e: 'selectItem', item: PriorityAlert | RegulatoryDirectoryItem | RegulationItem): void;
  (e: 'createTaskForItems', items: Array<{ id: string; title: string; regulator?: string; regulatorAcronym?: string }>): void;
  (e: 'readAlert', alertId: string): void;
  (e: 'bookmarkAlert', alert: PriorityAlert): void;
  (e: 'toggleBookmarkDirectory', item: RegulatoryDirectoryItem): void;
  (e: 'restoreReadAlert', alertId: string): void;
  (e: 'openDetail', item: any): void;
  (e: 'toggleSubScopeFollow', regulatorId: string, subScopeId: string): void;
  (e: 'onlyFollowSubScope', regulatorId: string, subScopeId: string): void;
  (e: 'followAllSubScopes', regulatorId: string, targetFollow: boolean): void;
  (e: 'syncFeed'): void;
  (e: 'showToast', title: string, message?: string, type?: 'success' | 'info' | 'warning' | 'error'): void;
}>();

const directoryStore = useDirectoryStore();
const taskStore = useTaskStore();

// Track regulators with isolated child sub-scopes for helpful UI feedback
const isolatedSubScopeRegulators = computed(() => {
  if (!props.regulators) return [];
  return props.regulators.filter((r) => {
    if (!r.subScopes || r.subScopes.length <= 1) return false;
    const followedCount = r.subScopes.filter((s) => s.isFollowed).length;
    return followedCount > 0 && followedCount < r.subScopes.length;
  });
});

const handleOnlyFollowThisSubScope = (alert: PriorityAlert) => {
  if (!props.regulators) return;
  const alertAcronym = (alert.regulatorAcronym || '').toUpperCase().trim();
  const alertRegName = (alert.regulator || '').toLowerCase().trim();

  const targetReg = props.regulators.find(
    (r) => (r.acronym && r.acronym.toUpperCase().trim() === alertAcronym) ||
           (r.name && r.name.toLowerCase().trim() === alertRegName)
  );

  if (!targetReg || !targetReg.subScopes || targetReg.subScopes.length === 0) return;

  const targetSub = targetReg.subScopes.find((sub) => {
    if (alert.subScopeId && alert.subScopeId === sub.id) return true;
    if (alert.sourceCategory && sub.sourceCategory && alert.sourceCategory.toLowerCase() === sub.sourceCategory.toLowerCase()) return true;
    if (alert.sourceCategory && sub.name && alert.sourceCategory.toLowerCase() === sub.name.toLowerCase()) return true;
    if (alert.sourceUrl && (sub.url || sub.sourceUrl)) {
      const cleanAlertUrl = alert.sourceUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
      const cleanSubUrl = (sub.url || sub.sourceUrl || '').replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (cleanAlertUrl === cleanSubUrl || cleanAlertUrl.includes(cleanSubUrl) || cleanSubUrl.includes(cleanAlertUrl)) return true;
    }
    return false;
  });

  if (targetSub) {
    emit('onlyFollowSubScope', targetReg.id, targetSub.id);
  }
};

// Top Sub-segment: 'latest' vs 'directory'
const subView = ref<'latest' | 'directory'>('latest');

// Visual Layout mode for Latest view: defaults to 'card', persists user choice
const latestLayoutMode = ref<'card' | 'list'>('card');

// Active layoutMode: in Directory it is always 'list', in Latest it reflects latestLayoutMode
const layoutMode = computed<'card' | 'list'>({
  get: () => (subView.value === 'directory' ? 'list' : latestLayoutMode.value),
  set: (val: 'card' | 'list') => {
    if (subView.value === 'latest') {
      latestLayoutMode.value = val;
    }
  },
});

// Selection for batch Task Creation
const selectedItemIds = ref<string[]>([]);

const toggleSelectAll = (items: Array<{ id: string }>) => {
  if (selectedItemIds.value.length === items.length) {
    selectedItemIds.value = [];
  } else {
    selectedItemIds.value = items.map((i) => i.id);
  }
};

const toggleSelectItem = (id: string) => {
  if (selectedItemIds.value.includes(id)) {
    selectedItemIds.value = selectedItemIds.value.filter((i) => i !== id);
  } else {
    selectedItemIds.value.push(id);
  }
};

// -------------------------------------------------------------
// TAB 1 - SEGMENT A: LATEST NEWS FEED
// -------------------------------------------------------------
const searchQuery = ref('');
const selectedJurisdictions = ref<string[]>([]);
const selectedCategories = ref<string[]>([]);
const selectedRelevances = ref<string[]>([]);
const selectedLinkages = ref<string[]>([]);
const sortBy = ref<'date' | 'relevance' | 'linkage'>('date');

const hasActiveLatestFilters = computed(() => {
  return (
    searchQuery.value.trim() !== '' ||
    selectedJurisdictions.value.length > 0 ||
    selectedCategories.value.length > 0 ||
    selectedRelevances.value.length > 0 ||
    selectedLinkages.value.length > 0
  );
});

const handleClearAllLatestFilters = () => {
  searchQuery.value = '';
  selectedJurisdictions.value = [];
  selectedCategories.value = [];
  selectedRelevances.value = [];
  selectedLinkages.value = [];
};

const activeAlerts = computed(() => {
  return props.alerts.filter((a) => a.status === 'pending');
});

const dismissedAlerts = computed(() => {
  return props.alerts.filter((a) => a.status === 'dismissed');
});

const filteredLatestAlerts = computed(() => {
  return activeAlerts.value
    .filter((alert) => {
      // Search
      if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase().trim();
        const match =
          alert.title.toLowerCase().includes(q) ||
          (alert.regulator && alert.regulator.toLowerCase().includes(q)) ||
          (alert.regulatorAcronym && alert.regulatorAcronym.toLowerCase().includes(q)) ||
          (alert.aiRelevanceSummary && alert.aiRelevanceSummary.toLowerCase().includes(q));
        if (!match) return false;
      }

      // Jurisdiction multi-select
      if (
        selectedJurisdictions.value.length > 0 &&
        !selectedJurisdictions.value.includes(alert.jurisdiction)
      ) {
        return false;
      }

      // Category multi-select
      if (
        selectedCategories.value.length > 0 &&
        (!alert.category || !selectedCategories.value.includes(alert.category))
      ) {
        return false;
      }

      // Relevance multi-select
      if (selectedRelevances.value.length > 0) {
        const norm = normalizeRelevance(alert.materiality);
        if (!selectedRelevances.value.includes(norm)) {
          return false;
        }
      }

      // Linkage multi-select
      if (selectedLinkages.value.length > 0) {
        const count = taskStore.getNewsLinkageCount(alert.regulationId || alert.id, alert.title);
        const isLinked = count > 0;
        const matchLinked = selectedLinkages.value.includes('Linked to Tasks') && isLinked;
        const matchUnlinked = selectedLinkages.value.includes('Unlinked') && !isLinked;
        if (!matchLinked && !matchUnlinked) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (sortBy.value === 'linkage') {
        const countA = taskStore.getNewsLinkageCount(a.regulationId || a.id, a.title);
        const countB = taskStore.getNewsLinkageCount(b.regulationId || b.id, b.title);
        return countB - countA;
      }
      if (sortBy.value === 'relevance') {
        const rank = (lvl: string) => {
          if (lvl.includes('Direct') || lvl.includes('Critical')) return 3;
          if (lvl.includes('Relevant')) return 2;
          return 1;
        };
        return rank(b.materiality) - rank(a.materiality);
      }
      // Default: date
      return (b.publishDate || '').localeCompare(a.publishDate || '');
    });
});

// Live Feed Global Crawler Synchronization State & Relative Time Tracking
const internalIsSyncing = ref(false);
const isSyncingActive = computed(() => props.isSyncing ?? internalIsSyncing.value);
const internalLastSyncTime = ref<Date>(new Date());

const effectiveLastSyncTime = computed(() => {
  if (props.lastSyncTime) {
    return typeof props.lastSyncTime === 'string' ? new Date(props.lastSyncTime) : props.lastSyncTime;
  }
  return internalLastSyncTime.value;
});

const currentTimeTick = ref(Date.now());
let syncTimer: any = null;

onMounted(() => {
  syncTimer = setInterval(() => {
    currentTimeTick.value = Date.now();
  }, 30000);
});

onUnmounted(() => {
  if (syncTimer) clearInterval(syncTimer);
});

const lastUpdatedText = computed(() => {
  if (!effectiveLastSyncTime.value) return 'Just now';
  const diffSec = Math.max(0, Math.floor((currentTimeTick.value - effectiveLastSyncTime.value.getTime()) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin === 1) return '1 min ago';
  if (diffMin < 60) return `${diffMin} mins ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours === 1) return '1 hour ago';
  return `${diffHours} hours ago`;
});

const lastUpdatedFormatted = computed(() => {
  if (!effectiveLastSyncTime.value) return '';
  return effectiveLastSyncTime.value.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
});

let lastSyncClickTs = 0;
const handleSyncClick = () => {
  const now = Date.now();
  if (now - lastSyncClickTs < 1000 || isSyncingActive.value) {
    return;
  }
  lastSyncClickTs = now;
  emit('syncFeed');
};

// History (Dismissed/Archived) View State
const showHistoryView = ref(false);

const displayedAlerts = computed(() => {
  if (showHistoryView.value) {
    return dismissedAlerts.value;
  }
  return filteredLatestAlerts.value;
});

// Pagination for Latest News Feed (Default 20, options 40, 60, 100)
const latestPageSize = ref<number>(20);
const latestCurrentPage = ref<number>(1);

const paginatedLatestAlerts = computed(() => {
  const start = (latestCurrentPage.value - 1) * latestPageSize.value;
  return displayedAlerts.value.slice(start, start + latestPageSize.value);
});

watch(
  [searchQuery, selectedJurisdictions, selectedCategories, selectedRelevances, selectedLinkages, sortBy, showHistoryView],
  () => {
    latestCurrentPage.value = 1;
  }
);

// When switching to Directory, enforce List View only
watch(subView, (newVal) => {
  if (newVal === 'directory') {
    layoutMode.value = 'list';
  }
  selectedItemIds.value = [];
});

// -------------------------------------------------------------
// TAB 1 - SEGMENT B: DIRECTORY 4-LAYER PIPELINE
// -------------------------------------------------------------
// Conditional trigger: When Bookmarks is toggled off and global search is accessed, shows "Ready to Search Directory" prompt before Apply is clicked
const hasAppliedDirectoryFilters = ref(false);

const activeDirectoryFilters = ref<DirectoryFilterState | null>({
  datePreset: 'All',
  startDate: '01/01/2020',
  endDate: '28/09/2026',
  dateType: 'publishDate',
  jurisdiction: 'All',
  theme: 'All',
  category: 'All',
  selectedJurisdictions: [],
  selectedThemes: [],
  selectedCategories: [],
  selectedLinkages: [],
  regulatorCandidates: [],
  keywordCandidates: [],
  keywordMode: 'OR',
});

// Date Helpers
const parseDDMMYYYY = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const parts = dateStr.trim().split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return null;
};

const parseISODate = (isoStr: string): Date | null => {
  if (!isoStr) return null;
  const parts = isoStr.trim().split('-');
  if (parts.length === 3) {
    const year = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    return new Date(year, month, day);
  }
  return new Date(isoStr);
};

// Common multi-layer filter function for Directory supporting both AND and OR logical combinations
const applyDirectoryPipeline = (
  items: RegulatoryDirectoryItem[],
  filters: DirectoryFilterState | null
): RegulatoryDirectoryItem[] => {
  if (!filters) return items;
  let list = items;

  // Layer 1: Date Range Filter (temporal boundary strictly using Publish Date)
  if (filters.datePreset !== 'All') {
    const start = parseDDMMYYYY(filters.startDate);
    const end = parseDDMMYYYY(filters.endDate);
    if (start && end) {
      end.setHours(23, 59, 59, 999);
      list = list.filter((r) => {
        const pDate = parseISODate(r.publishDate);
        if (!pDate) return true;
        return pDate >= start && pDate <= end;
      });
    }
  }

  const isOrMode = filters.keywordMode === 'OR';

  // Check which content criteria are active
  const hasJurisdictions = Boolean(
    (filters.selectedJurisdictions && filters.selectedJurisdictions.length > 0) ||
    (filters.jurisdiction && filters.jurisdiction !== 'All' && filters.jurisdiction !== 'Multi')
  );
  const hasThemes = Boolean(
    (filters.selectedThemes && filters.selectedThemes.length > 0) ||
    (filters.theme && filters.theme !== 'All' && filters.theme !== 'Multi')
  );
  const hasCategories = Boolean(
    (filters.selectedCategories && filters.selectedCategories.length > 0) ||
    (filters.category && filters.category !== 'All' && filters.category !== 'Multi')
  );
  const hasLinkages = Boolean(filters.selectedLinkages && filters.selectedLinkages.length > 0);
  const hasRegulators = Boolean(filters.regulatorCandidates && filters.regulatorCandidates.length > 0);
  const hasKeywords = Boolean(filters.keywordCandidates && filters.keywordCandidates.length > 0);

  // If no content criteria specified, return all items within date range
  if (!hasJurisdictions && !hasThemes && !hasCategories && !hasLinkages && !hasRegulators && !hasKeywords) {
    return list;
  }

  const matchJurisdiction = (r: RegulatoryDirectoryItem): boolean => {
    if (!hasJurisdictions) return false;
    if (filters.selectedJurisdictions && filters.selectedJurisdictions.length > 0) {
      return filters.selectedJurisdictions.includes(r.jurisdiction);
    }
    return r.jurisdiction === filters.jurisdiction;
  };

  const matchTheme = (r: RegulatoryDirectoryItem): boolean => {
    if (!hasThemes) return false;
    if (filters.selectedThemes && filters.selectedThemes.length > 0) {
      return (r.themes || []).some((t) =>
        filters.selectedThemes!.some(
          (sel) => t.toLowerCase().includes(sel.toLowerCase()) || sel.toLowerCase().includes(t.toLowerCase())
        )
      );
    }
    const tLower = (filters.theme || '').toLowerCase();
    return (r.themes || []).some((t) => t.toLowerCase().includes(tLower) || tLower.includes(t.toLowerCase()));
  };

  const matchCategory = (r: RegulatoryDirectoryItem): boolean => {
    if (!hasCategories) return false;
    if (filters.selectedCategories && filters.selectedCategories.length > 0) {
      return filters.selectedCategories.some(
        (cat) =>
          r.category === cat ||
          (r.docType && r.docType.toLowerCase().includes(cat.toLowerCase())) ||
          (cat && cat.toLowerCase().includes(r.docType?.toLowerCase() || ''))
      );
    }
    const cLower = (filters.category || '').toLowerCase();
    return (
      (r.category || '').toLowerCase() === cLower ||
      (r.docType || '').toLowerCase().includes(cLower)
    );
  };

  const matchLinkage = (r: RegulatoryDirectoryItem): boolean => {
    if (!hasLinkages) return false;
    const count = taskStore.getNewsLinkageCount(r.id, r.title, r.referenceNumber);
    const isLinked = count > 0;
    const matchLinked = filters.selectedLinkages!.includes('Linked to Tasks') && isLinked;
    const matchUnlinked = filters.selectedLinkages!.includes('Unlinked') && !isLinked;
    return matchLinked || matchUnlinked;
  };

  const matchRegulator = (r: RegulatoryDirectoryItem): boolean => {
    if (!hasRegulators) return false;
    const allowed = new Set(filters.regulatorCandidates.map((ac) => ac.toUpperCase()));
    return allowed.has((r.regulatorAcronym || '').toUpperCase());
  };

  const matchKeywords = (r: RegulatoryDirectoryItem): boolean => {
    if (!hasKeywords) return false;
    const kws = filters.keywordCandidates.map((k) => k.toLowerCase().trim()).filter(Boolean);
    if (kws.length === 0) return true;
    const fullCorpus = [
      r.title,
      r.referenceNumber,
      r.executiveSummary,
      r.operationalImpact,
      r.authenticExcerpt,
      ...(r.themes || []),
    ]
      .join(' ')
      .toLowerCase();

    if (filters.keywordMode === 'AND') {
      return kws.every((kw) => fullCorpus.includes(kw));
    } else {
      return kws.some((kw) => fullCorpus.includes(kw));
    }
  };

  if (isOrMode) {
    // In OR mode: Any active criterion matched includes the regulation
    return list.filter((r) => {
      if (hasJurisdictions && matchJurisdiction(r)) return true;
      if (hasThemes && matchTheme(r)) return true;
      if (hasCategories && matchCategory(r)) return true;
      if (hasLinkages && matchLinkage(r)) return true;
      if (hasRegulators && matchRegulator(r)) return true;
      if (hasKeywords && matchKeywords(r)) return true;
      return false;
    });
  } else {
    // In AND mode: All active criteria must be satisfied
    return list.filter((r) => {
      if (hasJurisdictions && !matchJurisdiction(r)) return false;
      if (hasThemes && !matchTheme(r)) return false;
      if (hasCategories && !matchCategory(r)) return false;
      if (hasLinkages && !matchLinkage(r)) return false;
      if (hasRegulators && !matchRegulator(r)) return false;
      if (hasKeywords && !matchKeywords(r)) return false;
      return true;
    });
  }
};

// Synchronized Directory Source
const synchedDirectory = computed<RegulatoryDirectoryItem[]>(() => {
  return props.directoryItems.map((item) => {
    const isBookmarked = directoryStore.isBookmarked(item.id, item.referenceNumber, item.title);
    return {
      ...item,
      status: isBookmarked ? ('Following' as const) : ('None' as const),
    };
  });
});

// Computed Display Items for Directory Sub-view
const displayedDirectoryItems = computed<RegulatoryDirectoryItem[]>(() => {
  // Mode 1: Bookmarks is active (Default)
  if (directoryStore.isBookmarksActive) {
    return applyDirectoryPipeline(directoryStore.bookmarkedItems, activeDirectoryFilters.value);
  }

  // Mode 2: Bookmarks disabled -> requires user to click Apply first
  if (!hasAppliedDirectoryFilters.value) {
    return [];
  }

  let list = synchedDirectory.value;
  if (!activeDirectoryFilters.value) return list;

  return applyDirectoryPipeline(list, activeDirectoryFilters.value);
});

// Pagination for Directory view
const directoryPageSize = ref<number>(20);
const directoryCurrentPage = ref<number>(1);

const totalDirectoryItems = computed(() => displayedDirectoryItems.value.length);
const totalDirectoryPages = computed(() =>
  Math.max(1, Math.ceil(totalDirectoryItems.value / directoryPageSize.value))
);

const directoryStartIndex = computed(
  () => (directoryCurrentPage.value - 1) * directoryPageSize.value
);
const directoryEndIndex = computed(() =>
  Math.min(directoryStartIndex.value + directoryPageSize.value, totalDirectoryItems.value)
);

const paginatedDirectoryItems = computed(() => {
  return displayedDirectoryItems.value.slice(
    directoryStartIndex.value,
    directoryEndIndex.value
  );
});

// Filter Panel Handlers
const handleApplyDirectoryFilters = (filters: DirectoryFilterState) => {
  activeDirectoryFilters.value = { ...filters };
  hasAppliedDirectoryFilters.value = true;
  directoryCurrentPage.value = 1;
};

const handleResetDirectoryFilters = () => {
  activeDirectoryFilters.value = {
    datePreset: 'All',
    startDate: '01/01/2020',
    endDate: '28/09/2026',
    dateType: 'publishDate',
    jurisdiction: 'All',
    theme: 'All',
    category: 'All',
    selectedJurisdictions: [],
    selectedThemes: [],
    selectedCategories: [],
    selectedLinkages: [],
    regulatorCandidates: [],
    keywordCandidates: [],
    keywordMode: 'OR',
  };
  hasAppliedDirectoryFilters.value = false;
  directoryCurrentPage.value = 1;
};

const handleToggleDirectoryBookmarks = (active: boolean) => {
  if (active) {
    hasAppliedDirectoryFilters.value = false;
  }
  directoryCurrentPage.value = 1;
};

const handleDirectoryFilterChange = (partial: Partial<DirectoryFilterState>) => {
  if (activeDirectoryFilters.value) {
    activeDirectoryFilters.value = {
      ...activeDirectoryFilters.value,
      ...partial,
    };
  }
};

// Batch Create Task Trigger
const handleCreateTaskForSelection = () => {
  let targetItems: Array<{ id: string; title: string; regulator?: string; regulatorAcronym?: string }> = [];

  if (subView.value === 'latest') {
    targetItems = activeAlerts.value
      .filter((a) => selectedItemIds.value.includes(a.id))
      .map((a) => ({
        id: a.regulationId || a.id,
        title: a.title,
        regulator: a.regulator,
        regulatorAcronym: a.regulatorAcronym,
      }));
  } else {
    targetItems = displayedDirectoryItems.value
      .filter((d) => selectedItemIds.value.includes(d.id))
      .map((d) => ({
        id: d.id,
        title: d.title,
        regulator: d.regulator,
        regulatorAcronym: d.regulatorAcronym,
      }));
  }

  emit('createTaskForItems', targetItems);
};
</script>

<template>
  <div class="news-feed-view w-full p-4 sm:p-6 lg:p-8 space-y-5 animate-in fade-in">
    <!-- Top Action Bar -->
    <div
      class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-neutral-200 pb-4"
    >
      <!-- Left: Segmented Switch [ Latest | Directory ] -->
      <div class="flex items-center gap-3 flex-wrap">
        <div class="flex items-center bg-neutral-100 p-1 rounded-xl border border-neutral-200 shadow-2xs">
          <button
            id="tab-btn-feed-latest"
            @click="subView = 'latest'; selectedItemIds = []"
            :class="`flex items-center justify-center gap-2 min-w-[144px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subView === 'latest'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`"
          >
            <Radio class="w-4 h-4 text-blue-600" />
            <span>Latest</span>
            <span
              :class="`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                subView === 'latest' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-200 text-neutral-600'
              }`"
            >
              <span v-if="subView === 'latest' && activeAlerts.length > 0" class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>{{ activeAlerts.length }}</span>
            </span>
          </button>

          <button
            id="tab-btn-feed-directory"
            @click="subView = 'directory'; selectedItemIds = []"
            :class="`flex items-center justify-center gap-2 min-w-[144px] px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all cursor-pointer ${
              subView === 'directory'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-600 hover:text-neutral-900'
            }`"
          >
            <Bookmark class="w-4 h-4 text-blue-600" />
            <span>Directory</span>
            <span
              :class="`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full flex items-center gap-1.5 ${
                subView === 'directory' ? 'bg-neutral-100 text-neutral-900' : 'bg-neutral-200 text-neutral-600'
              }`"
            >
              <span v-if="subView === 'directory' && directoryStore.bookmarkedItems.length > 0" class="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse" />
              <span>{{ directoryStore.bookmarkedItems.length }}</span>
            </span>
          </button>
        </div>
      </div>

      <!-- Right: View Toggle & Create Task Button -->
      <div class="flex items-center gap-2 flex-wrap">
        <!-- Layout Switch (Card vs List: Card view is dimmed and disabled in Directory) -->
        <div class="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
          <button
            @click="subView !== 'directory' && (layoutMode = 'card')"
            :disabled="subView === 'directory'"
            :class="`p-1.5 rounded-md transition-all ${
              subView === 'directory'
                ? 'opacity-25 cursor-not-allowed text-neutral-400 bg-transparent'
                : layoutMode === 'card'
                ? 'bg-white text-neutral-900 shadow-2xs cursor-pointer'
                : 'text-neutral-500 hover:text-neutral-900 cursor-pointer'
            }`"
            :title="subView === 'directory' ? 'Directory supports List View only (Card View is disabled)' : 'Card View'"
          >
            <LayoutGrid class="w-4 h-4" />
          </button>
          <button
            @click="layoutMode = 'list'"
            :class="`p-1.5 rounded-md transition-colors cursor-pointer ${
              layoutMode === 'list' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
            }`"
            title="List / Table View"
          >
            <List class="w-4 h-4" />
          </button>
        </div>

        <!-- Batch Create Task button (if items selected) -->
        <button
          v-if="selectedItemIds.length > 0"
          @click="handleCreateTaskForSelection"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer animate-in zoom-in-95"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>Create Task ({{ selectedItemIds.length }} Selected)</span>
        </button>

        <!-- General Create Task Button -->
        <button
          v-else
          @click="emit('createTaskForItems', [])"
          class="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all shadow-xs cursor-pointer"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>Create Task</span>
        </button>
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- VIEW A: LATEST NEWS FEED CONTENT                              -->
    <!-- ============================================================= -->
    <div v-if="subView === 'latest'" class="space-y-4">
      <!-- Live Priority Alerts Header Bar with Integrated Sync & Controls -->
      <div class="bg-white p-3.5 sm:p-4 rounded-xl border border-neutral-200 shadow-2xs space-y-3">
        <!-- Main Line: [ 🔥 News Feed • Live Priority Alerts (6 Actionable) ] [ ↻ Sync Feed ] -------- [ ⊞ ≡ ] [ Search... ] [ All Jurisdictions ▾ ] [ History 0 ] -->
        <div class="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <!-- Left: Title & Seamlessly Embedded Sync Feed Button -->
          <div class="flex items-center gap-2.5 sm:gap-3 flex-wrap">
            <div class="flex items-center gap-2">
              <span class="text-base select-none">🔥</span>
              <h3 class="text-sm sm:text-base font-bold text-neutral-900 tracking-tight flex items-center gap-1.5">
                <span>News Feed</span>
                <span class="text-neutral-400 font-normal">•</span>
                <span>Live Priority Alerts</span>
              </h3>
              <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80">
                {{ activeAlerts.length }} Actionable
              </span>
            </div>

            <!-- Seamlessly Embedded Sync Button -->
            <div class="flex items-center gap-2">
              <button
                type="button"
                @click="handleSyncClick"
                :disabled="isSyncingActive"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 active:bg-neutral-100 text-neutral-700 hover:text-neutral-900 text-xs font-semibold transition-all shadow-2xs hover:shadow-xs disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
                :title="lastUpdatedFormatted ? `Last updated: ${lastUpdatedFormatted}` : 'Click to trigger global feeds sync'"
              >
                <RefreshCw :class="`w-4 h-4 text-neutral-600 ${isSyncingActive ? 'animate-spin text-blue-600' : ''}`" />
                <span>{{ isSyncingActive ? 'Syncing...' : 'Sync Feed' }}</span>
              </button>
              <span v-if="lastUpdatedText" class="text-[11px] text-neutral-400 hidden sm:inline" :title="lastUpdatedFormatted ? `Last updated: ${lastUpdatedFormatted}` : ''">
                Last updated: {{ lastUpdatedText }}
              </span>
            </div>
          </div>

          <!-- Right: Controls [ ⊞ ≡ ] [ Search... ] [ All Jurisdictions ▾ ] [ History 0 ] -->
          <div class="flex items-center gap-2 flex-wrap">
            <!-- Layout Switch [ ⊞ ≡ ] -->
            <div class="flex items-center bg-neutral-100 p-0.5 rounded-lg border border-neutral-200">
              <button
                @click="layoutMode = 'card'"
                :class="`p-1.5 rounded-md transition-all cursor-pointer ${
                  layoutMode === 'card' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                }`"
                title="Card View"
              >
                <LayoutGrid class="w-4 h-4" />
              </button>
              <button
                @click="layoutMode = 'list'"
                :class="`p-1.5 rounded-md transition-colors cursor-pointer ${
                  layoutMode === 'list' ? 'bg-white text-neutral-900 shadow-2xs' : 'text-neutral-500 hover:text-neutral-900'
                }`"
                title="List / Table View"
              >
                <List class="w-4 h-4" />
              </button>
            </div>

            <!-- Search -->
            <div class="relative w-40 sm:w-52">
              <Search class="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                v-model="searchQuery"
                placeholder="Search..."
                class="w-full pl-8 pr-2.5 h-8 bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-neutral-900 rounded-lg text-xs text-neutral-900 focus:outline-none transition-colors"
              />
            </div>

            <!-- Quick Jurisdiction Filter -->
            <div class="w-36">
              <ComboboxFilter
                label="Jurisdiction"
                placeholder="All Jurisdictions"
                :options="ALL_JURISDICTIONS"
                v-model:selectedValues="selectedJurisdictions"
              />
            </div>

            <!-- History Button -->
            <button
              type="button"
              @click="showHistoryView = !showHistoryView"
              :class="`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                showHistoryView
                  ? 'bg-neutral-900 text-white border-neutral-900 shadow-xs'
                  : 'bg-neutral-50 hover:bg-white border-neutral-200 text-neutral-700 hover:text-neutral-900'
              }`"
              :title="showHistoryView ? 'Return to Live Alerts' : 'View Read / Dismissed Alerts History'"
            >
              <History class="w-3.5 h-3.5" />
              <span>History</span>
              <span :class="`px-1.5 py-0.2 rounded-full text-[10px] font-mono font-semibold ${
                showHistoryView ? 'bg-neutral-800 text-neutral-200' : 'bg-neutral-200 text-neutral-700'
              }`">
                {{ dismissedAlerts.length }}
              </span>
            </button>
          </div>
        </div>

        <!-- Dimension Filters Row: Category, Relevance, Linkage -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-neutral-100">
          <ComboboxFilter
            label="Category"
            placeholder="All Categories"
            :options="SECTOR_GROUPS"
            v-model:selectedValues="selectedCategories"
          />
          <ComboboxFilter
            label="Relevance"
            placeholder="All Relevances"
            :options="['Direct / Highly Relevant', 'Relevant', 'Partially Relevant', 'Low']"
            v-model:selectedValues="selectedRelevances"
          />
          <ComboboxFilter
            label="Linkage"
            placeholder="All Linkage"
            :options="['Linked to Tasks', 'Unlinked']"
            v-model:selectedValues="selectedLinkages"
          />
        </div>

        <!-- Active Filters Tag Bar with Clear All -->
        <div
          v-if="hasActiveLatestFilters"
          class="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 text-xs flex-wrap"
        >
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-neutral-500 text-[11px] font-normal">Active filters:</span>

            <span
              v-for="jur in selectedJurisdictions"
              :key="jur"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ jur }}</span>
              <button
                @click="selectedJurisdictions = selectedJurisdictions.filter((j) => j !== jur)"
                class="hover:text-neutral-900 cursor-pointer"
              >
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>

            <span
              v-for="cat in selectedCategories"
              :key="cat"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ cat }}</span>
              <button
                @click="selectedCategories = selectedCategories.filter((c) => c !== cat)"
                class="hover:text-neutral-900 cursor-pointer"
              >
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>

            <span
              v-for="rel in selectedRelevances"
              :key="rel"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ rel }}</span>
              <button
                @click="selectedRelevances = selectedRelevances.filter((r) => r !== rel)"
                class="hover:text-neutral-900 cursor-pointer"
              >
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>

            <span
              v-for="lnk in selectedLinkages"
              :key="lnk"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-neutral-100 text-neutral-900 text-[11px] font-medium border border-neutral-200"
            >
              <span>{{ lnk }}</span>
              <button
                @click="selectedLinkages = selectedLinkages.filter((l) => l !== lnk)"
                class="hover:text-neutral-900 cursor-pointer"
              >
                <X class="w-3 h-3 text-neutral-500" />
              </button>
            </span>
          </div>

          <button
            @click="handleClearAllLatestFilters"
            class="text-neutral-500 hover:text-rose-600 font-normal text-xs flex items-center gap-1 cursor-pointer shrink-0 transition-colors"
          >
            <X class="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      <!-- History Mode Banner -->
      <div
        v-if="showHistoryView"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-neutral-100 border border-neutral-300 rounded-xl text-xs shadow-2xs animate-in fade-in"
      >
        <div class="flex items-center gap-2">
          <History class="w-4 h-4 text-neutral-700 shrink-0" />
          <div>
            <span class="font-bold text-neutral-900">Archived & Read Alerts History ({{ dismissedAlerts.length }} items)</span>
            <span class="text-neutral-500 ml-2 hidden md:inline">&bull; Items acknowledged or marked as read from live stream</span>
          </div>
        </div>
        <button
          type="button"
          @click="showHistoryView = false"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-neutral-300 hover:bg-neutral-50 text-neutral-800 font-semibold cursor-pointer shadow-2xs shrink-0 self-start sm:self-auto"
        >
          <ArrowLeft class="w-3.5 h-3.5" />
          <span>Back to Live Priority Alerts</span>
        </button>
      </div>

      <!-- Isolated Sub-scope Notification Banner -->
      <div
        v-if="isolatedSubScopeRegulators.length > 0"
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 bg-amber-50/90 border border-amber-300 rounded-2xl text-xs text-amber-900 shadow-2xs animate-in fade-in"
      >
        <div class="flex items-center gap-2 flex-wrap">
          <span class="inline-flex items-center gap-1.5 font-bold text-amber-900 bg-amber-200/70 px-2 py-0.5 rounded-lg">
            <SlidersHorizontal class="w-3.5 h-3.5 text-amber-700" />
            <span>Child Scope Surveillance:</span>
          </span>
          <span
            v-for="r in isolatedSubScopeRegulators"
            :key="r.id"
            class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-white border border-amber-300 text-[11px] font-semibold text-neutral-800 shadow-2xs"
          >
            <span class="font-bold text-blue-700">{{ r.acronym }}:</span>
            <span class="font-mono text-amber-800 bg-amber-100/80 px-1 py-0.2 rounded">{{ r.subScopes.filter(s => s.isFollowed).map(s => s.name).join(', ') }}</span>
            <span class="text-neutral-400 text-[10px] hidden md:inline truncate max-w-[200px]">({{ r.subScopes.find(s => s.isFollowed)?.url }})</span>
          </span>
          <span class="text-amber-800 font-medium text-[11px]">
            &bull; Only updates crawled from these active child URLs are displayed in News Feed
          </span>
        </div>
        <div class="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            v-for="r in isolatedSubScopeRegulators"
            :key="`reset-${r.id}`"
            type="button"
            @click="emit('followAllSubScopes', r.id, true)"
            class="px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] transition-colors cursor-pointer shadow-2xs"
          >
            Follow All {{ r.acronym }} Scopes
          </button>
        </div>
      </div>

      <!-- Empty state -->
      <div
        v-if="displayedAlerts.length === 0"
        class="bg-white border border-neutral-200 rounded-2xl p-12 text-center space-y-3"
      >
        <div class="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <CheckCircle2 class="w-6 h-6 text-emerald-500" />
        </div>
        <h3 class="text-sm font-bold text-neutral-900">
          {{ showHistoryView ? 'No Archived Alerts in History' : 'All Live Updates Cleared' }}
        </h3>
        <p class="text-xs text-neutral-500 max-w-md mx-auto">
          {{ showHistoryView ? 'Alerts you mark as Read or Dismissed will appear here for audit review and can be restored at any time.' : 'No pending regulatory alerts match your filter. Items you marked as Read or Bookmarked can be reviewed in the Directory or History.' }}
        </p>
      </div>

      <!-- Card View Mode -->
      <div
        v-else-if="layoutMode === 'card'"
        class="space-y-4"
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="alert in paginatedLatestAlerts"
            :key="alert.id"
            class="bg-white rounded-xl border border-neutral-200 p-4 shadow-2xs hover:shadow-sm hover:border-neutral-300 transition-all flex flex-col justify-between group"
          >
            <!-- Card Header: 3-Tier Visual Hierarchy -->
            <div class="space-y-2">
              <!-- Tier 1: Primary Entity (Jurisdiction + Authority Badge) & Task Linkage -->
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    :checked="selectedItemIds.includes(alert.id)"
                    @click.stop="toggleSelectItem(alert.id)"
                    class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                  <!-- Primary Authority Badge -->
                  <span class="text-xs font-semibold bg-blue-600 text-white px-2 py-0.5 rounded shadow-2xs">
                    {{ alert.regulatorAcronym || 'REG' }}
                  </span>
                  <!-- Jurisdiction Entity -->
                  <span class="text-[11px] font-normal text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded">
                    {{ alert.jurisdiction }}
                  </span>
                  <!-- Child Crawler Category / URL indicator -->
                  <div v-if="alert.sourceCategory" class="flex items-center gap-1">
                    <span
                      :title="alert.sourceUrl ? `Crawled from: ${alert.sourceUrl}` : `Source Category: ${alert.sourceCategory}`"
                      class="inline-flex items-center gap-1 font-mono text-[10px] bg-neutral-100 hover:bg-neutral-200 text-neutral-700 px-1.5 py-0.5 rounded"
                    >
                      <Folder class="w-2.5 h-2.5 text-neutral-500" />
                      <span>{{ alert.sourceCategory }}</span>
                    </span>
                  </div>
                </div>

                <!-- Linkage count badge (Numeric count badge: Only show when > 0) -->
                <button
                  v-if="taskStore.getNewsLinkageCount(alert.regulationId || alert.id, alert.title) > 0"
                  @click.stop="emit('openDetail', alert)"
                  :title="`${taskStore.getNewsLinkageCount(alert.regulationId || alert.id, alert.title)} linked task(s). Click to view details.`"
                  class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 cursor-pointer transition-colors"
                >
                  <Layers class="w-3 h-3 text-blue-600" />
                  <span>{{ taskStore.getNewsLinkageCount(alert.regulationId || alert.id, alert.title) }} Tasks</span>
                </button>
              </div>

              <!-- Tier 2: Primary Headline -->
              <div>
                <h3
                  @click="emit('openDetail', alert)"
                  class="text-sm font-semibold text-neutral-900 leading-snug line-clamp-2 hover:text-blue-600 cursor-pointer transition-colors"
                >
                  {{ alert.title }}
                </h3>
              </div>

              <!-- Tier 3: Muted Secondary Metadata in Clean Single-Line Typography -->
              <div class="flex items-center gap-2 text-[11px] text-neutral-500 truncate pt-0.5">
                <span class="font-normal text-neutral-700 truncate max-w-[160px]">{{ alert.category || 'Financial Regulation' }}</span>
                <template v-if="alert.themes && alert.themes.length > 0">
                  <span class="text-neutral-300">&bull;</span>
                  <span class="text-neutral-500 truncate">{{ alert.themes[0] }}</span>
                </template>
              </div>

              <!-- Summary Narrative -->
              <p class="text-xs text-neutral-600 line-clamp-2 leading-relaxed pt-1 font-normal">
                {{ alert.aiRelevanceSummary }}
              </p>
            </div>

            <!-- Card Bottom Bar: Left has publication date, Right has Read & Bookmark -->
            <div class="pt-3 mt-3 border-t border-neutral-100 flex items-center justify-between gap-2">
              <!-- Publication Date (Bottom Left, aligned with Read button) -->
              <div class="flex items-center gap-1 text-neutral-500 font-mono text-[11px] shrink-0">
                <Clock class="w-3.5 h-3.5 text-neutral-400" />
                <span>{{ alert.publishDate }}</span>
              </div>

              <!-- Card Actions (Read & Bookmark / Restore) -->
              <div class="flex items-center gap-2 shrink-0">
                <!-- Restore Action when in History Mode -->
                <button
                  v-if="showHistoryView"
                  @click.stop="emit('restoreReadAlert', alert.id)"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
                  title="Restore to Active Live Feed"
                >
                  <RotateCcw class="w-3.5 h-3.5 text-blue-600" />
                  <span>Restore</span>
                </button>

                <!-- Read Action (clears card without saving) -->
                <button
                  v-else
                  @click.stop="emit('readAlert', alert.id)"
                  class="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 transition-colors cursor-pointer"
                  title="Mark as Read & Clear"
                >
                  <Check class="w-3.5 h-3.5 text-neutral-500" />
                  <span>Read</span>
                </button>

                <!-- Bookmark Action (Icon-only toggle button) -->
                <button
                  @click.stop="emit('bookmarkAlert', alert)"
                  :class="`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                    directoryStore.isBookmarked(alert.regulationId || alert.id, undefined, alert.title)
                      ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-2xs'
                      : 'text-neutral-400 hover:text-blue-600 border-neutral-200 hover:bg-blue-50'
                  }`"
                  :title="directoryStore.isBookmarked(alert.regulationId || alert.id, undefined, alert.title) ? 'Remove Bookmark' : 'Bookmark to Directory'"
                  aria-label="Bookmark"
                >
                  <BookmarkCheck
                    v-if="directoryStore.isBookmarked(alert.regulationId || alert.id, undefined, alert.title)"
                    class="w-4 h-4 text-white"
                  />
                  <Bookmark v-else class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Pagination for Latest Card View -->
        <PaginationController
          v-if="displayedAlerts.length > 0"
          :totalItems="displayedAlerts.length"
          v-model:currentPage="latestCurrentPage"
          v-model:pageSize="latestPageSize"
        />
      </div>

      <!-- List / Table View Mode (Scalable for hundreds of items) -->
      <div v-else class="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
        <table class="w-full text-left text-xs">
          <thead class="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-700">
            <tr>
              <th class="p-3 w-8">
                <input
                  type="checkbox"
                  :checked="selectedItemIds.length === paginatedLatestAlerts.length && paginatedLatestAlerts.length > 0"
                  @click="toggleSelectAll(paginatedLatestAlerts)"
                  class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </th>
              <th class="p-3">News & Regulatory Publication</th>
              <th class="p-3 w-32">Authority</th>
              <th class="p-3 w-28">Jurisdiction</th>
              <th class="p-3 w-24">Linkage</th>
              <th class="p-3 w-28">Date</th>
              <th class="p-3 w-48 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-neutral-100">
            <tr
              v-for="alert in paginatedLatestAlerts"
              :key="alert.id"
              class="hover:bg-neutral-50/70 transition-colors group cursor-pointer"
              @click="emit('openDetail', alert)"
            >
              <td class="p-3" @click.stop>
                <input
                  type="checkbox"
                  :checked="selectedItemIds.includes(alert.id)"
                  @click.stop="toggleSelectItem(alert.id)"
                  class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                />
              </td>
              <td class="p-3">
                <div class="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                  {{ alert.title }}
                </div>
                <div class="flex items-center gap-1.5 mt-1 flex-wrap">
                  <span class="text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200/80 px-1.5 py-0.2 rounded">
                    {{ alert.category || 'Financial Services & Capital Markets' }}
                  </span>
                  <span
                    v-for="thm in (alert.themes || []).slice(0, 2)"
                    :key="thm"
                    class="text-[10px] text-neutral-600 bg-neutral-100 border border-neutral-200/60 px-1.5 py-0.2 rounded font-normal"
                  >
                    {{ thm }}
                  </span>
                </div>
                <div class="text-[11px] text-neutral-500 line-clamp-1 mt-0.5">
                  {{ alert.aiRelevanceSummary }}
                </div>
              </td>
              <td class="p-3">
                <div class="space-y-1">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded text-[11px]">
                      {{ alert.regulatorAcronym || 'REG' }}
                    </span>
                  </div>
                  <div
                    v-if="alert.sourceCategory"
                    :title="alert.sourceUrl ? `Crawled from: ${alert.sourceUrl}` : alert.sourceCategory"
                    class="text-[10px] text-slate-500 font-mono truncate max-w-[120px]"
                  >
                    {{ alert.sourceCategory }}
                  </div>
                </div>
              </td>
              <td class="p-3 text-neutral-600">{{ alert.jurisdiction }}</td>
              <td class="p-3">
                <span
                  v-if="taskStore.getNewsLinkageCount(alert.regulationId || alert.id, alert.title) > 0"
                  class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                >
                  <Layers class="w-3 h-3" />
                  <span>{{ taskStore.getNewsLinkageCount(alert.regulationId || alert.id, alert.title) }}</span>
                </span>
                <span v-else class="text-neutral-300 text-xs pl-2">-</span>
              </td>
              <td class="p-3 text-neutral-500 font-mono text-[11px]">{{ alert.publishDate }}</td>
              <td class="p-3 text-right" @click.stop>
                <div class="flex items-center justify-end gap-1.5">
                  <button
                    v-if="showHistoryView"
                    @click.stop="emit('restoreReadAlert', alert.id)"
                    class="px-2 py-1 rounded text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 cursor-pointer flex items-center gap-1"
                    title="Restore to Active Live Feed"
                  >
                    <RotateCcw class="w-3 h-3 text-blue-600" />
                    <span>Restore</span>
                  </button>
                  <button
                    v-else
                    @click.stop="emit('readAlert', alert.id)"
                    class="px-2 py-1 rounded text-xs font-semibold text-neutral-600 hover:bg-neutral-100 border border-neutral-200 cursor-pointer"
                    title="Mark Read"
                  >
                    Read
                  </button>
                  <button
                    @click.stop="emit('bookmarkAlert', alert)"
                    :class="`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                      directoryStore.isBookmarked(alert.regulationId || alert.id, undefined, alert.title)
                        ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-2xs'
                        : 'text-neutral-400 hover:text-blue-600 border-neutral-200 hover:bg-blue-50'
                    }`"
                    :title="directoryStore.isBookmarked(alert.regulationId || alert.id, undefined, alert.title) ? 'Remove Bookmark' : 'Bookmark'"
                    aria-label="Bookmark"
                  >
                    <BookmarkCheck
                      v-if="directoryStore.isBookmarked(alert.regulationId || alert.id, undefined, alert.title)"
                      class="w-3.5 h-3.5 text-white"
                    />
                    <Bookmark v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Pagination for Latest List View -->
        <PaginationController
          v-if="displayedAlerts.length > 0"
          :totalItems="displayedAlerts.length"
          v-model:currentPage="latestCurrentPage"
          v-model:pageSize="latestPageSize"
        />
      </div>
    </div>

    <!-- ============================================================= -->
    <!-- VIEW B: DIRECTORY 4-LAYER PIPELINE CONTENT                    -->
    <!-- ============================================================= -->
    <div v-else class="space-y-5">
      <!-- 4-Layer Filter Panel -->
      <DirectoryFilterPanel
        :isBookmarksActive="directoryStore.isBookmarksActive"
        @apply="handleApplyDirectoryFilters"
        @reset="handleResetDirectoryFilters"
        @toggleBookmarks="handleToggleDirectoryBookmarks"
        @filterChange="handleDirectoryFilterChange"
      />

      <!-- CASE 1: Bookmarks is Disabled AND User has NOT clicked Apply yet -->
      <!-- Conditional trigger: When Bookmarks is turned off, shows Ready to Search Directory prompt before Apply is clicked -->
      <div
        v-if="!directoryStore.isBookmarksActive && !hasAppliedDirectoryFilters"
        class="bg-white rounded-2xl border border-neutral-200 p-8 sm:p-12 text-center space-y-4 shadow-2xs animate-in fade-in"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto text-blue-600">
          <Compass class="w-8 h-8" />
        </div>
        <div class="space-y-1 max-w-md mx-auto">
          <h3 class="text-base font-bold text-neutral-900">Search Directory</h3>
          <p class="text-xs text-neutral-500 leading-relaxed">
            Configure your filters above and click Apply to execute the full-catalog search.
          </p>
        </div>
      </div>

      <!-- CASE 2: Empty Results (either Bookmarks is empty or Search yielded 0 results) -->
      <div
        v-else-if="displayedDirectoryItems.length === 0"
        class="bg-white border border-neutral-200 rounded-2xl p-10 text-center space-y-3.5 shadow-2xs"
      >
        <div class="w-12 h-12 rounded-2xl bg-neutral-100 flex items-center justify-center mx-auto text-neutral-400">
          <Bookmark class="w-6 h-6 text-neutral-400" />
        </div>
        <div class="space-y-1">
          <h3 class="text-sm font-bold text-neutral-900">
            {{ directoryStore.isBookmarksActive ? 'No Bookmarked Publications Yet' : 'No Regulatory Items Found' }}
          </h3>
          <p class="text-xs text-neutral-500 max-w-md mx-auto leading-relaxed">
            {{
              directoryStore.isBookmarksActive
                ? 'Your bookmark list is currently empty. Click "Bookmark" on any publication in Latest News Feed or search the Directory catalog to bookmark items.'
                : 'No items match your 4-layer filter criteria. Adjust your date range, jurisdictions, or categories above.'
            }}
          </p>
        </div>

        <div v-if="directoryStore.isBookmarksActive" class="flex items-center justify-center gap-2.5 pt-2">
          <button
            type="button"
            @click="subView = 'latest'"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
          >
            <Radio class="w-3.5 h-3.5" />
            <span>Go to Latest Feed</span>
          </button>
          <button
            type="button"
            @click="handleToggleDirectoryBookmarks(false)"
            class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-neutral-100 hover:bg-neutral-200 text-neutral-700 text-xs font-semibold transition-colors cursor-pointer border border-neutral-200"
          >
            <Compass class="w-3.5 h-3.5 text-neutral-500" />
            <span>Search Full Directory</span>
          </button>
        </div>
      </div>

      <!-- CASE 3: Render Results (Cards or List View) -->
      <div v-else class="space-y-4">
        <!-- LIST / TABLE VIEW MODE FOR DIRECTORY (Directory strictly uses List View) -->
        <div class="bg-white rounded-2xl border border-neutral-200 shadow-2xs overflow-hidden">
          <table class="w-full text-left text-xs">
            <thead class="bg-neutral-50 border-b border-neutral-200 font-bold text-neutral-700">
              <tr>
                <th class="p-3 w-8">
                  <input
                    type="checkbox"
                    :checked="selectedItemIds.length === paginatedDirectoryItems.length && paginatedDirectoryItems.length > 0"
                    @click="toggleSelectAll(paginatedDirectoryItems)"
                    class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </th>
                <th class="p-3">Title / Document</th>
                <th class="p-3 w-32">Authority</th>
                <th class="p-3 w-28">Jurisdiction</th>
                <th class="p-3 w-36">Category</th>
                <th class="p-3 w-24">Linkage</th>
                <th class="p-3 w-28">Date</th>
                <th class="p-3 w-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                v-for="item in paginatedDirectoryItems"
                :key="item.id"
                class="hover:bg-neutral-50/70 transition-colors group cursor-pointer"
                @click="emit('openDetail', item)"
              >
                <td class="p-3" @click.stop>
                  <input
                    type="checkbox"
                    :checked="selectedItemIds.includes(item.id)"
                    @click.stop="toggleSelectItem(item.id)"
                    class="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 cursor-pointer"
                  />
                </td>
                <td class="p-3">
                  <div class="font-bold text-neutral-900 group-hover:text-blue-600 transition-colors">
                    {{ item.title }}
                  </div>
                  <!-- Only show official referenceNumber if it exists and is not generic duplicate fallback -->
                  <div
                    v-if="item.referenceNumber && !item.referenceNumber.startsWith('REF-') && !item.title.toLowerCase().includes(item.referenceNumber.toLowerCase())"
                    class="text-[11px] text-neutral-500 font-mono mt-0.5"
                  >
                    {{ item.referenceNumber }}
                  </div>
                  <div v-if="item.themes && item.themes.length > 0" class="flex flex-wrap gap-1 mt-1">
                    <span
                      v-for="thm in item.themes.slice(0, 2)"
                      :key="thm"
                      class="text-[10px] px-1.5 py-0.2 bg-neutral-100 text-neutral-600 rounded border border-neutral-200/60 font-normal"
                    >
                      {{ thm }}
                    </span>
                    <span v-if="item.themes.length > 2" class="text-[10px] text-neutral-400">
                      +{{ item.themes.length - 2 }}
                    </span>
                  </div>
                </td>
                <td class="p-3">
                  <span class="font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded text-[11px]">
                    {{ item.regulatorAcronym || 'REG' }}
                  </span>
                </td>
                <td class="p-3 text-neutral-600">{{ item.jurisdiction }}</td>
                <td class="p-3 text-neutral-600 truncate max-w-[140px]">{{ item.category }}</td>
                <td class="p-3">
                  <span
                    v-if="taskStore.getNewsLinkageCount(item.id, item.title, item.referenceNumber) > 0"
                    class="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700"
                  >
                    <Layers class="w-3 h-3" />
                    <span>{{ taskStore.getNewsLinkageCount(item.id, item.title, item.referenceNumber) }} Tasks</span>
                  </span>
                  <span v-else class="text-neutral-300 text-xs pl-2">-</span>
                </td>
                <td class="p-3 text-neutral-500 font-mono text-[11px]">{{ item.publishDate }}</td>
                <td class="p-3 text-right" @click.stop>
                  <div class="flex items-center justify-end gap-1.5">
                    <button
                      @click.stop="emit('toggleBookmarkDirectory', item)"
                      :class="`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                        directoryStore.isBookmarked(item.id, item.referenceNumber, item.title)
                          ? 'bg-blue-600 text-white border-blue-600 hover:bg-blue-700 shadow-2xs'
                          : 'text-neutral-400 hover:text-blue-600 border-neutral-200 hover:bg-blue-50'
                      }`"
                      :title="directoryStore.isBookmarked(item.id, item.referenceNumber, item.title) ? 'Remove Bookmark' : 'Bookmark'"
                    >
                      <BookmarkCheck
                        v-if="directoryStore.isBookmarked(item.id, item.referenceNumber, item.title)"
                        class="w-3.5 h-3.5 text-white"
                      />
                      <Bookmark v-else class="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls for Directory -->
        <PaginationController
          v-if="displayedDirectoryItems.length > 0"
          :totalItems="displayedDirectoryItems.length"
          v-model:currentPage="directoryCurrentPage"
          v-model:pageSize="directoryPageSize"
        />
      </div>
    </div>
  </div>
</template>
