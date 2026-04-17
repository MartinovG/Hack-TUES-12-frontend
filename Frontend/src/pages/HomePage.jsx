const highlights = [
  {
    title: 'Share idle hardware',
    description: 'Turn a connected laptop into a machine other users can rent when they need compute.',
  },
  {
    title: 'Start through the connector',
    description: 'Each provider laptop gets its own connector bundle and desktop app flow.',
  },
  {
    title: 'Use remote VMs',
    description: 'Renters can select an available laptop, start a session, and run commands remotely.',
  },
]

const featureCards = [
  {
    label: 'For Providers',
    title: 'Offer a laptop',
    description: 'Create a laptop, download its connector, and keep it online for rentals.',
  },
  {
    label: 'For Renters',
    title: 'Rent a machine',
    description: 'Browse the collection, choose an available laptop, and open your VM session.',
  },
  {
    label: 'In One Place',
    title: 'Track everything',
    description: 'See created laptops, selected VMs, status updates, and connector downloads in one dashboard.',
  },
]

function HomePage({ currentUser }) {
  return (
    <main className="flex flex-1 flex-col gap-6 pb-8">
      <section className="grid gap-6 overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 shadow-2xl shadow-black/20 backdrop-blur-xl lg:grid-cols-[1.2fr_0.8fr] lg:p-8">
        <div className="space-y-5">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
            Shared Compute
          </p>
          <h1 className="max-w-4xl text-4xl font-bold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
            Share laptops. Launch VMs. Reuse hardware.
          </h1>
          <p className="max-w-2xl text-base leading-8 text-stone-300 sm:text-lg">
            Hive connects providers with available laptops and renters who need temporary compute
            access through virtual machines.
          </p>

          <div className="grid gap-3 sm:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-[1.4rem] border border-white/10 bg-stone-950/40 p-4"
              >
                <p className="text-sm font-semibold text-white">{item.title}</p>
                <p className="mt-2 text-sm leading-6 text-stone-300">{item.description}</p>
              </article>
            ))}
          </div>
        </div>

        <aside className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(18,51,37,0.55),rgba(12,18,15,0.9)),radial-gradient(circle_at_top,rgba(163,230,53,0.32),transparent_58%)] p-6 shadow-xl shadow-lime-950/20">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-100/80">
              How It Works
            </p>
            <ol className="space-y-3 text-sm leading-7 text-stone-200">
              <li>1. A provider adds a laptop.</li>
              <li>2. The provider starts the connector on that machine.</li>
              <li>3. The laptop appears in the collection when it is ready.</li>
              <li>4. A renter selects it and uses the VM session.</li>
            </ol>
          </div>
        </aside>
      </section>

      <section className="rounded-[2rem] border border-emerald-300/10 bg-emerald-400/10 p-5 text-sm leading-7 text-emerald-50/90">
        {currentUser ? (
          <p>
            Signed in as{' '}
            <span className="font-semibold text-white">
              {currentUser.username || currentUser.name}
            </span>
            .
          </p>
        ) : (
          <p>Sign in to create laptops, rent machines, and manage active sessions.</p>
        )}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        {featureCards.map((card) => (
          <article
            key={card.title}
            className="rounded-[1.75rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-lime-200/75">
              {card.label}
            </p>
            <p className="mt-4 text-2xl font-semibold text-white">{card.title}</p>
            <p className="mt-3 text-sm leading-7 text-stone-300">{card.description}</p>
          </article>
        ))}
      </section>
    </main>
  )
}

export default HomePage
