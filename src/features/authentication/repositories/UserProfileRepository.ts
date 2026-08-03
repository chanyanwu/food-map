import type { AuthUser } from '../models/auth'

export interface UserProfileRepository {
  upsertProfile(user: AuthUser): Promise<void>
}