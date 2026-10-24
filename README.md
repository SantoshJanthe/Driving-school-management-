# Driving School Management

Cloud-based driving school management for a single school, with a multi-tenant-ready data model (`school_id` on every row, enforced by Postgres Row Level Security). Staff sign in, and the app tracks applicants, training, payments, documents and an audit trail.

This repository contains the scaffold, authentication, the dashboard shell, and applicant management. Training, payments, documents, staff administration and audit screens are routed and permission-guarded, and show a placeholder until their milestone.

Applicants: an admin (or a staff user with `create_applicant`) can add a record from **New applicant** — name, Indian mobile, address, pincode, Aadhaar last 4 only, licence category, fee, and status. The list searches by name, phone, or application number. The profile shows the overview and history; edit, status change, and admin delete (type the name to confirm) are on the same page.

Documents: **Add document** on the Documents page (or the applicant’s Documents tab) uploads a PDF, JPG, PNG, or WEBP up to 10 MB and attaches it to an applicant. Search by applicant, application number, or file name. View and download are logged. Only an admin can archive or delete a file. Files stay private.

## Stack

- Next.js 15 (App Router, TypeScript, Server Components and Server Actions)
- Tailwind CSS and shadcn/ui
- Supabase: Postgres, Auth and Storage, accessed with `@supabase/ssr`
- Zod for form validation

## Prerequisites

- Node.js 20 or newer
- [Supabase CLI](https://supabase.com/docs/guides/cli) and Docker, for the local database (`supabase start`)

Docker is not required to run the app against a hosted Supabase project, and it is not required to run the RLS test (see below).

## Local setup

```bash
npm install

# Boots Postgres, Auth, Storage and Studio in Docker and applies
# supabase/migrations plus supabase/seed.sql.
supabase start

cp .env.example .env.local
```

Copy the API URL, anon key and service-role key printed by `supabase start` into `.env.local`. The service-role key is server-only; never prefix it with `NEXT_PUBLIC_`.

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You are redirected to the sign-in page.

### Seeded accounts

`supabase/seed.sql` creates one school and two confirmed users. Development only — do not run it against staging or production.

| Role  | Email                    | Password      |
| ----- | ------------------------ | ------------- |
| Admin | `admin@sample-dsm.local` | `Admin@12345` |
| Staff | `staff@sample-dsm.local` | `Staff@12345` |

The staff account has the default permission set: view applicants and manage training on; create, edit, payments and financials off. Public sign-up is disabled in `supabase/config.toml`; staff are added later by an admin invite.

Password reset emails are captured by the local mail UI (Inbucket) at [http://127.0.0.1:54324](http://127.0.0.1:54324).

### Re-applying the schema

```bash
npm run db:reset    # drops the local database, replays migrations, runs the seed
```

## Database

- `supabase/migrations/0001_init.sql` — schema, triggers, RLS policies and the private `applicant-documents` storage bucket. This is the reviewed Milestone 1 schema.
- `supabase/seed.sql` — the development school and the two users above.
- `supabase/tests/rls.sql` — permission-matrix test (profile provisioning, balances, activity and audit triggers, the section-5 permission matrix, cross-school isolation, deactivation, storage paths, anonymous denial). It runs inside a transaction and rolls back, so seed data is left untouched.

Against the local Supabase stack:

```bash
npm run db:test
```

Without Docker, on plain PostgreSQL 16 (the stub stands in for `auth` and `storage`; it must never be applied to a real Supabase project):

```bash
createdb dsm_test
psql -d dsm_test -f supabase/tests/helpers/supabase-stub.sql
psql -d dsm_test -v ON_ERROR_STOP=1 -f supabase/migrations/0001_init.sql
psql -d dsm_test -v ON_ERROR_STOP=1 -f supabase/seed.sql          # optional
psql -d dsm_test -v ON_ERROR_STOP=1 -f supabase/tests/rls.sql
```

The last line printed is `ALL_RLS_TESTS_PASSED`.

Regenerate `lib/database.types.ts` once the local stack is running:

```bash
npm run db:types
```

The committed file is a hand-maintained mirror of the migration, in the same shape, so the app type-checks before the first `supabase start`.

## Scripts

| Script              | What it does                       |
| ------------------- | ---------------------------------- |
| `npm run dev`       | Next.js dev server                 |
| `npm run build`     | Production build                   |
| `npm run lint`      | ESLint                             |
| `npm run typecheck` | `tsc --noEmit`                     |
| `npm run format`    | Prettier                           |
| `npm run db:test`   | RLS test against `SUPABASE_DB_URL` |

## How auth works

- `middleware.ts` refreshes the Supabase session cookie on every request, sends anonymous visitors to `/login` (keeping a `next` path), and sends signed-in visitors away from `/login` and `/forgot-password`.
- Server Components and Server Actions use `lib/supabase/server.ts`, which forwards the caller's IP and user agent so activity-log triggers record the person, not the host.
- `(app)/layout.tsx` loads the profile once per request. A missing profile or `is_active = false` forces a sign-out; the login page then explains that the account is deactivated.
- `lib/auth/permissions.ts` reads the `profiles.permissions` JSONB. Admins pass every check. `requireAdmin()` and `requirePermission()` guard pages; Row Level Security is what actually enforces access.
- Password reset: `/forgot-password` emails a link, `/auth/callback` exchanges the code, `/reset-password` sets the new password. The response does not reveal whether an email address exists.

## Razorpay

The **Payments** page calls Razorpay’s Payment Links API (`POST /v1/payment_links`). The payer completes checkout on Razorpay’s page. When Razorpay sends `payment_link.paid` to `/api/razorpay/webhook`, the fee is written into the ledger. Card numbers never pass through this app.

Cursor can also call the same account through the hosted MCP server (`.cursor/mcp.json`).

1. In the Razorpay dashboard, open Settings → API Keys and copy the test key id and secret (`rzp_test_...`).
2. Put them in `.env.local` (this file is gitignored):

```bash
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

3. Restart Cursor. The `rzp-mcp-server` tools appear under MCP. The launcher reads `.env.local` and passes the token only as an environment variable.

Do not paste the secret into chat, and do not commit `.env.local`. Switch to live keys only when you are ready to take real payments.

## Layout

```text
app/(auth)        login, forgot-password, reset-password
app/(app)         sidebar shell: dashboard + seven placeholder sections
app/auth          callback and forced sign-out routes
components/       ui (shadcn), layout, auth, dashboard
lib/              supabase clients, auth, permissions, queries, validation
supabase/         config, migrations, seed, tests
```
