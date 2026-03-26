import { NavLink, Link } from 'react-router-dom'

function NavBar({ currentUser, onLogout }) {
  const navItems = [
    { label: 'Home Page', to: '/' },
    ...(currentUser
      ? [
          { label: 'VM Collection', to: '/vm-collection' },
          { label: 'Your VMs', to: '/your-vms' },
        ]
      : []),
  ]

  const linkClassName = ({ isActive }) =>
    `rounded-full px-4 py-2 text-sm font-medium transition ${
      isActive
        ? 'bg-lime-300 text-stone-950 shadow-lg shadow-lime-300/20'
        : 'text-stone-300 hover:bg-white/10 hover:text-white'
    }`

  return (
    <header className="mb-10 rounded-[2rem] border border-white/10 bg-white/5 px-5 py-4 backdrop-blur-xl sm:px-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime-300 text-sm font-black uppercase tracking-[0.24em] text-stone-950">
              ZW
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.32em] text-lime-200/80">
                Zero Waste Grid
              </p>
              <p className="text-sm text-stone-300">
                Shared compute for wider access
              </p>
            </div>
          </Link>

          <nav className="flex flex-wrap gap-2">
            {navItems.map((item) => (
              <NavLink key={item.to} to={item.to} className={linkClassName}>
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="flex items-center justify-between gap-3 lg:justify-end">
          {currentUser ? (
            <>
              <div className="rounded-full border border-emerald-200/15 bg-emerald-300/10 px-4 py-2 text-right">
                <p className="text-sm font-semibold text-white">
                  {currentUser.username || currentUser.name}
                </p>
                <p className="text-xs text-stone-300">{currentUser.email}</p>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-stone-200 transition hover:bg-white/10 hover:text-white"
              >
                Log Out
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
            >
              Log In
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}

export default NavBar
