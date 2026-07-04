# Tikit

Internal project tracker — a Jira-like board tool whose distinguishing
feature is tight GitHub linkage: **pull requests link to tickets automatically by
key**. It's a hosted, multi-user web app for a small internal team.

> The canonical product/architecture spec lives in [`Claude.md`](./Claude.md) and
> [`DomainModel.md`](./DomainModel.md). When a decision changes, update those first,
> then the code. This README is the operational guide (run it, deploy it, find your
> way around).

---

## What this project is

Tikit is a board-based ticket tracker:

- **Boards** map one-to-one to a **Project**, and each project links to a **GitHub
  repository**. You can switch between boards and create/delete them in-app.
- **Tickets** live in user-defined, ordered **columns** and are dragged between them
  (no enforced workflow — "Done" is just a column). Each ticket has a stable key like
  `WEB-42` (project key + a per-project sequential number), a required **category**
  (Bug / Feature / Discovery / Maintenance), an optional assignee, and a reporter.
- **Archiving** is soft and terminal: drag a card to the archive drop-zone, pick a
  reason + optional note. Archived tickets keep their column and are restorable.
- **PR ↔ ticket linking** is the headline feature. A GitHub webhook fires on pull-request
  events; Tikit parses a key in brackets at the end of the PR title (e.g.
  `Fix checkout flow [WEB-42]`) and links the PR to that ticket. PRs with no/invalid/
  dangling keys are kept in an **"unlinked PRs"** surface, never dropped. Linking is
  read-only — Tikit never writes back to GitHub.
- **Auth** is GitHub OAuth only (no passwords), gated by a **login allowlist** — a
  GitHub account can only sign in / be provisioned if its login is on the allowlist.

Access is flat: any signed-in user can view and edit any board (no roles yet).

Deferred/out of scope for now: Discord notifications (Tier 1 planned), ticket links
(blocks/relates-to), roles & permissions, and ticket hard-delete. See `Claude.md §7`.

---

## Tech Stack

| Layer             | Choice                                     |
| ----------------- | ------------------------------------------ |
| Language          | Ruby 4.0.5 (see `.ruby-version`)           |
| Framework         | Rails 8.1                                  |
| Database          | PostgreSQL (14+)                           |
| Frontend          | Inertia.js + React 19 (JavaScript/JSX)     |
| Asset bundler     | Vite (`vite_rails` + `vite-plugin-ruby`)   |
| Styling           | Tailwind CSS 4 + DaisyUI 5                 |
| Drag & drop       | @dnd-kit                                   |
| Background jobs   | Solid Queue                                |
| Cache / WebSocket | Solid Cache / Solid Cable                  |
| Auth              | GitHub OAuth via OmniAuth                  |
| GitHub API        | Octokit (repo lookup when creating boards) |
| Web server        | Puma                                       |
| Tests             | RSpec + FactoryBot                         |

The frontend is deliberately **off the Rails 8 default path** (no Hotwire/importmaps) —
a React/Inertia/Tailwind UI wants a JS bundler, so Vite replaces Propshaft+importmaps.

---

## Architecture Overview

Tikit is a single Rails app that serves a React SPA through **Inertia** — no separate
API. Controllers render Inertia "pages" (React components) with props instead of HTML
or JSON; the React side (`app/frontend`) is bundled by Vite.

```
Browser (React 19 / Inertia)
      │  Inertia visits (XHR) + full-page OAuth form posts
      ▼
Rails 8 (Puma)
 ├─ Inertia controllers  → render inertia: "Board" / "Login" / "NoBoards"  (props via presenters)
 ├─ Auth (OmniAuth GitHub) → allowlist gate → session[:user_id]
 ├─ Webhooks::GithubController → HMAC-verified PR events → PullRequestSync → link by key
 └─ Solid Queue / Cache / Cable
      ▼
PostgreSQL
      ▲
GitHub  ──(OAuth login)──▶  and  ──(PR webhook, read-only)──▶  Rails
```

Request flow, concretely:

- **Login.** `Continue with GitHub` is a real form POST to OmniAuth's request phase
  (`/auth/github`). On callback, `SessionsController#create` checks the GitHub login
  against the allowlist, provisions/updates a `User` keyed on the stable `github_id`,
  and sets the session. `ApplicationController#require_authentication` locks every other
  controller; unauthenticated requests redirect to `/login`.
- **Board.** `BoardsController#show` loads a project and renders the `Board` page with
  columns, tickets (+ their linked PRs), team, and the unlinked-PR list. Ticket create/
  edit/move/archive and column/board CRUD post back and re-render via Inertia redirects.
- **PR linking.** GitHub sends `pull_request` events to `POST /webhooks/github`. The
  controller verifies the `X-Hub-Signature-256` HMAC, then `Github::PullRequestSync`
  upserts the PR (idempotent on `github_pr_id`), maps its state, and links it to a ticket
  via `PullRequest#resolve_ticket` (parses `[KEY-n]` at the end of the title). Re-runs on
  `edited` so retitles re-link.

Key domain models: `User`, `Project`, `Repository`, `Column`, `Ticket`, `PullRequest`,
`Activity` (append-only event stream), and `TicketLink` (defined, not yet surfaced). The
full model is documented in `Claude.md §5` / `DomainModel.md`.

CSRF: Inertia's axios instance sends the Rails authenticity token as `X-CSRF-Token`
(wired in `app/frontend/entrypoints/inertia.jsx`); the webhook endpoint is exempt and
verified by HMAC instead.

---

## Getting Started

### Prerequisites

- **Ruby 4.0.5** — via a version manager (rbenv/asdf). `.ruby-version` pins it.
- **Node 20+** and npm (Node 22+ recommended) — for the Vite build.
- **PostgreSQL 14+** running locally and reachable on the default socket/port.

### First-time setup

```bash
# from the repo root
bin/setup          # bundle install, npm install, prepares the DB, seeds, starts the app
```

`bin/setup` is idempotent. If you prefer to do it by hand:

```bash
bundle install
npm install
bin/rails db:prepare   # create + migrate (primary, cache, queue, cable) and seed
bin/dev                # boots Rails (:3000) + the Vite dev server (:3036) via Procfile.dev
```

Then open **http://localhost:3000**.

> **Use port 3000, not the Vite port.** `bin/dev` runs two processes: Rails on **:3000**
> (what you browse) and Vite on **:3036** (assets/HMR only). The GitHub OAuth callback
> is registered against `:3000`.

### Signing in locally

- **With real GitHub OAuth:** set `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` /
  `GITHUB_ALLOWLIST` (see below), restart, and click _Continue with GitHub_.
- **Without OAuth configured:** in development only, the login page shows a **"Dev
  sign-in"** button that logs in a seeded user. It disappears automatically once
  `GITHUB_CLIENT_ID` is set.

The seed (`db/seeds.rb`) creates a demo `WEB` board (Acme Web App) with a team, columns,
and tickets so the board isn't empty on first run.

### Local env & the rbenv shim

Environment variables are loaded from `.env` / `.env.local` in development via
`dotenv-rails` (both are gitignored; copy `.env.example` to start). Restart the server
after changing them.

> If your shell's `rbenv` wrapper shadows the `rails` shim (you'll see
> `command not found: _rails_command`), run commands through `bin/rails …` /
> `bin/rake …`, or prefix with `RBENV_VERSION=4.0.5 ruby -S rails …`.

### Running the tests

```bash
bundle exec rspec
```

### Testing the PR webhook locally

Expose your local server with a tunnel (e.g. `ngrok http 3000`) and point a GitHub App/
repo webhook at `https://<tunnel>/webhooks/github` for **Pull request** events, with the
secret set to `GITHUB_WEBHOOK_SECRET`. Or POST a sample payload directly — when
`GITHUB_WEBHOOK_SECRET` is unset, signature verification is skipped in dev/test:

```bash
curl -X POST http://localhost:3000/webhooks/github \
  -H 'Content-Type: application/json' -H 'X-GitHub-Event: pull_request' \
  -d '{"action":"opened",
       "repository":{"id":900001,"full_name":"acme/web-app"},
       "pull_request":{"id":111,"number":1,"title":"Fix login [WEB-101]",
         "html_url":"https://github.com/acme/web-app/pull/1","state":"open",
         "merged":false,"user":{"login":"octocat"}}}'
```

---

## Environment Variables

| Variable                | Required           | Purpose                                                                                                                                                                                                |
| ----------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `GITHUB_CLIENT_ID`      | Yes (real login)   | GitHub OAuth App client ID. When unset in dev, the "Dev sign-in" fallback is shown.                                                                                                                    |
| `GITHUB_CLIENT_SECRET`  | Yes (real login)   | GitHub OAuth App client secret.                                                                                                                                                                        |
| `GITHUB_ALLOWLIST`      | Yes (prod)         | Comma-separated GitHub **logins** allowed to sign in, e.g. `alice,bob,carol`. Your own login must be included. In dev, if unset, falls back to the seeded team. Setting it **replaces** that fallback. |
| `GITHUB_WEBHOOK_SECRET` | Yes (prod)         | Shared secret for verifying `X-Hub-Signature-256` on PR webhooks. If unset, verification is skipped in dev/test only — **never leave unset in production.**                                            |
| `GITHUB_TOKEN`          | Optional           | A token so the "new board" repo lookup can resolve **private** repos (public repos work without it).                                                                                                   |
| `RAILS_MASTER_KEY`      | Yes (prod)         | Decrypts `config/credentials.yml.enc`. Do not commit; provide as an env var in prod.                                                                                                                   |
| `DATABASE_URL`          | Yes (prod, Render) | Postgres connection string. See Deployment for how it maps to the Solid databases.                                                                                                                     |
| `RAILS_MAX_THREADS`     | Optional           | Puma threads / DB pool size (default 5).                                                                                                                                                               |
| `WEB_CONCURRENCY`       | Optional           | Puma worker processes in production.                                                                                                                                                                   |

For local dev, put these in `.env.local` (see `.env.example`). Never commit real secrets.

---

## Deployment

Target platform: **Render**. The app has three infra pieces: a **web service** (Rails/
Puma), a **background worker** (Solid Queue), and **PostgreSQL**.

### Database & jobs (single Postgres)

Production uses **one** Postgres, connected via `DATABASE_URL` (`config/database.yml`).
Solid Queue / Cache / Cable share that database — their tables are created by regular
migrations (`db/migrate/*_create_solid_*`), so `bin/rails db:prepare` sets everything up
and is safe to re-run on every deploy. There's no `TIKIT_DATABASE_PASSWORD` and no extra
databases to provision.

### ⚠️ One thing to get right before you deploy

**Node must be available at build time.** `rails assets:precompile` runs the **Vite
build**, which needs Node + npm. Render's native **Ruby** runtime installs Node
automatically when a `package.json` is present, so the native path works. If you deploy
via the bundled `Dockerfile` instead, note it does **not** install Node as generated —
you'd need to add Node + `npm ci` + the Vite build to it. The native Ruby runtime is the
simpler path.

### Render setup (native Ruby runtime)

**PostgreSQL:** create a managed Postgres instance; Render exposes its `DATABASE_URL`.

**Web service** (Environment: Ruby):

- **Build command:**
  ```bash
  bundle install && npm ci && bundle exec rails assets:precompile
  ```
- **Pre-deploy / release command** (runs migrations safely on each deploy):
  ```bash
  bundle exec rails db:prepare
  ```
- **Start command:**
  ```bash
  bundle exec puma -C config/puma.rb
  ```

**Background worker** (Environment: Ruby, no HTTP port) — required so jobs actually run:

- **Start command:**
  ```bash
  bin/jobs
  ```

**Environment variables** (both web + worker): `RAILS_ENV=production`,
`RAILS_MASTER_KEY`, `DATABASE_URL`, `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`,
`GITHUB_ALLOWLIST`, `GITHUB_WEBHOOK_SECRET`, and optionally `GITHUB_TOKEN`.
`RAILS_LOG_TO_STDOUT=1` is helpful for Render's log stream.

### After the first deploy

1. **GitHub OAuth App:** set the Authorization callback URL to
   `https://<your-app>.onrender.com/auth/github/callback`, and the Homepage URL to your
   app's base URL. Put the client id/secret in Render env vars.
2. **GitHub webhook:** point the repo/GitHub-App webhook at
   `https://<your-app>.onrender.com/webhooks/github` for **Pull request** events, with the
   secret matching `GITHUB_WEBHOOK_SECRET`.
3. **Allowlist:** make sure every teammate's GitHub login is in `GITHUB_ALLOWLIST`.

### `render.yaml` blueprint (optional starting point)

```yaml
databases:
  - name: tikit-db
    plan: basic-256mb

services:
  - type: web
    name: tikit-web
    runtime: ruby
    plan: starter
    buildCommand: bundle install && npm ci && bundle exec rails assets:precompile
    preDeployCommand: bundle exec rails db:prepare
    startCommand: bundle exec puma -C config/puma.rb
    envVars:
      - key: RAILS_ENV
        value: production
      - key: RAILS_MASTER_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase: { name: tikit-db, property: connectionString }
      - key: GITHUB_CLIENT_ID
        sync: false
      - key: GITHUB_CLIENT_SECRET
        sync: false
      - key: GITHUB_ALLOWLIST
        sync: false
      - key: GITHUB_WEBHOOK_SECRET
        sync: false

  - type: worker
    name: tikit-worker
    runtime: ruby
    plan: starter
    buildCommand: bundle install
    startCommand: bin/jobs
    envVars:
      - key: RAILS_ENV
        value: production
      - key: RAILS_MASTER_KEY
        sync: false
      - key: DATABASE_URL
        fromDatabase: { name: tikit-db, property: connectionString }
      - key: GITHUB_WEBHOOK_SECRET
        sync: false
```

> Treat this blueprint as a starting point — confirm plan sizes and region for your
> account before relying on it.

---

## Project Structure

```
app/
├─ controllers/
│  ├─ application_controller.rb     # auth gate + current_user + shared Inertia props
│  ├─ boards_controller.rb          # renders the Board page (props)
│  ├─ tickets_controller.rb         # create / update / move / archive / restore
│  ├─ columns_controller.rb         # add / remove columns
│  ├─ projects_controller.rb        # create / delete boards (+ repo resolution)
│  ├─ sessions_controller.rb        # GitHub OAuth login / logout / dev sign-in
│  └─ webhooks/github_controller.rb # signed PR webhook receiver
├─ models/                          # User, Project, Repository, Column, Ticket,
│                                   # PullRequest, Activity, TicketLink, GithubAllowlist
├─ presenters/                      # UserPresenter, TicketPresenter, PullRequestPresenter
├─ services/
│  ├─ github_repo_resolver.rb       # Octokit lookup of a repo's id when creating a board
│  └─ github/
│     ├─ webhook_signature.rb       # HMAC-SHA256 verification
│     └─ pull_request_sync.rb       # upsert PR + link by key
└─ frontend/                        # Vite root
   ├─ entrypoints/                  # inertia.jsx (app mount + CSRF), application.css (theme)
   ├─ pages/                        # Board.jsx, Login.jsx, NoBoards.jsx (Inertia pages)
   ├─ components/board/             # TopBar, BoardSwitcher, ColumnView, TicketCard,
   │                                # TicketModal, Archive*/NewBoard*/DeleteBoard* modals, etc.
   └─ lib/board.js                  # shared UI helpers (colors, initials, PR state)

config/
├─ routes.rb
├─ database.yml                     # primary + cache/queue/cable (Solid) in production
├─ initializers/omniauth.rb         # GitHub provider + failure handler
├─ initializers/github_allowlist.rb # builds the allowlist from GITHUB_ALLOWLIST
└─ vite.json / vite.config.ts

db/                                 # migrations, schema, seeds
spec/                               # RSpec: requests/, models/, factories/, support/
public/brand/                       # logo assets used by the login/empty pages
Claude.md, DomainModel.md           # source-of-truth product/domain spec
```

---

## External Dependencies

Tikit depends on these external services and integrations:

- **PostgreSQL** — primary datastore; also backs Solid Queue/Cache/Cable.
- **GitHub OAuth App** — the only sign-in method. Provides identity
  (`github_id`, login, name, avatar). Requires `GITHUB_CLIENT_ID`/`_SECRET` and a
  registered callback URL.
- **GitHub webhooks (PR events)** — inbound, HMAC-verified. Drives PR ↔ ticket linking.
  Read-only: Tikit never calls back to mutate GitHub. Requires `GITHUB_WEBHOOK_SECRET`.
- **GitHub REST API (via Octokit)** — used only to resolve a repository's stable id when
  a board is created/linked. Public repos need no token; private repos need `GITHUB_TOKEN`.
- **Render** — hosting (web + worker + Postgres). See Deployment.
- **Discord** — _planned, not yet built._ Outbound webhook notifications (Tier 1) will run
  off the `Activity` stream via a background job.

Notable libraries (see `Gemfile` / `package.json`): `inertia_rails`, `vite_rails`,
`omniauth-github`, `omniauth-rails_csrf_protection`, `octokit`, `solid_queue`,
`solid_cache`, `solid_cable` (Ruby); `@inertiajs/react`, `react`, `@dnd-kit/*`,
`tailwindcss`, `daisyui`, `axios` (JS).
