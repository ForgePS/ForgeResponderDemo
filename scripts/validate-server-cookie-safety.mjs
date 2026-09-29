import fs from 'node:fs'

let failed=false
const helpers=fs.readFileSync('src/@core/utils/serverHelpers.ts','utf8')
for(const token of ['decodeURIComponent(raw)','try {','catch {','return {}']){
  if(!helpers.includes(token)){
    console.error(`FAIL serverHelpers missing ${token}`)
    failed=true
  }
}
if(/return JSON\.parse\(cookieStore/.test(helpers)){
  console.error('FAIL unsafe direct cookie JSON.parse remains')
  failed=true
}
const theme=fs.readFileSync('src/configs/themeConfig.ts','utf8')
if(!theme.includes("settingsCookieName: 'forge-responder-demo-v34'")){
  console.error('FAIL versioned Forge settings cookie missing')
  failed=true
}
if(!fs.existsSync('src/app/[lang]/(dashboard)/(private)/system-smoke/page.tsx')){
  console.error('FAIL system smoke page missing')
  failed=true
}
if(failed) process.exit(1)
console.log('Server cookie safety/shared-layout validation PASS')
