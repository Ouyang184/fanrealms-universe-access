# Security CI

`.github/workflows/security-scan.yml` runs on every push to `main`, every PR, and weekly (Mon 06:00 UTC).

## Jobs

| Job | What it checks |
|---|---|
| `supabase-linter` | Runs `supabase db lint` against the linked project — catches tables without RLS, security-definer views, missing primary keys, etc. Fails on ERROR level. |
| `rls-policy-audit` | Static scan of `supabase/migrations/*.sql` for: `CREATE TABLE` without `ENABLE ROW LEVEL SECURITY`, policies with `USING (true)`, `SECURITY DEFINER` functions missing `SET search_path`, role columns on `users`/`profiles`. |
| `edge-function-auth-audit` | Every edge function (except documented public ones) must call `auth.getUser` / `authenticateUser` / `verifyJWT`. Also verifies `service_role` is never referenced in `src/`. |
| `storage-config-audit` | Public buckets must be in the allowlist (`avatars`, `banners`, `product-images`) — matches `@security-memory`. |
| `dependency-audit` | `npm audit` for high/critical CVEs (non-blocking warning). |

## Required GitHub secrets

Add these at **Settings → Secrets and variables → Actions**:

- `SUPABASE_ACCESS_TOKEN` — personal access token from https://supabase.com/dashboard/account/tokens
- `SUPABASE_PROJECT_REF` — `eaeqyctjljbtcatlohky`
- `SUPABASE_DB_PASSWORD` — DB password for the linked project

Without these the `supabase-linter` job will fail with a clear error message; the other jobs run regardless.

## Updating allowlists

- New public storage bucket → update `ALLOWED_PUBLIC` in `storage-config-audit` **and** `@security-memory`.
- New intentionally-public edge function → update `ALLOWLIST` in `edge-function-auth-audit`.
