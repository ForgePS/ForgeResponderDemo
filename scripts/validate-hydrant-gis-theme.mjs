import fs from 'node:fs'
const required={
  'src/app/[lang]/(dashboard)/(private)/maps/page.tsx':['HydrantMapbox','MAPBOX_ACCESS_TOKEN'],
  'src/views/forge-responder/HydrantMapbox.tsx':['react-map-gl/mapbox','Marker','Popup','stored coordinates'],
  'src/app/[lang]/(dashboard)/(private)/hydrants/[id]/page.tsx':['Start Flow Test','Flow Test History','Open GIS Map'],
  'src/views/forge-responder/HydrantFlowTestWizard.tsx':['29.84','Class AA','Save Demo Flow Test'],
  'src/views/forge-responder/HydrantInspectionWizard.tsx':['Inspection Checklist','Save Demo Inspection'],
  'src/views/forge-responder/HydrantDamageWizard.tsx':['Damage / Repair Intake','Submit Demo Damage Report']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL ${file} missing ${token}`);failed=true}
}
if(failed) process.exit(1)
console.log('Hydrant GIS/workflow ThemeSelection validation PASS')
