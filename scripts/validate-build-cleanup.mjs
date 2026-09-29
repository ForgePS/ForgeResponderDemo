import fs from 'node:fs'

let failed=false
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))

if(!pkg.scripts?.['clean:generated']){
  console.error('FAIL clean:generated script missing')
  failed=true
}
if(!pkg.scripts?.['build:verified']?.includes('clean:generated')){
  console.error('FAIL build:verified does not clean generated artifacts')
  failed=true
}

const ps=fs.readFileSync('BUILD_FORGE_RESPONDER.ps1','utf8')
if(!ps.includes('Removing stale Next.js build artifacts') || !ps.includes('clean-generated-build.mjs')){
  console.error('FAIL Windows build launcher does not clean .next')
  failed=true
}

if(failed) process.exit(1)
console.log('Generated build cleanup validation PASS')
