import { useEffect, useMemo, useState } from 'react'
import { apiHost, rentalsApi, vmApi } from '../lib/api.js'

function YourVMsPage({ authToken, currentUser }) {
  const [vms, setVms] = useState([])
  const [rentals, setRentals] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const abortController = new AbortController()

    const loadVms = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [vmResponse, rentalResponse] = await Promise.all([
          vmApi.list({}, { signal: abortController.signal }),
          rentalsApi.list(authToken, { signal: abortController.signal }),
        ])
        setVms(vmResponse)
        setRentals(rentalResponse)
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

    loadVms()

    return () => {
      abortController.abort()
    }
  }, [authToken])

  const ownedVms = useMemo(
    () => vms.filter((vm) => vm.providerId === currentUser.id),
    [currentUser.id, vms],
  )

  const selectedRentals = useMemo(
    () => rentals.filter((rental) => rental.receiverId === currentUser.id && rental.vm),
    [currentUser.id, rentals],
  )

  const activeOwnedRentalByVmId = useMemo(() => {
    const activeRentals = rentals.filter(
      (rental) =>
        rental.vm &&
        rental.vm.providerId === currentUser.id &&
        rental.rentalState === 'active',
    )

    return new Map(activeRentals.map((rental) => [rental.vmId, rental]))
  }, [currentUser.id, rentals])

  const handleCopySetupKey = async (connectionToken) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await navigator.clipboard.writeText(connectionToken)
      setSuccessMessage('Setup key copied. Paste it into the Python agent when prompted.')
    } catch {
      setErrorMessage('Could not copy the setup key automatically. Copy it manually from the card.')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
          Provider Inventory
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Your VMs & Computers
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-stone-300">
          This page combines the VMs you created with the VMs you selected through rentals, so
          both providers and renters can track their current machines in one place.
        </p>
      </section>

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

      {isLoading ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-lg text-white">Loading your dashboard from the backend...</p>
        </section>
      ) : ownedVms.length === 0 && selectedRentals.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center backdrop-blur-xl">
          <p className="text-xl font-semibold text-white">You do not have any laptops or VMs here yet.</p>
          <p className="mt-3 text-sm leading-7 text-stone-300">
            Create a laptop as a provider or select one from the collection and it will appear here.
          </p>
        </section>
      ) : (
        <div className="grid gap-8">
          <section className="grid gap-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
                Selected By You
              </p>
              <h2 className="text-2xl font-semibold text-white">Selected VMs</h2>
              <p className="text-sm leading-7 text-stone-300">
                These are the machines you have selected as a renter. They leave the public list,
                but they stay visible here while the rental is active.
              </p>
            </div>

            {selectedRentals.length === 0 ? (
              <article className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl">
                <p className="text-lg font-semibold text-white">You have not selected any VMs yet.</p>
              </article>
            ) : (
              selectedRentals.map((rental) => (
                <RentalCard key={rental.id} rental={rental} />
              ))
            )}
          </section>

          <section className="grid gap-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
                Created By You
              </p>
              <h2 className="text-2xl font-semibold text-white">Created Laptops</h2>
            </div>

            {ownedVms.length === 0 ? (
              <article className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl">
                <p className="text-lg font-semibold text-white">You have not created any laptops yet.</p>
              </article>
            ) : (
              ownedVms.map((vm) => {
                const activeRental = activeOwnedRentalByVmId.get(vm.id)
                const powerState = getLaptopPowerState(vm)
                const usageState = activeRental ? 'In Use' : 'Not In Use'

                return (
                  <article
                    key={vm.id}
                    className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
                  >
                    <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-200/80">
                            Created Laptop
                          </p>
                          <StatusPill label={powerState} tone={powerState === 'On' ? 'green' : 'slate'} />
                          {powerState === 'On' ? (
                            <StatusPill
                              label={usageState}
                              tone={usageState === 'In Use' ? 'amber' : 'green'}
                            />
                          ) : null}
                        </div>

                          <h2 className="text-2xl font-semibold text-white">{vm.name}</h2>
                          <p className="text-sm leading-7 text-stone-300">Laptop ID: {vm.id}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          <SpecCard label="Laptop Power" value={powerState} />
                          {powerState === 'On' ? (
                            <SpecCard label="Usage" value={usageState} />
                          ) : null}
                          <SpecCard label="CPU Model" value={vm.cpuModel} />
                          <SpecCard label="CPU Cores" value={vm.cpuCores} />
                          <SpecCard label="Frequency" value={`${vm.cpuFrequencyGhz} GHz`} />
                          <SpecCard label="RAM" value={`${vm.ramGb} GB`} />
                          <SpecCard label="Storage" value={`${vm.storageGb} GB`} />
                          <SpecCard label="GPU" value={vm.gpuModel || 'No dedicated GPU'} />
                          <SpecCard
                            label="GPU VRAM"
                            value={vm.gpuVramGb ? `${vm.gpuVramGb} GB` : 'N/A'}
                          />
                          <SpecCard label="OS" value={vm.os} />
                          <SpecCard label="Price / Hour" value={`$${vm.pricePerHour}`} />
                          <SpecCard label="Last Heartbeat" value={formatDate(vm.lastHeartbeat)} />
                          <SpecCard label="Created" value={formatDate(vm.createdAt)} />
                          <SpecCard label="Connection Key" value={vm.connectionToken} />
                          <SpecCard
                            label="Provider Computer"
                            value={vm.physicalComputerId || 'Waiting for setup'}
                          />
                          <SpecCard
                            label="Current Rental"
                            value={activeRental ? activeRental.id : 'No active rental'}
                          />
                        </div>

                        <div className="rounded-[1.5rem] border border-lime-300/15 bg-lime-300/5 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-200/80">
                            Initial Setup
                          </p>
                          <p className="mt-3 text-sm leading-7 text-stone-300">
                            New VMs start in <span className="font-semibold text-white">configuring</span>.
                            Download the agent bundle, run `python agent.py`, and paste this
                            laptop&apos;s connection key when the script asks for it. Once the provider
                            machine registers, this laptop becomes available for renters automatically.
                          </p>
                        </div>
                      </div>

                      <div className="flex min-w-[18rem] flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-stone-950/35 p-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
                            Provider Tools
                          </p>
                          <p className="mt-2 text-sm leading-7 text-stone-300">
                            Use the setup key and agent bundle to connect this laptop to the platform.
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopySetupKey(vm.connectionToken)}
                          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:-translate-y-0.5 hover:bg-white/10"
                        >
                          Copy Setup Key
                        </button>

                        <a
                          href={`${apiHost}/download/python`}
                          className="inline-flex items-center justify-center rounded-full bg-lime-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
                        >
                          Download Agent Bundle
                        </a>
                      </div>
                    </div>
                  </article>
                )
              })
            )}
          </section>
        </div>
      )}
    </main>
  )
}

function RentalCard({ rental }) {
  const vm = rental.vm

  return (
    <article className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
      <div className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-200/80">
              Selected VM
            </p>
            <span className="rounded-full border border-emerald-200/10 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
              {formatVmLifecycleState(vm.status)}
            </span>
          </div>
          <h2 className="text-2xl font-semibold text-white">{vm.name}</h2>
          <p className="text-sm leading-7 text-stone-300">Rental ID: {rental.id}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SpecCard label="CPU Model" value={vm.cpuModel} />
          <SpecCard label="CPU Cores" value={vm.cpuCores} />
          <SpecCard label="Frequency" value={`${vm.cpuFrequencyGhz} GHz`} />
          <SpecCard label="RAM" value={`${vm.ramGb} GB`} />
          <SpecCard label="Storage" value={`${vm.storageGb} GB`} />
          <SpecCard label="GPU" value={vm.gpuModel || 'No dedicated GPU'} />
          <SpecCard label="OS" value={vm.os} />
          <SpecCard label="Price / Hour" value={`$${vm.pricePerHour}`} />
          <SpecCard label="Selected At" value={formatDate(rental.startTime)} />
          <SpecCard label="Payment" value={rental.paymentStatus} />
          <SpecCard label="Provider ID" value={vm.providerId} />
        </div>
      </div>
    </article>
  )
}

function SpecCard({ label, value }) {
  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-stone-950/40 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">{label}</p>
      <p className="mt-2 break-words text-sm leading-6 text-stone-200">{value}</p>
    </div>
  )
}

function StatusPill({ label, tone }) {
  const toneClasses =
    tone === 'green'
      ? 'border-emerald-200/10 bg-emerald-300/10 text-emerald-100'
      : tone === 'amber'
        ? 'border-amber-200/10 bg-amber-300/10 text-amber-100'
        : 'border-white/10 bg-white/5 text-stone-200'

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] ${toneClasses}`}
    >
      {label}
    </span>
  )
}

function getLaptopPowerState(vm) {
  if (!vm.lastHeartbeat) {
    const onlineStatuses = ['available', 'building', 'running', 'shutting_down']
    return onlineStatuses.includes(vm.status) ? 'On' : 'Off'
  }

  const lastHeartbeatTime = new Date(vm.lastHeartbeat).getTime()
  const ageInMilliseconds = Date.now() - lastHeartbeatTime

  return ageInMilliseconds <= 90_000 ? 'On' : 'Off'
}

function formatDate(value) {
  if (!value) {
    return 'No heartbeat yet'
  }

  return new Date(value).toLocaleString()
}

export default YourVMsPage

function formatVmLifecycleState(status) {
  if (status === 'configuring' || status === 'building') {
    return 'building'
  }

  if (status === 'running') {
    return 'running'
  }

  if (status === 'failed') {
    return 'failed'
  }

  return 'completed'
}
