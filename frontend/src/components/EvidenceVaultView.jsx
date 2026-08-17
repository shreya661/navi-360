import { useEffect, useState } from 'react'
import { deleteEvidence, downloadEvidenceFile, fetchEvidence, uploadEvidence } from '../lib/api'

export default function EvidenceVaultView({ user, onOpenAuth }) {
  const [evidenceList, setEvidenceList] = useState([])
  const [category, setCategory] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloadingId, setDownloadingId] = useState(null)

  // Upload Modal State
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [textContent, setTextContent] = useState('')
  const [uploadCategory, setUploadCategory] = useState('Documents')
  const [uploading, setUploading] = useState(false)

  const categories = ['all', 'Documents', 'Screenshots', 'Receipts', 'Official Sources', 'Analysis Results']

  const handleDownload = async (item, e) => {
    if (e) e.stopPropagation()
    setDownloadingId(item.id)
    try {
      await downloadEvidenceFile(item.id, item.file_name)
    } catch (err) {
      alert(err.message || 'Failed to download evidence file.')
    } finally {
      setDownloadingId(null)
    }
  }

  const loadEvidence = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetchEvidence(category)
      setEvidenceList(res.evidence || [])
    } catch (err) {
      setError(err.message || 'Failed to load evidence items.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvidence()
  }, [category])

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    if (!window.confirm('Delete this evidence item from your vault?')) return
    try {
      await deleteEvidence(id)
      setEvidenceList((prev) => prev.filter((item) => item.id !== id))
    } catch (err) {
      alert(err.message || 'Failed to delete evidence.')
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    if (!file && !textContent.trim()) {
      alert('Please select a file or enter text content.')
      return
    }
    setUploading(true)
    try {
      await uploadEvidence({
        file,
        text_content: textContent,
        title,
        category: uploadCategory,
      })
      setFile(null)
      setTitle('')
      setTextContent('')
      setIsUploadOpen(false)
      loadEvidence()
    } catch (err) {
      alert(err.message || 'Failed to upload evidence.')
    } finally {
      setUploading(false)
    }
  }

  const getIconForType = (source, type) => {
    if (source === 'Screenshots') return '📸'
    if (source === 'Receipts') return '🧾'
    if (source === 'Official Sources') return '🏛️'
    if (source === 'Analysis Results') return '📊'
    if (type && type.includes('pdf')) return '📕'
    if (type && type.includes('image')) return '🖼️'
    return '📄'
  }

  return (
    <div className="cases-view-container">
      {/* Header */}
      <div className="cases-header-row">
        <div>
          <h2>📑 Evidence Vault ({evidenceList.length})</h2>
          <p>Securely store, organize, and inspect document evidence, screenshots, and receipts.</p>
        </div>
        <button
          type="button"
          className="primary-button"
          onClick={() => {
            if (!user) {
              onOpenAuth()
            } else {
              setIsUploadOpen(true)
            }
          }}
        >
          + Upload Evidence
        </button>
      </div>

      {/* Category Tabs */}
      <div className="category-tabs">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`tab-button ${category === cat ? 'active' : ''}`}
            onClick={() => setCategory(cat)}
          >
            {cat === 'all' ? 'All Items' : cat}
          </button>
        ))}
      </div>

      {/* Main List */}
      {loading ? (
        <div className="placeholder-view">
          <p>⏳ Loading your evidence vault...</p>
        </div>
      ) : error ? (
        <div className="request-error" role="alert">
          <strong>Could not load vault items</strong>
          <span>{error}</span>
          <button type="button" onClick={loadEvidence}>
            Retry
          </button>
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="placeholder-view">
          <h3>Your evidence vault is empty</h3>
          <p>
            {category === 'all'
              ? 'No documents, screenshots or receipts stored yet. Upload evidence to keep records safe.'
              : `No evidence items found in "${category}".`}
          </p>
        </div>
      ) : (
        <div className="cases-grid">
          {evidenceList.map((item) => (
            <div key={item.id} className="case-card">
              <div className="case-card-top">
                <span className="file-icon-large">{getIconForType(item.source, item.file_type)}</span>
                <span className="case-date">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>

              <h3 className="case-card-title">{item.file_name}</h3>
              {item.extracted_text && (
                <p className="case-card-summary">
                  "{item.extracted_text.slice(0, 140)}
                  {item.extracted_text.length > 140 ? '...' : ''}"
                </p>
              )}

              <div className="case-card-footer">
                <div className="case-meta-info">
                  <span>Category: {item.source}</span>
                  {item.file_path && <span>Stored Securely</span>}
                </div>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  {item.file_path && (
                    <button
                      type="button"
                      className="icon-delete-btn"
                      onClick={(e) => handleDownload(item, e)}
                      aria-label="Download Evidence File"
                      title="Download Evidence File"
                      disabled={downloadingId === item.id}
                    >
                      {downloadingId === item.id ? '⏳' : '📥'}
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-delete-btn"
                    onClick={(e) => handleDelete(item.id, e)}
                    aria-label="Delete Evidence"
                    title="Delete Evidence"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      {isUploadOpen && (
        <div className="modal-backdrop" onClick={() => setIsUploadOpen(false)}>
          <div className="modal-card-simple" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Upload Evidence Item</h3>
              <button type="button" className="close-button" onClick={() => setIsUploadOpen(false)}>
                ×
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="auth-form-body">
              <label className="form-field">
                <span>Document Title / Reference</span>
                <input
                  type="text"
                  placeholder="e.g. Fee Receipt Copy 2026"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </label>

              <label className="form-field">
                <span>Vault Category</span>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value)}
                  className="settings-select"
                >
                  <option value="Documents">Documents</option>
                  <option value="Screenshots">Screenshots</option>
                  <option value="Receipts">Receipts</option>
                  <option value="Official Sources">Official Sources</option>
                </select>
              </label>

              <label className="form-field">
                <span>Select File (PDF, Image, PNG, JPG)</span>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={(e) => setFile(e.target.files[0] || null)}
                />
              </label>

              <label className="form-field">
                <span>Or Paste Text Snippet / Notice Note</span>
                <textarea
                  rows={3}
                  placeholder="Paste reference text or serial numbers..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              </label>

              <div className="modal-actions-group">
                <button type="submit" className="split-primary-button" disabled={uploading}>
                  {uploading ? 'Uploading...' : 'Save to Vault'}
                </button>
                <button
                  type="button"
                  className="settings-action-btn"
                  onClick={() => setIsUploadOpen(false)}
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
