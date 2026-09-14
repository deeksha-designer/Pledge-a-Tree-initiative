# JK Maxx Paints — Pledge a Tree

A responsive campaign landing page with a shared pledge counter and form submission flow.

## Run locally

1. Install Node.js 18 or newer.
2. Open this folder in a terminal.
3. Run `npm start`.
4. Visit `http://localhost:4173`.

No third-party packages or installation step are required. Pledges are stored in `data/pledges.json` and the public count refreshes every 30 seconds.

## Production note

The included JSON storage is appropriate for a single-server campaign preview. Before high-traffic deployment, replace `readData` / `writeData` in `server.js` with your production database and connect the consent language to the approved JK Maxx privacy policy.
