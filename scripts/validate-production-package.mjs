import fs from 'node:fs'
import path from 'node:path'

let failed=false
const required=[
  'package.json',
  'pnpm-lock.yaml',
  '.env.example',
  'BUILD_FORGE_RESPONDER.ps1',
  'START_FORGE_RESPONDER.ps1',
  'BUILD_FORGE_RESPONDER.bat',
  'START_FORGE_RESPONDER.bat',
  'docs/BOOTH_RUNBOOK.md',
  'docs/LOCAL_START.md'
]
for(const file of required){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true}
}

const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
if(pkg.packageManager!=='pnpm@10.15.1'){console.error('FAIL packageManager not pinned');failed=true}
if(!pkg.scripts?.['build:verified']){console.error('FAIL build:verified missing');failed=true}

const forbiddenRoutes=[
  'src/app/[lang]/(dashboard)/(private)/apps',
  'src/app/[lang]/(dashboard)/(private)/charts',
  'src/app/[lang]/(dashboard)/(private)/dashboards',
  'src/app/[lang]/(dashboard)/(private)/forms',
  'src/app/[lang]/(dashboard)/(private)/react-table',
  'src/app/front-pages',
  'src/app/api/apps',
  'src/app/api/pages'
]
for(const route of forbiddenRoutes){
  if(fs.existsSync(route)){console.error(`FAIL sample route still present ${route}`);failed=true}
}

const privateRoot='src/app/[lang]/(dashboard)/(private)'
const pages=[]
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,ent.name)
    if(ent.isDirectory()) walk(full)
    else if(ent.isFile() && ent.name==='page.tsx') pages.push(full)
  }
}
walk(privateRoot)
if(pages.length<25){console.error(`FAIL unexpectedly low Forge page count ${pages.length}`);failed=true}

if(failed) process.exit(1)
console.log(`Production package validation PASS (${pages.length} Forge/private pages after sample-route pruning)`)
