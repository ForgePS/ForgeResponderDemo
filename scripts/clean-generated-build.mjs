import fs from 'node:fs'

for(const target of ['.next']){
  if(fs.existsSync(target)){
    fs.rmSync(target,{recursive:true,force:true})
    console.log(`Removed generated build artifact: ${target}`)
  }
}

console.log('Generated build cleanup complete')
