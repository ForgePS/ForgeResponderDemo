import 'server-only'
import fs from 'node:fs'
import path from 'node:path'

export function loadForgeSeed<T>(name:string):T {
  const file=path.join(process.cwd(),'src','data','forge-responder',`${name}.json`)
  return JSON.parse(fs.readFileSync(file,'utf8')) as T
}
