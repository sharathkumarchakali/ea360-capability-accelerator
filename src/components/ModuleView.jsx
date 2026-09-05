import { domains } from '../data'
import { DataTable, ItemCards, Tag } from './ui'

function ModuleVisual({ id }) {
  if (id === 'assessment') {
    return (
      <div className="module-viz">
        <div className="viz-head">
          <div>
            <h3>Domain maturity profile</h3>
            <p>Current scores reveal where targeted intervention creates the most leverage.</p>
          </div>
          <Tag className="blue">12 domains</Tag>
        </div>
        <div className="mini-bars">
          {domains.map(([name, score, color]) => (
            <div className="mini-bar" key={name}>
              <span>{name}</span>
              <div className="mini-bar-track">
                <span
                  style={{
                    width: `${parseFloat(score) * 20}%`,
                    background: color,
                  }}
                />
              </div>
              <strong>{score}</strong>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (id === 'findings') {
    return (
      <div className="module-viz">
        <div className="viz-head">
          <div>
            <h3>Risk concentration</h3>
            <p>Critical and high-severity findings represent 45% of the open register.</p>
          </div>
          <Tag className="red">Action required</Tag>
        </div>
        <div className="risk-viz">
          <div className="risk-donut" aria-label="Risk distribution" />
          <div className="risk-key">
            <div className="risk-key-row">
              <i style={{ background: 'var(--risk)' }} />
              <span>Critical</span>
              <strong>5</strong>
            </div>
            <div className="risk-key-row">
              <i style={{ background: 'var(--warn)' }} />
              <span>High</span>
              <strong>8</strong>
            </div>
            <div className="risk-key-row">
              <i style={{ background: 'var(--accent)' }} />
              <span>Other open</span>
              <strong>16</strong>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (id === 'roadmap') {
    return (
      <div className="module-viz">
        <div className="viz-head">
          <div>
            <h3>Delivery horizon</h3>
            <p>Control first, institutionalise second, then automate and optimise.</p>
          </div>
          <Tag className="blue">44 actions</Tag>
        </div>
        <div className="journey-line">
          <div className="journey-node">
            <div className="journey-dot" />
            <b>12</b>
            <span>0–90 days</span>
          </div>
          <div className="journey-node">
            <div className="journey-dot" />
            <b>18</b>
            <span>3–6 months</span>
          </div>
          <div className="journey-node">
            <div className="journey-dot" />
            <b>14</b>
            <span>6–12 months</span>
          </div>
          <div className="journey-node">
            <div className="journey-dot" />
            <b>3.5</b>
            <span>Target maturity</span>
          </div>
        </div>
      </div>
    )
  }

  if (id === 'people') {
    return (
      <div className="module-viz">
        <div className="viz-head">
          <div>
            <h3>Capability gap profile</h3>
            <p>Focused development plan for the skills constraining delivery confidence.</p>
          </div>
          <Tag className="red">3 priority gaps</Tag>
        </div>
        <div className="mini-bars">
          <div className="mini-bar">
            <span>Business Architecture</span>
            <div className="mini-bar-track">
              <span style={{ width: '38%' }} />
            </div>
            <strong>1.9</strong>
          </div>
          <div className="mini-bar">
            <span>Security Architecture</span>
            <div className="mini-bar-track">
              <span style={{ width: '44%' }} />
            </div>
            <strong>2.2</strong>
          </div>
          <div className="mini-bar">
            <span>AI Architecture</span>
            <div className="mini-bar-track">
              <span style={{ width: '24%', background: 'var(--risk)' }} />
            </div>
            <strong>1.2</strong>
          </div>
          <div className="mini-bar">
            <span>Integration Architecture</span>
            <div className="mini-bar-track">
              <span style={{ width: '62%', background: 'var(--good)' }} />
            </div>
            <strong>3.1</strong>
          </div>
        </div>
      </div>
    )
  }

  if (id === 'kpis') {
    return (
      <div className="module-viz">
        <div className="viz-head">
          <div>
            <h3>Outcome performance</h3>
            <p>Progress against the measures that demonstrate architecture value.</p>
          </div>
          <Tag className="green">Improving</Tag>
        </div>
        <div className="mini-bars">
          <div className="mini-bar">
            <span>Project coverage</span>
            <div className="mini-bar-track">
              <span style={{ width: '83%' }} />
            </div>
            <strong>83%</strong>
          </div>
          <div className="mini-bar">
            <span>Standards compliance</span>
            <div className="mini-bar-track">
              <span style={{ width: '68%', background: 'var(--warn)' }} />
            </div>
            <strong>68%</strong>
          </div>
          <div className="mini-bar">
            <span>Portfolio ownership</span>
            <div className="mini-bar-track">
              <span style={{ width: '72%' }} />
            </div>
            <strong>72%</strong>
          </div>
          <div className="mini-bar">
            <span>Actions completed</span>
            <div className="mini-bar-track">
              <span style={{ width: '48%', background: 'var(--risk)' }} />
            </div>
            <strong>48%</strong>
          </div>
        </div>
      </div>
    )
  }

  return null
}

function ModuleContent({ data }) {
  if (data.type === 'assessment-cards') {
    return (
      <div className="cards3">
        {domains.map(([name, score]) => (
          <div className="itemcard" key={name}>
            <h4>{name}</h4>
            <div style={{ fontSize: 24, fontWeight: 800 }}>
              {score}
              <span style={{ fontSize: 10, color: 'var(--muted)' }}> / 5</span>
            </div>
            <div className="progress" style={{ margin: '9px 0' }}>
              <div style={{ width: `${parseFloat(score) * 20}%` }} />
            </div>
            <p>
              Review maturity, target, evidence completeness, findings and next
              actions for this domain.
            </p>
          </div>
        ))}
      </div>
    )
  }

  if (data.type === 'table') {
    return <DataTable columns={data.columns} rows={data.rows} />
  }

  if (data.type === 'cards') {
    return <ItemCards cards={data.cards} />
  }

  return null
}

export default function ModuleView({ id, data, onAction }) {
  return (
    <section className="view active">
      <div className="module">
        <div className="module-header">
          <div>
            <div className="kicker">EA360 · {id.replaceAll('-', ' ')}</div>
            <h1>{data.title}</h1>
            <p>{data.desc}</p>
          </div>
          <div className="toolbar">
            <button className="btn" type="button" onClick={() => onAction('export')}>
              Export
            </button>
            <button
              className="btn primary"
              type="button"
              onClick={() => onAction('create')}
            >
              Create / Add
            </button>
          </div>
        </div>
        <div className="metrics">
          {data.metrics.map(([label, value]) => (
            <div className="metric" key={label}>
              <div className="m-label">{label}</div>
              <div className="m-value">{value}</div>
            </div>
          ))}
        </div>
        <ModuleVisual id={id} />
        <ModuleContent data={data} />
      </div>
    </section>
  )
}
