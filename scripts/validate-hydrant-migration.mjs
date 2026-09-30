import fs from 'node:fs'

let failed=false
function fail(message){console.error('FAIL '+message);failed=true}
function read(file){if(!fs.existsSync(file)){fail('missing '+file);return ''}return fs.readFileSync(file,'utf8')}

const hydrants=read('src/lib/forge-platform/hydrants.ts')
const route=read('src/app/api/hydrants/migration-export/route.ts')
for(const token of [
  'buildStandaloneHydrantMigrationBundle',
  "readForgeData<Hydrant[]>('hydrants')",
  "'hydrant-flow-tests'",
  "'hydrant-inspections'",
  "'hydrant-damage-reports'",
  "sourceSystem:'FORGE_RESPONDER'",
  'sourceHydrantId'
]) if(!hydrants.includes(token))fail('migration bundle missing '+token)

for(const token of [
  "getForgePlatformMode()!=='demo'",
  'Content-Disposition',
  'Cache-Control',
  'buildStandaloneHydrantMigrationBundle'
]) if(!route.includes(token))fail('migration export route missing '+token)

if(route.includes('localStorage')||hydrants.includes('localStorage'))fail('migration export must not use localStorage')
if(failed)process.exit(1)
console.log('Hydrant migration export validation PASS')
