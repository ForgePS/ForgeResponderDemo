import fs from 'node:fs'
import path from 'node:path'

const roots=[
  'src/app/[lang]/(dashboard)/(private)',
  'src/views/forge-responder'
]

const bad=[]

function walk(dir){
  if(!fs.existsSync(dir)) return
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,ent.name)
    if(ent.isDirectory()) walk(full)
    else if(ent.isFile() && full.endsWith('.tsx')){
      const txt=fs.readFileSync(full,'utf8')
      const trimmed=txt.trimStart()
      const isClient=trimmed.startsWith("'use client'") || trimmed.startsWith('"use client"')
      if(!isClient && /component=\{(?:Link|NextLink)\}/.test(txt)){
        bad.push(full)
      }
    }
  }
}

for(const root of roots) walk(root)

if(bad.length){
  console.error('FAIL function-valued Link component props cross Server -> Client boundary:')
  bad.forEach(x=>console.error(` - ${x}`))
  process.exit(1)
}

console.log('Server/Client component boundary validation PASS')
