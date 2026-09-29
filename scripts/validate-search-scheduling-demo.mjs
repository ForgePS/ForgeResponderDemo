import fs from 'node:fs'
const required={
  'src/app/[lang]/(dashboard)/(private)/search/page.tsx':['OperationalSearch','Searchable records'],
  'src/views/forge-responder/OperationalSearch.tsx':['Search Forge Responder','Open Record'],
  'src/app/[lang]/(dashboard)/(private)/scheduling/shift-trades/page.tsx':['Trade History','Request Demo Trade'],
  'src/views/forge-responder/ShiftTradeWizard.tsx':['Qualification checks','shift-trade-request','Submit Demo Trade'],
  'src/app/[lang]/(dashboard)/(private)/demo-control/page.tsx':['Demo Control Center','DemoControlCenter'],
  'src/views/forge-responder/DemoControlCenter.tsx':['Reset Demo Session','Presenter Launchpad']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL ${file} missing ${token}`);failed=true}
}
const routes='src/app/[lang]/(dashboard)/(private)'
for(const file of fs.readdirSync(routes,{recursive:true}).filter(x=>String(x).endsWith('page.tsx'))){
  const full=`${routes}/${file}`
  const txt=fs.readFileSync(full,'utf8')
  if(/integration queue|coming soon|under construction/i.test(txt)){console.error(`FAIL placeholder remains: ${full}`);failed=true}
}
if(failed) process.exit(1)
console.log('Operational search/shift trades/demo-control validation PASS; no Forge route placeholders remain')
