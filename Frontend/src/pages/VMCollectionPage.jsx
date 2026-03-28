import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import { rentalsApi, vmApi } from '../lib/api.js'

const operatingSystems = [
  'Ubuntu 24.04 LTS',
  'Windows 11 Pro',
  'Linux Mint 22',
  'Fedora Workstation 41',
]

const initialVmForm = {
  name: '',
  cpuCores: '',
  cpuModel: '',
  cpuFrequencyGhz: '',
  gpuModel: '',
  gpuVramGb: '',
  ramGb: '',
  storageGb: '',
  pricePerHour: '',
}

function VMCollectionPage({ authToken }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState({
    minCpu: '',
    minRam: '',
    minStorage: '',
    hasGpu: false,
  })
  const [vms, setVms] = useState([])
  const [selectedVm, setSelectedVm] = useState(null)
  const [selectedOs, setSelectedOs] = useState(operatingSystems[0])
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [newVm, setNewVm] = useState(initialVmForm)
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmittingSelection, setIsSubmittingSelection] = useState(false)
  const [isCreatingVm, setIsCreatingVm] = useState(false)
  const [selectionMessage, setSelectionMessage] = useState('')
  const deferredSearchQuery = useDeferredValue(searchQuery)

  useEffect(() => {
    const abortController = new AbortController()

    const loadVms = async () => {
      setIsLoading(true)
      setErrorMessage('')

      try {
        const response = await vmApi.list(
          {
            status: 'available',
            minCpu: filters.minCpu,
            minRam: filters.minRam,
            minStorage: filters.minStorage,
            hasGpu: filters.hasGpu || undefined,
          },
          { signal: abortController.signal },
        )

        setVms(response)
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
  }, [filters.hasGpu, filters.minCpu, filters.minRam, filters.minStorage])

  const refreshVms = async () => {
    setIsLoading(true)
    setErrorMessage('')

    try {
      const response = await vmApi.list({
        status: 'available',
        minCpu: filters.minCpu,
        minRam: filters.minRam,
        minStorage: filters.minStorage,
        hasGpu: filters.hasGpu || undefined,
      })

      setVms(response)
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const filteredVms = useMemo(() => {
    const normalizedQuery = deferredSearchQuery.trim().toLowerCase()

    if (!normalizedQuery) {
      return vms
    }

    return vms.filter((vm) =>
      [
        vm.name,
        vm.cpuModel,
        vm.cpuCores,
        vm.cpuFrequencyGhz,
        vm.gpuModel,
        vm.gpuVramGb,
        vm.ramGb,
        vm.storageGb,
        vm.os,
        vm.status,
        vm.pricePerHour,
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery),
    )
  }, [deferredSearchQuery, vms])

  const handleFilterChange = (event) => {
    const { name, type, value, checked } = event.target

    setFilters((currentFilters) => ({
      ...currentFilters,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleVmFieldChange = (event) => {
    const { name, value } = event.target

    setNewVm((currentVm) => ({
      ...currentVm,
      [name]: value,
    }))
  }

  const handleSelectVm = (vm) => {
    setSelectedVm(vm)
    setSelectedOs(vm.os || operatingSystems[0])
    setSelectionMessage('')
  }

  const handleCreateVm = async (event) => {
    event.preventDefault()
    setIsCreatingVm(true)
    setErrorMessage('')
    setSuccessMessage('')

    try {
      const createdVm = await vmApi.create(
        {
          name: newVm.name,
          cpuCores: Number(newVm.cpuCores),
          cpuModel: newVm.cpuModel,
          cpuFrequencyGhz: Number(newVm.cpuFrequencyGhz),
          gpuModel: newVm.gpuModel || undefined,
          gpuVramGb: newVm.gpuVramGb ? Number(newVm.gpuVramGb) : undefined,
          ramGb: Number(newVm.ramGb),
          storageGb: Number(newVm.storageGb),
          os: operatingSystems[0],
          pricePerHour: Number(newVm.pricePerHour),
        },
        authToken,
      )

      setIsAddModalOpen(false)
      setNewVm(initialVmForm)
      setSuccessMessage(
        `Laptop ${createdVm.name} was created in building state. Finish setup from Your VMs & Computers using its connection key.`,
      )
      await refreshVms()
    } catch (error) {
      setErrorMessage(error.message)
    } finally {
      setIsCreatingVm(false)
    }
  }

  const handleSendSelection = async (event) => {
    event.preventDefault()
    setIsSubmittingSelection(true)
    setSelectionMessage('')

    try {
      await rentalsApi.create(selectedVm.id, authToken)
      setSelectionMessage(
        'Rental created successfully. The laptop will disappear from the available list after refresh.',
      )
      await refreshVms()
      setSelectedVm(null)
    } catch (error) {
      setSelectionMessage(error.message)
    } finally {
      setIsSubmittingSelection(false)
    }
  }

  return (
    <main className="flex flex-1 flex-col gap-6 pb-10">
      <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl space-y-4">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-lime-200/80">
              Live Resource Catalog
            </p>
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
              Laptops Collection
            </h1>
            <p className="text-base leading-8 text-stone-300">
              Browse the laptops that are currently connected, configured, and ready to be assigned
              to someone who needs computing access.
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
          >
            Add Laptop
          </button>
        </div>

        <div className="mt-8 grid gap-4 rounded-[1.75rem] border border-white/10 bg-stone-950/35 p-4 sm:p-5 xl:grid-cols-[1.4fr_repeat(3,minmax(0,0.5fr))_auto_auto] xl:items-end">
          <FilterInput
            label="Search"
            name="search"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by computer name, CPU, RAM, OS, status, or price"
          />
          <FilterInput
            label="Min CPU cores"
            name="minCpu"
            type="number"
            min="1"
            value={filters.minCpu}
            onChange={handleFilterChange}
            placeholder="4"
          />
          <FilterInput
            label="Min RAM (GB)"
            name="minRam"
            type="number"
            min="1"
            value={filters.minRam}
            onChange={handleFilterChange}
            placeholder="16"
          />
          <FilterInput
            label="Min Storage (GB)"
            name="minStorage"
            type="number"
            min="1"
            value={filters.minStorage}
            onChange={handleFilterChange}
            placeholder="256"
          />
          <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-200">
            <input
              name="hasGpu"
              type="checkbox"
              checked={filters.hasGpu}
              onChange={handleFilterChange}
              className="h-4 w-4 rounded border-white/20 bg-stone-900 text-lime-300 focus:ring-lime-300/30"
            />
            Has GPU
          </label>
          <div className="rounded-2xl border border-emerald-200/10 bg-emerald-300/5 px-4 py-3 text-sm text-stone-300">
            {filteredVms.length} laptop{filteredVms.length === 1 ? '' : 's'} found
          </div>
        </div>

        {errorMessage ? (
          <div className="mt-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
            {errorMessage}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mt-4 rounded-2xl border border-emerald-300/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-50">
            {successMessage}
          </div>
        ) : null}
      </section>

      {isLoading ? (
        <section className="rounded-[2rem] border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
          <p className="text-lg text-white">Loading available laptops from the backend...</p>
        </section>
      ) : (
        <section className="grid gap-5">
          {filteredVms.map((vm) => (
            <article
              key={vm.id}
              className="rounded-[2rem] border border-white/10 bg-white/5 p-6 backdrop-blur-xl"
            >
              <div className="flex flex-col gap-6 lg:flex-row lg:justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-lime-200/80">
                        Available Laptop
                      </p>
                      <span className="rounded-full border border-emerald-200/10 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                        On
                      </span>
                      <span className="rounded-full border border-emerald-200/10 bg-emerald-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-emerald-100">
                        Not Using
                      </span>
                    </div>
                    <h2 className="text-2xl font-semibold text-white">{vm.name}</h2>
                    <p className="max-w-3xl text-sm leading-7 text-stone-300">
                      Ready to be assigned. This laptop is currently available in the shared device pool.
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
                    <SpecCard label="Provider ID" value={vm.providerId} />
                  </div>
                </div>

                <div className="flex min-w-[16rem] flex-col justify-between gap-4 rounded-[1.5rem] border border-white/10 bg-stone-950/35 p-5">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
                      Next step
                    </p>
                    <p className="mt-2 text-sm leading-7 text-stone-300">
                      Open the assignment modal, pick an operating system, and send the rental
                      request to the backend.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelectVm(vm)}
                    className="rounded-full bg-white px-4 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200"
                  >
                    Select
                  </button>
                </div>
              </div>
            </article>
          ))}

          {filteredVms.length === 0 ? (
            <article className="rounded-[2rem] border border-dashed border-white/15 bg-white/5 p-10 text-center backdrop-blur-xl">
              <p className="text-xl font-semibold text-white">No available laptops match this filter.</p>
              <p className="mt-3 text-sm leading-7 text-stone-300">
                Adjust the filters or register a new laptop with the add form.
              </p>
            </article>
          ) : null}
        </section>
      )}

      {selectedVm ? (
        <ModalShell title={`Assign ${selectedVm.name}`}>
          <form className="space-y-5" onSubmit={handleSendSelection}>
            <p className="text-sm leading-7 text-stone-300">
              This action now calls `POST /rentals` for the selected laptop. The operating system
              choice stays in the frontend flow for now because the current backend rental endpoint
              does not accept an OS override.
            </p>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-stone-100">Preferred Operating System</span>
              <select
                value={selectedOs}
                onChange={(event) => setSelectedOs(event.target.value)}
                className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
              >
                {operatingSystems.map((operatingSystem) => (
                  <option key={operatingSystem} value={operatingSystem}>
                    {operatingSystem}
                  </option>
                ))}
              </select>
            </label>

            {selectionMessage ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-100">
                {selectionMessage}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setSelectedVm(null)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmittingSelection}
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmittingSelection ? 'Sending...' : 'Send'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}

      {isAddModalOpen ? (
        <ModalShell title="Register a New Laptop">
          <form className="space-y-4" onSubmit={handleCreateVm}>
            <div className="grid gap-4 sm:grid-cols-2">
              <FormInput
                name="name"
                label="Laptop Name"
                value={newVm.name}
                onChange={handleVmFieldChange}
                placeholder="Shared Dev Workstation"
              />
              <FormInput
                name="cpuModel"
                label="CPU Model"
                value={newVm.cpuModel}
                onChange={handleVmFieldChange}
                placeholder="Intel Core i7-12700K"
              />
              <FormInput
                name="cpuCores"
                label="CPU Cores"
                type="number"
                min="1"
                value={newVm.cpuCores}
                onChange={handleVmFieldChange}
                placeholder="8"
              />
              <FormInput
                name="cpuFrequencyGhz"
                label="CPU Frequency (GHz)"
                type="number"
                min="0.1"
                step="0.1"
                value={newVm.cpuFrequencyGhz}
                onChange={handleVmFieldChange}
                placeholder="3.6"
              />
              <FormInput
                name="ramGb"
                label="RAM (GB)"
                type="number"
                min="1"
                value={newVm.ramGb}
                onChange={handleVmFieldChange}
                placeholder="32"
              />
              <FormInput
                name="storageGb"
                label="Storage (GB)"
                type="number"
                min="1"
                value={newVm.storageGb}
                onChange={handleVmFieldChange}
                placeholder="1000"
              />
              <FormInput
                name="gpuModel"
                label="GPU Model"
                value={newVm.gpuModel}
                onChange={handleVmFieldChange}
                placeholder="NVIDIA RTX 3080"
              />
              <FormInput
                name="gpuVramGb"
                label="GPU VRAM (GB)"
                type="number"
                min="1"
                value={newVm.gpuVramGb}
                onChange={handleVmFieldChange}
                placeholder="10"
              />
              <FormInput
                name="pricePerHour"
                label="Price per Hour"
                type="number"
                min="0"
                step="0.01"
                value={newVm.pricePerHour}
                onChange={handleVmFieldChange}
                placeholder="5.50"
              />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-full border border-white/10 px-5 py-3 text-sm font-medium text-stone-200 transition hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isCreatingVm}
                className="rounded-full bg-lime-300 px-5 py-3 text-sm font-semibold text-stone-950 transition hover:-translate-y-0.5 hover:bg-lime-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isCreatingVm ? 'Creating...' : 'Create VM'}
              </button>
            </div>
          </form>
        </ModalShell>
      ) : null}
    </main>
  )
}

function FilterInput({ label, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-semibold uppercase tracking-[0.28em] text-stone-400">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-sm text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
      />
    </label>
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

function FormInput({ label, required = true, ...props }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-stone-100">{label}</span>
      <input
        {...props}
        required={required}
        className="w-full rounded-2xl border border-white/10 bg-stone-950/70 px-4 py-3 text-stone-100 outline-none transition focus:border-lime-300/50 focus:ring-2 focus:ring-lime-300/20"
      />
    </label>
  )
}

function ModalShell({ title, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-950/75 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/10 bg-stone-900 p-6 shadow-2xl shadow-black/40 sm:p-8">
        <h2 className="text-2xl font-semibold text-white">{title}</h2>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  )
}

export default VMCollectionPage
