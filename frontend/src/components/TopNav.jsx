import { useEffect, useState } from 'react'
import { checkReadiness } from '../lib/api'

export default function TopNav({ activeView, user, onOpenAuth, onSearch }) {
  const [aiStatus, setAiStatus] = useState('Checking...')
  const [isLive, setIsLive] = useState(false)
  const [query, setQuery] = useState('')

  useEffect(() => {
    checkReadiness()
      .then((res) => {
        if (res.ready) {
          if (res.live_ai_configured) {
            setAiStatus('AI Live')
            setIsLive(true)
          } else {
            setAiStatus('AI Active (Demo)')
            setIsLive(true)
          }
        } else {
          setAiStatus('Offline')
          setIsLive(false)
        }
      })
      .catch(() => {
        setAiStatus('Offline')
        setIsLive(false)
      })
  }, [])

  const titles = {
    civic: 'NAVI Civic',
    protect: 'NAVI Protect',
    home: 'Home Overview',
    cases: 'My Cases',
    evidence: 'Evidence Vault',
    reminders: 'Active Reminders',
    settings: 'System Settings',
  }

  const currentTitle = titles[activeView] || 'NAVI 360'
  const initial = (user?.name || 'S').charAt(0).toUpperCase()

  const handleSearchSubmit = (e) => {
    if (e.key === 'Enter' && query.trim() && onSearch) {
      onSearch(query.trim())
    }
  }

  return (
    <header className="topnav-bar">
      <div className="topnav-left">
        <h1 className="topnav-title">{currentTitle}</h1>
        <span className="ai-status-pill">
          <span className={isLive ? 'online-dot' : 'status-dot'} /> {aiStatus}
        </span>
      </div>

      <div className="topnav-right">
        <div className="topnav-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search official government sources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            aria-label="Global search"
          />
        </div>

        <button type="button" className="topnav-icon-btn" aria-label="Notifications">
          🔔
          <span className="notification-badge-dot" />
        </button>

        <button type="button" className="topnav-avatar-btn" onClick={onOpenAuth} aria-label="User Account">
          {initial}
        </button>
      </div>
    </header>
  )
}
