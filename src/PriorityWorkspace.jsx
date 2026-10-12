
// FINSIGHT BATCH 11B - PRIORITIZATION WORKSPACE
import React,{useMemo,useEffect,useState} from 'react'
import {
  Target,Download,FlaskConical,RotateCcw,ArrowRight
} from 'lucide-react'
import {
  analyzeOpportunities,prioritize
} from './priorityEngine.mjs'

const KEY='finsight-priority-config-v1'
const TEMPLATE_KEY='finsight-priority-prefill-v1'

function readSettings() {
  try {
    if(typeof window==='undefined') return {}
    const item=JSON.parse(localStorage.getItem(KEY)||'{}')
    return item && typeof item==='object' && !Array.isArray(item)
      ? item : {}
  } catch {return {}}
}

export default function PriorityWorkspace({
  data,channel,onPlan
}) {
  const [settings,setSettings]=useState(readSettings)
  const [notice,setNotice]=useState('')
  const evidence=useMemo(
    ()=>analyzeOpportunities(data,channel),[data,channel]
  )
  const ranked=useMemo(
    ()=>prioritize(evidence.rows,settings),
    [evidence,settings]
  )

  useEffect(()=>{
    try {
      localStorage.setItem(KEY,JSON.stringify(settings))
    } catch {
      setNotice('Browser settings could not be saved.')
    }
  },[settings])

  function update(id,field,value) {
    setSettings(s=>({
      ...s,[id]:{...s[id],[field]:Number(value)}
    }))
  }

  function plan(row) {
    const template={
      title:row.name+' - Pilot',
      opportunity:row.opportunity,
      hypothesis:row.hypothesis,
      intervention:row.intervention,
      successCriteria:row.criterion,
      guardrail:row.guardrail,
      primaryMetric:row.id==='kyc'
        ? 'KYC completion rate':'Eligible activation rate',
      timeframe:'4 weeks',
      owner:'Product Team'
    }
    try {
      sessionStorage.setItem(
        TEMPLATE_KEY,JSON.stringify(template)
      )
      onPlan()
    } catch {
      setNotice('Browser session storage unavailable.')
    }
  }

  function download() {
    const quote=v=>{
      const text=String(v??'')
      const safe=/^[=+\-@]/.test(text)?"'"+text:text
      return '"'+safe.replace(/"/g,'""')+'"'
    }
    const records=[
      ['Rank','Opportunity','Channel','Observed reach',
       'Impact assumption','Confidence assumption',
       'Person-weeks assumption','Score',
       'Primary KPI','Proposed intervention',
       'Evidence limitation'],
      ...ranked.map((r,i)=>[
        i+1,r.name,channel,r.reach,r.impact,
        r.confidence,r.effort,
        r.score===null?'Invalid':r.score.toFixed(2),
        r.metric,r.intervention,
        'Synthetic descriptive cohort; not measured uplift'
      ])
    ]
    const csv=records.map(r=>r.map(quote).join(',')).join('\r\n')
    const blob=new Blob(['\uFEFF'+csv],{
      type:'text/csv;charset=utf-8'
    })
    const url=URL.createObjectURL(blob)
    const link=document.createElement('a')
    link.href=url
    link.download='finsight_opportunity_priorities.csv'
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(()=>URL.revokeObjectURL(url),1000)
  }

  return (
    <div className="prio-page">
      <div className="prio-header">
        <Target size={29}/>
        <div>
          <span>FINANCIAL PRODUCT INTELLIGENCE</span>
          <h2>Opportunity Prioritizer</h2>
          <p>Identify customer gaps, compare proposed actions
          and prioritize experiments with explicit assumptions.</p>
        </div>
      </div>

      <div className="prio-metrics">
        <div><span>Selected customers</span>
          <strong>{evidence.selected}</strong></div>
        <div><span>KYC incomplete</span>
          <strong>{evidence.incomplete}</strong></div>
        <div><span>Verified but inactive</span>
          <strong>{evidence.silent}</strong></div>
        <div><span>Activated after 7 days</span>
          <strong>{evidence.delayed}</strong></div>
      </div>

      <div className="prio-info">
        <strong>Transparent RICE-style method</strong>
        <p>Score = observed cohort size x assumed impact x
        assumed confidence / assumed effort.</p>
        <p>Timing evidence: {evidence.valid} valid pairs,
        {evidence.missing} missing, {evidence.invalid}
        invalid. The 7-day threshold is an illustrative
        prioritization rule, not a clinical or industry standard.</p>
      </div>

      <div className="prio-toolbar">
        <button type="button" onClick={download}>
          <Download size={16}/> Export CSV
        </button>
        <button type="button" onClick={()=>setSettings({})}>
          <RotateCcw size={16}/> Reset scoring
        </button>
      </div>

      {notice&&<p role="alert">{notice}</p>}
      <div className="prio-grid">
        {ranked.map((r,i)=>(
          <section key={r.id} className="prio-card">
            <div className="prio-card-head">
              <div>
                <small>PRIORITY #{i+1}</small>
                <h3>{r.name}</h3>
              </div>
              <div className="prio-score">
                <span>Priority score</span>
                <strong>{r.score===null
                  ?'Invalid':r.score.toFixed(1)}</strong>
              </div>
            </div>
            <p><strong>{r.reach}</strong> affected customers
            in the selected synthetic cohort.</p>

            <div className="prio-inputs">
              <label>Impact
                <select value={r.impact}
                  onChange={e=>update(
                    r.id,'impact',e.target.value
                  )}>
                  <option value={1}>Low (1)</option>
                  <option value={2}>Medium (2)</option>
                  <option value={3}>High (3)</option>
                </select>
              </label>
              <label>Confidence
                <select value={r.confidence}
                  onChange={e=>update(
                    r.id,'confidence',e.target.value
                  )}>
                  <option value={.5}>50%</option>
                  <option value={.75}>75%</option>
                  <option value={.9}>90%</option>
                  <option value={1}>100%</option>
                </select>
              </label>
              <label>Person-weeks
                <input type="number" min={1} max={12}
                  step={1} value={r.effort}
                  onChange={e=>update(
                    r.id,'effort',e.target.value
                  )}/>
              </label>
            </div>

            <div className="prio-action-text">
              <strong>Proposed action</strong>
              <p>{r.intervention}</p>
              <strong>Primary KPI</strong>
              <p>{r.metric}</p>
              <strong>Success evaluation</strong>
              <p>{r.criterion}</p>
            </div>

            <button type="button" className="prio-plan"
              onClick={()=>plan(r)}>
              <FlaskConical size={16}/>
              Design this Experiment
              <ArrowRight size={16}/>
            </button>
          </section>
        ))}
      </div>
      <p className="prio-foot">
        Opportunities may overlap. Scores rank planning
        assumptions; they are not financial forecasts
        or proof of causal improvement.
      </p>
    </div>
  )
}
