#!/usr/bin/env python3
"""Update the CPI Research snapshot from the official BLS API."""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "python"))

from cpi_research.updater import BlsDataError, update_snapshot  # noqa: E402


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output",
        type=Path,
        default=ROOT / "lib" / "cpi" / "data" / "latest.json",
        help="snapshot output path",
    )
    args = parser.parse_args()

    try:
        changed = update_snapshot(args.output, registration_key=os.getenv("BLS_API_KEY"))
    except BlsDataError as error:
        print(f"CPI update failed: {error}", file=sys.stderr)
        return 1

    state = "updated" if changed else "unchanged"
    print(f"CPI snapshot {state}: {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
