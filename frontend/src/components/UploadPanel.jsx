import { useRef, useState } from 'react'

const ACCEPTED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'text/plain', 'text/markdown']
const MAX_FILES = 6
const MAX_SIZE = 8 * 1024 * 1024

export default function UploadPanel({ onAnalyze, loading }) {
  const inputRef = useRef(null)
  const [files, setFiles] = useState([])
  const [textInput, setTextInput] = useState('')
  const [error, setError] = useState('')
  const [dragging, setDragging] = useState(false)

  function choose(selected) {
    const incoming = Array.from(selected ?? [])
    if (!incoming.length) return
    const invalid = incoming.find((file) => !ACCEPTED.includes(file.type) || file.size > MAX_SIZE)
    if (invalid) {
      setError(!ACCEPTED.includes(invalid.type) ? `${invalid.name}: use an image, PDF, TXT, or Markdown file.` : `${invalid.name}: keep every file under 8 MB.`)
      return
    }
    const combined = [...files, ...incoming].filter((file, index, list) => list.findIndex((item) => item.name === file.name && item.size === file.size && item.lastModified === file.lastModified) === index)
    if (combined.length > MAX_FILES) {
      setError(`Add up to ${MAX_FILES} evidence files at once.`)
      return
    }
    setError('')
    setFiles(combined)
  }

  function removeFile(index) {
    setFiles((current) => current.filter((_, itemIndex) => itemIndex !== index))
  }

  function submit() {
    if (!files.length && !textInput.trim()) {
      setError('Please upload at least one file or paste the notice text before continuing.')
      return
    }
    setError('')
    onAnalyze(files, textInput)
  }


  return (
    <section className="upload-card" aria-labelledby="upload-title">
      <div className="upload-heading">
        <div className="section-number">01</div>
        <div>
          <p className="eyebrow">Start here</p>
          <h2 id="upload-title">Add your evidence</h2>
        </div>
      </div>
      <div
        className={`dropzone ${dragging ? 'dragging' : ''} ${files.length ? 'has-file' : ''}`}
        onDragOver={(event) => { event.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => { event.preventDefault(); setDragging(false); choose(event.dataTransfer.files) }}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,text/markdown,.md"
          capture="environment"
          multiple
          onChange={(event) => choose(event.target.files)}
          aria-label="Choose a notice image"
        />
        <div className="upload-icon" aria-hidden="true">⌁</div>
        {files.length ? (
          <div className="file-selected">
            <strong>{files.length} {files.length === 1 ? 'file' : 'files'} ready to read</strong>
            <span>Photos, PDFs, messages, and receipts can be checked together.</span>
            <ul className="selected-files" aria-label="Selected evidence files">
              {files.map((file, index) => <li key={`${file.name}-${file.lastModified}`}><span>{file.name}</span><button type="button" onClick={() => removeFile(index)} disabled={loading} aria-label={`Remove ${file.name}`}>×</button></li>)}
            </ul>
          </div>
        ) : (
          <>
            <strong>Drop up to 6 files here</strong>
            <span>Photos, PDFs, receipts, messages, or notice screenshots</span>
          </>
        )}
        <button type="button" className="text-button" onClick={() => inputRef.current?.click()} disabled={loading}>
          {files.length ? 'Add another file' : 'Choose files'}
        </button>
      </div>
      <label className="text-evidence" htmlFor="evidence-text">
        <span>Or paste a message, email, or notice text</span>
        <textarea id="evidence-text" value={textInput} maxLength={20000} onChange={(event) => setTextInput(event.target.value)} placeholder="Paste the text here…" disabled={loading} />
        <small>{textInput.length.toLocaleString()} / 20,000 characters</small>
      </label>

      {error && <p className="form-error" role="alert">{error}</p>}
      <button className="primary-button" disabled={loading} onClick={submit}>
        {loading ? 'Reading your evidence…' : 'Understand this situation'}
        <span aria-hidden="true">→</span>
      </button>
      <p className="privacy-note"><span aria-hidden="true">◌</span> Your evidence is used only to analyse this situation.</p>
    </section>
  )
}
