# Immo Beguin Google Sheet Sync Fix (2026-02-18)

## Context
Google Ads spend sync for Immo Beguin pulled mixed MCC data from a multi-client sheet export.

## What was done
- Updated `SHEET_CSV_URL` for project `qbzkqvobjlkcwujebenm` to the stable Immo sheet export URL.
- Deleted the contaminated sync batch from `2026-02-18T12:28:23.75+00:00`:
  - `marketing_spend_daily`: 30 rows removed.
  - `marketing_spend_campaign_daily`: 1206 rows removed.
- Triggered `google-sheet-sync` again.

## Validation
- Sync result: `ok=true`, `rows=34`, `upserted_daily=17`, `upserted_campaigns=34`.
- Latest Google Ads daily rows now match expected Immo-only values.
- Campaign set now contains only:
  - `[PMAX] Immo Beguin`
  - `[SEARCH] BRANDING`
