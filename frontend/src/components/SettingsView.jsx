import { useState } from 'react'

export default function SettingsView({ user, onOpenAuth, language, setLanguage }) {
  const [notifications, setNotifications] = useState({
    deadline: true,
    missingDoc: true,
  })

  return (
    <div className="settings-view-container">
      {/* Title Header */}
      <div className="settings-header">
        <h2>⚙️ Settings</h2>
      </div>

      <div className="settings-cards-list">
        {/* Card 1: Profile */}
        <div className="settings-card">
          <div className="card-title-row">
            <span>👤</span>
            <h3>Profile</h3>
          </div>
          <div className="profile-details-row">
            <p>
              <strong>Name:</strong> {user?.name || (user?.email ? user.email.split('@')[0] : 'Guest User')} &nbsp;|&nbsp;{' '}
              <strong>Email:</strong> {user?.email || 'Not provided'}
            </p>
            <button
              type="button"
              className="settings-action-btn"
              onClick={onOpenAuth}
            >
              Edit Profile
            </button>
          </div>
        </div>

        {/* Card 2: Language */}
        <div className="settings-card">
          <div className="card-title-row">
            <span>🌐</span>
            <h3>Language</h3>
          </div>
          <div className="language-select-row">
            <select
              value={language}
              onChange={(e) => setLanguage && setLanguage(e.target.value)}
              className="settings-select"
            >
              <option value="en">English</option>
              <option value="te">తెలుగు (Telugu)</option>
              <option value="hi">हिन्दी (Hindi)</option>
              <option value="ta">தமிழ் (Tamil)</option>
              <option value="bn">বাংলা (Bengali)</option>
            </select>
          </div>
        </div>

        {/* Card 3: Notifications */}
        <div className="settings-card">
          <div className="card-title-row">
            <span>🔔</span>
            <h3>Notifications</h3>
          </div>
          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.deadline}
                onChange={(e) =>
                  setNotifications({ ...notifications, deadline: e.target.checked })
                }
              />
              <span>Deadline reminders</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.missingDoc}
                onChange={(e) =>
                  setNotifications({ ...notifications, missingDoc: e.target.checked })
                }
              />
              <span>Missing document alerts</span>
            </label>
          </div>
        </div>

        {/* Card 4: Privacy */}
        <div className="settings-card">
          <div className="card-title-row">
            <span>🔒</span>
            <h3>Privacy</h3>
          </div>
          <p className="privacy-note-text">
            Your data stays on your device in this prototype.
          </p>
        </div>
      </div>
    </div>
  )
}
