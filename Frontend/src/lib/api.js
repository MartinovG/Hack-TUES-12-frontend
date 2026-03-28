const configuredApiUrl = import.meta.env.VITE_API_URL?.trim()

// Production-safe default.
// If a build accidentally bakes in localhost, users will try to call their own machine.
// We hard-default to the public backend endpoint instead.
const PUBLIC_BACKEND_FALLBACK = 'http://178.104.63.93:3000'

function isLocalhostUrl(url) {
  if (!url) return false
  return /^(https?:\/\/)?(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(url)
}

export const apiHost =
  configuredApiUrl && !isLocalhostUrl(configuredApiUrl)
    ? configuredApiUrl
    : PUBLIC_BACKEND_FALLBACK
export const authTokenStorageKey = 'vm-sharing-access-token'

async function request(path, { method = 'GET', body, token, signal } = {}) {
  const headers = {}

  if (body) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  let response

  try {
    response = await fetch(`${apiHost}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    })
  } catch (error) {
    if (error.name === 'AbortError') {
      throw error
    }

    const target = apiHost || 'the current frontend origin'

    throw new Error(
      `Could not reach the API at ${target}. Make sure the backend is running and VITE_API_URL is correct.`,
    )
  }

  const responseText = await response.text()
  const payload = responseText ? JSON.parse(responseText) : null

  if (!response.ok) {
    const message = Array.isArray(payload?.message)
      ? payload.message.join(', ')
      : payload?.message || 'Request failed'

    const error = new Error(message)
    error.status = response.status
    throw error
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
  end(rentalId, token, options = {}) {
    return request(`/rentals/${rentalId}/end`, {
      method: 'PATCH',
      token,
      signal: options.signal,
    })
  },
}

export const jobsApi = {
  list(rentalId, token, options = {}) {
    return request(`/rentals/${rentalId}/jobs`, {
      token,
      signal: options.signal,
    })
  },
  create(rentalId, payload, token, options = {}) {
    return request(`/rentals/${rentalId}/jobs`, {
      method: 'POST',
      body: payload,
      token,
      signal: options.signal,
    })
  },
}
