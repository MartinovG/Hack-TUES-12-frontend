import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

function LoginPage({ currentUser, initialForm, onLogin }) {
  const [form, setForm] = useState(initialForm)
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

  const handleSubmit = (event) => {
    event.preventDefault()
    onLogin(form)
    setForm(initialForm)
    navigate('/', { replace: true })
  }

  return (
    <main className="flex flex-1 items-center justify-center py-4 pb-10">
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_0.95fr]">
        <article className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(17,24,39,0.82),rgba(10,15,13,0.95)),radial-gradient(circle_at_top_left,rgba(163,230,53,0.2),transparent_36%)] p-8 shadow-2xl shadow-black/25">
          <div className="max-w-xl space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Access Console
            </p>
            <h1 className="text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl">
              Log in to manage shared compute responsibly.
            </h1>
            <p className="text-base leading-8 text-stone-300">
              This mock authentication screen is ready to be connected later to a NestJS backend
              with real users, hashed passwords, and token-based sessions.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Fairer access</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                People without powerful devices can still reach modern software environments.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Less waste</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                Idle machines become useful again instead of moving closer to disposal.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-4">
              <p className="text-sm font-semibold text-white">Simple rollout</p>
              <p className="mt-2 text-sm leading-6 text-stone-300">
                The UI is already structured for future backend integration and route protection.
              </p>
            </div>
          </div>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Login
            </p>
            <h2 className="text-3xl font-semibold text-white">Enter the management console</h2>
            <p className="text-sm leading-7 text-stone-300">
              Use any values for now. This is a frontend-only mock flow while the backend and
              database are still being prepared.
            </p>
          </div>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-100">Name</span>
              <input
                name="name"
                type="text"
                placeholder="Borimir Ganchev"
                value={form.name}
                onChange={handleChange}
                required
                className="w-full rounded-2xl border border-white/10 bg-stone-950/50 px-4 py-3 text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
              />
            </label>

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

            <button
              type="submit"
              className="w-full rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              Log In
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
