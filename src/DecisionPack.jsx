
// FINSIGHT BATCH 12 DECISION WORKSPACE
import React, {useMemo, useState} from 'react'
import {FileDown, FileText, ShieldCheck} from 'lucide-react'
import {
  analyzeOpportunities, prioritize
} from './priorityEngine.mjs'

const fmt = value => Number(value).toLocaleString('en-IN')

const clean = value => String(value ?? '')
  .normalize('NFKD')
  .replace(/[^\x20-\x7E]/g, ' ')
  .replace(/\s+/g, ' ')
  .trim()

export default function DecisionPack({
  drafts, evidence, channel, customers, transactions
}) {
  const [selectedId,setSelectedId] = useState('')
  const [exporting,setExporting] = useState(false)
  const [error,setError] = useState('')

  const selected = drafts.find(d=>d.id===selectedId)
  const opportunities=useMemo(()=>{
    const source={customers,transactions}
    return prioritize(
      analyzeOpportunities(source,channel).rows
    )
  },[customers,transactions,channel])

  async function makePDF() {
    setError('')
    setExporting(true)
    try {
      const {jsPDF} = await import('jspdf')
      const pdf = new jsPDF({
        orientation:'portrait',
        unit:'mm',
        format:'a4'
      })
      const pageWidth=210, margin=19, contentWidth=172
      let y=22
      let pageNumber=1

      function header() {
        pdf.setFillColor(12,34,62)
        pdf.rect(0,0,pageWidth,18,'F')
        pdf.setFont('helvetica','bold')
        pdf.setTextColor(255,255,255)
        pdf.setFontSize(11)
        pdf.text('FinSight X  |  DECISION INTELLIGENCE',margin,11)
        pdf.setTextColor(38,61,85)
      }

      function footer() {
        pdf.setDrawColor(210,224,234)
        pdf.line(margin,282,191,282)
        pdf.setFont('helvetica','normal')
        pdf.setFontSize(8)
        pdf.setTextColor(103,122,142)
        pdf.text('Synthetic portfolio demonstration - Not financial advice',
          margin,288)
        pdf.text(String(pageNumber),188,288,{align:'right'})
      }

      function newPage() {
        footer()
        pdf.addPage()
        pageNumber++
        header()
        y=27
      }

      function ensure(height) {
        if (y+height>275) newPage()
      }

      function section(title) {
        ensure(16)
        y+=5
        pdf.setFont('helvetica','bold')
        pdf.setFontSize(12)
        pdf.setTextColor(11,91,142)
        pdf.text(clean(title),margin,y)
        y+=7
      }

      function paragraph(text) {
        pdf.setFont('helvetica','normal')
        pdf.setFontSize(10)
        pdf.setTextColor(45,66,87)
        const lines=pdf.splitTextToSize(
          clean(text) || 'Not specified',contentWidth
        )
        for(const line of lines) {
          ensure(6)
          pdf.text(line,margin,y)
          y+=5.4
        }
        y+=2
      }

      function metric(label,value) {
        ensure(9)
        pdf.setFont('helvetica','bold')
        pdf.setFontSize(9.5)
        pdf.setTextColor(43,65,88)
        pdf.text(clean(label),margin,y)
        pdf.setTextColor(10,106,139)
        pdf.text(clean(value),191,y,{align:'right'})
        y+=8
      }

      header()
      y=29
      pdf.setFont('helvetica','bold')
      pdf.setFontSize(20)
      pdf.setTextColor(17,62,103)
      pdf.text('Executive Decision Pack',margin,y)
      y+=10
      paragraph(
        'Management briefing | Synthetic financial product data | '+
        'Generated '+new Date().toLocaleDateString('en-GB')
      )

      section('1. Validated descriptive evidence')
      metric('Selected channel',channel)
      metric('Registered customers',fmt(evidence.customers))
      metric('KYC completed',fmt(evidence.completed))
      metric('KYC incomplete',fmt(evidence.kycIncomplete))
      metric('Activated customers',fmt(evidence.activated))
      metric('Verified but inactive',fmt(evidence.verifiedInactive))
      metric('KYC completion rate',
        evidence.kycRate.toFixed(1)+'%')
      metric('Eligible activation rate',
        evidence.eligibleActivation.toFixed(1)+'%')

      section('2. Executive interpretation')
      paragraph(
        'This snapshot reveals funnel leakage and potential '+
        'activation opportunities. It does not establish why '+
        'customers dropped out or predict experiment outcomes.'
      )

      section('3. Relative opportunity ranking')
      for(const [i,r] of opportunities.entries()) {
        ensure(24)
        pdf.setFont('helvetica','bold')
        pdf.setFontSize(10)
        pdf.setTextColor(18,58,97)
        pdf.text(
          `${i+1}. ${clean(r.name)} - ${r.reach} affected`,
          margin,y
        )
        y+=6
        paragraph('Suggested action: '+r.intervention)
        paragraph('Measurement: '+r.metric)
      }

      newPage()
      section('4. Selected experiment proposal')
      if(selected) {
        metric('Experiment',selected.title)
        metric('Proposed timeframe',selected.timeframe)
        metric('Proposed owner',selected.owner)
        section('Business opportunity')
        paragraph(selected.opportunity)
        section('Hypothesis')
        paragraph(selected.hypothesis)
        section('Proposed intervention')
        paragraph(selected.intervention)
        section('Primary KPI')
        paragraph(selected.primaryMetric)
        section('Guardrail')
        paragraph(selected.guardrail)
        section('Success criteria')
        paragraph(selected.successCriteria)
      } else {
        paragraph(
          'No experiment selected. This is a portfolio-level '+
          'decision briefing. Select a saved draft to include '+
          'its detailed hypothesis and measurement plan.'
        )
      }

      section('5. Recommended decision process')
      paragraph(
        'Review the conversion gap; validate event and customer '+
        'definitions; prioritize a small pilot; define control '+
        'and treatment cohorts; pre-register success criteria; '+
        'monitor operational guardrails; assess results before rollout.'
      )

      section('6. Integrity and limitations')
      paragraph(
        'All customers and transactions are fictional. The React '+
        'dashboard reads a local exported snapshot, not a live '+
        'production API. Priority scores rely on illustrative '+
        'impact, confidence and effort assumptions. The results '+
        'simulator does not contain a conducted randomized trial. '+
        'Real deployment requires access controls, consent, '+
        'compliance review, event instrumentation and experiment '+
        'governance.'
      )
      footer()

      pdf.save('FinSight_X_Executive_Decision_Pack.pdf')
    } catch(err) {
      setError('PDF export failed: '+String(err?.message||err))
    } finally {
      setExporting(false)
    }
  }

  return (
    <section className="b12-pack">
      <div className="b12-pack-title">
        <FileText size={25}/>
        <div>
          <h3>Executive Decision Pack</h3>
          <p>Generate a management-ready PDF from the
            selected synthetic customer evidence.</p>
        </div>
      </div>
      <div className="b12-metrics">
        <div><span>Selected customers</span>
          <strong>{fmt(evidence.customers)}</strong></div>
        <div><span>KYC incomplete</span>
          <strong>{fmt(evidence.kycIncomplete)}</strong></div>
        <div><span>Verified but inactive</span>
          <strong>{fmt(evidence.verifiedInactive)}</strong></div>
        <div><span>Eligible activation</span>
          <strong>{evidence.eligibleActivation.toFixed(1)}%</strong></div>
      </div>

      <label className="b12-selector">
        Experiment to include in PDF
        <select value={selectedId}
          onChange={e=>setSelectedId(e.target.value)}>
          <option value="">Overall management briefing</option>
          {drafts.map(d=>(
            <option key={d.id} value={d.id}>{d.title}</option>
          ))}
        </select>
      </label>

      <div className="b12-section">
        <h4>Current recommended priorities</h4>
        {opportunities.map((r,i)=>(
          <div className="b12-priority" key={r.id}>
            <strong>{i+1}. {r.name}</strong>
            <span>{r.reach} affected customers</span>
          </div>
        ))}
        <p>Ranking uses the Opportunity Prioritizer's default
          illustrative assumptions, not its locally edited
          scenario settings.</p>
      </div>

      <div className="b12-section">
        <h4>Document contents</h4>
        <p>Executive overview, selected channel KPIs,
          opportunity ranking, proposed intervention,
          selected experiment hypothesis, measurement plan,
          guardrails, limitations and recommended next steps.</p>
      </div>

      <div className="b12-disclaimer">
        <ShieldCheck size={17}/>
        Synthetic records and assumptions only. This report
        is not proof of experimental success or investment advice.
      </div>

      <button type="button" className="b12-export"
        disabled={exporting} onClick={makePDF}>
        <FileDown size={17}/>
        {exporting ? 'Generating PDF...' :
          'Download Executive PDF Decision Pack'}
      </button>
      {error && <p className="b12-error" role="alert">{error}</p>}
    </section>
  )
}
