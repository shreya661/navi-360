const rawUrl = import.meta.env.VITE_API_URL

function getBaseUrl() {
  if (rawUrl && rawUrl.trim() !== '') {
    return rawUrl.replace(/\/+$/, '')
  }
  if (typeof window !== 'undefined' && window.location) {
    // If running in production (served from FastAPI on port 8000/443/80), use relative URL ""
    if (window.location.port !== '5173') {
      return ''
    }
  }
  return 'http://localhost:8000'
}

const API_URL = getBaseUrl()

export function getAuthToken() {
  try {
    return localStorage.getItem('navi360_token') || null
  } catch {
    return null
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem('navi360_token', token)
    } else {
      localStorage.removeItem('navi360_token')
    }
  } catch {
    // Ignore storage errors
  }
}

function getHeaders(customApiKey = null, isJson = true) {
  const headers = {}
  if (isJson) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getAuthToken()
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  if (customApiKey) {
    headers['X-NVIDIA-API-KEY'] = customApiKey
  }
  return headers
}

async function request(path, options = {}) {
  const url = `${API_URL}${path}`
  try {
    const response = await fetch(url, options)
    let payload = {}
    try {
      payload = await response.json()
    } catch {
      payload = {}
    }
    if (!response.ok) {
      const msg = payload.detail || payload.message || 'Request failed. Please try again.'
      throw new Error(msg)
    }
    return payload
  } catch (error) {
    if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
      throw new Error('Unable to connect to the NAVI 360 backend service. Please check your network connection.')
    }
    throw error
  }
}

// Health & Readiness
export async function checkReadiness() {
  return request('/api/ready', { method: 'GET' })
}

// Analysis API
export async function analyzeDocument(files, textInput, language, customApiKey = null) {
  const body = new FormData()
  files.forEach((file) => body.append('files', file))
  body.append('text_input', textInput)
  body.append('language', language)

  const headers = getHeaders(customApiKey, false)
  return request('/api/analyze', { method: 'POST', body, headers })
}

// Search API
export async function searchResources(query) {
  return request(`/api/search?q=${encodeURIComponent(query)}`, { method: 'GET' })
}

// Authentication API
export async function registerUser({ email, password, name }) {
  const data = await request('/api/auth/register', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password, name }),
  })
  if (data.token) setAuthToken(data.token)
  return data
}

export async function loginUser({ email, password }) {
  const data = await request('/api/auth/login', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ email, password }),
  })
  if (data.token) setAuthToken(data.token)
  return data
}

export async function logoutUser() {
  try {
    await request('/api/auth/logout', { method: 'POST', headers: getHeaders() })
  } catch {
    // Ignore logout failure
  }
  setAuthToken(null)
}

export async function fetchMe() {
  return request('/api/auth/me', { method: 'GET', headers: getHeaders() })
}

export async function updateProfile(data) {
  return request('/api/auth/me', {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
}

// Cases API
export async function fetchCases(query = '') {
  const qStr = query ? `?q=${encodeURIComponent(query)}` : ''
  return request(`/api/cases${qStr}`, { method: 'GET', headers: getHeaders() })
}

export async function createCase(caseData) {
  return request('/api/cases', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(caseData),
  })
}

export async function fetchCaseDetail(id) {
  return request(`/api/cases/${id}`, { method: 'GET', headers: getHeaders() })
}

export async function deleteCase(id) {
  return request(`/api/cases/${id}`, { method: 'DELETE', headers: getHeaders() })
}

// Evidence API
export async function fetchEvidence(category = 'all') {
  const catStr = category && category !== 'all' ? `?category=${encodeURIComponent(category)}` : ''
  return request(`/api/evidence${catStr}`, { method: 'GET', headers: getHeaders() })
}

export async function uploadEvidence({ file, text_content, title, category, case_id }) {
  const body = new FormData()
  if (file) body.append('file', file)
  if (text_content) body.append('text_content', text_content)
  if (title) body.append('title', title)
  if (category) body.append('category', category)
  if (case_id) body.append('case_id', case_id)

  const headers = getHeaders(null, false)
  return request('/api/evidence', { method: 'POST', body, headers })
}

export async function deleteEvidence(id) {
  return request(`/api/evidence/${id}`, { method: 'DELETE', headers: getHeaders() })
}

// Reminders API
export async function fetchReminders() {
  return request('/api/reminders', { method: 'GET', headers: getHeaders() })
}

export async function createReminder(reminderData) {
  return request('/api/reminders', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(reminderData),
  })
}

export async function updateReminder(id, updateData) {
  return request(`/api/reminders/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(updateData),
  })
}

export async function deleteReminder(id) {
  return request(`/api/reminders/${id}`, { method: 'DELETE', headers: getHeaders() })
}
