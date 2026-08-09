const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'

export async function analyzeDocument(files, textInput, language) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  body.append('text_input', textInput)
  body.append('language', language)

  const response = await fetch(`${API_URL}/analyze`, { method: 'POST', body })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.detail ?? 'We could not analyse that image. Please try another photo.')
  return payload
}
