
// FINSIGHT EXPERIMENT RESULTS BATCH 10
import React, {useEffect, useMemo, useState} from 'react'
import {
  FlaskConical, Download, AlertTriangle,
  BarChart3, RotateCcw
} from 'lucide-react'
import {evaluateScenario} from './experimentMath.mjs'

const KEY='finsight-results-lab-v1'
const DEFAULT = {
  controlN:'200',
  controlYes:'140',
  treatmentN:'200',
  treatmentYes:'156',
  controlBad:'8',
  treatmentBad:'11',
  guardrailLimit:'2',
  selectedDraft:''
}

function initialValues() {
  try {
    if (typeof window==='undefined') return DEFAULT
    const stored=JSON.parse(localStorage.getItem(KEY)||'null')
    return stored && typeof stored==='object'
      ? {...DEFAULT,...stored} : DEFAULT
  } catch {
    return DEFAULT
  }
}

function saveDownload(filename,text,type) {
  const blob=new Blob(['\uFEFF'+text],{type})
  const url=URL.createObjectURL(blob)
  const a=document.createElement('a')
  a.href=url
  a.download=filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}

const numericFields=[
  ['controlN','Control customers'],
  ['controlYes','Control conversions'],
  ['treatmentN','Treatment customers'],
  ['treatmentYes','Treatment conversions'],
  ['controlBad','Control complaints'],
  ['treatmentBad','Treatment complaints'],
  ['guardrailLimit','Max complaint increase (percentage points)']
]

function display(value,digits=1) {
  return Number(value).toFixed(digits)
}

export default function ExperimentResultsLab({
  drafts=[],channel='All Channels',evidence
}) {
  const [values,setValues]=useState(initialValues)
  const [storageWarning,setStorageWarning]=useState('')
  const result=useMemo(
    ()=>evaluateScenario(values),[values]
  )
  const selected=drafts.find(
    d=>d.id===values.selectedDraft
  )

  useEffect(()=>{
    try {
      localStorage.setItem(KEY,JSON.stringify(values))
      setStorageWarning('')
    } catch {
      setStorageWarning(
        'Browser storage is unavailable; values may not persist.'
      )
    }
  },[values])

  function update(field,value) {
    setValues(old=>({...old,[field]:value}))
  }

  function exportResults(format) {
    if (result.error) return
    const context=selected?.title || 'Unassigned scenario'
    const rows=[
      ['Experiment draft',context],
      ['Selected channel',channel],
      ['Evidence classification','Synthetic dataset snapshot'],
      ['Scenario classification','Illustrative, user-entered inputs'],
      ['Historical cohort customers',evidence?.customers??''],
      ['Historical verified inactive',evidence?.verifiedInactive??''],
      ['Control group size',result.data.controlN],
      ['Control conversions',result.data.controlYes],
      ['Control rate (%)',display(result.controlRate,2)],
      ['Treatment group size',result.data.treatmentN],
      ['Treatment conversions',result.data.treatmentYes],
      ['Treatment rate (%)',display(result.treatmentRate,2)],
      ['Absolute uplift (pp)',display(result.upliftPP,2)],
      ['Relative uplift (%)',result.relativeUplift===null
        ? 'N/A - zero control rate'
        : display(result.relativeUplift,2)],
      ['Approximate lower 95% bound (pp)',display(result.lower,2)],
      ['Approximate upper 95% bound (pp)',display(result.upper,2)],
      ['Normal approximation checks',result.adequate?'Pass':'Not met'],
      ['Illustrative statistical signal',result.signal?'Yes':'No'],
      ['Complaint rate difference (pp)',display(result.badDelta,2)],
      ['Allowed complaint increase (pp)',
        display(result.guardrailLimit,2)],
      ['Guardrail status',result.guardrailPass?'Within limit':'Exceeded'],
      ['Experiment actually conducted','No'],
      ['Conclusion',
        'Scenario calculations only. No real causal evidence.']
    ]
    if(format==='csv') {
      const csv=rows.map(row=>
        row.map(v=>'"'+String(v).replace(/"/g,'""')+'"').join(',')
      ).join('\r\n')
      saveDownload(
        'finsight_experiment_results.csv',
        csv,'text/csv;charset=utf-8'
      )
    } else {
      const md=[
        '# FinSight X - Illustrative Experiment Results',
        '',
        ...rows.map(r=>'- **'+r[0]+'**: '+r[1]),
        '',
        '## Interpretation',
        'The 95% interval uses an approximate unpooled normal method.',
        'It does not correct for multiple testing or confounding.',
        'No randomized test or real experiment outcomes were observed.',
        'A statistical signal here is only conditional on invented inputs.',
        ''
      ].join('\n')
      saveDownload(
        'finsight_experiment_results.md',
        md,'text/markdown;charset=utf-8'
      )
    }
  }

  return (
    <div className="erl-wrap">
      <div className="erl-heading">
        <div>
          <span className="erl-kicker">SIMULATED EXPERIMENT ANALYSIS</span>
          <h3><FlaskConical size={19}/> Experiment Results Lab</h3>
          <p>Compare illustrative Control vs Treatment outcomes.</p>
        </div>
        <BarChart3 size={22}/>
      </div>

      <div className="erl-warning">
        <AlertTriangle size={17}/>
        <span>These inputs are hypothetical, not observed A/B-test data.
          The output does not prove causality or expected uplift.</span>
      </div>

      <label className="erl-field">
        Link to saved experiment (optional)
        <select value={values.selectedDraft}
          onChange={e=>update('selectedDraft',e.target.value)}>
          <option value="">Unassigned scenario</option>
          {drafts.map(d=>(
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
      </label>

      <div className="erl-fields">
        {numericFields.map(([field,label])=>(
          <label key={field} className="erl-field">
            {label}
            <input type="number" min="0"
              max={field==='guardrailLimit'?'100':'1000000'}
              step={field==='guardrailLimit'?'0.1':'1'}
              value={values[field]}
              onChange={e=>update(field,e.target.value)}/>
          </label>
        ))}
      </div>

      {result.error ? (
        <p className="erl-error" role="alert">{result.error}</p>
      ) : (
        <>
          <div className="erl-results">
            <div><span>Control conversion</span>
              <strong>{display(result.controlRate)}%</strong></div>
            <div><span>Treatment conversion</span>
              <strong>{display(result.treatmentRate)}%</strong></div>
            <div><span>Absolute uplift</span>
              <strong>{result.upliftPP>=0?'+':''}
                {display(result.upliftPP)} pp</strong></div>
            <div><span>Relative uplift</span>
              <strong>{result.relativeUplift===null
                ?'N/A':display(result.relativeUplift)+'%'}</strong>
            </div>
          </div>
          <div className="erl-findings">
            <p><strong>Approx. 95% confidence interval:</strong>
              {' '}{display(result.lower)} to
              {' '}{display(result.upper)} percentage points.</p>
            <p><strong>Sample adequacy:</strong>
              {' '}{result.adequate
                ? 'Normal approximation checks met.'
                : 'Small group / sparse outcomes; interpret with caution.'}
            </p>
            <p><strong>Illustrative statistical signal:</strong>
              {' '}{result.signal
                ? 'Interval excludes zero.'
                : 'No supported signal under this approximation.'}
            </p>
            <p><strong>Complaint guardrail:</strong>
              {' '}{display(result.controlBadRate)}% control vs
              {' '}{display(result.treatmentBadRate)}% treatment;
              {' '}{result.guardrailPass
                ? 'within proposed tolerance.'
                : 'proposed tolerance exceeded.'}
            </p>
          </div>
        </>
      )}

      {storageWarning &&
        <p className="erl-error">{storageWarning}</p>}

      <div className="erl-actions">
        <button type="button" disabled={!!result.error}
          onClick={()=>exportResults('csv')}>
          <Download size={15}/> Results CSV
        </button>
        <button type="button" disabled={!!result.error}
          onClick={()=>exportResults('md')}>
          <Download size={15}/> Analysis Memo
        </button>
        <button type="button" className="erl-reset"
          onClick={()=>setValues({...DEFAULT})}>
          <RotateCcw size={15}/> Reset
        </button>
      </div>
      <p className="erl-footnote">
        Approximate Wald confidence interval for difference
        in two proportions. Intended for learning and
        hypothetical planning, not a substitute for an
        appropriately designed real experiment.
      </p>
    </div>
  )
}
