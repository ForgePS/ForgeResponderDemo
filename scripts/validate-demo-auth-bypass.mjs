import fs from 'node:fs'
let failed=false
const providers=fs.readFileSync('src/components/Providers.tsx','utf8')
if(providers.includes('NextAuthProvider')||providers.includes('SessionProvider')){console.error('FAIL auth session provider still mounted');failed=true}
if(fs.existsSync('src/app/api/auth')){console.error('FAIL auth API remains');failed=true}
if(fs.existsSync('src/libs/auth.ts')){console.error('FAIL auth library remains');failed=true}
const rootPage=fs.readFileSync('src/app/page.tsx','utf8')
if(!rootPage.includes("redirect('/en/guided-demo')")){console.error('FAIL root redirect missing');failed=true}
if(failed) process.exit(1)
console.log('Trade-show auth removal/root-route validation PASS')
