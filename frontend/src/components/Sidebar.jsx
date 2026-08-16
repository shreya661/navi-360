export default function Sidebar({ activeView, setActiveView, user, onOpenAuth, casesCount = 3, remindersCount = 2 }) {
  const displayName = user?.name || (user?.email ? user.email.split('@')[0] : 'Sign In')
  const initial = displayName.charAt(0).toUpperCase()
  const displaySub = user?.email || (user?.name ? 'Personal Account' : 'Click to set up profile')

  return (
    <aside className="app-sidebar" aria-label="Main Navigation">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="sidebar-logo">
          <span className="logo-badge">N3</span>
          <span className="logo-text">NAVI <em>360</em></span>
        </div>
        <button type="button" className="sidebar-collapse-btn" aria-label="Collapse sidebar">◀</button>
      </div>

      <nav className="sidebar-nav">
        {/* MAIN Section */}
        <div className="nav-section">
          <span className="nav-section-title">MAIN</span>
          <button
            type="button"
            className={`nav-item ${activeView === 'home' ? 'active' : ''}`}
            onClick={() => setActiveView('home')}
          >
            <span className="nav-icon">🏠</span>
            <span className="nav-label">Home</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === 'cases' ? 'active' : ''}`}
            onClick={() => setActiveView('cases')}
          >
            <span className="nav-icon">📁</span>
            <span className="nav-label">My Cases</span>
            {casesCount > 0 && <span className="nav-badge alert-badge">{casesCount}</span>}
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === 'evidence' ? 'active' : ''}`}
            onClick={() => setActiveView('evidence')}
          >
            <span className="nav-icon">📑</span>
            <span className="nav-label">Evidence</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === 'reminders' ? 'active' : ''}`}
            onClick={() => setActiveView('reminders')}
          >
            <span className="nav-icon">⏰</span>
            <span className="nav-label">Reminders</span>
            {remindersCount > 0 && <span className="nav-badge alert-badge">{remindersCount}</span>}
          </button>
        </div>

        {/* SERVICES Section */}
        <div className="nav-section">
          <span className="nav-section-title">SERVICES</span>
          <button
            type="button"
            className={`nav-item ${activeView === 'civic' ? 'active' : ''}`}
            onClick={() => setActiveView('civic')}
          >
            <span className="nav-icon">🏛️</span>
            <span className="nav-label">NAVI Civic</span>
          </button>
          <button
            type="button"
            className={`nav-item ${activeView === 'protect' ? 'active' : ''}`}
            onClick={() => setActiveView('protect')}
          >
            <span className="nav-icon">🛡️</span>
            <span className="nav-label">NAVI Protect</span>
          </button>
        </div>

        {/* MORE Section */}
        <div className="nav-section">
          <span className="nav-section-title">MORE</span>
          <button
            type="button"
            className={`nav-item ${activeView === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveView('settings')}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </div>
      </nav>

      {/* User Profile Footer */}
      <div className="sidebar-profile-footer" onClick={onOpenAuth} role="button" tabIndex={0}>
        <div className="profile-avatar">{initial}</div>
        <div className="profile-info">
          <span className="profile-name">{displayName}</span>
          <span className="profile-sub">{displaySub}</span>
        </div>
      </div>
    </aside>
  )
}
