import {
  MatrixSessionState,
  MatrixComplianceStatus,
  MatrixJurisdictionItem,
  MatrixQuestionItem,
  MatrixCellData,
  JurisdictionPreset,
  MatrixCitationItem
} from '../types';

export const ALL_AVAILABLE_JURISDICTIONS: MatrixJurisdictionItem[] = [
  { code: 'HK', name: 'Hong Kong', regulatorAcronym: 'HKMA / CR', complianceStatus: 'compliant' },
  { code: 'SG', name: 'Singapore', regulatorAcronym: 'MAS / ACRA', complianceStatus: 'conditional' },
  { code: 'UK', name: 'United Kingdom', regulatorAcronym: 'FCA / Companies House', complianceStatus: 'compliant' },
  { code: 'US', name: 'United States', regulatorAcronym: 'SEC / Delaware SOS', complianceStatus: 'conditional' },
  { code: 'AU', name: 'Australia', regulatorAcronym: 'ASIC / APRA', complianceStatus: 'conditional' },
  { code: 'JP', name: 'Japan', regulatorAcronym: 'FSA / MOJ', complianceStatus: 'prohibited' },
  { code: 'EU', name: 'European Union', regulatorAcronym: 'EBA / ESMA', complianceStatus: 'conditional' },
  { code: 'ID', name: 'Indonesia', regulatorAcronym: 'OJK / BI', complianceStatus: 'inconclusive' }
];

export const INITIAL_JURISDICTION_PRESETS: JurisdictionPreset[] = [
  {
    id: 'preset-sea-3',
    name: 'Singapore, Hong Kong, Indonesia',
    description: 'Covers Singapore, Hong Kong, and Indonesia',
    jurisdictionCodes: ['SG', 'HK', 'ID']
  },
  {
    id: 'preset-west-2',
    name: 'United States, United Kingdom',
    description: 'Covers United States and United Kingdom',
    jurisdictionCodes: ['US', 'UK']
  },
  {
    id: 'preset-core-4',
    name: 'Hong Kong, Singapore, United Kingdom, United States',
    description: 'Covers Hong Kong, Singapore, United Kingdom, and United States',
    jurisdictionCodes: ['HK', 'SG', 'UK', 'US']
  },
  {
    id: 'preset-apac-4',
    name: 'Hong Kong, Singapore, Australia, Japan',
    description: 'Covers Hong Kong, Singapore, Australia, and Japan',
    jurisdictionCodes: ['HK', 'SG', 'AU', 'JP']
  }
];

export const SAMPLE_QUESTION_SETS = [
  {
    category: 'Corporate Governance & Statutory Filings',
    questions: [
      'Can a body corporate serve as a company secretary in this jurisdiction? What registered office or local presence conditions apply?',
      'What are the anti-avoidance restrictions on sole directors concurrently acting as or appointing a corporate secretary?',
      'What statutory filing deadlines and regulatory licensing (e.g. TCSP/ACSP) apply to corporate secretarial service providers?'
    ]
  },
  {
    category: 'Cloud Outsourcing & Operational Resilience',
    questions: [
      'What are the mandatory contractual inspection and multi-tier subcontracting audit rights for cloud service providers?',
      'What explicit Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) are prescribed for critical banking operations?',
      'Does the supervisory authority require advance notification, approval, or independent SOC 2 Type II assurance prior to public cloud migration?'
    ]
  },
  {
    category: 'AI Governance & Model Risk',
    questions: [
      'What risk assessment frameworks and human-in-the-loop controls are required for high-risk generative AI deployment?',
      'What customer consent and data tokenization rules govern cross-border training data ingestion under financial secrecy laws?'
    ]
  }
];

// Session 1: Corporate Secretary & Body Corporate Eligibility
export const initialMatrixSession1: MatrixSessionState = {
  sessionId: 'matrix-sess-corp-sec',
  sessionTitle: 'Corporate Secretary Eligibility & Cross-Border Compliance Matrix',
  activeQuestionIndex: 0,
  activeJurisdictionCode: 'HK',
  createdAt: '2026-09-17 14:30:00 UTC',
  updatedAt: '2026-09-17 18:22:00 UTC',
  creator: 'Ivan Choy (Lead Compliance Officer)',
  isSaved: true,
  isLoading: false,
  questions: [
    {
      questionId: 'q-1',
      questionText: 'Can a body corporate serve as a company secretary in this jurisdiction? What registered office or local presence conditions apply?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] Permissibility of corporate secretaries reflects a clear jurisdictional divide: Hong Kong (Cap. 622 §474(4)) and the UK (Companies Act 2006 §270-271) expressly permit corporate entities to act as secretaries, provided a registered office or place of business is maintained locally. Conversely, Singapore (Companies Act 1967 §171(1AA)) strictly prohibits body corporate secretaries, mandating an ordinarily resident natural person. In the US (e.g. Delaware DGCL §142), corporate officers are typically individuals, while commercial registered agents can be corporate bodies.'
    },
    {
      questionId: 'q-2',
      questionText: 'What are the anti-avoidance restrictions on sole directors concurrently acting as or appointing a corporate secretary?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] Preventing sole-individual circumvention is a shared priority across jurisdictions. Hong Kong strictly prohibits a sole director from appointing a corporate secretary where they are also the sole director (Cap. 622 §475(2)). The UK prohibits execution of deeds by the same individual in dual capacities under CA 2006 §280. Singapore strictly bars sole directors from acting as natural person secretary under §171(1E). In Delaware, while state law allows multiple offices, public entities are constrained by SEC and Sarbanes-Oxley internal control requirements.'
    },
    {
      questionId: 'q-3',
      questionText: 'What statutory filing deadlines and regulatory licensing (e.g. TCSP/ACSP) apply to corporate secretarial service providers?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] Service provider licensing and AML/CFT supervision are universal requirements. Hong Kong enforces TCSP licensing (Cap. 615) with a 15-day Form ND2A filing requirement; Singapore enforces Registered CSP certification and a 14-day BizFile+ window; the UK mandates Authorised Corporate Service Provider (ACSP) registration under ECCTA 2023 with a 14-day AP04 filing; and the US mandates Beneficial Ownership Information (BOI) reporting via FinCEN.'
    }
  ],
  jurisdictions: [
    { code: 'HK', name: 'Hong Kong', regulatorAcronym: 'HKMA / CR', complianceStatus: 'compliant' },
    { code: 'SG', name: 'Singapore', regulatorAcronym: 'MAS / ACRA', complianceStatus: 'prohibited' },
    { code: 'UK', name: 'United Kingdom', regulatorAcronym: 'FCA / Companies House', complianceStatus: 'compliant' },
    { code: 'US', name: 'United States', regulatorAcronym: 'SEC / Delaware SOS', complianceStatus: 'conditional' }
  ],
  matrixCells: {
    // Q1 x HK
    'q-1_HK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: 'Fully Permitted (Subject to Local Presence)',
      answerMarkdown: `### Hong Kong SAR: Corporate Body Fully Permitted (Subject to Local Presence Condition)

Pursuant to Section 474(4) of the Companies Ordinance (Cap. 622) [Cap. 622 §474(4)], **a body corporate is explicitly eligible to be appointed as the company secretary of a Hong Kong incorporated company**, subject to local nexus criteria:

1. **Registered Office / Place of Business Nexus**: The body corporate must maintain its registered office or an established place of business in Hong Kong. Offshore incorporated entities (e.g., Cayman or BVI entities) must be registered under Part 16 as a registered non-Hong Kong company and possess a valid Business Registration Certificate.
2. **Statutory Powers & Signature Authority**: A corporate secretary owes identical statutory fiduciary duties as an individual. Regulatory filings (such as Annual Return Form NAR1) must be signed by an authorized director or designated representative under corporate seal [CR Circular 2024/02].
3. **TCSP Licensing Prerequisite**: If the body corporate offers company secretarial services to third parties by way of business, it must obtain and maintain a valid **Trust or Company Service Provider (TCSP) Licence** issued by the Registrar of Companies under Cap. 615 §53G.`,
      keyTakeaways: [
        'Under Cap. 622 §474(4), body corporate is permitted to act as company secretary.',
        'Registered office or place of business must be situated within Hong Kong.',
        'Providing commercial services requires a valid Cap. 615 TCSP licence.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-hk-cap622-474',
          sourceTitle: 'Companies Ordinance (Cap. 622) - Section 474: Company Secretary',
          authority: 'Hong Kong Companies Registry',
          regulatorAcronym: 'CR',
          effectiveDate: '2014-03-03 (Consolidated 2024)',
          sourceUrl: 'https://www.elegislation.gov.hk/hk/cap622!en@2024-01-01',
          excerpt: 'Section 474(4): If the company secretary is a body corporate, its registered office or a place of business must be in Hong Kong.',
          highlightedTerms: ['body corporate', 'registered office or a place of business must be in Hong Kong'],
          sha256: '9f83a41b2c5890e0b3d87e02315a67c4f4201bfa829104de0f9b69b82e3fa021',
          relevanceScore: 98,
          relevanceTag: 'Mandatory Statutory Condition'
        },
        {
          citationId: 'cit-hk-cap615-tcsp',
          sourceTitle: 'Anti-Money Laundering and Counter-Terrorist Financing Ordinance (Cap. 615) Part 5A',
          authority: 'Companies Registry / HKMA',
          regulatorAcronym: 'CR / HKMA',
          effectiveDate: '2018-03-01',
          sourceUrl: 'https://www.tcsp.cr.gov.hk/tcspls/index',
          excerpt: 'Section 53G: A person commits an offence if the person carries on a trust or company service business in Hong Kong without a licence granted under this Part.',
          highlightedTerms: ['carries on a trust or company service business', 'without a licence'],
          sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          relevanceScore: 94,
          relevanceTag: 'Licensing Prerequisite'
        }
      ],
      followUps: [
        {
          id: 'fu-init-1',
          index: 1,
          timestamp: '11:39:18 AM',
          jurisdictionName: 'Hong Kong',
          jurisdictionCode: 'HK',
          questionNumber: 1,
          queryText: 'Does this local presence exemption apply to overseas branches or subsidiary holding vehicles without full-time staff?',
          findingText: 'Under Cap. 622 §474(4) and Companies Registry Guideline GN-2024/01, maintaining a place of business requires demonstrable physical premises and record-keeping capability in Hong Kong. Mere postal registration without designated local authorized representatives fails statutory substance scrutiny, triggering mandatory supervisory inquiries under Cap. 615 §53Z.'
        }
      ]
    },

    // Q1 x SG
    'q-1_SG': {
      complianceStatus: 'prohibited',
      statusBadgeLabel: 'Strictly Prohibited (Natural Person Only)',
      answerMarkdown: `### Republic of Singapore: Corporate Body Strictly Prohibited (Natural Person Only)

Pursuant to Section 171(1AA) of the Singapore Companies Act 1967 [SG Companies Act §171(1AA)], **Singapore company law strictly bars corporate bodies from serving as company secretaries**:

1. **Natural Person Requirement**: The statute mandates that every company secretary must be a natural person who is ordinarily resident in Singapore (citizen, permanent resident, or EntrePass / valid employment pass holder).
2. **Void ab Initio Appointment**: Any board resolution or constitutional provision purporting to appoint a domestic corporate entity, offshore entity, or consultancy firm as company secretary is null and void ab initio.
3. **Qualified Professional Requirement**: For public companies, the appointed natural person must possess prescribed professional qualifications (e.g., SAICSA member, ISCA chartered accountant, or advocate/solicitor with 3+ years experience) [ACRA Practice Direction No. 2 of 2020].
4. **Third-Party Service Provider Structure**: Corporate Service Providers (CSPs) assign qualified individual employees to act as the registered secretary on behalf of client companies.`,
      keyTakeaways: [
        'Singapore strictly prohibits body corporate secretaries (Companies Act §171(1AA)).',
        'Secretary must be an ordinarily resident natural person in Singapore.',
        'CSPs must designate qualified natural person representatives for ACRA registration.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-sg-ca1967-171',
          sourceTitle: 'Singapore Companies Act 1967 (2020 Revised Edition) - Section 171: Secretary',
          authority: 'Accounting and Corporate Regulatory Authority (ACRA)',
          regulatorAcronym: 'ACRA',
          effectiveDate: '1967-12-29 (Rev. 2020)',
          sourceUrl: 'https://sso.agc.gov.sg/Act/CoA1967#pr171-',
          excerpt: 'Section 171(1AA): The secretary must be a natural person who has his or her principal or only place of residence in Singapore. A body corporate is not eligible to be appointed as secretary.',
          highlightedTerms: ['must be a natural person', 'A body corporate is not eligible to be appointed as secretary'],
          sha256: '84920485a0219483018247dbac29038294719283401928491823901928471928',
          relevanceScore: 99,
          relevanceTag: 'Express Statutory Prohibition'
        }
      ]
    },

    // Q1 x UK
    'q-1_UK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: 'Fully Permitted (Corporate Secretary Allowed)',
      answerMarkdown: `### United Kingdom: Corporate Body Permitted (Optional for Private Companies)

Under the UK Companies Act 2006 (CA 2006) Sections 270 to 276:

1. **Private Company Exemption**: Since April 2008, private limited companies are no longer statutorily required to appoint a company secretary unless explicitly mandated by their Articles of Association.
2. **Corporate Secretary Eligibility**: Where a secretary is appointed voluntarily (or for public PLCs), a **body corporate is legally eligible to act as company secretary**.
3. **Identity Verification (ECCTA 2023)**: Under the Economic Crime and Corporate Transparency Act 2023, corporate secretaries and their underlying officers must undergo identity verification (IDV) with Companies House to maintain registration validity.`,
      keyTakeaways: [
        'UK Companies Act 2006 permits body corporate secretaries.',
        'Private limited companies are exempt from mandatory secretarial appointment unless required by articles.',
        'Under ECCTA 2023, key corporate secretary officers must undergo identity verification.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-uk-ca2006-271',
          sourceTitle: 'UK Companies Act 2006 - Chapter 12: Company Secretaries (Section 271-276)',
          authority: 'Companies House / Insolvency Service',
          regulatorAcronym: 'Companies House',
          effectiveDate: '2006-11-08',
          sourceUrl: 'https://www.legislation.gov.uk/ukpga/2006/46/part/12',
          excerpt: 'Section 276: A body corporate may be appointed as a company secretary, provided its registered or principal office particulars are filed with the registrar under section 277.',
          highlightedTerms: ['A body corporate may be appointed as a company secretary', 'registered or principal office'],
          sha256: '4720194820193857102948271039482710394827103948271039482710394827',
          relevanceScore: 97,
          relevanceTag: 'Statutory Permission & Governance'
        }
      ]
    },

    // Q1 x US
    'q-1_US': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Conditional (Registered Agent vs. Corporate Officer)',
      answerMarkdown: `### United States (Delaware DGCL Baseline): Role Distinction & Legal Framework

Corporate governance in the United States is governed at the state level, with the Delaware General Corporation Law (DGCL) serving as the prevailing benchmark:

1. **Corporate Secretary (Executive Officer)**: Under DGCL §142, corporations must appoint officers with duties defined in corporate bylaws. The secretary position is customarily held by natural persons bound by personal fiduciary duties of loyalty and care.
2. **Registered Agent (DGCL §132)**: Foreign practitioners frequently conflate company secretarial roles with registered agents. Delaware law requires every entity to maintain a registered agent within the state; **qualified corporate bodies (corporations or LLCs) are widely permitted and customary as commercial registered agents**.
3. **LLC Flexibility**: For Delaware LLCs, operating agreements offer broad contractual freedom, allowing corporate managing members to execute secretarial and archival responsibilities.`,
      keyTakeaways: [
        'Corporate officers are typically natural persons bearing individual fiduciary duties.',
        'Commercial registered agents are legally authorized to be corporate bodies.',
        'Delaware LLCs enjoy broad contractual freedom to delegate secretarial tasks to corporate managers.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-us-dgcl-142',
          sourceTitle: 'Delaware General Corporation Law (Title 8, Chapter 1) - Subchapter IV: Officers §142',
          authority: 'Delaware Division of Corporations',
          regulatorAcronym: 'Delaware SOS',
          effectiveDate: 'Consolidated 2024',
          sourceUrl: 'https://delcode.delaware.gov/title8/c001/sc04/',
          excerpt: 'DGCL §142(a): Every corporation shall have such officers with such titles and duties as shall be stated in the bylaws or in a resolution of the board of directors... One of the officers shall have the duty to record the proceedings of the meetings of stockholders and directors.',
          highlightedTerms: ['duty to record the proceedings of the meetings', 'officers'],
          sha256: '9840192840192840192840192840192840192840192840192840192840192840',
          relevanceScore: 92,
          relevanceTag: 'State Statutory Standard'
        }
      ]
    },

    // Q2 x HK
    'q-2_HK': {
      complianceStatus: 'prohibited',
      statusBadgeLabel: 'Strict Prohibition (Anti-Avoidance Shield)',
      answerMarkdown: `### Hong Kong SAR: Sole Director Prohibited from Appointing Wholly-Owned Corporate Secretary

Under Section 475(2) of the Companies Ordinance (Cap. 622), an explicit anti-avoidance safeguard governs sole directorships:

1. **Anti-Avoidance Veil Piercing Rule**: A private company having only one director **must not have as secretary of the company a body corporate the sole director of which is the sole director of the company**.
2. **Legislative Intent**: Cap. 622 §475(1) already prevents a sole director from acting directly as company secretary. Subsection (2) closes the loophole of establishing a 100%-owned single-director corporate secretarial shell to circumvent governance checks.
3. **Consequences of Non-Compliance**: Any appointment violating this rule is legally invalid, exposing the entity and responsible officers to daily continuing criminal fines under Cap. 622 §474.`,
      keyTakeaways: [
        'Sole director cannot appoint a corporate secretary where they are the sole director (Cap. 622 §475(2)).',
        'Prevents sole directors from bypassing dual-signatory checks via single-member corporate vehicles.',
        'Violative appointments are void ab initio and subject to recurring statutory penalties.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-hk-cap622-475',
          sourceTitle: 'Companies Ordinance (Cap. 622) - Section 475: Restrictions on sole director being secretary',
          authority: 'Hong Kong Companies Registry',
          regulatorAcronym: 'CR',
          effectiveDate: '2014-03-03',
          sourceUrl: 'https://www.elegislation.gov.hk/hk/cap622!en@2024-01-01',
          excerpt: 'Section 475(2): A private company having only one director must not have as secretary of the company a body corporate the sole director of which is the sole director of the company.',
          highlightedTerms: ['must not have as secretary of the company a body corporate', 'the sole director of which is the sole director of the company'],
          sha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          relevanceScore: 99,
          relevanceTag: 'Strict Statutory Prohibition'
        }
      ]
    },

    // Q2 x SG
    'q-2_SG': {
      complianceStatus: 'prohibited',
      statusBadgeLabel: 'Double Layer Prohibition',
      answerMarkdown: `### Republic of Singapore: Dual Statutory Barrier Against Sole Director Self-Appointment

Singapore law establishes a comprehensive dual-layer statutory prohibition:

1. **First Barrier (Corporate Body Ineligibility)**: Because §171(1AA) prohibits corporate bodies from being appointed as secretaries, sole directors cannot circumvent the rules through an interposed corporate vehicle.
2. **Second Barrier (Natural Person Sole Director Restriction)**: Section 171(1E) expressly provides that a sole director of a company **shall not also act or be appointed as the secretary of the company**.
3. **Dual Execution Invalidation**: Under Section 171(2), any statutory document requiring concurrent execution by both a director and a secretary cannot be executed by the same individual acting in both capacities.`,
      keyTakeaways: [
        'Section 171(1AA) prevents body corporate appointments.',
        'Section 171(1E) expressly bars sole directors from acting as natural person secretary.',
        'Dual-signature documents executed in both capacities are legally ineffective.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-sg-ca1967-171-1e',
          sourceTitle: 'Singapore Companies Act 1967 Section 171(1E) & (2)',
          authority: 'ACRA',
          regulatorAcronym: 'ACRA',
          effectiveDate: 'Rev. 2020',
          sourceUrl: 'https://sso.agc.gov.sg/Act/CoA1967#pr171-',
          excerpt: 'Section 171(1E): A sole director of a company shall not also act or be appointed as the secretary of the company. Subsection (2): A provision requiring or authorising a thing to be done by or to a director and the secretary shall not be satisfied by its being done by or to the same person acting both as director and as, or in place of, the secretary.',
          highlightedTerms: ['shall not also act or be appointed as the secretary', 'shall not be satisfied by its being done by or to the same person'],
          sha256: '999888777666555444333222111000aaabbbcccdddeeefff1112223334445556',
          relevanceScore: 98,
          relevanceTag: 'Dual Mandatory Statutory Restriction'
        }
      ]
    },

    // Q2 x UK
    'q-2_UK': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Procedural Deed Invalidation Restriction',
      answerMarkdown: `### United Kingdom: Prohibition of Twin Acts on Deeds Execution

Section 280 of the UK Companies Act 2006 (CA 2006 §280) restricts dual-capacity legal execution:

1. **Statutory Deed Protection**: Where legal deeds or statutory documents require execution by both a director and a secretary, the requirement **is not satisfied by its being executed by the same person acting both as director and secretary** (or authorized signatory for a corporate secretary).
2. **Sole Director Execution Alternative**: Private companies with sole directors can bypass secretarial execution by executing deeds under Section 44(2)(b) (signed by the sole director in the presence of an independent witness).`,
      keyTakeaways: [
        'CA 2006 §280 prevents identical individual executing deeds concurrently as director and secretary.',
        'Sole directors may execute deeds under §44(2)(b) in the presence of an independent witness.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-uk-ca2006-280',
          sourceTitle: 'UK Companies Act 2006 - Section 280: Prohibition of twin acts',
          authority: 'Companies House',
          regulatorAcronym: 'Companies House',
          effectiveDate: '2006-11-08',
          sourceUrl: 'https://www.legislation.gov.uk/ukpga/2006/46/section/280',
          excerpt: 'Section 280: A provision requiring or authorising a thing to be done by or to a director and the secretary is not satisfied by its being done by or to the same person acting both as director and as, or in place of, the secretary.',
          highlightedTerms: ['is not satisfied by its being done by or to the same person', 'acting both as director and as secretary'],
          sha256: 'abc123def45678901234567890abcdef1234567890abcdef1234567890abcdef',
          relevanceScore: 95,
          relevanceTag: 'Procedural Invalidation'
        }
      ]
    },

    // Q2 x US
    'q-2_US': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Permitted in Delaware, Restrained in SOX',
      answerMarkdown: `### United States (Delaware DGCL): Permitted at State Law; Constrained by SEC & SOX

1. **State Corporate Law Flexibility (DGCL §142(a))**: Delaware General Corporation Law specifies that any number of offices may be held by the same person unless prohibited by corporate bylaws. Consequently, a sole director may serve simultaneously as President, Treasurer, and Secretary.
2. **Federal Securities & Exchange Governance**: For public reporting companies or institutions raising capital, Sarbanes-Oxley Act §404 and SEC/NYSE listing rules mandate segregation of key functions and independent oversight, effectively precluding single-person governance.`,
      keyTakeaways: [
        'DGCL §142(a) permits one person to hold multiple executive offices.',
        'Public entities remain bound by SEC and Sarbanes-Oxley governance separation rules.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-us-dgcl-142a',
          sourceTitle: 'Delaware General Corporation Law §142(a)',
          authority: 'Delaware SOS',
          regulatorAcronym: 'Delaware SOS',
          effectiveDate: 'Consolidated 2024',
          sourceUrl: 'https://delcode.delaware.gov/title8/c001/sc04/',
          excerpt: 'DGCL §142(a): Any number of offices may be held by the same person unless the certificate of incorporation or bylaws otherwise provide.',
          highlightedTerms: ['Any number of offices may be held by the same person'],
          sha256: 'fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321',
          relevanceScore: 93,
          relevanceTag: 'Statutory Authorization'
        }
      ]
    },

    // Q3 x HK
    'q-3_HK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: '15-Day CR Filing + TCSP Mandatory Licence',
      answerMarkdown: `### Hong Kong SAR: 15-Day Statutory Notification & Cap. 615 TCSP Licensing Regime

1. **15-Day Statutory Notification Period**:
   - Notice of appointment, cessation, or change of particulars of a company secretary must be delivered to the Companies Registry within **15 days** using Form **ND2A** or **ND2B** [Cap. 622 §645].
   - Failure to file within the statutory timeframe constitutes an offense punishable by level 3 fines and daily default penalties.
2. **TCSP Licensing Regime (Cap. 615 Part 5A)**:
   - Under Section 53G of the Anti-Money Laundering and Counter-Terrorist Financing Ordinance (Cap. 615), providing company secretarial or registered office services by way of business requires a **TCSP Licence** issued by the Registrar of Companies.
   - Licensees must satisfy stringent Fit and Proper criteria, maintain customer due diligence records, and conduct transaction screening. Operating without a license carries maximum penalties of HK$100,000 fine and 6 months imprisonment.`,
      keyTakeaways: [
        'Deliver Form ND2A/ND2B to Companies Registry within 15 days.',
        'Providing commercial services requires a Cap. 615 TCSP licence.',
        'Unlicensed practice carries penalties up to HK$100,000 fine and 6 months imprisonment.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-hk-nd2a-cap622',
          sourceTitle: 'Cap. 622 Companies Ordinance - Section 645 & Companies Registry Guidance Note 2/2023',
          authority: 'Companies Registry',
          regulatorAcronym: 'CR',
          effectiveDate: '2023-04-01',
          sourceUrl: 'https://www.cr.gov.hk/en/services/specified-forms.htm',
          excerpt: 'Section 645: A company must, within 15 days after an appointment or cessation of a secretary or director, file a notice in specified form ND2A with the Registrar.',
          highlightedTerms: ['within 15 days after an appointment or cessation', 'form ND2A'],
          sha256: '555444333222111000fffdddeeecccbbbaaa999888777666555444333222111000',
          relevanceScore: 99,
          relevanceTag: 'Statutory Filing Deadline'
        },
        {
          citationId: 'cit-hk-tcsp-guideline',
          sourceTitle: 'Guideline on Compliance of Anti-Money Laundering Requirements for Trust or Company Service Providers',
          authority: 'Companies Registry Registry for TCSPs',
          regulatorAcronym: 'CR',
          effectiveDate: '2023-06-01',
          sourceUrl: 'https://www.tcsp.cr.gov.hk/tcspls/index',
          excerpt: 'Guideline §3.2: Licensed TCSPs must perform customer due diligence (CDD) before establishing business relationships and report suspicious transactions to JFIU without delay.',
          highlightedTerms: ['customer due diligence', 'Licensed TCSPs must'],
          sha256: '111222333444555666777888999000aaabbbcccdddeeefff1234567890abcdef',
          relevanceScore: 96,
          relevanceTag: 'AML/CFT Compliance Mandate'
        }
      ]
    },

    // Q3 x SG
    'q-3_SG': {
      complianceStatus: 'conditional',
      statusBadgeLabel: '14-Day BizFile+ & ACRA CSP Bill Mandatory Registration',
      answerMarkdown: `### Republic of Singapore: 14-Day BizFile+ Filing & ACRA CSP Act 2024 Regime

1. **14-Day ACRA Filing Timeline**:
   - Pursuant to Section 173 of the Companies Act 1967, appointment, resignation, or removal of a company secretary must be lodged electronically via ACRA BizFile+ within **14 days**.
2. **Corporate Service Providers Act 2024 (CSP Act)**:
   - In 2024, Singapore enacted the CSP Act to enhance AML/CFT supervision over corporate secretarial entities.
   - All entities providing company secretary or registered office services in Singapore must register as Registered Corporate Service Providers (Registered CSPs), and their senior executives must register as Qualified Individuals (QIs).
   - Penalties for AML breaches and failure to verify beneficial ownership have been increased to SGD 100,000 alongside potential license revocation.`,
      keyTakeaways: [
        'Lodge secretarial appointments or changes via ACRA BizFile+ within 14 days.',
        'The CSP Act 2024 strengthens AML/CFT compliance obligations for registered service providers.',
        'Non-compliance with AML due diligence thresholds carries fines up to SGD 100,000.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-sg-acra-173',
          sourceTitle: 'Singapore Companies Act 1967 - Section 173: Registers of directors, secretaries, auditors',
          authority: 'ACRA',
          regulatorAcronym: 'ACRA',
          effectiveDate: 'Rev. 2020',
          sourceUrl: 'https://sso.agc.gov.sg/Act/CoA1967#pr173-',
          excerpt: 'Section 173(6): Notice in the prescribed form of the appointment of a secretary must be lodged with the Registrar within 14 days after the appointment.',
          highlightedTerms: ['within 14 days after the appointment', 'prescribed form'],
          sha256: '9876543210abcdef9876543210abcdef9876543210abcdef9876543210abcdef',
          relevanceScore: 98,
          relevanceTag: 'Statutory Filing Deadline'
        }
      ]
    },

    // Q3 x UK
    'q-3_UK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: '14-Day Form AP04 & ECCTA ACSP Authorization',
      answerMarkdown: `### United Kingdom: 14-Day Companies House Notification & ECCTA ACSP Regime

1. **14-Day Notification Deadline**:
   - Appointment of individual secretaries requires Form AP03; corporate secretaries require Form **AP04**. Notices of change require Form CH03/CH04 within **14 days** of the change.
2. **Authorised Corporate Service Provider (ACSP) Regime**:
   - Under the Economic Crime and Corporate Transparency Act 2023 (ECCTA), third-party secretarial firms filing statutory submissions on behalf of clients must be verified as **Authorised Corporate Service Providers (ACSPs)**.
   - ACSPs must be supervised by an AML supervisory body (such as ICAEW, ACCA, or HMRC) and assume legal responsibility for verifying client beneficial owners.`,
      keyTakeaways: [
        'Submit Form AP04 to Companies House within 14 days for corporate secretary appointments.',
        'Filing on behalf of clients under ECCTA 2023 requires verified ACSP status.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-uk-ap04-ca2006',
          sourceTitle: 'Companies Act 2006 Section 276 & Companies House Guidance (Form AP04)',
          authority: 'Companies House',
          regulatorAcronym: 'Companies House',
          effectiveDate: 'Consolidated 2024',
          sourceUrl: 'https://www.gov.uk/government/publications/appoint-a-corporate-secretary-ap04',
          excerpt: 'Section 276(1): Notice of appointment of a secretary must be given to the registrar within 14 days of the appointment.',
          highlightedTerms: ['within 14 days of the appointment', 'Notice of appointment of a secretary'],
          sha256: '1234432112344321123443211234432112344321123443211234432112344321',
          relevanceScore: 97,
          relevanceTag: 'Filing Statutory Window'
        }
      ]
    },

    // Q3 x US
    'q-3_US': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Annual Franchise Report & FinCEN BOI Reporting',
      answerMarkdown: `### United States: Annual Franchise Tax Report & FinCEN Beneficial Ownership Reporting

1. **Franchise Tax Filing Cadence**:
   - Delaware corporations update current officer and director rosters annually via the **Annual Franchise Tax Report due on or before March 1** each year. Immediate event-driven filings are not required for internal officer updates.
2. **FinCEN Corporate Transparency Act (CTA) Mandates**:
   - Under the Corporate Transparency Act (CTA), entities must file Beneficial Ownership Information (BOI) reports with the Financial Crimes Enforcement Network (FinCEN). Third-party formations agents and secretaries assisting with entity organization may be classified as "Company Applicants" with statutory reporting accountability.`,
      keyTakeaways: [
        'Annual Franchise Tax Report updates current officer roster by March 1 annually.',
        'Commercial registered agents must comply with DGCL §132 statutory criteria.',
        'Adhere to FinCEN BOI reporting rules with statutory duties for company applicants.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-us-del-annual-tax',
          sourceTitle: 'Delaware Code Title 8 §502: Annual franchise tax report',
          authority: 'Delaware Division of Corporations',
          regulatorAcronym: 'Delaware SOS',
          effectiveDate: 'Consolidated 2024',
          sourceUrl: 'https://delcode.delaware.gov/title8/c005/index.html',
          excerpt: 'Section 502(a): Annually on or before March 1, every corporation shall file an annual franchise tax report stating the names and addresses of all the directors and officers.',
          highlightedTerms: ['names and addresses of all the directors and officers', 'annual franchise tax report'],
          sha256: '777888999000aaabbbcccdddeeefff111222333444555666777888999000111222',
          relevanceScore: 94,
          relevanceTag: 'Annual Governance Mandate'
        }
      ]
    }
  }
};

// Session 2: Cloud Outsourcing & Recovery Time Objective (HKMA SA-2 vs. MAS 655)
export const initialMatrixSession2: MatrixSessionState = {
  sessionId: 'matrix-sess-cloud-sa2',
  sessionTitle: 'Cloud Outsourcing Audit Rights & RTO Benchmark (HKMA vs. MAS vs. FCA vs. SEC)',
  activeQuestionIndex: 0,
  activeJurisdictionCode: 'HK',
  createdAt: new Date().toISOString().slice(0, 10) + ' 09:15:00 UTC',
  updatedAt: new Date().toISOString().slice(0, 10) + ' 11:40:00 UTC',
  creator: 'Ivan Choy (Lead Compliance Officer)',
  isSaved: false,
  isLoading: false,
  questions: [
    {
      questionId: 'q-cloud-1',
      questionText: 'What are the mandatory contractual inspection and multi-tier subcontracting audit rights for cloud service providers?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] MAS Notice 655 requires financial institutions to retain direct physical inspection rights across multi-tier subcontractors; HKMA SPM SA-2 adopts a risk-based approach, permitting certified independent third-party assurance reports (e.g. SOC 2 Type II / ISO 27001) combined with periodic gap analysis as an acceptable alternative, reducing friction in hyperscaler cloud negotiations.'
    },
    {
      questionId: 'q-cloud-2',
      questionText: 'What explicit Recovery Time Objectives (RTO) and Recovery Point Objectives (RPO) are prescribed for critical banking operations?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] MAS establishes a rigid benchmark: unscheduled cumulative outage for each critical system must not exceed 4 hours within any rolling 12-month period, and single-incident RTO must be within 4 hours. In contrast, HKMA SPM OR-2 requires institutions to define board-approved tolerable downtime through Business Impact Analysis (BIA), emphasizing extreme but plausible scenario recovery.'
    }
  ],
  jurisdictions: [
    { code: 'HK', name: 'Hong Kong', regulatorAcronym: 'HKMA', complianceStatus: 'compliant' },
    { code: 'SG', name: 'Singapore', regulatorAcronym: 'MAS', complianceStatus: 'conditional' },
    { code: 'UK', name: 'United Kingdom', regulatorAcronym: 'FCA / PRA', complianceStatus: 'compliant' },
    { code: 'US', name: 'United States', regulatorAcronym: 'SEC / OCC', complianceStatus: 'conditional' }
  ],
  matrixCells: {
    'q-cloud-1_HK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: 'Flexible Pooled & SOC 2 Audits Allowed',
      answerMarkdown: `### Hong Kong Monetary Authority (HKMA SPM SA-2): Subcontracting Audits & Pooled Audits

Under HKMA Supervisory Policy Manual module SA-2 ("Outsourcing"):
1. **Multi-tier Subcontracting Oversight**: Authorized Institutions (AIs) must obligate Cloud Service Providers (CSPs) to provide timely advance written notification prior to material subcontracting.
2. **Audit Right Alternatives**: Recognizing the impracticality of physical data center audits across hyperscalers, HKMA explicitly permits **Pooled Audits** (joint independent third-party audits commissioned by peer institutions) and reliance on certified **SOC 2 Type II / ISO 27017 reports** [HKMA SPM SA-2 §4.3].`,
      keyTakeaways: [
        'Permits certified SOC 2 Type II assurance reports in lieu of recurring physical facility inspections.',
        'Supports peer pooled audits to alleviate vendor negotiation friction.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-hkma-sa2-audit',
          sourceTitle: 'HKMA Supervisory Policy Manual SPM SA-2: Outsourcing §4.3',
          authority: 'Hong Kong Monetary Authority',
          regulatorAcronym: 'HKMA',
          effectiveDate: '2023-11-15',
          sourceUrl: 'https://www.hkma.gov.hk/eng/regulatory-resources/regulatory-guides/supervisory-policy-manual/',
          excerpt: 'SPM SA-2 §4.3.4: An Authorized Institution may rely on pooled audits or independent third-party audit reports (such as SOC 2 Type II) provided that the scope adequately covers the institution’s specific security requirements.',
          highlightedTerms: ['pooled audits', 'independent third-party audit reports', 'SOC 2 Type II'],
          sha256: '99887766554433221100aabbccddeeff99887766554433221100aabbccddeeff',
          relevanceScore: 97,
          relevanceTag: 'Supervisory Guidance'
        },
        {
          citationId: 'cit-hk-pdpo-cloud',
          sourceTitle: 'PCPD Information Leaflet: Cloud Computing & Cross-Border Data Outsourcing',
          authority: 'Office of the Privacy Commissioner for Personal Data (PCPD)',
          regulatorAcronym: 'PCPD / HKMA',
          effectiveDate: '2024-01-20',
          sourceUrl: 'https://www.pcpd.org.hk/english/resources_centre/publications/files/cloud_computing.pdf',
          excerpt: 'Data users must adopt contractual or other means to ensure that cloud hyperscalers provide verifiable audit logs and direct assurance against unauthorized access or downstream transfer.',
          highlightedTerms: ['contractual or other means', 'verifiable audit logs'],
          sha256: '887766554433221100aabbccddeeff99887766554433221100aabbccddeeff99',
          relevanceScore: 95,
          relevanceTag: 'Statutory Data Protection Standard'
        }
      ]
    },
    'q-cloud-1_SG': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Mandatory Contractual Multi-Tier Audit Rights',
      answerMarkdown: `### Monetary Authority of Singapore (MAS Notice 655 / TRM Guidelines): Subcontractor Audit Rights

Pursuant to MAS Notice 655 and the MAS Guidelines on Outsourcing:
1. **Unrestricted Inspection & Audit Access**: Contracts must secure unrestricted audit access rights for the financial institution, its external auditors, and MAS itself across critical subcontractors.
2. **Material Subcontracting Prior Consent**: Any subcontracting of material outsourcing services requires prior written consent from the financial institution, with non-compliance constituting a regulatory breach.`,
      keyTakeaways: [
        'Contracts must stipulate inspection rights for MAS and institutions over subcontractors.',
        'Public cloud negotiations require specific contractual supervisory covenants.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-mas-notice655',
          sourceTitle: 'MAS Notice 655: Cyber Hygiene & Guidelines on Outsourcing §5.8',
          authority: 'Monetary Authority of Singapore',
          regulatorAcronym: 'MAS',
          effectiveDate: '2022-07-01',
          sourceUrl: 'https://www.mas.gov.sg/regulation/guidelines/guidelines-on-outsourcing',
          excerpt: 'Section 5.8: A financial institution must ensure that the outsourcing agreement stipulates the right of the FI and MAS to inspect and audit any sub-contractor providing services in connection with a material outsourcing arrangement.',
          highlightedTerms: ['right of the FI and MAS to inspect and audit any sub-contractor', 'material outsourcing arrangement'],
          sha256: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff',
          relevanceScore: 99,
          relevanceTag: 'Enforceable Supervisory Notice'
        },
        {
          citationId: 'cit-mas-trm-2021',
          sourceTitle: 'MAS Technology Risk Management Guidelines (TRMG) Section 5: Third Party Architecture',
          authority: 'Monetary Authority of Singapore',
          regulatorAcronym: 'MAS',
          effectiveDate: '2021-01-18',
          sourceUrl: 'https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines',
          excerpt: 'Financial institutions should verify that external cloud vendors and third parties submit independent penetration test reports and maintain full audit traceability.',
          highlightedTerms: ['independent penetration test reports', 'full audit traceability'],
          sha256: '11223344556677889900aabbccddeeff99887766554433221100aabbccddeeff',
          relevanceScore: 96,
          relevanceTag: 'Supervisory Guideline'
        }
      ]
    },
    'q-cloud-1_UK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: 'PRA SS2/21 Outsourcing Standard Compliance',
      answerMarkdown: `### United Kingdom (PRA SS2/21 & FCA FG16/5): Material Outsourcing & Subcontracting Transparency

The Prudential Regulation Authority (PRA) under Supervisory Statement SS2/21 mandates concentration risk assessments for material cloud deployments and authorizes third-party pooled audits and certifications, harmonizing with the EU Digital Operational Resilience Act (DORA).`,
      keyTakeaways: ['Complies with PRA SS2/21 outsourcing and third-party risk management standards.'],
      verifiedCitations: [
        {
          citationId: 'cit-pra-ss221',
          sourceTitle: 'Bank of England PRA Supervisory Statement SS2/21',
          authority: 'Prudential Regulation Authority',
          regulatorAcronym: 'PRA / FCA',
          effectiveDate: '2022-03-31',
          sourceUrl: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2021/march/outsourcing-and-third-party-risk-management-ss',
          excerpt: 'PRA SS2/21 §5.12: Firms should ensure that the written agreement covers the conditions under which sub-outsourcing can take place.',
          highlightedTerms: ['written agreement covers the conditions under which sub-outsourcing can take place'],
          sha256: '33445566778899001122aabbccddeeff33445566778899001122aabbccddeeff',
          relevanceScore: 94,
          relevanceTag: 'Prudential Standard'
        },
        {
          citationId: 'cit-fca-fg165',
          sourceTitle: 'FCA FG16/5: Guidance for firms outsourcing to the cloud and other third-party IT services',
          authority: 'Financial Conduct Authority',
          regulatorAcronym: 'FCA',
          effectiveDate: '2019-09-01',
          sourceUrl: 'https://www.fca.org.uk/publications/finalised-guidance/fg16-5-guidance-firms-outsourcing-cloud-and-other-third-party-it-services',
          excerpt: 'Section 3.18: Regulated entities must maintain effective access to data and premises, allowing pooled audits or third-party certifications where direct individual site inspections are commercially constrained.',
          highlightedTerms: ['effective access to data and premises', 'pooled audits'],
          sha256: '44556677889900112233aabbccddeeff44556677889900112233aabbccddeeff',
          relevanceScore: 92,
          relevanceTag: 'Conduct Supervisory Guidance'
        }
      ]
    },
    'q-cloud-1_US': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Interagency Guidance on Third-Party Relationships',
      answerMarkdown: `### United States (Fed, FDIC, OCC Interagency Guidance): Third-Party Lifecycle Governance

The Interagency Guidance on Third-Party Relationships requires banking organizations to maintain robust diligence, continuous monitoring, and step-in inspection rights throughout third-party and fourth-party lifecycle engagements.`,
      keyTakeaways: ['Governed by Federal Reserve, FDIC, and OCC Interagency Guidance.'],
      verifiedCitations: [
        {
          citationId: 'cit-us-interagency-2023',
          sourceTitle: 'Interagency Guidance on Third-Party Relationships: Risk Management',
          authority: 'Federal Reserve / FDIC / OCC',
          regulatorAcronym: 'Fed / OCC',
          effectiveDate: '2023-06-06',
          sourceUrl: 'https://www.federalreserve.gov/supervisionreg/srletters/SR2304.htm',
          excerpt: 'Guidance §II.C: The banking organization should understand the nature of any subcontracting arrangements and verify that the third party maintains sufficient oversight.',
          highlightedTerms: ['understand the nature of any subcontracting arrangements', 'sufficient oversight'],
          sha256: '55667788990011223344aabbccddeeff55667788990011223344aabbccddeeff',
          relevanceScore: 91,
          relevanceTag: 'Federal Supervisory Guidance'
        },
        {
          citationId: 'cit-ffiec-outsourcing-appc',
          sourceTitle: 'FFIEC IT Examination Handbook: Outsourcing Technology Services Booklet (Appendix C)',
          authority: 'Federal Financial Institutions Examination Council',
          regulatorAcronym: 'FFIEC',
          effectiveDate: '2022-04-12',
          sourceUrl: 'https://ithandbook.ffiec.gov/it-booklets/outsourcing-technology-services.aspx',
          excerpt: 'Financial institutions should evaluate foreign and multi-tier sub-service organizations, requiring periodic SOC 2 Type II reports or independent third-party assessment reviews.',
          highlightedTerms: ['foreign and multi-tier sub-service organizations', 'SOC 2 Type II reports'],
          sha256: '66778899001122334455aabbccddeeff66778899001122334455aabbccddeeff',
          relevanceScore: 93,
          relevanceTag: 'Interagency Handbook Standard'
        }
      ]
    },
    'q-cloud-2_HK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: 'Proportionate BIA & SPM OR-2 Principles',
      answerMarkdown: `### Hong Kong SAR: BIA-Driven Risk-Based Recovery Time Objectives (SPM OR-2)

HKMA does not impose a single rigid numerical hour limit across all operations. Instead, SPM OR-2 ("Operational Resilience") requires institutions to perform comprehensive Business Impact Analysis (BIA), setting board-approved tolerable downtime metrics for critical operations.`,
      keyTakeaways: ['Defines board-approved disruption tolerances under HKMA SPM OR-2.'],
      verifiedCitations: [
        {
          citationId: 'cit-hkma-or2-rto',
          sourceTitle: 'HKMA SPM OR-2: Operational Resilience & Business Continuity',
          authority: 'Hong Kong Monetary Authority',
          regulatorAcronym: 'HKMA',
          effectiveDate: '2023-05-20',
          sourceUrl: 'https://www.hkma.gov.hk/eng/regulatory-resources/regulatory-guides/supervisory-policy-manual/',
          excerpt: 'SPM OR-2 §3.2: Institutions must define severe but plausible scenarios and ensure critical operations recover within tolerance limits.',
          highlightedTerms: ['severe but plausible scenarios', 'recover within tolerance limits'],
          sha256: '77889900112233445566aabbccddeeff77889900112233445566aabbccddeeff',
          relevanceScore: 95,
          relevanceTag: 'Regulatory Standard'
        },
        {
          citationId: 'cit-hkma-tm-g-1',
          sourceTitle: 'HKMA SPM TM-G-1: General Principles for Technology Risk Management §6.3',
          authority: 'Hong Kong Monetary Authority',
          regulatorAcronym: 'HKMA',
          effectiveDate: '2022-12-10',
          sourceUrl: 'https://www.hkma.gov.hk/eng/regulatory-resources/regulatory-guides/supervisory-policy-manual/',
          excerpt: 'Section 6.3: AIs must establish a maximum tolerable outage (MTO) and recovery point objective (RPO) consistent with market clearing dependencies.',
          highlightedTerms: ['maximum tolerable outage', 'recovery point objective'],
          sha256: '88990011223344556677aabbccddeeff88990011223344556677aabbccddeeff',
          relevanceScore: 94,
          relevanceTag: 'Technical Benchmark'
        }
      ]
    },
    'q-cloud-2_SG': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Strict 4-Hour Unscheduled Downtime Cap',
      answerMarkdown: `### Republic of Singapore: Mandatory 4-Hour Maximum Outage Ceiling (MAS Notice 644/655)

MAS mandates that unscheduled downtime for any critical IT system must not exceed an aggregate of 4 hours within any rolling 12-month period, and single-incident RTO must be strictly capped within 4 hours.`,
      keyTakeaways: [
        'Cumulative unscheduled downtime is capped at 4 hours across any rolling 12-month period.',
        'Single major incident RTO must be controlled within 4 hours.'
      ],
      verifiedCitations: [
        {
          citationId: 'cit-mas-notice644',
          sourceTitle: 'MAS Notice 644: Technology Risk Management §4.1',
          authority: 'Monetary Authority of Singapore',
          regulatorAcronym: 'MAS',
          effectiveDate: '2021-01-18',
          sourceUrl: 'https://www.mas.gov.sg/regulation/notices/notice-644',
          excerpt: 'Section 4.1: The unscheduled downtime for each critical system must not exceed a total of 4 hours within any period of 12 continuous months.',
          highlightedTerms: ['unscheduled downtime', 'must not exceed a total of 4 hours', 'within any period of 12 continuous months'],
          sha256: '99001122334455667788aabbccddeeff99001122334455667788aabbccddeeff',
          relevanceScore: 99,
          relevanceTag: 'Statutory Quantitative Mandate'
        },
        {
          citationId: 'cit-mas-bcm-guidelines',
          sourceTitle: 'MAS Business Continuity Management Guidelines (Section 4: Recovery Metrics)',
          authority: 'Monetary Authority of Singapore',
          regulatorAcronym: 'MAS',
          effectiveDate: '2022-06-06',
          sourceUrl: 'https://www.mas.gov.sg/regulation/guidelines/business-continuity-management-guidelines',
          excerpt: 'FIs must establish Recovery Time Objectives (RTO) for each critical business service and conduct end-to-end testing with interconnected market participants at least annually.',
          highlightedTerms: ['Recovery Time Objectives', 'end-to-end testing'],
          sha256: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff',
          relevanceScore: 96,
          relevanceTag: 'Supervisory Practice Standard'
        }
      ]
    },
    'q-cloud-2_UK': {
      complianceStatus: 'compliant',
      statusBadgeLabel: 'Impact Tolerances Standard (PRA SS1/21)',
      answerMarkdown: `### United Kingdom: Operational Resilience & Impact Tolerances (PRA SS1/21)

Under PRA SS1/21, firms must set specific, quantifiable Impact Tolerances for every Important Business Service, defining the maximum tolerable disruption period and submitting annual self-assessments to regulators.`,
      keyTakeaways: ['Sets explicit impact tolerances emphasizing extreme but plausible scenario recovery.'],
      verifiedCitations: [
        {
          citationId: 'cit-pra-ss121',
          sourceTitle: 'PRA SS1/21 Operational Resilience: Impact Tolerances for Important Business Services',
          authority: 'PRA',
          regulatorAcronym: 'PRA',
          effectiveDate: '2022-03-31',
          sourceUrl: 'https://www.bankofengland.co.uk/prudential-regulation/publication/2021/march/operational-resilience-impact-tolerances-for-important-business-services-ss',
          excerpt: 'SS1/21 §2.3: Firms must set impact tolerances at the first point at which intolerable harm would be caused to consumers or market stability.',
          highlightedTerms: ['set impact tolerances', 'intolerable harm would be caused'],
          sha256: 'bbccddeeff00112233445566778899aabbccddeeff00112233445566778899aa',
          relevanceScore: 93,
          relevanceTag: 'Prudential Rule'
        },
        {
          citationId: 'cit-fca-ps213',
          sourceTitle: 'FCA Policy Statement PS21/3: Building Operational Resilience §4.1',
          authority: 'Financial Conduct Authority',
          regulatorAcronym: 'FCA',
          effectiveDate: '2022-03-31',
          sourceUrl: 'https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience',
          excerpt: 'Firms must remain within impact tolerances in severe but plausible scenarios, defining time-based metrics and operational contingency failover triggers.',
          highlightedTerms: ['remain within impact tolerances', 'severe but plausible scenarios'],
          sha256: 'ccddeeff00112233445566778899aabbccddeeff00112233445566778899aabb',
          relevanceScore: 95,
          relevanceTag: 'Conduct Rule'
        }
      ]
    },
    'q-cloud-2_US': {
      complianceStatus: 'conditional',
      statusBadgeLabel: 'Sound Practices for Operational Resilience',
      answerMarkdown: `### United States: Same-Day Recovery for Critical Payment & Clearing Systems

Federal banking regulators enforce the Sound Practices Paper for core clearing operations (e.g. Fedwire), requiring same-day recovery capabilities while allowing institutions to establish FFIEC-aligned metrics for other operations.`,
      keyTakeaways: ['Mandates same-day recovery for critical financial market infrastructures under FFIEC rules.'],
      verifiedCitations: [
        {
          citationId: 'cit-fed-sound-practices',
          sourceTitle: 'Interagency Paper on Sound Practices to Strengthen Operational Resilience',
          authority: 'Federal Reserve / OCC / FDIC',
          regulatorAcronym: 'Federal Reserve',
          effectiveDate: '2020-10-30',
          sourceUrl: 'https://www.federalreserve.gov/supervisionreg/srletters/SR2024.htm',
          excerpt: 'Sound Practices §III: For critical operations, firms should establish recovery time objectives that reflect the potential impact on financial stability.',
          highlightedTerms: ['recovery time objectives that reflect the potential impact on financial stability'],
          sha256: 'ddeeff00112233445566778899aabbccddee00112233445566778899aabbccddee',
          relevanceScore: 90,
          relevanceTag: 'Federal Guidance'
        },
        {
          citationId: 'cit-occ-bulletin-2023',
          sourceTitle: 'OCC Bulletin 2023-17: Operational Resilience & Incident Response Benchmarking',
          authority: 'Office of the Comptroller of the Currency (OCC)',
          regulatorAcronym: 'OCC',
          effectiveDate: '2023-08-14',
          sourceUrl: 'https://www.occ.gov/news-issuances/bulletins/2023/bulletin-2023-17.html',
          excerpt: 'National banks and federal savings associations must designate critical operations with core settlement recovery targets controlled within standard business day windows.',
          highlightedTerms: ['critical operations', 'core settlement recovery targets'],
          sha256: 'eeff00112233445566778899aabbccddeeff00112233445566778899aabbccdd',
          relevanceScore: 92,
          relevanceTag: 'Federal Supervisory Bulletin'
        }
      ]
    }
  }
};

// Function to generate dynamic sessions when user runs matrix research
export function createDynamicMatrixSession(
  questions: string[],
  selectedJurisdictionCodes: string[],
  customTitle?: string
): MatrixSessionState {
  const chosenJurisdictions = ALL_AVAILABLE_JURISDICTIONS.filter((j) =>
    selectedJurisdictionCodes.includes(j.code)
  );
  if (chosenJurisdictions.length === 0) {
    chosenJurisdictions.push(...ALL_AVAILABLE_JURISDICTIONS.slice(0, 3));
  }

  const generatedQuestions: MatrixQuestionItem[] = questions.map((q, idx) => {
    return {
      questionId: `dyn-q-${idx + 1}-${Date.now()}`,
      questionText: q,
      crossCountrySummary: `[Cross-Jurisdictional Comparison (Question ${idx + 1})] Regarding "${q.slice(0, 40)}...", the selected supervisory authorities (${chosenJurisdictions.map((j) => j.name).join(', ')}) demonstrate distinct regulatory approaches. Compliance teams should evaluate cross-border data transfer covenants, licensing prerequisites, and statutory notification deadlines.`
    };
  });

  const matrixCells: { [key: string]: MatrixCellData } = {};

  const complianceStatusOptions: MatrixComplianceStatus[] = [
    'compliant',
    'conditional',
    'prohibited',
    'inconclusive'
  ];

interface EvidenceProfile {
  title: string;
  sourceUrl: string;
  rationale: string;
  certainty: string;
  excerpt: string;
  status: MatrixComplianceStatus;
  statusBadge: string;
  analysisText: string;
  takeaways: string[];
}

function getEvidenceProfileForQuestion(
  qText: string,
  qIdx: number,
  jurCode: string,
  jurName: string,
  regAcronym: string
): EvidenceProfile {
  const text = qText.toLowerCase();

  // Topic 1: Incident notification & operational disruption
  if (text.includes('notification') || text.includes('timeline') || text.includes('disrupt') || text.includes('cyber') || qIdx % 7 === 0) {
    if (jurCode === 'HK') {
      return {
        title: 'HKMA Supervisory Policy Manual (SPM) OR-2: Operational Resilience §4.2',
        sourceUrl: 'https://www.hkma.gov.hk/eng/regulatory-resources/supervisory-policy-manual/',
        rationale: 'Mandates authorized institutions to report any severe incident impacting critical operations within 2 hours of detection.',
        certainty: 'Direct statutory gazetted directive in HKMA SPM module OR-2 with non-discretionary enforcement.',
        excerpt: 'Authorized Institutions must notify the HKMA as soon as practicable and in any event within 2 hours of detecting any incident that severely impacts critical operations.',
        status: 'compliant',
        statusBadge: 'Permitted (Mandatory 2-Hour Window)',
        analysisText: `Under **HKMA SPM OR-2 §4.2**, authorized institutions face a mandatory 2-hour notification threshold upon detecting critical disruptions to core banking or customer services. Immediate incident categorization and initial verbal/email filing with the HKMA Banking Supervision Department are required, followed by root-cause analysis within 14 working days.`,
        takeaways: [
          'Mandatory 2-hour rapid notification for critical system incidents.',
          'Subsequent comprehensive incident investigation report required within 14 working days.',
          'Annual scenario testing against severe-but-plausible disruption baselines.'
        ]
      };
    } else if (jurCode === 'SG') {
      return {
        title: 'MAS Technology Risk Management (TRM) Guidelines Notice 655 §3.1',
        sourceUrl: 'https://www.mas.gov.sg/regulation/guidelines/technology-risk-management-guidelines',
        rationale: 'Prescribes strict 1-hour notification to MAS upon discovering material outages or cybersecurity breaches.',
        certainty: 'Statutory circular enforceable under Monetary Authority of Singapore Act Section 27B.',
        excerpt: 'A financial institution must notify MAS immediately and no later than 1 hour upon becoming aware of any system unavailability affecting customer services or material security compromise.',
        status: 'conditional',
        statusBadge: 'Conditional (Strict 1-Hour Notification Window)',
        analysisText: `MAS enforces a tighter 1-hour window under **Notice 655 Paragraph 3.1**. Financial institutions must notify the MAS IT Supervision Division within 60 minutes of recognizing unscheduled downtime exceeding the maximum cumulative 4-hour threshold over a 12-month period.`,
        takeaways: [
          'Strict 1-hour notification to MAS upon identifying material customer impact.',
          'Maximum unscheduled downtime capped at 4 hours aggregate per annum.',
          'Mandatory forensic root-cause analysis submitted within 14 calendar days.'
        ]
      };
    } else if (jurCode === 'UK') {
      return {
        title: 'FCA Policy Statement PS21/3: Building Operational Resilience (SYSC 15A)',
        sourceUrl: 'https://www.fca.org.uk/publications/policy-statements/ps21-3-building-operational-resilience',
        rationale: 'Requires regulated firms to set impact tolerances for Important Business Services and notify FCA of material breaches immediately.',
        certainty: 'Primary regulatory instrument under FCA Handbook SYSC 15A and BoE/PRA Policy.',
        excerpt: 'Firms must remain within their impact tolerances for each important business service and notify the appropriate regulator immediately if they project an impact tolerance breach.',
        status: 'compliant',
        statusBadge: 'Permitted (Important Business Service Framework)',
        analysisText: `Under **FCA PS21/3** and **PRA SS1/21**, notification is anchored to breaches of predetermined "Impact Tolerances" for Important Business Services (IBS). Firms must promptly inform the FCA supervisory team whenever severe disruption threatens market integrity or consumer protection.`,
        takeaways: [
          'Dual PRA/FCA regime prioritizing Important Business Services (IBS).',
          'Immediate notification upon breach or anticipated breach of impact tolerances.',
          'Continuous operational mapping of critical third-party dependencies.'
        ]
      };
    } else {
      return {
        title: 'Federal Reserve SR 20-24 / OCC Sound Practices for Operational Resilience',
        sourceUrl: 'https://www.federalreserve.gov/supervisionreg/srletters/sr2024.htm',
        rationale: 'Establishes interagency cyber incident notification rules requiring 36-hour notice for banking organizations.',
        certainty: 'Codified in 12 CFR Part 53 (Computer-Security Incident Notification Rule).',
        excerpt: 'A banking organization must notify its primary federal regulator of any computer-security incident that has occurred as soon as possible and no later than 36 hours.',
        status: 'conditional',
        statusBadge: 'Conditional (36-Hour Interagency Rule)',
        analysisText: `US banking regulators (Fed, OCC, FDIC) enforce the **36-Hour Computer-Security Incident Notification Rule (12 CFR Part 53)**. In addition, SEC Form 8-K Item 1.05 requires public reporting within 4 business days of determining an incident is material.`,
        takeaways: [
          'Federal 36-hour rapid notification to primary prudential supervisor.',
          'SEC Form 8-K disclosure within 4 business days of materiality determination.',
          'Board-level oversight required for third-party service provider disruption plans.'
        ]
      };
    }
  }

  // Topic 2: Third-party cloud audit covenants & vendor risk
  if (text.includes('audit') || text.includes('cloud') || text.includes('third-party') || text.includes('vendor') || text.includes('contract') || qIdx % 7 === 1) {
    if (jurCode === 'HK') {
      return {
        title: 'HKMA Circular on Cloud Computing and Third-Party Vendor Risk Management',
        sourceUrl: 'https://www.hkma.gov.hk/eng/regulatory-resources/supervisory-policy-manual/',
        rationale: 'Explicitly bars outsourcing agreements that fail to provide direct regulatory audit access and examination rights.',
        certainty: 'Enforced via HKMA SPM TM-G-1 and SPM SA-2 supervisory inspections.',
        excerpt: 'Contracts with cloud and third-party service providers must include provisions ensuring that the HKMA and the institution have unrestricted rights of inspection and audit.',
        status: 'conditional',
        statusBadge: 'Conditional (Mandatory Audit Addendum)',
        analysisText: `HKMA requires authorized institutions to execute supplemental addendums with public cloud providers (e.g. AWS, Azure, GCP). Agreements missing regulatory audit and access clauses violate **SPM SA-2**, exposing the entity to supervisory enforcement.`,
        takeaways: [
          'Direct supervisory inspection rights cannot be waived by cloud SLAs.',
          'Subcontractor chains require explicit prior institutional consent.',
          'Exit strategies must ensure non-disruptive repatriation of client records.'
        ]
      };
    } else if (jurCode === 'SG') {
      return {
        title: 'MAS Guidelines on Outsourcing Risk §7: Access, Audit and Inspection Rights',
        sourceUrl: 'https://www.mas.gov.sg/regulation/guidelines/guidelines-on-outsourcing',
        rationale: 'Mandates institutional and MAS direct audit access to service provider locations and data centers.',
        certainty: 'Core benchmark assessed in MAS supervisory evaluations under Notice 634.',
        excerpt: 'Financial institutions must ensure that the outsourcing agreement grants MAS and its appointed agents the right to access and inspect the service provider and its subcontractors.',
        status: 'conditional',
        statusBadge: 'Conditional (Statutory Audit Covenant Required)',
        analysisText: `Section 7 of the **MAS Outsourcing Guidelines** requires that institutions secure legally enforceable rights for MAS to audit the service provider. Pooled audit reports (SOC 2 Type II) are admissible but cannot preclude on-site regulatory visits.`,
        takeaways: [
          'Agreements must confer unconditional right for MAS to conduct supervisory inspections.',
          'SOC 2 Type II reports supplement but do not extinguish on-site audit covenants.',
          'Continuous monitoring of third-party financial viability and cyber hygiene.'
        ]
      };
    } else if (jurCode === 'UK') {
      return {
        title: 'FCA Handbook SYSC 8.1: General Outsourcing Requirements and Audit Access',
        sourceUrl: 'https://www.handbook.fca.org.uk/handbook/SYSC/8/1.html',
        rationale: 'Directs that firms ensure effective access to data and premises for the firm, its auditors, and the FCA.',
        certainty: 'Statutory rules implementing UK MiFID and Senior Management Arrangements.',
        excerpt: 'The outsourcing contract must provide the firm, its auditors, and the FCA with effective access to business data as well as the business premises of the service provider.',
        status: 'compliant',
        statusBadge: 'Permitted (SYSC 8 Audit Protocol)',
        analysisText: `**FCA SYSC 8.1.8R** requires regulated entities to maintain contractual rights allowing the FCA, auditors, and internal investigators full access to data and premises. For cloud services, FCA allows participation in pooled audit cooperatives.`,
        takeaways: [
          'Contractual terms must guarantee full supervisory access.',
          'Pooled audits by independent third parties are formally recognized by the FCA.',
          'Material outsourcing registers must be maintained and updated annually.'
        ]
      };
    } else {
      return {
        title: 'FFIEC Architecture, Infrastructure, and Operations (AIO) Booklet §VI: Cloud Audit',
        sourceUrl: 'https://ithandbook.ffiec.gov/it-booklets/architecture-infrastructure-and-operations.aspx',
        rationale: 'Supervisory interagency guidance governing bank holding company oversight of third-party cloud architectures.',
        certainty: 'Enforced jointly by Federal Reserve, OCC, and FDIC under Bank Service Company Act (12 U.S.C. 1867).',
        excerpt: 'Management should ensure third-party contracts include audit rights, performance metrics, and terms that provide supervisory agencies access to records and operations.',
        status: 'compliant',
        statusBadge: 'Permitted (Bank Service Company Act §7)',
        analysisText: `Under **Section 7(c) of the Bank Service Company Act (BSCA)**, cloud providers servicing financial institutions are directly subject to examination and regulation by federal banking agencies. Contracts must memorialize this supervisory authority.`,
        takeaways: [
          'Statutory supervisory access under Bank Service Company Act (BSCA).',
          'Periodic review of independent SOC 1/2 reports and penetration test findings.',
          'Disaster recovery exercises must validate multi-region failover capabilities.'
        ]
      };
    }
  }

  // Topic 3: Corporate Secretary / Legal Substance & Natural Person
  if (text.includes('secretary') || text.includes('corporate body') || text.includes('resident') || text.includes('officer') || qIdx % 7 === 2) {
    if (jurCode === 'HK') {
      return {
        title: 'Companies Ordinance (Cap. 622) - Section 474: Company Secretary',
        sourceUrl: 'https://www.elegislation.gov.hk/hk/cap622!en@2024-01-01',
        rationale: 'Permits a body corporate to act as company secretary if its registered office or place of business is in Hong Kong.',
        certainty: 'Primary statute governing company constitution and officers under Companies Registry.',
        excerpt: 'Section 474(4): If the company secretary is a body corporate, its registered office or a place of business must be in Hong Kong.',
        status: 'compliant',
        statusBadge: 'Fully Permitted (Corporate Secretary Allowed)',
        analysisText: `Under **Cap. 622 §474(4)**, a body corporate may lawfully serve as company secretary provided it maintains a registered office or verifiable place of business within Hong Kong. Commercial providers must also hold a TCSP Licence under Cap. 615.`,
        takeaways: [
          'Body corporate is permitted to act as company secretary (Cap. 622 §474(4)).',
          'Physical registered office or place of business required in Hong Kong.',
          'Commercial CSPs must hold a valid Cap. 615 TCSP licence.'
        ]
      };
    } else if (jurCode === 'SG') {
      return {
        title: 'Singapore Companies Act 1967 (Rev. 2020) - Section 171(1AA): Secretary',
        sourceUrl: 'https://sso.agc.gov.sg/Act/CoA1967#pr171-',
        rationale: 'Strictly prohibits corporate bodies from acting as company secretaries; mandates natural person resident in Singapore.',
        certainty: 'Black-letter statutory prohibition in Singapore company law administered by ACRA.',
        excerpt: 'Section 171(1AA): The secretary must be a natural person who has his or her principal or only place of residence in Singapore. A body corporate is not eligible to be appointed as secretary.',
        status: 'prohibited',
        statusBadge: 'Strictly Prohibited (Natural Person Only)',
        analysisText: `Pursuant to **Section 171(1AA) of the Singapore Companies Act 1967**, corporate bodies are strictly prohibited from serving as company secretaries. Every company secretary must be a natural person ordinarily resident in Singapore.`,
        takeaways: [
          'Corporate body secretaries are void ab initio in Singapore.',
          'Secretary must be an ordinarily resident natural person in Singapore.',
          'Corporate service providers assign individual qualified employees to act.'
        ]
      };
    } else if (jurCode === 'UK') {
      return {
        title: 'UK Companies Act 2006 - Chapter 12: Company Secretaries (Section 271-276)',
        sourceUrl: 'https://www.legislation.gov.uk/ukpga/2006/46/part/12',
        rationale: 'Authorizes corporate bodies to act as company secretary; optional for private companies; ECCTA 2023 IDV applies.',
        certainty: 'Companies House codified legislation governing corporate officers.',
        excerpt: 'Section 276: A body corporate may be appointed as a company secretary, provided its registered or principal office particulars are filed with the registrar under section 277.',
        status: 'compliant',
        statusBadge: 'Fully Permitted (Corporate Secretary Allowed)',
        analysisText: `Under **UK Companies Act 2006 Section 276**, a body corporate is permitted to act as company secretary. Private limited companies are not required to appoint a secretary unless required by their Articles. Under ECCTA 2023, underlying officers must undergo identity verification.`,
        takeaways: [
          'Body corporate secretaries are legally recognized in the UK.',
          'Optional appointment for private limited companies unless articles dictate.',
          'Mandatory identity verification (IDV) for corporate officers under ECCTA 2023.'
        ]
      };
    } else {
      return {
        title: 'Delaware General Corporation Law (DGCL) §142 & §132: Officers & Registered Agent',
        sourceUrl: 'https://delcode.delaware.gov/title8/c001/sc04/index.html',
        rationale: 'Distinguishes between fiduciary corporate officers (natural persons) and commercial registered agents (corporate bodies permitted).',
        certainty: 'Primary corporate jurisprudence benchmark in the United States.',
        excerpt: 'DGCL §132(a): Every corporation shall have and maintain in this State a registered agent, which may be a domestic corporation, a domestic partnership, a domestic limited liability company.',
        status: 'conditional',
        statusBadge: 'Conditional (Registered Agent vs Corporate Officer)',
        analysisText: `Under Delaware law, executive corporate officers carrying personal fiduciary duties are customarily natural persons, whereas registered agents acting on behalf of the corporation are widely permitted to be corporate entities (**DGCL §132**).`,
        takeaways: [
          'Commercial registered agents are statutorily authorized to be corporate bodies.',
          'Executive corporate officers customarily require natural person appointment.',
          'Delaware LLCs enjoy flexible contractual delegation in operating agreements.'
        ]
      };
    }
  }

  // Topic 4: Cross-border data transfer & privacy
  if (jurCode === 'HK') {
    return {
      title: 'Personal Data (Privacy) Ordinance (Cap. 486) & PCPD Cross-Border Transfer Guidance',
      sourceUrl: 'https://www.pcpd.org.hk/english/regulatory/data_protection/guidelines.html',
      rationale: 'Sets compliance benchmarks and recommended model clauses for cross-border personal data transfers.',
      certainty: 'Direct guidance from the Office of the Privacy Commissioner for Personal Data (PCPD).',
      excerpt: 'Data users transferring personal data outside Hong Kong should implement contractual safeguards including Recommended Model Clauses to ensure equivalent standard of protection.',
      status: 'conditional',
      statusBadge: 'Conditional (PCPD Model Clauses Recommended)',
      analysisText: `While Section 33 of Cap. 486 is not yet formally commenced, the PCPD actively enforces cross-border transfer benchmarks through **Data Protection Principle 3** and published Recommended Model Contractual Clauses.`,
      takeaways: [
        'Recommended Model Contractual Clauses should be incorporated in cross-border agreements.',
        'Data Protection Principle 3 mandates transparency regarding overseas transfer.',
        'Financial institutions must maintain data inventories and transfer impact assessments.'
      ]
    };
  } else if (jurCode === 'SG') {
    return {
      title: 'Singapore Personal Data Protection Act (PDPA 2012) - Transfer Limitation Obligation',
      sourceUrl: 'https://www.pdpc.gov.sg/legislation-and-guidelines',
      rationale: 'Mandates that overseas data recipients provide a standard of protection comparable to that under the PDPA.',
      certainty: 'Statutory obligation enforced by the Personal Data Protection Commission (PDPC).',
      excerpt: 'Section 26: An organization must not transfer any personal data to a country or territory outside Singapore except in accordance with prescribed requirements to ensure comparable protection.',
      status: 'conditional',
      statusBadge: 'Conditional (Standard Contractual Clauses Required)',
      analysisText: `Under **PDPA Section 26**, Singapore organizations cannot transfer personal data cross-border unless they ensure a standard of protection comparable to the PDPA, typically achieved via ASEAN Model Clauses or binding corporate rules.`,
      takeaways: [
        'Mandatory compliance with the Transfer Limitation Obligation under PDPA §26.',
        'Standard Contractual Clauses or CBPR certifications required for overseas entities.',
        'PDPC enforces substantial financial penalties for non-compliant transfers.'
      ]
    };
  } else if (jurCode === 'UK') {
    return {
      title: 'UK GDPR Chapter V (Articles 44-49) & International Data Transfer Agreement (IDTA)',
      sourceUrl: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/international-transfers/',
      rationale: 'Restricts transfers of personal data outside the UK unless subject to adequacy regulations or appropriate safeguards.',
      certainty: 'Enforced by the Information Commissioner’s Office (ICO) under the Data Protection Act 2018.',
      excerpt: 'Article 44: Any transfer of personal data which are undergoing processing or are intended for processing after transfer to a third country shall take place only if the conditions laid down in this Chapter are complied with.',
      status: 'conditional',
      statusBadge: 'Conditional (UK IDTA / Adequacy Decision)',
      analysisText: `Under **UK GDPR Article 46**, transfers to non-adequate jurisdictions require executing the UK International Data Transfer Agreement (IDTA) or UK Addendum to EU Standard Contractual Clauses, alongside a Transfer Risk Assessment (TRA).`,
      takeaways: [
        'Mandatory UK IDTA or UK Addendum for transfers to third countries.',
        'Documented Transfer Risk Assessment (TRA) must accompany international transfers.',
        'Adequacy regulations permit frictionless transfers to recognized jurisdictions.'
      ]
    };
  } else {
    return {
      title: 'Gramm-Leach-Bliley Act (GLBA) Safeguards Rule & State Cross-Border Privacy Benchmarks',
      sourceUrl: 'https://www.ftc.gov/business-guidance/privacy-security/gramm-leach-bliley-act',
      rationale: 'Establishes federal security standards for financial customer records and third-party oversight.',
      certainty: 'Federal Trade Commission / CFPB / prudential banking standards codified in 16 CFR Part 314.',
      excerpt: 'Financial institutions must take reasonable steps to select and retain service providers that are capable of maintaining appropriate safeguards for customer information.',
      status: 'compliant',
      statusBadge: 'Permitted (GLBA Safeguards Compliance)',
      analysisText: `Under the **GLBA Safeguards Rule** and cross-border vendor oversight standards, US institutions must contractually mandate that foreign and domestic service providers implement multi-factor authentication, data encryption, and periodic risk assessments.`,
      takeaways: [
        'Federal GLBA Safeguards Rule mandates technical and physical data protections.',
        'Foreign service providers must warrant compliance with equivalent safeguarding standards.',
        'State-level frameworks (e.g. CCPA/CPRA) impose additional opt-out and disclosure rules.'
      ]
    };
  }
}

  generatedQuestions.forEach((qItem, qIdx) => {
    chosenJurisdictions.forEach((jur, jIdx) => {
      const cellKey = `${qItem.questionId}_${jur.code}`;
      const profile = getEvidenceProfileForQuestion(qItem.questionText, qIdx, jur.code, jur.name, jur.regulatorAcronym);

      matrixCells[cellKey] = {
        complianceStatus: profile.status,
        statusBadgeLabel: profile.statusBadge,
        answerMarkdown: `### ${jur.name} (${jur.regulatorAcronym}): Regulatory Assessment

Regarding inquiry: "*${qItem.questionText}*":

${profile.analysisText}

#### Statutory Grounding & Directives
1. **Governing Authority & Rule**: Governed primarily under **[${profile.title}]**, setting enforceable supervisory expectations for ${jur.name} regulated entities.
2. **Operational Substance Requirement**: Institutions must demonstrate local substance, operational oversight, and clear compliance audit trails.
3. **Supervisory Enforcement Benchmark**: Evaluated as **${profile.status.toUpperCase()}** under current ${jur.regulatorAcronym} enforcement practice.`,
        keyTakeaways: profile.takeaways,
        verifiedCitations: [
          {
            citationId: `cit-dyn-${jur.code}-${qIdx}-1`,
            sourceTitle: profile.title,
            authority: jur.regulatorAcronym,
            regulatorAcronym: jur.regulatorAcronym,
            jurisdiction: jur.name,
            effectiveDate: jur.code === 'HK' ? '2026-03-24' : jur.code === 'SG' ? '2026-02-18' : '2025-11-15',
            sourceUrl: profile.sourceUrl,
            applicabilityRationale: profile.rationale,
            groundingCertainty: profile.certainty,
            excerpt: profile.excerpt,
            highlightedTerms: ['statutory windows', 'must notify', 'regulatory audit and inspection'],
            sha256: `e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852${qIdx}${jIdx}0`,
            confidenceScore: 98,
            relevanceScore: 98,
            relevanceTag: 'Official Statutory Authority'
          },
          {
            citationId: `cit-dyn-${jur.code}-${qIdx}-2`,
            sourceTitle: `${jur.regulatorAcronym} Operational Guidelines & Supervisory Circular (Part ${qIdx + 2})`,
            authority: jur.regulatorAcronym,
            regulatorAcronym: jur.regulatorAcronym,
            jurisdiction: jur.name,
            effectiveDate: '2026-01-15',
            sourceUrl: profile.sourceUrl,
            applicabilityRationale: `Establishes enforceable administrative compliance and inspection procedures for ${jur.name} regulated financial institutions.`,
            groundingCertainty: `Supervisory circular issued directly by ${jur.regulatorAcronym} under applicable financial statutes.`,
            excerpt: `Institutions operating in ${jur.name} must maintain comprehensive audit trails and verifiable governance controls accessible for supervisory inspection upon 24 hours notice.`,
            highlightedTerms: ['comprehensive audit trails', 'supervisory inspection'],
            sha256: `f4a1c2b3d5e67890123456789abcdef0123456789abcdef0123456789abcdef${qIdx}${jIdx}`,
            confidenceScore: 95,
            relevanceScore: 94,
            relevanceTag: 'Supervisory Practice Circular'
          }
        ]
      };
    });
  });

  const title =
    customTitle ||
    (questions.length === 1
      ? `Cross-Border Matrix: ${questions[0].slice(0, 30)}...`
      : `${chosenJurisdictions.map((j) => j.code).join('/')} Regulatory Matrix Analysis (${questions.length} Questions)`);

  const jurNamesWithAcronyms = chosenJurisdictions.map((j) => `${j.name} [${j.regulatorAcronym}]`).join(', ');

  const macroSynthesis = `### Consolidated Cross-Jurisdiction Macro Synthesis (${title})

Cross-regulatory synthesis evaluated across all ${generatedQuestions.length} compliance inquiries for ${jurNamesWithAcronyms}:

1. **Regulatory Commonalities**:
   - All surveyed jurisdictions (${chosenJurisdictions.map((j) => j.name).join(', ')}) enforce strict operational continuity, continuous third-party risk management, and mandatory transparent entity governance.
   - Cloud outsourcing contracts lacking supervisory access or direct examination rights violate baseline rules across every target regime.

2. **Divergence & Jurisdictional Gaps**:
   - **Incident Notification**: Singapore (MAS Notice 655) enforces the strictest window (1 hour), followed by Hong Kong (HKMA SPM OR-2 at 2 hours), whereas the US interagency rule allows 36 hours.
   - **Corporate Secretary Requirements**: Singapore strictly prohibits corporate bodies (mandatory resident natural persons under Companies Act §171(1AA)), whereas Hong Kong (Cap. 622 §474) and the UK (CA 2006 §276) expressly permit body corporate secretaries with verified registers.
   - **Cross-Border Transfers**: UK GDPR mandates formal IDTA or adequacy agreements, Singapore PDPA enforces Section 26 comparable protection covenants, and Hong Kong PCPD evaluates compliance through Data Protection Principle 3 model clauses.

3. **Harmonized Compliance Recommendation**:
   Adopt Singapore's 1-hour reporting window as the internal crisis SLA, embed standardized supervisory audit addendums in global vendor master agreements, and maintain dual-layer identity verification for all overseas corporate officers.`;

  return {
    sessionId: `matrix-sess-${Date.now()}`,
    sessionTitle: title,
    activeQuestionIndex: 0,
    activeJurisdictionCode: chosenJurisdictions[0].code,
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    updatedAt: new Date().toISOString().replace('T', ' ').slice(0, 19) + ' UTC',
    creator: 'Ivan Choy (Lead Compliance Officer)',
    isSaved: false,
    questions: generatedQuestions,
    jurisdictions: chosenJurisdictions,
    matrixCells,
    macroSynthesis,
    isLoading: false
  };
}

// Session 3: Previous 7 Days (3 days ago)
const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
export const initialMatrixSession3: MatrixSessionState = {
  ...initialMatrixSession2,
  sessionId: 'matrix-sess-stablecoin-reserves',
  sessionTitle: 'Fiat-Backed Stablecoin Reserve Assets & Custodial Safeguarding (MAS vs. HKMA vs. EU MiCA)',
  activeQuestionIndex: 0,
  activeJurisdictionCode: 'SG',
  createdAt: threeDaysAgo,
  updatedAt: threeDaysAgo,
  isSaved: false,
  questions: [
    {
      questionId: 'q-sc-1',
      questionText: 'What asset quality, duration, and liquidity requirements govern reserve backing assets for licensed single-currency stablecoins?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] Both MAS and HKMA require high-quality liquid assets (HQLA) consisting predominantly of cash, central bank reserves, or sovereign debt with maturity under 3 months. EU MiCA Title III additionally imposes credit institution deposit caps (minimum 30% held with independent credit institutions).'
    }
  ]
};

// Session 4: Other / Earlier History (20 days ago)
const twentyDaysAgo = new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
export const initialMatrixSession4: MatrixSessionState = {
  ...initialMatrixSession1,
  sessionId: 'matrix-sess-genai-crossborder',
  sessionTitle: 'Generative AI Cross-Border Model Risk & Banking Secrecy Baselines',
  activeQuestionIndex: 0,
  activeJurisdictionCode: 'HK',
  createdAt: twentyDaysAgo,
  updatedAt: twentyDaysAgo,
  isSaved: false,
  questions: [
    {
      questionId: 'q-ai-1',
      questionText: 'What customer consent and data pseudonymization rules apply when financial data is routed to multi-tenant LLMs?',
      crossCountrySummary: '[Cross-Jurisdictional Analysis] Under HKMA SPM TM-E-1 and MAS AI Governance Guidelines, processing client identifiable financial information via multi-tenant public AI models without end-to-end tokenization or explicit consent is strictly prohibited under banking confidentiality statutes.'
    }
  ]
};

export const INITIAL_MATRIX_SESSIONS: MatrixSessionState[] = [
  initialMatrixSession1, // Saved: isSaved = true
  initialMatrixSession2, // Today: isSaved = false, updated today
  initialMatrixSession3, // Previous 7 Days: 3 days ago
  initialMatrixSession4  // Other: 20 days ago
];

