# Project Notes

- Supabase project ref: `PROJECT_REF`
- Supabase URL: `https://PROJECT_REF.supabase.co`
- `supabase/schedule.sql` uses placeholders; replace `PROJECT_REF` before running.
- Secrets are **not** stored in the repo. If `SYNC_SECRET` or `META_SYNC_SECRET` are set in Supabase,
  either add the header back in `supabase/schedule.sql` or unset those secrets to run without auth.
