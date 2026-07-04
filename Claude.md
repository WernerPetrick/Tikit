# Tikit

> Internal project tracker for Puzzl. A Jira-like tool whose distinguishing feature is tight GitHub linkage: pull requests link to tickets automatically by key. Hosted web app (not a desktop app — see _Architecture decisions_).

This document is the source of truth. When a decision changes, **update this file first**, then the code.

---

## 1. What Tikit is

A board-based ticket tracker for a small internal team (~5 people at Puzzl). Projects map to GitHub repositories; tickets live in user-defined columns on a per-project board; pull requests link to tickets by a key embedded in the PR title (`[PROJ-42]`). Archived tickets are retained and browsable per project. Activity is recorded as an immutable event stream that also drives Discord notifications.

The defining capability is the **PR ↔ ticket link**, so the model and features orbit that.

---

## 2. Tech stack

| Layer           | Choice                        | Notes                                                                                                              |
| --------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Language        | **Ruby 4.0.x**                | Latest stable                                                                                                      |
| Framework       | **Rails 8.1.x**               |                                                                                                                    |
| Database        | **PostgreSQL**                | Chosen over SQLite because the app is multi-user/hosted from day one                                               |
| Frontend        | **Inertia + React 19**        | SPA-feel without a separate API                                                                                    |
| Bundler         | **Vite** (`vite_rails`)       | Deliberately _not_ Rails 8's default Propshaft + importmaps — a React/Inertia/Tailwind frontend wants a JS bundler |
| Styling         | **Tailwind CSS + DaisyUI**    | DaisyUI is a Tailwind plugin; component styling layer                                                              |
| Drag & drop     | **@dnd-kit**                  | See _Architecture decisions_ for why not the alternatives                                                          |
| Background jobs | **Solid Queue**               | Polling cadence (if any), Discord fan-out, webhook processing                                                      |
| GitHub          | **GitHub App**                | Auth (OAuth) + PR webhooks; read-only PR scope                                                                     |
| Discord         | Incoming **webhook** (Tier 1) | Outbound notifications; HTTP interactions for Tier 2 later                                                         |

---

## 3. Architecture decisions

Recorded with reasoning so they don't get relitigated by accident.

### Hosted from day one (not a desktop app)

The project began as a "local Ruby desktop app" idea. That was abandoned once team use became likely: a shared tracker needs a single source of truth, which N local SQLite files can't provide. Hosting also **solves PR linking for free** — a public URL means GitHub webhooks work, so PR→ticket linking is near-instant via webhook rather than the polling workaround a local app would have forced.

### Inertia + React via Vite, off the Rails default path

Rails 8 ships assuming Hotwire + importmaps. Tikit's React/Inertia/DaisyUI frontend means running Vite instead. This is a conscious divergence from "the Rails 8 way," well-trodden for Inertia-on-Rails, chosen for the richer drag-and-drop UI.

### @dnd-kit for the board

- `react-beautiful-dnd` is **deprecated** (Atlassian stopped maintaining it) — not an option despite older tutorials.
- `@atlaskit/pragmatic-drag-and-drop` is Atlassian's replacement and wins at Jira-scale (500+ cards/board) but is more headless with thinner docs.
- **@dnd-kit** is the community standard — small, accessible, well-documented, used by Linear for issue reordering. The scale advantage of Pragmatic won't materialize for a small-team tracker; dnd-kit's docs matter more. Switching later would be a contained refactor of the board component.

DaisyUI (styled) and dnd-kit (headless behavior) compose cleanly — wrap a DaisyUI card in dnd-kit's draggable.

### GitHub App (not a Personal Access Token)

For multi-repo, multi-user use the GitHub App is the right primitive: per-repo installation, built-in webhook delivery, its own identity. Scope is **read-only PRs + the PR webhook** — that's all that's needed now that Issues sync is out.

### PR linking is webhook-driven and read-only

GitHub's entire role is: receive the PR webhook, parse the key from the title, link. No writes back to GitHub.

---

## 4. Feature spec (locked)

### Boards & columns

- Columns are **per-project**, user-defined, ordered, with **no enforced workflow transitions** (free movement between any columns). "Done" is just a column, carries no special meaning.
- Tickets are dragged between columns and reordered within a column (dnd-kit persists `position`).

### Tickets

- Create, edit, assign / reassign (assignee nullable — unassigned is valid).
- Each ticket has a stable key `PROJ-42` derived from the project key + a per-project sequential number.
- **Category** is chosen at creation, required: Bug, Feature, Discovery, or Maintenance.

### Ticket links

- A ticket can be marked **blocked by** / **blocks** another ticket, or **related to** another ticket.
- **Cross-project links are allowed** (dependencies legitimately cross repos/projects).
- **Visual-only for now:** blocked status shows a badge and lists the linked tickets; it does not prevent any column move. Active gating is a deferred feature.

### Archive

- **Trigger:** while a user is dragging a ticket, an **Archive drop-zone appears fixed at the bottom of the screen**; dropping the card there archives it.
- **Modal on archive:** asks for a **reason** (dropdown) plus an optional **note** (free text). Seeded reasons: _Completed, Won't do, Duplicate, Out of scope, Obsolete_.
- Archive is **soft and terminal** — no hard delete. The ticket is retained, keeps its column (archived state is orthogonal to column), and is **restorable** (restore returns it to the column it was in).
- Each project has its **own archived section**; no global cross-project archive view for now.

### PR ↔ ticket linking

- Convention: ticket key in **brackets at the end of the PR title**, e.g. `Fix checkout flow [PROJ-42]`.
- Parse the key → split into project key + number → resolve to ticket. Re-run on the **PR-edited** webhook so retitles re-link.
- A PR with no key, a malformed key, or a key pointing at a non-existent ticket is stored **unlinked but visible** (an "unlinked PRs" surface) — never silently dropped.
- Linking is purely app-key based; it does not depend on any GitHub _issue_ existing.

### GitHub Issues

- **Not synced at all.** No issue→ticket creation, no ticket→issue closing. This was explicitly dropped to remove bidirectional sync (echo loops, two-tracker problem). GitHub is read-only for PRs only.

### Users & access

- Authenticated via **GitHub OAuth** (no passwords).
- **No roles/permissions** — flat access; any user can view and edit any project. (This is the main thing that would need rework if external clients ever got access.)
- **Provisioning: GitHub-login allowlist.** A user is created only if their GitHub login is on an allowlist (or passes an org-membership check). Authenticating via the GitHub App is _not_ sufficient on its own — this is a security boundary, so self-provisioning by any GitHub user is prevented.

### Discord integration (tiered)

- **Tier 1 — outbound notifications (build with core).** App POSTs to a Discord incoming webhook on events (ticket created, moved to a column, archived, PR linked). Driven off the Activity stream. No bot, no gateway.
- **Tier 2 — slash commands (fast-follow).** `/ticket create`, `/ticket assign`, etc. via Discord **HTTP interactions** (registered endpoint URL, signed POSTs, request/response) — no persistent gateway process, which fits the hosted Rails model.
- **Tier 3 — rich two-way (shelved).** Per-ticket threads, reaction-driven status, cross-system identity mapping. Overkill for now.

---

## 5. Domain model

### User

GitHub OAuth; allowlist-gated provisioning.

- `name`, `email`
- `github_id` (bigint, stable anchor)
- `github_login` (handle; can change)
- `avatar_url`

### Project

- `name`
- `key` — prefix in `PROJ-42`; uppercase, unique, **effectively immutable** once tickets exist (changing it orphans PR links)
- `ticket_counter` (integer) — last allocated ticket number for this project
- `has_many :repositories`, `:columns`, `:tickets`

### Repository

- `github_repo_id` (bigint) — **anchor**; survives repo renames
- `full_name` (`owner/repo`) — display convenience, not the anchor
- `belongs_to :project`

### Column

- `name`, `position`
- `belongs_to :project`, `has_many :tickets`
- No special meaning, no enforced transitions.

### Ticket

- `title`, `description` (markdown)
- `category` (string enum, **required, no default**): `bug`, `feature`, `discovery`, `maintenance`. Hardcoded list now; promote to a table only if it needs to be extensible. Required-with-no-default so the creator picks deliberately.
- `ticket_number` (integer) — sequential **per project**; key = `project.key + "-" + ticket_number`, derived not stored
- `position` (integer) — order within column (dnd-kit persists this)
- `archived_at` (datetime, nullable) — null = on board; orthogonal to column
- `archived_by_id` (FK → User)
- `archive_reason` (string, dropdown value)
- `archive_note` (text)
- `belongs_to :project`, `:column`, `:assignee` (User, nullable), `:reporter` (User)
- `has_many :pull_requests`, `:activities`

**Key allocation must be race-safe:** increment `Project#ticket_counter` inside the create transaction (or use a per-project Postgres sequence). Never naive `MAX+1` without a lock.

### PullRequest

- `github_pr_id` (bigint), `pr_number` (integer), `title`, `state` (open/closed/merged), `url`, `author_login`
- `belongs_to :repository`, `:ticket` (**nullable** — unlinked-but-visible)

### TicketLink

Self-referential edges between tickets. **Cross-project links allowed** (a `PROJ-42` can be blocked by `OTHER-7`).

- `source_ticket` (FK → Ticket)
- `target_ticket` (FK → Ticket)
- `link_type` (string enum): `blocks`, `relates_to`

**Edge-direction rules (deliberate, to avoid sync drift):**

- `blocks` is stored as a **single directed edge**. "Blocked by" is not a separate type — it's the same edge viewed from the target end (a ticket's blockers are its incoming `blocks` edges). Storing both directions would mean keeping two rows in sync.
- `relates_to` is symmetric — store once with **normalised ordering** (lower ticket id as `source`) so A↔B can't produce duplicate rows.
- Unique index on (`source_ticket_id`, `target_ticket_id`, `link_type`); guard against self-links (`source ≠ target`).
- Archived tickets keep their links and display as "(archived)" rather than breaking the edge.
- **Visual-only for now** — `blocks` displays a badge and lists the related tickets; it does **not** gate column moves. Active gating (e.g. block moving to In Progress while open blockers exist) is deferred.

### Activity

Append-only, immutable event stream. Three consumers: in-app feed, audit history, Discord fan-out.

- `subject` (polymorphic — Ticket, Project, or PullRequest)
- `actor` (User, **nullable** — webhook events have no human actor)
- `action` (string enum): `ticket_created`, `ticket_moved`, `ticket_reassigned`, `ticket_category_changed`, `ticket_archived`, `ticket_restored`, `ticket_linked`, `ticket_unlinked`, `pr_linked`, `pr_state_changed`
- `metadata` (jsonb, default `{}`) — e.g. `{"from_column_id": 3, "to_column_id": 5}`, `{"reason": "duplicate", "note": "..."}`, `{"pull_request_id": 88, "pr_number": 142}`
- `created_at` — event time

**Rules:**

- Never update or delete an Activity row — immutability is what makes it trustworthy as audit history.
- Discord fan-out runs from an `after_create` Solid Queue job, **never inline** — a Discord outage must not break the originating action.

### Relationship summary

```
User
 ├─ tickets (as assignee, nullable)
 ├─ tickets (as reporter)
 └─ activities (as actor, nullable)

Project ── has_many ── repositories, columns, tickets
Repository ── belongs_to project ── has_many pull_requests
Column ── belongs_to project ── has_many tickets
Ticket ── belongs_to project, column, assignee?, reporter
       ── has_many pull_requests, activities
       ── has_many ticket_links (outgoing) + incoming links
PullRequest ── belongs_to repository, ticket?
TicketLink ── source_ticket, target_ticket (both → Ticket), link_type
Activity ── subject (polymorphic), actor? (User)
```

`?` = nullable association.

---

## 6. Build sequence

Layered so there's always a working tool and the trickiest integrations land on a proven foundation.

1. **Board core** — Projects, Columns, Tickets, GitHub-OAuth login + allowlist, dnd-kit board, the archive drop-zone + modal + per-project archive view. Useful standalone.
2. **GitHub integration** — GitHub App, PR webhook receiver, key parsing, PR↔ticket linking, unlinked-PR surface.
3. **Activity + Discord** — the Activity stream, in-app feed, then Discord Tier 1 fan-out. (Tier 2 after.)

---

## 7. Deferred / out of scope

- Discord Tier 2 (slash commands) — fast-follow after core.
- Discord Tier 3 (threads, reactions, identity mapping) — shelved.
- Hard delete (behind confirmation) — only if junk-ticket cleanup becomes a real need.
- Per-project custom archive reasons — only if the hardcoded list chafes.
- Global cross-project archive search.
- Roles/permissions — only if external clients ever get access.
- Archive history as an event record (currently fields on Ticket) — migrate only if per-archive history is needed.
- LexoRank/fractional ranking for `position` — current integer renumber-on-move is fine at this scale.
- **Active blocked-gating** — currently links are visual only; gating column moves on open blockers is deferred (it reintroduces workflow rules we've deliberately avoided).
