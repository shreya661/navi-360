import { useState } from 'react'
import AnalysisView from './components/AnalysisView'
import LanguageToggle from './components/LanguageToggle'
import UploadPanel from './components/UploadPanel'
import { useAnalyzeDocument } from './hooks/useAnalyzeDocument'

export default function App() {
  const [language, setLanguage] = useState('te')
  const { status, stage, stages, result, error, analyze, reset } = useAnalyzeDocument()
  const loading = status === 'loading'

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="NAVI 360 home"><span className="brand-mark">N</span><span>NAVI <em>360</em></span></a>
        <span className="header-note">Clarity for every notice</span>
      </header>

      {result ? (
        <AnalysisView result={result} onStartOver={reset} />
      ) : (
        <div className="landing-grid">
          <section className="hero">
            <p className="eyebrow"><span className="status-dot" />A simpler way to understand</p>
            <h1>Every notice,<br /><i>made clear.</i></h1>
            <p className="hero-copy">Add notices, screenshots, PDFs, receipts, messages, or text. NAVI turns scattered evidence into a clear next step — in your language.</p>
            <div className="trust-points"><span>✦ Evidence-aware</span><span>◌ Official links only</span><span>◒ Audio when ready</span></div>
          </section>
          <div className="action-column">
            <LanguageToggle language={language} onChange={setLanguage} disabled={loading} />
            <UploadPanel onAnalyze={(files, textInput) => analyze(files, textInput, language)} loading={loading} />
            {loading && (
              <div className="progress-card" role="status" aria-live="polite">
                {stages.map((item, index) => <span className={index <= stage ? 'progress-step active' : 'progress-step'} key={item}><b>{index < stage ? '✓' : index + 1}</b>{item}</span>)}
              </div>
            )}
            {error && <div className="request-error" role="alert"><strong>That did not work.</strong><span>{error}</span><button onClick={reset}>Try again</button></div>}
          </div>
        </div>
      )}
      <footer><span>Built to help you understand — not to decide for you.</span><span>© 2026 NAVI 360</span></footer>
    </main>
  )
}
