
// FINSIGHT RELEASE HARDENING BATCH 13 RETRY
import fs from 'node:fs'
import React from 'react'
import {renderToString} from 'react-dom/server'
import {createServer} from 'vite'
import {jsPDF} from 'jspdf'
import {analyzeOpportunities,priorityScore}
  from '../src/priorityEngine.mjs'
import {evaluateScenario}
  from '../src/experimentMath.mjs'

let passed=0
function verify(ok,name) {
  if(!ok) throw new Error('FAIL: '+name)
  console.log('PASS: '+name)
  passed++
}
const source=JSON.parse(
  fs.readFileSync(new URL('../src/data.json',import.meta.url),'utf8')
)
const c=source.customers, t=source.transactions
verify(c.length===600,'600 synthetic customers')
verify(t.length===634,'634 synthetic transactions')
verify(c.filter(x=>x.kyc_status==='Completed').length===360,
  '360 KYC completed')
const ids=new Set(c.map(x=>String(x.customer_id)))
verify(ids.size===600,'Unique customer IDs')
verify(t.every(x=>ids.has(String(x.customer_id))),
  'Valid transaction customer references')
const active=new Set(t.map(x=>String(x.customer_id)))
verify(active.size===252,'252 activated customers')
verify(c.filter(x=>x.kyc_status==='Completed' &&
  !active.has(String(x.customer_id))).length===108,
  '108 verified inactive customers')

// An exported JSON snapshot may omit transaction_id.
// When missing, ID uniqueness is tested separately in SQLite.
const hasTransactionIDs=t.every(x=>
  x.transaction_id!==undefined && x.transaction_id!==null
)
if(hasTransactionIDs) {
  verify(new Set(t.map(x=>String(x.transaction_id))).size===t.length,
    'JSON transaction IDs unique')
} else {
  console.log(
    'INFO: transaction_id not exported; SQLite uniqueness checked in Python preflight'
  )
}

const opp=analyzeOpportunities(source)
verify(opp.incomplete===240,'240 incomplete KYC')
verify(opp.silent===108,'108 verified inactive')
verify(opp.valid===252,'252 valid activation date pairs')
verify(opp.delayed===117,'117 activations after seven days')
verify(Math.abs(priorityScore(240,2,.75,4)-90)<1e-9,
  'Priority scoring 90.0')
verify(priorityScore(240,2,.75,0)===null,
  'Invalid scoring input rejected')

const result=evaluateScenario({
  controlN:200, controlYes:140,
  treatmentN:200, treatmentYes:156,
  controlBad:8, treatmentBad:11,
  guardrailLimit:2
})
verify(!result.error && Math.abs(result.upliftPP-8)<1e-9,
  'Illustrative conversion uplift 8 pp')
verify(result.guardrailPass && !result.signal,
  'Guardrail and statistical caution')

const pdf=new jsPDF()
pdf.text('FinSight X PDF smoke test',15,20)
const bytes=new Uint8Array(pdf.output('arraybuffer'))
verify(
  bytes.length>1000 &&
  String.fromCharCode(...bytes.slice(0,4))==='%PDF',
  'PDF engine produces valid PDF signature'
)

const server=await createServer({
  server:{middlewareMode:true},appType:'custom'
})
try {
  const {default:App}=await server.ssrLoadModule('/src/App.jsx')
  verify(renderToString(React.createElement(App)).includes('Overview'),
    'Main React app renders')

  const {default:Studio}=await server.ssrLoadModule(
    '/src/ExperimentStudio.jsx'
  )
  const studio=renderToString(React.createElement(Studio,{
    customers:c,transactions:t,
    channel:'All Channels',onOpenSimulator:()=>{}
  }))
  verify(
    ['Design Experiment','Evaluate Results','Decision Memo'].every(
      term=>studio.includes(term)
    ),'Experiment workspaces render')

  const {default:Priority}=await server.ssrLoadModule(
    '/src/PriorityWorkspace.jsx'
  )
  verify(renderToString(React.createElement(Priority,{
    data:source,channel:'All Channels',onPlan:()=>{}
  })).includes('Opportunity Prioritizer'),
    'Opportunity Prioritizer renders')

  const {default:Pack}=await server.ssrLoadModule(
    '/src/DecisionPack.jsx'
  )
  verify(renderToString(React.createElement(Pack,{
    drafts:[],customers:c,transactions:t,
    channel:'All Channels',
    evidence:{
      customers:600,completed:360,activated:252,
      kycIncomplete:240,verifiedInactive:108,
      kycRate:60,eligibleActivation:70
    }
  })).includes('Executive Decision Pack'),
    'Executive Decision Pack renders')
} finally {
  await server.close()
}
console.log('STATUS: '+passed+' REGRESSION CHECKS PASSED')
