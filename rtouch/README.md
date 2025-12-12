# RTOUCH Add-on

This folder contains the Home Assistant add-on for RTOUCH. To install this add-on from a custom repository, add the repository URL in Supervisor → Add-on stores.

Files included:
- `config.json` — add-on metadata used by Supervisor
- `Dockerfile` — container build
- `run.sh` — add-on startup script

Notes:
- Set `SUPERVISOR_TOKEN` and `WEBHOOK_SECRET` in addon options or environment; do not commit secrets to the repository.
- The repo root also contains the full project sources; the add-on folder packages the runtime files.
