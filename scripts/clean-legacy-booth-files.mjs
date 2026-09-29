// Persistent demo branding lives in demo-persistence and is intentionally never deleted here.
import fs from 'node:fs'

const targets=[
  'src/libs/auth.ts',
  'src/contexts/nextAuthProvider.tsx',
  'src/hocs/AuthGuard.tsx',
  'src/hocs/GuestOnlyRoute.tsx',
  'src/views/Login.tsx',
  'src/app/api/auth',
  'src/app/api/login',
  'src/app/[lang]/(blank-layout-pages)/(guest-only)',
  'src/app/[lang]/(blank-layout-pages)/pages/auth',
  'src/prisma'
]

for(const target of targets){
  if(!fs.existsSync(target)) continue
  const stat=fs.statSync(target)
  if(stat.isDirectory()) fs.rmSync(target,{recursive:true,force:true})
  else fs.rmSync(target,{force:true})
  console.log(`Removed legacy artifact: ${target}`)
}

console.log('Legacy booth cleanup complete')
