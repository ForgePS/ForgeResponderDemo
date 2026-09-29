import fs from 'node:fs'
import path from 'node:path'

const root='src'
const bad=[]
function walk(dir){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    const full=path.join(dir,ent.name)
    if(ent.isDirectory()) walk(full)
    else if(ent.isFile() && (full.endsWith('.tsx')||full.endsWith('.ts'))){
      const txt=fs.readFileSync(full,'utf8')
      if(/<Alert\b[^>]*\bvariant=['"]tonal['"]/.test(txt)) bad.push(full)
    }
  }
}
walk(root)
if(bad.length){
  console.error('FAIL invalid MUI Alert variant tonal in:')
  bad.forEach(x=>console.error(` - ${x}`))
  process.exit(1)
}
console.log('MUI Alert variant validation PASS')
