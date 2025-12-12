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

- To override the destination, pass a path to `deploy.bat` (also works via npm). The default now deploys to `Z:\addons\local\rtouch\client\build`:
   ```powershell
   .\deploy.bat Z:\addons\local\rtouch\client\build
   # or
   npm run deploy -- Z:\addons\local\rtouch\client\build
   ```

Verification: The deploy process now verifies files after copying by comparing SHA256 hashes of local `client/build` and the remote destination. If verification fails the script exits non-zero and prints missing/mismatched files.

Security & Webhook secret
- Do NOT commit webhook secrets or tokens to the repository. The webhook secret value should be set in your environment or in GitHub/HA Secrets as `WEBHOOK_SECRET`. Example (do not store the real secret in repo):

   ```powershell
   # set in your shell (temporary)
   $env:WEBHOOK_SECRET = "<your-secret-here>"
   # or use GitHub Secrets named WEBHOOK_SECRET for Actions
   ```

- The backend exposes a `/webhook` endpoint that validates payloads using HMAC SHA256 against `WEBHOOK_SECRET`. The endpoint will reject requests if the signature does not match.

If you provided a webhook secret earlier in the chat, I did not and will not insert it into the repository — instead, set it in the environment or repository secrets before deploying.

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

## Publishing to GitHub (release branch + tag)

Follow these steps to prepare a release branch, tag the release, and push the repository to GitHub at `https://github.com/jevdesigns/rtouch-git.git`.

Notes before you begin:
- Do not commit secrets (see `.env.example`). Add any sensitive values to GitHub Secrets after pushing.
- Ensure `git` is installed and you have push permissions to the target repository. If the repo does not exist yet, create it on GitHub first.

Run these commands from the project root (`d:\HA\RTOUCH`):

```powershell
# Initialize repo if needed
git init

# Ensure main branch exists and is up-to-date locally
git checkout -B main

# Add all files and create a commit (use an appropriate commit message)
git add .
git commit -m "chore(release): prepare repository for release"

# Create a release branch (replace version with your release version)
git checkout -b release/v2.0.0

# Commit any final release changes if necessary
git add .
git commit -m "chore(release): prepare v2.0.0" || echo "No changes to commit"

# Create an annotated tag for the release
git tag -a v2.0.0 -m "Release v2.0.0"

# Add the remote (replace if remote already exists)
git remote add origin https://github.com/jevdesigns/rtouch-git.git

# Push the release branch and tag
git push -u origin release/v2.0.0
git push origin v2.0.0

# (optional) push main branch as well
git push -u origin main
```

Using HTTPS and authentication
- If pushing over HTTPS, Git may prompt for credentials. For automation use a Personal Access Token (PAT) with `repo` scopes or set up `gh` CLI authentication.
- Example with `gh` (recommended):

```powershell
gh auth login
gh repo create jevdesigns/rtouch-git --public --source=. --remote=origin
git push -u origin release/v2.0.0
git push origin v2.0.0
```

After pushing
- Add `WEBHOOK_SECRET`, `SUPERVISOR_TOKEN`, and any other secrets to GitHub repository Settings → Secrets → Actions (or to your addon runtime where appropriate).
- Create a GitHub Release from the pushed tag, attach the `client-build` artifact from CI if desired, and publish.

