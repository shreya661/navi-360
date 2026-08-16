import { useState } from 'react'

const DEFAULT_SAMPLE_MSG = 'Your account will be suspended today. Pay ₹1,999 immediately to avoid service disruption.'

export default function NaviProtectView() {
  const [message, setMessage] = useState(DEFAULT_SAMPLE_MSG)
  const [file, setFile] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [analysisResult, setAnalysisResult] = useState({
    status: 'POTENTIALLY SUSPICIOUS',
    statusKind: 'warning', // 'warning', 'danger', 'safe'
    signals: [
      'Urgent language',
      'Payment request [₹1,999]',
      'Threat of account suspension',
      'Sender not verified',
    ],
    recommendation: "Do not pay yet. Verify the request using the organization's official website or support channel.",
    disclaimer: 'This is risk analysis — not a definitive fraud verdict.',
  })

  function handleFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      runAnalysis(e.target.files[0].name, message)
    }
  }

  function handleAnalyzeClick() {
    runAnalysis(file?.name, message)
  }

  function runAnalysis(fileName, textMsg) {
    setAnalyzing(true)
    setTimeout(() => {
      setAnalyzing(false)
      const text = textMsg.toLowerCase()
      if (text.includes('pay') || text.includes('suspend') || text.includes('urgent') || text.includes('₹')) {
        setAnalysisResult({
          status: 'POTENTIALLY SUSPICIOUS',
          statusKind: 'warning',
          signals: [
            'Urgent language pressure',
            text.includes('₹') || text.includes('pay') ? 'Direct payment demand' : 'Financial threat',
            text.includes('suspend') ? 'Threat of service/account suspension' : 'Unverified urgency',
            'Unverified sender identity',
          ],
          recommendation: "Do not pay yet. Verify the request using the organization's official website or official support channel.",
          disclaimer: 'This is risk analysis — not a definitive fraud verdict.',
        })
      } else {
        setAnalysisResult({
          status: 'LOW RISK / INFORMATIONAL',
          statusKind: 'safe',
          signals: [
            'No high-pressure urgent language detected',
            'No direct unverified payment demand found',
            'Standard notification format',
          ],
          recommendation: 'Always double-check link URLs and official phone numbers before sharing sensitive personal data.',
          disclaimer: 'This is risk analysis — not a definitive fraud verdict.',
        })
      }
    }, 600)
  }

  return (
    <div className="protect-view-container">
      {/* Title Header */}
      <div className="protect-header">
        <div className="protect-title-row">
          <span className="protect-shield-icon">🛡️</span>
          <h2>NAVI Protect</h2>
        </div>
        <p className="protect-subtitle">Check before you pay, sign, click or share.</p>
      </div>

      {/* Dual Input Section */}
      <div className="protect-grid">
        {/* Card 1: Analyze Screenshot */}
        <div className="protect-card">
          <div className="card-header">
            <span>📷</span>
            <h3>Analyze Screenshot</h3>
          </div>
          <div className="upload-dropzone">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileSelect}
              id="screenshot-input"
              aria-label="Upload screenshot"
            />
            <label htmlFor="screenshot-input" className="dropzone-label">
              <div className="folder-icon">📁</div>
              <strong>{file ? file.name : 'Upload screenshot'}</strong>
              <small>JPG, PNG, or WEBP screenshots of SMS, WhatsApp, or emails</small>
            </label>
          </div>
        </div>

        {/* Card 2: Paste Message */}
        <div className="protect-card">
          <div className="card-header">
            <span>📝</span>
            <h3>Paste Message</h3>
          </div>
          <textarea
            className="message-textarea"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Paste suspicious text or message here..."
            rows={4}
          />
          <button
            type="button"
            className="protect-analyze-btn"
            onClick={handleAnalyzeClick}
            disabled={analyzing}
          >
            {analyzing ? 'Checking signals...' : 'Analyze Message'}
          </button>
        </div>
      </div>

      {/* Risk Analysis Result Banner */}
      {analysisResult && (
        <div className={`risk-result-banner ${analysisResult.statusKind}`}>
          <div className="risk-banner-header">
            <span className="risk-warning-icon">⚠️</span>
            <h4>{analysisResult.status}</h4>
          </div>

          <div className="risk-signals-block">
            <strong>Signals:</strong>
            <ul>
              {analysisResult.signals.map((sig, i) => (
                <li key={i}>
                  <span className="sig-icon">⚠️</span> {sig}
                </li>
              ))}
            </ul>
          </div>

          <div className="risk-recommendation">
            <strong>Recommendation:</strong> {analysisResult.recommendation}
          </div>

          <small className="risk-disclaimer">{analysisResult.disclaimer}</small>
        </div>
      )}
    </div>
  )
}
