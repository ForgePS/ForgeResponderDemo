import fs from 'node:fs'
const catalog=JSON.parse(fs.readFileSync('src/data/neris/neris-v1-schema-catalog.json','utf8'))
const required={
  'src/app/[lang]/(dashboard)/(private)/neris/page.tsx':['Schema-driven NERIS','NerisSchemaDashboard'],
  'src/app/[lang]/(dashboard)/(private)/neris/modules/[module]/page.tsx':['Field Schema','possible_if','value_set_location'],
  'src/app/[lang]/(dashboard)/(private)/neris/value-sets/page.tsx':['NERIS Value Sets','optionCount'],
  'src/utils/nerisSchema.ts':['fieldRequirement','humanizeNerisName'],
  'src/views/forge-responder/NerisSchemaDashboard.tsx':['Search NERIS modules','Open Module Schema']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL ${file} missing ${token}`);failed=true}
}
if(catalog.summary.moduleCount!==39){console.error('FAIL moduleCount');failed=true}
if(catalog.summary.fieldCount!==603){console.error('FAIL fieldCount');failed=true}
if(catalog.summary.valueSetCount!==126){console.error('FAIL valueSetCount');failed=true}
if(catalog.modules.length!==39){console.error('FAIL module catalog length');failed=true}
if(Object.keys(catalog.valueSets).length!==126){console.error('FAIL value-set catalog length');failed=true}
if(failed) process.exit(1)
console.log(`NERIS schema ThemeSelection validation PASS (${catalog.summary.moduleCount} modules, ${catalog.summary.fieldCount} fields, ${catalog.summary.valueSetCount} value sets)`)
