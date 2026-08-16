import { useState } from 'react'

export default function AuthModal({ isOpen, onClose, user, onSaveUser }) {
  const [name, setName] = useState(user?.name || '')
  const [email, setEmail] = useState(user?.email || '')
  const [apiKey, setApiKey] = useState(user?.apiKey || '')

  if (!isOpen) return null

  function handleSubmit(event) {
    event.preventDefault()
    onSaveUser({
      name: name.trim() || 'Citizen User',
      email: email.trim(),
      apiKey: apiKey.trim(),
    })
    onClose()
  }

  function handleSignOut() {
    onSaveUser(null)
    setName('')
    setEmail('')
    setApiKey('')
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <header className="modal-header">
          <h2 id="auth-modal-title">{user ? 'Account Settings' : 'Sign In to NAVI 360'}</h2>
          <button className="close-button" onClick={onClose} aria-label="Close modal">×</button>
        </header>

        <form onSubmit={handleSubmit} className="auth-form">
          <p className="modal-description">
            Sign in to save your notice analysis history and configure custom AI service credentials.
          </p>

          <label className="form-field">
            <span>Your Name</span>
            <input
              type="text"
              placeholder="e.g. Ramesh Kumar"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>Email Address (Optional)</span>
            <input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>

          <label className="form-field">
            <span>NVIDIA API Key (Optional for Live Vision AI)</span>
            <input
              type="password"
              placeholder="nvapi-..."
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
            <small>If set, this key is used for document extraction.</small>
          </label>

          <div className="modal-actions">
            {user && (
              <button type="button" className="secondary-button danger" onClick={handleSignOut}>
                Sign Out
              </button>
            )}
            <button type="submit" className="primary-button inline-button">
              {user ? 'Save Changes' : 'Sign In'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
