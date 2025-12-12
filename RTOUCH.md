# RTOUCH (Beta 2)

Glassmorphism Home Assistant dashboard with drag & drop tiles, long-press modals, and proxy bridge for Supervisor ingress.

## Prerequisites
- Node.js 18+ (for local builds) and npm
- Home Assistant Supervisor environment (addon target)
- `SUPERVISOR_TOKEN` available in addon runtime (set via Supervisor)

## Project Structure
- Backend: Express proxy + watcher in repo root
- Frontend: React app in `client/` (Tailwind, @dnd-kit)
- Deploy: Copy `client/build` into addon `client/build` share

## Quickstart (Local Build)
**Fast path (builder)**
```powershell
cd d:\HA\RTOUCH
npm run builder
```
- Installs backend deps, installs frontend deps, and builds the client bundle once.

**Manual steps**
1) Install backend deps
   ```powershell
   cd d:\HA\RTOUCH
   npm install
   ```
2) Install frontend deps
   ```powershell
   cd d:\HA\RTOUCH\client
   npm install
   ```
3) Build frontend once (primes watcher)
   ```powershell
   cd d:\HA\RTOUCH\client
   npm run build
   ```
4) Start watcher/proxy (root)
   ```powershell
   cd d:\HA\RTOUCH
   npm run watch
   ```
   - Serves `client/build` and hot-restarts on build folder changes.

## Deploy to Home Assistant
**Fast path (deploy)**
```powershell
cd d:\HA\RTOUCH
npm run deploy
```
- Runs `deploy.bat` to build and copy `client/build` to your HA share.

**Manual steps**
1) Update `deploy.bat` with your Pi/HA IP in the `xcopy` path.
2) Run from repo root:
   ```powershell
   .\deploy.bat
   ```
3) Watcher inside the addon will reload on new `client/build` files.

## Configuration Notes
- Update entity IDs in `client/src/useHass.js` to match your HA setup.
- Update alarm code in `client/src/App.js` (alarm tile long-press behavior is currently noop; toggle uses code `1234` placeholder).
- Tailwind is configured via `client/tailwind.config.js` (CRA build already includes generated styles via class usage).

## Scripts
- Backend: `npm start` (runs `server.js`), `npm run watch` (watcher)
- Frontend: `npm start` (CRA dev), `npm run build` (production bundle)

## Troubleshooting
- Missing auth: ensure `SUPERVISOR_TOKEN` is injected in addon env.
- Stale UI: rerun `npm run build` in `client/` then redeploy/copy build.
- CRA warnings about deprecated packages are from upstream; safe to ignore for now. Run `npm audit` for details if desired.
