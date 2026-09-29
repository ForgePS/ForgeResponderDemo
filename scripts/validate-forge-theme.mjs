import fs from 'node:fs'
import path from 'node:path'

let failed=false
const fail=m=>{failed=true;console.error(`FAIL: ${m}`)}
const required=[
  'src/components/layout/shared/Logo.tsx',
  'src/components/layout/vertical/VerticalMenu.tsx',
  'src/utils/forgeSeed.ts',
  'src/app/[lang]/(dashboard)/(private)/dashboard/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/hydrants/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/personnel/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/apparatus/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/prevention/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/occupancies/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/occupancies/[id]/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/preplans/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/preplans/[id]/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/preplans/new/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/inspections/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/inspections/new/page.tsx',
  'src/views/forge-responder/PreplanBuilder.tsx',
  'src/views/forge-responder/InspectionWizard.tsx',
  'src/app/[lang]/(dashboard)/(private)/incidents/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/incidents/new/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/neris/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/ems/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/epcr/page.tsx',
  'src/app/[lang]/(dashboard)/(private)/epcr/new/page.tsx',
  'src/views/forge-responder/IncidentWizard.tsx',
  'src/views/forge-responder/NerisValidationCenter.tsx',
  'src/views/forge-responder/EpcrWizard.tsx',
  'src/data/forge-responder/hydrants.json',
  'src/data/forge-responder/personnel.json',
  'src/data/forge-responder/apparatus.json'
]
for(const f of required) if(!fs.existsSync(f)) fail(`Missing ${f}`)
const nav=fs.readFileSync('src/components/layout/vertical/VerticalMenu.tsx','utf8')
for(const r of ['/dashboard','/hydrants','/personnel','/apparatus','/incidents','/ems','/neris','/prevention','/reports','/settings']) if(!nav.includes(r)) fail(`Navigation missing ${r}`)
const forbidden=[new RegExp(['horn','lake','fd'].join('[-_]'),'i'),new RegExp(['h','l','f','d'].join(''),'i'),new RegExp(['horn','lake'].join('\\s+'),'i'),new RegExp('@'+['horn','lake'].join('')+'\\.org','i'),/\\bHL-\\d+\\b/i]
const ignored=new Set(['node_modules','.next','.git'])
function walk(dir){ for(const entry of fs.readdirSync(dir,{withFileTypes:true})){ if(ignored.has(entry.name)) continue; const full=path.join(dir,entry.name); if(entry.isDirectory()) walk(full); else { let txt=''; try{txt=fs.readFileSync(full,'utf8')}catch{continue}; for(const p of forbidden) if(p.test(txt)) fail(`Prohibited source identifier in ${full}`) } } }
walk('src')
if(failed) process.exit(1)
console.log('Forge ThemeSelection integration validation PASS')
