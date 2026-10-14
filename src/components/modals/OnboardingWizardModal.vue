<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import {
  DialogRoot,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from 'radix-vue';
import {
  Sparkles,
  Check,
  CheckCircle2,
  Building2,
  Globe,
  ArrowRight,
  ArrowLeft,
  X,
  Plus,
  SlidersHorizontal,
  Star,
  ChevronDown,
  ChevronUp,
  Loader2,
  ShieldCheck,
  Search,
  CheckCheck,
  Tag,
  Zap,
  Layers,
} from 'lucide-vue-next';
import { useWizardStore } from '@/stores/wizardStore';
import type { RegulatorInScope } from '@/types';

const wizardStore = useWizardStore();

const props = withDefaults(
  defineProps<{
    isOpen?: boolean;
    existingRegulators?: RegulatorInScope[];
  }>(),
  {
    isOpen: false,
    existingRegulators: () => [],
  }
);

const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'complete', payload: { followedRegulatorIds: string[]; selectedMarkets: string[] }): void;
}>();

// ==================== REGION GROUPED MARKETS ====================
interface MarketCountry {
  name: string;
  code: string;
  flag: string;
  region: 'APAC' | 'EMEA' | 'Americas';
}

const ALL_MARKETS: MarketCountry[] = [
  // APAC
  { name: 'Hong Kong', code: 'HK', flag: '🇭🇰', region: 'APAC' },
  { name: 'Singapore', code: 'SG', flag: '🇸🇬', region: 'APAC' },
  { name: 'China', code: 'CN', flag: '🇨🇳', region: 'APAC' },
  { name: 'Japan', code: 'JP', flag: '🇯🇵', region: 'APAC' },
  { name: 'South Korea', code: 'KR', flag: '🇰🇷', region: 'APAC' },
  { name: 'Australia', code: 'AU', flag: '🇦🇺', region: 'APAC' },
  { name: 'New Zealand', code: 'NZ', flag: '🇳🇿', region: 'APAC' },
  { name: 'India', code: 'IN', flag: '🇮🇳', region: 'APAC' },
  { name: 'Indonesia', code: 'ID', flag: '🇮🇩', region: 'APAC' },
  { name: 'Malaysia', code: 'MY', flag: '🇲🇾', region: 'APAC' },
  { name: 'Vietnam', code: 'VN', flag: '🇻🇳', region: 'APAC' },
  { name: 'Philippines', code: 'PH', flag: '🇵🇭', region: 'APAC' },
  { name: 'Thailand', code: 'TH', flag: '🇹🇭', region: 'APAC' },
  // EMEA
  { name: 'United Kingdom', code: 'GB', flag: '🇬🇧', region: 'EMEA' },
  { name: 'European Union', code: 'EU', flag: '🇪🇺', region: 'EMEA' },
  { name: 'Germany', code: 'DE', flag: '🇩🇪', region: 'EMEA' },
  { name: 'France', code: 'FR', flag: '🇫🇷', region: 'EMEA' },
  { name: 'Switzerland', code: 'CH', flag: '🇨🇭', region: 'EMEA' },
  { name: 'Netherlands', code: 'NL', flag: '🇳🇱', region: 'EMEA' },
  { name: 'Ireland', code: 'IE', flag: '🇮🇪', region: 'EMEA' },
  { name: 'Italy', code: 'IT', flag: '🇮🇹', region: 'EMEA' },
  { name: 'Spain', code: 'ES', flag: '🇪🇸', region: 'EMEA' },
  { name: 'Sweden', code: 'SE', flag: '🇸🇪', region: 'EMEA' },
  { name: 'Austria', code: 'AT', flag: '🇦🇹', region: 'EMEA' },
  { name: 'Belgium', code: 'BE', flag: '🇧🇪', region: 'EMEA' },
  { name: 'United Arab Emirates', code: 'AE', flag: '🇦🇪', region: 'EMEA' },
  { name: 'Saudi Arabia', code: 'SA', flag: '🇸🇦', region: 'EMEA' },
  { name: 'Israel', code: 'IL', flag: '🇮🇱', region: 'EMEA' },
  { name: 'South Africa', code: 'ZA', flag: '🇿🇦', region: 'EMEA' },
  // Americas
  { name: 'United States', code: 'US', flag: '🇺🇸', region: 'Americas' },
  { name: 'Canada', code: 'CA', flag: '🇨🇦', region: 'Americas' },
  { name: 'Mexico', code: 'MX', flag: '🇲🇽', region: 'Americas' },
  { name: 'Brazil', code: 'BR', flag: '🇧🇷', region: 'Americas' },
];

const REGION_TABS = ['All', 'APAC', 'EMEA', 'Americas'] as const;
const activeRegionTab = ref<(typeof REGION_TABS)[number]>('All');
const marketSearchQuery = ref('');

// ==================== STEP 1 & 2 INPUTS STATE ====================
// 1. Freeform Business Narrative (Step 1)
const localCompanyBusiness = ref(wizardStore.companyBusiness || '');

// 2. Freeform Regulatory Focus Narrative (Step 1)
const localRegulatoryFocus = ref(wizardStore.regulatoryFocus || '');

// Target Operating Jurisdictions (Step 2)
const localSelectedMarkets = ref<string[]>(
  wizardStore.selectedMarkets && wizardStore.selectedMarkets.length > 0
    ? [...wizardStore.selectedMarkets]
    : ['Hong Kong', 'Singapore']
);

// Synchronize with store
watch(
  () => wizardStore.companyBusiness,
  (val) => {
    if (val && !localCompanyBusiness.value) localCompanyBusiness.value = val;
  }
);
watch(
  () => wizardStore.regulatoryFocus,
  (val) => {
    if (val && !localRegulatoryFocus.value) localRegulatoryFocus.value = val;
  }
);

// Filtered Markets for Compact Chips Grid
const filteredMarkets = computed(() => {
  let list = ALL_MARKETS;
  if (activeRegionTab.value !== 'All') {
    list = list.filter((m) => m.region === activeRegionTab.value);
  }
  if (marketSearchQuery.value.trim()) {
    const q = marketSearchQuery.value.toLowerCase().trim();
    list = list.filter((m) => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q));
  }
  return list;
});

const toggleMarket = (marketName: string) => {
  if (localSelectedMarkets.value.includes(marketName)) {
    localSelectedMarkets.value = localSelectedMarkets.value.filter((m) => m !== marketName);
  } else {
    localSelectedMarkets.value.push(marketName);
  }
};

const selectAllInTab = (region: string) => {
  let targetMarkets: string[] = [];
  if (region === 'All') {
    targetMarkets = ALL_MARKETS.map((m) => m.name);
  } else {
    targetMarkets = ALL_MARKETS.filter((m) => m.region === region).map((m) => m.name);
  }
  const currentSet = new Set(localSelectedMarkets.value);
  targetMarkets.forEach((m) => currentSet.add(m));
  localSelectedMarkets.value = Array.from(currentSet);
};

const deselectAllInTab = (region: string) => {
  let targetMarkets: Set<string>;
  if (region === 'All') {
    targetMarkets = new Set(ALL_MARKETS.map((m) => m.name));
  } else {
    targetMarkets = new Set(
      ALL_MARKETS.filter((m) => m.region === region).map((m) => m.name)
    );
  }
  localSelectedMarkets.value = localSelectedMarkets.value.filter((m) => !targetMarkets.has(m));
};

const selectQuickMarketBundle = (bundle: 'apac' | 'west' | 'global') => {
  if (bundle === 'apac') {
    localSelectedMarkets.value = Array.from(
      new Set([...localSelectedMarkets.value, 'Hong Kong', 'Singapore'])
    );
  } else if (bundle === 'west') {
    localSelectedMarkets.value = Array.from(
      new Set([...localSelectedMarkets.value, 'United States', 'United Kingdom', 'European Union'])
    );
  } else if (bundle === 'global') {
    localSelectedMarkets.value = [
      'Hong Kong',
      'Singapore',
      'United States',
      'United Kingdom',
      'European Union',
      'Australia',
      'Japan',
      'Switzerland',
    ];
  }
};

// ==================== SUGGESTED REGULATORS CATALOG (ALL 23 AUTHORITIES) ====================
export interface SuggestedRegulator {
  id: string;
  name: string;
  acronym: string;
  jurisdiction: string;
  region: 'Hong Kong' | 'Singapore' | 'United States' | 'United Kingdom' | 'European Union' | 'Global / Other';
  flag: string;
  category: string;
  reason: string;
  keyThemes: string[];
  isHighRelevance?: boolean;
}

const ALL_REGULATORS: SuggestedRegulator[] = [
  {
    id: 'regl-001',
    name: 'Hong Kong Monetary Authority',
    acronym: 'HKMA',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Banking & Macroprudential',
    reason: 'Crucial for AI model governance (SPM AI-1), customer data isolation, and statutory banking supervision.',
    keyThemes: ['AI Governance', 'Operational Resilience', 'AML/CFT'],
    isHighRelevance: true,
  },
  {
    id: 'regl-002',
    name: 'Securities and Futures Commission',
    acronym: 'SFC',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Securities & Derivatives',
    reason: 'Primary regulator for algorithmic trading, client asset segregation, and virtual asset trading platforms (VATP).',
    keyThemes: ['Market Conduct', 'Client Protection', 'Crypto VASP'],
    isHighRelevance: true,
  },
  {
    id: 'regl-003',
    name: 'Monetary Authority of Singapore',
    acronym: 'MAS',
    jurisdiction: 'Singapore',
    region: 'Singapore',
    flag: '🇸🇬',
    category: 'Integrated Banking & Capital Markets',
    reason: 'High surveillance priority for FinTech sandboxes, cross-border payment mandates, and FEAT principles.',
    keyThemes: ['FinTech Licensing', 'Cyber Resilience', 'Prudential Standards'],
    isHighRelevance: true,
  },
  {
    id: 'regl-004',
    name: 'Financial Conduct Authority',
    acronym: 'FCA',
    jurisdiction: 'United Kingdom',
    region: 'United Kingdom',
    flag: '🇬🇧',
    category: 'Market Conduct & Consumer Oversight',
    reason: 'Essential for Consumer Duty compliance, operational vulnerability tolerances, and systemic audit access.',
    keyThemes: ['Consumer Duty', 'Vendor Outsourcing', 'Operational Resilience'],
    isHighRelevance: true,
  },
  {
    id: 'regl-005',
    name: 'Securities and Exchange Commission',
    acronym: 'SEC',
    jurisdiction: 'United States',
    region: 'United States',
    flag: '🇺🇸',
    category: 'Securities & Capital Markets',
    reason: 'Key enforcement tracker for public climate disclosures, cybersecurity incident 4-day filing, and digital assets.',
    keyThemes: ['Disclosure Rules', 'Cyber Incident SLA', 'Securities'],
    isHighRelevance: true,
  },
  {
    id: 'regl-007',
    name: 'Privacy Commissioner for Personal Data',
    acronym: 'PCPD',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Data, AML & Integrity',
    reason: 'Ethical application of AI models, personal data privacy principles, and cross-border data transfer security.',
    keyThemes: ['Data Privacy', 'AI Ethics', 'Cross-Border Data'],
    isHighRelevance: true,
  },
  {
    id: 'regl-012',
    name: 'European Banking Authority',
    acronym: 'EBA',
    jurisdiction: 'European Union',
    region: 'European Union',
    flag: '🇪🇺',
    category: 'Banking & Prudential Supervision',
    reason: 'Direct supervisory rulebook for EU DORA (Digital Operational Resilience Act), ICT incident reporting, and prudential capital.',
    keyThemes: ['EU DORA', 'ICT Risk', 'Prudential Standards'],
    isHighRelevance: true,
  },
  {
    id: 'regl-014',
    name: 'Federal Reserve Board',
    acronym: 'Fed',
    jurisdiction: 'United States',
    region: 'United States',
    flag: '🇺🇸',
    category: 'Central Banking & Systemic Oversight',
    reason: 'Macroprudential bank holding supervision, synthetic identity fraud surveillance, and payment system rules.',
    keyThemes: ['Systemic Risk', 'Payment Rails', 'Bank Supervision'],
    isHighRelevance: true,
  },
  {
    id: 'regl-015',
    name: 'Prudential Regulation Authority',
    acronym: 'PRA',
    jurisdiction: 'United Kingdom',
    region: 'United Kingdom',
    flag: '🇬🇧',
    category: 'Prudential Capital & Solvency',
    reason: 'Critical third-party supplier concentration rules, Basel capital adequacy, and MREL loss-absorbing buffers.',
    keyThemes: ['Prudential Buffer', 'Critical Suppliers', 'Capital Adequacy'],
    isHighRelevance: true,
  },
  {
    id: 'regl-016',
    name: 'Federal Financial Supervisory Authority',
    acronym: 'BaFin',
    jurisdiction: 'Germany / EU',
    region: 'European Union',
    flag: '🇪🇺',
    category: 'Banking, Securities & Insurance',
    reason: 'Comprehensive supervisory enforcement across EU banking, insurance, IT governance, and digital asset markets.',
    keyThemes: ['EU DORA', 'IT Governance', 'Sustainable Finance'],
    isHighRelevance: true,
  },
  {
    id: 'regl-017',
    name: 'Australian Securities and Investments Commission',
    acronym: 'ASIC',
    jurisdiction: 'Australia',
    region: 'Global / Other',
    flag: '🇦🇺',
    category: 'Securities & Market Integrity',
    reason: 'Enforces market integrity, consumer credit codes, and digital asset regulatory sandboxes in Australia.',
    keyThemes: ['Market Conduct', 'Crypto VASP', 'Client Protection'],
    isHighRelevance: true,
  },
  {
    id: 'regl-018',
    name: 'Australian Prudential Regulation Authority',
    acronym: 'APRA',
    jurisdiction: 'Australia',
    region: 'Global / Other',
    flag: '🇦🇺',
    category: 'Banking & Prudential Supervision',
    reason: 'Prudential supervision standards (CPS 234 Information Security, CPS 230 Operational Resilience).',
    keyThemes: ['Operational Resilience', 'ICT Risk', 'Prudential Standards'],
    isHighRelevance: false,
  },
  {
    id: 'regl-019',
    name: 'Financial Services Agency',
    acronym: 'JFSA',
    jurisdiction: 'Japan',
    region: 'Global / Other',
    flag: '🇯🇵',
    category: 'Banking, Securities & Insurance',
    reason: 'Comprehensive supervision of Japanese financial institutions, Payment Services Act, and crypto asset custody.',
    keyThemes: ['Payment Rails', 'Crypto VASP', 'FinTech Licensing'],
    isHighRelevance: false,
  },
  {
    id: 'regl-020',
    name: "People's Bank of China",
    acronym: 'PBOC',
    jurisdiction: 'China',
    region: 'Global / Other',
    flag: '🇨🇳',
    category: 'Central Banking & Macroprudential',
    reason: 'Cross-border RMB clearing, systemic risk surveillance, and financial institution cybersecurity.',
    keyThemes: ['Cross-Border Data', 'AML/CFT', 'Prudential Standards'],
    isHighRelevance: false,
  },
  {
    id: 'regl-021',
    name: 'Swiss Financial Market Supervisory Authority',
    acronym: 'FINMA',
    jurisdiction: 'Switzerland',
    region: 'Global / Other',
    flag: '🇨🇭',
    category: 'Banking & Securities Supervision',
    reason: 'Prudential supervision, anti-money laundering enforcement, and DLT / blockchain licensing guidance.',
    keyThemes: ['AML/CFT', 'Crypto VASP', 'Operational Resilience'],
    isHighRelevance: false,
  },
  {
    id: 'regl-022',
    name: 'Dubai Financial Services Authority',
    acronym: 'DFSA',
    jurisdiction: 'United Arab Emirates',
    region: 'Global / Other',
    flag: '🇦🇪',
    category: 'Financial Services & Capital Markets',
    reason: 'DIFC independent financial regulatory regime, crypto token regulations, and cross-border commercial supervision.',
    keyThemes: ['Crypto VASP', 'Market Conduct', 'FinTech Licensing'],
    isHighRelevance: false,
  },
  {
    id: 'regl-023',
    name: 'Financial Action Task Force',
    acronym: 'FATF',
    jurisdiction: 'International',
    region: 'Global / Other',
    flag: '🌐',
    category: 'Compliance, Risk & Enforcement',
    reason: 'Global AML/CFT recommendations, Travel Rule enforcement, and virtual asset service provider standards.',
    keyThemes: ['AML/CFT', 'Travel Rule', 'Sanctions'],
    isHighRelevance: true,
  },
  {
    id: 'regl-006',
    name: 'Companies Registry',
    acronym: 'CR',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Corporate Registration & Governance',
    reason: 'Statutory registers, beneficial ownership disclosures, and corporate governance filing transparency.',
    keyThemes: ['Corporate Governance', 'Beneficial Ownership', 'Statutory Filing'],
    isHighRelevance: false,
  },
  {
    id: 'regl-008',
    name: 'Insurance Authority',
    acronym: 'IA',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Insurance & Pensions',
    reason: 'Enterprise risk management (GL21), risk-based capital standards, and cybersecurity in insurance.',
    keyThemes: ['Enterprise Risk', 'Solvency Margin', 'InsurTech'],
    isHighRelevance: false,
  },
  {
    id: 'regl-009',
    name: 'Inland Revenue Department',
    acronym: 'IRD',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Tax & Business Filing',
    reason: 'Automatic Exchange of Financial Account Information (AEOI/CRS), FATCA compliance, and transfer pricing.',
    keyThemes: ['AEOI / CRS', 'Tax Compliance', 'Financial Accounts'],
    isHighRelevance: false,
  },
  {
    id: 'regl-010',
    name: 'Competition Commission',
    acronym: 'HKCC',
    jurisdiction: 'Hong Kong',
    region: 'Hong Kong',
    flag: '🇭🇰',
    category: 'Competition & Consumer Protection',
    reason: 'Algorithmic pricing collusion, digital platform competition oversight, and market conduct antitrust enforcement.',
    keyThemes: ['Competition Law', 'Algorithmic Pricing', 'Market Conduct'],
    isHighRelevance: false,
  },
  {
    id: 'regl-011',
    name: 'Accounting and Corporate Regulatory Authority',
    acronym: 'ACRA',
    jurisdiction: 'Singapore',
    region: 'Singapore',
    flag: '🇸🇬',
    category: 'Corporate Registration & Governance',
    reason: 'Mandatory climate reporting roadmaps, beneficial ownership registers, and statutory corporate filings.',
    keyThemes: ['Climate Reporting', 'Corporate Registers', 'Governance'],
    isHighRelevance: false,
  },
  {
    id: 'regl-013',
    name: 'International Organization for Standardization',
    acronym: 'ISO',
    jurisdiction: 'International',
    region: 'Global / Other',
    flag: '🌐',
    category: 'Telecoms, Media & Critical Infrastructure',
    reason: 'ISO/IEC 42001 Artificial Intelligence Management System (AIMS) and global information security audit standards.',
    keyThemes: ['ISO 42001 AI', 'Information Security', 'Global Standards'],
    isHighRelevance: false,
  },
];

// ==================== DYNAMIC HIGH-RELATION EVALUATION ====================
const checkRegulatorHighRelation = (r: SuggestedRegulator): boolean => {
  const selected = localSelectedMarkets.value;
  const businessLower = (localCompanyBusiness.value || '').toLowerCase();
  const focusLower = (localRegulatoryFocus.value || '').toLowerCase();
  const fullText = `${businessLower} ${focusLower}`;

  const jurLower = r.jurisdiction.toLowerCase();
  const regionLower = r.region.toLowerCase();

  const isJurSelected = selected.some((m) => {
    const ml = m.toLowerCase();
    return jurLower.includes(ml) || ml.includes(jurLower) || regionLower.includes(ml);
  });

  // If in user's selected markets, check tier-1 authorities
  if (isJurSelected) {
    const tier1Acronyms = [
      'HKMA', 'SFC', 'MAS', 'FCA', 'SEC', 'EBA', 'Fed', 'PRA', 'BaFin', 'ASIC', 'APRA', 'JFSA', 'PBOC', 'FINMA', 'DFSA'
    ];
    if (tier1Acronyms.includes(r.acronym)) return true;

    // PCPD in HK if data, privacy, AI or cyber is selected
    if (
      r.acronym === 'PCPD' &&
      (fullText.includes('data') ||
        fullText.includes('privacy') ||
        fullText.includes('ai') ||
        fullText.includes('cyber') ||
        fullText.includes('ethics') ||
        fullText.includes('personal'))
    ) {
      return true;
    }

    // ACRA in SG if governance, corporate or climate
    if (
      r.acronym === 'ACRA' &&
      (fullText.includes('climate') ||
        fullText.includes('governance') ||
        fullText.includes('corporate') ||
        fullText.includes('esg'))
    ) {
      return true;
    }
  }

  // International standards
  if (r.jurisdiction === 'International' || r.region === 'Global / Other') {
    if (
      r.acronym === 'FATF' &&
      (fullText.includes('aml') ||
        fullText.includes('sanction') ||
        fullText.includes('kyc') ||
        fullText.includes('laundering') ||
        fullText.includes('travel rule') ||
        fullText.includes('cft'))
    ) {
      return true;
    }
    if (
      r.acronym === 'ISO' &&
      (fullText.includes('ai') ||
        fullText.includes('iso') ||
        fullText.includes('cyber') ||
        fullText.includes('security') ||
        fullText.includes('standard') ||
        fullText.includes('42001'))
    ) {
      return true;
    }
  }

  // Cross-border theme triggers
  if (
    (fullText.includes('crypto') ||
      fullText.includes('virtual asset') ||
      fullText.includes('vasp') ||
      fullText.includes('token') ||
      fullText.includes('web3')) &&
    ['SFC', 'MAS', 'FINMA', 'ASIC', 'DFSA', 'SEC'].includes(r.acronym) &&
    (isJurSelected || ['SFC', 'MAS'].includes(r.acronym))
  ) {
    return true;
  }

  if (
    (fullText.includes('resilience') ||
      fullText.includes('dora') ||
      fullText.includes('incident') ||
      fullText.includes('outage') ||
      fullText.includes('bcp')) &&
    ['HKMA', 'EBA', 'PRA', 'APRA', 'FCA'].includes(r.acronym) &&
    (isJurSelected || ['HKMA', 'EBA'].includes(r.acronym))
  ) {
    return true;
  }

  return isJurSelected ? (r.isHighRelevance ?? false) : false;
};

// Evaluated Regulators Catalog with dynamic isHighRelation flag
const evaluatedRegulators = computed(() => {
  return ALL_REGULATORS.map((reg) => ({
    ...reg,
    isHighRelation: checkRegulatorHighRelation(reg),
  }));
});

// High-Relation Regulators (Recommended for User to Follow)
const highRelationRegulators = computed(() => {
  return evaluatedRegulators.value.filter((r) => r.isHighRelation);
});

// Dynamic Jurisdiction Filter Tabs in Step 2
const dynamicJurisdictionTabs = computed(() => {
  const base = [
    'All',
    'Hong Kong',
    'Singapore',
    'United States',
    'United Kingdom',
    'European Union',
    'Australia',
    'Japan',
    'China',
    'Switzerland',
    'United Arab Emirates',
    'International',
  ];
  const fromSelected = wizardStore.selectedMarkets.filter((m) => !base.includes(m));
  return [...base, ...fromSelected];
});

// Filtered catalog for Step 2 Search & Jurisdictions
const step2Catalog = computed(() => {
  return evaluatedRegulators.value.filter((r) => {
    if (wizardStore.selectedJurisdictionFilter !== 'All') {
      const target = wizardStore.selectedJurisdictionFilter.toLowerCase().trim();
      const matchJur =
        r.jurisdiction.toLowerCase() === target ||
        r.jurisdiction.toLowerCase().includes(target) ||
        target.includes(r.jurisdiction.toLowerCase());
      const matchRegion = r.region.toLowerCase() === target;
      if (!matchJur && !matchRegion) {
        return false;
      }
    }
    if (wizardStore.searchQuery.trim()) {
      const q = wizardStore.searchQuery.toLowerCase().trim();
      const match =
        r.name.toLowerCase().includes(q) ||
        r.acronym.toLowerCase().includes(q) ||
        r.jurisdiction.toLowerCase().includes(q) ||
        r.category.toLowerCase().includes(q) ||
        r.keyThemes.some((t) => t.toLowerCase().includes(q));
      if (!match) return false;
    }
    return true;
  });
});

// Followed count of High-Relation Regulators
const followedHighRelationCount = computed(() => {
  const highIds = new Set(highRelationRegulators.value.map((r) => r.id));
  return wizardStore.followedRegulatorIds.filter((id) => highIds.has(id)).length;
});

const isAllHighRelationFollowed = computed(() => {
  return (
    highRelationRegulators.value.length > 0 &&
    followedHighRelationCount.value === highRelationRegulators.value.length
  );
});

// Other available authorities that are NOT in High-Relation
const otherAvailableRegulators = computed(() => {
  return step2Catalog.value.filter((r) => !r.isHighRelation);
});

// Follow Actions
const handleToggleAllHighRelation = () => {
  const highIds = highRelationRegulators.value.map((r) => r.id);
  if (isAllHighRelationFollowed.value) {
    // Deselect all high relation
    const highSet = new Set(highIds);
    wizardStore.followedRegulatorIds = wizardStore.followedRegulatorIds.filter(
      (id) => !highSet.has(id)
    );
  } else {
    // Select all high relation
    wizardStore.followedRegulatorIds = Array.from(
      new Set([...wizardStore.followedRegulatorIds, ...highIds])
    );
  }
};

const handleClearAllFollowed = () => {
  wizardStore.followedRegulatorIds = [];
};

// ==================== 3-STEP WIZARD NAVIGATION HANDLERS ====================
// Step 1 -> Step 2
const handleProceedToStep2 = () => {
  wizardStore.companyBusiness = localCompanyBusiness.value;
  wizardStore.regulatoryFocus = localRegulatoryFocus.value;
  wizardStore.currentStep = 2;
};

// Step 2 -> Step 1
const handleBackToStep1 = () => {
  wizardStore.currentStep = 1;
};

// Step 2 -> Step 3 (Trigger AI Evaluation & Open Recommendations)
const handleConfirmStep2AndGenerate = () => {
  // Sync local inputs into store
  wizardStore.companyBusiness = localCompanyBusiness.value;
  wizardStore.regulatoryFocus = localRegulatoryFocus.value;
  wizardStore.selectedMarkets =
    localSelectedMarkets.value.length > 0
      ? [...localSelectedMarkets.value]
      : ['Hong Kong', 'Singapore'];

  // Calculate high relation IDs based on current inputs & selected markets
  const highIds = ALL_REGULATORS.filter((r) =>
    checkRegulatorHighRelation(r)
  ).map((r) => r.id);

  // Trigger store transition and pre-recommend all high-relation institutions
  wizardStore.confirmScopingAndOpenRecommendations(
    localCompanyBusiness.value,
    localRegulatoryFocus.value,
    localSelectedMarkets.value,
    highIds
  );
};

// Step 3 -> Step 2
const handleBackToStep2 = () => {
  wizardStore.currentStep = 2;
};

const handleFinishWizard = () => {
  emit('complete', {
    followedRegulatorIds: wizardStore.followedRegulatorIds,
    selectedMarkets: wizardStore.selectedMarkets,
  });
  wizardStore.finishWizard();
  emit('close');
};

const handleClose = () => {
  wizardStore.closeWizard();
  emit('close');
};
</script>

<template>
  <DialogRoot
    :open="wizardStore.isOpen || props.isOpen"
    @update:open="(val: boolean) => !val && handleClose()"
  >
    <DialogPortal>
      <DialogOverlay
        class="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      />

      <DialogContent
        class="fixed left-1/2 top-1/2 z-50 w-[96vw] max-w-6xl xl:max-w-7xl -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-neutral-200 bg-white p-5 sm:p-6 shadow-2xl duration-200 animate-in zoom-in-95 focus:outline-none max-h-[92vh] flex flex-col"
      >
        <!-- Modal Header -->
        <div class="flex items-start justify-between border-b border-neutral-100 pb-3 shrink-0">
          <div class="space-y-1">
            <div
              class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[11px] font-bold tracking-wide uppercase"
            >
              <Sparkles class="w-3.5 h-3.5 text-blue-600" />
              <span>Interactive Scoping Wizard &bull; 3-Step Guided Scope</span>
            </div>
            <DialogTitle class="text-lg sm:text-xl font-bold text-neutral-900 tracking-tight">
              {{
                wizardStore.currentStep === 1
                  ? 'Step 1: Institutional Profile & Regulatory Focus'
                  : wizardStore.currentStep === 2
                  ? 'Step 2: Target Operating Jurisdictions'
                  : 'Step 3: Recommended Supervisory Scope & Watchlist'
              }}
            </DialogTitle>
            <DialogDescription class="text-xs text-neutral-500">
              {{
                wizardStore.currentStep === 1
                  ? 'Specify your company core business operations and specific regulatory risk concerns without rigid templates.'
                  : wizardStore.currentStep === 2
                  ? 'Select primary operating corridors and supervisory jurisdictions where your entity maintains activities or compliance exposure.'
                  : 'Review recommended authorities tailored to your institutional profile. Confirm selections to activate real-time supervisory surveillance.'
              }}
            </DialogDescription>
          </div>

          <DialogClose
            @click="handleClose"
            class="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer"
            title="Close / Run in Background"
          >
            <X class="w-4 h-4" />
            <span class="sr-only">Close</span>
          </DialogClose>
        </div>

        <!-- 3-Step Stepper -->
        <div class="py-2.5 border-b border-neutral-100 shrink-0">
          <div class="flex items-center justify-between relative max-w-xl mx-auto">
            <div class="absolute left-8 right-8 top-3.5 -translate-y-1/2 h-0.5 bg-neutral-200 -z-0" />
            <div
              class="absolute left-8 top-3.5 -translate-y-1/2 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
              :style="{
                width: wizardStore.currentStep === 1 ? '0%' : wizardStore.currentStep === 2 ? '50%' : '100%'
              }"
            />

            <!-- Step 1 Tab -->
            <div
              @click="wizardStore.currentStep = 1"
              class="relative z-10 flex flex-col items-center gap-1 cursor-pointer select-none"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs"
                :class="
                  wizardStore.currentStep > 1
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-600 text-white ring-4 ring-blue-100'
                "
              >
                <Check v-if="wizardStore.currentStep > 1" class="w-3.5 h-3.5 stroke-[3]" />
                <span v-else>1</span>
              </div>
              <span
                class="text-[11px] font-semibold"
                :class="wizardStore.currentStep === 1 ? 'text-blue-700 font-bold' : 'text-neutral-700'"
              >
                1. Profile & Focus
              </span>
            </div>

            <!-- Step 2 Tab -->
            <div
              @click="wizardStore.currentStep = 2"
              class="relative z-10 flex flex-col items-center gap-1 cursor-pointer select-none"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs"
                :class="
                  wizardStore.currentStep > 2
                    ? 'bg-blue-600 text-white'
                    : wizardStore.currentStep === 2
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : 'bg-neutral-100 text-neutral-500 border border-neutral-300'
                "
              >
                <Check v-if="wizardStore.currentStep > 2" class="w-3.5 h-3.5 stroke-[3]" />
                <span v-else>2</span>
              </div>
              <span
                class="text-[11px] font-semibold"
                :class="wizardStore.currentStep === 2 ? 'text-blue-700 font-bold' : 'text-neutral-600'"
              >
                2. Operating Jurisdictions
              </span>
            </div>

            <!-- Step 3 Tab -->
            <div
              @click="wizardStore.hasCompletedScoping || wizardStore.currentStep === 3 ? (wizardStore.currentStep = 3) : null"
              class="relative z-10 flex flex-col items-center gap-1 select-none"
              :class="wizardStore.hasCompletedScoping || wizardStore.currentStep === 3 ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'"
            >
              <div
                class="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all shadow-2xs"
                :class="
                  wizardStore.currentStep === 3
                    ? 'bg-blue-600 text-white ring-4 ring-blue-100'
                    : wizardStore.hasCompletedScoping
                    ? 'bg-emerald-600 text-white'
                    : 'bg-neutral-100 text-neutral-400 border border-neutral-300'
                "
              >
                <Check
                  v-if="wizardStore.hasCompletedScoping && wizardStore.currentStep !== 3"
                  class="w-3.5 h-3.5 stroke-[3]"
                />
                <span v-else>3</span>
              </div>
              <span
                class="text-[11px] font-semibold"
                :class="wizardStore.currentStep === 3 ? 'text-blue-700 font-bold' : 'text-neutral-400'"
              >
                3. Scope & Watchlist
              </span>
            </div>
          </div>
        </div>

        <!-- Modal Body Content -->
        <div class="flex-1 overflow-y-auto py-3 px-1 space-y-4 text-neutral-800">
          <!-- ==================== STEP 1: INSTITUTIONAL PROFILE & REGULATORY FOCUS ==================== -->
          <div v-if="wizardStore.currentStep === 1" class="space-y-4 max-w-4xl mx-auto">
            <!-- Informative Header Banner -->
            <div class="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start gap-3">
              <div class="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-2xs">
                <Building2 class="w-4 h-4" />
              </div>
              <div class="space-y-0.5 text-xs text-blue-950">
                <p class="font-bold">Step 1 of 3: Core Operations & Regulatory Risk Profile</p>
                <p class="text-blue-700/90 leading-relaxed">
                  Provide your organization's business model and specific compliance priorities. Tailored directly to your firm's operational boundary without preset archetypes or rigid compliance taxonomies.
                </p>
              </div>
            </div>

            <!-- 1. Freeform Business Operations Textarea Card -->
            <div class="p-5 bg-white border border-neutral-200 rounded-xl space-y-2.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    1
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      <Building2 class="w-4 h-4 text-blue-600" />
                      <span>Company Core Business & Operations</span>
                    </h4>
                    <p class="text-[11px] text-neutral-500">
                      Describe your operational domain, core financial or technological services, licensing status, operating model, and customer scale.
                    </p>
                  </div>
                </div>
                <span class="text-[11px] font-mono text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                  {{ localCompanyBusiness.length }} chars
                </span>
              </div>

              <textarea
                v-model="localCompanyBusiness"
                rows="5"
                placeholder="e.g., We are a cross-border digital financial services institution and virtual asset platform providing institutional custody, wealth management, automated clearing, and algorithmic execution across APAC and European corridors..."
                class="w-full p-3.5 bg-neutral-50/50 hover:bg-white focus:bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 leading-relaxed outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 placeholder:text-neutral-400 transition-all shadow-2xs resize-y"
              />

              <div class="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-0.5">
                <span class="font-medium text-neutral-500">Key Context:</span>
                <span>Entity structure, primary product lines (banking, fund distribution, OTC custody), licensing stage, and client types (B2B / institutional / retail).</span>
              </div>
            </div>

            <!-- 2. Freeform Regulatory Focus Narrative Textarea Card -->
            <div class="p-5 bg-white border border-neutral-200 rounded-xl space-y-2.5 shadow-2xs">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2.5">
                  <div class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                    2
                  </div>
                  <div>
                    <h4 class="text-sm font-bold text-neutral-900 flex items-center gap-1.5">
                      <ShieldCheck class="w-4 h-4 text-indigo-600" />
                      <span>Specific Regulatory Focus & Risk Concerns</span>
                    </h4>
                    <p class="text-[11px] text-neutral-500">
                      Specify institutional compliance constraints, statutory audit clauses, SLA notification requirements, or key supervisory risk areas.
                    </p>
                  </div>
                </div>
                <span class="text-[11px] font-mono text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded border border-neutral-200">
                  {{ localRegulatoryFocus.length }} chars
                </span>
              </div>

              <textarea
                v-model="localRegulatoryFocus"
                rows="5"
                placeholder="e.g., Mandatory operational resilience notification windows (HKMA SPM OR-2 / EU DORA), AI model governance (SPM AI-1), client asset segregation, multi-cloud vendor outsourcing clauses, and AML/CFT sanctions screening..."
                class="w-full p-3.5 bg-neutral-50/50 hover:bg-white focus:bg-white border border-neutral-300 rounded-xl text-xs text-neutral-900 leading-relaxed outline-none focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder:text-neutral-400 transition-all shadow-2xs resize-y"
              />

              <div class="flex items-center gap-1.5 text-[11px] text-neutral-400 pt-0.5">
                <span class="font-medium text-neutral-500">Key Regimes:</span>
                <span>Operational resilience SLAs, AI governance standards, cross-border data transfer, AML/CTF, and client asset segregation.</span>
              </div>
            </div>
          </div>

          <!-- ==================== STEP 2: TARGET OPERATING JURISDICTIONS ==================== -->
          <div v-else-if="wizardStore.currentStep === 2" class="space-y-4 max-w-5xl mx-auto">
            <!-- Informative Header Banner (Matching Step 1 styling) -->
            <div class="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl flex items-start justify-between gap-3 shadow-2xs">
              <div class="flex items-start gap-3">
                <div class="p-1.5 rounded-lg bg-blue-600 text-white shrink-0 mt-0.5 shadow-2xs">
                  <Globe class="w-4 h-4" />
                </div>
                <div class="space-y-0.5 text-xs text-blue-950">
                  <div class="flex items-center gap-2">
                    <span class="font-bold">Step 2 of 3: Target Operating Jurisdictions & Regulatory Corridors</span>
                  </div>
                  <p class="text-blue-700/90 leading-relaxed">
                    Select all jurisdictions where your entity maintains statutory entities, conducts regulated business, or has client exposure.
                  </p>
                </div>
              </div>

              <!-- Active Count Badge (Blue Pill) -->
              <div class="shrink-0">
                <span class="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200 shadow-2xs">
                  <Check class="w-3.5 h-3.5 text-blue-600" />
                  <span>{{ localSelectedMarkets.length }} Jurisdictions Selected</span>
                </span>
              </div>
            </div>

            <!-- Active Corridors Chips Bar (When jurisdictions are selected) -->
            <div
              v-if="localSelectedMarkets.length > 0"
              class="p-3 bg-white border border-neutral-200 rounded-xl flex flex-wrap gap-1.5 items-center shadow-2xs"
            >
              <span class="text-[11px] font-semibold text-neutral-500 shrink-0 mr-1">Active Corridors:</span>
              <span
                v-for="market in localSelectedMarkets"
                :key="market"
                class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-900 border border-blue-200"
              >
                <span>{{ ALL_MARKETS.find(m => m.name === market)?.flag || '🌐' }}</span>
                <span>{{ market }}</span>
                <button
                  type="button"
                  @click="toggleMarket(market)"
                  class="hover:text-red-600 cursor-pointer ml-0.5"
                  title="Remove"
                >
                  <X class="w-3 h-3" />
                </button>
              </span>
              <button
                type="button"
                @click="localSelectedMarkets = []"
                class="text-[11px] text-neutral-400 hover:text-neutral-700 underline cursor-pointer ml-1"
              >
                Clear All
              </button>
            </div>

            <!-- Region Tabs, Quick Bundles & Search Bar -->
            <div class="p-4 bg-white border border-neutral-200 rounded-xl space-y-3 shadow-2xs">
              <div class="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <!-- Region Tabs -->
                <div class="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
                  <button
                    v-for="tab in REGION_TABS"
                    :key="tab"
                    type="button"
                    @click="activeRegionTab = tab"
                    :class="`px-3 py-1 rounded-md text-xs font-bold transition-all cursor-pointer ${
                      activeRegionTab === tab
                        ? 'bg-blue-600 text-white shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                    }`"
                  >
                    {{ tab }}
                  </button>
                </div>

                <!-- Quick Corridor Presets (Clean Blue / Slate palette) -->
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span class="text-[11px] text-neutral-400 font-medium">Quick Bundles:</span>
                  <button
                    type="button"
                    @click="selectQuickMarketBundle('apac')"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    APAC Hub (HK, SG)
                  </button>
                  <button
                    type="button"
                    @click="selectQuickMarketBundle('west')"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    US & EU Corridors
                  </button>
                  <button
                    type="button"
                    @click="selectQuickMarketBundle('global')"
                    class="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Global Tier-1 (8 Mkts)
                  </button>
                </div>
              </div>

              <!-- Search Bar & Batch Select/Deselect -->
              <div class="flex items-center justify-between gap-3 pt-2 border-t border-neutral-100">
                <div class="relative flex-1">
                  <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    v-model="marketSearchQuery"
                    type="text"
                    placeholder="Search jurisdiction or country code (e.g. Australia, AU, Singapore, UK)..."
                    class="w-full pl-8 pr-7 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-neutral-800 outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all"
                  />
                  <button
                    v-if="marketSearchQuery"
                    @click="marketSearchQuery = ''"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
                  >
                    <X class="w-3 h-3" />
                  </button>
                </div>

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    @click="selectAllInTab(activeRegionTab)"
                    class="px-2.5 py-1 rounded-md text-xs font-semibold text-blue-600 hover:bg-blue-50 border border-blue-200 cursor-pointer transition-colors"
                  >
                    Select All {{ activeRegionTab === 'All' ? 'All' : activeRegionTab }}
                  </button>
                  <button
                    type="button"
                    @click="deselectAllInTab(activeRegionTab)"
                    class="px-2.5 py-1 rounded-md text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-slate-200 cursor-pointer transition-colors"
                  >
                    Clear {{ activeRegionTab === 'All' ? 'All' : activeRegionTab }}
                  </button>
                </div>
              </div>

              <!-- Jurisdictions Grid Cards -->
              <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1 max-h-72 overflow-y-auto p-1">
                <div
                  v-for="m in filteredMarkets"
                  :key="m.code"
                  @click="toggleMarket(m.name)"
                  :class="`p-2.5 rounded-xl text-left flex items-center justify-between gap-2 transition-all cursor-pointer select-none shadow-sm ${
                    localSelectedMarkets.includes(m.name)
                      ? 'bg-blue-50/40 border-2 border-blue-600 text-blue-950 font-semibold'
                      : 'bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 text-slate-700'
                  }`"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="text-xl shrink-0">{{ m.flag }}</span>
                    <div class="min-w-0">
                      <p class="text-xs truncate font-medium">{{ m.name }}</p>
                      <span class="text-[9px] text-neutral-400 font-mono">{{ m.code }} &bull; {{ m.region }}</span>
                    </div>
                  </div>

                  <!-- Blue circular checkmark for selected state -->
                  <div
                    class="w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-colors"
                    :class="localSelectedMarkets.includes(m.name) ? 'bg-blue-600 text-white' : 'bg-slate-100 text-transparent border border-slate-300'"
                  >
                    <Check class="w-3 h-3 stroke-[3]" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- ==================== STEP 3: RECOMMENDED SUPERVISORY SCOPE & WATCHLIST ==================== -->
          <div v-else-if="wizardStore.currentStep === 3" class="space-y-4">
            <!-- 1. Dedicated High-Relation Section with Explicit Batch Selection Bar -->
            <div class="p-4 bg-gradient-to-br from-amber-50/70 via-blue-50/50 to-indigo-50/40 border-2 border-blue-400/80 rounded-2xl shadow-sm space-y-3">
              <!-- Unified Batch Selection Header Bar -->
              <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border-b border-blue-200/60 pb-3">
                <div class="space-y-0.5">
                  <div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold">
                    <Star class="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>AI Recommended &bull; High-Relation Supervisory Authorities</span>
                  </div>
                  <h3 class="text-sm sm:text-base font-bold text-slate-900">
                    Recommended Authorities for Your Corridors ({{ wizardStore.selectedMarkets.join(', ') || 'Global' }})
                  </h3>
                  <p class="text-xs text-slate-600 flex items-center gap-1.5">
                    <span>Selected:</span>
                    <strong class="text-blue-700 font-bold">
                      {{ followedHighRelationCount }} of {{ highRelationRegulators.length }}
                    </strong>
                    <span>authorities currently selected for your surveillance scope.</span>
                  </p>
                </div>

                <!-- Unified Batch Toggle Controls -->
                <div class="flex items-center gap-2 self-stretch sm:self-auto justify-end">
                  <button
                    type="button"
                    id="btn-toggle-all-high-relation"
                    @click="handleToggleAllHighRelation"
                    class="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs transition-all shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <CheckCheck class="w-4 h-4 stroke-[2.5]" />
                    <span>{{ isAllHighRelationFollowed ? 'Deselect All Recommended' : 'Select All Recommended' }}</span>
                  </button>
                  <button
                    type="button"
                    @click="handleClearAllFollowed"
                    class="px-2.5 py-1.5 rounded-xl bg-white hover:bg-neutral-100 text-neutral-600 border border-neutral-200 text-xs font-semibold cursor-pointer transition-colors"
                    title="Clear All"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              <!-- High Relation Regulators Grid -->
              <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pt-1">
                <div
                  v-for="reg in highRelationRegulators"
                  :key="reg.id"
                  @click="wizardStore.toggleFollowRegulator(reg.id)"
                  :class="`p-3.5 rounded-xl border text-left flex flex-col justify-between gap-2 transition-all cursor-pointer ${
                    wizardStore.followedRegulatorIds.includes(reg.id)
                      ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-500/30 shadow-xs'
                      : 'bg-white border-blue-200/80 hover:border-blue-400 hover:bg-blue-50/30 shadow-2xs'
                  }`"
                >
                  <div class="space-y-1.5">
                    <div class="flex items-start justify-between gap-1.5">
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-2xl shrink-0">{{ reg.flag }}</span>
                        <div class="min-w-0">
                          <div class="flex items-center gap-1.5">
                            <span class="font-bold text-sm text-neutral-900">{{ reg.acronym }}</span>
                            <span class="text-[10px] px-1.5 py-0.2 rounded bg-white text-neutral-700 border border-neutral-200 font-medium">
                              {{ reg.jurisdiction }}
                            </span>
                          </div>
                          <p class="text-[11px] text-neutral-500 truncate" :title="reg.name">{{ reg.name }}</p>
                        </div>
                      </div>

                      <!-- High Relation Badge -->
                      <span class="px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0 flex items-center gap-1">
                        <Star class="w-2.5 h-2.5 fill-amber-500 text-amber-500" />
                        <span>High Match</span>
                      </span>
                    </div>

                    <!-- Match Reason -->
                    <p class="text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
                      {{ reg.reason }}
                    </p>

                    <!-- Key Themes Chips -->
                    <div class="flex items-center gap-1 flex-wrap pt-0.5">
                      <span
                        v-for="theme in reg.keyThemes.slice(0, 2)"
                        :key="theme"
                        class="text-[9px] px-1.5 py-0.2 rounded bg-neutral-100 text-neutral-600"
                      >
                        {{ theme }}
                      </span>
                    </div>
                  </div>

                  <!-- Follow / Select Status Bar -->
                  <div class="pt-2 border-t border-neutral-100 flex items-center justify-between">
                    <span class="text-[10px] text-neutral-400 truncate">{{ reg.category }}</span>
                    <button
                      type="button"
                      :class="`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 ${
                        wizardStore.followedRegulatorIds.includes(reg.id)
                          ? 'bg-blue-600 text-white shadow-2xs'
                          : 'bg-neutral-100 hover:bg-blue-50 text-neutral-700 hover:text-blue-700 border border-neutral-200'
                      }`"
                    >
                      <Check v-if="wizardStore.followedRegulatorIds.includes(reg.id)" class="w-3 h-3 stroke-[3]" />
                      <Plus v-else class="w-3 h-3" />
                      <span>{{ wizardStore.followedRegulatorIds.includes(reg.id) ? 'Selected' : 'Select' }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- 2. Collapsed by Default: AI Scoping Rationale Accordion -->
            <div class="border border-neutral-200 rounded-xl overflow-hidden bg-white shadow-2xs">
              <button
                type="button"
                @click="wizardStore.isRationaleExpanded = !wizardStore.isRationaleExpanded"
                class="w-full p-3 flex items-center justify-between bg-neutral-50 hover:bg-neutral-100/80 transition-colors cursor-pointer text-left"
              >
                <div class="flex items-center gap-2">
                  <Sparkles class="w-4 h-4 text-blue-600" />
                  <span class="text-xs sm:text-sm font-bold text-neutral-900">
                    AI Scoping Rationale & Perimeter Synthesis
                  </span>
                  <span class="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 font-semibold">
                    {{ wizardStore.isRationaleExpanded ? 'Click to collapse' : 'Click to inspect 4-point analysis' }}
                  </span>
                </div>

                <div class="flex items-center gap-2 text-neutral-500 text-xs">
                  <span>{{ wizardStore.selectedMarkets.join(', ') || 'Global' }}</span>
                  <ChevronUp v-if="wizardStore.isRationaleExpanded" class="w-4 h-4" />
                  <ChevronDown v-else class="w-4 h-4" />
                </div>
              </button>

              <!-- 4 Paragraphs of Analysis (Visible when expanded) -->
              <div
                v-if="wizardStore.isRationaleExpanded"
                class="p-4 space-y-3 text-xs leading-relaxed text-slate-700 border-t border-neutral-100 bg-neutral-50/30 animate-in fade-in duration-200"
              >
                <div class="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                  <div class="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <Building2 class="w-3.5 h-3.5 text-blue-600" />
                    <span>1. Core Entity Positioning</span>
                  </div>
                  <p>{{ wizardStore.aiRationale.coreEntity }}</p>
                </div>

                <div class="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                  <div class="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <ShieldCheck class="w-3.5 h-3.5 text-blue-600" />
                    <span>2. Core Regulatory Perimeter & Standards</span>
                  </div>
                  <p>{{ wizardStore.aiRationale.coreBoundary }}</p>
                </div>

                <div class="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                  <div class="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                    <Globe class="w-3.5 h-3.5 text-blue-600" />
                    <span>3. Jurisdictional Interplay & Cross-Border Coordination</span>
                  </div>
                  <p>{{ wizardStore.aiRationale.jurisdictionInterplay }}</p>
                </div>

                <div class="p-2.5 bg-white rounded-lg border border-neutral-200 space-y-1">
                  <div class="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                    <Star class="w-3.5 h-3.5 text-amber-600" />
                    <span>4. Supervisory Blindspots & Advisory Gaps</span>
                  </div>
                  <p>{{ wizardStore.aiRationale.blindspots }}</p>
                </div>
              </div>
            </div>

            <!-- 3. Other Available Authorities Search & Filter -->
            <div class="space-y-3 pt-1">
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <!-- Search input -->
                <div class="relative flex-1">
                  <Search class="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    v-model="wizardStore.searchQuery"
                    type="text"
                    placeholder="Search authority name, acronym, jurisdiction, or category (e.g. HKMA, SEC, MAS, DORA)..."
                    class="w-full pl-8 pr-7 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-800 placeholder:text-neutral-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100 transition-all shadow-2xs"
                  />
                  <button
                    v-if="wizardStore.searchQuery"
                    @click="wizardStore.searchQuery = ''"
                    class="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 text-xs cursor-pointer"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>

                <!-- Jurisdiction Filter Tabs -->
                <div class="flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                  <button
                    v-for="tab in dynamicJurisdictionTabs"
                    :key="tab"
                    type="button"
                    @click="wizardStore.selectedJurisdictionFilter = tab"
                    :class="`px-2.5 py-1 rounded-lg text-[11px] font-semibold whitespace-nowrap cursor-pointer transition-colors ${
                      wizardStore.selectedJurisdictionFilter === tab
                        ? 'bg-neutral-900 text-white shadow-2xs'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`"
                  >
                    {{ tab }}
                  </button>
                </div>
              </div>

              <!-- Other Available Regulators Section -->
              <div class="space-y-2 pt-1 border-t border-neutral-100">
                <div class="flex items-center justify-between text-xs font-bold text-neutral-700">
                  <div class="flex items-center gap-1.5">
                    <SlidersHorizontal class="w-3.5 h-3.5 text-neutral-500" />
                    <span>Other Available Authorities ({{ otherAvailableRegulators.length }})</span>
                  </div>
                  <span class="text-[11px] font-normal text-neutral-400">
                    Click any authority card to add to your surveillance scope
                  </span>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  <div
                    v-for="reg in otherAvailableRegulators"
                    :key="reg.id"
                    @click="wizardStore.toggleFollowRegulator(reg.id)"
                    :class="`p-3 rounded-xl border text-left flex flex-col justify-between gap-1.5 transition-all cursor-pointer ${
                      wizardStore.followedRegulatorIds.includes(reg.id)
                        ? 'bg-blue-50/80 border-blue-400 text-blue-950 shadow-2xs'
                        : 'bg-white border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50/60 shadow-2xs text-neutral-700'
                    }`"
                  >
                    <div>
                      <div class="flex items-start justify-between gap-1.5">
                        <div class="flex items-center gap-2 min-w-0">
                          <span class="text-xl shrink-0">{{ reg.flag }}</span>
                          <div class="min-w-0">
                            <div class="flex items-center gap-1">
                              <span class="font-bold text-xs text-neutral-900">{{ reg.acronym }}</span>
                              <span class="text-[9px] px-1 py-0.2 rounded bg-neutral-100 text-neutral-600">
                                {{ reg.jurisdiction }}
                              </span>
                            </div>
                            <p class="text-[10px] text-neutral-500 truncate">{{ reg.name }}</p>
                          </div>
                        </div>

                        <!-- Follow badge / button -->
                        <span
                          :class="`px-2 py-0.5 rounded-md text-[10px] font-semibold flex items-center gap-1 shrink-0 ${
                            wizardStore.followedRegulatorIds.includes(reg.id)
                              ? 'bg-blue-600 text-white'
                              : 'bg-neutral-100 hover:bg-blue-50 text-neutral-600 hover:text-blue-700 border border-neutral-200'
                          }`"
                        >
                          <Check v-if="wizardStore.followedRegulatorIds.includes(reg.id)" class="w-2.5 h-2.5 stroke-[3]" />
                          <Plus v-else class="w-2.5 h-2.5" />
                          <span>{{ wizardStore.followedRegulatorIds.includes(reg.id) ? 'Selected' : 'Select' }}</span>
                        </span>
                      </div>

                      <p class="text-[11px] text-neutral-500 line-clamp-2 leading-tight mt-1.5">
                        {{ reg.reason }}
                      </p>
                    </div>

                    <div class="flex items-center justify-between text-[9px] text-neutral-400 pt-1 border-t border-neutral-100">
                      <span class="truncate">{{ reg.category }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Modal Footer Controls -->
        <div class="pt-3 border-t border-neutral-100 flex items-center justify-between shrink-0">
          <div>
            <!-- Step 1 Footer Left -->
            <button
              v-if="wizardStore.currentStep === 1"
              type="button"
              @click="handleClose"
              class="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition-colors cursor-pointer px-2 py-1.5"
            >
              Configure Later / Run in Background
            </button>

            <!-- Step 2 Footer Left -->
            <button
              v-else-if="wizardStore.currentStep === 2"
              type="button"
              @click="handleBackToStep1"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
              <span>&larr; Back to Profile & Focus (Step 1)</span>
            </button>

            <!-- Step 3 Footer Left -->
            <button
              v-else-if="wizardStore.currentStep === 3"
              type="button"
              @click="handleBackToStep2"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold text-neutral-700 hover:bg-neutral-100 transition-colors cursor-pointer shadow-2xs"
            >
              <ArrowLeft class="w-3.5 h-3.5" />
              <span>&larr; Back to Jurisdictions (Step 2)</span>
            </button>
          </div>

          <div class="flex items-center gap-2">
            <!-- Step 1 Footer Right -->
            <button
              v-if="wizardStore.currentStep === 1"
              type="button"
              id="btn-next-step1"
              @click="handleProceedToStep2"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <span>Next: Target Operating Jurisdictions ➔</span>
            </button>

            <!-- Step 2 Footer Right -->
            <button
              v-else-if="wizardStore.currentStep === 2"
              type="button"
              id="btn-generate-step2"
              @click="handleConfirmStep2AndGenerate"
              :disabled="localSelectedMarkets.length === 0 || wizardStore.isAnalyzing"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold transition-all cursor-pointer shadow-2xs"
            >
              <Loader2 v-if="wizardStore.isAnalyzing" class="w-3.5 h-3.5 animate-spin" />
              <Sparkles v-else class="w-3.5 h-3.5" />
              <span>{{ wizardStore.isAnalyzing ? 'Analyzing & Matching...' : 'Generate Recommended Regulators ➔' }}</span>
            </button>

            <!-- Step 3 Footer Right -->
            <button
              v-else-if="wizardStore.currentStep === 3"
              type="button"
              id="btn-apply-watchlist-finish"
              @click="handleFinishWizard"
              class="inline-flex items-center gap-1.5 px-5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold transition-all cursor-pointer shadow-xs"
            >
              <CheckCircle2 class="w-4 h-4" />
              <span>Apply to Watchlist Search & Complete ✓</span>
            </button>
          </div>
        </div>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
