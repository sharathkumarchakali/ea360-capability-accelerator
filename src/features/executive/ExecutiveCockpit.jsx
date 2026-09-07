import { useMemo } from 'react'
import { usePrototypeStore, getTenantConfig } from '../../state/prototypeStore'
import { deriveIntegrationMetrics } from '../../domain/metrics/integration'
import ExplainButton from '../ai-assist/ExplainButton'
import ExecutiveBriefing from '../ai-assist/ExecutiveBriefing'

export default function ExecutiveCockpit({ onNavigate }) {
  const repo = usePrototypeStore((s) => s.getRepo)()
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setCapabilityFilters = usePrototypeStore((s) => s.setCapabilityFilters)
  const setPortfolioFilters = usePrototypeStore((s) => s.setPortfolioFilters)
  const setIntegrationFilters = usePrototypeStore((s) => s.setIntegrationFilters)
  const setHeatmapMode = usePrototypeStore((s) => s.setHeatmapMode)
  const setAskOpen = usePrototypeStore((s) => s.setAskOpen)
  const startGuidedTour = usePrototypeStore((s) => s.startGuidedTour)
  const showLanding = usePrototypeStore((s) => s.showLanding)
  const config = useMemo(() => getTenantConfig(tenantCode), [tenantCode])
  const tenant = repo.getTenant()
  const metrics = useMemo(() => repo.getExecutiveMetrics(), [repo])
  const intMetrics = useMemo(
    () => deriveIntegrationMetrics(repo.listIntegrations()),
    [repo],
  )
  const priorityCap = repo.getPriorityCapability()
  const findingsForCap = priorityCap ? repo.findingsForCapability(priorityCap.id) : []
  const topFinding =
    findingsForCap.find((f) => f.severity === 'critical') || findingsForCap[0]
  const topRec = topFinding ? repo.recommendationsForFinding(topFinding.id)[0] : null
  const topInit = topRec ? repo.initiativesForRecommendation(topRec.id)[0] : null
  const supportingApps = priorityCap ? repo.applicationsForCapability(priorityCap.id) : []
  const supportingInts = repo.integrationsForApplications(supportingApps.map((a) => a.id))

  const insights = [
    {
      title: 'What changed',
      body: config.storyline || `${tenant.shortName} still carries concentrated architecture and integration risk in its priority domain.`,
    },
    {
      title: 'Why it matters',
      body: `${metrics.criticalRiskCount} critical findings concentrate on the highest-risk capabilities and brittle integration paths.`,
    },
    {
      title: 'Action required',
      body: topRec
        ? `Advance “${topRec.name}” into the active roadmap wave and retire brittle interfaces.`
        : 'Prioritise approved recommendations for the priority domain.',
    },
  ]

  function openJourney() {
    if (priorityCap) {
      selectEntity({ id: priorityCap.id, type: 'capability' })
    }
  }

  function openCapabilityIntel({ mode = 'risk', domain = '' } = {}) {
    setHeatmapMode(mode)
    setCapabilityFilters({ domain, search: '' })
    if (onNavigate) onNavigate('capabilities')
    else {
      setView('capabilities')
      window.location.hash = 'capabilities'
    }
  }

  function openPortfolio({ timeClass = '', capabilityId = '' } = {}) {
    setPortfolioFilters({
      search: '',
      criticality: '',
      lifecycle: '',
      timeClass,
      capabilityId,
      domain: '',
    })
    if (onNavigate) onNavigate('applications')
    else {
      setView('applications')
      window.location.hash = 'applications'
    }
  }

  function openIntegrations({ pointToPoint = '' } = {}) {
    setIntegrationFilters({
      search: '',
      integrationType: '',
      criticality: '',
      lifecycleStatus: '',
      pointToPoint,
      reusabilityStatus: '',
      monitoringStatus: '',
      missingOwner: '',
    })
    if (onNavigate) onNavigate('integrations')
    else {
      setView('integrations')
      window.location.hash = 'integrations'
    }
  }

  return (
    <section className="view active">
      <div className="hero">
        <div className="executive-band">
          <div className="executive-message">
            <div className="kicker">
              Executive cockpit · {tenant.shortName} · Synthetic demonstration data
            </div>
            <h1>Know your enterprise. Shape what is next.</h1>
            <p>{config.storyline || tenant.story}</p>
            <div className="hero-chips">
              <span className="hero-chip">{metrics.openFindings} open findings</span>
              <span className="hero-chip">{repo.listApplications().length} applications</span>
              <span className="hero-chip">{repo.listInitiatives().length} initiatives</span>
            </div>
            <div className="hero-actions">
              <button type="button" className="btn primary primary-button" onClick={openJourney}>
                Trace priority capability
              </button>
              <button
                type="button"
                className="btn secondary-button"
                onClick={() => openCapabilityIntel({ mode: 'risk' })}
              >
                Capability intelligence
              </button>
              <button
                type="button"
                className="btn secondary-button"
                onClick={() => startGuidedTour(`${tenantCode.toLowerCase()}-executive`)}
              >
                Start Executive Demo
              </button>
              <button type="button" className="btn secondary-button" onClick={() => showLanding()}>
                Demo home
              </button>
            </div>
          </div>
          <div className="maturity-card" data-demo-target="executive-health">
            <div className="maturity-gauge" style={{ '--value': metrics.enterpriseHealth }}>
              <div className="gauge-rail" aria-hidden="true">
                <div className="gauge-ticks">
                  <span /><span /><span /><span /><span /><span />
                </div>
              </div>
              <div className="gauge-readout">
                <strong>{metrics.enterpriseHealth}</strong>
                <small>Enterprise health</small>
              </div>
            </div>
            <div className="maturity-copy">
              <h3 className="section-title">Explainable health</h3>
              <p>
                Driven by maturity {metrics.architectureMaturity}/5, application health{' '}
                {metrics.applicationHealth}/5, and transformation progress{' '}
                {metrics.transformationProgress}%.
              </p>
              <div className="chip-row">
                <ExplainButton
                  metricKey="enterpriseHealth"
                  query="Explain enterprise health"
                  label="Explain health"
                />
                <button type="button" className="target-pill" onClick={() => openCapabilityIntel({ mode: 'maturity' })}>
                  View capability maturity
                </button>
                <button
                  type="button"
                  className="btn tiny secondary-button"
                  onClick={() => setAskOpen(true)}
                >
                  Open Ask EA360 / briefing
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="signal-strip">
          <button type="button" className="signal-card clickable" onClick={() => openCapabilityIntel({ mode: 'maturity' })}>
            <div className="signal-icon" style={{ background: 'var(--accent-soft)', color: 'var(--kulana-teal)' }}>M</div>
            <div>
              <strong>{metrics.architectureMaturity}</strong>
              <span>Architecture maturity / 5</span>
            </div>
          </button>
          <button type="button" className="signal-card clickable" onClick={() => (onNavigate ? onNavigate('findings') : setView('findings'))}>
            <div className="signal-icon" style={{ background: 'var(--risk-soft)', color: 'var(--risk)' }}>!</div>
            <div>
              <strong>{metrics.criticalRiskCount}</strong>
              <span>Critical risks requiring ownership</span>
            </div>
          </button>
          <button type="button" className="signal-card clickable" onClick={() => openPortfolio()}>
            <div className="signal-icon" style={{ background: 'var(--good-soft)', color: 'var(--good)' }}>A</div>
            <div>
              <strong>{metrics.applicationHealth}</strong>
              <span>Application health / 5</span>
            </div>
          </button>
          <button type="button" className="signal-card clickable" onClick={() => openIntegrations({ pointToPoint: 'true' })}>
            <div className="signal-icon" style={{ background: 'var(--accent-soft)', color: 'var(--kulana-teal)' }}>⟷</div>
            <div>
              <strong>{intMetrics.pointToPointPercentage}%</strong>
              <span>Point-to-point interfaces ({intMetrics.pointToPointCount})</span>
            </div>
          </button>
        </div>
      </div>

      <div className="section">
        <div className="overview-grid">
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Priority connected journey</h3>
                <p>Executive cockpit → capability → applications → finding → recommendation → initiative.</p>
              </div>
            </div>
            <ol className="journey-steps">
              <li>
                <button type="button" className="text-link" onClick={openJourney}>
                  {priorityCap?.name || 'Priority capability'}
                </button>
                <small>Highest risk capability ({priorityCap?.riskScore})</small>
              </li>
              <li>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => openPortfolio({ capabilityId: priorityCap?.id || '' })}
                >
                  {supportingApps.length} apps · {supportingInts.length} integrations
                </button>
                <small>Open filtered application portfolio</small>
              </li>
              <li>
                {topFinding ? (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => selectEntity({ id: topFinding.id, type: 'finding' })}
                  >
                    {topFinding.name}
                  </button>
                ) : (
                  <span>Critical finding</span>
                )}
                <small>Evidence-backed</small>
              </li>
              <li>
                {topRec ? (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => selectEntity({ id: topRec.id, type: 'recommendation' })}
                  >
                    {topRec.name}
                  </button>
                ) : (
                  <span>Recommendation</span>
                )}
                <small>{topRec?.status}</small>
              </li>
              <li>
                {topInit ? (
                  <button
                    type="button"
                    className="text-link"
                    onClick={() => selectEntity({ id: topInit.id, type: 'initiative' })}
                  >
                    {topInit.name}
                  </button>
                ) : (
                  <span>Roadmap initiative</span>
                )}
                <small>{topInit ? `${topInit.progressPercent}% complete` : ''}</small>
              </li>
            </ol>
          </div>

          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3 className="section-title">Three executive insights</h3>
                <p>Decision-oriented narrative from {tenant.shortName} records.</p>
              </div>
            </div>
            <div className="insight-stack">
              {insights.map((insight) => (
                <article key={insight.title} className="insight-card">
                  <h4>{insight.title}</h4>
                  <p>{insight.body}</p>
                </article>
              ))}
            </div>
          </div>
        </div>

        <div className="metrics cockpit-metrics">
          <div className="metric-with-explain">
            <button type="button" className="metric clickable" onClick={() => openCapabilityIntel({ mode: 'importance' })}>
              <div className="m-label kpi-label">Strategic alignment</div>
              <div className="m-value kpi-value">{metrics.strategicAlignment}</div>
            </button>
            <ExplainButton
              metricKey="strategicAlignment"
              query="Explain strategic alignment"
              label="Explain"
            />
          </div>
          <button type="button" className="metric clickable" onClick={() => (onNavigate ? onNavigate('findings') : setView('findings'))}>
            <div className="m-label kpi-label">Open findings</div>
            <div className="m-value kpi-value">{metrics.openFindings}</div>
          </button>
          <button type="button" className="metric clickable" onClick={() => (onNavigate ? onNavigate('recommendations') : setView('recommendations'))}>
            <div className="m-label kpi-label">Approved recommendations</div>
            <div className="m-value kpi-value">{metrics.approvedRecommendations}</div>
          </button>
          <button type="button" className="metric clickable" onClick={() => openPortfolio({ timeClass: 'Migrate' })}>
            <div className="m-label kpi-label">Application health</div>
            <div className="m-value kpi-value">{metrics.applicationHealth}</div>
          </button>
          <button type="button" className="metric clickable" onClick={() => openIntegrations({ pointToPoint: 'true' })}>
            <div className="m-label kpi-label">P2P concentration</div>
            <div className="m-value kpi-value">{intMetrics.pointToPointPercentage}%</div>
          </button>
        </div>

        <div className="section ai-briefing-section">
          <ExecutiveBriefing embedded />
        </div>
      </div>
    </section>
  )
}
