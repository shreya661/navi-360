import { useState } from 'react'
import AnalysisView from './components/AnalysisView'
import AuthModal from './components/AuthModal'
import HistoryDrawer from './components/HistoryDrawer'
import LanguageToggle from './components/LanguageToggle'
import NaviProtectView from './components/NaviProtectView'
import SearchPanel from './components/SearchPanel'
import SettingsView from './components/SettingsView'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import UploadPanel from './components/UploadPanel'
import { useAnalyzeDocument } from './hooks/useAnalyzeDocument'

export default function App() {
  const [activeView, setActiveView] = useState('protect') // Default active view matching user's screenshot
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
    <div className="dashboard-layout">
      {/* Left Sidebar */}
      <Sidebar
        activeView={activeView}
        setActiveView={setActiveView}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        casesCount={history.length > 0 ? history.length : 3}
        remindersCount={2}
      />

      {/* Main Content Area */}
      <div className="dashboard-main">
        {/* Top Header */}
        <TopNav
          activeView={activeView}
          user={user}
          onOpenAuth={() => setIsAuthOpen(true)}
        />

        {/* Content View Switching */}
        <main className="dashboard-body">
          {activeView === 'protect' && <NaviProtectView />}

          {(activeView === 'civic' || activeView === 'home') && (
            result ? (
              <AnalysisView result={result} onStartOver={reset} />
            ) : (
              <div className="landing-grid">
                <section className="hero">
                  <p className="eyebrow"><span className="status-dot" />NAVI Civic Service</p>
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
            )
          )}

          {activeView === 'cases' && (
            <div className="placeholder-view">
              <h2>My Cases ({history.length})</h2>
              <p>Your recent document and notice analyses.</p>
              <button type="button" className="primary-button inline-button" onClick={() => setIsHistoryOpen(true)}>
                Open History Drawer
              </button>
            </div>
          )}

          {activeView === 'evidence' && (
            <div className="placeholder-view">
              <h2>Evidence Vault</h2>
              <p>Upload and organize document evidence securely.</p>
            </div>
          )}

          {activeView === 'reminders' && (
            <div className="placeholder-view">
              <h2>Active Reminders</h2>
              <p>Deadline trackers for post-matric scholarships, tax notices, and bill due dates.</p>
            </div>
          )}

          {activeView === 'settings' && (
            <SettingsView
              user={user}
              onOpenAuth={() => setIsAuthOpen(true)}
              language={language}
              setLanguage={setLanguage}
            />
          )}
        </main>
      </div>

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
    </div>
  )
}
