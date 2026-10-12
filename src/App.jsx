import React, { useMemo, useState, useEffect } from 'react'
import {
  AreaChart, Area, CartesianGrid, XAxis, YAxis,
  Tooltip, ResponsiveContainer, BarChart, Bar,
  Legend
} from 'recharts'
import {
  LayoutDashboard, Users, ShieldCheck, TrendingUp,
  ArrowLeftRight, Database, SlidersHorizontal,
  Search, Bell, ChevronDown, Activity, Target,
  BarChart3, Zap, FileText, Sparkles, Settings, Sun, Moon, RotateCcw, Palette, FlaskConical
} from 'lucide-react'
import source from './data.json'
import PriorityWorkspace from './PriorityWorkspace.jsx'
import './priority_workspace.css'
import ExperimentStudio from './ExperimentStudio.jsx'
import './experiment_studio.css'
import qualityReport from './batch8_quality.json'
import {
  ActivationIntelligence,
  MetricIntegrity
} from './Batch8Workspaces.jsx'
import './batch8.css'

const NAV = [
  ['Overview', LayoutDashboard],
  ['Settings', Settings],
  ['Customer Intelligence', Users],
  ['Activation Intelligence', Activity],
  ['Metric Integrity', ShieldCheck],
  ['KYC & Activation', ShieldCheck],
  ['Product Performance', BarChart3],
  ['Decision Simulator', SlidersHorizontal],
  ['Decision Twin', Target],
  ['Experiment Studio', FlaskConical],
  ['Opportunity Prioritizer', Target],
  ['Data Explorer', Database]
]

const money = n => '\u20B9' + n.toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
})

function App() {
  const [page, setPage] = useState('Overview')
  // FINSIGHT WORKSPACE BATCH 4
  const [showKPIs, setShowKPIs] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  // FINSIGHT FUNCTIONAL TOOLS BATCH 5
  const [headerPanel, setHeaderPanel] = useState('')
  const [explorerStatus, setExplorerStatus] = useState('All')
  const [explorerPage, setExplorerPage] = useState(1)
  // FINSIGHT TRUST & ACTIVATION BATCH 8
  const [explorerActivation, setExplorerActivation] = useState('All')
  const [channel, setChannel] = useState('All Channels')
  const [target, setTarget] = useState(70)
  // FINSIGHT FINANCIAL DECISION TWIN BATCH 7
  const [twinA, setTwinA] = useState(70)
  const [twinB, setTwinB] = useState(80)

  // FINSIGHT SETTINGS BATCH 3
  const [prefs, setPrefs] = useState(() => {
    const defaults = {
      theme: 'dark',
      accent: 'blue',
      compact: false,
      reducedMotion: false
    }
    try {
      const saved = JSON.parse(
        window.localStorage.getItem('finsight-preferences-v1')
      )
      if (!saved || typeof saved !== 'object') return defaults
      return {
        theme: ['dark', 'light'].includes(saved.theme)
          ? saved.theme : defaults.theme,
        accent: ['blue', 'teal', 'violet'].includes(saved.accent)
          ? saved.accent : defaults.accent,
        compact: saved.compact === true,
        reducedMotion: saved.reducedMotion === true
      }
    } catch {
      return defaults
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(
        'finsight-preferences-v1',
        JSON.stringify(prefs)
      )
    } catch {
      // App remains functional if browser storage is unavailable.
    }
  }, [prefs])

  const changePref = (key, value) =>
    setPrefs(previous => ({ ...previous, [key]: value }))

  const resetPrefs = () => setPrefs({
    theme: 'dark',
    accent: 'blue',
    compact: false,
    reducedMotion: false
  })

  const chartGrid = prefs.theme === 'light'
    ? '#dbe5f2' : '#183150'
  const chartAxis = prefs.theme === 'light'
    ? '#56708d' : '#859bb8'
  const tooltipStyle = {
    background: prefs.theme === 'light' ? '#ffffff' : '#0b1b33',
    color: prefs.theme === 'light' ? '#142b48' : '#f3f8ff',
    border: '1px solid #6ca6df',
    borderRadius: 10
  }


  const channels = useMemo(
    () => [...new Set(source.customers.map(c => c.acquisition_channel))].sort(),
    []
  )

  const model = useMemo(() => {
    const people = source.customers.filter(
      c => channel === 'All Channels' || c.acquisition_channel === channel
    )
    const ids = new Set(people.map(c => c.customer_id))
    const tx = source.transactions.filter(t => ids.has(t.customer_id))
    const completed = people.filter(c => c.kyc_status === 'Completed')
    const activated = new Set(tx.map(t => t.customer_id)).size
    const rate = completed.length ? activated / completed.length : 0
    const kycRate = people.length ? completed.length / people.length : 0

    const monthly = {}
    people.forEach(c => {
      const month = c.signup_date.slice(0, 7)
      monthly[month] ||= { month, signups: 0, activated: 0 }
      monthly[month].signups++
    })
    const activeIds = new Set(tx.map(t => t.customer_id))
    people.forEach(c => {
      if (activeIds.has(c.customer_id)) {
        monthly[c.signup_date.slice(0, 7)].activated++
      }
    })

    const productData = source.products.map(p => {
      const subset = tx.filter(t => t.product_id === p.product_id)
      return {
        name: p.product_name,
        transactions: subset.length,
        fees: subset.reduce((a, t) => a + t.fee_amount, 0)
      }
    })

    const channelsData = channels.map(name => {
      const subset = source.customers.filter(c => c.acquisition_channel === name)
      const cids = new Set(subset.map(c => c.customer_id))
      const activeCount = new Set(
        source.transactions.filter(t => cids.has(t.customer_id)).map(t => t.customer_id)
      ).size
      return { name, signups: subset.length, activated: activeCount }
    })

    return {
      people: people.length,
      completed: completed.length,
      activated,
      tx: tx.length,
      fee: tx.reduce((a, t) => a + t.fee_amount, 0),
      rate,
      kycRate,
      monthly: Object.values(monthly).sort((a,b) => a.month.localeCompare(b.month)),
      productData,
      channelsData
    }
  }, [channel, channels])

  const projectedKyc = Math.max(
    model.completed,
    Math.round(model.people * target / 100)
  )
  const extraKyc = Math.max(0, projectedKyc - model.completed)
  const extraActivated = Math.round(extraKyc * model.rate)

  const cards = [
    ['Total Customers', model.people.toLocaleString('en-IN'), Users, 'Registered signups', 'blue'],
    ['KYC Completed', model.completed.toLocaleString('en-IN'), ShieldCheck, `${(model.kycRate*100).toFixed(1)}% completion`, 'teal'],
    ['Activated Customers', model.activated.toLocaleString('en-IN'), Zap, 'At least one transaction', 'purple'],
    ['Eligible Activation', `${(model.rate*100).toFixed(1)}%`, Target, 'Of KYC completed', 'blue'],
    ['Transactions', model.tx.toLocaleString('en-IN'), ArrowLeftRight, 'Recorded transactions', 'teal'],
    ['Simulated Fee Revenue', money(model.fee), TrendingUp, 'Illustrative fee proxy', 'purple']
  ]

  const panel = (title, content, subtitle = '') => (
    <section className="panel">
      <div className="panel-heading">
        <div><h3>{title}</h3>{subtitle && <p>{subtitle}</p>}</div>
        <Activity size={17} className="muted-icon" />
      </div>
      {content}
    </section>
  )

  const funnel = panel(
    'Customer Conversion Journey',
    <div className="funnel">
      {[
        ['Total Signups', model.people, 'linear-gradient(90deg,#1465ff,#32b9ff)'],
        ['KYC Completed', model.completed, 'linear-gradient(90deg,#087fb7,#21e0dc)'],
        ['Activated Customers', model.activated, 'linear-gradient(90deg,#5148c9,#a770ff)']
      ].map(([label, value, color], i) => (
        <div className={'funnel-step step-' + i} style={{background:color}} key={label}>
          <strong>{value.toLocaleString('en-IN')}</strong>
          <span>{label}</span>
        </div>
      ))}
      <div className="funnel-rates">
        KYC { (model.kycRate*100).toFixed(1) }% ?
        Eligible activation { (model.rate*100).toFixed(1) }%
      </div>
    </div>,
    'Signups ? Verification ? Product activation'
  )

  const cohort = panel(
    'Signup Cohort Intelligence',
    <ResponsiveContainer width="100%" height={265}>
      <AreaChart data={model.monthly}>
        <defs>
          <linearGradient id="gradientBlue" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#168cff" stopOpacity={0.42}/>
            <stop offset="100%" stopColor="#168cff" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid stroke={chartGrid} vertical={false}/>
        <XAxis dataKey="month" stroke={chartAxis} tick={{fontSize:11}}/>
        <YAxis stroke={chartAxis} tick={{fontSize:11}}/>
        <Tooltip contentStyle={tooltipStyle}/>
        <Legend/>
        <Area type="monotone" dataKey="signups" name="Signups" stroke="#168cff" strokeWidth={3} fill="url(#gradientBlue)"/>
        <Area type="monotone" dataKey="activated" name="Activated" stroke="#28dfcd" strokeWidth={3} fill="transparent"/>
      </AreaChart>
    </ResponsiveContainer>,
    'Monthly signups and activated users'
  )

  const products = panel(
    'Financial Product Performance',
    <ResponsiveContainer width="100%" height={265}>
      <BarChart data={model.productData}>
        <CartesianGrid stroke={chartGrid} vertical={false}/>
        <XAxis dataKey="name" stroke={chartAxis} tick={{fontSize:11}}/>
        <YAxis stroke={chartAxis} tick={{fontSize:11}}/>
        <Tooltip contentStyle={tooltipStyle}/>
        <Bar dataKey="transactions" fill="#168cff" radius={[7,7,0,0]} name="Transactions"/>
      </BarChart>
    </ResponsiveContainer>,
    'Transaction volume by financial product'
  )

  const acquisition = panel(
    'Acquisition Channel Intelligence',
    <ResponsiveContainer width="100%" height={265}>
      <BarChart data={model.channelsData}>
        <CartesianGrid stroke={chartGrid} vertical={false}/>
        <XAxis dataKey="name" stroke={chartAxis} tick={{fontSize:11}}/>
        <YAxis stroke={chartAxis} tick={{fontSize:11}}/>
        <Tooltip contentStyle={tooltipStyle}/>
        <Legend/>
        <Bar dataKey="signups" name="Signups" fill="#168cff" radius={[5,5,0,0]}/>
        <Bar dataKey="activated" name="Activated" fill="#26dbc8" radius={[5,5,0,0]}/>
      </BarChart>
    </ResponsiveContainer>,
    'Customer acquisition and activation by channel'
  )

  const simulator = panel(
    'Product Decision Simulator',
    <div className="sim-body">
      <div className="sim-tag"><Sparkles size={15}/> INTERACTIVE WHAT-IF</div>
      <p className="sim-copy">
        Explore hypothetical KYC completion improvements.
        These are calculated scenarios, not forecasts.
      </p>
      <div className="sim-comparison">
        <div><small>Current completion</small><strong>{(model.kycRate*100).toFixed(1)}%</strong></div>
        <div className="sim-arrow">?</div>
        <div><small>Target completion</small><strong className="cyan">{target}%</strong></div>
      </div>
      <input
        className="slider"
        type="range"
        min="60" max="90" step="5"
        value={target}
        onChange={e => setTarget(Number(e.target.value))}
      />
      <div className="slider-scale"><span>60%</span><span>75%</span><span>90%</span></div>
      <div className="impact-grid">
        <div className="impact"><small>Extra KYC completed</small><strong>+{extraKyc}</strong></div>
        <div className="impact highlighted"><small>Estimated extra activated</small><strong>+{extraActivated}</strong></div>
      </div>
      <p className="sim-note">Assumes the current eligible activation rate of {(model.rate*100).toFixed(1)}% remains constant.</p>
      <button type="button" className="fx-export-btn"
        onClick={exportScenario}>
        Download Scenario Report (CSV)
      </button>
    </div>,
    'Interactive assumptions-based scenario modeling'
  )


  const safeCell = value => {
    let text = String(value ?? '')
    if (/^[\s]*[=+\-@]/.test(text)) text = "'" + text
    return '"' + text.replace(/"/g, '""') + '"'
  }

  const downloadCSV = (filename, headers, rows) => {
    const content = [
      headers.map(safeCell).join(','),
      ...rows.map(row => row.map(safeCell).join(','))
    ].join('\r\n')

    const blob = new Blob(
      ['\uFEFF' + content],
      { type: 'text/csv;charset=utf-8' }
    )

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }

  const explorerRows = source.customers.filter(c => {
    const matchesChannel =
      channel === 'All Channels' ||
      c.acquisition_channel === channel

    const matchesStatus =
      explorerStatus === 'All' ||
      c.kyc_status === explorerStatus

    const query = searchQuery.trim().toLowerCase()
    const matchesSearch =
      !query || [
        c.customer_id,
        c.signup_date,
        c.acquisition_channel,
        c.kyc_status
      ].some(v => String(v).toLowerCase().includes(query))

    const activated = new Set(
      source.transactions.map(t => String(t.customer_id))
    ).has(String(c.customer_id))

    const matchesActivation =
      explorerActivation === 'All' ||
      (explorerActivation === 'Activated' && activated) ||
      (explorerActivation === 'Not activated' && !activated) ||
      (explorerActivation === 'KYC incomplete' &&
        c.kyc_status !== 'Completed')

    return matchesChannel && matchesStatus &&
      matchesSearch && matchesActivation
  })

  const explorerPageSize = 15
  const explorerPages = Math.max(
    1, Math.ceil(explorerRows.length / explorerPageSize)
  )
  const safeExplorerPage = Math.min(explorerPage, explorerPages)
  const explorerVisibleRows = explorerRows.slice(
    (safeExplorerPage - 1) * explorerPageSize,
    safeExplorerPage * explorerPageSize
  )

  const exportCustomers = () => {
    downloadCSV(
      'finsight_filtered_customers.csv',
      ['Customer ID','Signup Date','Acquisition Channel','KYC Status'],
      explorerRows.map(c => [
        c.customer_id,
        c.signup_date,
        c.acquisition_channel,
        c.kyc_status
      ])
    )
  }

  function exportScenario() {
    downloadCSV(
      'finsight_scenario_report.csv',
      [
        'Data Classification',
        'Acquisition Channel',
        'Total Customers',
        'Current KYC Completed',
        'Current Activated',
        'Current KYC Rate Percent',
        'Target KYC Rate Percent',
        'Eligible Activation Rate Percent',
        'Estimated Additional KYC',
        'Estimated Additional Activated',
        'Methodology'
      ],
      [[
        'Synthetic portfolio demonstration',
        channel,
        model.people,
        model.completed,
        model.activated,
        (model.kycRate * 100).toFixed(2),
        target,
        (model.rate * 100).toFixed(2),
        extraKyc,
        extraActivated,
        'Hypothetical scenario using constant eligible activation rate; not a forecast'
      ]]
    )
  }


  // FINSIGHT DISTINCT WORKSPACES BATCH 6
  const activeIds = new Set(
    source.transactions.map(t => String(t.customer_id))
  )

  const drillToExplorer = (
    status,
    selectedChannel = channel,
    activation = 'All'
  ) => {
    setChannel(selectedChannel)
    setExplorerStatus(status)
    setExplorerActivation(activation)
    setSearchQuery('')
    setExplorerPage(1)
    setPage('Data Explorer')
  }

  const customerSegments = [...new Set(
    source.customers
      .filter(c => channel === 'All Channels' ||
                   c.acquisition_channel === channel)
      .map(c => c.acquisition_channel)
  )].sort().map(name => {
    const rows = source.customers.filter(
      c => c.acquisition_channel === name
    )
    const completed = rows.filter(c =>
      c.kyc_status === 'Completed'
    )
    const activated = completed.filter(c =>
      activeIds.has(String(c.customer_id))
    )
    return {
      name,
      signups: rows.length,
      completed: completed.length,
      activated: activated.length,
      kycRate: rows.length
        ? 100 * completed.length / rows.length : 0,
      activationRate: completed.length
        ? 100 * activated.length / completed.length : 0
    }
  })

  const currentCustomers = source.customers.filter(c =>
    channel === 'All Channels' ||
    c.acquisition_channel === channel
  )
  const pendingCustomers = currentCustomers.filter(
    c => c.kyc_status !== 'Completed'
  )
  const verifiedInactiveCustomers = currentCustomers.filter(
    c => c.kyc_status === 'Completed' &&
         !activeIds.has(String(c.customer_id))
  )
  const verifiedActiveCustomers = currentCustomers.filter(
    c => c.kyc_status === 'Completed' &&
         activeIds.has(String(c.customer_id))
  )


  const twinFeePerActivated = model.activated > 0
    ? model.fee / model.activated : 0

  const calculateTwin = (targetPercent) => {
    const currentKYC = model.completed
    const hypotheticalKYC = Math.max(
      currentKYC,
      Math.round(model.people * targetPercent / 100)
    )
    const extraKYC = hypotheticalKYC - currentKYC
    const extraActivated = Math.round(
      extraKYC * model.rate
    )
    return {
      target: targetPercent,
      extraKYC,
      extraActivated,
      totalActivated: model.activated + extraActivated,
      feeSensitivity: extraActivated * twinFeePerActivated
    }
  }

  const outcomeA = calculateTwin(twinA)
  const outcomeB = calculateTwin(twinB)

  const exportTwinComparison = () => {
    downloadCSV(
      'finsight_decision_twin_comparison.csv',
      [
        'Scenario',
        'Data Classification',
        'Channel',
        'Customers',
        'Current KYC Rate %',
        'Target KYC Rate %',
        'Eligible Activation Rate %',
        'Extra KYC',
        'Estimated Extra Activated',
        'Illustrative Fee Sensitivity INR',
        'Assumption'
      ],
      [
        ['A','Synthetic',channel,model.people,
          (model.kycRate*100).toFixed(2),
          outcomeA.target,(model.rate*100).toFixed(2),
          outcomeA.extraKYC,outcomeA.extraActivated,
          outcomeA.feeSensitivity.toFixed(2),
          'Eligible activation and historical fee per activated customer held constant'],
        ['B','Synthetic',channel,model.people,
          (model.kycRate*100).toFixed(2),
          outcomeB.target,(model.rate*100).toFixed(2),
          outcomeB.extraKYC,outcomeB.extraActivated,
          outcomeB.feeSensitivity.toFixed(2),
          'Eligible activation and historical fee per activated customer held constant'],
        ['B minus A','Synthetic',channel,model.people,
          (model.kycRate*100).toFixed(2),
          outcomeB.target-outcomeA.target,
          (model.rate*100).toFixed(2),
          outcomeB.extraKYC-outcomeA.extraKYC,
          outcomeB.extraActivated-outcomeA.extraActivated,
          (outcomeB.feeSensitivity-outcomeA.feeSensitivity).toFixed(2),
          'Comparative difference between two hypothetical scenarios']
      ]
    )
  }

  const pageDescriptions = {
    'Overview':
      'Your financial product command center and executive metrics.',
    'Settings':
      'Personalize appearance, accessibility and workspace preferences.',
    'Activation Intelligence':
      'Investigate activation timing and verified customers without transactions.',
    'Metric Integrity':
      'Review data-quality evidence and validation findings.',
    'Customer Intelligence':
      'Understand acquisition channels, signup cohorts and activation.',
    'KYC & Activation':
      'Explore onboarding conversion and customer activation gaps.',
    'Product Performance':
      'Compare transaction activity across financial products.',
    'Opportunity Prioritizer':
      'Rank financial-product opportunities with measurable evidence.',
    'Experiment Studio':
      'Design measurable product experiments and export executive decision briefs.',
    'Decision Twin':
      'Compare two hypothetical product strategies with explicit assumptions.',
    'Decision Simulator':
      'Model hypothetical onboarding improvements and business impact.',
    'Data Explorer':
      'Explore searchable, fictional customer records.'
  }

  return (
    <div className={`shell theme-${prefs.theme} accent-${prefs.accent} ${prefs.compact ? "compact" : ""} ${prefs.reducedMotion ? "reduced-motion" : ""}`}>
      <aside className="sidebar">
        <div className="brand"><div className="brand-icon"><Activity size={24}/></div><div>FinSight <em>X</em><small>DATA TO DECISIONS</small></div></div>
        <div className="nav-caption">WORKSPACE</div>
        <nav>{NAV.map(([name, Icon]) => (
          <button className={'nav-item '+(page===name?'active':'')} key={name} onClick={()=>setPage(name)}>
            <Icon size={19}/><span>{name}</span>
          </button>
        ))}</nav>
        <div className="sidebar-bottom">
          <div className="status"><span className="status-dot"/> Validated Data Snapshot Loaded</div>
          <div className="source-label">Synthetic Financial Intelligence</div>
        </div>
      </aside>

      <main className="main">
        <header className="topbar">
          <div className="search-display">
            <Search size={17}/>
            <input
              type="search"
              aria-label="Search synthetic customer records"
              placeholder="Search customer ID, channel, KYC status..."
              value={searchQuery}
              onChange={e => {
                setSearchQuery(e.target.value)
                if (e.target.value.trim()) {
                  setPage('Data Explorer')
                }
              }}
            />
          </div>
          <div className="top-actions">
            <button type="button" className="fx-top-control"
              onClick={() => setHeaderPanel(
                headerPanel === 'portfolio' ? '' : 'portfolio'
              )}>PORTFOLIO DEMO</button>
            <button type="button" className="fx-icon-control"
              aria-label="Notifications"
              onClick={() => setHeaderPanel(
                headerPanel === 'notifications' ? '' : 'notifications'
              )}><Bell size={19}/></button>
            <button type="button" className="avatar fx-profile-control"
              aria-label="Profile menu"
              onClick={() => setHeaderPanel(
                headerPanel === 'profile' ? '' : 'profile'
              )}>FX</button>
          </div>

          {headerPanel && (
            <div className="fx-header-popover">
              <button type="button" className="fx-panel-close"
                onClick={() => setHeaderPanel('')}
                aria-label="Close panel">?</button>

              {headerPanel === 'portfolio' && (
                <>
                  <h3>FinSight X Portfolio Demo</h3>
                  <p>A financial product intelligence prototype
                     powered by validated synthetic data.</p>
                  <p><strong>600</strong> fictional customers,
                     <strong> 634</strong> transactions,
                     SQL + Power BI + React.</p>
                  <p>No live customer accounts or financial services.</p>
                </>
              )}

              {headerPanel === 'notifications' && (
                <>
                  <h3>Notification Center</h3>
                  <p>No live notifications are connected.</p>
                  <div className="fx-info-strip">
                    Demo status: financial data snapshot loaded.
                  </div>
                </>
              )}

              {headerPanel === 'profile' && (
                <>
                  <h3>Demo Workspace</h3>
                  <p>Local demonstration profile. No account
                     authentication is enabled.</p>
                  <button type="button" className="fx-menu-action"
                    onClick={() => {
                      setPage('Settings')
                      setHeaderPanel('')
                    }}>
                    Open Settings
                  </button>
                  <button type="button" className="fx-menu-action"
                    onClick={() => {
                      changePref(
                        'theme',
                        prefs.theme === 'dark' ? 'light' : 'dark'
                      )
                      setHeaderPanel('')
                    }}>
                    Switch to {prefs.theme === 'dark' ? 'Light' : 'Dark'} Theme
                  </button>
                </>
              )}
            </div>
          )}
        </header>

        <div className="content">
          <div className="page-head">
            <div>
              <div className="eyebrow">FINANCIAL PRODUCT INTELLIGENCE</div>
              <h1>{page}</h1>
              <p>{pageDescriptions[page]}</p>
            </div>
            <div className="fx-head-tools">
              {page !== 'Overview' && page !== 'Settings' && (
                <button
                  type="button"
                  className="fx-kpi-toggle"
                  aria-pressed={showKPIs}
                  onClick={() => setShowKPIs(value => !value)}
                >
                  {showKPIs ? 'Hide KPI Summary' : 'Show KPI Summary'}
                </button>
              )}
              {page !== 'Settings' && (
                <div className="filter-control">
              <span>Acquisition channel</span>
              <select value={channel} onChange={e=>setChannel(e.target.value)}>
                <option>All Channels</option>
                {channels.map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
              )}
            </div>
          </div>

          {(page === 'Overview' || showKPIs) && (
<div className="kpi-grid">
            {cards.map(([label,value,Icon,foot,color])=>(
              <div className={'kpi-card '+color} key={label}>
                <div className="kpi-top"><div className="kpi-icon"><Icon size={21}/></div><span className="kpi-spark" aria-hidden="true"><svg viewBox="0 0 94 40" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2 31 L15 25 L27 28 L40 14 L54 21 L67 8 L80 13 L92 3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span></div>
                <div className="kpi-label">{label}</div>
                <div className="kpi-value">{value}</div>
                <div className="kpi-foot">{foot}</div>
              </div>
            ))}
          </div>
          )}

          {page === 'Settings' ? (
            <div className="settings-layout">
              <section className="panel settings-main">
                <div className="panel-heading">
                  <div>
                    <h3>Appearance & Personalization</h3>
                    <p>Customize your FinSight X workspace.</p>
                  </div>
                  <Palette size={21}/>
                </div>

                <h4>Display theme</h4>
                <div className="theme-options">
                  <button
                    type="button"
                    className={'theme-option ' +
                      (prefs.theme === 'dark' ? 'chosen' : '')}
                    onClick={() => changePref('theme', 'dark')}
                    aria-pressed={prefs.theme === 'dark'}
                  >
                    <Moon size={22}/>
                    <strong>Midnight Premium</strong>
                    <small>Dark financial-terminal experience</small>
                  </button>
                  <button
                    type="button"
                    className={'theme-option ' +
                      (prefs.theme === 'light' ? 'chosen' : '')}
                    onClick={() => changePref('theme', 'light')}
                    aria-pressed={prefs.theme === 'light'}
                  >
                    <Sun size={22}/>
                    <strong>Executive Light</strong>
                    <small>Bright professional reporting</small>
                  </button>
                </div>

                <h4>Accent color</h4>
                <div className="accent-options">
                  {[
                    ['blue','Electric Blue'],
                    ['teal','Aurora Teal'],
                    ['violet','Royal Violet']
                  ].map(([value,label]) => (
                    <button
                      key={value}
                      type="button"
                      className={'accent-option accent-' + value +
                        (prefs.accent === value ? ' chosen' : '')}
                      onClick={() => changePref('accent', value)}
                      aria-pressed={prefs.accent === value}
                    >
                      <span className="accent-dot"/>
                      {label}
                    </button>
                  ))}
                </div>

                <h4>Workspace preferences</h4>
                <label className="setting-row">
                  <span>
                    <strong>Compact dashboard</strong>
                    <small>Reduce spacing and card height</small>
                  </span>
                  <input type="checkbox"
                    checked={prefs.compact}
                    onChange={e => changePref(
                      'compact', e.target.checked
                    )}
                  />
                </label>

                <label className="setting-row">
                  <span>
                    <strong>Reduce motion</strong>
                    <small>Disable hover animations</small>
                  </span>
                  <input type="checkbox"
                    checked={prefs.reducedMotion}
                    onChange={e => changePref(
                      'reducedMotion', e.target.checked
                    )}
                  />
                </label>

                <button
                  type="button"
                  className="reset-settings"
                  onClick={resetPrefs}
                >
                  <RotateCcw size={16}/>
                  Reset to defaults
                </button>
                <p className="settings-note">
                  Preferences are saved locally in this browser.
                  They do not change the SQL data or Power BI report.
                </p>
              </section>

              <section className="panel settings-info">
                <div className="panel-heading">
                  <div>
                    <h3>Data & Model Transparency</h3>
                    <p>Understand the numbers behind this demo.</p>
                  </div>
                  <Database size={21}/>
                </div>

                <div className="data-fact">
                  <span>Data source</span>
                  <strong>Validated synthetic SQLite snapshot</strong>
                </div>
                <div className="data-fact">
                  <span>Customer records</span>
                  <strong>{source.customers.length}</strong>
                </div>
                <div className="data-fact">
                  <span>Transaction records</span>
                  <strong>{source.transactions.length}</strong>
                </div>
                <div className="data-fact">
                  <span>Activation definition</span>
                  <strong>At least one transaction</strong>
                </div>
                <div className="data-fact">
                  <span>Decision simulator</span>
                  <strong>Hypothetical, assumption-based</strong>
                </div>

                <div className="transparency-note">
                  No real customers. No actual KYC approval,
                  fraud-risk scoring or investment advice.
                  Role-based security and a live database API
                  are not yet connected.
                </div>
              </section>
            </div>
          ) : page === 'Activation Intelligence' ? (
            <ActivationIntelligence
              data={source}
              channel={channel}
              onExplore={(status, activation) => {
                setExplorerStatus(status)
                setExplorerActivation(activation)
                setSearchQuery('')
                setExplorerPage(1)
                setPage('Data Explorer')
              }}
            />
          ) : page === 'Metric Integrity' ? (
            <MetricIntegrity report={qualityReport}/>
          ) : page === 'Opportunity Prioritizer' ? (
            <PriorityWorkspace
              data={source}
              channel={channel}
              onPlan={() => setPage('Experiment Studio')}
            />
          ) : page === 'Experiment Studio' ? (
            <ExperimentStudio
              customers={source.customers}
              transactions={source.transactions}
              channel={channel}
              onOpenSimulator={() => setPage('Decision Twin')}
            />
          ) : page === 'Data Explorer' ? (
            <section className="panel fx-explorer">
              <div className="panel-heading">
                <div>
                  <h3>Synthetic Customer Explorer</h3>
                  <p>Search, filter, inspect and export customer records.</p>
                </div>
                <Database size={20}/>
              </div>

              <div className="fx-explorer-toolbar">
                <label>
                  KYC Status
                  <select value={explorerStatus}
                    onChange={e => {
                      setExplorerStatus(e.target.value)
                      setExplorerPage(1)
                    }}>
                    <option value="All">All statuses</option>
                    {[...new Set(
                      source.customers.map(c => c.kyc_status)
                    )].sort().map(status =>
                      <option key={status} value={status}>
                        {status}
                      </option>
                    )}
                  </select>
                </label>
                <label>
                  Activation status
                  <select value={explorerActivation}
                    onChange={e => {
                      setExplorerActivation(e.target.value)
                      setExplorerPage(1)
                    }}>
                    <option value="All">All customers</option>
                    <option value="Activated">Activated</option>
                    <option value="Not activated">No transaction</option>
                    <option value="KYC incomplete">KYC incomplete</option>
                  </select>
                </label>
                <div className="fx-record-count">
                  {explorerRows.length} matching records
                </div>
                <button type="button" className="fx-export-btn"
                  onClick={exportCustomers}
                  disabled={!explorerRows.length}>
                  Export Filtered CSV
                </button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead><tr>
                    <th>Customer ID</th>
                    <th>Signup Date</th>
                    <th>Acquisition Channel</th>
                    <th>KYC Status</th>
                  </tr></thead>
                  <tbody>
                    {explorerVisibleRows.map(c => (
                      <tr key={c.customer_id}>
                        <td>{c.customer_id}</td>
                        <td>{c.signup_date}</td>
                        <td>{c.acquisition_channel}</td>
                        <td>{c.kyc_status}</td>
                      </tr>
                    ))}
                    {!explorerVisibleRows.length && (
                      <tr><td colSpan={4}>
                        No matching fictional customer records.
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="fx-pagination">
                <button type="button"
                  disabled={safeExplorerPage <= 1}
                  onClick={() => setExplorerPage(
                    Math.max(1, safeExplorerPage - 1)
                  )}>Previous</button>
                <span>Page {safeExplorerPage} of {explorerPages}</span>
                <button type="button"
                  disabled={safeExplorerPage >= explorerPages}
                  onClick={() => setExplorerPage(
                    Math.min(explorerPages, safeExplorerPage + 1)
                  )}>Next</button>
              </div>
            </section>
          ) : page === 'Decision Simulator' ? (
            <div className="dashboard-grid">
              {simulator}{funnel}{cohort}{acquisition}
            </div>
          ) : page === 'Customer Intelligence' ? (
            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Customer Segmentation Intelligence</h3>
                    <p>Which acquisition channels perform better?</p>
                  </div>
                  <Users size={20}/>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr>
                      <th>Channel</th>
                      <th>Signups</th>
                      <th>KYC</th>
                      <th>Activated</th>
                      <th>KYC %</th>
                      <th>Action</th>
                    </tr></thead>
                    <tbody>{customerSegments.map(s => (
                      <tr key={s.name}>
                        <td>{s.name}</td>
                        <td>{s.signups}</td>
                        <td>{s.completed}</td>
                        <td>{s.activated}</td>
                        <td>{s.kycRate.toFixed(1)}%</td>
                        <td>
                          <button className="fx-mini-action"
                            onClick={() => drillToExplorer(
                              'All', s.name
                            )}>
                            Investigate
                          </button>
                        </td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </section>
              {cohort}
              {acquisition}
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Segment Opportunity</h3>
                    <p>Compare overall activation across customer groups.</p>
                  </div>
                  <Target size={20}/>
                </div>
                {customerSegments.map(s => (
                  <div className="fx-segment-row" key={s.name}>
                    <span>{s.name}</span>
                    <strong>
                      {s.activationRate.toFixed(1)}%
                    </strong>
                  </div>
                ))}
                <p className="sim-note">
                  These are descriptive synthetic metrics,
                  not causal evidence.
                </p>
              </section>
            </div>

          ) : page === 'KYC & Activation' ? (
            <div className="dashboard-grid">
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Conversion Leakage Map</h3>
                    <p>Understand where customers have not progressed.</p>
                  </div>
                  <ShieldCheck size={20}/>
                </div>
                <div className="fx-leakage-item">
                  <span>KYC not completed</span>
                  <strong>{pendingCustomers.length}</strong>
                  <button className="fx-mini-action"
                    onClick={() => drillToExplorer('All', channel, 'KYC incomplete')}>
                    Investigate KYC Status
                  </button>
                </div>
                <div className="fx-leakage-item">
                  <span>KYC completed, not activated</span>
                  <strong>{verifiedInactiveCustomers.length}</strong>
                  <button className="fx-mini-action"
                    onClick={() => drillToExplorer(
                      'Completed', channel, 'Not activated'
                    )}>
                    Explore Verified Customers
                  </button>
                </div>
                <div className="fx-leakage-item">
                  <span>KYC completed and activated</span>
                  <strong>{verifiedActiveCustomers.length}</strong>
                  <button className="fx-mini-action"
                    onClick={() => drillToExplorer(
                      'Completed', channel, 'Activated'
                    )}>
                    Explore Activated Cohort
                  </button>
                </div>
                <p className="sim-note">
                  Records without KYC completion or activation
                  do not reveal the underlying cause.
                </p>
              </section>
              {funnel}
              <section className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Conversion Rates</h3>
                    <p>Registration to KYC to first transaction.</p>
                  </div>
                  <Activity size={20}/>
                </div>
                <div className="fx-leakage-item">
                  <span>KYC Completion Rate</span>
                  <strong>{(model.kycRate * 100).toFixed(1)}%</strong>
                </div>
                <div className="fx-leakage-item">
                  <span>Eligible Activation Rate</span>
                  <strong>{(model.rate * 100).toFixed(1)}%</strong>
                </div>
                <button className="fx-mini-action"
                  onClick={() => setPage('Decision Simulator')}>
                  Open Decision Simulator
                </button>
              </section>
              {simulator}
            </div>

          ) : page === 'Decision Twin' ? (
            <div className="fx-twin-page">
              <div className="fx-twin-intro">
                <div>
                  <span className="fx-workspace-eyebrow">
                    FINANCIAL DECISION INTELLIGENCE
                  </span>
                  <h2>Compare two strategies. Understand the trade-offs.</h2>
                  <p>
                    Explore alternative KYC completion targets using
                    the selected synthetic customer cohort.
                    This is an assumption-based simulator, not a forecast.
                  </p>
                </div>
                <div className="fx-twin-buttons">
                  <button type="button"
                    onClick={() => {
                      setTwinA(70)
                      setTwinB(80)
                    }}>
                    Reset Scenarios
                  </button>
                  <button type="button"
                    onClick={exportTwinComparison}>
                    Download Comparison CSV
                  </button>
                </div>
              </div>

              <div className="fx-twin-baseline">
                <div><span>Selected Customers</span>
                  <strong>{model.people}</strong></div>
                <div><span>Current KYC Completion</span>
                  <strong>{(model.kycRate*100).toFixed(1)}%</strong></div>
                <div><span>Eligible Activation</span>
                  <strong>{(model.rate*100).toFixed(1)}%</strong></div>
                <div><span>Historical Fee Proxy</span>
                  <strong>{money(model.fee)}</strong></div>
              </div>

              <div className="fx-twin-grid">
                {[
                  {name:'Scenario A',value:twinA,
                   setValue:setTwinA,result:outcomeA,tone:'blue'},
                  {name:'Scenario B',value:twinB,
                   setValue:setTwinB,result:outcomeB,tone:'teal'}
                ].map(scenario => (
                  <section
                    className={'fx-twin-card '+scenario.tone}
                    key={scenario.name}>
                    <div className="fx-twin-card-top">
                      <span>{scenario.name}</span>
                      <span>WHAT-IF ANALYSIS</span>
                    </div>

                    <div className="fx-twin-target">
                      <div>
                        <small>Hypothetical KYC target</small>
                        <strong>{scenario.value}%</strong>
                      </div>
                      <Target size={30}/>
                    </div>

                    <input type="range"
                      min="60" max="90" step="5"
                      value={scenario.value}
                      aria-label={scenario.name+' KYC target'}
                      onChange={e => scenario.setValue(
                        Number(e.target.value)
                      )}/>
                    <div className="fx-twin-scale">
                      <span>60%</span><span>75%</span><span>90%</span>
                    </div>

                    <div className="fx-twin-result-grid">
                      <div>
                        <small>Additional KYC completions</small>
                        <strong>+{scenario.result.extraKYC}</strong>
                      </div>
                      <div>
                        <small>Estimated extra activated</small>
                        <strong>+{scenario.result.extraActivated}</strong>
                      </div>
                      <div>
                        <small>Estimated total activated</small>
                        <strong>{scenario.result.totalActivated}</strong>
                      </div>
                      <div>
                        <small>Illustrative fee sensitivity</small>
                        <strong>{money(
                          scenario.result.feeSensitivity
                        )}</strong>
                      </div>
                    </div>
                  </section>
                ))}
              </div>

              <section className="fx-twin-comparison">
                <div>
                  <span>SCENARIO B VS SCENARIO A</span>
                  <h3>Comparative Impact</h3>
                  <p>
                    Values are estimated differences, not measured
                    incremental customer or financial outcomes.
                  </p>
                </div>
                <div className="fx-twin-delta">
                  <div>
                    <small>Additional activated difference</small>
                    <strong>
                      {outcomeB.extraActivated -
                        outcomeA.extraActivated >= 0 ? '+' : ''}
                      {outcomeB.extraActivated -
                        outcomeA.extraActivated}
                    </strong>
                  </div>
                  <div>
                    <small>Illustrative fee difference</small>
                    <strong>{money(
                      outcomeB.feeSensitivity -
                      outcomeA.feeSensitivity
                    )}</strong>
                  </div>
                </div>
              </section>

              <section className="fx-twin-method">
                <h3>Methodology & Limitations</h3>
                <p>
                  Additional KYC completions =
                  max(0, rounded target completions
                  minus existing completions).
                  Additional activated customers =
                  rounded additional KYC completions
                  multiplied by the observed eligible activation rate.
                </p>
                <p>
                  Fee sensitivity uses the current synthetic
                  fee total divided by current activated customers.
                  It assumes that customer behavior and fee patterns
                  remain constant. It is not recognized revenue,
                  causal uplift, a guarantee or a forecast.
                </p>
                <p>
                  The global acquisition channel selector above applies
                  to both scenarios. When a selected segment already
                  exceeds a target KYC rate, improvement is zero.
                </p>
              </section>
            </div>

          ) : page === 'Product Performance' ? (
            <div className="dashboard-grid">
              {products}{acquisition}{cohort}{simulator}
            </div>
          ) : (
            <div className="dashboard-grid">
              {funnel}{cohort}{products}{simulator}{acquisition}
            </div>
          )}

          <footer className="footer">
            FinSight X ? All records synthetic ? Snapshot generated from existing SQLite database.
            No real KYC or investment decisions.
          </footer>
        </div>
      </main>
    </div>
  )
}

export default App
