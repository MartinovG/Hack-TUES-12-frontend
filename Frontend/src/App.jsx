import { useState } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import NavBar from './components/NavBar.jsx'
import HomePage from './pages/HomePage.jsx'
import LoginPage from './pages/LoginPage.jsx'
import PlaceholderPage from './pages/PlaceholderPage.jsx'

const initialForm = {
  name: '',
  email: '',
  password: '',
}

function App() {
  const [currentUser, setCurrentUser] = useState(null)

  const handleLogin = (form) => {
    setCurrentUser({
      name: form.name.trim() || 'Guest Operator',
      email: form.email.trim(),
    })
  }

  const handleLogout = () => {
    setCurrentUser(null)
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
              <PlaceholderPage
                eyebrow="Resource Catalog"
                title="VM Collection"
                description="This page will list the reusable VM templates and compute profiles available for deployment."
              />
            }
          />
          <Route
            path="/your-vms"
            element={
              <PlaceholderPage
                eyebrow="Personal Workspace"
                title="Your VMs"
                description="This page will show the virtual machines assigned to the current user and their live status."
              />
            }
          />
          <Route
            path="/login"
            element={
              <LoginPage
                currentUser={currentUser}
                initialForm={initialForm}
                onLogin={handleLogin}
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
