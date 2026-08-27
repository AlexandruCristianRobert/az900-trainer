import { LocalStorageRepository } from './LocalStorageRepository'
import type { StudyRepository } from './StudyRepository'

export const repository: StudyRepository = new LocalStorageRepository()
export type { StudyRepository } from './StudyRepository'
