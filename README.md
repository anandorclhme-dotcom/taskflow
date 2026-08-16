# TaskFlow

A free, installable task/project/time management PWA.

## Current version
- Projects
- Tasks
- Due date/time
- Priority
- Estimated time
- Task completion
- Start/stop time tracking
- Dashboard statistics
- Local/offline storage
- Installable as an Android-style PWA

## Run locally
Use any static web server. For example:
`python -m http.server 8080`

Then open `http://localhost:8080`.

## Important
This version stores data locally in the browser. It does not yet have cloud login/synchronisation.

## Production upgrade
The next step is connecting Supabase for:
- user accounts
- cloud database
- multi-device sync
- secure backups
- team/shared projects

Then deploy the frontend to Vercel.
