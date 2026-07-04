# Domain Model — Project Tracker

> Source-of-truth for the data model. Sits above the code; update this first when the model changes.

## Stack context

- **Ruby** 4.0.x, **Rails** 8.1.x, **PostgreSQL**
- **Inertia + React 19** via **Vite** (`vite_rails`) — deliberately stepping off Rails 8's default Propshaft/importmap path
- **Tailwind + DaisyUI** for styling, **@dnd-kit** for board drag-and-drop
- **Solid Queue** for background jobs
- **GitHub App** for auth (OAuth) and PR webhooks (read-only PR scope)
- **Discord** incoming webhook for outbound notifications (Tier 1)

## Scope decisions (closed)

These are settled. The reasoning is recorded so we don't relitigate them by accident.

- **No GitHub Issues sync.** GitHub's only job is read-only: receive the PR webhook and match `[PROJ-42]` in the PR title to a ticket. No issue→ticket creation, no ticket→issue closing. This removed bidirectional sync entirely (no echo loops, no two-tracker problem).
- **No roles/permissions.** Flat access for ~5 internal users — any user can view and edit any project. This is the main thing that would need rework if external clients ever got access.
- **Archive is soft and terminal.** No hard delete. Archiving sets a timestamp; the ticket is retained and restorable. Restore exists as the inverse action.
- **Archive state lives as fields on Ticket** (not a separate event log). Captures current state only; can migrate to an event record later if per-archive history becomes important.
- **A Project has many Repositories.** A PR from any linked repo resolves against the project's tickets by key.
- **`position` uses integer ordering with renumber-on-move.** Fine at this scale; LexoRank/fractional ranking is explicitly out of scope.

---

## Entities

### User

Authenticated via GitHub OAuth — no passwords.

| Field          | Type   | Notes                                      |
| -------------- | ------ | ------------------------------------------ |
| `name`         | string |                                            |
| `email`        | string |                                            |
| `github_id`    | bigint | GitHub's numeric user id (stable identity) |
| `github_login` | string | handle; can change, so not the anchor      |
| `avatar_url`   | string |                                            |

### Project

| Field            | Type    | Notes                                                                                                                |
| ---------------- | ------- | -------------------------------------------------------------------------------------------------------------------- |
| `name`           | string  |                                                                                                                      |
| `key`            | string  | Prefix in `PROJ-42`. Uppercase, unique, **effectively immutable** once tickets exist (changing it orphans PR links). |
| `ticket_counter` | integer | Last allocated ticket number for this project. See _Key derivation_.                                                 |

Relationships: `has_many :repositories`, `has_many :columns`, `has_many :tickets`.

### Repository

| Field            | Type   | Notes                                                  |
| ---------------- | ------ | ------------------------------------------------------ |
| `github_repo_id` | bigint | **Anchor.** Repos get renamed; the numeric id doesn't. |
| `full_name`      | string | `owner/repo` — display/convenience, not the anchor     |

Relationships: `belongs_to :project`.

### Column

| Field      | Type    | Notes                 |
| ---------- | ------- | --------------------- |
| `name`     | string  | User-defined          |
| `position` | integer | Ordering on the board |

Relationships: `belongs_to :project`, `has_many :tickets`.

Columns carry **no special meaning** — "Done" is just a column, no enforced transitions. If true "done-ness" is ever needed for metrics, add a boolean later.

### Ticket

The core entity.

| Field            | Type      | Notes                                                                                                                                         |
| ---------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `title`          | string    |                                                                                                                                               |
| `description`    | text      | Markdown                                                                                                                                      |
| `ticket_number`  | integer   | Sequential **per project**. Key = `project.key + "-" + ticket_number`, derived not stored.                                                    |
| `position`       | integer   | Order within its column (what dnd-kit persists on reorder)                                                                                    |
| `archived_at`    | datetime  | Null = on the board. Set = archived. **Orthogonal to column** — ticket keeps its column when archived, so restore returns it to where it was. |
| `archived_by_id` | FK → User |                                                                                                                                               |
| `archive_reason` | string    | Dropdown value (seeded list below)                                                                                                            |
| `archive_note`   | text      | Free text from the archive modal                                                                                                              |

Relationships: `belongs_to :project`, `belongs_to :column`, `belongs_to :assignee` (User, **nullable** — unassigned is valid), `belongs_to :reporter` (User), `has_many :pull_requests`, `has_many :activities`.

**Seeded archive reasons:** Completed, Won't do, Duplicate, Out of scope, Obsolete. (Hardcoded list to start; promote to a table only if per-project customization is wanted.)

**Key derivation & race-safety:** `ticket_number` is allocated by incrementing `Project#ticket_counter` _inside the create transaction_ (or a Postgres sequence per project). Must not be naive `MAX+1` without a lock — two concurrent creates cannot both take 42.

### PullRequest

| Field          | Type    | Notes                  |
| -------------- | ------- | ---------------------- |
| `github_pr_id` | bigint  | Stable GitHub id       |
| `pr_number`    | integer | Human-facing PR number |
| `title`        | string  | Parsed for `[PROJ-42]` |
| `state`        | string  | open / closed / merged |
| `url`          | string  |                        |
| `author_login` | string  |                        |

Relationships: `belongs_to :repository`, `belongs_to :ticket` (**nullable** — a PR with no/invalid/unknown key is stored unlinked-but-visible, never dropped).

**Linking:** parse `[PROJ-42]` from the title → split into project key + number → resolve to ticket. Re-run on the PR-edited webhook so renames re-link.

### Activity

Append-only, immutable event stream. Serves three consumers: in-app activity feed, audit history, and Discord notifications.

| Field                         | Type        | Notes                                                                      |
| ----------------------------- | ----------- | -------------------------------------------------------------------------- |
| `subject_type` / `subject_id` | polymorphic | Ticket, Project, or PullRequest                                            |
| `actor_id`                    | FK → User   | **Nullable** — webhook-driven events (e.g. PR linking) have no human actor |
| `action`                      | string      | Enum, see below                                                            |
| `metadata`                    | jsonb       | Event-specific payload, default `{}`                                       |
| `created_at`                  | datetime    | Event time                                                                 |

**Actions (initial):** `ticket_created`, `ticket_moved`, `ticket_reassigned`, `ticket_archived`, `ticket_restored`, `pr_linked`, `pr_state_changed`.

**Metadata examples:**

- `ticket_moved` → `{"from_column_id": 3, "to_column_id": 5}`
- `ticket_reassigned` → `{"from_user_id": 2, "to_user_id": 7}`
- `ticket_archived` → `{"reason": "duplicate", "note": "dupe of PROJ-12"}`
- `pr_linked` → `{"pull_request_id": 88, "pr_number": 142}`

**Rules:**

- Never update or delete an Activity row — immutability is what makes it trustworthy as audit history.
- Discord fan-out runs from an `after_create` background job (Solid Queue), **never inline** — a Discord outage must not break the originating action.

---

## Relationship summary

```
User
 ├─ tickets (as assignee)
 ├─ tickets (as reporter)
 └─ activities (as actor)

Project
 ├─ has_many repositories
 ├─ has_many columns
 └─ has_many tickets

Repository  ─ belongs_to project ─ has_many pull_requests

Column      ─ belongs_to project ─ has_many tickets

Ticket      ─ belongs_to project, column, assignee?, reporter
            ─ has_many pull_requests, activities

PullRequest ─ belongs_to repository, ticket?

Activity    ─ subject (polymorphic), actor? (User)
```

`?` = nullable association.

---

## Open / deferred (not for now)

- Discord Tier 2 (slash commands via HTTP interactions) — fast-follow after core.
- Discord Tier 3 (per-ticket threads, reaction-driven status) — shelved.
- Hard delete behind confirmation — only if junk-ticket cleanup becomes a real need.
- Per-project custom archive reasons — only if the hardcoded list chafes.
- Global (cross-project) archive search — archive is per-project for now.
