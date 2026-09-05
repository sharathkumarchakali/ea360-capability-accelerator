import { domains } from '../data'

export default function Overview({ orgLabel }) {
  return (
    <section className="view active">
      <div className="hero">
        <div className="executive-band">
          <div className="executive-message">
            <div className="kicker">
              Enterprise Architecture Control Tower · {orgLabel}
            </div>
            <h1>Transformation is moving faster than architecture control.</h1>
            <p>
              Governance, Integration &amp; APIs and AI Governance are the binding
              constraints. Closing these gaps first will reduce execution risk and
              accelerate reuse.
            </p>
            <div className="hero-chips">
              <span className="hero-chip">12 domains assessed</span>
              <span className="hero-chip">126 evidence items</span>
              <span className="hero-chip">Updated 04 Sep 2026</span>
            </div>
          </div>
          <div className="maturity-card">
            <div className="maturity-ring" style={{ '--value': 46 }}>
              <div className="ring-value">
                2.3<small>OF 5 · EMERGING</small>
              </div>
            </div>
            <div className="maturity-copy">
              <h3>Enterprise maturity</h3>
              <p>Current capability is 1.2 points below the 12-month ambition.</p>
              <span className="target-pill">Target 3.5 ↑</span>
            </div>
          </div>
        </div>
        <div className="signal-strip">
          <div className="signal-card">
            <div
              className="signal-icon"
              style={{ background: 'var(--risk-soft)', color: 'var(--risk)' }}
            >
              !
            </div>
            <div>
              <strong>5</strong>
              <span>Critical risks requiring executive ownership</span>
            </div>
          </div>
          <div className="signal-card">
            <div
              className="signal-icon"
              style={{ background: 'var(--warn-soft)', color: 'var(--warn)' }}
            >
              ↗
            </div>
            <div>
              <strong>12</strong>
              <span>Priority actions across the next 90 days</span>
            </div>
          </div>
          <div className="signal-card">
            <div
              className="signal-icon"
              style={{ background: 'var(--good-soft)', color: 'var(--good)' }}
            >
              ✓
            </div>
            <div>
              <strong>78%</strong>
              <span>Assessment completion and confidence</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <div className="overview-grid">
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3>Capability maturity by domain</h3>
                <p>Current maturity against the five-level EA360 model.</p>
              </div>
              <div className="legend">
                <span>
                  <i style={{ background: 'var(--risk)' }} />
                  Critical
                </span>
                <span>
                  <i style={{ background: 'var(--warn)' }} />
                  Emerging
                </span>
                <span>
                  <i style={{ background: 'var(--accent)' }} />
                  Progressing
                </span>
              </div>
            </div>
            <div className="domain-visual">
              {domains.map(([name, score, color]) => (
                <div className="domain-tile" key={name}>
                  <div className="domain-tile-head">
                    <span>{name}</span>
                    <span className="domain-score" style={{ color }}>
                      {score}
                    </span>
                  </div>
                  <div className="domain-track">
                    <span
                      style={{
                        width: `${parseFloat(score) * 20}%`,
                        background: color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="viz-card">
            <div className="viz-head">
              <div>
                <h3>Transformation risk</h3>
                <p>Architecture signals by severity.</p>
              </div>
              <span className="tag red">5 critical</span>
            </div>
            <div className="risk-viz">
              <div
                className="risk-donut"
                aria-label="17 architecture signals: 5 critical, 8 need attention and 4 healthy"
              />
              <div className="risk-key">
                <div className="risk-key-row">
                  <i style={{ background: 'var(--risk)' }} />
                  <span>Critical</span>
                  <strong>5</strong>
                </div>
                <div className="risk-key-row">
                  <i style={{ background: 'var(--warn)' }} />
                  <span>Needs attention</span>
                  <strong>8</strong>
                </div>
                <div className="risk-key-row">
                  <i style={{ background: 'var(--good)' }} />
                  <span>Healthy</span>
                  <strong>4</strong>
                </div>
              </div>
            </div>
            <div className="priority-flow">
              <div className="priority-row">
                <span className="priority-rank">01</span>
                <div>
                  <b>Establish Architecture Review Board</b>
                  <small>Decision rights and mandatory review gates</small>
                </div>
                <span className="tag red">P1</span>
              </div>
              <div className="priority-row">
                <span className="priority-rank">02</span>
                <div>
                  <b>Establish enterprise API standards</b>
                  <small>Ownership, lifecycle, security and reuse</small>
                </div>
                <span className="tag red">P1</span>
              </div>
              <div className="priority-row">
                <span className="priority-rank">03</span>
                <div>
                  <b>Govern AI agents and models</b>
                  <small>Inventory, controls and lifecycle assurance</small>
                </div>
                <span className="tag amber">P1</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="journey-wrap">
        <div className="journey-head">
          <div>
            <h3 style={{ margin: 0 }}>12-month capability trajectory</h3>
            <div className="sub">
              Target progression from control establishment to measurable business
              value.
            </div>
          </div>
          <div className="kicker" style={{ margin: 0 }}>
            Transformation path
          </div>
        </div>
        <div className="journey-line">
          <div className="journey-node">
            <div className="journey-dot" />
            <b>2.3</b>
            <span>Today · Emerging</span>
          </div>
          <div className="journey-node">
            <div className="journey-dot" />
            <b>2.7</b>
            <span>90 days · Controls</span>
          </div>
          <div className="journey-node">
            <div className="journey-dot" />
            <b>3.1</b>
            <span>6 months · Adoption</span>
          </div>
          <div className="journey-node">
            <div className="journey-dot" />
            <b>3.5</b>
            <span>12 months · Managed</span>
          </div>
        </div>
      </div>
    </section>
  )
}
