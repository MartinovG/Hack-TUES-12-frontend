export const apiHost = import.meta.env.VITE_API_URL || 'http://localhost:3000'
export const authTokenStorageKey = 'vm-sharing-access-token'

async function request(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {}

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${apiHost}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
    signal,
  })

  const responseText = await response.text()
  const payload = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message || 'Request failed'

    throw new Error(message)
  }

  return payload
}

export const authApi = {
  login(credentials, options = {}) {
    return request('/auth/login', {
      method: 'POST',
      body: credentials,
      signal: options.signal,
    })
  },
  register(userData, options = {}) {
    return request('/auth/register', {
      method: 'POST',
      body: userData,
      signal: options.signal,
    })
  },
  getProfile(token, options = {}) {
    return request('/auth/profile', {
      token,
      signal: options.signal,
    })
  },
}

export const vmApi = {
  list(filters = {}, options = {}) {
    const searchParams = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        searchParams.set(key, String(value))
      }
    })

    const queryString = searchParams.toString()

    return request(`/vms${queryString ? `?${queryString}` : ''}`, {
      signal: options.signal,
    })
  },
  create(payload, token, options = {}) {
    return request('/vms', {
      method: 'POST',
      body: payload,
      token,
      signal: options.signal,
    })
  },
  updateStatus(vmId, status, token, options = {}) {
    return request(`/vms/${vmId}/status`, {
      method: 'PATCH',
      body: { status },
      token,
      signal: options.signal,
    })
  },
}

export const rentalsApi = {
  list(token, options = {}) {
    return request('/rentals', {
      token,
      signal: options.signal,
    })
  },
  create(vmId, token, options = {}) {
    return request('/rentals', {
      method: 'POST',
      body: { vmId },
      token,
      signal: options.signal,
    })
  },
}
