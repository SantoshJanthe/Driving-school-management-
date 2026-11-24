# Driving School Management

Cloud-based driving school management for a single school, with a multi-tenant-ready data model (`school_id` on every row, enforced by Postgres Row Level Security). Staff sign in, and the app tracks applicants, training, payments, documents and an audit trail.

This repository contains the scaffold, authentication, the dashboard shell, and applicant management. Training, payments, documents, staff administration and audit screens are routed and permission-guarded, and show a placeholder until their milestone.

Applicants: an admin (or a staff user with `create_applicant`) can add a record from **New applicant** — name, Indian mobile, address, pincode, Aadhaar last 4 only, licence category, fee, and status. The list searches by name, phone, or application number. The profile shows the overview and history; edit, status change, and admin delete (type the name to confirm) are on the same page.

Documents: **Add document** on the Documents page (or the applicant’s Documents tab) uploads a PDF, JPG, PNG, or WEBP up to 10 MB and attaches it to an applicant. Search by applicant, application number, or file name. View and download are logged. Only an admin can archive or delete a file. Files stay private.

Training: the Training page lists one day at a time, with previous, next, and today, plus instructor and vehicle filters. Add a session with date, start, end, vehicle, instructor, status, and remarks. Mark a session completed or absent in one tap, and undo it. An applicant’s Training tab shows progress against the school’s session target. Only an admin can delete a session.

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
- `(app)/layout.tsx` loads the profile once per request. A missing profile, `is_active = false`, or a school the owner has paused forces a sign-out; the login page then explains which of the three happened.
- `lib/auth/permissions.ts` reads the `profiles.permissions` JSONB. Admins pass every check. `requireAdmin()` and `requirePermission()` guard pages; Row Level Security is what actually enforces access.
- Password reset: `/forgot-password` emails a link, `/auth/callback` exchanges the code, `/reset-password` sets the new password. The response does not reveal whether an email address exists.

## Tenancy: who controls what

Each school is one tenant. Every table that holds school data carries `school_id`, and every RLS policy on it reads `app.current_school_id()`, which resolves the signed-in user's own school and nothing else. There is no code path that lets one school name another school's id, so isolation does not depend on a page remembering to filter.

| Who | Scope | Can do |
| --- | --- | --- |
| Software owner (`PLATFORM_OWNER_EMAILS`) | All schools, through the service role | Open a new school and its first admin, list every school with its software-access payments, set any school admin's password, pause or restore a school |
| School admin | Own school only | Everything inside the school: staff, students, courses, payments, documents, training, settings, logs |
| Staff | Own school only | What `profiles.permissions` grants them, set by their own admin |
| Instructor | Own school only | Their own lessons for the day |
| Student | Own record only | Their profile, their lessons, their receipt |

The owner's reach is deliberately outside RLS rather than a higher role inside it: owner pages run through `lib/supabase/admin.ts` (server-only service role) behind `requirePlatformOwner()`, and the tenant policies have no "owner sees everything" branch that a bug could trip. A school admin promoting themselves cannot reach another school, because there is no row in `profiles` linking them to it.

Tenant onboarding belongs to the owner alone. `create_school`, `school_has_admin` and `delete_empty_school` answer the service role only; a school admin calling them gets `42501`.

### Pausing a school

`/vendor/schools` has **Pause access** per school, which sets `schools.is_active = false`. `app.current_school_id()` ignores an inactive school, so in one step that school loses every row on every table, in storage and in the RPCs — nothing is left to check page by page. Its users are signed out with a message that access is paused; `public.current_profile()` and `public.current_school_access()` stay SECURITY DEFINER so the app can still say why. **Restore access** puts it all back; no data is touched either way. The owner cannot pause the school their own login belongs to, so the control plane cannot lock itself out.

## Google sign-in

Staff and students may sign in with the Google address their school registered. Google is a second key to an existing account, never a way to create one: `auth.enable_signup` stays `false`, and `/auth/callback` throws the session away and signs the user out when no profile matches, so an unknown Gmail address cannot get in.

Supabase holds the OAuth client id and secret; the app only asks Supabase for the provider URL and never handles the credentials.

1. Google Cloud Console → APIs & Services → Credentials → **Create OAuth client ID** → Web application. Authorised redirect URI: `https://<project-ref>.supabase.co/auth/v1/callback` (for `supabase start`, `http://127.0.0.1:54321/auth/v1/callback`).
2. Hosted project: Authentication → Providers → Google, paste the client id and secret, enable. Locally: set `SUPABASE_AUTH_EXTERNAL_GOOGLE_CLIENT_ID` and `SUPABASE_AUTH_EXTERNAL_GOOGLE_SECRET`, then flip `enabled = true` under `[auth.external.google]` in `supabase/config.toml` and restart the stack.
3. Add `AUTH_GOOGLE_ENABLED=true` to `.env.local`. **Continue with Google** appears on `/login`; while it is empty the button stays hidden rather than leading to a dead end.
4. Supabase → Authentication → URL Configuration: add `<your site>/auth/callback` to the redirect allow-list.

A staff member whose Google address matches their registered email signs in with either method. To move someone to a different address, change their email in **Staff** first.

## Connecting a hosted Supabase project

1. Create the project, then copy Project Settings → API into `.env.local`: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The service role key is server-only; `lib/supabase/admin.ts` is marked `server-only` so a browser bundle importing it fails the build.
2. Push the schema in filename order — the migrations are cumulative and later ones amend earlier ones:

```bash
npx supabase link --project-ref <project-ref>
npx supabase db push
```

3. Do **not** run `supabase/seed.sql` on a real project: it creates the demo logins. Create the first school instead, from the SQL editor, then add its admin through Authentication → Users with `user_metadata` `{"school_id": "<id>", "full_name": "...", "role": "admin"}`. A trigger turns that into the `profiles` row. From then on the owner opens every further school from `/schools/new`.
4. Authentication → Providers: keep email sign-ups **off**. Set the password policy to at least 10 characters with letters and digits, matching `supabase/config.toml`.
5. Database → Backups: turn on daily backups, 30 days.
6. Set `PLATFORM_OWNER_EMAILS` to the owner's sign-in address, and `NEXT_PUBLIC_APP_URL` to the live origin so email links and the Google redirect point at the right host.

`npm run db:test` runs the permission matrix against `SUPABASE_DB_URL`; run it after pushing to confirm isolation on the real project.

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

## Software subscription

The landing page sells the software as a monthly subscription per school. The owner chooses the payment methods under **Payment methods on the landing page** at `/vendor/subscriptions`: Razorpay, manual UPI or bank transfer, or both. Manual is on by default.

1. Set `SUBSCRIPTION_MONTHLY_FEE` and `PLATFORM_OWNER_EMAILS` (the sign-in emails that may manage payments) in `.env.local`.
2. **Razorpay:** set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`, and add the webhook `/api/razorpay/webhook` for `payment_link.paid`. The buyer pays on a Razorpay payment link. The signed return link or the webhook marks the payment verified, and the download opens without a manual check. Until the keys are set, the method shows **Not connected** and the landing page does not offer it.
3. **Manual UPI or bank transfer:** set `PAYMENT_UPI_ID` or `PAYMENT_BANK_DETAILS`. The buyer pays, sends the transaction ID or UTR, and the owner clicks **Verify payment** or **Reject** after matching it with the bank statement.
4. The buyer’s status page refreshes every 10 seconds. After verification it opens `/download`, which offers the Android APK and install steps for laptop and iPhone. The APK link only works for a verified payment.

The landing page shows only the methods that are switched on and fully set up; with none, it says the fee is not published yet. Payment rows live in `public.subscription_requests` and the method choice in `public.platform_settings`. RLS is on for both with no policies; only the server reads them with the service role.

Emails in `PLATFORM_OWNER_EMAILS` can open **Schools** (`/vendor/schools`): every school, its software-access payment records, a form to set that school admin's password, and the pause/restore switch described under [Tenancy](#tenancy-who-controls-what).

## Apps for laptop and phone

- **Laptop, iPhone, any browser:** the signed-in app is an installable web app (`app/manifest.ts`, `public/sw.js`). It opens at `/dashboard`. Chrome and Edge show an install button; on iPhone use Share → Add to Home Screen.
- **Android APK:** `android/` is a Capacitor project that opens the live site. It needs JDK 21 and the Android SDK (platform 36).

```bash
APP_SERVER_URL=https://your-live-site.example npm run android:apk
```

This builds a debug-signed APK and copies it to `var/downloads/motor-driving-school-software.apk`, where `/download` serves it. Rebuild whenever the site address changes. For the Play Store, sign a release build with your own keystore and keep that keystore out of git.

## Scheduled database backup

`crontab` is not available on this machine, so a daily job was not installed. The schedule below is the step to run on a host that has cron.

A restore was tested on 6 Nov 2026, 12:39 am IST. `pg_dump -Fc` of the local `dsm_local` database was restored into an empty database named `dsm_restore_scratch`. The scratch copy had the same 4 applicants, 2 payments, and 4 schools, including Meera Joshi’s balance of ₹5,900. The scratch database and the dump file were then removed. This was not a scheduled backup, and it did not include files under `var/`.

On Supabase, open the project, then Database → Backups, and turn on daily backups. Keep at least 30 days. That backup includes the database. It does not include files stored only on the app server under `var/`.

On a server you control, schedule `pg_dump` yourself. Example, once a day at 02:00, writing a private directory and deleting dumps older than 30 days:

```bash
0 2 * * * pg_dump "$DATABASE_URL" -Fc -f /var/backups/dsm-$(date +\%F).dump && find /var/backups -name 'dsm-*.dump' -mtime +30 -delete
```

Do not commit a dump. Restore with `pg_restore` into an empty database, then put document files back separately.

## Uptime

Error reporting stays off while `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` are empty. An uptime checker should request `GET /` on the public origin and expect HTTP 200. No uptime service is connected from this app.

## Document versions

Uploading a file of a type the applicant already has copies the previous file to `<school>/<applicant>/versions/` and archives the old row. The previous bytes stay. Deleting the new row does not delete that copy.

## Restore a backup

An admin can download a spreadsheet as `school-backup.csv` from Reports. The file has a `student` section, a `payment` section, a `session` section, and a `document` section. The document section lists file name, type, size, and upload time. It does not include the file bytes. It is a copy of those rows, not a full database dump. To restore, create the school again and enter the rows from the file, or load the CSV with a database tool into an empty school. Put the document files back into storage separately. Keep the file private. It does not include a full Aadhaar number.

## Layout

```text
app/(auth)        login, forgot-password, reset-password
app/(app)         sidebar shell: dashboard + seven placeholder sections
app/auth          callback and forced sign-out routes
components/       ui (shadcn), layout, auth, dashboard
lib/              supabase clients, auth, permissions, queries, validation
supabase/         config, migrations, seed, tests
```
