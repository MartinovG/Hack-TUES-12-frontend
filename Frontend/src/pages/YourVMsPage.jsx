import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { apiHost, downloadApi, rentalsApi, vmApi } from '../lib/api.js'

const desktopPlatforms = [
  { key: 'linux', label: 'Download Linux App' },
  { key: 'windows', label: 'Download Windows App' },
  { key: 'macos', label: 'Download macOS App' },
]

function YourVMsPage({ authToken, currentUser }) {
  const [vms, setVms] = useState([])
  const [rentals, setRentals] = useState([])
  const [desktopArtifacts, setDesktopArtifacts] = useState([])
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [downloadingVmId, setDownloadingVmId] = useState('')

  useEffect(() => {
    const abortController = new AbortController()

    const loadVms = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const [vmResponse, rentalResponse, desktopResponse] = await Promise.all([
          vmApi.list({}, { signal: abortController.signal }),
          rentalsApi.list(authToken, { signal: abortController.signal }),
          downloadApi.desktopApps({ signal: abortController.signal }),
        ])
        setVms(vmResponse)
        setRentals(rentalResponse)
        setDesktopArtifacts(desktopResponse.artifacts || [])
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
    () =>
      rentals.filter(
        (rental) =>
          rental.receiverId === currentUser.id &&
          rental.rentalState === 'active' &&
          rental.vm,
      ),
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

  const desktopArtifactsByPlatform = useMemo(() => {
    return desktopArtifacts.reduce((accumulator, artifact) => {
      if (!accumulator[artifact.platform]) {
        accumulator[artifact.platform] = artifact
      }
      return accumulator
    }, {})
  }, [desktopArtifacts])

  const handleCopySetupKey = async (connectionToken) => {
    setErrorMessage('')
    setSuccessMessage('')

    try {
      await copyTextToClipboard(connectionToken)
      setSuccessMessage('Setup key copied.')
    } catch {
      setErrorMessage('Could not copy the setup key automatically. Copy it manually from the card.')
    }
  }

  const handleDownloadConnector = async (vm) => {
    setErrorMessage('')
    setSuccessMessage('')
    setDownloadingVmId(vm.id)

    try {
      const { blob, filename } = await vmApi.downloadConnector(vm.id, authToken)
      const downloadUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')

      link.href = downloadUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(downloadUrl)

      setSuccessMessage(`Connector downloaded for ${vm.name}.`)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setDownloadingVmId('')
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10">
      <section className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
          Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-white sm:text-5xl">
          Your VMs & Computers
        </h1>
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
          <p className="text-lg text-white">Loading...</p>
        </section>
      ) : ownedVms.length === 0 && selectedRentals.length === 0 ? (
        <section className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center backdrop-blur-xl">
          <p className="text-xl font-semibold text-white">Nothing here yet.</p>
        </section>
      ) : (
        <div className="grid gap-8">
          <section className="grid gap-5">
            <div className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
                Selected By You
              </p>
              <h2 className="text-2xl font-semibold text-white">Selected VMs</h2>
            </div>

            {selectedRentals.length === 0 ? (
              <article className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-8 text-center backdrop-blur-xl">
                <p className="text-lg font-semibold text-white">No selected VMs.</p>
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
                <p className="text-lg font-semibold text-white">No created laptops.</p>
              </article>
            ) : (
              ownedVms.map((vm) => {
                const activeRental = activeOwnedRentalByVmId.get(vm.id)
                const powerState = getLaptopPowerState(vm)
                const usageState = activeRental ? 'Using' : 'Not Using'

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
                              tone={usageState === 'Using' ? 'amber' : 'green'}
                            />
                          ) : null}
                        </div>

                          <h2 className="text-2xl font-semibold text-white">{vm.name}</h2>
                          <p className="text-sm leading-7 text-stone-300">Laptop ID: {vm.id}</p>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                          {powerState === 'On' ? (
                            <SpecCard label="Usage" value={usageState} />
                          ) : null}
                          <SpecCard label="CPU Model" value={vm.cpuModel} />
                          <SpecCard label="CPU Cores" value={vm.cpuCores} />
                          <SpecCard label="RAM" value={`${vm.ramGb} GB`} />
                          <SpecCard label="Storage" value={`${vm.storageGb} GB`} />
                          <SpecCard label="GPU" value={vm.gpuModel || 'No dedicated GPU'} />
                          <SpecCard
                            label="GPU VRAM"
                            value={vm.gpuVramGb ? `${vm.gpuVramGb} GB` : 'N/A'}
                          />
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

                      </div>

                      <div className="flex min-w-[18rem] flex-col gap-4 rounded-[1.5rem] border border-white/10 bg-stone-950/35 p-5">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
                            Tools
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleCopySetupKey(vm.connectionToken)}
                          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:-translate-y-0.5 hover:bg-white/10"
                        >
                          Copy Setup Key
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDownloadConnector(vm)}
                          disabled={downloadingVmId === vm.id}
                          className="inline-flex items-center justify-center rounded-full bg-lime-300 px-4 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-wait disabled:opacity-70"
                        >
                          {downloadingVmId === vm.id ? 'Preparing Connector...' : 'Download Connector'}
                        </button>

                        <a
                          href={`${apiHost}/download/python`}
                          className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-100 transition hover:-translate-y-0.5 hover:bg-white/10"
                        >
                          Download Raw Script Bundle
                        </a>

                        <div className="mt-2 rounded-[1.25rem] border border-white/10 bg-black/10 p-4">
                          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-stone-400">
                            Desktop App
                          </p>
                          <div className="mt-4 flex flex-col gap-3">
                            {desktopPlatforms.map((platform) => {
                              const artifact = desktopArtifactsByPlatform[platform.key]

                              return artifact ? (
                                <a
                                  key={platform.key}
                                  href={`${apiHost}${artifact.downloadPath}`}
                                  className="inline-flex items-center justify-center rounded-full border border-emerald-200/10 bg-emerald-300/10 px-4 py-3 text-sm font-semibold text-emerald-50 transition hover:-translate-y-0.5 hover:bg-emerald-300/20"
                                >
                                  {platform.label}
                                </a>
                              ) : (
                                <span
                                  key={platform.key}
                                  className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-stone-400"
                                >
                                  {platform.label} Unavailable
                                </span>
                              )
                            })}
                          </div>
                        </div>
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
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-200/80">
                Selected VM
              </p>
              <span className="rounded-full border border-emerald-200/10 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                {formatVmLifecycleState(vm.status)}
              </span>
            </div>
            {vm.status === 'running' ? (
              <Link
                to={`/rentals/${rental.id}/terminal`}
                className="rounded-full bg-lime-300 px-4 py-2 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
              >
                Manage VM
              </Link>
            ) : null}
          </div>
          <h2 className="text-2xl font-semibold text-white">{vm.name}</h2>
          <p className="text-sm leading-7 text-stone-300">Rental ID: {rental.id}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <SpecCard label="CPU Model" value={vm.cpuModel} />
          <SpecCard label="CPU Cores" value={vm.cpuCores} />
          <SpecCard label="RAM" value={`${vm.ramGb} GB`} />
          <SpecCard label="Storage" value={`${vm.storageGb} GB`} />
          <SpecCard label="GPU" value={vm.gpuModel || 'No dedicated GPU'} />
          <SpecCard label="OS" value={vm.os} />
          <SpecCard label="Selected At" value={formatDate(rental.startTime)} />
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

async function copyTextToClipboard(value) {
  if (navigator.clipboard?.writeText && window.isSecureContext) {
    await navigator.clipboard.writeText(value)
    return
  }

  const textArea = document.createElement('textarea')
  textArea.value = value
  textArea.setAttribute('readonly', '')
  textArea.style.position = 'fixed'
  textArea.style.top = '-9999px'
  textArea.style.left = '-9999px'
  document.body.appendChild(textArea)
  textArea.focus()
  textArea.select()

  const wasCopied = document.execCommand('copy')
  document.body.removeChild(textArea)

  if (!wasCopied) {
    throw new Error('Clipboard copy failed')
  }
}

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
