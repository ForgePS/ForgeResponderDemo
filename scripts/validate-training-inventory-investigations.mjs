import fs from 'node:fs'
const required={
  'src/app/[lang]/(dashboard)/(private)/training/page.tsx':['Assign Training','Credential Records'],
  'src/views/forge-responder/TrainingAssignmentWizard.tsx':['training-assignment','Assign Demo Training'],
  'src/views/forge-responder/TrainingCompletionPanel.tsx':['training-completion','Record Demo Completion'],
  'src/app/[lang]/(dashboard)/(private)/inventory/page.tsx':['Inventory Control','New Demo Transaction'],
  'src/views/forge-responder/InventoryTransactionWizard.tsx':['inventory-transaction','Save Demo Transaction'],
  'src/app/[lang]/(dashboard)/(private)/investigations/page.tsx':['Investigation Lifecycle','Open Demo Case'],
  'src/views/forge-responder/InvestigationWizard.tsx':['investigation-case','Chain-of-Custody']
}
let failed=false
for(const [file,tokens] of Object.entries(required)){
  if(!fs.existsSync(file)){console.error(`FAIL missing ${file}`);failed=true;continue}
  const txt=fs.readFileSync(file,'utf8')
  for(const token of tokens) if(!txt.includes(token)){console.error(`FAIL ${file} missing ${token}`);failed=true}
}
if(failed) process.exit(1)
console.log('Training/inventory/investigations ThemeSelection validation PASS')
