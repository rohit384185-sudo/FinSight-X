// FINSIGHT EXPERIMENT ARROW FIX 9B1

import React, { useEffect, useMemo, useState } from 'react'
import DecisionPack from './DecisionPack.jsx'
import './decision_pack.css'
import ExperimentResultsLab from './ExperimentResultsLab.jsx'
import './experiment_results.css'
import {
  FlaskConical, FileDown, Pencil, Trash2, ArrowRight,
  Save, RotateCcw, AlertTriangle, CheckCircle2
} from 'lucide-react'

const STORAGE_KEY = 'finsight-experiments-v1'

const initialForm = {
  title: '',
  opportunity: 'Verified customers without transactions',
  hypothesis: '',
  intervention: '',
  primaryMetric: 'Eligible activation rate',
  guardrail: 'Customer complaints or support workload',
  successCriteria: '',
  timeframe: '4 weeks',
  owner: 'Product Team'
}

function readDrafts() {
  try {
    if (typeof window === 'undefined') return []
    const value = JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || '[]'
    )
    if (!Array.isArray(value)) return []
    return value.filter(x =>
      x && typeof x.id === 'string' &&
      typeof x.title === 'string'
    ).slice(0, 100)
  } catch {
    return []
  }
}

function downloadText(filename, content) {
  const blob = new Blob(
    ['\uFEFF' + content],
    {type:'text/markdown;charset=utf-8'}
  )
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function cleanText(value) {
  return String(value || '').trim()
}

function safeLine(value) {
  return cleanText(value)
    .replace(/\r\n?/g, '\n')
    .replace(/\n/g, ' ')
}

export default function ExperimentStudio({
  customers,
  transactions,
  channel,
  onOpenSimulator
}) {
  const [form, setForm] = useState(() => {
    if (typeof window === 'undefined') return initialForm
    try {
      const key = 'finsight-priority-prefill-v1'
      const raw = window.sessionStorage.getItem(key)
      if (!raw) return initialForm
      const value = JSON.parse(raw)
      window.sessionStorage.removeItem(key)
      if (!value || typeof value !== 'object') return initialForm
      const safe = {}
      for (const key of Object.keys(initialForm)) {
        if (typeof value[key] === 'string') {
          safe[key] = value[key]
        }
      }
      return {...initialForm, ...safe}
    } catch {
      return initialForm
    }
  })
  // FINSIGHT BATCH 12 DECISION WORKSPACE
  const [activeWorkspace, setActiveWorkspace] = useState('design')
  const [drafts, setDrafts] = useState(readDrafts)
  const [editingId, setEditingId] = useState(null)
  const [message, setMessage] = useState('')
  const [storageError, setStorageError] = useState('')

  const evidence = useMemo(() => {
    const selected = customers.filter(c =>
      channel === 'All Channels' ||
      c.acquisition_channel === channel
    )
    const selectedIds = new Set(
      selected.map(c => String(c.customer_id))
    )
    const eligible = selected.filter(
      c => c.kyc_status === 'Completed'
    )
    const eligibleIds = new Set(
      eligible.map(c => String(c.customer_id))
    )
    const recordedActive = new Set(
      transactions
        .filter(t => selectedIds.has(String(t.customer_id)))
        .map(t => String(t.customer_id))
    )
    const eligibleActive = [...recordedActive].filter(
      id => eligibleIds.has(id)
    ).length
    const active = recordedActive.size
    return {
      customers:selected.length,
      completed:eligible.length,
      activated:active,
      kycIncomplete:selected.length-eligible.length,
      verifiedInactive:eligible.length-eligibleActive,
      kycRate:selected.length
        ? eligible.length/selected.length*100 : 0,
      eligibleActivation:eligible.length
        ? eligibleActive/eligible.length*100 : 0
    }
  }, [customers,transactions,channel])

  useEffect(() => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY, JSON.stringify(drafts)
      )
      setStorageError('')
    } catch {
      setStorageError(
        'Browser storage unavailable. Drafts may not survive refresh.'
      )
    }
  }, [drafts])

  const update = (field, value) => {
    setForm(previous => ({...previous,[field]:value}))
    setMessage('')
  }

  const reset = () => {
    setForm(initialForm)
    setEditingId(null)
    setMessage('')
  }

  const save = event => {
    event.preventDefault()
    if (!cleanText(form.title) ||
        !cleanText(form.hypothesis) ||
        !cleanText(form.intervention) ||
        !cleanText(form.successCriteria)) {
      setMessage('Complete all required experiment fields.')
      return
    }

    const timestamp = new Date().toISOString()
    const record = {
      ...form,
      title:cleanText(form.title),
      hypothesis:cleanText(form.hypothesis),
      intervention:cleanText(form.intervention),
      successCriteria:cleanText(form.successCriteria),
      id:editingId || (
        timestamp + '-' + Math.random().toString(36).slice(2,10)
      ),
      createdAt:editingId
        ? drafts.find(d=>d.id===editingId)?.createdAt || timestamp
        : timestamp,
      updatedAt:timestamp,
      status:'Draft - not launched'
    }
    setDrafts(previous => {
      const next = editingId
        ? previous.map(d => d.id===editingId ? record : d)
        : [record,...previous]
      return next.slice(0,100)
    })
    reset()
    setMessage('Experiment draft saved locally.')
  }

  const edit = record => {
    const fields = Object.fromEntries(
      Object.keys(initialForm).map(k => [
        k,record[k] || initialForm[k]
      ])
    )
    setForm(fields)
    setEditingId(record.id)
    setMessage('Editing selected draft.')
    window.scrollTo({top:0,behavior:'smooth'})
  }

  const remove = record => {
    if (!window.confirm(
      'Delete this locally saved experiment draft?'
    )) return
    setDrafts(previous =>
      previous.filter(d => d.id!==record.id)
    )
    if (editingId===record.id) reset()
    setMessage('Draft deleted.')
  }

  const exportMemo = record => {
    const text = [
      '# FinSight X - Executive Decision Memo',
      '',
      '## Experiment',
      safeLine(record.title),
      '',
      '## Current evidence',
      '- Data classification: SYNTHETIC demonstration',
      '- Selected acquisition channel: '+safeLine(channel),
      '- Customer records: '+evidence.customers,
      '- KYC completed: '+evidence.completed,
      '- KYC incomplete: '+evidence.kycIncomplete,
      '- Activated customers: '+evidence.activated,
      '- Verified but inactive: '+evidence.verifiedInactive,
      '- KYC completion rate: '+evidence.kycRate.toFixed(1)+'%',
      '- Eligible activation rate: '+
        evidence.eligibleActivation.toFixed(1)+'%',
      '',
      '## Opportunity',
      safeLine(record.opportunity),
      '',
      '## Hypothesis',
      safeLine(record.hypothesis),
      '',
      '## Proposed intervention',
      safeLine(record.intervention),
      '',
      '## Primary KPI',
      safeLine(record.primaryMetric),
      '',
      '## Guardrail metric',
      safeLine(record.guardrail),
      '',
      '## Success criteria',
      safeLine(record.successCriteria),
      '',
      '## Proposed evaluation window',
      safeLine(record.timeframe),
      '',
      '## Proposed owner',
      safeLine(record.owner),
      '',
      '## Status',
      'Draft only. Experiment not launched.',
      '',
      '## Assumptions and limitations',
      '- The evidence is derived from fictional records.',
      '- Descriptive conversion gaps are not proven causes.',
      '- No randomized experiment or uplift has been measured.',
      '- Real execution requires appropriate access,',
      '  privacy controls, cohort assignment and tracking.',
      '- Channel metrics reflect the filter selected at export.',
      '- This is a management discussion draft, not',
      '  financial, investment or KYC decision advice.',
      '',
      'Generated at (UTC): '+new Date().toISOString(),
      ''
    ].join('\n')

    downloadText('finsight_executive_decision_memo.md',text)
  }

  const fields = [
    ['title','Experiment title *','text',
      'Example: Improve first transaction activation'],
    ['hypothesis','Hypothesis *','textarea',
      'If we simplify the first transaction journey, more verified users may activate.'],
    ['intervention','Proposed intervention *','textarea',
      'Example: Optional guided product walkthrough'],
    ['successCriteria','Success criteria *','textarea',
      'Example: Eligible activation rate improves in a controlled test'],
    ['guardrail','Guardrail metric','text',
      'Example: Support tickets do not increase']
  ]

  return (
    <div className="exp-workspace">
      <nav className="b12-tabs" aria-label="Experiment workspaces">
        <button type="button"
          className={activeWorkspace==='design' ? 'is-active' : ''}
          aria-pressed={activeWorkspace==='design'}
          onClick={()=>setActiveWorkspace('design')}>
          Design Experiment
        </button>
        <button type="button"
          className={activeWorkspace==='evaluate' ? 'is-active' : ''}
          aria-pressed={activeWorkspace==='evaluate'}
          onClick={()=>setActiveWorkspace('evaluate')}>
          Evaluate Results
        </button>
        <button type="button"
          className={activeWorkspace==='memo' ? 'is-active' : ''}
          aria-pressed={activeWorkspace==='memo'}
          onClick={()=>setActiveWorkspace('memo')}>
          Decision Memo & PDF
        </button>
      </nav>
      <section className="exp-hero">
        <div className="exp-hero-icon"><FlaskConical size={27}/></div>
        <div>
          <span className="exp-eyebrow">PRODUCT EXPERIMENT INTELLIGENCE</span>
          <h2>Experiment Design Studio</h2>
          <p>Turn product opportunities into testable hypotheses,
            measurement plans and decision-ready briefs.</p>
        </div>
      </section>

      <div className="exp-evidence">
        <div><span>Selected customers</span>
          <strong>{evidence.customers}</strong></div>
        <div><span>KYC completed</span>
          <strong>{evidence.completed}</strong></div>
        <div><span>Verified, not active</span>
          <strong>{evidence.verifiedInactive}</strong></div>
        <div><span>Eligible activation</span>
          <strong>{evidence.eligibleActivation.toFixed(1)}%</strong></div>
      </div>

      {activeWorkspace==='design' && (
      <div className="exp-columns">
        <section className="panel exp-editor">
          <div className="exp-heading">
            <div>
              <h3>{editingId?'Edit Experiment':'Design New Experiment'}</h3>
              <p>Define what to test and how success will be measured.</p>
            </div>
            <FlaskConical size={21}/>
          </div>

          <form onSubmit={save}>
            <label className="exp-field">
              Business opportunity
              <select value={form.opportunity}
                onChange={e=>update('opportunity',e.target.value)}>
                <option>Verified customers without transactions</option>
                <option>Customers who have not completed KYC</option>
                <option>Low activation within an acquisition channel</option>
                <option>Financial product adoption opportunity</option>
              </select>
            </label>

            {fields.map(([key,label,type,placeholder]) => (
              <label className="exp-field" key={key}>
                {label}
                {type==='textarea' ? (
                  <textarea rows={3} value={form[key]}
                    maxLength={1000} placeholder={placeholder}
                    onChange={e=>update(key,e.target.value)}/>
                ) : (
                  <input type="text" value={form[key]}
                    maxLength={160} placeholder={placeholder}
                    onChange={e=>update(key,e.target.value)}/>
                )}
              </label>
            ))}

            <div className="exp-two">
              <label className="exp-field">
                Primary KPI
                <select value={form.primaryMetric}
                  onChange={e=>update('primaryMetric',e.target.value)}>
                  <option>Eligible activation rate</option>
                  <option>KYC completion rate</option>
                  <option>Overall activation rate</option>
                  <option>Transactions per active customer</option>
                </select>
              </label>
              <label className="exp-field">
                Proposed evaluation window
                <select value={form.timeframe}
                  onChange={e=>update('timeframe',e.target.value)}>
                  <option>2 weeks</option>
                  <option>4 weeks</option>
                  <option>6 weeks</option>
                  <option>8 weeks</option>
                </select>
              </label>
            </div>

            <label className="exp-field">
              Proposed owner
              <input type="text" maxLength={100}
                value={form.owner}
                onChange={e=>update('owner',e.target.value)}/>
            </label>

            <div className="exp-actions">
              <button type="submit" className="exp-primary">
                <Save size={16}/>
                {editingId?'Update Draft':'Save Experiment Draft'}
              </button>
              <button type="button" className="exp-secondary"
                onClick={reset}><RotateCcw size={16}/> Clear</button>
            </div>
            {message && <p className="exp-message" role="status">{message}</p>}
            {storageError &&
              <p className="exp-error" role="alert">{storageError}</p>}
          </form>
        </section>

        <section className="panel exp-library">
          <div className="exp-heading">
            <div>
              <h3>Saved Experiments</h3>
              <p>{drafts.length} local experiment drafts</p>
            </div>
            <CheckCircle2 size={21}/>
          </div>

          {drafts.length===0 ? (
            <div className="exp-empty">
              <FlaskConical size={32}/>
              <h3>No experiments saved yet</h3>
              <p>Create a draft to enable editing and
                 Executive Decision Memo export.</p>
            </div>
          ) : drafts.map(record => (
            <article className="exp-draft" key={record.id}>
              <div className="exp-draft-head">
                <strong>{record.title}</strong>
                <span>Draft</span>
              </div>
              <p>{record.opportunity}</p>
              <small>Primary KPI: {record.primaryMetric}</small>
              <div className="exp-draft-actions">
                <button type="button"
                  onClick={()=>edit(record)}>
                  <Pencil size={15}/> Edit
                </button>
                <button type="button"
                  onClick={()=>exportMemo(record)}>
                  <FileDown size={15}/> Download Memo
                </button>
                <button type="button"
                  onClick={()=>remove(record)}>
                  <Trash2 size={15}/> Delete
                </button>
              </div>
            </article>
          ))}

          {/* FINSIGHT EXPERIMENT RESULTS BATCH 10 */}


          <div className="exp-method">
            <AlertTriangle size={18}/>
            <div>
              <strong>Evidence vs experiment outcome</strong>
              <p>The figures above describe our synthetic data.
                Saving a hypothesis does not establish that the
                proposed intervention will succeed.</p>
            </div>
          </div>
          <button type="button" className="exp-link"
            onClick={onOpenSimulator}>
            Open Financial Decision Twin <ArrowRight size={16}/>
          </button>
        </section>
      </div>
      )}
      {activeWorkspace==='evaluate' && (
        <section className="b12-single-panel">
          <ExperimentResultsLab
            drafts={drafts}
            channel={channel}
            evidence={evidence}
          />
        </section>
      )}
      {activeWorkspace==='memo' && (
        <DecisionPack
          drafts={drafts}
          evidence={evidence}
          channel={channel}
          customers={customers}
          transactions={transactions}
        />
      )}
    </div>
  )
}
