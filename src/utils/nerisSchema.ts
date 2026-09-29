import catalog from '@/data/neris/neris-v1-schema-catalog.json'

export type NerisField = {
  name?: string
  type?: string
  group?: string
  possible_if?: string | boolean | number | null
  db_required?: boolean | string | number | null
  computed?: boolean | string | number | null
  computed_from?: string | null
  cardinality?: string | null
  value_set?: boolean | string | number | null
  value_set_location?: string | null
  description?: string | null
  example?: unknown
  comments?: string | null
  [key:string]: unknown
}

export type NerisModule = {
  workbook:string
  group:string
  module:string
  fieldCount:number
  fields:NerisField[]
}

export const nerisCatalog=catalog
export const nerisModules=catalog.modules as NerisModule[]
export const nerisValueSets=catalog.valueSets as Record<string,{workbook:string;group:string;optionCount:number;options:Array<Record<string,unknown>>}>

export function getNerisModule(name:string){
  return nerisModules.find(module=>module.module===name)
}

export function humanizeNerisName(value:string){
  return value.replace(/^core_mod_/,'').replace(/^mod_/,'').replace(/^type_/,'').split('_').map(part=>part.charAt(0).toUpperCase()+part.slice(1)).join(' ')
}

export function fieldRequirement(field:NerisField){
  if(field.computed) return 'Computed'
  if(field.db_required) return 'Database Required'
  if(field.possible_if) return 'Conditional'
  return 'Optional'
}
