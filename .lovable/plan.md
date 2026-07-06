## Problem

`supabase/functions/scan-invoice/index.ts` has no auth check. Anyone on the internet can hit the endpoint and burn Lovable AI credits.

## Fix

Add a JWT validation block at the top of the handler (right after the OPTIONS/CORS check), following the standard Cloud pattern for `verify_jwt = false` functions.

### Changes to `supabase/functions/scan-invoice/index.ts`

1. Import `createClient` from `npm:@supabase/supabase-js@2`.
2. After the OPTIONS preflight, before reading the body:
   - Read the `Authorization` header; if missing or not `Bearer …`, return `401`.
   - Create a Supabase client using `SUPABASE_URL` + `SUPABASE_ANON_KEY` with the incoming Authorization header.
   - Call `supabase.auth.getClaims(token)`; if error or no claims, return `401`.
   - Keep `data.claims.sub` available (useful for future rate limiting / logging).
3. Everything else (image validation, AI gateway call, response shaping) stays the same.

### Why this works

- The frontend already calls the function via `supabase.functions.invoke('scan-invoice', …)`, which automatically attaches the logged-in user's JWT — no client-side changes needed.
- `getClaims` cryptographically verifies the token against the project's JWKS, so unauthenticated callers are rejected before any AI gateway request is made.
- No `supabase/config.toml` change required; the function keeps its default `verify_jwt = false` and validates in-code (per current Cloud pattern).

### Out of scope (can be follow-ups if desired)

- Per-user rate limiting (e.g. N scans per hour) — would need a small table + check.
- Team-scoped quotas.
- Logging scan events for audit.

### Verification

- Curl the deployed function with no `Authorization` → expect `401`.
- Use the app while signed in → scan flow works unchanged.
