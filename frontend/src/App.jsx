import { useEffect, useState } from 'react'
import AnalysisView from './components/AnalysisView'
import AuthModal from './components/AuthModal'
import HistoryDrawer from './components/HistoryDrawer'
import LanguageToggle from './components/LanguageToggle'
import SearchPanel from './components/SearchPanel'
import UploadPanel from './components/UploadPanel'
import { useAnalyzeDocument } from './hooks/useAnalyzeDocument'

export default function App() {
  const [language, setLanguage] = useState('te')
  const { status, stage, stages, result, error, analyze, reset, loadResult } = useAnalyzeDocument()
  const loading = status === 'loading'

  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('navi360_user')
      return saved ? JSON.parse(saved) : null
    } catch {
      return null
    }
  })

  const [history, setHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('navi360_history')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })

  const [isAuthOpen, setIsAuthOpen] = useState(false)
  const [isHistoryOpen, setIsHistoryOpen] = useState(false)

  const saveUser = (userData) => {
    setUser(userData)
    if (userData) {
      localStorage.setItem('navi360_user', JSON.stringify(userData))
    } else {
      localStorage.removeItem('navi360_user')
    }
  }

  const handleAnalyze = async (files, textInput) => {
    try {
      const res = await analyze(files, textInput, language, user?.apiKey)
      if (res) {
        const item = { ...res, timestamp: new Date().toISOString() }
        setHistory((prev) => {
          const updated = [item, ...prev.filter((h) => h.request_id !== item.request_id)].slice(0, 20)
          localStorage.setItem('navi360_history', JSON.stringify(updated))
          return updated
        })
      }
    } catch {
      // Error handled by hook
    }
  }

  const clearHistory = () => {
    setHistory([])
    localStorage.removeItem('navi360_history')
  }

  return (
    <main>
      <header className="site-header">
        <a className="brand" href="/" aria-label="NAVI 360 home">
          <span className="brand-mark">N</span>
          <span>NAVI <em>360</em></span>
        </a>
        <div className="header-actions">
          <button
            type="button"
            className="header-button"
            onClick={() => setIsHistoryOpen(true)}
            aria-label="View history"
          >
            📋 History ({history.length})
          </button>
          <button
            type="button"
            className="header-button primary-header-button"
            onClick={() => setIsAuthOpen(true)}
            aria-label="Account settings"
          >
            👤 {user ? user.name : 'Sign In'}
          </button>
        </div>
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
            <UploadPanel onAnalyze={handleAnalyze} loading={loading} />
            {loading && (
              <div className="progress-card" role="status" aria-live="polite">
                {stages.map((item, index) => <span className={index <= stage ? 'progress-step active' : 'progress-step'} key={item}><b>{index < stage ? '✓' : index + 1}</b>{item}</span>)}
              </div>
            )}
            {error && <div className="request-error" role="alert"><strong>That did not work.</strong><span>{error}</span><button onClick={reset}>Try again</button></div>}
          </div>
          <SearchPanel />
        </div>
      )}

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        user={user}
        onSaveUser={saveUser}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onSelectAnalysis={(item) => loadResult(item)}
        onClearHistory={clearHistory}
      />

      <footer><span>Built to help you understand — not to decide for you.</span><span>© 2026 NAVI 360</span></footer>
    </main>
  )
}

