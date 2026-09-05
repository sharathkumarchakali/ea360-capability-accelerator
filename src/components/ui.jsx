export function Tag({ className = '', children }) {
  return <span className={`tag ${className}`.trim()}>{children}</span>
}

export function Cell({ value }) {
  if (value && typeof value === 'object' && 'tag' in value) {
    return <Tag className={value.tag}>{value.text}</Tag>
  }
  return value
}

export function DataTable({ columns, rows }) {
  return (
    <div className="tablewrap">
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((cell, j) => (
                <td key={j}>
                  <Cell value={cell} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ItemCards({ cards }) {
  return (
    <div className="cards3">
      {cards.map((card) => (
        <div className="itemcard" key={card.title}>
          {card.tag && !card.tagAfterTitle && (
            <Tag className={card.tag.className}>{card.tag.text}</Tag>
          )}
          <h4
            style={
              card.tag && !card.tagAfterTitle ? { marginTop: 8 } : undefined
            }
          >
            {card.title}
          </h4>
          {card.tag && card.tagAfterTitle && (
            <Tag className={card.tag.className}>{card.tag.text}</Tag>
          )}
          {card.body != null && <p>{card.body}</p>}
          {card.tagInline && (
            <p>
              <Tag className={card.tagInline.className}>{card.tagInline.text}</Tag>
              {card.bodyAfter}
            </p>
          )}
          {card.footerTag && (
            <Tag className={card.footerTag.className}>{card.footerTag.text}</Tag>
          )}
        </div>
      ))}
    </div>
  )
}
