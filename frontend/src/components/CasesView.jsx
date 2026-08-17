import { useEffect, useState } from 'react'
import { createCase, deleteCase, fetchCaseDetail, fetchCases } from '../lib/api'

export default function CasesView({ onOpenAuth, user }) {
  const [cases, setCases] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedCase, setSelectedCase] = useState(null)
  const [detailLoading, setDetailLoading] = useState(false)

  // New Case Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newCategory, setNewCategory] = useState('Utility Notice')
  const [newStatus, setNewStatus] = useState('Action Required')
  const [newPriority, setNewPriority] = useState('Critical')
  const [newSummary, setNewSummary] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const loadCases = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchCases(searchQuery)
      setCases(res.cases || [])
    } catch (err) {
      setError(err.message || 'Failed to load cases.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCases()
  }, [searchQuery])

  const handleOpenDetail = async (caseId) => {
    setDetailLoading(true)
    try {
      const data = await fetchCaseDetail(caseId)
      setSelectedCase(data)
    } catch (err) {
      alert(err.message || 'Failed to load case details.')
    } finally {
      setDetailLoading(false)
    }
  }

  const handleDelete = async (caseId, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Are you sure you want to delete this case?')) return
    try {
      await deleteCase(caseId)
      setCases((prev) => prev.filter((c) => c.id !== caseId))
      if (selectedCase && selectedCase.id === caseId) setSelectedCase(null)
    } catch (err) {
      alert(err.message || 'Failed to delete case.')
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!newTitle.trim()) return
    setSubmitting(true)
    try {
      await createCase({
        title: newTitle.trim(),
        category: newCategory,
        status: newStatus,
        priority: newPriority,
        summary: newSummary.trim(),
      })
      setNewTitle('')
      setNewSummary('')
      setIsCreateOpen(false)
      loadCases()
    } catch (err) {
      alert(err.message || 'Failed to create case.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="cases-view-container">
      {/* Header */}
      <div className="cases-header-row">
        <div>
          <h2>📁 My Cases ({cases.length})</h2>
          <p>Organize, track, and manage your notice responses and document evidence.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (!user) {
              onOpenAuth()
            } else {
              setIsCreateOpen(true)
            }
          }}
        >
          + New Case
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="cases-filter-bar">
        <input
          type="text"
          placeholder="Search cases by title, summary or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="cases-search-input"
        />
      </div>

      {/* Main List Area */}
      {loading ? (
        <div className="placeholder-view">
          <p>⏳ Loading your cases...</p>
        </div>
      ) : error ? (
        <div className="request-error" role="alert">
          <strong>Could not load cases</strong>
          <span>{error}</span>
          <button type="button" onClick={loadCases}>
            Retry
          </button>
        </div>
      ) : cases.length === 0 ? (
        <div className="placeholder-view">
          <h3>No cases found</h3>
          <p>You don't have any cases yet. Analyze a document or click "+ New Case" to get started.</p>
        </div>
      ) : (
        <div className="cases-grid">
          {cases.map((c) => (
            <div key={c.id} className="case-card" onClick={() => handleOpenDetail(c.id)}>
              <div className="case-card-top">
                <span className={`priority-badge priority-${c.priority.toLowerCase()}`}>
                  {c.priority}
                </span>
                <span className="case-date">{new Date(c.created_at).toLocaleDateString()}</span>
              </div>

              <h3 className="case-card-title">{c.title}</h3>
              <p className="case-card-summary">{c.summary || 'No summary provided.'}</p>

              <div className="case-card-footer">
                <div className="case-meta-info">
                  <span>🏷️ {c.category}</span>
                  <span>📄 {c.evidence_count} evidence</span>
                  <span>⏰ {c.reminders_count} reminders</span>
                </div>
                <div className="case-actions">
                  <span className="case-status-label">{c.status}</span>
                  <button
                    type="button"
                    className="icon-delete-btn"
                    onClick={(e) => handleDelete(c.id, e)}
                    aria-label="Delete Case"
                    title="Delete Case"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <div className="modal-backdrop" onClick={() => setSelectedCase(null)}>
          <div className="modal-card-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedCase.title}</h3>
              <button type="button" className="close-button" onClick={() => setSelectedCase(null)}>
                ×
              </button>
            </div>
            <div className="modal-body-content">
              <div className="case-detail-pills">
                <span className="priority-badge">{selectedCase.priority}</span>
                <span className="case-status-label">{selectedCase.status}</span>
                <span>Category: {selectedCase.category}</span>
                <span>Date: {new Date(selectedCase.created_at).toLocaleString()}</span>
              </div>

              <h4>Summary</h4>
              <p>{selectedCase.summary || 'No detailed summary recorded.'}</p>

              <h4>Associated Evidence ({selectedCase.evidence ? selectedCase.evidence.length : 0})</h4>
              {selectedCase.evidence && selectedCase.evidence.length > 0 ? (
                <ul className="evidence-list-simple">
                  {selectedCase.evidence.map((ev) => (
                    <li key={ev.id}>
                      <strong>{ev.file_name}</strong> ({ev.source}) —{' '}
                      <small>{new Date(ev.created_at).toLocaleDateString()}</small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtle-text">No evidence linked yet.</p>
              )}

              <h4>Associated Reminders ({selectedCase.reminders ? selectedCase.reminders.length : 0})</h4>
              {selectedCase.reminders && selectedCase.reminders.length > 0 ? (
                <ul className="evidence-list-simple">
                  {selectedCase.reminders.map((rem) => (
                    <li key={rem.id}>
                      <strong>{rem.title}</strong> — Due {rem.due_date} ({rem.status})
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="subtle-text">No active reminders linked.</p>
              )}
            </div>
            <div className="modal-footer-actions">
              <button
                type="button"
                className="split-danger-button"
                onClick={() => handleDelete(selectedCase.id)}
              >
                Delete Case
              </button>
              <button
                type="button"
                className="split-primary-button"
                onClick={() => setSelectedCase(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Case Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Case</h3>
              <button type="button" className="close-button" onClick={() => setIsCreateOpen(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateSubmit} className="auth-form-body">
              <label className="form-field">
                <span>Case Title *</span>
                <input
                  type="text"
                  placeholder="e.g. Post-Matric Scholarship Notice"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Category</span>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="settings-select"
                >
                  <option value="Scholarship Notice">Scholarship Notice</option>
                  <option value="Tax Notice">Tax Notice</option>
                  <option value="Utility Notice">Utility Notice</option>
                  <option value="Farmer Support">Farmer Support</option>
                  <option value="Labour Notice">Labour Notice</option>
                  <option value="General Notice">General Notice</option>
                </select>
              </label>

              <label className="form-field">
                <span>Priority</span>
                <select
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                  className="settings-select"
                >
                  <option value="Critical">Critical</option>
                  <option value="Warning">Warning</option>
                  <option value="Normal">Normal</option>
                </select>
              </label>

              <label className="form-field">
                <span>Summary / Notes</span>
                <textarea
                  rows={3}
                  placeholder="Brief explanation of the notice or action needed..."
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                />
              </label>

              <div className="modal-actions-group">
                <button type="submit" className="split-primary-button" disabled={submitting}>
                  {submitting ? 'Creating...' : 'Save Case'}
                </button>
                <button
                  type="button"
                  className="settings-action-btn"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
