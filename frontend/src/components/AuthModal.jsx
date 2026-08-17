import { useEffect, useState } from 'react'
import { loginUser, logoutUser, registerUser } from '../lib/api'

export default function AuthModal({ isOpen, onClose, user, onSaveUser }) {
  const [isSignUp, setIsSignUp] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState(null)

  useEffect(() => {
    if (isOpen) {
      setName(user?.name || '')
      setEmail(user?.email || '')
      setApiKey(user?.apiKey || '')
      setPassword('')
      setErrorMsg(null)
    }
  }, [isOpen, user])

  if (!isOpen) return null

  async function handleSubmit(event) {
    event.preventDefault()
    setErrorMsg(null)
    setLoading(true)

    try {
      if (user) {
        // Account Settings mode
        onClose()
      } else if (isSignUp) {
        const res = await registerUser({
          email: email.trim(),
          password,
          name: name.trim(),
        })
        onSaveUser(res.user)
        onClose()
      } else {
        const res = await loginUser({
          email: email.trim(),
          password,
        })
        onSaveUser(res.user)
        onClose()
      }
    } catch (err) {
      setErrorMsg(err.message || 'Authentication failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleSignOut() {
    setLoading(true)
    try {
      await logoutUser()
    } catch {
      // Ignore
    }
    onSaveUser(null)
    setName('')
    setEmail('')
    setPassword('')
    setApiKey('')
    setLoading(false)
    onClose()
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
      <div className="modal-card-split" onClick={(e) => e.stopPropagation()}>
        {/* Left Blue Brand Side */}
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
            <h2 id="auth-modal-title">
              {user ? 'Account Settings' : isSignUp ? 'Create an account' : 'Welcome back'}
            </h2>
            <p>
              {user
                ? 'Manage your saved credentials and profile.'
                : isSignUp
                ? 'Sign up to get started with NAVI 360.'
                : 'Sign in to continue with NAVI 360.'}
            </p>
          </header>

          {errorMsg && (
            <div className="request-error" role="alert" style={{ marginBottom: '1rem' }}>
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form-body">
            {(isSignUp || user) && (
              <label className="form-field">
                <span>Full Name</span>
                <input
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                />
              </label>
            )}

            <label className="form-field">
              <span>Email address</span>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            {!user && (
              <label className="form-field password-field-wrapper">
                <span>Password</span>
                <div className="password-input-box">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="eye-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? '🙈' : '👁️'}
                  </button>
                </div>
              </label>
            )}

            <div className="modal-actions-group">
              <button type="submit" className="split-primary-button" disabled={loading}>
                {loading ? 'Processing...' : user ? 'Close' : isSignUp ? 'Create Account' : 'Sign In'}
              </button>
              {user && (
                <button type="button" className="split-danger-button" onClick={handleSignOut} disabled={loading}>
                  Sign Out
                </button>
              )}
            </div>

            {/* Account toggle link at bottom */}
            {!user && (
              <div className="auth-footer-toggle">
                <span>{isSignUp ? 'Already have an account?' : "Don't have an account?"}</span>{' '}
                <button
                  type="button"
                  className="toggle-mode-link"
                  onClick={() => {
                    setIsSignUp(!isSignUp)
                    setErrorMsg(null)
                  }}
                >
                  {isSignUp ? 'Sign in' : 'Create account'}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  )
}
