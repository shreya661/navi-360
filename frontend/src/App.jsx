import { useEffect, useState } from 'react'
import AnalysisView from './components/AnalysisView'
import AuthModal from './components/AuthModal'
import CasesView from './components/CasesView'
import EvidenceVaultView from './components/EvidenceVaultView'
import HistoryDrawer from './components/HistoryDrawer'
import LanguageToggle from './components/LanguageToggle'
import NaviProtectView from './components/NaviProtectView'
import RemindersView from './components/RemindersView'
import SearchPanel from './components/SearchPanel'
import SettingsView from './components/SettingsView'
import Sidebar from './components/Sidebar'
import TopNav from './components/TopNav'
import UploadPanel from './components/UploadPanel'
import { useAnalyzeDocument } from './hooks/useAnalyzeDocument'
import { deleteAnalysis, fetchAnalyses, fetchCases, fetchMe, fetchReminders, getAuthToken, setAuthToken } from './lib/api'

export default function App() {
  const [activeView, setActiveView] = useState('protect')
  const [language, setLanguage] = useState('te')
  const { status, stage, stages, result, error, analyze, reset, loadResult } = useAnalyzeDocument()
  const loading = status === 'loading'

  const [user, setUser] = useState(null)
  const [casesCount, setCasesCount] = useState(0)
  const [remindersCount, setRemindersCount] = useState(0)

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

  const refreshUserData = async () => {
    const token = getAuthToken()
    if (!token) {
      setUser(null)
      setCasesCount(0)
      setRemindersCount(0)
      try {
        const saved = localStorage.getItem('navi360_history')
        setHistory(saved ? JSON.parse(saved) : [])
      } catch {
        setHistory([])
      }
      return
    }
    try {
      const u = await fetchMe()
      setUser(u)
      if (u.language) setLanguage(u.language)
    } catch {
      setAuthToken(null)
      setUser(null)
    }

    try {
      const casesRes = await fetchCases()
      setCasesCount(casesRes.total || 0)
    } catch {
      setCasesCount(0)
    }

    try {
      const remRes = await fetchReminders()
      setRemindersCount(remRes.active_count || 0)
    } catch {
      setRemindersCount(0)
    }

    try {
      const analyses = await fetchAnalyses()
      const mapped = (analyses || []).map(a => ({
        ...a,
        timestamp: a.created_at || new Date().toISOString()
      }))
      setHistory(mapped)
    } catch {
      setHistory([])
    }
  }

  useEffect(() => {
    refreshUserData()
  }, [])

  const handleSaveUser = (userData) => {
    setUser(userData)
    refreshUserData()
  }

  const handleAnalyze = async (files, textInput) => {
    try {
      const res = await analyze(files, textInput, language, user?.apiKey)
      if (res) {
        const item = { ...res, timestamp: new Date().toISOString() }
        setHistory((prev) => {
          const updated = [item, ...prev.filter((h) => h.request_id !== item.request_id)].slice(0, 20)
          if (!user) {
            localStorage.setItem('navi360_history', JSON.stringify(updated))
          }
          return updated
        })
      }
    } catch {
      // Error handled by hook
    }
  }

  const clearHistory = async () => {
    if (user) {
      try {
        await Promise.all(history.map((item) => deleteAnalysis(item.request_id)))
      } catch {
        // Ignore background deletion errors
      }
    }
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
        onOpenHistory={() => setIsHistoryOpen(true)}
        casesCount={casesCount}
        remindersCount={remindersCount}
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
              <AnalysisView
                result={result}
                onStartOver={reset}
                user={user}
                onOpenAuth={() => setIsAuthOpen(true)}
                onCaseCreated={refreshUserData}
              />
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
            <CasesView user={user} onOpenAuth={() => setIsAuthOpen(true)} />
          )}

          {activeView === 'evidence' && (
            <EvidenceVaultView user={user} onOpenAuth={() => setIsAuthOpen(true)} />
          )}

          {activeView === 'reminders' && (
            <RemindersView user={user} onOpenAuth={() => setIsAuthOpen(true)} />
          )}

          {activeView === 'settings' && (
            <SettingsView
              user={user}
              onUserUpdated={setUser}
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
        onSaveUser={handleSaveUser}
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
