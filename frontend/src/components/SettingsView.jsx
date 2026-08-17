import { useEffect, useState } from 'react'
import { updateProfile } from '../lib/api'

export default function SettingsView({ user, onUserUpdated, onOpenAuth, language, setLanguage }) {
  const [editingProfile, setEditingProfile] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [notifications, setNotifications] = useState({
    deadline: true,
    missingDoc: true,
  })
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)

  useEffect(() => {
    if (user) {
      setName(user.name || '')
      setEmail(user.email || '')
      setApiKey(user.apiKey || '')
      if (user.notifications) {
        setNotifications(user.notifications)
      }
    }
  }, [user])

  const handleSaveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage(null)

    try {
      const updatedUser = await updateProfile({
        name,
        email,
        apiKey,
        language,
        deadlineReminders: notifications.deadline,
        missingDocAlerts: notifications.missingDoc,
      })
      if (onUserUpdated) onUserUpdated(updatedUser)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setEditingProfile(false)
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Unable to update profile.' })
    } finally {
      setSaving(false)
    }
  }

  const handleNotificationChange = async (key, val) => {
    const nextNotifs = { ...notifications, [key]: val }
    setNotifications(nextNotifs)
    if (user) {
      try {
        const updatedUser = await updateProfile({
          deadlineReminders: nextNotifs.deadline,
          missingDocAlerts: nextNotifs.missingDoc,
        })
        if (onUserUpdated) onUserUpdated(updatedUser)
      } catch {
        // Ignore background toggle error
      }
    }
  }

  return (
    <div className="settings-view-container">
      {/* Title Header */}
      <div className="settings-header">
        <h2>⚙️ Settings & System Preferences</h2>
      </div>

      {message && (
        <div className={message.type === 'error' ? 'request-error' : 'progress-card'}>
          <span>{message.text}</span>
        </div>
      )}

      <div className="settings-cards-list">
        {/* Card 1: Profile */}
        <div className="settings-card">
          <div className="card-title-row">
            <span>👤</span>
            <h3>Profile</h3>
          </div>

          {!user ? (
            <div className="profile-details-row">
              <p>Sign in to save your cases, preferences, and custom AI key.</p>
              <button type="button" className="settings-action-btn" onClick={onOpenAuth}>
                Sign In / Register
              </button>
            </div>
          ) : editingProfile ? (
            <form onSubmit={handleSaveProfile} className="auth-form-body" style={{ marginTop: '1rem' }}>
              <label className="form-field">
                <span>Full Name</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Email Address</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Custom NVIDIA API Key (Optional)</span>
                <input
                  type="password"
                  placeholder="nvapi-..."
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                />
                <small>Allows custom high-capacity AI document vision parsing.</small>
              </label>

              <div className="modal-actions-group">
                <button type="submit" className="split-primary-button" disabled={saving}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  className="settings-action-btn"
                  onClick={() => setEditingProfile(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            <div className="profile-details-row">
              <p>
                <strong>Name:</strong> {user.name} &nbsp;|&nbsp; <strong>Email:</strong> {user.email}
              </p>
              <button
                type="button"
                className="settings-action-btn"
                onClick={() => setEditingProfile(true)}
              >
                Edit Profile
              </button>
            </div>
          )}
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
              onChange={(e) => {
                const newLang = e.target.value
                if (setLanguage) setLanguage(newLang)
                if (user) {
                  updateProfile({ language: newLang }).then((up) => onUserUpdated && onUserUpdated(up))
                }
              }}
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
                onChange={(e) => handleNotificationChange('deadline', e.target.checked)}
              />
              <span>Deadline reminders</span>
            </label>
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={notifications.missingDoc}
                onChange={(e) => handleNotificationChange('missingDoc', e.target.checked)}
              />
              <span>Missing document alerts</span>
            </label>
          </div>
        </div>

        {/* Card 4: Privacy */}
        <div className="settings-card">
          <div className="card-title-row">
            <span>🔒</span>
            <h3>Privacy & Security</h3>
          </div>
          <p className="privacy-note-text">
            Your uploaded documents are securely processed by the NAVI 360 backend for AI notice analysis and stored in your account vault. API keys and personal credentials are never exposed in public code.
          </p>
        </div>
      </div>
    </div>
  )
}
