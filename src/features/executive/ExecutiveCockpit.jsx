import { useMemo, useState } from 'react'
import {
  ArrowRight,
  AlertTriangle,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Minus,
  X,
  Zap,
  Target,
  Scale,
} from 'lucide-react'
import { usePrototypeStore, getTenantConfig } from '../../state/prototypeStore'
import { deriveIntegrationMetrics } from '../../domain/metrics/integration'
import ExplainButton from '../ai-assist/ExplainButton'
import ExecutiveBriefing from '../ai-assist/ExecutiveBriefing'

const DRIVER_TARGETS = {
  maturity: 4,
  appHealth: 4,
  alignment: 75,
  transformation: 70,
}

function healthTone(score) {
  if (score >= 70) return 'good'
  if (score >= 45) return 'warn'
  return 'risk'
}

function toneLabel(tone) {
  if (tone === 'good') return 'Stable'
  if (tone === 'warn') return 'Watch'
  return 'At risk'
}

function formatOwner(id) {
  if (!id) return 'Assign owner'
  return String(id).replace(/^person-/, '').replace(/-/g, ' ')
}

function clampPct(n) {
  return Math.max(0, Math.min(100, Math.round(n)))
}

function buildPriorityDecisions({ metrics, intMetrics, topFinding, topRec, decisions, repo }) {
  const fromPack = (Array.isArray(decisions) ? decisions : [])
    .filter((d) =>
      ['pending', 'in_review', 'deferred', 'submitted', 'open'].includes(d.status),
    )
    .slice(0, 3)
    .map((d) => {
      const rec = d.recommendationId ? repo.getRecommendation?.(d.recommendationId) : null
      return {
        id: d.id,
        title: d.name || d.title || 'Pending decision',
        impact: d.impact || rec?.expectedBenefit || 'Governance action required',
        status: d.status,
        next: formatOwner(d.ownerId) || 'Review in Governance',
        type: 'decision',
      }
    })

  if (fromPack.length >= 3) return fromPack

  const fallback = [
    {
      id: 'open-findings',
      title: `${metrics.openFindings} open findings need triage`,
      impact: `${metrics.criticalRiskCount} critical risks concentrated in priority domains`,
      status: 'attention',
      next: 'Open findings workspace',
      type: 'findings',
    },
    {
      id: 'approved-recs',
      title: `${metrics.approvedRecommendations} approved recommendations awaiting delivery`,
      impact: 'Approved work waiting to enter the active roadmap wave',
      status: 'ready',
      next: 'Advance recommendations',
      type: 'recommendations',
    },
    {
      id: 'p2p-migrate',
      title:
        topFinding?.name ||
        `Reduce ${intMetrics.pointToPointPercentage}% point-to-point concentration`,
      impact: topRec?.name || `${intMetrics.pointToPointCount} brittle interfaces in scope`,
      status: topRec?.status || 'watch',
      next: topRec ? 'Review recommendation' : 'Open integrations',
      type: topFinding ? 'finding' : 'integrations',
      entity: topFinding || topRec,
    },
  ]

  return [...fromPack, ...fallback].slice(0, 3)
}

function decisionMarkerTone(status) {
  const s = String(status || '').toLowerCase()
  if (['ready', 'approved', 'good'].includes(s)) return 'good'
  if (['attention', 'pending', 'open', 'in_review', 'watch', 'submitted'].includes(s)) return 'warn'
  if (['deferred', 'rejected', 'critical', 'risk'].includes(s)) return 'risk'
  return 'warn'
}

function HealthRing({ score, tone }) {
  const size = 112
  const stroke = 10
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  const pct = clampPct(Number(score) || 0) / 100
  const filled = c * pct
  const gap = 3
  const segments = 4
  const segLen = (c - gap * segments) / segments
  const toneColor =
    tone === 'good' ? 'var(--good)' : tone === 'warn' ? 'var(--warn)' : 'var(--risk)'

  return (
    <svg
      className="cockpit-health-ring"
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      aria-hidden="true"
    >
      {Array.from({ length: segments }).map((_, i) => {
        const start = i * (segLen + gap)
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="var(--line-soft)"
            strokeWidth={stroke}
            strokeDasharray={`${segLen} ${c - segLen}`}
            strokeDashoffset={-start}
            strokeLinecap="butt"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        )
      })}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={toneColor}
        strokeWidth={stroke}
        strokeDasharray={`${filled} ${c - filled}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </svg>
  )
}

function DriverBar({ label, display, pct, targetPct, onClick }) {
  return (
    <button type="button" className="cockpit-driver" onClick={onClick}>
      <span className="cockpit-driver-head">
        <span className="cockpit-driver-label">{label}</span>
        <strong className="cockpit-driver-value">{display}</strong>
      </span>
      <span className="cockpit-driver-track" aria-hidden="true">
        <span className="cockpit-driver-fill" style={{ width: `${pct}%` }} />
        <span
          className="cockpit-driver-target"
          style={{ left: `${clampPct(targetPct)}%` }}
          title={`Target ${clampPct(targetPct)}%`}
        />
      </span>
      <span className="cockpit-driver-meta">{pct}% of scale</span>
    </button>
  )
}

export default function ExecutiveCockpit({ onNavigate }) {
  const [briefingOpen, setBriefingOpen] = useState(false)
  const repo = usePrototypeStore((s) => s.getRepo)()
  const tenantCode = usePrototypeStore((s) => s.tenantCode)
  const filters = usePrototypeStore((s) => s.filters)
  const selectEntity = usePrototypeStore((s) => s.selectEntity)
  const setView = usePrototypeStore((s) => s.setView)
  const setCapabilityFilters = usePrototypeStore((s) => s.setCapabilityFilters)
  const setPortfolioFilters = usePrototypeStore((s) => s.setPortfolioFilters)
  const setIntegrationFilters = usePrototypeStore((s) => s.setIntegrationFilters)
  const setHeatmapMode = usePrototypeStore((s) => s.setHeatmapMode)
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
  const decisions = repo.listDecisions?.() || []

  const tone = healthTone(metrics.enterpriseHealth)
  const p2pTone =
    intMetrics.pointToPointPercentage >= 30
      ? 'risk'
      : intMetrics.pointToPointPercentage >= 15
        ? 'warn'
        : 'good'
  const transformTone =
    metrics.transformationProgress >= 60
      ? 'good'
      : metrics.transformationProgress >= 30
        ? 'warn'
        : 'risk'
  const riskTone = metrics.criticalRiskCount > 0 ? 'risk' : 'good'
  const decisionTone = metrics.openFindings > 0 ? 'warn' : 'good'
  const healthGap = Math.round(70 - Number(metrics.enterpriseHealth || 0))
  const TrendIcon = healthGap > 0 ? TrendingDown : healthGap < 0 ? TrendingUp : Minus

  const maturityPct = clampPct((metrics.architectureMaturity / 5) * 100)
  const appHealthPct = clampPct((metrics.applicationHealth / 5) * 100)
  const alignmentPct = clampPct(Number(metrics.strategicAlignment) || 0)
  const transformPct = clampPct(metrics.transformationProgress)

  const priorityDecisions = useMemo(
    () =>
      buildPriorityDecisions({
        metrics,
        intMetrics,
        topFinding,
        topRec,
        decisions,
        repo,
      }),
    [metrics, intMetrics, topFinding, topRec, decisions, repo],
  )

  const actionBrief = [
    {
      key: 'change',
      label: 'Change',
      Icon: Zap,
      conclusion:
        config.storyline?.split(/[.!?]/)[0]?.trim() ||
        `${tenant.shortName} carries concentrated architecture and integration risk`,
      support: priorityCap
        ? `Priority domain: ${priorityCap.name}`
        : 'Priority domain remains the primary exposure.',
    },
    {
      key: 'impact',
      label: 'Business impact',
      Icon: Scale,
      conclusion: `${metrics.criticalRiskCount} critical findings sit on the highest-risk path`,
      support: `${intMetrics.pointToPointPercentage}% point-to-point concentration across ${intMetrics.pointToPointCount} interfaces.`,
    },
    {
      key: 'decision',
      label: 'Decision required',
      Icon: Target,
      conclusion: topRec
        ? `Advance “${topRec.name}” into the active wave`
        : 'Prioritise approved recommendations for the priority domain',
      support: topInit
        ? `Linked initiative at ${topInit.progressPercent}% complete.`
        : 'Retire brittle interfaces and assign delivery ownership.',
    },
  ]

  function go(view) {
    if (onNavigate) onNavigate(view)
    else {
      setView(view)
      window.location.hash = view
    }
  }

  function openJourney() {
    if (priorityCap) {
      selectEntity({ id: priorityCap.id, type: 'capability' })
    }
  }

  function openCapabilityIntel({ mode = 'risk', domain = '' } = {}) {
    setHeatmapMode(mode)
    setCapabilityFilters({ domain, search: '' })
    go('capabilities')
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
    go('applications')
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
    go('integrations')
  }

  function reviewPriorityDecisions() {
    go('findings')
  }

  function openDecisionItem(item) {
    if (item.type === 'decision') {
      go('governance')
      return
    }
    if (item.type === 'findings') {
      go('findings')
      return
    }
    if (item.type === 'recommendations') {
      go('recommendations')
      return
    }
    if (item.type === 'finding' && item.entity) {
      selectEntity({ id: item.entity.id, type: 'finding' })
      return
    }
    if (item.type === 'integrations') {
      openIntegrations({ pointToPoint: 'true' })
    }
  }

  const journeyNodes = [
    {
      key: 'capability',
      label: 'Capability',
      value: priorityCap?.name || 'Priority capability',
      meta: priorityCap ? `Risk ${priorityCap.riskScore}` : '—',
      highlight: false,
      onClick: openJourney,
    },
    {
      key: 'apps',
      label: 'Applications',
      value: `${supportingApps.length} apps`,
      meta: `${supportingInts.length} integrations`,
      highlight: false,
      onClick: () => openPortfolio({ capabilityId: priorityCap?.id || '' }),
    },
    {
      key: 'finding',
      label: 'Finding',
      value: topFinding?.name || 'Critical finding',
      meta: topFinding ? 'Evidence-backed' : '—',
      highlight: Boolean(topFinding),
      onClick: topFinding
        ? () => selectEntity({ id: topFinding.id, type: 'finding' })
        : undefined,
    },
    {
      key: 'recommendation',
      label: 'Recommendation',
      value: topRec?.name || 'Recommendation',
      meta: topRec?.status || '—',
      highlight: Boolean(topRec),
      onClick: topRec
        ? () => selectEntity({ id: topRec.id, type: 'recommendation' })
        : undefined,
    },
    {
      key: 'initiative',
      label: 'Initiative',
      value: topInit?.name || 'Roadmap initiative',
      meta: topInit ? `${topInit.progressPercent}% complete` : '—',
      highlight: false,
      onClick: topInit
        ? () => selectEntity({ id: topInit.id, type: 'initiative' })
        : undefined,
    },
  ]

  return (
    <section className="view active executive-cockpit">
      <div className="cockpit-workspace">
        <header className="cockpit-header">
          <div className="cockpit-header-copy">
            <h1 className="cockpit-title">Executive Cockpit</h1>
            <p className="cockpit-lede">
              Enterprise posture, priority decisions and the path from risk to action.
            </p>
          </div>
          <div className="cockpit-header-aside">
            <span className="cockpit-period" title="Reporting period">
              {filters.period}
            </span>
            <button
              type="button"
              className="btn secondary-button"
              onClick={() => setBriefingOpen(true)}
            >
              Generate briefing
            </button>
            <button
              type="button"
              className="btn primary primary-button"
              onClick={reviewPriorityDecisions}
            >
              Review decisions
            </button>
          </div>
        </header>

        <div className="cockpit-grid">
          <div className="cockpit-kpi-strip" role="group" aria-label="KPI summary">
            <button
              type="button"
              className={`cockpit-kpi tone-${tone}`}
              data-demo-target="executive-health"
              onClick={() => openCapabilityIntel({ mode: 'maturity' })}
            >
              <span className="cockpit-kpi-label">Enterprise health</span>
              <strong className="cockpit-kpi-value">{metrics.enterpriseHealth}</strong>
              <span className={`cockpit-kpi-status tone-${tone}`}>{toneLabel(tone)}</span>
            </button>

            <button
              type="button"
              className={`cockpit-kpi tone-${riskTone}`}
              onClick={() => go('findings')}
            >
              <span className="cockpit-kpi-label">Critical risks</span>
              <strong className="cockpit-kpi-value">{metrics.criticalRiskCount}</strong>
              <span className={`cockpit-kpi-status tone-${riskTone}`}>
                {metrics.criticalRiskCount > 0 ? 'Require ownership' : 'Clear'}
              </span>
            </button>

            <button
              type="button"
              className={`cockpit-kpi tone-${p2pTone}`}
              onClick={() => openIntegrations({ pointToPoint: 'true' })}
            >
              <span className="cockpit-kpi-label">P2P concentration</span>
              <strong className="cockpit-kpi-value">{intMetrics.pointToPointPercentage}%</strong>
              <span className={`cockpit-kpi-status tone-${p2pTone}`}>
                {intMetrics.pointToPointCount} interfaces
              </span>
            </button>

            <button
              type="button"
              className={`cockpit-kpi tone-${transformTone}`}
              onClick={() => go('roadmap')}
            >
              <span className="cockpit-kpi-label">Transformation progress</span>
              <strong className="cockpit-kpi-value">{metrics.transformationProgress}%</strong>
              <span className={`cockpit-kpi-status tone-${transformTone}`}>
                {topInit ? `Priority ${topInit.progressPercent}%` : 'Open roadmap'}
              </span>
            </button>

            <button
              type="button"
              className={`cockpit-kpi tone-${decisionTone}`}
              onClick={() => go('governance')}
            >
              <span className="cockpit-kpi-label">Decisions requiring attention</span>
              <strong className="cockpit-kpi-value">{metrics.openFindings}</strong>
              <span className={`cockpit-kpi-status tone-${decisionTone}`}>
                {metrics.approvedRecommendations} approved ready
              </span>
            </button>
          </div>

          <article className="cockpit-panel cockpit-posture">
            <div className="cockpit-panel-head">
              <div>
                <h2>Enterprise posture</h2>
              </div>
              <ExplainButton
                metricKey="enterpriseHealth"
                query="Explain enterprise health"
                label="Explain"
                className="btn tiny secondary-button"
              />
            </div>
            <div className="cockpit-posture-body">
              <div className="cockpit-posture-scoreblock">
                <div className="cockpit-ring-wrap">
                  <HealthRing score={metrics.enterpriseHealth} tone={tone} />
                  <div className="cockpit-ring-center">
                    <strong className={`tone-text-${tone}`}>{metrics.enterpriseHealth}</strong>
                    <span>Health</span>
                  </div>
                </div>
                <div className="cockpit-score-meta">
                  <span className={`cockpit-status tone-${tone}`}>{toneLabel(tone)}</span>
                  <span className={`cockpit-trend tone-${tone}`}>
                    <TrendIcon size={14} strokeWidth={2} aria-hidden="true" />
                    {healthGap > 0
                      ? `${healthGap} below target`
                      : healthGap < 0
                        ? `${Math.abs(healthGap)} above target`
                        : 'On target'}
                  </span>
                </div>
              </div>

              <div className="cockpit-posture-drivers">
                <DriverBar
                  label="Architecture maturity"
                  display={`${metrics.architectureMaturity}/5`}
                  pct={maturityPct}
                  targetPct={(DRIVER_TARGETS.maturity / 5) * 100}
                  onClick={() => openCapabilityIntel({ mode: 'maturity' })}
                />
                <DriverBar
                  label="Application health"
                  display={`${metrics.applicationHealth}/5`}
                  pct={appHealthPct}
                  targetPct={(DRIVER_TARGETS.appHealth / 5) * 100}
                  onClick={() => openPortfolio()}
                />
                <DriverBar
                  label="Strategic alignment"
                  display={String(metrics.strategicAlignment)}
                  pct={alignmentPct}
                  targetPct={DRIVER_TARGETS.alignment}
                  onClick={() => openCapabilityIntel({ mode: 'importance' })}
                />
                <DriverBar
                  label="Transformation progress"
                  display={`${metrics.transformationProgress}%`}
                  pct={transformPct}
                  targetPct={DRIVER_TARGETS.transformation}
                  onClick={() => go('roadmap')}
                />
                <button
                  type="button"
                  className={`cockpit-risk-row tone-${riskTone}`}
                  onClick={() => go('findings')}
                >
                  <AlertTriangle size={14} strokeWidth={2} aria-hidden="true" />
                  <span>Risk status</span>
                  <strong>
                    {metrics.criticalRiskCount > 0
                      ? `${metrics.criticalRiskCount} critical`
                      : 'Clear'}
                  </strong>
                </button>
              </div>
            </div>
          </article>

          <article className="cockpit-panel cockpit-priority">
            <div className="cockpit-panel-head">
              <div>
                <h2>Priority decisions</h2>
              </div>
            </div>
            <ul className="cockpit-priority-list">
              {priorityDecisions.map((item) => {
                const marker = decisionMarkerTone(item.status)
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="cockpit-priority-item"
                      onClick={() => openDecisionItem(item)}
                    >
                      <span className={`cockpit-priority-marker tone-${marker}`} aria-hidden="true" />
                      <span className="cockpit-priority-copy">
                        <strong title={item.title}>{item.title}</strong>
                        <span className="cockpit-priority-impact" title={item.impact}>
                          {item.impact}
                        </span>
                        <span className="cockpit-priority-meta">{item.next}</span>
                      </span>
                      <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </li>
                )
              })}
            </ul>
          </article>

          <article className="cockpit-panel cockpit-journey">
            <div className="cockpit-panel-head">
              <div>
                <h2>Connected value chain</h2>
              </div>
            </div>
            <div className="journey-chain" role="list">
              {journeyNodes.map((node, index) => (
                <div className="journey-chain-cell" role="listitem" key={node.key}>
                  {index > 0 && (
                    <span className="journey-chain-connector" aria-hidden="true">
                      <ArrowRight size={12} strokeWidth={2} />
                    </span>
                  )}
                  <button
                    type="button"
                    className={`journey-node${node.highlight ? ' is-highlight' : ''}`}
                    onClick={node.onClick}
                    disabled={!node.onClick}
                    title={`${node.label}: ${node.value}`}
                  >
                    <span className="journey-node-label">{node.label}</span>
                    <strong className="journey-node-value">{node.value}</strong>
                    <span className="journey-node-meta">{node.meta}</span>
                  </button>
                </div>
              ))}
            </div>
          </article>

          <article className="cockpit-panel cockpit-brief">
            <div className="cockpit-panel-head">
              <div>
                <h2>Executive action brief</h2>
              </div>
            </div>
            <div className="cockpit-brief-stack">
              {actionBrief.map(({ key, label, Icon, conclusion, support }) => (
                <div className="cockpit-brief-row" key={key}>
                  <span className="cockpit-brief-label">
                    <Icon size={13} strokeWidth={2} aria-hidden="true" />
                    {label}
                  </span>
                  <strong className="cockpit-brief-conclusion" title={conclusion}>
                    {conclusion}
                  </strong>
                  <p className="cockpit-brief-support" title={support}>
                    {support}
                  </p>
                </div>
              ))}
            </div>
          </article>
        </div>
      </div>

      {briefingOpen ? (
        <div className="drawer-root briefing-drawer-root" role="dialog" aria-modal="true" aria-label="Decision briefing">
          <button
            type="button"
            className="drawer-backdrop"
            aria-label="Close briefing"
            onClick={() => setBriefingOpen(false)}
          />
          <aside className="entity-drawer briefing-drawer">
            <div className="drawer-head">
              <div>
                <div className="kicker">Assist · Executive briefing</div>
                <h2>Decision briefing</h2>
              </div>
              <button
                type="button"
                className="iconbtn"
                aria-label="Close"
                onClick={() => setBriefingOpen(false)}
              >
                <X size={18} strokeWidth={2} aria-hidden="true" />
              </button>
            </div>
            <div className="drawer-body">
              <ExecutiveBriefing embedded inDrawer />
            </div>
          </aside>
        </div>
      ) : null}
    </section>
  )
}
