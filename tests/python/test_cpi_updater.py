from __future__ import annotations

import json
import sys
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "python"))

from cpi_research.updater import SERIES, BlsDataError, build_snapshot, update_snapshot


def fixture_series() -> dict[str, list[dict[str, object]]]:
    result = {}
    for offset, key in enumerate(SERIES):
        observations = []
        for index in range(15):
            year = 2025 + (index + 3) // 12
            month = (index + 3) % 12 + 1
            observations.append({"date": f"{year:04d}-{month:02d}", "value": 100 + offset + index * 0.2})
        result[key] = observations
    return result


class SnapshotTests(unittest.TestCase):
    def test_builds_report_from_common_latest_month(self) -> None:
        snapshot = build_snapshot(
            fixture_series(),
            generated_at=datetime(2026, 7, 15, tzinfo=timezone.utc),
        )

        self.assertEqual(snapshot["releaseMonth"], "2026-06")
        self.assertEqual(snapshot["report"]["releaseMonth"], "2026年6月")
        self.assertEqual(snapshot["series"]["headline_sa"]["seriesId"], "CUSR0000SA0")
        self.assertEqual(snapshot["updatedAt"], "2026-07-15T00:00:00Z")

    def test_rejects_series_without_common_month(self) -> None:
        series = fixture_series()
        series["headline_sa"] = [{"date": "2020-01", "value": 100.0}] * 13

        with self.assertRaisesRegex(BlsDataError, "common release month"):
            build_snapshot(series)

    def test_does_not_rewrite_unchanged_snapshot(self) -> None:
        now = datetime(2026, 7, 15, tzinfo=timezone.utc)
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "latest.json"
            with patch("cpi_research.updater.fetch_bls_series", return_value=fixture_series()):
                self.assertTrue(update_snapshot(output, now=now))
                first = json.loads(output.read_text(encoding="utf-8"))
                self.assertFalse(update_snapshot(output, now=datetime(2026, 7, 16, tzinfo=timezone.utc)))
                second = json.loads(output.read_text(encoding="utf-8"))

            self.assertEqual(first, second)


if __name__ == "__main__":
    unittest.main()
