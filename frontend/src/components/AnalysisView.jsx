import AudioPlayer from './AudioPlayer'
import EvidenceRecord from './EvidenceRecord'
import EvidenceTimeline from './EvidenceTimeline'
import MissingInfoList from './MissingInfoList'
import ResultActions from './ResultActions'
import SafeActionGate from './SafeActionGate'
import TrustBadge from './TrustBadge'

export default function AnalysisView({ result, onStartOver }) {
  const { notice, plain_explanation: explanation, claims, evidence, timeline, missing_information: checklist, official_source: source, safe_next_step: nextStep } = result
  return (
    <div className="analysis-layout">
      {result.is_demo && <div className="demo-banner"><span>Demo mode</span> Add an NVIDIA NIM key to read a real uploaded notice. This preview shows the complete NAVI flow.</div>}
      <section className="result-panel explanation" aria-labelledby="explanation-title">
        <div className="panel-heading">
          <div className="section-number">02</div>
          <div>
            <p className="eyebrow">In plain language</p>
            <h1 id="explanation-title">{notice.title}</h1>
          </div>
          <button className="start-over" onClick={onStartOver}>Analyse another</button>
        </div>
        <div className="notice-meta">
          {notice.issuer && <span>{notice.issuer}</span>}
          {notice.deadline && <span>Deadline: <strong>{notice.deadline}</strong></span>}
        </div>
        <p className="explanation-text">{explanation}</p>
        <AudioPlayer segments={result.audio_segments} language={result.language} />
      </section>

      <section className="result-panel trust-panel" aria-labelledby="trust-title">
        <div className="panel-heading compact">
          <div>
            <p className="eyebrow">Trust layer</p>
            <h2 id="trust-title">What is certain?</h2>
          </div>
          <span className="quiet-icon" aria-hidden="true">◔</span>
        </div>
        <div className="claim-list">
          {claims.map((claim, index) => (
            <article className="claim" key={`${claim.kind}-${index}`}>
              <TrustBadge kind={claim.kind} />
              <p>{claim.text}</p>
              {claim.evidence && <small>{claim.evidence}</small>}
            </article>
          ))}
        </div>
      </section>

      <div className="evidence-grid">
        <EvidenceRecord evidence={evidence} />
        <EvidenceTimeline events={timeline} />
      </div>
      <MissingInfoList items={checklist} />
      <SafeActionGate source={source} nextStep={nextStep} />
      <ResultActions result={result} />
      <p className="disclaimer">{result.disclaimer}</p>
    </div>
  )
}
