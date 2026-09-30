import 'server-only'

import { readForgeData } from '@/utils/forgeDataStore'

export function loadForgeSeed<T>(name: string): T {
  return readForgeData<T>(name)
}
