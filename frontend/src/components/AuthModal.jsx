import { useEffect, useState } from 'react'

export default function AuthModal({ isOpen, onClose, user, onSaveUser }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [apiKey, setApiKey] = useState('')

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setEmail(user?.email || '')
      setApiKey(user?.apiKey || '')
    }
  }, [isOpen, user])

  if (!isOpen) return null

  function handleSubmit(event) {
    event.preventDefault()
    const trimmedEmail = email.trim()
    const derivedName = name.trim() || (trimmedEmail ? trimmedEmail.split('@')[0] : 'User')
    onSaveUser({
      name: derivedName,
      email: trimmedEmail,
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
      <div className="modal-card-split" onClick={(e) => e.stopPropagation()}>
        {/* Left Blue Brand Banner */}
        <div className="modal-brand-side">
          <div className="brand-header">
            <span className="brand-logo-text">NAVI 360</span>
          </div>
          <div className="brand-body">
            <h2>Understand Before You Act.</h2>
            <p>Turn confusing documents, messages and real-world situations into clear, safer next steps.</p>
            <ul className="brand-features">
              <li>✓ Understand what matters</li>
              <li>✓ Verify before acting</li>
              <li>✓ Know your next best action</li>
            </ul>
          </div>
        </div>

        {/* Right Form Side */}
        <div className="modal-form-side">
          <button className="close-button" onClick={onClose} aria-label="Close modal">×</button>
          
          <header className="form-header">
            <h2 id="auth-modal-title">{user ? 'Account Settings' : 'Welcome back'}</h2>
            <p>{user ? 'Manage your saved preferences and API credentials.' : 'Sign in to continue with NAVI 360.'}</p>
          </header>

          <form onSubmit={handleSubmit} className="auth-form-body">
            <label className="form-field">
              <span>Your Name</span>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>

            <label className="form-field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required={!name}
              />
            </label>

            <label className="form-field">
              <span>NVIDIA API Key (Optional)</span>
              <input
                type="password"
                placeholder="nvapi-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
              />
              <small>Custom API key for live document vision extraction.</small>
            </label>

            <div className="modal-actions-group">
              <button type="submit" className="split-primary-button">
                {user ? 'Save Settings' : 'Sign In'}
              </button>
              {user && (
                <button type="button" className="split-danger-button" onClick={handleSignOut}>
                  Sign Out
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
