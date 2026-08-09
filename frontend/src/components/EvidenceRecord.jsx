const iconFor = { image: '◫', pdf: '▤', text: '≡' }

export default function EvidenceRecord({ evidence }) {
  return (
    <section className="result-panel evidence-record" aria-labelledby="evidence-title">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Evidence record</p>
          <h2 id="evidence-title">What NAVI reviewed</h2>
        </div>
        <span className="evidence-count">{evidence.length}</span>
      </div>
      <ul className="evidence-list">
        {evidence.map((source) => (
          <li key={source.id}>
            <span className="evidence-icon" aria-hidden="true">{iconFor[source.kind]}</span>
            <span><strong>{source.filename}</strong><small>{source.detail}</small>{source.text_preview && <em>“{source.text_preview}”</em>}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
