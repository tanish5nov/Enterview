const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080'

export async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Request failed: ${res.status}`)
  }

  return data
}

export async function uploadFile(path, formData) {
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    body:   formData, // no Content-Type header — browser sets multipart boundary
  })

  const data = await res.json()

  if (!res.ok) {
    throw new Error(data.error || `Upload failed: ${res.status}`)
  }

  return data
}
