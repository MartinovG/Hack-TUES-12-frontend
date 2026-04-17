# Hive Desktop Connector

This subproject is the native desktop shell for the provider connector flow.

## Why it exists

The web dashboard now downloads a preconfigured connector bundle, but the user still needs a friendlier way to launch and monitor the Python agent. This Tauri app is the next step: it starts the Python connector as a managed child process and shows the structured `--json-logs` output in a desktop UI.

## Planned workflow

1. The provider downloads the VM-specific connector zip from the web dashboard.
2. The provider extracts the zip somewhere on the laptop.
3. This desktop app points to that folder, prepares a local `.venv`, and launches `agent.py --config connector-config.json --json-logs`.
4. The UI displays dependency checks, registration state, provisioning progress, and failures.

## Install dependencies

This scaffold was added without running package installation in this environment, so the first local setup step is:

```bash
npm install
```

Inside `src-tauri`, install Rust dependencies with Cargo after the Rust toolchain is present.

## Commands

```bash
npm run tauri:dev
npm run tauri:build
```

## Notes

- The shell permissions are scoped to `.venv/bin/python`, `python3`, `python`, and `py`.
- The app uses the Tauri shell plugin `cwd` option so it can run against the extracted connector bundle directory.
- Rust was not available in this environment, so native compilation was not verified here.
