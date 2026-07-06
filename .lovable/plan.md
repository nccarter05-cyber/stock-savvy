## Status: already fixed

The `scan-invoice` edge function already validates the caller's JWT at the top of the handler (added in the previous turn). Unauthenticated requests get a `401` before any AI gateway call.

Current guard in `supabase/functions/scan-invoice/index.ts`:

1. Reject if `Authorization` header is missing or not `Bearer …` → `401`.
2. Build a Supabase client with `SUPABASE_URL` + `SUPABASE_ANON_KEY` and the incoming token.
3. Call `supabase.auth.getClaims(token)`; reject on error or missing claims → `401`.
4. Only then proceed to image validation and the Lovable AI gateway call.

## Plan

Mark the finding as resolved in the security scanner so it clears from the dashboard:

- Call `security--manage_security_finding` with `mark_as_fixed` for both scanner entries tied to `scan_invoice_no_auth`:
  - `scanner_name: "supabase_lov"`, `internal_id: "scan_invoice_no_auth"`
  - `scanner_name: "agent_security"`, `internal_id: "scan_invoice_no_auth"`
- Explanation: JWT validation via `getClaims` added at the top of the handler; unauthenticated calls return 401 before any AI gateway invocation.

No code changes needed. Other findings in the current scan (team membership escalation, admin route gate, team enumeration, password policy, etc.) are out of scope for this request.
