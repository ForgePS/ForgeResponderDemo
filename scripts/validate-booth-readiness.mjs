import fs from 'node:fs'
const required={
  'src/components/forge-responder/BoothToolbar.tsx':['BOOTH MODE','Reset','requestFullscreen'],
  'src/views/forge-responder/DemoPreflight.tsx':['Local demo storage','Mapbox','External submissions'],
  'src/app/[lang]/(dashboard)/(private)/demo-readiness/page.tsx':['Demo Readiness','DemoPreflight'],
  'src/views/forge-responder/GuidedDemo.tsx':['Demo Sequence','Hydrant GIS','NERIS'],
  'src/app/[lang]/(dashboard)/(private)/guided-demo/page.tsx':['Guided Demo','GuidedDemo'],
  'docs/BOOTH_RUNBOOK.md':['Strongest 5-minute demo','Between attendees'],
  'docs/LOCAL_START.md':['pnpm install','pnpm build'],
  'docs/forge-route-manifest.json':['routeCount']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL ${file} missing ${token}`);failed=true}
}
const manifest=JSON.parse(fs.readFileSync('docs/forge-route-manifest.json','utf8'))
if(manifest.routeCount<90){console.error(`FAIL route manifest count ${manifest.routeCount}`);failed=true}
if(failed) process.exit(1)
console.log(`Booth readiness validation PASS (${manifest.routeCount} private routes)`)
