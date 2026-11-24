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

## Software subscription

The landing page sells the software as a monthly subscription per school. The owner chooses the payment methods under **Payment methods on the landing page** at `/vendor/subscriptions`: Razorpay, manual UPI or bank transfer, or both. Manual is on by default.

1. Set `SUBSCRIPTION_MONTHLY_FEE` and `PLATFORM_OWNER_EMAILS` (the sign-in emails that may manage payments) in `.env.local`.
2. **Razorpay:** set `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, and `RAZORPAY_WEBHOOK_SECRET`, and add the webhook `/api/razorpay/webhook` for `payment_link.paid`. The buyer pays on a Razorpay payment link. The signed return link or the webhook marks the payment verified, and the download opens without a manual check. Until the keys are set, the method shows **Not connected** and the landing page does not offer it.
3. **Manual UPI or bank transfer:** set `PAYMENT_UPI_ID` or `PAYMENT_BANK_DETAILS`. The buyer pays, sends the transaction ID or UTR, and the owner clicks **Verify payment** or **Reject** after matching it with the bank statement.
4. The buyer’s status page refreshes every 10 seconds. After verification it opens `/download`, which offers the Android APK and install steps for laptop and iPhone. The APK link only works for a verified payment.

The landing page shows only the methods that are switched on and fully set up; with none, it says the fee is not published yet. Payment rows live in `public.subscription_requests` and the method choice in `public.platform_settings`. RLS is on for both with no policies; only the server reads them with the service role.

## Apps for laptop and phone

- **Laptop, iPhone, any browser:** the signed-in app is an installable web app (`app/manifest.ts`, `public/sw.js`). It opens at `/dashboard`. Chrome and Edge show an install button; on iPhone use Share → Add to Home Screen.
- **Android APK:** `android/` is a Capacitor project that opens the live site. It needs JDK 21 and the Android SDK (platform 36).
- **iOS:** `ios/` is the matching Capacitor project. It is reviewed against [felixgr/secure-ios-app-dev](https://github.com/felixgr/secure-ios-app-dev) (a security checklist, not an app store binary). Details are in `ios/SECURITY.md`. You need a Mac, Xcode 15+, and an Apple Developer team:

```bash
APP_SERVER_URL=https://your-live-site.example npm run ios:sync
open ios/App/App.xcodeproj
```

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
