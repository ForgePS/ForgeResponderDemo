import fs from 'node:fs'

const required={
  'src/app/[lang]/(dashboard)/(private)/prevention/page.tsx':['Community Risk & Prevention','PreventionWorkflowCard'],
  'src/app/[lang]/(dashboard)/(private)/occupancies/page.tsx':['Occupancy Registry','New Demo Preplan'],
  'src/app/[lang]/(dashboard)/(private)/occupancies/[id]/page.tsx':['Building Intelligence','demo-navigation'],
  'src/app/[lang]/(dashboard)/(private)/preplans/page.tsx':['New Demo Preplan','SourceBoundaryAlert'],
  'src/views/forge-responder/PreplanBuilder.tsx':['Access & Utilities','preplan-save'],
  'src/app/[lang]/(dashboard)/(private)/inspections/page.tsx':['Inspection Programs','Start Demo Inspection'],
  'src/views/forge-responder/InspectionWizard.tsx':['Checklist','inspection-complete','Complete Demo Inspection']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL: missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL: ${file} missing ${token}`);failed=true}
}
if(failed) process.exit(1)
console.log('Forge prevention ThemeSelection validation PASS')
