import {
  AUTONOMY_HELP,
  AUTONOMY_LABELS,
  formatCriticality,
  formatLifecycle,
  governanceTone,
  permissionLabel,
} from './portfolioModel'

function Section({ title, children }) {
  if (!children) return null
  if (Array.isArray(children) && children.length === 0) return null
  return (
    <div className="drawer-section app-drawer-section">
      <h4>{title}</h4>
      {children}
    </div>
  )
}

function Chip({ children, onClick }) {
  if (onClick) {
    return (
      <button type="button" className="link-chip" onClick={onClick}>
        {children}
      </button>
    )
  }
  return <span className="link-chip static">{children}</span>
}

function StatusTag({ children, tone }) {
  return <span className={`status-tag tone-${tone || 'muted'}`}>{children}</span>
}

export default function AIDetailPanel({
  row,
  repo,
  onOpenEntity,
  onNavigateFindings,
  onNavigateGovernance,
  onNavigateAiGovernance,
}) {
  if (!row) return null
  const s = row.sol
  const models = s.modelIds.map((id) => repo.getAiModel(id)).filter(Boolean)
  const dataDomains = s.dataDomainIds.map((id) => repo.getDataObject(id)).filter(Boolean)
  const apps = s.applicationIds.map((id) => repo.getApplication(id)).filter(Boolean)
  const tools = s.toolPermissions
    .map((tp) => {
      const int = repo.getIntegration(tp.integrationId)
      return int ? { int, permission: tp.permission } : null
    })
    .filter(Boolean)
  const techs = s.technologyIds.map((id) => repo.getTechnology(id)).filter(Boolean)
  const findings = (s.findingIds || [])
    .map((id) => repo.getFinding(id))
    .filter(Boolean)
  const decisions = (s.decisionIds || [])
    .map((id) => repo.getDecision(id))
    .filter(Boolean)
  const initiatives = (s.initiativeIds || [])
    .map((id) => repo.getInitiative(id))
    .filter(Boolean)
  const kpi = s.outcomeKpiId ? repo.getKpi(s.outcomeKpiId) : null
  const g = s.governanceDetail

  return (
    <div className="app-detail-panel ai-detail-panel">
      <p className="app-detail-desc">{s.businessPurpose}</p>
      <p className="sub">
        {s.id} · {s.solutionType} · Synthetic demo data
      </p>

      <Section title="Why does this AI exist?">
        <dl className="app-detail-dl">
          <div>
            <dt>Business purpose</dt>
            <dd>{s.businessPurpose}</dd>
          </div>
          <div>
            <dt>Business capability</dt>
            <dd>{row.capabilityNames.join(' · ')}</dd>
          </div>
          {s.outcomeStatement && (
            <div>
              <dt>Expected outcome</dt>
              <dd>{s.outcomeStatement}</dd>
            </div>
          )}
          <div>
            <dt>Business owner</dt>
            <dd>{s.businessOwner || '—'}</dd>
          </div>
          <div>
            <dt>Technical owner</dt>
            <dd>{s.technicalOwner || '—'}</dd>
          </div>
          {s.aiOwner && (
            <div>
              <dt>AI owner</dt>
              <dd>{s.aiOwner}</dd>
            </div>
          )}
        </dl>
      </Section>

      <Section title="What kind of AI is it?">
        <div className="drawer-metrics">
          <div>
            <span>Type</span>
            <strong>{s.solutionType}</strong>
          </div>
          <div>
            <span>Lifecycle</span>
            <strong>{formatLifecycle(s.lifecycle)}</strong>
          </div>
          <div>
            <span>Criticality</span>
            <strong>{formatCriticality(s.businessCriticality)}</strong>
          </div>
          <div>
            <span>Autonomy</span>
            <strong>{AUTONOMY_LABELS[s.autonomyLevel]}</strong>
          </div>
        </div>
      </Section>

      {(s.agentName || s.agentRole) && (
        <Section title="Agent / Copilot">
          {s.agentName && (
            <p>
              <strong>{s.agentName}</strong>
            </p>
          )}
          {s.agentRole && <p className="sub">{s.agentRole}</p>}
        </Section>
      )}

      <Section title="Model dependencies">
        <ul className="drawer-list">
          {models.map((m) => (
            <li key={m.id}>
              <strong>{m.name}</strong> — {m.provider} · {m.modelType} · {m.hosting}
            </li>
          ))}
        </ul>
      </Section>

      <Section title="Data & knowledge">
        {dataDomains.length > 0 && (
          <div className="chip-row">
            {dataDomains.map((d) => (
              <Chip key={d.id} onClick={() => onOpenEntity({ id: d.id, type: 'dataObject' })}>
                {d.name}
                {d.classificationLabel ? ` · ${d.classificationLabel}` : ''}
              </Chip>
            ))}
          </div>
        )}
        {(s.knowledgeSources || []).length > 0 && (
          <ul className="drawer-list">
            {s.knowledgeSources.map((k) => (
              <li key={k}>{k}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Agent tools / APIs">
        {tools.length === 0 ? (
          <p className="sub">No tool or API permissions documented.</p>
        ) : (
          <ul className="drawer-list">
            {tools.map(({ int, permission }) => (
              <li key={int.id}>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => onOpenEntity({ id: int.id, type: 'integration' })}
                >
                  {int.apiOrInterfaceName || int.name}
                </button>{' '}
                — {permissionLabel(permission)}
              </li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Application access">
        <div className="chip-row">
          {apps.map((a) => (
            <Chip key={a.id} onClick={() => onOpenEntity({ id: a.id, type: 'application' })}>
              {a.name}
            </Chip>
          ))}
        </div>
      </Section>

      {techs.length > 0 && (
        <Section title="Technology hosting">
          <div className="chip-row">
            {techs.map((t) => (
              <Chip key={t.id} onClick={() => onOpenEntity({ id: t.id, type: 'technology' })}>
                {t.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Section title="Autonomy">
        <p>
          <strong>{AUTONOMY_LABELS[s.autonomyLevel]}</strong>
        </p>
        <p className="sub">{AUTONOMY_HELP[s.autonomyLevel]}</p>
        {row.oversightGap && (
          <p className="portfolio-insight-warn">
            Oversight gap: high-autonomy system with insufficient human oversight documented.
          </p>
        )}
      </Section>

      <Section title="Human oversight">
        <dl className="app-detail-dl">
          <div>
            <dt>Approval requirement</dt>
            <dd>{s.humanOversightType}</dd>
          </div>
          {s.humanOversightRole && (
            <div>
              <dt>Human role</dt>
              <dd>{s.humanOversightRole}</dd>
            </div>
          )}
          {s.escalationOwner && (
            <div>
              <dt>Escalation owner</dt>
              <dd>{s.escalationOwner}</dd>
            </div>
          )}
          <div>
            <dt>Override available</dt>
            <dd>{s.overrideAvailable ? 'Yes' : 'No'}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Permissions">
        <ul className="drawer-list">
          {tools.map(({ int, permission }) => (
            <li key={`perm-${int.id}`}>
              {int.name} — {permissionLabel(permission)}
            </li>
          ))}
        </ul>
      </Section>

      {s.guardrails && (
        <Section title="Guardrails">
          <ul className="drawer-list">
            {Object.entries(s.guardrails).map(([k, v]) => (
              <li key={k}>
                {k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}: {v}
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="Risk">
        <StatusTag tone={s.riskLevel === 'Low' ? 'good' : s.riskLevel === 'Medium' ? 'warn' : 'bad'}>
          {s.riskLevel}
        </StatusTag>
        {(s.riskFactors || []).length > 0 && (
          <ul className="drawer-list">
            {s.riskFactors.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        )}
      </Section>

      <Section title="Governance status">
        {g && (
          <ul className="drawer-list">
            {Object.entries(g).map(([k, v]) => (
              <li key={k}>
                {k.replace(/([A-Z])/g, ' $1')}: <StatusTag tone={governanceTone(v)}>{v}</StatusTag>
              </li>
            ))}
          </ul>
        )}
        <p>
          Overall: <strong>Governance status: {s.governanceStatus}</strong>
        </p>
        <button type="button" className="text-link" onClick={onNavigateAiGovernance}>
          Open AI & Data Governance workspace
        </button>
      </Section>

      {(s.outcomeStatement || kpi) && (
        <Section title="Outcomes">
          <dl className="app-detail-dl">
            {s.outcomeStatement && (
              <div>
                <dt>Intended outcome</dt>
                <dd>{s.outcomeStatement}</dd>
              </div>
            )}
            {kpi && (
              <div>
                <dt>Outcome metric</dt>
                <dd>{kpi.name}</dd>
              </div>
            )}
            {s.outcomeBaseline && (
              <div>
                <dt>Baseline (synthetic)</dt>
                <dd>{s.outcomeBaseline}</dd>
              </div>
            )}
            {s.outcomeCurrent && (
              <div>
                <dt>Current (synthetic)</dt>
                <dd>{s.outcomeCurrent}</dd>
              </div>
            )}
            {s.outcomeTarget && (
              <div>
                <dt>Target (synthetic)</dt>
                <dd>{s.outcomeTarget}</dd>
              </div>
            )}
          </dl>
        </Section>
      )}

      {findings.length > 0 && (
        <Section title="Findings">
          <div className="chip-row">
            {findings.map((f) => (
              <Chip key={f.id} onClick={() => onOpenEntity({ id: f.id, type: 'finding' })}>
                {f.name}
              </Chip>
            ))}
          </div>
          <button type="button" className="text-link" onClick={onNavigateFindings}>
            View in Findings & Risks
          </button>
        </Section>
      )}

      {decisions.length > 0 && (
        <Section title="Decisions">
          <div className="chip-row">
            {decisions.map((d) => (
              <Chip key={d.id} onClick={() => onOpenEntity({ id: d.id, type: 'decision' })}>
                {d.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      {initiatives.length > 0 && (
        <Section title="Transformation">
          <div className="chip-row">
            {initiatives.map((i) => (
              <Chip key={i.id} onClick={() => onOpenEntity({ id: i.id, type: 'initiative' })}>
                {i.name}
              </Chip>
            ))}
          </div>
        </Section>
      )}

      <Section title="Portfolio action">
        <StatusTag tone="muted">{s.portfolioAction}</StatusTag>
        {s.portfolioActionReason && <p className="sub">{s.portfolioActionReason}</p>}
        {s.decisionSupported && (
          <p className="sub">
            Decision supported: {s.decisionSupported}
            {s.outcomeStatement ? ` → ${s.outcomeStatement}` : ''}
          </p>
        )}
      </Section>
    </div>
  )
}
