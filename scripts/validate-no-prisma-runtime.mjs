import fs from 'node:fs'
import path from 'node:path'

const bad=[]
function walk(dir){
  if(!fs.existsSync(dir)) return
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,ent.name)
    if(ent.isDirectory()) walk(full)
    else if(ent.isFile() && /\.(ts|tsx|js|mjs)$/.test(full)){
      const txt=fs.readFileSync(full,'utf8')
      if(/@prisma\/client|PrismaClient|PrismaAdapter|@auth\/prisma-adapter/.test(txt)) bad.push(full)
    }
  }
}
walk('src')
if(bad.length){
  console.error('FAIL Prisma runtime references remain:')
  bad.forEach(x=>console.error(` - ${x}`))
  process.exit(1)
}
const pkg=JSON.parse(fs.readFileSync('package.json','utf8'))
if((pkg.scripts?.postinstall||'').includes('prisma')){
  console.error('FAIL postinstall still runs Prisma')
  process.exit(1)
}
if(fs.existsSync('src/app/api/auth')){
  console.error('FAIL NextAuth API route remains')
  process.exit(1)
}
console.log('No-Prisma booth runtime validation PASS')
