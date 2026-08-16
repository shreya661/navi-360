export default function HistoryDrawer({ isOpen, onClose, history, onSelectAnalysis, onClearHistory }) {
  if (!isOpen) return null

  return (
    <div className="drawer-backdrop" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="history-drawer-title">
      <div className="drawer-content" onClick={(e) => e.stopPropagation()}>
        <header className="drawer-header">
          <div>
            <p className="eyebrow">Saved Analyses</p>
            <h2 id="history-drawer-title">Notice History</h2>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close drawer">×</button>
        </header>

        {history.length === 0 ? (
          <div className="empty-history">
            <p>No saved analyses yet.</p>
            <small>Analyzed government notices will appear here for easy reference.</small>
          </div>
        ) : (
          <>
            <ul className="history-list">
              {history.map((item) => (
                <li key={item.request_id} className="history-item" onClick={() => { onSelectAnalysis(item); onClose(); }}>
                  <div className="history-item-header">
                    <strong>{item.notice?.title || 'Notice Analysis'}</strong>
                    <span className="history-date">
                      {item.timestamp ? new Date(item.timestamp).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <p className="history-snippet">{item.summary || item.plain_explanation}</p>
                  <div className="history-badges">
                    <span className="history-badge">{item.language?.toUpperCase() || 'TE'}</span>
                    {item.notice?.deadline && <span className="history-badge deadline">Deadline: {item.notice.deadline}</span>}
                  </div>
                </li>
              ))}
            </ul>
            <footer className="drawer-footer">
              <button type="button" className="secondary-button danger full-width" onClick={onClearHistory}>
                Clear History
              </button>
            </footer>
          </>
        )}
      </div>
    </div>
  )
}
