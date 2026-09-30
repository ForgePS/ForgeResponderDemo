import fs from 'node:fs'

let failed=false
function fail(message){console.error('FAIL '+message);failed=true}
function read(file){if(!fs.existsSync(file)){fail('missing '+file);return ''}return fs.readFileSync(file,'utf8')}
function json(file){const text=read(file);try{return JSON.parse(text)}catch{fail('invalid JSON '+file);return []}}

const cad=read('src/lib/forge-platform/cad.ts')
const intelligence=read('src/lib/forge-platform/incident-intelligence.ts')
const panel=read('src/views/forge-responder/IncidentTacticalIntelligence.tsx')
const workspace=read('src/views/forge-responder/IncidentWorkspace.tsx')
const prefill=read('src/lib/forge-platform/prefill.ts')
const store=read('src/utils/forgeDataStore.ts')

for(const token of [
  "STRUCTURE_FIRE",
  "2600 Spahn Rd",
  "latitude:38.2825",
  "longitude:-97.24",
  "simulatedUnitCallsigns"
]) if(!cad.includes(token))fail('CAD simulator missing '+token)

for(const token of [
  "location-context",
  "occupancy-links",
  "distanceFeet",
  "2500",
  "LINKED",
  "ADDRESS",
  "PROXIMITY"
]) if(!intelligence.includes(token))fail('incident intelligence missing '+token)

for(const token of [
  "Responder Tactical Intelligence",
  "Nearby Water Supply",
  "Apply Occupancy & Preplan Context to NERIS",
  "Open Occupancy",
  "Open Preplan"
]) if(!panel.includes(token))fail('tactical panel missing '+token)

if(!workspace.includes("<Tab label='Tactical Intelligence'/>"))fail('workspace missing Tactical Intelligence tab')
if(!store.includes("'incident-occupancy-links'"))fail('persistent store missing incident-occupancy-links')

for(const key of ['nl_site','an_complete','sn_street_name','sn_post_type','csop_incorporated_muni','csop_state','csop_postal_code']){
  if(!prefill.includes("'"+key+"'"))fail('standalone prefill missing NERIS civic field '+key)
}

const occupancies=json('src/data/forge-responder/occupancies.json')
const preplans=json('src/data/forge-responder/preplans.json')
const hydrants=json('src/data/forge-responder/hydrants.json')
const occupancy=occupancies.find(row=>row.id==='OCC-0003')
if(!occupancy)fail('OCC-0003 missing')
else{
  if((occupancy.addressLine1||occupancy.address)!=='2600 Spahn Rd')fail('OCC-0003 address does not match simulator')
  if(occupancy.preplanId!=='PP-0001')fail('OCC-0003 not linked to PP-0001')
  if(typeof occupancy.latitude!=='number'||typeof occupancy.longitude!=='number')fail('OCC-0003 coordinates missing')
}
const preplan=preplans.find(row=>row.id==='PP-0001')
if(!preplan)fail('PP-0001 missing')
else{
  if(preplan.occupancyId!=='OCC-0003')fail('PP-0001 occupancy link missing')
  if(preplan.approvalStatus!=='APPROVED')fail('PP-0001 must be APPROVED')
  if(!preplan.tacticalSummary||!preplan.hazards||!preplan.accessNotes||!preplan.utilityNotes)fail('PP-0001 tactical context incomplete')
}
if(occupancy){
  const nearest=hydrants
    .filter(row=>typeof row.latitude==='number'&&typeof row.longitude==='number')
    .map(row=>({row,d:Math.hypot(row.latitude-occupancy.latitude,row.longitude-occupancy.longitude)}))
    .sort((a,b)=>a.d-b.d)[0]
  if(!nearest||nearest.d>0.001)fail('no nearby hydrant seeded for OCC-0003')
}

if(failed)process.exit(1)
console.log('Incident tactical intelligence validation PASS')
