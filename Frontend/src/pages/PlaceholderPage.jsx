function PlaceholderPage({ eyebrow, title, description }) {
  return (
    <main className="flex flex-1 items-center justify-center pb-10">
      <section className="w-full rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
          {eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">{title}</h1>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-stone-300">
          {description}
        </p>
        <div className="mx-auto mt-8 h-40 max-w-3xl rounded-[1.75rem] border border-white/10 bg-[linear-gradient(135deg,rgba(163,230,53,0.1),rgba(255,255,255,0.03))]" />
      </section>
    </main>
  )
}

export default PlaceholderPage
