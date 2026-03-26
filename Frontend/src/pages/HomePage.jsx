const impactStats = [
  { value: '128', label: 'Donated machines currently active' },
  { value: '412', label: 'Virtual workspaces launched' },
  { value: '89%', label: 'Idle compute reused' },
]

const dashboardCards = [
  {
    title: 'Available VM Profiles',
    value: '24',
    description:
      'Ready-to-launch environments for learning, design, office workflows, and development.',
  },
  {
    title: 'Devices Saved From E-Waste',
    value: '67',
    description:
      'Hardware that stays useful instead of being discarded before its real end of life.',
  },
  {
    title: 'Users Waiting For Access',
    value: '13',
    description:
      'People currently waiting for the right amount of compute to match their needs.',
  },
]

const activityFeed = [
  'Sofia Lab contributed 6 CPU cores and 16 GB RAM to the shared student pool.',
  'A new zero-waste rule now adds machines below 20% load into the reusable compute network.',
  'The "Frontend Starter" VM environment was assigned to a learner without a capable local device.',
]

const readinessItems = [
  {
    title: 'Authentication Flow',
    description: 'The login page can later connect directly to a NestJS `POST /auth/login` endpoint.',
  },
  {
    title: 'Dashboard Data',
    description: 'All current metrics are mocked, but the structure is ready for API-driven cards and lists.',
  },
  {
    title: 'Session Handling',
    description: 'The temporary local state can be replaced with tokens, guards, and role-aware requests.',
  },
]

function HomePage({ currentUser }) {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-8">
      <section className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:grid-cols-[1.35fr_0.9fr] lg:p-8">
        <div className="flex flex-col justify-between gap-8">
          <div className="space-y-5">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Zero Waste Compute Console
            </p>
            <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Give unused hardware a second life through shared virtual access.
            </h1>
            <p className="max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
              This platform transforms idle compute capacity into virtual machines for people
              who cannot afford high-end hardware, making access to modern tools more fair and
              more sustainable at the same time.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {impactStats.map((stat) => (
              <article
                key={stat.label}
                className="rounded-[1.5rem] border border-emerald-200/10 bg-stone-900/60 p-5"
              >
                <p className="text-3xl font-bold text-white sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">{stat.label}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(18,51,37,0.55),rgba(12,18,15,0.9)),radial-gradient(circle_at_top,rgba(163,230,53,0.32),transparent_58%)] p-6 shadow-xl shadow-lime-950/20">
          <div className="flex h-full flex-col justify-between gap-8">
            <div className="space-y-4">
              <span className="inline-flex rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-lime-100">
                Sustainable Pool
              </span>
              <h2 className="text-2xl font-semibold text-white sm:text-3xl">
                Compute should not stay idle while people are locked out.
              </h2>
              <p className="text-sm leading-7 text-emerald-50/80">
                When a donated machine is underused, its spare capacity can be redirected into
                lightweight VM environments for students, job seekers, and creators.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.28em] text-emerald-50/70">
                <span>CPU / RAM Reuse</span>
                <span>78%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-[78%] rounded-full bg-gradient-to-r from-lime-300 via-emerald-300 to-amber-200" />
              </div>
              <p className="text-sm leading-6 text-stone-200/80">
                The current shared pool is distributing reclaimed compute to active virtual
                environments instead of letting it fade into waste.
              </p>
            </div>
          </div>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-emerald-300/10 bg-emerald-400/10 p-5 text-sm leading-7 text-emerald-50/90">
        {currentUser ? (
          <p>
            Welcome back, <span className="font-semibold text-white">{currentUser.name}</span>.
            Your mock session is active and ready to be replaced later with a real NestJS-backed
            authentication flow.
          </p>
        ) : (
          <p>
            The dashboard is visible in demo mode for now. Once the backend is ready, access can
            be limited to authenticated users and role-based permissions.
          </p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {dashboardCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-200/75">
              {card.title}
            </p>
            <p className="mt-4 text-4xl font-bold text-white">{card.value}</p>
            <p className="mt-4 text-sm leading-7 text-stone-300">{card.description}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Recent Activity
            </p>
            <h2 className="text-2xl font-semibold text-white">What is happening across the grid</h2>
          </div>

          <ul className="mt-6 space-y-4">
            {activityFeed.map((item) => (
              <li
                key={item}
                className="rounded-[1.5rem] border border-white/10 bg-stone-950/40 p-4 text-sm leading-7 text-stone-300"
              >
                {item}
              </li>
            ))}
          </ul>
        </article>

        <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              NestJS Ready
            </p>
            <h2 className="text-2xl font-semibold text-white">Prepared for backend integration</h2>
          </div>

          <div className="mt-6 space-y-4">
            {readinessItems.map((item) => (
              <div
                key={item.title}
                className="rounded-[1.5rem] border border-emerald-200/10 bg-emerald-300/5 p-4"
              >
                <p className="text-base font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-stone-300">{item.description}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </main>
  )
}

export default HomePage
