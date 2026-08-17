import { useEffect, useState } from 'react'
import { createReminder, deleteReminder, fetchReminders, updateReminder } from '../lib/api'

export default function RemindersView({ user, onOpenAuth }) {
  const [reminders, setReminders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Create Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('Action Required')
  const [submitting, setSubmitting] = useState(false)

  const loadReminders = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchReminders()
      setReminders(res.reminders || [])
    } catch (err) {
      setError(err.message || 'Failed to load reminders.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReminders()
  }, [])

  const handleToggleComplete = async (rem) => {
    const newStatus = rem.status === 'Completed' ? 'Active' : 'Completed'
    try {
      await updateReminder(rem.id, { status: newStatus })
      setReminders((prev) =>
        prev.map((r) => (r.id === rem.id ? { ...r, status: newStatus } : r))
      )
    } catch (err) {
      alert(err.message || 'Failed to update reminder status.')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reminder?')) return
    try {
      await deleteReminder(id)
      setReminders((prev) => prev.filter((r) => r.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete reminder.')
    }
  }

  const handleCreateSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim() || !dueDate) return
    setSubmitting(true)
    try {
      await createReminder({
        title: title.trim(),
        description: description.trim(),
        due_date: dueDate,
        priority,
      })
      setTitle('')
      setDescription('')
      setDueDate('')
      setIsCreateOpen(false)
      loadReminders()
    } catch (err) {
      alert(err.message || 'Failed to create reminder.')
    } finally {
      setSubmitting(false)
    }
  }

  const todayStr = new Date().toISOString().split('T')[0]

  const activeReminders = reminders.filter((r) => r.status !== 'Completed')
  const completedReminders = reminders.filter((r) => r.status === 'Completed')

  return (
    <div className="cases-view-container">
      {/* Header */}
      <div className="cases-header-row">
        <div>
          <h2>⏰ Active Reminders ({activeReminders.length})</h2>
          <p>Deadline trackers for post-matric scholarships, tax notices, and bill due dates.</p>
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
          + Add Reminder
        </button>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="placeholder-view">
          <p>⏳ Loading reminders...</p>
        </div>
      ) : error ? (
        <div className="request-error" role="alert">
          <strong>Could not load reminders</strong>
          <span>{error}</span>
          <button type="button" onClick={loadReminders}>
            Retry
          </button>
        </div>
      ) : reminders.length === 0 ? (
        <div className="placeholder-view">
          <h3>No active reminders</h3>
          <p>Stay ahead of deadlines by adding reminders for important notices and payments.</p>
        </div>
      ) : (
        <div className="reminders-list-section">
          {activeReminders.length > 0 && (
            <div className="reminders-group">
              <h3>Upcoming & Active</h3>
              <div className="cases-grid">
                {activeReminders.map((rem) => {
                  const isOverdue = rem.due_date < todayStr
                  return (
                    <div
                      key={rem.id}
                      className={`case-card ${isOverdue ? 'reminder-card-overdue' : ''}`}
                    >
                      <div className="case-card-top">
                        <span
                          className={`priority-badge ${
                            isOverdue ? 'priority-critical' : 'priority-warning'
                          }`}
                        >
                          {isOverdue ? 'OVERDUE' : rem.priority}
                        </span>
                        <span className="case-date">Due: {rem.due_date}</span>
                      </div>

                      <h3 className="case-card-title">{rem.title}</h3>
                      {rem.description && <p className="case-card-summary">{rem.description}</p>}

                      <div className="case-card-footer">
                        <label className="remember-me-label" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={rem.status === 'Completed'}
                            onChange={() => handleToggleComplete(rem)}
                          />
                          <span>Mark Done</span>
                        </label>

                        <button
                          type="button"
                          className="icon-delete-btn"
                          onClick={() => handleDelete(rem.id)}
                          aria-label="Delete Reminder"
                          title="Delete Reminder"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {completedReminders.length > 0 && (
            <div className="reminders-group" style={{ marginTop: '2rem' }}>
              <h3>Completed ({completedReminders.length})</h3>
              <div className="cases-grid">
                {completedReminders.map((rem) => (
                  <div key={rem.id} className="case-card completed-reminder-card">
                    <div className="case-card-top">
                      <span className="priority-badge">COMPLETED</span>
                      <span className="case-date">Due: {rem.due_date}</span>
                    </div>

                    <h3 className="case-card-title">{rem.title}</h3>

                    <div className="case-card-footer">
                      <label className="remember-me-label" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={true}
                          onChange={() => handleToggleComplete(rem)}
                        />
                        <span>Completed</span>
                      </label>

                      <button
                        type="button"
                        className="icon-delete-btn"
                        onClick={() => handleDelete(rem.id)}
                        aria-label="Delete Reminder"
                        title="Delete Reminder"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add Reminder Modal */}
      {isCreateOpen && (
        <div className="modal-backdrop" onClick={() => setIsCreateOpen(false)}>
          <div className="modal-card-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Deadline Reminder</h3>
              <button type="button" className="close-button" onClick={() => setIsCreateOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="auth-form-body">
              <label className="form-field">
                <span>Reminder Title *</span>
                <input
                  type="text"
                  placeholder="e.g. Scholarship Income Certificate Submission"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Due Date *</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  required
                />
              </label>

              <label className="form-field">
                <span>Priority</span>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="settings-select"
                >
                  <option value="Action Required">Action Required</option>
                  <option value="Critical">Critical</option>
                  <option value="Pending">Pending</option>
                  <option value="Upcoming">Upcoming</option>
                </select>
              </label>

              <label className="form-field">
                <span>Description / Details</span>
                <textarea
                  rows={3}
                  placeholder="Details about portal URLs, documents needed..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </label>

              <div className="modal-actions-group">
                <button type="submit" className="split-primary-button" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Set Reminder'}
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
