export default function EvidenceTimeline({ events }) {
  return (
    <section className="result-panel evidence-timeline" aria-labelledby="timeline-title">
      <div className="panel-heading compact">
        <div>
          <p className="eyebrow">Evidence sequence</p>
          <h2 id="timeline-title">Your case, so far</h2>
        </div>
      </div>
      <ol>
        {events.map((event) => (
          <li key={event.source_id}>
            <span className="timeline-dot" aria-hidden="true" />
            <div><strong>{event.title}</strong><span>{event.detail}</span>{event.date_hint && <small>Date mentioned: {event.date_hint}</small>}</div>
          </li>
        ))}
      </ol>
      <p className="timeline-note">This is an evidence sequence. NAVI only shows a date when one appears in the submitted material.</p>
    </section>
  )
}
