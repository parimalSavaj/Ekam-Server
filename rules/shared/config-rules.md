# Shared Config Rules

## Location

- App configuration lives in `src/shared/config/index.ts`.
- This is the single source of truth for all environment variables.

## Structure

- Config is validated with Zod at boot time using `safeParse`.
- If any required env var is missing or invalid, the process exits immediately with a clear error message.
- Config is exported as a plain object (`export const config = { ... }`) — never a class, never a singleton service.

## Rules

- Never read `process.env` outside `src/shared/config/index.ts`.
- Required runtime settings must be explicit: do not add Zod defaults for `HOST`, `PORT`, or `NODE_ENV`. Missing, empty, or invalid required values fail startup.
- When the process sets `NODE_ENV=production`, skip local `.env` loading and validate deployment-provided variables. Production must explicitly supply its environment mode.
- For local development/tests, load only this repository's `.env` with an ESM module-relative path, without overriding process variables. A missing file is acceptable only if the process already supplies every required setting. Fail on other file-loading errors.
- Never use string defaults for secret values — fail fast if they are missing.
- All new env vars must be added to both the Zod schema and `.env.example`.
- Feature flags and environment-specific behaviour always come from `config` — never from inline `process.env.NODE_ENV` checks.
- Never hardcode default values for secrets (JWT secrets, DB password) — these must always be explicitly set.

## .env Files

- `.env` — local development values (gitignored).
- `.env.example` — template with all keys, no real values (committed).
- Keep `.env.example` in sync with the config schema at all times.
