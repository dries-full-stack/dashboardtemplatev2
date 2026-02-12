#!/usr/bin/env python3
"""
Debug Teamleader deal counts as used by the Sales dashboard.

This script queries Supabase PostgREST (public/publishable key) and reproduces the
Sales dashboard's "offertes" (quote deals) logic:

- Deals are filtered by created_at in the selected date range.
- "Offertes" are deals whose current phase is at/after the configured quote phase
  (dashboard_config.sales_quotes_from_phase_id) using phase sort_order (fallback: probability).

It also prints a secondary view based on phase history markers:
- teamleader_deals.quote_phase_first_started_at (when available) indicates whether a deal
  actually entered the quote phase at least once.

Usage examples:
  python3 scripts/debug_teamleader_deals.py --start 2026-02-01 --end 2026-02-12 \\
    --supabase-url https://PROJECT.supabase.co --supabase-key sb_publishable_... --location-id LOC_ID

  # Dump the deal IDs that the dashboard counts as "offertes" (one per line)
  python3 scripts/debug_teamleader_deals.py ... --dump quote_ids
"""

from __future__ import annotations

import argparse
import json
import sys
import urllib.parse
import urllib.request
from collections import Counter
from dataclasses import dataclass
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Iterable, List, Optional, Tuple


def _env(name: str) -> str:
    # Keep it minimal; avoid importing dotenv.
    import os

    return os.environ.get(name, "").strip()


def _require(value: str, label: str) -> str:
    if not value:
        raise SystemExit(f"Missing {label}. Provide it via flag or environment.")
    return value


def _http_json(url: str, *, key: str, timeout_s: int = 60) -> Any:
    req = urllib.request.Request(
        url,
        headers={
            "apikey": key,
            "Authorization": f"Bearer {key}",
        },
    )
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        return json.load(resp)


def _build_rest_base(supabase_url: str) -> str:
    return supabase_url.rstrip("/") + "/rest/v1"


def _add_day(date_yyyy_mm_dd: str, days: int) -> str:
  dt = datetime.fromisoformat(date_yyyy_mm_dd)
  return (dt + timedelta(days=days)).date().isoformat()


def _zoned_midnight_to_utc_iso(date_yyyy_mm_dd: str, time_zone: str) -> str:
    """
    Convert YYYY-MM-DD midnight in `time_zone` to UTC ISO string (Z).
    Uses stdlib zoneinfo when available.
    """
    tz = (time_zone or "").strip() or "UTC"
    if tz.upper() == "UTC":
        return datetime.fromisoformat(f"{date_yyyy_mm_dd}T00:00:00+00:00").astimezone(timezone.utc).isoformat().replace("+00:00", "Z")

    try:
        from zoneinfo import ZoneInfo  # py3.9+

        local = datetime.fromisoformat(f"{date_yyyy_mm_dd}T00:00:00").replace(tzinfo=ZoneInfo(tz))
        return local.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")
    except Exception:
        # Fallback: treat as UTC (keeps script usable even without tzdata/zoneinfo).
        return datetime.fromisoformat(f"{date_yyyy_mm_dd}T00:00:00+00:00").astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def _paginate(
    *,
    rest_base: str,
    path: str,
    key: str,
    params: Dict[str, str],
    limit: int = 1000,
) -> List[Dict[str, Any]]:
    rows: List[Dict[str, Any]] = []
    offset = 0

    while True:
        page_params = dict(params)
        page_params["limit"] = str(limit)
        page_params["offset"] = str(offset)
        qs = urllib.parse.urlencode(page_params, safe=",:.+-")
        url = f"{rest_base}{path}?{qs}"
        batch = _http_json(url, key=key)
        if not batch:
            break
        if not isinstance(batch, list):
            raise RuntimeError(f"Expected list response for {path}, got {type(batch)}")
        rows.extend(batch)
        if len(batch) < limit:
            break
        offset += limit

    return rows


@dataclass(frozen=True)
class Phase:
    id: str
    name: str
    sort_order: Optional[int]
    probability: Optional[float]


def _to_int(value: Any) -> Optional[int]:
    if value is None:
        return None
    if isinstance(value, bool):
        return None
    if isinstance(value, int):
        return max(0, value)
    try:
        raw = int(float(str(value)))
        return max(0, raw)
    except Exception:
        return None


def _to_probability(value: Any) -> Optional[float]:
    if value is None:
        return None
    try:
        raw = float(str(value))
    except Exception:
        return None
    if raw > 1:
        raw = raw / 100.0
    return max(0.0, min(1.0, raw))


def _load_quote_phase_id(
    *,
    rest_base: str,
    key: str,
    location_id: str,
    explicit: str,
) -> str:
    if explicit:
        return explicit.strip()

    by_location = _paginate(
        rest_base=rest_base,
        path="/dashboard_config",
        key=key,
        params={
            "select": "sales_quotes_from_phase_id",
            "location_id": f"eq.{location_id}",
        },
        limit=1000,
    )
    if by_location:
        value = (by_location[0].get("sales_quotes_from_phase_id") or "").strip()
        if value:
            return value

    # Fallback to singleton row (id=1) if needed.
    fallback = _paginate(
        rest_base=rest_base,
        path="/dashboard_config",
        key=key,
        params={
            "select": "sales_quotes_from_phase_id",
            "id": "eq.1",
        },
        limit=1000,
    )
    if fallback:
        return (fallback[0].get("sales_quotes_from_phase_id") or "").strip()

    return ""


def _load_phases(*, rest_base: str, key: str, location_id: str) -> Dict[str, Phase]:
    rows = _paginate(
        rest_base=rest_base,
        path="/teamleader_deal_phases",
        key=key,
        params={
            "select": "id,name,sort_order,probability",
            "location_id": f"eq.{location_id}",
        },
        limit=1000,
    )
    phases: Dict[str, Phase] = {}
    for row in rows:
        pid = str(row.get("id") or "").strip()
        if not pid:
            continue
        phases[pid] = Phase(
            id=pid,
            name=str(row.get("name") or "").strip() or pid,
            sort_order=_to_int(row.get("sort_order")),
            probability=_to_probability(row.get("probability")),
        )
    return phases


def _is_quote_deal_by_phase(
    deal_phase_id: str,
    *,
    phases: Dict[str, Phase],
    quote_phase_id: str,
    quote_phase_sort_order: Optional[int],
    quote_phase_probability: Optional[float],
) -> bool:
    if not quote_phase_id:
        return True

    phase_id = (deal_phase_id or "").strip()
    if not phase_id:
        return False

    if phase_id == quote_phase_id:
        return True

    phase = phases.get(phase_id)
    if not phase:
        return False

    if quote_phase_sort_order is not None and phase.sort_order is not None:
        return phase.sort_order >= quote_phase_sort_order

    if quote_phase_probability is not None and phase.probability is not None:
        return phase.probability >= quote_phase_probability

    return False


def _status_key(value: Any) -> str:
    raw = str(value or "").strip().lower()
    return raw or "(empty)"


def main(argv: Optional[List[str]] = None) -> int:
    parser = argparse.ArgumentParser(description="Debug Teamleader deal counts for the Sales dashboard.")
    parser.add_argument("--supabase-url", default=_env("SUPABASE_URL") or _env("VITE_SUPABASE_URL"))
    parser.add_argument(
        "--supabase-key",
        default=_env("SUPABASE_PUBLISHABLE_KEY") or _env("VITE_SUPABASE_PUBLISHABLE_KEY"),
        help="Supabase publishable/anon key (used as apikey + bearer)",
    )
    parser.add_argument("--location-id", default=_env("LOCATION_ID") or _env("GHL_LOCATION_ID") or _env("VITE_GHL_LOCATION_ID"))
    parser.add_argument("--start", required=True, help="Start date (YYYY-MM-DD), inclusive")
    parser.add_argument("--end", required=True, help="End date (YYYY-MM-DD), inclusive")
    parser.add_argument(
        "--quote-phase-id",
        default="",
        help="Override dashboard_config.sales_quotes_from_phase_id (Teamleader phase id).",
    )
    parser.add_argument(
        "--deal-url-template",
        default=_env("TEAMLEADER_DEAL_URL_TEMPLATE") or _env("VITE_TEAMLEADER_DEAL_URL_TEMPLATE") or "https://app.teamleader.eu/deals/{id}",
    )
    parser.add_argument(
        "--timezone",
        default=_env("DASHBOARD_TIMEZONE") or _env("VITE_DASHBOARD_TIMEZONE") or "UTC",
        help="Dashboard/business timezone for day boundaries (e.g. Europe/Brussels). Default: UTC.",
    )
    parser.add_argument(
        "--dump",
        choices=["", "all_ids", "quote_ids", "non_quote_ids", "inconsistent_ids"],
        default="",
        help="Dump one ID per line for the selected set (useful to compare with Teamleader export).",
    )
    parser.add_argument("--show", type=int, default=20, help="How many sample rows to print for mismatches.")
    args = parser.parse_args(argv)

    supabase_url = _require(args.supabase_url, "--supabase-url / SUPABASE_URL")
    key = _require(args.supabase_key, "--supabase-key / SUPABASE_PUBLISHABLE_KEY")
    location_id = _require(args.location_id, "--location-id / LOCATION_ID")
    start_date = args.start.strip()
    end_date = args.end.strip()
    tz = (args.timezone or "").strip() or "UTC"

    rest_base = _build_rest_base(supabase_url)

    quote_phase_id = _load_quote_phase_id(
        rest_base=rest_base,
        key=key,
        location_id=location_id,
        explicit=args.quote_phase_id.strip(),
    )
    phases = _load_phases(rest_base=rest_base, key=key, location_id=location_id)

    quote_phase = phases.get(quote_phase_id) if quote_phase_id else None
    quote_phase_name = quote_phase.name if quote_phase else ""
    quote_phase_sort = quote_phase.sort_order if quote_phase else None
    quote_phase_prob = quote_phase.probability if quote_phase else None

    start_iso = _zoned_midnight_to_utc_iso(start_date, tz)
    end_ex_iso = _zoned_midnight_to_utc_iso(_add_day(end_date, 1), tz)

    # NOTE: urlencode doesn't allow duplicate keys, so we build created_at filters manually.
    # We need both created_at=gte and created_at=lt.
    base_params = {
        "select": "id,created_at,title,status,phase_id,quote_phase_first_started_at,quote_phase_last_checked_at",
        "location_id": f"eq.{location_id}",
        "order": "created_at.asc,id.asc",
    }
    # Manual pagination with duplicate created_at filters.
    deals: List[Dict[str, Any]] = []
    offset = 0
    limit = 1000
    while True:
        qs = (
            urllib.parse.urlencode(base_params, safe=",:.+-")
            + f"&created_at=gte.{urllib.parse.quote(start_iso)}"
            + f"&created_at=lt.{urllib.parse.quote(end_ex_iso)}"
            + f"&limit={limit}&offset={offset}"
        )
        url = f"{rest_base}/teamleader_deals?{qs}"
        batch = _http_json(url, key=key)
        if not batch:
            break
        if not isinstance(batch, list):
            raise RuntimeError(f"Expected list response for teamleader_deals, got {type(batch)}")
        deals.extend(batch)
        if len(batch) < limit:
            break
        offset += limit

    # Compute sets
    quote_by_phase: List[Dict[str, Any]] = []
    non_quote: List[Dict[str, Any]] = []
    quote_by_history: List[Dict[str, Any]] = []
    history_unknown: List[Dict[str, Any]] = []
    phase_but_not_history: List[Dict[str, Any]] = []

    for deal in deals:
        phase_id = str(deal.get("phase_id") or "")
        is_quote = _is_quote_deal_by_phase(
            phase_id,
            phases=phases,
            quote_phase_id=quote_phase_id,
            quote_phase_sort_order=quote_phase_sort,
            quote_phase_probability=quote_phase_prob,
        )
        if is_quote:
            quote_by_phase.append(deal)
        else:
            non_quote.append(deal)

        checked_at = deal.get("quote_phase_last_checked_at")
        started_at = deal.get("quote_phase_first_started_at")
        if checked_at is None:
            history_unknown.append(deal)
        elif started_at is not None:
            quote_by_history.append(deal)
        elif is_quote:
            # Deal is currently at/after the quote phase, but phase history indicates it never entered the quote phase.
            # This is often the reason for small mismatches vs how Teamleader UI counts "quotes".
            phase_but_not_history.append(deal)

    def count_by_status(rows: Iterable[Dict[str, Any]]) -> Counter:
        return Counter(_status_key(r.get("status")) for r in rows)

    def print_counter(title: str, counter: Counter) -> None:
        print(title)
        for key, value in counter.most_common():
            print(f"  - {key}: {value}")

    print(f"Range: {start_date} -> {end_date} (UTC filter: [{start_iso}, {end_ex_iso}))")
    if quote_phase_id:
        print(
            "Quote phase threshold:"
            f" {quote_phase_name or quote_phase_id} (id={quote_phase_id}, sort_order={quote_phase_sort}, probability={quote_phase_prob})"
        )
    else:
        print("Quote phase threshold: (none) -> all deals count as quote deals")

    print(f"Deals (total): {len(deals)}")
    print(f"Deals (quote by current phase>=threshold): {len(quote_by_phase)}")
    print(f"Deals (non-quote): {len(non_quote)}")
    print()

    print_counter("Status breakdown (quote by phase):", count_by_status(quote_by_phase))
    print()
    print_counter("Status breakdown (all deals):", count_by_status(deals))
    print()

    print(f"Phase-history coverage (quote phase markers):")
    print(f"  - checked (quote_phase_last_checked_at != null): {len(deals) - len(history_unknown)}")
    print(f"  - unknown/unprocessed: {len(history_unknown)}")
    print(f"  - reached quote phase (quote_phase_first_started_at != null): {len(quote_by_history)}")
    print(f"  - phase>=threshold but never reached quote phase (checked): {len(phase_but_not_history)}")
    if phase_but_not_history and args.show > 0:
        print()
        print(f"Sample phase>=threshold-but-not-history deals (first {min(args.show, len(phase_but_not_history))}):")
        for deal in phase_but_not_history[: args.show]:
            deal_id = str(deal.get("id") or "")
            created_at = deal.get("created_at")
            status = deal.get("status")
            title = str(deal.get("title") or "").strip()
            phase_id = str(deal.get("phase_id") or "")
            phase = phases.get(phase_id)
            phase_name = phase.name if phase else phase_id
            phase_sort = phase.sort_order if phase else None
            url = args.deal_url_template.replace("{id}", urllib.parse.quote(deal_id)) if deal_id else ""
            print(
                f"  - {created_at} | {deal_id} | status={status} | phase={phase_name}({phase_sort}) | {title}"
                + (f" | {url}" if url else "")
            )

    if args.dump:
        if args.dump == "all_ids":
            ids = [str(d.get("id") or "") for d in deals]
        elif args.dump == "quote_ids":
            ids = [str(d.get("id") or "") for d in quote_by_phase]
        elif args.dump == "non_quote_ids":
            ids = [str(d.get("id") or "") for d in non_quote]
        else:
            ids = [str(d.get("id") or "") for d in phase_but_not_history]

        for deal_id in ids:
            if deal_id:
                print(deal_id)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
