/** Phase 1A chart wrappers reserved for Phase 1B ECharts visualisations. */
export function ChartPlaceholder({ title }) {
  return (
    <div className="viz-card">
      <div className="viz-head">
        <div>
          <h3 className="section-title">{title}</h3>
          <p>Chart deferred to Phase 1B.</p>
        </div>
      </div>
    </div>
  )
}
