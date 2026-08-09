export default function MissingInfoList({ items }) {
  return (
    <section className="result-panel checklist" aria-labelledby="checklist-title">
      <div className="panel-heading">
        <div className="section-number">03</div>
        <div>
          <p className="eyebrow">Before you begin</p>
          <h2 id="checklist-title">Your document checklist</h2>
        </div>
      </div>
      <ul>
        {items.map((item) => (
          <li key={item.name} className={`check ${item.status}`}>
            <span className="check-mark" aria-hidden="true">{item.status === 'found' ? '✓' : '?'}</span>
            <span><strong>{item.name}</strong><small>{item.detail}</small></span>
          </li>
        ))}
      </ul>
    </section>
  )
}

