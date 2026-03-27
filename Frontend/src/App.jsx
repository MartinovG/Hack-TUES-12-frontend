import { useEffect, useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import { authApi, authTokenStorageKey } from './lib/api.js'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import VMCollectionPage from './pages/VMCollectionPage.jsx'
import YourVMsPage from './pages/YourVMsPage.jsx'

const currentUserStorageKey = 'vm-sharing-current-user'

function readStoredUser() {
  const rawValue = localStorage.getItem(currentUserStorageKey)

  if (!rawValue) {
    return null
  }

  try {
    return JSON.parse(rawValue)
  } catch {
    localStorage.removeItem(currentUserStorageKey)
    return null
  }
}

function App() {
  const [authToken, setAuthToken] = useState(() =>
    localStorage.getItem(authTokenStorageKey),
  )
  const [currentUser, setCurrentUser] = useState(() => readStoredUser())
  const [isAuthReady, setIsAuthReady] = useState(false)

  useEffect(() => {
    if (!authToken) {
      setCurrentUser(null)
      setIsAuthReady(true)
      return
    }

    const abortController = new AbortController()

    const loadProfile = async () => {
      try {
        const profile = await authApi.getProfile(authToken, {
          signal: abortController.signal,
        })

        const nextUser = {
          id: profile.id,
          username: profile.username,
          email: profile.email,
        }

        localStorage.setItem(currentUserStorageKey, JSON.stringify(nextUser))
        setCurrentUser(nextUser)
      } catch (error) {
        if (error?.status === 401 || error?.status === 403) {
          localStorage.removeItem(authTokenStorageKey)
          localStorage.removeItem(currentUserStorageKey)
          setAuthToken(null)
          setCurrentUser(null)
        }
      } finally {
        setIsAuthReady(true)
      }
    }

    loadProfile()

    return () => {
      abortController.abort()
    }
  }, [authToken])

  const handleAuthSuccess = ({ access_token, user }) => {
    localStorage.setItem(authTokenStorageKey, access_token)
    localStorage.setItem(currentUserStorageKey, JSON.stringify(user))
    setAuthToken(access_token)
    setCurrentUser(user)
    setIsAuthReady(true)
  }

  const handleLogout = () => {
    localStorage.removeItem(authTokenStorageKey)
    localStorage.removeItem(currentUserStorageKey)
    setAuthToken(null)
    setCurrentUser(null)
  }

  if (!isAuthReady) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-950 px-4 text-stone-100">
        <div className="rounded-[2rem] border border-white/10 bg-white/5 px-8 py-6 text-center backdrop-blur-xl">
          <p className="text-sm uppercase tracking-[0.32em] text-lime-200/80">
            Connecting
          </p>
          <p className="mt-3 text-lg text-white">Checking your backend session...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <div className="absolute inset-x-0 top-0 -z-0 h-[32rem] bg-[radial-gradient(circle_at_top_left,_rgba(163,230,53,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(251,191,36,0.12),_transparent_24%),linear-gradient(180deg,_#0a0f0d,_#111827)]" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <NavBar currentUser={currentUser} onLogout={handleLogout} />

        <Routes>
          <Route path="/" element={<HomePage currentUser={currentUser} />} />
          <Route
            path="/vm-collection"
            element={
              currentUser ? (
                <VMCollectionPage authToken={authToken} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/your-vms"
            element={
              currentUser ? (
                <YourVMsPage authToken={authToken} currentUser={currentUser} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                currentUser={currentUser}
                onAuthSuccess={handleAuthSuccess}
              />
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}

export default App
