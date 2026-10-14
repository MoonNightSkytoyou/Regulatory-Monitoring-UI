import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { PriorityAlert, RegulationItem, RegulatorInScope } from '@/types';

export interface RetrievedUrlItem {
  id: string;
  title: string;
  url: string;
  authority: string;
  jurisdiction: string;
  publishDate?: string;
  relevanceTag?: string;
  isBookmarked?: boolean;
  isFollowed?: boolean;
  rationale?: string;
  excerpt?: string;
  docType?: string;
}

export interface CitationItem {
  pin: string;
  sourceTitle: string;
  url: string;
  clause?: string;
  excerpt: string;
}

export interface TaskQuestion {
  id: string;
  globalIndex?: number;
  batchIndex?: number; // e.g. 1 for '1Q'
  batchNumber?: number; // e.g. 1 for 'Batch 1'
  batchLabel?: string; // e.g. 'Batch 1'
  questionText: string;
  targetJurisdictions?: string[];
  status: 'Answered' | 'Generating' | 'Pending';
  retrievedUrls: RetrievedUrlItem[];
  llmAnswer: string;
  citations: CitationItem[];
  summary?: string;
  createdAt?: string;
}

export interface QuestionBatch {
  batchNumber: number; // 1, 2, ...
  batchLabel: string; // 'Batch 1'
  createdAt: string;
  targetJurisdictions: string[];
  questionCount: number;
  clarificationNotes?: string;
}

export interface ComplianceTask {
  id: string;
  title: string;
  topic?: string;
  jurisdiction: string;
  homeJurisdiction?: string;
  targetJurisdiction?: string;
  targetJurisdictions?: string[];
  summary?: string;
  consolidatedSummary?: string;
  status: 'Completed' | 'Running' | 'Action Required' | 'Draft';
  createdAt: string;
  updatedAt: string;
  owner: string;
  questions: TaskQuestion[];
  batches?: QuestionBatch[];
  linkedNewsIds: string[];
  linkedRegulatorIds: string[];
  notes?: string;
}

const STORAGE_KEY = 'wizpresso_compliance_tasks_v6';

const DEFAULT_INITIAL_TASKS: ComplianceTask[] = [
  {
    id: 'task-101',
    title: 'Operational Resilience & Cross-Border Compliance Benchmark',
    topic: 'Operational Resilience & Incident Reporting',
    jurisdiction: 'Hong Kong ➔ Singapore, UK, US',
    homeJurisdiction: 'Hong Kong',
    targetJurisdiction: 'Singapore, United Kingdom, United States',
    targetJurisdictions: ['Hong Kong', 'Singapore', 'United Kingdom', 'United States'],
    summary: 'Multi-jurisdictional evaluation of incident reporting windows, cloud outsourcing audit covenants, and corporate governance oversight.',
    consolidatedSummary: `### Consolidated Compliance Summary (Hong Kong ➔ Singapore, United Kingdom, United States)
1. **Incident Notification Discrepancy**:
   Under **HKMA SPM OR-2 §4.2**, authorized institutions must report any critical cyber or operational outage within **2 hours** of assessment. In contrast, **MAS Notice 655 §3.1** requires notification within **1 hour** upon confirming an unscheduled outage exceeding 4 hours cumulative.
2. **Third-Party & Cloud Audit Rights**:
   Both HKMA and MAS prohibit contracts lacking direct regulatory audit and inspection rights. Standard cloud terms must be supplemented with localized supervisory addendums granting direct on-site access to data centers.
3. **UK FCA & US Federal Frameworks**:
   UK FCA SYSC 15A & Operational Resilience PS21/3 mandate rigorous mapping of Important Business Services (IBS), whereas US Federal Reserve / OCC Sound Practices impose stringent board-approved recovery time objectives (RTOs).
4. **Action Items**:
   - Establish a harmonized multi-jurisdiction incident notification matrix reflecting the tighter 1-hour MAS window.
   - Review ongoing AWS/Azure master agreements for regulator-specific audit and penetration testing clauses.`,
    status: 'Completed',
    createdAt: '2026-09-28 09:30 UTC',
    updatedAt: '2026-10-02 14:15 UTC',
    owner: 'Ivan Choy',
    linkedNewsIds: ['alert-001', 'alert-002', 'dir-hkma-001'],
    linkedRegulatorIds: ['reg-hkma', 'reg-mas', 'reg-fca'],
    notes: 'Supervisory alignment across HKMA SPM OR-2, MAS Guidelines, UK FCA PS21/3, and US Fed/OCC Sound Practices.',
    batches: [
      {
        batchNumber: 1,
        batchLabel: 'Batch 1',
        createdAt: '2026-09-28 09:30 UTC',
        targetJurisdictions: ['Hong Kong', 'Singapore'],
        questionCount: 4,
        clarificationNotes: 'Supervisory incident reporting, cloud audit covenants, and operational resilience parameters.',
      },
      {
        batchNumber: 2,
        batchLabel: 'Batch 2',
        createdAt: '2026-10-01 15:45 UTC',
        targetJurisdictions: ['United Kingdom', 'United States'],
        questionCount: 3,
        clarificationNotes: 'UK FCA Important Business Services impact tolerances and US Fed/OCC sound practices benchmarks.',
      },
    ],
    questions: [
      {
        id: 'q-101-1',
        globalIndex: 1,
        batchIndex: 1,
        batchNumber: 1,
        batchLabel: 'Batch 1',
        targetJurisdictions: ['Hong Kong', 'Singapore'],
        questionText: 'What are the mandatory statutory notification timelines for severe cybersecurity or operational disruption incidents?',
        status: 'Answered',
        summary: 'Both HKMA and MAS mandate immediate notification within hours for critical incidents.',
        retrievedUrls: [
          {
            id: 'url-1',
            title: 'HKMA Supervisory Policy Manual OR-2: Operational Resilience',
            url: 'https://www.hkma.gov.hk/eng/regulatory-resources/supervisory-policy-manual/',
            authority: 'HKMA',
            jurisdiction: 'Hong Kong',
            publishDate: '2026-03-24',
            relevanceTag: 'Mandatory Directive',
            isBookmarked: true,
            isFollowed: true,
            rationale: 'Directly mandates HKMA authorized institutions to establish operational disruption tolerance metrics and report severe outages within 2 hours.',
            excerpt: 'Authorized Institutions must notify the HKMA as soon as practicable and in any event within 2 hours of detecting any incident that severely impacts critical operations.',
            docType: 'Guideline',
          },
          {
            id: 'url-2',
            title: 'MAS Technology Risk Management (TRM) Guidelines Notice 655',
            url: 'https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines',
            authority: 'MAS',
            jurisdiction: 'Singapore',
            publishDate: '2026-02-18',
            relevanceTag: 'Statutory Notice',
            isBookmarked: false,
            isFollowed: true,
            rationale: 'Governs Singapore IT risk and incident reporting, establishing mandatory 1-hour notice requirement for material system failure.',
            excerpt: 'A financial institution must notify MAS immediately and no later than 1 hour upon becoming aware of any system unavailability affecting customer services.',
            docType: 'Circular',
          },
        ],
        llmAnswer: `Under **HKMA SPM OR-2 §4.2**, authorized institutions must report any critical cyber or operational outage within **2 hours** of initial assessment. Materiality criteria include loss of core banking functions or customer data exposure.

In comparison, **MAS Notice 655 §3.1** prescribes incident reporting to MAS within **1 hour** upon confirming an unscheduled system downtime exceeding 4 hours cumulative over any 12-month period, followed by a formal root-cause analysis within 14 calendar days.`,
        citations: [
          {
            pin: 'HKMA SPM OR-2 §4.2',
            sourceTitle: 'HKMA SPM OR-2 Operational Resilience (2026)',
            url: 'https://www.hkma.gov.hk/eng/regulatory-resources/supervisory-policy-manual/',
            clause: 'Section 4.2 Incident Reporting Protocol',
            excerpt: 'Authorized Institutions must notify the HKMA as soon as practicable and in any event within 2 hours of detecting any incident that severely impacts critical operations.',
          },
          {
            pin: 'MAS Notice 655 §3.1',
            sourceTitle: 'MAS Technology Risk Management Guidelines Notice 655',
            url: 'https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines',
            clause: 'Notice 655 Paragraph 3.1 Unscheduled Outages',
            excerpt: 'A financial institution must notify MAS immediately and no later than 1 hour upon becoming aware of any system unavailability affecting customer services.',
          },
        ],
      },
      {
        id: 'q-101-2',
        globalIndex: 2,
        batchIndex: 2,
        batchNumber: 1,
        batchLabel: 'Batch 1',
        targetJurisdictions: ['Hong Kong', 'Singapore'],
        questionText: 'Are financial institutions required to impose audit and inspection rights in third-party cloud service contracts?',
        status: 'Answered',
        summary: 'Direct audit rights, sub-contractor visibility, and supervisory access clauses are non-negotiable requirements.',
        retrievedUrls: [
          {
            id: 'url-3',
            title: 'HKMA Circular on Cloud Computing and Third-Party Vendor Risk',
            url: 'https://www.hkma.gov.hk/eng/regulatory-resources/regulatory-guides/',
            authority: 'HKMA',
            jurisdiction: 'Hong Kong',
            publishDate: '2026-01-15',
            relevanceTag: 'Supervisory Circular',
            isBookmarked: false,
            isFollowed: true,
            rationale: 'Establishes clear statutory expectation for direct supervisory and internal audit access in all cloud and third-party contracts.',
            excerpt: 'The outsourcing agreement must explicitly recognize the right of the HKMA and its appointed agents to conduct on-site inspections of the service provider.',
            docType: 'Circular',
          },
        ],
        llmAnswer: `Yes. **HKMA Circular (Jan 2026)** stipulates that financial institutions must legally secure unhindered access and audit rights—including direct access for HKMA examiners—to cloud facilities, data centers, and multi-tenant security logs.

Contractual safeguards must also mandate annual SOC 2 Type II or ISO 27001 third-party attestation certifications and prompt notification of material sub-outsourcing modifications.`,
        citations: [
          {
            pin: 'HKMA Circular §6.3',
            sourceTitle: 'HKMA Circular on Cloud Computing Guidelines',
            url: 'https://www.hkma.gov.hk/eng/regulatory-resources/regulatory-guides/',
            clause: 'Paragraph 6.3 Supervisory and Internal Audit Access',
            excerpt: 'The outsourcing agreement must explicitly recognize the right of the HKMA and its appointed agents to conduct on-site inspections of the service provider.',
          },
        ],
      },
      {
        id: 'q-101-3',
        globalIndex: 3,
        batchIndex: 3,
        batchNumber: 1,
        batchLabel: 'Batch 1',
        targetJurisdictions: ['Hong Kong', 'Singapore'],
        questionText: 'What scenario testing and tolerance thresholds must be established for critical business services?',
        status: 'Answered',
        summary: 'Severe but plausible disruption testing required annually with quantified impact tolerances.',
        retrievedUrls: [
          {
            id: 'url-1',
            title: 'HKMA Supervisory Policy Manual OR-2: Operational Resilience',
            url: 'https://www.hkma.gov.hk/eng/regulatory-resources/supervisory-policy-manual/',
            authority: 'HKMA',
            jurisdiction: 'Hong Kong',
            publishDate: '2026-03-24',
            relevanceTag: 'Mandatory Directive',
            isBookmarked: true,
            isFollowed: true,
            rationale: 'Mandates annual severe-but-plausible scenario simulations across critical operations.',
            excerpt: 'AIs must conduct scenario testing against severe but plausible scenarios to identify vulnerabilities in their operational resilience framework.',
            docType: 'Guideline',
          },
        ],
        llmAnswer: `Both HKMA (SPM OR-2 §5.1) and MAS require financial institutions to establish quantified impact tolerance metrics—expressed as maximum acceptable downtime (e.g., 4 hours) or data loss tolerance (RPO = 0 for payment channels).

Institutions must conduct at least annual scenario testing incorporating simultaneous ransomware outbreaks and major third-party cloud unavailability.`,
        citations: [
          {
            pin: 'HKMA SPM OR-2 §5.1',
            sourceTitle: 'HKMA SPM OR-2 Scenario Testing Requirements',
            url: 'https://www.hkma.gov.hk/eng/regulatory-resources/supervisory-policy-manual/',
            clause: 'Section 5.1 Impact Tolerance Setting',
            excerpt: 'AIs must set tolerance limits that assume disruption will occur, rather than focusing purely on prevention.',
          },
        ],
      },
      {
        id: 'q-101-4',
        globalIndex: 4,
        batchIndex: 4,
        batchNumber: 1,
        batchLabel: 'Batch 1',
        targetJurisdictions: ['Hong Kong', 'Singapore'],
        questionText: 'What board-level accountability and governance reporting is mandated for operational resilience posture?',
        status: 'Answered',
        summary: 'Board or dedicated executive committee must formally approve tolerance thresholds and self-assessments annually.',
        retrievedUrls: [
          {
            id: 'url-2',
            title: 'MAS Technology Risk Management (TRM) Guidelines Notice 655',
            url: 'https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines',
            authority: 'MAS',
            jurisdiction: 'Singapore',
            publishDate: '2026-02-18',
            relevanceTag: 'Statutory Notice',
            isBookmarked: false,
            isFollowed: true,
            rationale: 'Specifies board and senior management responsibility for oversight of cyber resilience frameworks.',
            excerpt: 'The board of directors and senior management are ultimately responsible for the sound governance of technology risk.',
            docType: 'Circular',
          },
        ],
        llmAnswer: `Under HKMA SPM OR-2 and MAS TRM Guidelines, the Board of Directors retains ultimate fiduciary accountability for operational resilience. Senior management must deliver quarterly operational resilience health scorecards, and the Board must formally sign off on the annual self-assessment report submitted to supervisory authorities.`,
        citations: [
          {
            pin: 'MAS TRM §2.1',
            sourceTitle: 'MAS Technology Risk Management Oversight Rules',
            url: 'https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines',
            clause: 'Section 2.1 Board and Senior Management Responsibility',
            excerpt: 'The board of directors and senior management are ultimately responsible for the sound governance of technology risk.',
          },
        ],
      },
      {
        id: 'q-101-5',
        globalIndex: 5,
        batchIndex: 1,
        batchNumber: 2,
        batchLabel: 'Batch 2',
        targetJurisdictions: ['United Kingdom', 'United States'],
        questionText: 'How does UK FCA PS21/3 define Important Business Services (IBS) and impact tolerances?',
        status: 'Answered',
        summary: 'FCA mandates dual-perspective impact tolerance (harm to consumers and systemic risk) with March 2025/2026 maturity.',
        retrievedUrls: [
          {
            id: 'url-fca-1',
            title: 'FCA Policy Statement PS21/3: Building Operational Resilience',
            url: 'https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience',
            authority: 'FCA',
            jurisdiction: 'United Kingdom',
            publishDate: '2025-11-10',
            relevanceTag: 'Policy Statement',
            isBookmarked: false,
            isFollowed: true,
            rationale: 'Mandates identification of Important Business Services whose disruption could cause intolerable harm to consumers.',
            excerpt: 'Firms must identify their important business services and set impact tolerances for maximum tolerable disruption.',
            docType: 'Policy Statement',
          },
        ],
        llmAnswer: `Under **UK FCA PS21/3 & PRA SS1/21**, an Important Business Service (IBS) is defined as a service delivered to external end-users that, if disrupted, could cause intolerable level of harm to consumers or pose systemic risk to UK financial stability.

Firms must define precise impact tolerances with quantitative metrics (time, volume, data integrity) and remain within tolerances under severe but plausible scenarios.`,
        citations: [
          {
            pin: 'FCA PS21/3 §2.4',
            sourceTitle: 'FCA Operational Resilience Framework Rules',
            url: 'https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience',
            clause: 'Paragraph 2.4 Impact Tolerance Setting',
            excerpt: 'Firms must set a tolerance that quantifies the maximum acceptable level of disruption, which must not be breached.',
          },
        ],
      },
      {
        id: 'q-101-6',
        globalIndex: 6,
        batchIndex: 2,
        batchNumber: 2,
        batchLabel: 'Batch 2',
        targetJurisdictions: ['United Kingdom', 'United States'],
        questionText: 'What core expectations are established under US Federal Reserve and OCC Sound Practices for Operational Resilience?',
        status: 'Answered',
        summary: 'Focus on core clearing, settlement, and liquidity operations with 2-hour recovery time objectives for critical operations.',
        retrievedUrls: [
          {
            id: 'url-fed-1',
            title: 'Federal Reserve / OCC / FDIC Sound Practices to Strengthen Operational Resilience',
            url: 'https://www.federalreserve.gov/supervisionreg/srletters/sr2024.htm',
            authority: 'Federal Reserve',
            jurisdiction: 'United States',
            publishDate: '2025-08-15',
            relevanceTag: 'Interagency Paper',
            isBookmarked: false,
            isFollowed: true,
            rationale: 'Establishes interagency sound practices for large domestic and foreign banking organizations in the US.',
            excerpt: 'Sound Practices §III: For critical operations, firms should establish recovery time objectives that reflect the potential impact on financial stability.',
            docType: 'Supervisory Paper',
          },
        ],
        llmAnswer: `The **US Federal Reserve, OCC, and FDIC Interagency Paper** on Sound Practices applies to large banking organizations (typically Category I–IV). It mandates that firms maintain operational capabilities to recover from a wide-scale disruption and complete critical clearing, settlement, and payment obligations by the end of the business day, with a 2-hour Recovery Time Objective (RTO) for core financial market utilities.`,
        citations: [
          {
            pin: 'Fed/OCC Sound Practices §3',
            sourceTitle: 'Interagency Paper on Sound Practices for Operational Resilience',
            url: 'https://www.federalreserve.gov/supervisionreg/srletters/sr2024.htm',
            clause: 'Section III Operational Resilience Objectives',
            excerpt: 'For critical operations, firms should establish recovery time objectives that reflect the potential impact on financial stability.',
          },
        ],
      },
      {
        id: 'q-101-7',
        globalIndex: 7,
        batchIndex: 3,
        batchNumber: 2,
        batchLabel: 'Batch 2',
        targetJurisdictions: ['United Kingdom', 'United States'],
        questionText: 'What inter-affiliate service level and operational dependency covenants must cross-border banking groups maintain?',
        status: 'Answered',
        summary: 'Arm’s-length service level agreements (SLAs), operational continuity in resolution (OCIR), and ring-fencing compliance.',
        retrievedUrls: [
          {
            id: 'url-pra-1',
            title: 'PRA Supervisory Statement SS4/21: Outsourcing and Third Party Risk Management',
            url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2021/march/outsourcing-and-third-party-risk-management-ss',
            authority: 'PRA',
            jurisdiction: 'United Kingdom',
            publishDate: '2025-06-20',
            relevanceTag: 'Prudential Standard',
            isBookmarked: false,
            isFollowed: false,
            rationale: 'Governs intragroup outsourcing and operational continuity in resolution.',
            excerpt: 'Firms must ensure intragroup arrangements are documented with equivalent rigor to third-party arrangements.',
            docType: 'Supervisory Statement',
          },
        ],
        llmAnswer: `Both UK PRA (SS4/21) and US resolution planning rules (Title I 165(d)) mandate that intragroup service entities (e.g., shared IT service hubs in Hong Kong or Singapore) must operate under formal, arm’s-length Service Level Agreements (SLAs).

These agreements must include bankruptcy-remote resolution clauses ensuring that UK/US operating entities maintain continuous access to critical IT systems even during parental restructuring.`,
        citations: [
          {
            pin: 'PRA SS4/21 §4.8',
            sourceTitle: 'PRA SS4/21 Intragroup Outsourcing Expectations',
            url: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2021/march/outsourcing-and-third-party-risk-management-ss',
            clause: 'Paragraph 4.8 Intragroup Outsourcing Continuity',
            excerpt: 'Firms must ensure intragroup arrangements are documented with equivalent rigor to third-party arrangements.',
          },
        ],
      },
    ],
  },
  {
    id: 'task-102',
    title: 'Cross-Border Corporate Secretarial & Beneficial Ownership Compliance',
    topic: 'Corporate Governance & AML/CFT',
    jurisdiction: 'Hong Kong ➔ United Kingdom',
    homeJurisdiction: 'Hong Kong',
    targetJurisdiction: 'United Kingdom',
    targetJurisdictions: ['United Kingdom'],
    summary: 'Comparison of register of significant controllers cap. 622 vs UK PSC register reforms for international holding structures.',
    consolidatedSummary: `### Consolidated Compliance Summary (Hong Kong ➔ United Kingdom)
1. **Officer & Natural Person Director Requirement**:
   Both Hong Kong and the United Kingdom require at least one natural person director. Hong Kong strictly prohibits a sole director from acting as company secretary under Companies Ordinance Cap. 622.
2. **Beneficial Ownership Transparency**:
   Hong Kong Significant Controllers Register (SCR) mandates keeping designated representative records at a registered Hong Kong address, while UK Economic Crime and Corporate Transparency Act introduces mandatory identity verification for all PSCs.
3. **Action Items**:
   - Audit corporate secretarial mandates to ensure sole directors do not hold dual officer roles.
   - Verify beneficial ownership identification and documentation readiness for cross-border entities.`,
    status: 'Action Required',
    createdAt: '2026-09-30 11:20 UTC',
    updatedAt: '2026-10-03 16:40 UTC',
    owner: 'Ivan Choy',
    linkedNewsIds: ['alert-004'],
    linkedRegulatorIds: ['reg-cr', 'reg-fca'],
    notes: 'Comparison of register of significant controllers cap. 622 vs UK PSC register reforms.',
    batches: [
      {
        batchNumber: 1,
        batchLabel: 'Batch 1',
        createdAt: '2026-09-30 11:20 UTC',
        targetJurisdictions: ['United Kingdom'],
        questionCount: 1,
        clarificationNotes: 'Corporate officer structure scrutiny.',
      },
    ],
    questions: [
      {
        id: 'q-102-1',
        globalIndex: 1,
        batchIndex: 1,
        batchNumber: 1,
        batchLabel: 'Batch 1',
        targetJurisdictions: ['United Kingdom'],
        questionText: 'Can a corporate body serve as sole director or secretary, and what residency requirements apply?',
        status: 'Answered',
        summary: 'Hong Kong requires at least one natural person director; sole director cannot act as secretary.',
        retrievedUrls: [
          {
            id: 'url-4',
            title: 'Companies Registry (Cap. 622) Companies Ordinance FAQ',
            url: 'https://www.cr.gov.hk/en/legislation/companies-ordinance/',
            authority: 'Companies Registry',
            jurisdiction: 'Hong Kong',
            publishDate: '2026-02-10',
            relevanceTag: 'Statute & Guidance',
            isBookmarked: true,
            isFollowed: true,
            rationale: 'Primary statutory provision governing corporate officer composition and anti-avoidance restrictions on dual directorships.',
            excerpt: 'The sole director of a private company must not also be the company secretary of the company.',
            docType: 'Primary Legislation',
          },
        ],
        llmAnswer: `Under **Companies Ordinance (Cap. 622) §454 & §474**, a private company registered in Hong Kong must have at least one director who is a natural person. The sole director cannot concurrently serve as company secretary. 

Furthermore, if a body corporate acts as company secretary, its registered office or place of business must be located in Hong Kong.`,
        citations: [
          {
            pin: 'Cap. 622 §474',
            sourceTitle: 'Hong Kong Companies Ordinance (Cap. 622)',
            url: 'https://www.cr.gov.hk/en/legislation/companies-ordinance/',
            clause: 'Section 474 Restrictions on Sole Director',
            excerpt: 'The sole director of a private company must not also be the company secretary of the company.',
          },
        ],
      },
    ],
  },
];

function loadStoredTasks(): ComplianceTask[] {
  if (typeof window === 'undefined') return DEFAULT_INITIAL_TASKS;
  try {
    // Clear obsolete keys from previous versions
    ['wizpresso_compliance_tasks_v1', 'wizpresso_compliance_tasks_v2', 'wizpresso_compliance_tasks_v3', 'wizpresso_compliance_tasks_v4', 'wizpresso_compliance_tasks_v5'].forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });

    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const t101 = parsed.find((t: any) => t.id === 'task-101');
        if (t101 && Array.isArray(t101.questions) && t101.questions.length >= 7) {
          return parsed;
        }
      }
    }
  } catch (e) {
    console.warn('Failed to parse stored compliance tasks', e);
  }
  return DEFAULT_INITIAL_TASKS;
}

export interface DocumentAliasGroup {
  canonicalId: string;
  referenceNumber: string;
  titleKeywords: string[];
  aliases: string[];
}

export const KNOWN_DOCUMENT_ALIASES: DocumentAliasGroup[] = [
  {
    canonicalId: 'hkma-001',
    referenceNumber: 'HKMA-SPM-OR2-2026',
    titleKeywords: ['operational resilience', 'spm or-2', 'third-party risk', 'supervisory policy manual or-2'],
    aliases: ['alt-hkma-001', 'reg-hkma-001', 'dir-hkma-001', 'alert-001', 'hkma-001', 'url-1'],
  },
  {
    canonicalId: 'sfc-002',
    referenceNumber: 'SFC-CIR-2026-003',
    titleKeywords: ['virtual asset', 'intermediaries', 'custody arrangements'],
    aliases: ['alt-sfc-002', 'reg-sfc-002', 'dir-sfc-002', 'alert-002', 'sfc-002'],
  },
  {
    canonicalId: 'cr-003',
    referenceNumber: 'CR-GDL-SCR-2026',
    titleKeywords: ['significant controllers', 'cap. 622', 'companies registry', 'companies ordinance'],
    aliases: ['alt-cr-003', 'reg-cr-003', 'dir-cr-003', 'alert-003', 'cr-003', 'url-4'],
  },
  {
    canonicalId: 'mas-004',
    referenceNumber: 'MAS-TRM-2026-01',
    titleKeywords: ['technology risk management', 'mas notice 644', 'mas notice 655', 'trm guidelines'],
    aliases: ['alt-mas-004', 'reg-mas-004', 'dir-mas-004', 'alert-004', 'mas-004', 'url-2'],
  },
  {
    canonicalId: 'hkex-005',
    referenceNumber: 'HKEX-ESG-CC-2026',
    titleKeywords: ['climate-related disclosures', 'hkex consultation'],
    aliases: ['alt-hkex-005', 'reg-hkex-005', 'dir-hkex-005', 'alert-005', 'hkex-005'],
  },
  {
    canonicalId: 'fca-006',
    referenceNumber: 'FCA-PS22-9-REV',
    titleKeywords: ['consumer duty', 'ps22/9', 'fair value benchmarks'],
    aliases: ['alt-fca-006', 'reg-fca-006', 'dir-fca-006', 'alert-006', 'fca-006'],
  },
];

export function getDocCanonicalTokens(identifier?: string, title?: string, ref?: string): Set<string> {
  const tokens = new Set<string>();
  if (!identifier && !title && !ref) return tokens;

  const idNorm = (identifier || '').trim().toLowerCase();
  const refNorm = (ref || '').trim().toLowerCase();
  const titleNorm = (title || '').trim().toLowerCase();

  if (idNorm) tokens.add(idNorm);
  if (refNorm) tokens.add(refNorm);

  for (const doc of KNOWN_DOCUMENT_ALIASES) {
    const matchesId = idNorm && doc.aliases.some((a) => a === idNorm || idNorm.includes(a));
    const matchesRef = refNorm && doc.referenceNumber.toLowerCase() === refNorm;
    const matchesTitle = titleNorm && doc.titleKeywords.some((kw) => titleNorm.includes(kw));

    if (matchesId || matchesRef || matchesTitle) {
      tokens.add(doc.canonicalId);
      tokens.add(doc.referenceNumber.toLowerCase());
      doc.aliases.forEach((a) => tokens.add(a));
    }
  }

  if (idNorm) {
    const stripped = idNorm.replace(/^(?:alt|reg|dir|alert|src|doc)[-_]/, '');
    if (stripped && stripped !== idNorm) {
      tokens.add(stripped);
    }
  }

  return tokens;
}

function isTaskLinkedToNews(task: ComplianceTask, queryTokens: Set<string>): boolean {
  if (queryTokens.size === 0) return false;

  for (const newsId of task.linkedNewsIds) {
    const taskTokens = getDocCanonicalTokens(newsId);
    for (const t of taskTokens) {
      if (queryTokens.has(t)) return true;
    }
  }

  for (const q of task.questions) {
    for (const url of q.retrievedUrls || []) {
      const urlTokens = getDocCanonicalTokens(url.id, url.title);
      for (const t of urlTokens) {
        if (queryTokens.has(t)) return true;
      }
    }
  }

  return false;
}

export const useTaskStore = defineStore('taskStore', () => {
  const tasks = ref<ComplianceTask[]>(loadStoredTasks());
  const activeTaskId = ref<string | null>(null);

  const persist = () => {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks.value));
    } catch (e) {
      console.warn('Failed to save compliance tasks', e);
    }
  };

  const activeTask = computed(() => {
    if (!activeTaskId.value) return null;
    return tasks.value.find((t) => t.id === activeTaskId.value) || null;
  });

  // Calculate linkage count for a news item with universal alias resolution
  const getNewsLinkageCount = (newsId: string, title?: string, referenceNumber?: string): number => {
    const queryTokens = getDocCanonicalTokens(newsId, title, referenceNumber);
    return tasks.value.filter((t) => isTaskLinkedToNews(t, queryTokens)).length;
  };

  // Get all tasks linked to a specific news item with universal alias resolution
  const getTasksForNews = (newsId: string, title?: string, referenceNumber?: string): ComplianceTask[] => {
    const queryTokens = getDocCanonicalTokens(newsId, title, referenceNumber);
    return tasks.value.filter((t) => isTaskLinkedToNews(t, queryTokens));
  };

  // Calculate linkage count for a regulator
  const getRegulatorLinkageCount = (regulatorIdOrAcronym: string): number => {
    const norm = regulatorIdOrAcronym.trim().toLowerCase();
    return tasks.value.filter((t) =>
      t.linkedRegulatorIds.some((id) => {
        const itemNorm = id.trim().toLowerCase();
        return itemNorm === norm || itemNorm === `reg-${norm}` || `reg-${itemNorm}` === norm;
      })
    ).length;
  };

  // Get all tasks linked to a specific regulator
  const getTasksForRegulator = (regulatorIdOrAcronym: string): ComplianceTask[] => {
    const norm = regulatorIdOrAcronym.trim().toLowerCase();
    return tasks.value.filter((t) =>
      t.linkedRegulatorIds.some((id) => {
        const itemNorm = id.trim().toLowerCase();
        return itemNorm === norm || itemNorm === `reg-${norm}` || `reg-${itemNorm}` === norm;
      })
    );
  };

  // Create a new task
  const createTask = (payload: {
    title: string;
    topic?: string;
    jurisdiction?: string;
    homeJurisdiction?: string;
    targetJurisdiction?: string;
    targetJurisdictions?: string[];
    summary?: string;
    rawQuestions?: string[];
    linkedNewsIds?: string[];
    linkedRegulatorIds?: string[];
    notes?: string;
  }): ComplianceTask => {
    const taskId = `task-${Date.now()}`;
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';

    const homeJur = payload.homeJurisdiction || 'Hong Kong';
    const targetJurs: string[] =
      payload.targetJurisdictions && payload.targetJurisdictions.length > 0
        ? payload.targetJurisdictions
        : payload.targetJurisdiction
        ? payload.targetJurisdiction.split(/[,&➔/]+/).map((s) => s.trim()).filter(Boolean)
        : ['Singapore'];
    const targetJurStr = targetJurs.join(', ');
    const combinedJur = homeJur === targetJurStr ? homeJur : `${homeJur} ➔ ${targetJurStr}`;

    const questionsList: string[] = (payload.rawQuestions || [])
      .map((q) => q.trim())
      .filter(Boolean);

    const getAuthorityForJur = (jur: string) => {
      const j = jur.toLowerCase();
      if (j.includes('singapore')) return { code: 'MAS', name: 'Monetary Authority of Singapore', domain: 'mas.gov.sg' };
      if (j.includes('united kingdom') || j.includes('uk')) return { code: 'FCA', name: 'Financial Conduct Authority', domain: 'fca.org.uk' };
      if (j.includes('european union') || j.includes('eu')) return { code: 'EBA / ESMA', name: 'European Banking Authority', domain: 'eba.europa.eu' };
      if (j.includes('united states') || j.includes('us')) return { code: 'SEC / CFTC', name: 'US Securities & Exchange Commission', domain: 'sec.gov' };
      if (j.includes('japan')) return { code: 'JFSA', name: 'Financial Services Agency of Japan', domain: 'fsa.go.jp' };
      if (j.includes('australia')) return { code: 'APRA / ASIC', name: 'Australian Prudential Regulation Authority', domain: 'apra.gov.au' };
      if (j.includes('china')) return { code: 'NFRA / CSRC', name: 'National Financial Regulatory Administration', domain: 'nfra.gov.cn' };
      if (j.includes('hong kong')) return { code: 'HKMA', name: 'Hong Kong Monetary Authority', domain: 'hkma.gov.hk' };
      return { code: `${jur.slice(0, 3).toUpperCase()}-REG`, name: `${jur} Regulatory Authority`, domain: `${jur.toLowerCase().replace(/[^a-z]/g, '')}.gov` };
    };

    const initialBatch: QuestionBatch | undefined = questionsList.length > 0 ? {
      batchNumber: 1,
      batchLabel: 'Batch 1',
      createdAt: nowStr,
      targetJurisdictions: [...targetJurs],
      questionCount: questionsList.length,
      clarificationNotes: payload.summary || '',
    } : undefined;

    const constructedQuestions: TaskQuestion[] = questionsList.map((qText, idx) => {
      const qId = `q-${Date.now()}-${idx + 1}`;
      const isRoutineDefault = qText.toLowerCase().includes('routine supervisory');

      // Generate authoritative URLs across target jurisdictions
      const retrievedUrls: RetrievedUrlItem[] = [];
      const citations: CitationItem[] = [];

      // 1. Target Jurisdictions sources
      targetJurs.forEach((tJur, tIdx) => {
        const auth = getAuthorityForJur(tJur);
        const urlItem: RetrievedUrlItem = {
          id: `url-${qId}-target-${tIdx + 1}`,
          title: `${auth.code} Supervisory Standard & Regulatory Guidelines for ${tJur}`,
          url: `https://www.${auth.domain}/regulatory-guides/standards/`,
          authority: auth.code,
          jurisdiction: tJur,
          publishDate: '2026-03-20',
          relevanceTag: 'Authoritative Official Source',
          isBookmarked: false,
          isFollowed: true,
          rationale: `Directly mandates statutory compliance, supervisory notification protocols, and risk threshold parameters in ${tJur} in response to: "${qText.slice(0, 60)}..."`,
          excerpt: `Entities under the jurisdiction of ${auth.code} in ${tJur} must establish verifiable governance controls, periodic stress testing, and maintain audit records of compliance gap assessments.`,
          docType: 'Guideline',
        };
        retrievedUrls.push(urlItem);

        citations.push({
          pin: `${auth.code} Standard §1.${tIdx + 1}`,
          sourceTitle: `${auth.code} Supervisory Standards (${tJur})`,
          url: urlItem.url,
          clause: `Section 1.${tIdx + 1} Statutory Mandate`,
          excerpt: `Authorized institutions under ${auth.code} must enforce verifiable governance controls and maintain updated logs of regulatory compliance.`,
        });
      });

      // 2. Home jurisdiction baseline source (HKMA)
      const homeAuth = getAuthorityForJur(homeJur);
      const homeUrl: RetrievedUrlItem = {
        id: `url-${qId}-home`,
        title: `${homeAuth.code} Statutory Baseline & Circulars on ${payload.topic || 'Compliance'}`,
        url: `https://www.${homeAuth.domain}/circulars/supervisory-framework/`,
        authority: homeAuth.code,
        jurisdiction: homeJur,
        publishDate: '2026-02-15',
        relevanceTag: 'Home Baseline Reference',
        isBookmarked: false,
        isFollowed: true,
        rationale: `Provides legal definitions, baseline thresholds, and cross-border alignment obligations in ${homeJur} relevant to ${payload.title}.`,
        excerpt: `A financial institution must notify supervisory authorities immediately upon becoming aware of any material risk exposure or contractual non-compliance.`,
        docType: 'Circular',
      };
      retrievedUrls.push(homeUrl);

      citations.push({
        pin: `${homeAuth.code} Baseline §4.1`,
        sourceTitle: `${homeAuth.code} Statutory Code & Guidance Notes`,
        url: homeUrl.url,
        clause: 'Paragraph 4.1 Cross-Border Reciprocity',
        excerpt: `Supervisory authorities expect continuous monitoring of foreign group entities operating under shared infrastructure.`,
      });

      const llmAnswer = isRoutineDefault
        ? `### Automated Routine Multi-Jurisdictional Assessment
Based on official guidelines retrieved across **${homeJur}** and **${targetJurStr}**:
1. Regular surveillance has verified that no emergent disciplinary enforcement notices restrict operations.
2. Key compliance standards require ongoing audit documentation and quarterly policy reviews across all monitored jurisdictions.
3. Relevant statutory requirements remain aligned with current compliance controls.`
        : `### Multi-Jurisdictional Compliance Synthesis (${homeJur} ➔ ${targetJurStr})
Based directly on authoritative records retrieved across all selected jurisdictions:

1. **Home Baseline (${homeJur} - ${homeAuth.code}):**
   Under **${homeAuth.code} Baseline §4.1**, applicable regulated entities must enforce documented governance protocols, maintain clear officer accountability, and monitor cross-border exposure.

2. **Target Jurisdictions Assessment (${targetJurStr}):**
${targetJurs
  .map((tJur) => {
    const auth = getAuthorityForJur(tJur);
    return `   - **${tJur} (${auth.code})**: Regulated institutions subject to ${auth.name} must adhere to statutory notification rules, enforce direct cloud audit clauses, and conduct regular scenario testing.`;
  })
  .join('\n')}

3. **Jurisdictional Alignment & Safeguards:**
   Supervisory authorities across **${targetJurStr}** require active alignment with group compliance baselines established in **${homeJur}**, ensuring no regulatory vacuum exists between multi-licensed operating entities.`;

      return {
        id: qId,
        globalIndex: idx + 1,
        batchIndex: idx + 1,
        batchNumber: 1,
        batchLabel: 'Batch 1',
        targetJurisdictions: [...targetJurs],
        questionText: qText,
        status: 'Answered',
        summary: `Analysis synthesized from ${retrievedUrls.length} authoritative source documents across ${targetJurs.length + 1} jurisdictions.`,
        retrievedUrls,
        llmAnswer,
        citations,
        createdAt: nowStr,
      };
    });

    const consolidatedSummary = `### Consolidated Compliance Summary (${homeJur} ➔ ${targetJurStr})
1. **Harmonized Regulatory Baseline**:
   Across both **${homeJur}** and all target markets (**${targetJurStr}**), supervisory authorities mandate prompt incident notification, continuous third-party supplier governance, and documented compliance gap assessments.
2. **Multi-Jurisdictional Divergence & Priority Action**:
${targetJurs
  .map((tJur) => {
    const auth = getAuthorityForJur(tJur);
    return `   - **${tJur} (${auth.code})**: Discrepancies in notification timelines and statutory audit provisions require updating the dual-jurisdiction compliance matrix for operations in ${tJur}.`;
  })
  .join('\n')}
3. **Action Items**:
   - Establish cross-border notification escalation paths reconciling timeline differences across all target markets (${targetJurStr}).
   - Bookmark identified regulatory source circulars in the Directory for ongoing automated surveillance.
   - Review commercial agreements for mandatory supervisory audit clauses across each target regime.`;

    const newTask: ComplianceTask = {
      id: taskId,
      title: payload.title || `Compliance Task: ${payload.topic || 'Supervisory Research'}`,
      topic: payload.topic || 'General Compliance',
      jurisdiction: combinedJur,
      homeJurisdiction: homeJur,
      targetJurisdiction: targetJurStr,
      targetJurisdictions: targetJurs,
      summary:
        payload.summary ||
        `Compliance assessment evaluating supervisory obligations across ${homeJur} and ${targetJurStr}.`,
      consolidatedSummary: constructedQuestions.length > 0 ? consolidatedSummary : '',
      status: constructedQuestions.length > 0 ? 'Completed' : 'Draft',
      createdAt: nowStr,
      updatedAt: nowStr,
      owner: 'Ivan Choy',
      batches: initialBatch ? [initialBatch] : [],
      questions: constructedQuestions,
      linkedNewsIds: payload.linkedNewsIds || [],
      linkedRegulatorIds: payload.linkedRegulatorIds || [],
      notes: payload.notes || payload.summary || '',
    };

    tasks.value.unshift(newTask);
    persist();
    return newTask;
  };

  // Add a new batch of questions to an existing task in-place
  const addBatchQuestionsToTask = (
    taskId: string,
    payload: {
      questions: string[];
      targetJurisdictions: string[];
      clarificationNotes?: string;
    }
  ): TaskQuestion[] => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return [];

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    if (!task.batches) {
      task.batches = [];
    }

    const nextBatchNumber = task.batches.length > 0
      ? Math.max(...task.batches.map((b) => b.batchNumber)) + 1
      : 1;
    const batchLabel = `Batch ${nextBatchNumber}`;

    const targetJurs = payload.targetJurisdictions && payload.targetJurisdictions.length > 0
      ? payload.targetJurisdictions
      : task.targetJurisdictions && task.targetJurisdictions.length > 0
      ? task.targetJurisdictions
      : ['Hong Kong', 'Singapore'];

    const getAuthorityForJur = (jur: string) => {
      const j = jur.toLowerCase();
      if (j.includes('singapore')) return { code: 'MAS', name: 'Monetary Authority of Singapore', domain: 'mas.gov.sg' };
      if (j.includes('united kingdom') || j.includes('uk')) return { code: 'FCA', name: 'Financial Conduct Authority', domain: 'fca.org.uk' };
      if (j.includes('european union') || j.includes('eu')) return { code: 'EBA / ESMA', name: 'European Banking Authority', domain: 'eba.europa.eu' };
      if (j.includes('united states') || j.includes('us')) return { code: 'SEC / CFTC', name: 'US Securities & Exchange Commission', domain: 'sec.gov' };
      if (j.includes('japan')) return { code: 'JFSA', name: 'Financial Services Agency of Japan', domain: 'fsa.go.jp' };
      if (j.includes('australia')) return { code: 'APRA / ASIC', name: 'Australian Prudential Regulation Authority', domain: 'apra.gov.au' };
      if (j.includes('china')) return { code: 'NFRA / CSRC', name: 'National Financial Regulatory Administration', domain: 'nfra.gov.cn' };
      if (j.includes('hong kong')) return { code: 'HKMA', name: 'Hong Kong Monetary Authority', domain: 'hkma.gov.hk' };
      return { code: `${jur.slice(0, 3).toUpperCase()}-REG`, name: `${jur} Regulatory Authority`, domain: `${jur.toLowerCase().replace(/[^a-z]/g, '')}.gov` };
    };

    const currentTotalQuestions = task.questions.length;
    const newQuestions: TaskQuestion[] = payload.questions.map((qText, idx) => {
      const qId = `q-${Date.now()}-${idx + 1}`;
      const globalIndex = currentTotalQuestions + idx + 1;
      const batchIndex = idx + 1;

      const retrievedUrls: RetrievedUrlItem[] = [];
      const citations: CitationItem[] = [];

      targetJurs.forEach((tJur, tIdx) => {
        const auth = getAuthorityForJur(tJur);
        const urlItem: RetrievedUrlItem = {
          id: `url-${qId}-${tIdx + 1}`,
          title: `${auth.code} Statutory Notice & Compliance Guidance (${tJur})`,
          url: `https://www.${auth.domain}/guidance/batch-${nextBatchNumber}/`,
          authority: auth.code,
          jurisdiction: tJur,
          publishDate: '2026-03-22',
          relevanceTag: 'Authoritative Official Source',
          isBookmarked: false,
          isFollowed: true,
          rationale: `Directly assesses: "${qText.slice(0, 70)}..." under ${tJur} statutory guidelines.`,
          excerpt: `Institutions governed by ${auth.code} must maintain ongoing records and observe statutory notification criteria.`,
          docType: 'Guideline',
        };
        retrievedUrls.push(urlItem);

        citations.push({
          pin: `${auth.code} Directive §${nextBatchNumber}.${idx + 1}`,
          sourceTitle: `${auth.code} Statutory Directive (${tJur})`,
          url: urlItem.url,
          clause: `Section ${nextBatchNumber}.${idx + 1} Operational Criteria`,
          excerpt: `Licensed entities must ensure compliance controls align with supervisory directives in ${tJur}.`,
        });
      });

      const targetJurStr = targetJurs.join(', ');
      const llmAnswer = `### Batch Inquiry Assessment (${batchLabel} • ${targetJurStr})
Supervisory synthesis generated for: **${qText}**

1. **Target Legal Baselines (${targetJurStr}):**
${targetJurs.map((tj) => `   - **${tj}**: Statutory benchmarks mandate robust risk controls, direct supervisory audit access, and proactive disclosure.`).join('\n')}

2. **Compliance Conclusion:**
   Requirements are currently categorized as conditional/permitted subject to filing and notification requirements under local supervisory rules.`;

      return {
        id: qId,
        globalIndex,
        batchIndex,
        batchNumber: nextBatchNumber,
        batchLabel,
        targetJurisdictions: [...targetJurs],
        questionText: qText,
        status: 'Answered',
        summary: `Synthesized across ${targetJurs.length} target jurisdictions for ${batchLabel}.`,
        retrievedUrls,
        llmAnswer,
        citations,
        createdAt: nowStr,
      };
    });

    task.batches.push({
      batchNumber: nextBatchNumber,
      batchLabel,
      createdAt: nowStr,
      targetJurisdictions: [...targetJurs],
      questionCount: newQuestions.length,
      clarificationNotes: payload.clarificationNotes,
    });

    task.questions.push(...newQuestions);

    // Merge target jurisdictions into task if new ones were added
    if (task.targetJurisdictions) {
      targetJurs.forEach((tj) => {
        if (!task.targetJurisdictions?.includes(tj)) {
          task.targetJurisdictions?.push(tj);
        }
      });
      task.targetJurisdiction = task.targetJurisdictions.join(', ');
      task.jurisdiction = `${task.homeJurisdiction || 'Hong Kong'} ➔ ${task.targetJurisdiction}`;
    }

    task.updatedAt = nowStr;
    persist();
    return newQuestions;
  };

  // Toggle URL Bookmark inside a task
  const toggleUrlBookmark = (taskId: string, questionId: string, urlId: string): boolean => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return false;
    const q = task.questions.find((qu) => qu.id === questionId);
    if (!q) return false;
    const targetUrl = q.retrievedUrls.find((u) => u.id === urlId);
    if (!targetUrl) return false;

    targetUrl.isBookmarked = !targetUrl.isBookmarked;
    persist();
    return targetUrl.isBookmarked;
  };

  // Toggle URL Authority Follow inside a task
  const toggleUrlFollow = (taskId: string, questionId: string, urlId: string): boolean => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return false;
    const q = task.questions.find((qu) => qu.id === questionId);
    if (!q) return false;
    const targetUrl = q.retrievedUrls.find((u) => u.id === urlId);
    if (!targetUrl) return false;

    targetUrl.isFollowed = !targetUrl.isFollowed;
    persist();
    return targetUrl.isFollowed;
  };

  // Link news to task
  const linkNewsToTask = (taskId: string, newsId: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    if (!task.linkedNewsIds.includes(newsId)) {
      task.linkedNewsIds.push(newsId);
      task.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      persist();
    }
  };

  // Unlink news from task (removes any alias representation of that document)
  const unlinkNewsFromTask = (taskId: string, newsId: string, title?: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    const queryTokens = getDocCanonicalTokens(newsId, title);
    task.linkedNewsIds = task.linkedNewsIds.filter((id) => {
      const idTokens = getDocCanonicalTokens(id);
      for (const t of idTokens) {
        if (queryTokens.has(t)) return false;
      }
      return true;
    });
    task.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    persist();
  };

  // Link regulator to task
  const linkRegulatorToTask = (taskId: string, regulatorId: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    if (!task.linkedRegulatorIds.includes(regulatorId)) {
      task.linkedRegulatorIds.push(regulatorId);
      task.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
      persist();
    }
  };

  // Unlink regulator from task
  const unlinkRegulatorFromTask = (taskId: string, regulatorId: string) => {
    const task = tasks.value.find((t) => t.id === taskId);
    if (!task) return;
    task.linkedRegulatorIds = task.linkedRegulatorIds.filter((id) => id !== regulatorId);
    task.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    persist();
  };

  // Delete a task
  const deleteTask = (taskId: string) => {
    tasks.value = tasks.value.filter((t) => t.id !== taskId);
    if (activeTaskId.value === taskId) {
      activeTaskId.value = null;
    }
    persist();
  };

  return {
    tasks,
    activeTaskId,
    activeTask,
    getNewsLinkageCount,
    getTasksForNews,
    getRegulatorLinkageCount,
    getTasksForRegulator,
    createTask,
    addBatchQuestionsToTask,
    linkNewsToTask,
    unlinkNewsFromTask,
    linkRegulatorToTask,
    unlinkRegulatorFromTask,
    toggleUrlBookmark,
    toggleUrlFollow,
    deleteTask,
  };
});
