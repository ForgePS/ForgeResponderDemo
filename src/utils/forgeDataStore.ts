import 'server-only'

import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.join(process.cwd(), 'demo-persistence', 'data')
const SEED_DIR = path.join(process.cwd(), 'src', 'data', 'forge-responder')

export const FORGE_DATA_ENTITIES = [
  'activity-events',
  'apparatus',
  'audit-events',
  'damage-forms',
  'dashboard-summary',
  'dropdowns',
  'fleet-support',
  'hydrant-audit-events',
  'hydrant-damage-reports',
  'hydrant-flow-tests',
  'hydrant-inspections',
  'hydrant-ownership-reviews',
  'hydrants',
  'inspection-fees',
  'inspection-templates',
  'inspection-types',
  'lists',
  'occupancies',
  'personnel-config',
  'personnel',
  'preplans',
  'relationships',
  'roles',
  'shift-trades',
  'users'
] as const

export type ForgeDataEntity = (typeof FORGE_DATA_ENTITIES)[number]

function assertEntity(entity: string): asserts entity is ForgeDataEntity {
  if (!FORGE_DATA_ENTITIES.includes(entity as ForgeDataEntity)) {
    throw new Error(`Unsupported Forge Responder data entity: ${entity}`)
  }
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

function dataPath(entity: ForgeDataEntity) {
  return path.join(DATA_DIR, `${entity}.json`)
}

function seedPath(entity: ForgeDataEntity) {
  return path.join(SEED_DIR, `${entity}.json`)
}

function parseJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, 'utf8')) as T
}

export function readForgeData<T>(entity: string): T {
  assertEntity(entity)
  const persisted = dataPath(entity)

  if (fs.existsSync(persisted)) return parseJson<T>(persisted)

  const seed = seedPath(entity)
  if (!fs.existsSync(seed)) throw new Error(`No Forge Responder data found for ${entity}`)

  return parseJson<T>(seed)
}

export function writeForgeData<T>(entity: string, value: T): T {
  assertEntity(entity)
  ensureDataDir()

  const target = dataPath(entity)
  const temp = `${target}.tmp`

  fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8')
  fs.renameSync(temp, target)

  return value
}

export function resetForgeData(entity: string) {
  assertEntity(entity)
  const persisted = dataPath(entity)
  if (fs.existsSync(persisted)) fs.unlinkSync(persisted)

  return readForgeData(entity)
}

export function getForgeDataSource(entity: string): 'persistent' | 'seed' {
  assertEntity(entity)
  return fs.existsSync(dataPath(entity)) ? 'persistent' : 'seed'
}
