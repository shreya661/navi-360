export default function TopNav({ activeView, user, onOpenAuth }) {
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

  return (
    <header className="topnav-bar">
      <div className="topnav-left">
        <h1 className="topnav-title">{currentTitle}</h1>
        <span className="ai-status-pill">
          <span className="online-dot" /> AI Online
        </span>
      </div>

      <div className="topnav-right">
        <div className="topnav-search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search cases, evidence or actions..."
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
