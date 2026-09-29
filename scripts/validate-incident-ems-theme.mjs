import fs from 'node:fs'

const required={
  'src/app/[lang]/(dashboard)/(private)/incidents/page.tsx':['Incident Lifecycle','Create Demo Incident'],
  'src/views/forge-responder/IncidentWizard.tsx':['Dispatch','Units & Personnel','incident-create'],
  'src/app/[lang]/(dashboard)/(private)/neris/page.tsx':['NERIS','NerisValidationCenter'],
  'src/views/forge-responder/NerisValidationCenter.tsx':['Unit Response','External submission','neris-validation'],
  'src/app/[lang]/(dashboard)/(private)/ems/page.tsx':['EMS Operations','Start Demo ePCR'],
  'src/app/[lang]/(dashboard)/(private)/epcr/page.tsx':['Patient-Care Workflow','NEMSIS transmission'],
  'src/views/forge-responder/EpcrWizard.tsx':['Care & Disposition','epcr-complete','Save Demo ePCR']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL: missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL: ${file} missing ${token}`);failed=true}
}
if(failed) process.exit(1)
console.log('Forge incident/NERIS/EMS ThemeSelection validation PASS')
