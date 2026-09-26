# Portfolio assistant web

Public standalone Next.js client for the portfolio assistant. It contains no model credentials and calls the API directly using a pinned v1 contract snapshot. Fixture mode shows deterministic source excerpts.

## Local preview

Start the [API and databases](https://github.com/gonzalomartinperez/portfolio-assistant-api) first. In this WSL checkout run `nvm use && npm ci && npm run dev`, then open `http://localhost:3001`. The API default is `http://localhost:8000`; set `NEXT_PUBLIC_ASSISTANT_API_URL` only to a public API origin if you change ports or deploy later. Never put a model key in a `NEXT_PUBLIC_*` variable.

Run `npm test && npm run build` for parser and build checks. See `IMPLEMENTATION_STATUS.md` for the current gate results.
