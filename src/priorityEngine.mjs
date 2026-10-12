
// FINSIGHT BATCH 11B - SYNTHETIC EVIDENCE ENGINE
const day = value => {
  const text = String(value || '').slice(0,10)
  if(!/^\d{4}-\d{2}-\d{2}$/.test(text)) return null
  const d = new Date(text+'T00:00:00Z')
  return Number.isFinite(d.getTime()) &&
    d.toISOString().slice(0,10)===text ? d : null
}

export const plans = [
  {
    id:'kyc',
    name:'Recover Incomplete KYC',
    metric:'KYC completion rate',
    impact:2, confidence:.9, effort:4,
    hypothesis:'Simpler verification guidance may improve KYC completion.',
    intervention:'Pilot clearer document and verification guidance.',
    criterion:'Test the KYC completion rate against a control group.',
    guardrail:'Verification accuracy and support workload',
    opportunity:'Customers who have not completed KYC'
  },
  {
    id:'inactive',
    name:'Activate Verified Customers',
    metric:'Eligible activation rate',
    impact:3, confidence:.9, effort:3,
    hypothesis:'First-transaction guidance may increase activation.',
    intervention:'Pilot an optional guided first transaction journey.',
    criterion:'Compare first-transaction rates in a controlled test.',
    guardrail:'Customer complaints or support workload',
    opportunity:'Verified customers without transactions'
  },
  {
    id:'slow',
    name:'Reduce Activation Delay',
    metric:'Median time to first transaction',
    impact:2, confidence:.75, effort:5,
    hypothesis:'Guided discovery may reduce time to first transaction.',
    intervention:'Test simplified product discovery after KYC.',
    criterion:'Measure time to first transaction with the same observation window.',
    guardrail:'Complaint rate and inappropriate prompting',
    opportunity:'Low activation within an acquisition channel'
  }
]

export function analyzeOpportunities(data,channel='All Channels') {
  const customers = data.customers.filter(c =>
    channel==='All Channels' || c.acquisition_channel===channel
  )
  const eligible=customers.filter(c=>c.kyc_status==='Completed')
  const active=new Set(data.transactions.map(t=>String(t.customer_id)))
  const first=new Map()
  for(const tx of data.transactions) {
    const id=String(tx.customer_id), date=day(tx.transaction_date)
    if(!date) continue
    if(!first.has(id) || date<first.get(id)) first.set(id,date)
  }
  let delayed=0, valid=0, missing=0, invalid=0
  for(const c of eligible) {
    const id=String(c.customer_id)
    if(!active.has(id)) continue
    const start=day(c.kyc_completed_date), finish=first.get(id)
    if(!start || !finish) {missing++;continue}
    const days=Math.round((finish-start)/86400000)
    if(days<0) {invalid++;continue}
    valid++
    if(days>7) delayed++
  }
  const incomplete=customers.length-eligible.length
  const silent=eligible.filter(c=>
    !active.has(String(c.customer_id))
  ).length

  return {
    selected:customers.length,incomplete,silent,delayed,
    valid,missing,invalid,
    rows:plans.map(p=>({
      ...p,
      reach:p.id==='kyc' ? incomplete :
        p.id==='inactive' ? silent : delayed
    }))
  }
}

export function priorityScore(reach,impact,confidence,effort) {
  const numbers=[reach,impact,confidence,effort].map(Number)
  if(numbers.some(v=>!Number.isFinite(v))) return null
  if(reach<0 || !Number.isInteger(reach) ||
     impact<1 || impact>3 ||
     confidence<.5 || confidence>1 ||
     effort<1 || effort>12) return null
  return reach*impact*confidence/effort
}

export function prioritize(rows,settings={}) {
  return rows.map(row=>{
    const changes=settings[row.id] || {}
    const impact=changes.impact ?? row.impact
    const confidence=changes.confidence ?? row.confidence
    const effort=changes.effort ?? row.effort
    return {
      ...row,impact,confidence,effort,
      score:priorityScore(row.reach,impact,confidence,effort)
    }
  }).sort((a,b)=>(b.score??-1)-(a.score??-1))
}
