import fs from 'node:fs'
const required={
  'src/app/[lang]/(dashboard)/(private)/reports/page.tsx':['ReportBuilder','NERIS Fields'],
  'src/views/forge-responder/ReportBuilder.tsx':['report-generate','Export PDF','Email Report'],
  'src/app/[lang]/(dashboard)/(private)/activity/page.tsx':['EventTimeline','Source-backed records'],
  'src/app/[lang]/(dashboard)/(private)/admin/audit/page.tsx':['Audit Log','EventTimeline'],
  'src/app/[lang]/(dashboard)/(private)/settings/page.tsx':['Administration & Settings','AdminSettingsPanel'],
  'src/views/forge-responder/AdminSettingsPanel.tsx':['Roles & Permissions','Tenant Configuration','admin-config'],
  'src/app/[lang]/(dashboard)/(private)/maps/page.tsx':['Operational GIS Map','HydrantMapbox'],
  'src/views/forge-responder/HydrantMapbox.tsx':['react-map-gl/mapbox','Open Hydrant']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL ${file} missing ${token}`);failed=true}
}
if(failed) process.exit(1)
console.log('Admin/reports/activity/maps ThemeSelection validation PASS')
