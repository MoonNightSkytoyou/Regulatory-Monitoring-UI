import type {
  User,
  RegulationItem,
  PriorityAlert,
  RegulatorInScope,
  FrameworkCardData,
  CustomSourceRegistration,
  RegulatoryDirectoryItem,
  DiligenceProject,
  MatrixSessionState,
  AuditEntry,
  CoverageBannerData,
  HealthStatus,
  RegulatoryCategory,
  SectorGroup,
  SourceCategory,
} from '@/types';
import { SECTOR_GROUPS, SOURCE_CATEGORIES } from '@/types';
import { initialMockData } from '@/data/mockData';
import { GLOBAL_REGULATORY_DIRECTORY, INITIAL_DILIGENCE_PROJECTS } from '@/data/directoryData';
import { INITIAL_MATRIX_SESSIONS } from '@/data/matrixMockData';
import {
  GLOBAL_SOURCE_REGISTRY_MOCK,
  mapSourceRegistryRowToRegulator,
  RawGlobalSourceRow
} from '@/data/sourceRegistryData';
import {
  adaptBackendCatalogToRegulators,
  adaptBackendMonitorFeed,
  RawBackendSourceCatalogResponse,
  RawBackendSourceCatalogItem,
  RawBackendMonitorFeedResponse,
  RawBackendMonitorFeedItem,
  IngestedMonitorFeedResult,
} from './backendAdapters';

/**
 * Global API configuration & endpoint constants.
 * In production or dev mode with a backend, set VITE_API_BASE_URL (e.g. 'https://api.yourcompany.com/v1').
 * If no backend is detected or requests fail, the API client automatically falls back to the in-memory mock dataset.
 */
export interface ApiConfig {
  baseUrl: string;
  timeoutMs: number;
  enableFallback: boolean;
  headers: Record<string, string>;
}

const savedCustomUrl =
  typeof window !== 'undefined'
    ? localStorage.getItem('hk_monitor_custom_api_url')
    : null;

export const defaultApiConfig: ApiConfig = {
  baseUrl: savedCustomUrl || (import.meta as any).env?.VITE_API_BASE_URL || 'http://localhost:8050/api/v1',
  timeoutMs: 4000,
  enableFallback: true, // Enabled fallback to restored mock dataset
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
};

export const setCustomBaseUrl = (url: string) => {
  defaultApiConfig.baseUrl = url.trim().replace(/\/$/, '');
  hasCheckedHealth = false;
  isBackendReachable = false;
  if (typeof window !== 'undefined') {
    localStorage.setItem('hk_monitor_custom_api_url', defaultApiConfig.baseUrl);
  }
};

// Internal API health & connection indicator state
let isBackendReachable = false;
let hasCheckedHealth = false;

export const getBackendStatus = () => ({
  reachable: isBackendReachable,
  checked: hasCheckedHealth,
  baseUrl: defaultApiConfig.baseUrl,
});

/**
 * Robust fetch wrapper with timeout and fallback support
 */
async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackFn: () => Promise<T> | T
): Promise<{ data: T; isFallback: boolean; error?: Error }> {
  // Candidate URLs:
  // 1. Direct local port 8050 if running in browser (bypasses container network isolation)
  // 2. Configured baseUrl
  const cleanEndpoint = endpoint.replace(/^\//, '');
  const isBrowser = typeof window !== 'undefined';
  const isHttps = isBrowser && window.location.protocol === 'https:';
  const urlCandidates: string[] = [];

  // If in browser on localhost/127.0.0.1 and not HTTPS, or in dev, try port 8050
  if (isBrowser && !isHttps && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    urlCandidates.push(`http://127.0.0.1:8050/api/v1/${cleanEndpoint}`);
  }
  urlCandidates.push(`${defaultApiConfig.baseUrl.replace(/\/$/, '')}/${cleanEndpoint}`);

  const urlsToTry = Array.from(new Set(urlCandidates));
  // If backend was already confirmed unreachable, use rapid timeout to avoid lagging UI
  const timeoutMs = (!isBackendReachable && hasCheckedHealth) ? 1200 : defaultApiConfig.timeoutMs;

  for (const url of urlsToTry) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(url, {
        ...options,
        headers: {
          ...defaultApiConfig.headers,
          ...(options.headers || {}),
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const json = await res.json();
        isBackendReachable = true;
        hasCheckedHealth = true;
        return { data: json as T, isFallback: false };
      }
    } catch {
      clearTimeout(timeoutId);
      // Continue to next URL candidate or fallback
    }
  }

  isBackendReachable = false;
  hasCheckedHealth = true;

  if (defaultApiConfig.enableFallback) {
    const mockResult = await fallbackFn();
    return { data: mockResult, isFallback: true };
  }

  throw new Error(`Failed to fetch from ${endpoint} and fallback is disabled`);
}

// ==========================================
// Global Source Registry (Excel/DB Adapter)
// ==========================================
export type { RawGlobalSourceRow } from '@/data/sourceRegistryData';
export { mapSourceRegistryRowToRegulator } from '@/data/sourceRegistryData';

// ==========================================
// In-Memory Simulated State Store (Fallback)
// ==========================================
// Initialized directly with mapped entities from GLOBAL_SOURCE_REGISTRY_MOCK
const INITIAL_REGISTRY_REGULATORS: RegulatorInScope[] = GLOBAL_SOURCE_REGISTRY_MOCK.map((row) =>
  mapSourceRegistryRowToRegulator(row as RawGlobalSourceRow)
);

function createInitialDirectory(): RegulatoryDirectoryItem[] {
  const map = new Map<string, RegulatoryDirectoryItem>();
  
  // Seed with global directory items
  for (const item of GLOBAL_REGULATORY_DIRECTORY) {
    map.set(item.id.toLowerCase(), { ...item });
  }

  // Seed with in-scope and historical regulations
  for (const reg of initialMockData.regulations) {
    const key = reg.id.toLowerCase();
    if (!map.has(key)) {
      map.set(key, {
        ...reg,
        status: 'None',
        whyRelevantExplanation: reg.whyRelevantExplanation || reg.executiveSummary,
        aiRelevanceTier: reg.materiality === 'Direct / Highly Relevant' ? 'High' : reg.materiality === 'Relevant' ? 'Med' : 'Low',
      });
    }
  }

  return Array.from(map.values());
}

const mockStore = {
  currentUser: { ...initialMockData.currentUser },
  regulations: [...initialMockData.regulations],
  priorityAlerts: [...initialMockData.priorityAlerts],
  regulatorsInScope: [...initialMockData.regulatorsInScope],
  frameworkCards: [...initialMockData.frameworkCards],
  customSources: [...initialMockData.customSources],
  coverageBanner: {
    identifiedGapsCount: 0,
    unmonitoredRegulatorsCount: 0,
    suggestedAdditions: [],
  },
  directoryItems: createInitialDirectory(),
  diligenceProjects: [...INITIAL_DILIGENCE_PROJECTS],
  matrixSessions: [...INITIAL_MATRIX_SESSIONS],
  hasTriggeredCrawlerSync: false,
};

// ==========================================
// API Query Parameter Types
// ==========================================
export interface RegulationQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  theme?: string;
  category?: string;
  jurisdiction?: string;
  regulatorAcronym?: string;
  materiality?: string;
  diligenceStatus?: string;
  sortField?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ScopeUpdatePayload {
  selectedArchetype: string;
  selectedMarkets: string[];
  businessSpecifics?: string;
  selectedRegulatorIds: string[];
  updatedAt?: string;
}

// ==========================================
// Centralized API Service Modules
// ==========================================
export const api = {
  /**
   * Health check to detect backend presence
   */
  async checkHealth(): Promise<{ status: string; reachable: boolean }> {
    try {
      const res = await request('/health', { method: 'GET' }, () => ({
        status: 'ok',
        mode: 'mock-fallback',
      }));
      return { status: 'healthy', reachable: !res.isFallback };
    } catch {
      return { status: 'offline', reachable: false };
    }
  },

  // ----------------------------------------
  // User & Workspace Profile
  // ----------------------------------------
  user: {
    async getCurrentUser(): Promise<User> {
      const res = await request<User>('/user/me', { method: 'GET' }, () => mockStore.currentUser);
      return res.data;
    },

    async updatePreferences(updates: Partial<User>): Promise<User> {
      const res = await request<User>(
        '/user/preferences',
        { method: 'PATCH', body: JSON.stringify(updates) },
        () => {
          Object.assign(mockStore.currentUser, updates);
          return mockStore.currentUser;
        }
      );
      return res.data;
    },
  },

  // ----------------------------------------
  // Regulations & Active In-Scope Feed
  // ----------------------------------------
  regulations: {
    async list(params: RegulationQueryParams = {}): Promise<PaginatedResult<RegulationItem>> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.search) query.set('search', params.search);
      if (params.theme) query.set('theme', params.theme);
      if (params.category) query.set('category', params.category);
      if (params.jurisdiction) query.set('jurisdiction', params.jurisdiction);
      if (params.sortField) query.set('sortField', params.sortField);
      if (params.sortOrder) query.set('sortOrder', params.sortOrder);

      const qs = query.toString() ? `?${query.toString()}` : '';

      // First attempt primary backend route /regulatory/updates/latest
      let res = await request<any>(
        `/regulatory/updates/latest${qs}`,
        { method: 'GET' },
        () => null
      );

      // If query-based path failed, try without query parameters
      if (res.isFallback || !res.data) {
        res = await request<any>(
          '/regulatory/updates/latest',
          { method: 'GET' },
          () => null
        );
      }

      // If still no response, try /regulations endpoint
      if (res.isFallback || !res.data) {
        res = await request<any>(
          `/regulations${qs}`,
          { method: 'GET' },
          () => null
        );
      }

      if (!res.data) {
        let filtered = [...mockStore.regulations];
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.referenceNumber.toLowerCase().includes(q) ||
              r.regulatorAcronym.toLowerCase().includes(q)
          );
        }
        if (params.theme) {
          filtered = filtered.filter((r) => r.themes.includes(params.theme!));
        }
        if (params.category) {
          filtered = filtered.filter((r) => r.category === params.category);
        }
        if (params.jurisdiction) {
          filtered = filtered.filter((r) => r.jurisdiction === params.jurisdiction);
        }
        return {
          items: filtered,
          total: filtered.length,
          page: 1,
          limit: params.limit || 50,
          totalPages: Math.ceil(filtered.length / (params.limit || 50)) || 1,
        };
      }

      // Extract items from any response envelope
      const rawData = res.data;
      let rawList: any[] = [];
      if (Array.isArray(rawData)) {
        rawList = rawData;
      } else if (Array.isArray(rawData.items)) {
        rawList = rawData.items;
      } else if (Array.isArray(rawData.updates)) {
        rawList = rawData.updates;
      } else if (Array.isArray(rawData.regulations)) {
        rawList = rawData.regulations;
      } else if (Array.isArray(rawData.data)) {
        rawList = rawData.data;
      }

      if (rawList.length > 0) {
        const first = rawList[0];
        // If raw monitor crawler items
        if (first.publication_date || first.impact_status || first.source_id || first.source_label) {
          const { regulations } = adaptBackendMonitorFeed(rawList);
          let filtered = regulations;
          if (params.search) {
            const q = params.search.toLowerCase();
            filtered = filtered.filter(
              (r) =>
                r.title.toLowerCase().includes(q) ||
                r.referenceNumber.toLowerCase().includes(q) ||
                r.regulatorAcronym.toLowerCase().includes(q)
            );
          }
          return {
            items: filtered,
            total: filtered.length,
            page: 1,
            limit: filtered.length,
            totalPages: 1,
          };
        } else {
          // Standard RegulationItem format
          return {
            items: rawList as RegulationItem[],
            total: rawData.total || rawList.length,
            page: rawData.page || 1,
            limit: rawData.limit || rawList.length,
            totalPages: rawData.totalPages || 1,
          };
        }
      }

      return {
        items: [],
        total: 0,
        page: 1,
        limit: params.limit || 50,
        totalPages: 0,
      };
    },

    async getById(id: string): Promise<RegulationItem | null> {
      const res = await request<RegulationItem | null>(
        `/regulations/${encodeURIComponent(id)}`,
        { method: 'GET' },
        () => mockStore.regulations.find((r) => r.id === id) || null
      );
      return res.data;
    },

    async updateDiligenceStatus(
      id: string,
      status: RegulationItem['diligenceStatus'],
      performedBy: string,
      details: string
    ): Promise<RegulationItem> {
      const res = await request<RegulationItem>(
        `/regulations/${encodeURIComponent(id)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, performedBy, details }),
        },
        () => {
          const item = mockStore.regulations.find((r) => r.id === id);
          if (!item) throw new Error(`Regulation ${id} not found`);
          item.diligenceStatus = status;
          const audit: AuditEntry = {
            id: `aud-${Date.now()}`,
            timestamp: new Date().toISOString(),
            action: `Diligence Status -> ${status}`,
            performedBy,
            details,
          };
          item.auditTimeline = [audit, ...(item.auditTimeline || [])];
          return item;
        }
      );
      return res.data;
    },

    async recordOverride(
      id: string,
      field: 'materiality' | 'relevance',
      newTier: string,
      justification: string,
      user: string
    ): Promise<RegulationItem> {
      const res = await request<RegulationItem>(
        `/regulations/${encodeURIComponent(id)}/override`,
        {
          method: 'POST',
          body: JSON.stringify({ field, newTier, justification, user }),
        },
        () => {
          const item = mockStore.regulations.find((r) => r.id === id);
          if (!item) throw new Error(`Regulation ${id} not found`);
          const previousTier = field === 'materiality' ? item.materiality : `${item.aiRelevanceScore}%`;
          if (field === 'materiality') {
            item.materiality = newTier as any;
          } else if (field === 'relevance') {
            const parsedScore = parseInt(newTier.replace(/\D/g, ''), 10);
            if (!isNaN(parsedScore)) {
              item.aiRelevanceScore = parsedScore;
            }
          }
          item.overrides = [
            {
              timestamp: new Date().toISOString(),
              user,
              field,
              previousTier,
              newTier,
              justification,
            },
            ...(item.overrides || []),
          ];
          return item;
        }
      );
      return res.data;
    },
  },

  // ----------------------------------------
  // Priority Alerts & SLA Management
  // ----------------------------------------
  alerts: {
    async list(): Promise<PriorityAlert[]> {
      // First attempt live backend endpoint: /regulatory/updates/latest
      let res = await request<any>(
        '/regulatory/updates/latest',
        { method: 'GET' },
        () => null
      );

      if (res.isFallback || !res.data) {
        res = await request<any>('/alerts', { method: 'GET' }, () => mockStore.priorityAlerts);
      }

      if (!res.data) {
        return [...mockStore.priorityAlerts];
      }

      // If the response is wrapped from the raw backend monitor feed ({ generated_at, items: [...] })
      if (res.data && Array.isArray(res.data.items)) {
        const first = res.data.items[0];
        // If items are raw crawler feed items
        if (first && (first.publication_date || first.impact_status || first.source_id || first.source_label)) {
          const { alerts, regulations } = adaptBackendMonitorFeed(res.data as RawBackendMonitorFeedResponse);
          // Synchronize in-memory fallback regulations store with detected items
          if (regulations.length > 0) {
            const existingIds = new Set(mockStore.regulations.map((r) => r.id));
            const newRegs = regulations.filter((r) => !existingIds.has(r.id));
            mockStore.regulations = [...newRegs, ...mockStore.regulations];
          }
          return alerts;
        } else if (first && (first.slaDeadline || first.regulationId || (first.regulator && first.status))) {
          // Standard PriorityAlert[] format
          return res.data.items as PriorityAlert[];
        }
      }

      if (res.data && Array.isArray(res.data.updates)) {
        const { alerts } = adaptBackendMonitorFeed(res.data.updates);
        return alerts;
      }

      // If regulatory/updates/latest returned regulations, but not alerts, also try standard /alerts endpoint
      if (res.data && (Array.isArray(res.data) ? res.data : res.data.items)?.length > 0) {
        const sample = Array.isArray(res.data) ? res.data[0] : res.data.items[0];
        if (sample && !sample.slaDeadline && !sample.source_id && sample.diligenceStatus) {
          // Was regulations response, fetch /alerts
          const alertRes = await request<any>('/alerts', { method: 'GET' }, () => mockStore.priorityAlerts);
          if (Array.isArray(alertRes.data)) return alertRes.data as PriorityAlert[];
          if (alertRes.data?.items) return alertRes.data.items as PriorityAlert[];
        }
      }

      if (Array.isArray(res.data)) {
        // If it is an array of raw monitor items with publication_date & impact_status
        if (res.data.length > 0 && (res.data[0].publication_date || res.data[0].impact_status)) {
          const { alerts } = adaptBackendMonitorFeed(res.data);
          return alerts;
        }

        return res.data.map((item, idx) => {
          // If the backend returns raw notification from their URL crawler update
          if (item['Authority Name'] || item['Authority Abbreviation'] || item.source_id || item.has_update) {
            const acronym = (item['Authority Abbreviation'] || item.acronym || 'REG').toUpperCase();
            const jurisdiction = item['Jurisdiction'] || item.jurisdiction || 'Global';
            return {
              id: item.id || `alert-${item['Source ID'] || item.source_id || idx}-${Date.now()}`,
              title: item.title || `Official Supervisory Release from ${acronym}`,
              regulator: item['Authority Name'] || item.regulator || acronym,
              regulatorAcronym: acronym,
              jurisdiction,
              materiality: item.materiality || 'High',
              aiRelevanceSummary: item['Summary'] || item.summary || `Live supervisory update detected from ${acronym} official portal (${item['URL'] || item.url || ''}).`,
              publishDate: item.publishDate || new Date().toISOString().slice(0, 10),
              effectiveDate: item.effectiveDate || new Date().toISOString().slice(0, 10),
              slaDeadline: '48h from detection',
              isOverdueSLA: false,
              status: item.status || 'pending',
              regulationId: item.regulationId || `reg-${item['Source ID'] || item.source_id || idx}`,
            } as PriorityAlert;
          }
          return item as PriorityAlert;
        });
      }
      return [];
    },

    async updateStatus(
      id: string,
      status: PriorityAlert['status'],
      actionDetails?: string
    ): Promise<PriorityAlert> {
      const res = await request<PriorityAlert>(
        `/alerts/${encodeURIComponent(id)}/status`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, actionDetails }),
        },
        () => {
          const alert = mockStore.priorityAlerts.find((a) => a.id === id);
          if (!alert) throw new Error(`Alert ${id} not found`);
          alert.status = status;
          if (actionDetails) {
            alert.actionDetails = actionDetails;
            alert.actionDate = new Date().toISOString();
          }
          return alert;
        }
      );
      return res.data;
    },

    async dismiss(id: string, reason: string): Promise<PriorityAlert> {
      return this.updateStatus(id, 'dismissed', `Dismissed: ${reason}`);
    },

    /**
     * Triggers a global system-level crawler or feeds synchronization.
     * Hits /alerts/sync or /crawl/trigger on backend, or dynamically discovers newly crawled alerts.
     */
    async triggerSync(): Promise<{ success: boolean; count: number; newAlerts: PriorityAlert[] }> {
      const res = await request<{ success: boolean; count?: number; newAlerts?: PriorityAlert[] }>(
        '/alerts/sync',
        { method: 'POST' },
        async () => {
          // If already triggered in this session, return up-to-date
          if (mockStore.hasTriggeredCrawlerSync) {
            return {
              success: true,
              count: 0,
              newAlerts: [],
            };
          }

          mockStore.hasTriggeredCrawlerSync = true;
          const todayIso = new Date().toISOString().slice(0, 10);
          const crawledAlerts: PriorityAlert[] = [
            {
              id: 'alt-crawled-hkma-genai-2026',
              title: 'Guidance on Generative AI & High-Impact Algorithmic Models in Banking Operations',
              regulator: 'Hong Kong Monetary Authority',
              regulatorAcronym: 'HKMA',
              jurisdiction: 'Hong Kong',
              category: 'Financial Services & Capital Markets',
              themes: ['Operational resilience and incident reporting', 'Data privacy and cybersecurity'],
              materiality: 'Direct / Highly Relevant',
              aiRelevanceSummary: 'Requires authorized institutions to establish an AI Ethics & Model Validation committee, conduct continuous hallucination stress testing, and maintain auditability for automated credit decisions.',
              publishDate: todayIso,
              effectiveDate: '2026-07-01',
              slaDeadline: '12h from detection',
              isOverdueSLA: false,
              status: 'pending',
              regulationId: 'reg-hkma-genai-2026',
              sourceCategory: 'banking_prudential_regulator',
              sourceUrl: 'https://www.hkma.gov.hk/eng/regulatory-resources/circulars/2026/genai',
              subScopeId: 'sub-hkma-banking',
            },
            {
              id: 'alt-crawled-mas-cyber-2026',
              title: 'Notice 658: Mandated Threat Intelligence Exchange & Zero-Trust Cloud Architecture',
              regulator: 'Monetary Authority of Singapore',
              regulatorAcronym: 'MAS',
              jurisdiction: 'Singapore',
              category: 'Financial Services & Capital Markets',
              themes: ['Data privacy and cybersecurity', 'Operational resilience and incident reporting'],
              materiality: 'Direct / Highly Relevant',
              aiRelevanceSummary: 'Mandates financial institutions in Singapore to ingest real-time threat intelligence feeds from FS-ISAC, enforce multi-factor authentication across all privileged remote access, and log API perimeter telemetry.',
              publishDate: todayIso,
              effectiveDate: '2026-08-15',
              slaDeadline: '24h from detection',
              isOverdueSLA: false,
              status: 'pending',
              regulationId: 'reg-mas-cyber-2026',
              sourceCategory: 'banking_prudential_regulator',
              sourceUrl: 'https://www.mas.gov.sg/regulation/notices/notice-658',
              subScopeId: 'sub-mas-banking',
            },
          ];

          mockStore.priorityAlerts = [...crawledAlerts, ...mockStore.priorityAlerts];
          return {
            success: true,
            count: crawledAlerts.length,
            newAlerts: crawledAlerts,
          };
        }
      );

      return {
        success: Boolean(res.data?.success),
        count: res.data?.count ?? (res.data?.newAlerts ? res.data.newAlerts.length : 0),
        newAlerts: res.data?.newAlerts || [],
      };
    },
  },

  // ----------------------------------------
  // Regulatory Scope & Monitor Configuration
  // ----------------------------------------
  scope: {
    async getRegulatorsInScope(): Promise<RegulatorInScope[]> {
      // First attempt live backend endpoint: /regulatory/sources
      let res = await request<any>(
        '/regulatory/sources',
        { method: 'GET' },
        () => null
      );

      if (res.isFallback || !res.data) {
        res = await request<any>(
          '/scope/regulators',
          { method: 'GET' },
          () => mockStore.regulatorsInScope
        );
      }

      // If the backend returns the raw sources catalog wrapped in { catalog_id, sources: [...] }
      if (res.data && Array.isArray(res.data.sources)) {
        return adaptBackendCatalogToRegulators(res.data as RawBackendSourceCatalogResponse);
      }

      if (Array.isArray(res.data)) {
        // If the backend returns raw source items with activation_state / onboarding_route
        if (res.data.length > 0 && (res.data[0].activation_state || res.data[0].onboarding_route || res.data[0].source_id)) {
          return adaptBackendCatalogToRegulators(res.data);
        }

        return res.data.map((item) => {
          // If the backend returns raw rows matching the Excel global_source_registry schema
          if (item['Authority Name'] || item['Authority Abbreviation'] || item.authority_name) {
            return mapSourceRegistryRowToRegulator(item);
          }
          return item as RegulatorInScope;
        });
      }
      return [...mockStore.regulatorsInScope];
    },

    async toggleFollow(id: string, isFollowed: boolean): Promise<RegulatorInScope> {
      const res = await request<RegulatorInScope>(
        `/scope/regulators/${encodeURIComponent(id)}/follow`,
        {
          method: 'PATCH',
          body: JSON.stringify({ isFollowed }),
        },
        () => {
          const targetId = id.toLowerCase();
          const reg = mockStore.regulatorsInScope.find(
            (r) =>
              r.id.toLowerCase() === targetId ||
              r.acronym.toLowerCase() === targetId ||
              r.name.toLowerCase() === targetId
          );
          if (!reg) throw new Error(`Regulator ${id} not found`);
          reg.isFollowed = isFollowed;
          return reg;
        }
      );
      return res.data;
    },

    async updateCadence(id: string, cadence: RegulatorInScope['cadence']): Promise<RegulatorInScope> {
      const res = await request<RegulatorInScope>(
        `/scope/regulators/${encodeURIComponent(id)}/cadence`,
        {
          method: 'PATCH',
          body: JSON.stringify({ cadence }),
        },
        () => {
          const targetId = id.toLowerCase();
          const reg = mockStore.regulatorsInScope.find(
            (r) =>
              r.id.toLowerCase() === targetId ||
              r.acronym.toLowerCase() === targetId ||
              r.name.toLowerCase() === targetId
          );
          if (!reg) throw new Error(`Regulator ${id} not found`);
          reg.cadence = cadence;
          return reg;
        }
      );
      return res.data;
    },

    async saveOnboardingProfile(payload: ScopeUpdatePayload): Promise<{ success: boolean; message: string }> {
      const res = await request<{ success: boolean; message: string }>(
        '/scope/onboarding',
        {
          method: 'POST',
          body: JSON.stringify(payload),
        },
        () => {
          // Update mock regulators following status based on selection
          const selectedSet = new Set(payload.selectedRegulatorIds);
          mockStore.regulatorsInScope.forEach((r) => {
            if (selectedSet.has(r.id)) {
              r.isFollowed = true;
            }
          });
          return {
            success: true,
            message: `Profile saved successfully with ${payload.selectedRegulatorIds.length} regulators in scope.`,
          };
        }
      );
      return res.data;
    },
  },

  // ----------------------------------------
  // Global Directory & Historical Repository
  // ----------------------------------------
  directory: {
    async list(params: RegulationQueryParams = {}): Promise<PaginatedResult<RegulatoryDirectoryItem>> {
      const query = new URLSearchParams();
      if (params.page) query.set('page', String(params.page));
      if (params.limit) query.set('limit', String(params.limit));
      if (params.search) query.set('search', params.search);
      if (params.jurisdiction && params.jurisdiction !== 'All') query.set('jurisdiction', params.jurisdiction);
      if (params.category && params.category !== 'All') query.set('category', params.category);

      const qs = query.toString() ? `?${query.toString()}` : '';

      // Normalize any raw backend document / regulation into standard RegulatoryDirectoryItem
      const normalizeDoc = (item: any, idx: number): RegulatoryDirectoryItem => {
        if (item.docType && (item.status === 'Following' || item.status === 'None')) {
          return item as RegulatoryDirectoryItem;
        }
        if (item.docType) {
          return {
            ...item,
            status: item.status || 'None',
            whyRelevantExplanation: item.whyRelevantExplanation || item.executiveSummary,
            aiRelevanceTier: item.aiRelevanceTier || (item.materiality?.includes('Direct') ? 'High' : 'Med'),
          };
        }
        // Raw crawler / monitor feed item
        const id = item.id || `doc-crawled-${item.source_id || idx}-${Date.now()}`;
        return {
          id,
          title: item.title || item.name || 'Official Regulatory Notice',
          referenceNumber: item.referenceNumber || item.reference_number || `REF-${item.source_id || 'REG'}-${idx + 1}`,
          docType: item.docType || item.document_type || 'Circular',
          regulator: item.regulator || item['Authority Name'] || item.source_label || 'Supervisory Authority',
          regulatorAcronym: (item.regulatorAcronym || item['Authority Abbreviation'] || item.source_id || 'REG').toUpperCase(),
          jurisdiction: item.jurisdiction || item['Jurisdiction'] || 'Hong Kong',
          category: item.category || 'Financial Services & Capital Markets',
          themes: item.themes || [item.regulatory_domain || 'Supervisory Governance'],
          publishDate: item.publishDate || item.publication_date || new Date().toISOString().slice(0, 10),
          effectiveDate: item.effectiveDate || item.effective_date || item.publication_date || new Date().toISOString().slice(0, 10),
          aiRelevanceScore: item.aiRelevanceScore || 90,
          materiality: item.materiality || 'Relevant',
          diligenceStatus: item.diligenceStatus || 'None',
          status: 'None',
          owner: item.owner || 'Compliance Lead',
          officialUrl: item.officialUrl || item.official_url || item.url || '',
          executiveSummary: item.executiveSummary || item.summary || 'Official regulatory release cataloged by surveillance engine.',
          operationalImpact: item.operationalImpact || 'Supervisory guidance requiring evaluation.',
          affectedBusinessUnits: item.affectedBusinessUnits || ['Compliance', 'Risk Management'],
          authenticExcerpt: item.authenticExcerpt || item.summary || '',
          auditTimeline: item.auditTimeline || [],
          whyRelevantExplanation: item.whyRelevantExplanation || item.summary || '',
          aiRelevanceTier: 'High',
        };
      };

      // Candidate live backend endpoints to query for historical documents and crawled releases
      const candidateEndpoints = [
        `/directory${qs}`,
        `/regulatory/documents${qs}`,
        `/regulatory/updates/all${qs}`,
        `/regulatory/updates${qs}`,
        `/regulations${qs}`,
      ];

      let liveItems: RegulatoryDirectoryItem[] | null = null;
      let liveTotal = 0;

      for (const ep of candidateEndpoints) {
        const res = await request<any>(ep, { method: 'GET' }, () => null);
        if (!res.isFallback && res.data) {
          const rawData = res.data;
          let rawList: any[] = [];
          if (Array.isArray(rawData)) {
            rawList = rawData;
          } else if (Array.isArray(rawData.items)) {
            rawList = rawData.items;
          } else if (Array.isArray(rawData.documents)) {
            rawList = rawData.documents;
          } else if (Array.isArray(rawData.regulations)) {
            rawList = rawData.regulations;
          } else if (Array.isArray(rawData.updates)) {
            rawList = rawData.updates;
          } else if (Array.isArray(rawData.data)) {
            rawList = rawData.data;
          }

          if (rawList.length > 0) {
            liveItems = rawList.map((item, idx) => normalizeDoc(item, idx));
            liveTotal = rawData.total || liveItems.length;
            break;
          }
        }
        if (!isBackendReachable) {
          break;
        }
      }

      // If backend returned live records, synchronize with mockStore and filter
      if (liveItems && liveItems.length > 0) {
        const existingIds = new Set(mockStore.directoryItems.map((d) => d.id.toLowerCase()));
        for (const item of liveItems) {
          if (!existingIds.has(item.id.toLowerCase())) {
            mockStore.directoryItems.unshift(item);
            existingIds.add(item.id.toLowerCase());
          }
        }

        let filtered = liveItems;
        if (params.search) {
          const q = params.search.toLowerCase();
          filtered = filtered.filter(
            (d) =>
              d.title.toLowerCase().includes(q) ||
              d.referenceNumber.toLowerCase().includes(q) ||
              d.regulator.toLowerCase().includes(q) ||
              (d.executiveSummary && d.executiveSummary.toLowerCase().includes(q))
          );
        }
        if (params.jurisdiction && params.jurisdiction !== 'All') {
          filtered = filtered.filter((d) => d.jurisdiction === params.jurisdiction);
        }
        if (params.category && params.category !== 'All') {
          filtered = filtered.filter((d) => d.category === params.category);
        }

        const page = params.page || 1;
        const limit = params.limit || 50;
        const total = filtered.length;
        const totalPages = Math.ceil(total / limit) || 1;
        const start = (page - 1) * limit;

        return {
          items: filtered.slice(start, start + limit),
          total,
          page,
          limit,
          totalPages,
        };
      }

      // In-Memory Fallback store (comprehensive catalog across all jurisdictions)
      let list = [...mockStore.directoryItems];
      if (params.search) {
        const q = params.search.toLowerCase();
        list = list.filter(
          (d) =>
            d.title.toLowerCase().includes(q) ||
            d.referenceNumber.toLowerCase().includes(q) ||
            d.regulator.toLowerCase().includes(q) ||
            (d.executiveSummary && d.executiveSummary.toLowerCase().includes(q))
        );
      }
      if (params.jurisdiction && params.jurisdiction !== 'All') {
        list = list.filter((d) => d.jurisdiction === params.jurisdiction);
      }
      if (params.category && params.category !== 'All') {
        list = list.filter((d) => d.category === params.category);
      }

      const page = params.page || 1;
      const limit = params.limit || 50;
      const total = list.length;
      const totalPages = Math.ceil(total / limit) || 1;
      const start = (page - 1) * limit;
      const items = list.slice(start, start + limit);

      return { items, total, page, limit, totalPages };
    },

    async getDiligenceProjects(): Promise<DiligenceProject[]> {
      const res = await request<DiligenceProject[]>(
        '/directory/projects',
        { method: 'GET' },
        () => mockStore.diligenceProjects
      );
      return res.data;
    },
  },

  // ----------------------------------------
  // Compliance Frameworks & Matrix Sessions
  // ----------------------------------------
  frameworks: {
    async list(): Promise<FrameworkCardData[]> {
      const res = await request<FrameworkCardData[]>(
        '/frameworks',
        { method: 'GET' },
        () => mockStore.frameworkCards
      );
      return res.data;
    },
  },

  matrix: {
    async listSessions(): Promise<MatrixSessionState[]> {
      const res = await request<MatrixSessionState[]>(
        '/matrix/sessions',
        { method: 'GET' },
        () => mockStore.matrixSessions
      );
      return res.data;
    },

    async saveSession(session: MatrixSessionState): Promise<MatrixSessionState> {
      const res = await request<MatrixSessionState>(
        '/matrix/sessions',
        {
          method: 'POST',
          body: JSON.stringify(session),
        },
        () => {
          const idx = mockStore.matrixSessions.findIndex((s) => s.sessionId === session.sessionId);
          if (idx >= 0) {
            mockStore.matrixSessions[idx] = session;
          } else {
            mockStore.matrixSessions.unshift(session);
          }
          return session;
        }
      );
      return res.data;
    },
  },

  // ----------------------------------------
  // Direct Raw Backend Ingestion Utilities
  // ----------------------------------------
  overview: {
    /**
     * Queries the aggregated regulatory overview from backend
     */
    async getOverview(): Promise<any> {
      const res = await request<any>(
        '/regulatory/overview',
        { method: 'GET' },
        () => ({
          sourcesCount: mockStore.regulatorsInScope.length,
          alertsCount: mockStore.priorityAlerts.length,
          regulationsCount: mockStore.regulations.length,
          status: 'healthy',
        })
      );
      return res.data;
    },
  },

  ingest: {
    /**
     * Ingests a raw Hong Kong source catalog JSON directly into the in-memory scope store.
     */
    ingestSourceCatalog(catalogData: RawBackendSourceCatalogResponse | RawBackendSourceCatalogItem[]): RegulatorInScope[] {
      const adapted = adaptBackendCatalogToRegulators(catalogData);
      mockStore.regulatorsInScope = adapted;
      return adapted;
    },

    /**
     * Ingests a raw Hong Kong monitor feed update JSON directly into alerts & regulations store.
     */
    ingestMonitorFeed(feedData: RawBackendMonitorFeedResponse | RawBackendMonitorFeedItem[]): IngestedMonitorFeedResult {
      const result = adaptBackendMonitorFeed(feedData);
      mockStore.priorityAlerts = [...result.alerts, ...mockStore.priorityAlerts];
      mockStore.regulations = [...result.regulations, ...mockStore.regulations];

      // Automatically sync newly crawled items into directory master repository
      const existingDirIds = new Set(mockStore.directoryItems.map((d) => d.id.toLowerCase()));
      for (const reg of result.regulations) {
        if (!existingDirIds.has(reg.id.toLowerCase())) {
          mockStore.directoryItems.unshift({
            ...reg,
            status: 'None',
            whyRelevantExplanation: reg.whyRelevantExplanation || reg.executiveSummary,
            aiRelevanceTier: reg.materiality === 'Direct / Highly Relevant' ? 'High' : 'Med',
          });
          existingDirIds.add(reg.id.toLowerCase());
        }
      }

      return result;
    },
  },
};

export default api;
