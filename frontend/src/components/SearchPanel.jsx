import { useRef, useState } from 'react'
import { searchResources } from '../lib/api'

export default function SearchPanel() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const inputRef = useRef(null)

  async function handleSearch(event) {
    event.preventDefault()
    if (!query.trim()) return
    setLoading(true)
    setError('')
    setResults(null)
    try {
      const data = await searchResources(query.trim())
      setResults(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="search-panel" aria-labelledby="search-title">
      <div className="search-heading">
        <div className="section-number">Q</div>
        <div>
          <p className="eyebrow">Ask NAVI</p>
          <h2 id="search-title">Search official resources</h2>
        </div>
      </div>

      <form onSubmit={handleSearch} className="search-form" role="search">
        <div className="search-input-row">
          <input
            ref={inputRef}
            type="search"
            id="citizen-search"
            className="search-input"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="e.g. Telangana ePASS scholarship 2026, PM-KISAN e-KYC, Aadhaar update…"
            disabled={loading}
            aria-label="Search for official government resources"
            maxLength={300}
          />
          <button type="submit" className="search-button" disabled={loading || !query.trim()}>
            {loading ? '⏳' : '🔍'} {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
        <small className="search-note">Results come only from official government portals (.gov.in, .nic.in)</small>
      </form>

      {error && (
        <div className="search-error" role="alert">
          <strong>Search failed.</strong> {error}
        </div>
      )}

      {results && (
        <div className="search-results" aria-live="polite">
          {/* Curated official source — always show first if present */}
          {results.curated_source && (
            <div className="curated-result">
              <span className="curated-badge">⭐ Official Portal</span>
              <a
                href={results.curated_source.url}
                target="_blank"
                rel="noreferrer"
                className="result-link"
              >
                {results.curated_source.name}
                <span aria-hidden="true"> ↗</span>
              </a>
              <p className="result-reason">{results.curated_source.reason}</p>
              <small className="curated-note">Curated link — never AI-generated.</small>
            </div>
          )}

          {/* Live web results */}
          {results.results.length > 0 ? (
            <>
              <p className="results-count">{results.results.length} official result{results.results.length !== 1 ? 's' : ''} found</p>
              <ul className="result-list">
                {results.results.map((item, i) => (
                  <li key={i} className="result-item">
                    <a href={item.url} target="_blank" rel="noreferrer" className="result-link">
                      {item.title || item.url}
                      <span aria-hidden="true"> ↗</span>
                    </a>
                    {item.snippet && <p className="result-snippet">{item.snippet}</p>}
                    <small className="result-source">{item.source}</small>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            !results.curated_source && (
              <p className="no-results">No official web results found. Try rephrasing your query or use the curated portal above.</p>
            )
          )}

          <p className="search-disclaimer">{results.disclaimer}</p>
        </div>
      )}
    </section>
  )
}
