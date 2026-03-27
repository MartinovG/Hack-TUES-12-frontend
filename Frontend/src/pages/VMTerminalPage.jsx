import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { jobsApi, rentalsApi } from '../lib/api.js'

function VMTerminalPage({ authToken, currentUser }) {
  const { rentalId } = useParams()
  const [rental, setRental] = useState(null)
  const [jobs, setJobs] = useState([])
  const [command, setCommand] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    const abortController = new AbortController()

    const loadState = async () => {
      try {
        setIsLoading(true)
        setErrorMessage('')

        const [rentals, jobList] = await Promise.all([
          rentalsApi.list(authToken, { signal: abortController.signal }),
          jobsApi.list(rentalId, authToken, { signal: abortController.signal }),
        ])

        const matchedRental = rentals.find((item) => item.id === rentalId)

        if (!matchedRental) {
          setErrorMessage('This rental could not be found in your account.')
          setRental(null)
          setJobs([])
          return
        }

        setRental(matchedRental)
        setJobs(jobList)
      } catch (error) {
        if (!abortController.signal.aborted) {
          setErrorMessage(error.message)
        }
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadState()

    return () => {
      abortController.abort()
    }
  }, [authToken, rentalId])

  useEffect(() => {
    if (!authToken || !rentalId) {
      return undefined
    }

    const shouldPoll = jobs.some((job) => job.status === 'pending' || job.status === 'running')

    if (!shouldPoll) {
      return undefined
    }

    const intervalId = window.setInterval(async () => {
      try {
        const nextJobs = await jobsApi.list(rentalId, authToken)
        setJobs(nextJobs)
      } catch {
        // Keep the last successful terminal snapshot visible.
      }
    }, 2500)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [authToken, jobs, rentalId])

  const isRunning = rental?.vm?.status === 'running'
  const sortedJobs = useMemo(
    () => [...jobs].sort((first, second) => new Date(second.createdAt) - new Date(first.createdAt)),
    [jobs],
  )

  const handleRunCommand = async (event) => {
    event.preventDefault()

    const trimmedCommand = command.trim()

    if (!trimmedCommand) {
      setErrorMessage('Please enter a command before sending it to the VM.')
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const createdJob = await jobsApi.create(
        rentalId,
        {
          jobType: 'command',
          jobData: { command: trimmedCommand },
        },
        authToken,
      )

      setJobs((currentJobs) => [createdJob, ...currentJobs])
      setCommand('')
      setSuccessMessage('Command sent. Waiting for terminal output from the remote VM...')
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Remote Control
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Simulated VM Terminal
            </h1>
            <p className="max-w-3xl text-base leading-8 text-stone-300">
              Send commands from the frontend, let the backend forward them to the provider
              computer, and review the returned output below.
            </p>
          </div>

          <Link
            to="/your-vms"
            className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/10 hover:text-white"
          >
            Back to Your VMs
          </Link>
        </div>
      </section>

      {isLoading ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-lg text-white">Loading terminal session...</p>
        </section>
      ) : (
        <>
          {errorMessage ? (
            <section className="rounded-[2rem] border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-100">
              {errorMessage}
            </section>
          ) : null}

          {successMessage ? (
            <section className="rounded-[2rem] border border-emerald-300/20 bg-emerald-400/10 p-4 text-sm text-emerald-50">
              {successMessage}
            </section>
          ) : null}

          {rental ? (
            <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
              <div className="grid gap-4 md:grid-cols-4">
                <TerminalMeta label="VM Name" value={rental.vm?.name || 'Unknown VM'} />
                <TerminalMeta label="Rental ID" value={rental.id} />
                <TerminalMeta label="VM Status" value={rental.vm?.status || 'unknown'} />
                <TerminalMeta label="Selected At" value={new Date(rental.startTime).toLocaleString()} />
              </div>
            </section>
          ) : null}

          <section className="rounded-[2rem] border border-white/10 bg-stone-950/70 p-6 backdrop-blur-xl">
            <form className="space-y-4" onSubmit={handleRunCommand}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-stone-100">Command</span>
                <input
                  value={command}
                  onChange={(event) => setCommand(event.target.value)}
                  placeholder="echo Hello from Share A Comp"
                  className="w-full rounded-2xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
                />
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-stone-400">
                  {isRunning
                    ? 'This VM is running and ready to receive commands.'
                    : 'Commands are available only while the VM is in running state.'}
                </p>
                <button
                  type="submit"
                  disabled={!isRunning || isSubmitting}
                  className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Sending...' : 'Run Command'}
                </button>
              </div>
            </form>
          </section>

          <section className="rounded-[2rem] border border-white/10 bg-stone-950/70 p-6 backdrop-blur-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Terminal Output
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Command History</h2>

            <div className="mt-6 space-y-4 font-mono text-sm">
              {sortedJobs.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/5 p-6 text-stone-300">
                  No commands have been sent to this VM yet.
                </div>
              ) : (
                sortedJobs.map((job) => (
                  <article
                    key={job.id}
                    className="rounded-[1.5rem] border border-white/10 bg-black/30 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="text-lime-200">$ {job.jobData?.command || 'Unknown command'}</p>
                      <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.25em] text-stone-300">
                        {job.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-stone-500">
                      {new Date(job.createdAt).toLocaleString()}
                    </p>
                    <pre className="mt-4 overflow-x-auto whitespace-pre-wrap break-words rounded-2xl border border-white/5 bg-stone-950/70 p-4 text-stone-200">
                      {job.result ||
                        (job.status === 'pending'
                          ? 'Waiting for the backend to dispatch this command...'
                          : 'No output yet.')}
                    </pre>
                  </article>
                ))
              )}
            </div>
          </section>
        </>
      )}
    </main>
  )
}

function TerminalMeta({ label, value }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-stone-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-stone-200">{value}</p>
    </div>
  )
}

export default VMTerminalPage
