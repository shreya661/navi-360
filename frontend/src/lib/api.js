const rawUrl = import.meta.env.VITE_API_URL
const API_URL = (rawUrl && rawUrl !== '') ? rawUrl.replace(/\/+$/, '') : 'http://localhost:8000'

export async function analyzeDocument(files, textInput, language, customApiKey = null) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  body.append('text_input', textInput)
  body.append('language', language)

  const headers = {}
  if (customApiKey) {
    headers['X-NVIDIA-API-KEY'] = customApiKey
  }

  try {
    const response = await fetch(`${API_URL}/analyze`, { method: 'POST', body, headers })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.detail ?? 'We could not analyze that notice. Please try again.')
    return payload
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Unable to connect to the NAVI 360 backend service. Please check your network or server status.')
    }
    throw error
  }
}

export async function searchResources(query) {
  try {
    const url = `${API_URL}/search?q=${encodeURIComponent(query)}`
    const response = await fetch(url, { method: 'GET' })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload.detail ?? 'Search failed. Please try again.')
    return payload
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Unable to connect to the NAVI 360 backend. Please check your network.')
    }
    throw error
  }
}
