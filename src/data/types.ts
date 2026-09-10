/**
 * Content types for the AZ-900 question bank.
 * Vocabulary follows CONTEXT.md: Question, Domain, Topic.
 */

export const DOMAINS = {
  'cloud-concepts': {
    label: 'Describe cloud concepts',
    shortLabel: 'Cloud concepts',
    weight: '25–30%',
    examQuestions: 12,
  },
  'architecture-services': {
    label: 'Describe Azure architecture and services',
    shortLabel: 'Architecture & services',
    weight: '35–40%',
    examQuestions: 15,
  },
  'management-governance': {
    label: 'Describe Azure management and governance',
    shortLabel: 'Management & governance',
    weight: '30–35%',
    examQuestions: 13,
  },
} as const

export type DomainId = keyof typeof DOMAINS

/**
 * Fixed taxonomy: the eleven named skill areas of Microsoft's official
 * AZ-900 study guide (skills measured as of July 20, 2026).
 */
export const TOPICS = {
  'describe-cloud-computing': {
    label: 'Describe cloud computing',
    domain: 'cloud-concepts',
  },
  'benefits-of-cloud-services': {
    label: 'Describe the benefits of using cloud services',
    domain: 'cloud-concepts',
  },
  'cloud-service-types': {
    label: 'Describe cloud service types',
    domain: 'cloud-concepts',
  },
  'core-architectural-components': {
    label: 'Describe the core architectural components of Azure',
    domain: 'architecture-services',
  },
  'compute-networking': {
    label: 'Describe Azure compute and networking services',
    domain: 'architecture-services',
  },
  storage: {
    label: 'Describe Azure storage services',
    domain: 'architecture-services',
  },
  'identity-access-security': {
    label: 'Describe Azure identity, access, and security',
    domain: 'architecture-services',
  },
  'cost-management': {
    label: 'Describe cost management in Azure',
    domain: 'management-governance',
  },
  'governance-compliance': {
    label: 'Describe features and tools in Azure for governance and compliance',
    domain: 'management-governance',
  },
  'managing-deploying-resources': {
    label: 'Describe features and tools for managing and deploying Azure resources',
    domain: 'management-governance',
  },
  'monitoring-tools': {
    label: 'Describe monitoring tools in Azure',
    domain: 'management-governance',
  },
} as const satisfies Record<string, { label: string; domain: DomainId }>

export type TopicId = keyof typeof TOPICS

export interface QuestionOption {
  /** Stable within the question: 'a', 'b', 'c', ... */
  id: string
  text: string
  /** Why this option is correct or incorrect — never a restatement of the option. */
  explanation: string
}

export interface Question {
  /** Stable, human-readable content ID: 'cc-001', 'arch-001', 'gov-001'. */
  id: string
  domain: DomainId
  topic: TopicId
  kind: 'single' | 'multi'
  stem: string
  options: QuestionOption[]
  /** Option IDs. Exactly 1 for 'single'; 2+ (and fewer than options.length) for 'multi'. */
  correct: string[]
  /** Stable learn.microsoft.com URL. Omitted when no confidently-stable page exists. */
  learnMore?: string
}
