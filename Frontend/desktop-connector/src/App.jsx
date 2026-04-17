import { useMemo, useState } from 'react'
import { open as openDialog } from '@tauri-apps/plugin-dialog'
import { Command } from '@tauri-apps/plugin-shell'

const FALLBACK_STAGE = {
  stage: 'idle',
  status: 'waiting',
  message: 'Choose a connector folder.',
}

const PYTHON_COMMANDS = [
  { scope: 'venv-python-agent', label: '.venv/bin/python' },
  { scope: 'python3-agent', label: 'python3' },
  { scope: 'python-agent', label: 'python' },
  { scope: 'py-agent', label: 'py' },
]

function App() {
  const [connectorDir, setConnectorDir] = useState('')
  const [selectedRuntime, setSelectedRuntime] = useState('auto')
  const [isRunning, setIsRunning] = useState(false)
  const [isPreparing, setIsPreparing] = useState(false)
  const [activeRuntimeLabel, setActiveRuntimeLabel] = useState('')
  const [stageEvent, setStageEvent] = useState(FALLBACK_STAGE)
  const [logs, setLogs] = useState([])
  const [childProcess, setChildProcess] = useState(null)

  const statusTone = useMemo(() => {
    if (stageEvent.status === 'failed') return 'rose'
    if (isRunning) return 'emerald'
    return 'amber'
  }, [isRunning, stageEvent.status])

  const appendLog = (entry) => {
    setLogs((current) => [entry, ...current].slice(0, 160))
  }

  const buildAgentArgs = () => ['agent.py']

  const buildAutoRuntimeCandidates = () => {
    const orderedRuntimes = [...PYTHON_COMMANDS]
    const selected = orderedRuntimes.find((runtime) => runtime.scope === selectedRuntime)

    if (selectedRuntime !== 'auto' && selected) {
      return [selected]
    }

    return orderedRuntimes
  }

  const wireCommand = (command, runtimeLabel) => {
    command.stdout.on('data', (line) => handleOutput(line, 'stdout'))
    command.stderr.on('data', (line) => handleOutput(line, 'stderr'))
    command.on('close', (event) => {
      setIsRunning(false)
      setChildProcess(null)
      setStageEvent({
        stage: 'process',
        status: event.code === 0 ? 'completed' : 'failed',
        message:
          event.code === 0
            ? 'Connector stopped cleanly.'
            : `Connector exited with code ${event.code}.`,
      })
    })
    command.on('error', (event) => {
      appendLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        type: 'process',
        message: `${runtimeLabel}: ${String(event)}`,
      })
    })
  }

  const handleBrowse = async () => {
    try {
      const selected = await openDialog({
        directory: true,
        multiple: false,
        title: 'Choose Connector Folder',
      })

      if (typeof selected === 'string') {
        setConnectorDir(selected)
        setStageEvent({
          stage: 'config',
          status: 'ready',
          message: 'Folder selected.',
        })
      }
    } catch (error) {
      appendLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        type: 'ui',
        message: String(error),
      })
    }
  }

  const startConnector = async () => {
    if (!connectorDir || isRunning || isPreparing) {
      return
    }

    setStageEvent({
      stage: 'startup',
      status: 'running',
      message: 'Starting connector...',
    })

    const runtimes = buildAutoRuntimeCandidates()
    let lastError = null

    for (const runtime of runtimes) {
      try {
        const command = Command.create(runtime.scope, buildAgentArgs(), {
          cwd: connectorDir,
        })
        wireCommand(command, runtime.label)

        const child = await command.spawn()
        setChildProcess(child)
        setIsRunning(true)
        setActiveRuntimeLabel(runtime.label)
        setStageEvent({
          stage: 'process',
          status: 'running',
          message: `Connector started with ${runtime.label}.`,
        })
        appendLog({
          timestamp: new Date().toISOString(),
          level: 'INFO',
          type: 'process',
          message: `Spawned connector process via ${runtime.label} (pid ${child.pid}).`,
        })
        return
      } catch (error) {
        lastError = error
      }
    }

    setIsRunning(false)
    setChildProcess(null)
    setStageEvent({
      stage: 'startup',
      status: 'failed',
          message: 'Could not start the connector.',
    })
    appendLog({
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      type: 'process',
      message: String(lastError),
    })
  }

  const prepareEnvironment = async () => {
    if (!connectorDir || isRunning || isPreparing) {
      return
    }

    setIsPreparing(true)
    setStageEvent({
      stage: 'environment',
      status: 'running',
      message: 'Preparing environment...',
    })

    try {
      await runSetupCommand('python3-agent', ['-m', 'venv', '.venv'], 'python3 -m venv .venv')
      await runSetupCommand(
        'venv-python-agent',
        ['-m', 'pip', 'install', '-r', 'requirements.txt'],
        '.venv/bin/python -m pip install -r requirements.txt',
      )
      setStageEvent({
        stage: 'environment',
        status: 'completed',
        message: 'Environment ready.',
      })
    } catch (error) {
      setStageEvent({
        stage: 'environment',
        status: 'failed',
        message: 'Could not prepare the environment.',
      })
      appendLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        type: 'environment',
        message: String(error),
      })
    } finally {
      setIsPreparing(false)
    }
  }

  const runSetupCommand = async (scope, args, label) => {
    appendLog({
      timestamp: new Date().toISOString(),
      level: 'INFO',
      type: 'environment',
      message: `Running ${label}`,
    })

    const command = Command.create(scope, args, {
      cwd: connectorDir,
    })

    command.stdout.on('data', (line) => handleOutput(line, 'stdout'))
    command.stderr.on('data', (line) => handleOutput(line, 'stderr'))

    const output = await command.execute()
    if (output.code !== 0) {
      throw new Error(`${label} exited with code ${output.code}`)
    }
  }

  const stopConnector = async () => {
    if (!childProcess) {
      return
    }

    try {
      await childProcess.kill()
      setStageEvent({
        stage: 'process',
        status: 'stopping',
        message: 'Stopping connector...',
      })
    } catch (error) {
      appendLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        type: 'process',
        message: `Could not stop connector: ${String(error)}`,
      })
    }
  }

  const handleOutput = (rawLine, source) => {
    const line = String(rawLine).trim()
    if (!line) {
      return
    }

    try {
      const parsed = JSON.parse(line)
      appendLog(parsed)
      if (parsed.type === 'stage') {
        setStageEvent(parsed)
      }
      return
    } catch {
      appendLog({
        timestamp: new Date().toISOString(),
        level: source === 'stderr' ? 'ERROR' : 'INFO',
        type: source,
        message: line,
      })
    }
  }

  return (
    <main className="shell-app">
      <section className="hero-card">
        <div>
          <p className="eyebrow">Desktop Connector</p>
          <h1>Provider Connector</h1>
        </div>
        <div className={`status-pill status-pill--${statusTone}`}>
          <span>{isRunning ? 'Running' : 'Idle'}</span>
          <strong>{stageEvent.stage}</strong>
        </div>
      </section>

      <section className="grid-layout">
        <article className="panel">
          <h2>Connector Folder</h2>

          <label className="field">
            <span>Folder path</span>
            <input
              value={connectorDir}
              onChange={(event) => setConnectorDir(event.target.value)}
              placeholder="/Users/alex/Downloads/my-vm-connector"
            />
          </label>

          <label className="field">
            <span>Python runtime</span>
            <select
              value={selectedRuntime}
              onChange={(event) => setSelectedRuntime(event.target.value)}
            >
              <option value="auto">Auto detect</option>
              {PYTHON_COMMANDS.map((runtime) => (
                <option key={runtime.scope} value={runtime.scope}>
                  {runtime.label}
                </option>
              ))}
            </select>
          </label>

          <div className="actions">
            <button type="button" className="button button--secondary" onClick={handleBrowse}>
              Browse Folder
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={prepareEnvironment}
              disabled={!connectorDir || isRunning || isPreparing}
            >
              {isPreparing ? 'Preparing...' : 'Prepare Environment'}
            </button>
            <button type="button" className="button button--primary" onClick={startConnector}>
              Start Connector
            </button>
            <button
              type="button"
              className="button button--ghost"
              onClick={stopConnector}
              disabled={!isRunning}
            >
              Stop
            </button>
          </div>

          <div className="runtime-note">
            <strong>Active runtime:</strong> {activeRuntimeLabel || 'not started yet'}
          </div>
        </article>

        <article className="panel">
          <h2>Current Stage</h2>
          <div className="stage-card">
            <p className="stage-name">{stageEvent.stage}</p>
            <p className="stage-status">{stageEvent.status}</p>
            <p className="stage-message">{stageEvent.message}</p>
          </div>
        </article>
      </section>

      <section className="panel log-panel">
        <div className="log-header">
          <h2>Live Logs</h2>
          <span>{logs.length} recent events</span>
        </div>

        <div className="log-feed">
          {logs.length === 0 ? (
            <p className="log-empty">No logs yet.</p>
          ) : (
            logs.map((entry, index) => (
              <article key={`${entry.timestamp || 'log'}-${index}`} className="log-entry">
                <div className="log-meta">
                  <span>{entry.timestamp || 'no timestamp'}</span>
                  <span>{entry.level || 'INFO'}</span>
                  <span>{entry.type || 'log'}</span>
                </div>
                <p>{entry.message || JSON.stringify(entry)}</p>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  )
}

export default App
