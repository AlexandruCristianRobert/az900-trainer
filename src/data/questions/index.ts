import type { Question } from '../types'
import { architectureServicesQuestions } from './architecture-services'
import { cloudConceptsQuestions } from './cloud-concepts'
import { managementGovernanceQuestions } from './management-governance'

export const questionBank: Question[] = [
  ...cloudConceptsQuestions,
  ...architectureServicesQuestions,
  ...managementGovernanceQuestions,
]

/** Shown next to the footer disclaimer so staleness is visible. */
export const STUDY_GUIDE_VERSION = 'AZ-900 skills measured as of July 20, 2026'
