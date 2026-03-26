import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { authApi } from '../lib/api.js'

const initialForm = {
  username: '',
  email: '',
  password: '',
}

function LoginPage({ currentUser, onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState(initialForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    if (currentUser) {
      navigate('/', { replace: true })
    }
  }, [currentUser, navigate])

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }))
  }

  const handleModeChange = (nextMode) => {
    setMode(nextMode)
    setErrorMessage('')
    setForm(initialForm)
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setErrorMessage('')
    setIsSubmitting(true)

    try {
      const response =
        mode === 'login'
          ? await authApi.login({
              email: form.email,
              password: form.password,
            })
          : await authApi.register({
              username: form.username,
              email: form.email,
              password: form.password,
            })

      onAuthSuccess(response)
      setForm(initialForm)
      navigate('/', { replace: true })
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center py-4 pb-10">
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
        <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.82),rgba(10,15,13,0.95)),radial-gradient(circle_at_top_left,rgba(163,230,53,0.2),transparent_36%)] p-8 shadow-2xl shadow-black/25">
          <div className="max-w-xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Backend Access
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Connect the frontend to your live NestJS session.
            </h1>
            <p className="text-base leading-8 text-stone-300">
              This screen now uses the real backend endpoints for login, registration, and token
              persistence so the exposed frontend can be tested from another device.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Real auth</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                `POST /auth/login` and `POST /auth/register` now power this page.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Stored token</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                The JWT is persisted locally and reused through `GET /auth/profile`.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Remote-friendly</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Point `VITE_API_URL` to the backend machine and test from another laptop.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <div className="flex gap-2 rounded-full border border-white/10 bg-stone-950/40 p-1">
            {['login', 'register'].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => handleModeChange(tab)}
                className={`flex-1 rounded-full px-4 py-2 text-sm font-medium capitalize transition ${
                  mode === tab
                    ? 'bg-lime-300 text-stone-950'
                    : 'text-stone-300 hover:bg-white/5 hover:text-white'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              {mode === 'login' ? 'Login' : 'Register'}
            </p>
            <h2 className="text-3xl font-semibold text-white">
              {mode === 'login'
                ? 'Enter the management console'
                : 'Create a backend account'}
            </h2>
            <p className="text-sm leading-7 text-stone-300">
              {mode === 'login'
                ? 'Use an existing backend user account to access live data.'
                : 'This form maps directly to the NestJS register endpoint.'}
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            {mode === 'register' ? (
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-100">Username</span>
                <input
                  name="username"
                  type="text"
                  placeholder="borimir"
                  value={form.username}
                  onChange={handleChange}
                  required
                  className="w-full rounded-2xl border border-white/10 bg-stone-950/50 px-4 py-3 text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
                />
              </label>
            ) : null}

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-100">Email</span>
              <input
                name="email"
                type="email"
                placeholder="operator@reusegrid.org"
                value={form.email}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/10 bg-stone-950/50 px-4 py-3 text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
              />
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-100">Password</span>
              <input
                name="password"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/10 bg-stone-950/50 px-4 py-3 text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
              />
            </label>

            {errorMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {errorMessage}
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting
                ? 'Submitting...'
                : mode === 'login'
                  ? 'Log In'
                  : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-sm leading-7 text-stone-400">
            Need to review the public overview first?{' '}
            <Link to="/" className="font-semibold text-lime-200 transition hover:text-lime-100">
              Return to the home page
            </Link>
            .
          </p>
        </article>
      </section>
    </main>
  )
}

export default LoginPage
