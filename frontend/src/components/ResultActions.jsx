import { useState } from 'react'

function reportText(result) {
  const source = result.official_source
  return [
    'NAVI 360 — Notice summary',
    `Reference: ${result.request_id}`,
    '',
    `Notice: ${result.notice.title}`,
    result.notice.issuer ? `Issuer: ${result.notice.issuer}` : '',
    result.notice.deadline ? `Deadline: ${result.notice.deadline}` : '',
    '',
    'Plain-language explanation',
    result.plain_explanation,
    '',
    'What to verify',
    ...result.claims.map((claim) => `• [${claim.kind}] ${claim.text}`),
    '',
    'Checklist',
    ...result.missing_information.map((item) => `• ${item.name}: ${item.status} — ${item.detail}`),
    '',
    source ? `Official source: ${source.name} — ${source.url}` : '',
    source ? source.reason : '',
    '',
    result.disclaimer,
  ].filter(Boolean).join('\n')
}

export default function ResultActions({ result }) {
  const [copied, setCopied] = useState(false)

  function download() {
    const blob = new Blob([reportText(result)], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `navi360-summary-${result.request_id.slice(0, 8)}.txt`
    link.click()
    URL.revokeObjectURL(url)
  }

  async function copySummary() {
    try {
      await navigator.clipboard.writeText(reportText(result))
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section className="result-actions" aria-label="Save your summary">
      <div><p className="eyebrow">Keep a copy</p><strong>Your files stay private. Download contains only this summary.</strong></div>
      <div className="action-buttons">
        <button type="button" onClick={download}>Download summary</button>
        <button type="button" onClick={copySummary}>{copied ? 'Copied' : 'Copy summary'}</button>
      </div>
    </section>
  )
}
