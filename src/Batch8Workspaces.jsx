
import React, { useMemo } from 'react'
import { ShieldCheck, Clock3, Users, Database, ArrowRight } from 'lucide-react'

const activeIds = data => new Set(
  data.transactions.map(t => String(t.customer_id))
)

function validDay(value) {
  if (!value || typeof value !== 'string') return null
  const day = value.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return null
  const date = new Date(day + 'T00:00:00Z')
  return Number.isFinite(date.getTime()) &&
    date.toISOString().slice(0, 10) === day ? date : null
}

export function ActivationIntelligence({data, channel, onExplore}) {
  const insight = useMemo(() => {
    const customers = data.customers.filter(c =>
      channel === 'All Channels' ||
      c.acquisition_channel === channel
    )
    const ids = activeIds(data)

    const silent = customers.filter(c =>
      c.kyc_status === 'Completed' &&
      !ids.has(String(c.customer_id))
    )

    const txByCustomer = new Map()
    for (const tx of data.transactions) {
      const key = String(tx.customer_id)
      const date = validDay(tx.transaction_date)
      if (!date) continue
      const previous = txByCustomer.get(key)
      if (!previous || date < previous) {
        txByCustomer.set(key, date)
      }
    }

    const delays = []
    let missingEvidence = 0
    let invalidOrder = 0

    for (const c of customers) {
      if (c.kyc_status !== 'Completed' ||
          !ids.has(String(c.customer_id))) continue

      const kyc = validDay(c.kyc_completed_date)
      const first = txByCustomer.get(String(c.customer_id))
      if (!kyc || !first) {
        missingEvidence++
        continue
      }

      const days = Math.round(
        (first.getTime() - kyc.getTime()) / 86400000
      )
      if (days < 0) {
        invalidOrder++
        continue
      }
      delays.push(days)
    }

    delays.sort((a,b) => a-b)
    const median = delays.length
      ? (delays[Math.floor((delays.length-1)/2)] +
         delays[Math.floor(delays.length/2)]) / 2
      : null

    return {
      total:customers.length,
      active:customers.filter(c =>
        ids.has(String(c.customer_id))
      ).length,
      silent:silent.length,
      delays,
      median,
      missingEvidence,
      invalidOrder
    }
  }, [data, channel])

  return (
    <div className="b8-workspace">
      <div className="b8-header">
        <Clock3 size={27}/>
        <div>
          <h2>Activation Intelligence</h2>
          <p>Understand time to first transaction and
             verified customers without recorded activity.</p>
        </div>
      </div>
      <div className="b8-metrics">
        <div><span>Selected customers</span>
          <strong>{insight.total}</strong></div>
        <div><span>Activated customers</span>
          <strong>{insight.active}</strong></div>
        <div><span>Verified but inactive</span>
          <strong>{insight.silent}</strong></div>
        <div><span>Median KYC-to-first-transaction</span>
          <strong>{insight.median === null
            ? 'Not available' : insight.median+' days'}</strong></div>
      </div>

      <div className="b8-panels">
        <section className="panel">
          <h3>Silent Customer Detector</h3>
          <p className="b8-note">
            These fictional customers completed KYC but have
            no recorded transaction. Reasons are unknown.
          </p>
          <div className="b8-feature-stat">
            <Users size={21}/>
            <strong>{insight.silent}</strong>
            <span>potential activation opportunities</span>
          </div>
          <button className="b8-button"
            onClick={() => onExplore(
              'Completed', 'Not activated'
            )}>
            <span>Investigate silent customers</span><ArrowRight size={16}/>
          </button>
        </section>

        <section className="panel">
          <h3>Time-to-Activation Intelligence</h3>
          {insight.median === null ? (
            <p className="b8-note">
              Valid KYC-completion and first-transaction
              date pairs are not available for this cohort.
              No activation timing has been invented.
            </p>
          ) : (
            <div className="b8-feature-stat">
              <Clock3 size={21}/>
              <strong>{insight.median} days</strong>
              <span>median across valid activated cases</span>
            </div>
          )}
          <p className="b8-note">
            Valid timing pairs: {insight.delays.length}.
            Missing date evidence: {insight.missingEvidence}.
            Negative intervals excluded: {insight.invalidOrder}.
          </p>
          <button className="b8-button"
            onClick={() => onExplore(
              'Completed', 'Activated'
            )}>
            <span>Investigate activated cohort</span><ArrowRight size={16}/>
          </button>
        </section>
      </div>
      <p className="b8-note">
        Timing uses earliest recorded transaction minus the
        stored KYC completion date. It measures recorded
        behavior, not intent or predicted future activation.
      </p>
    </div>
  )
}

export function MetricIntegrity({report}) {
  const passed = report.checks.filter(c=>c.passed).length
  return (
    <div className="b8-workspace">
      <div className="b8-header">
        <ShieldCheck size={27}/>
        <div>
          <h2>Metric Integrity Guardian</h2>
          <p>SQL data-quality verification with transparent
             build-time evidence.</p>
        </div>
      </div>
      <div className="b8-metrics">
        <div>
          <span>Checks passed</span>
          <strong>{passed}/{report.checks.length}</strong>
        </div>
        <div>
          <span>Checks needing attention</span>
          <strong>{report.checks.length-passed}</strong>
        </div>
        <div>
          <span>Dataset classification</span>
          <strong>Synthetic</strong>
        </div>
      </div>
      <section className="panel">
        <h3>Data Quality Audit</h3>
        <div className="b8-quality-list">
          {report.checks.map((check,i)=>(
            <div className="b8-quality-row" key={i}>
              <span className={
                check.passed ? 'b8-pass' : 'b8-fail'
              }>{check.passed ? 'PASS' : 'REVIEW'}</span>
              <div>
                <strong>{check.name}</strong>
                <small>{check.detail}</small>
              </div>
            </div>
          ))}
        </div>
      </section>
      <p className="b8-note">
        Source: {report.source}. Results describe the SQLite
        snapshot when Batch 8 was installed, not continuous
        real-time monitoring. {report.dateCoverage}.
        Invalid timing dates identified: {report.invalidDates}.
      </p>
    </div>
  )
}
