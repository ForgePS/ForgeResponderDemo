import fs from 'node:fs'

const required=[
  'src/app/api/demo-branding/route.ts',
  'src/app/api/demo-branding/file/route.ts',
  'src/components/forge-responder/DemoBrandingSettings.tsx',
  'src/components/forge-responder/PersistentDemoBranding.tsx',
  'BACKUP_DEMO_BRANDING.bat',
  'BACKUP_DEMO_BRANDING.ps1'
]

let failed=false

for(const file of required){
  if(!fs.existsSync(file)){
    console.error(`FAIL missing persistent branding file: ${file}`)
    failed=true
  }
}

const api=fs.readFileSync('src/app/api/demo-branding/route.ts','utf8')

for(const token of ['demo-persistence','branding.json','4 * 1024 * 1024','primaryLogo','secondaryLogo']){
  if(!api.includes(token)){
    console.error(`FAIL branding API missing ${token}`)
    failed=true
  }
}

const settings=fs.readFileSync('src/app/[lang]/(dashboard)/(private)/settings/page.tsx','utf8')

if(!settings.includes('DemoBrandingSettings')){
  console.error('FAIL Settings page missing Demo Branding')
  failed=true
}

const logo=fs.readFileSync('src/components/layout/shared/Logo.tsx','utf8')

if(!logo.includes('PersistentDemoBranding')){
  console.error('FAIL sidebar logo does not consume persistent agency branding')
  failed=true
}

const cleanup=fs.readFileSync('scripts/clean-legacy-booth-files.mjs','utf8')

if(cleanup.includes("'demo-persistence'") || cleanup.includes('"demo-persistence"')){
  console.error('FAIL cleanup script contains demo-persistence as a deletion target')
  failed=true
}

if(failed) process.exit(1)

console.log('Persistent demo branding validation PASS')
