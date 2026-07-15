"""Fetch BLS CPI series and build the versioned frontend snapshot."""

from __future__ import annotations

import json
import math
import os
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

BLS_API_URL = "https://api.bls.gov/publicAPI/v2/timeseries/data/"

SERIES = {
    "headline_sa": {"id": "CUSR0000SA0", "name": "CPI 总项"},
    "headline_nsa": {"id": "CUUR0000SA0", "name": "CPI 总项（未季调）"},
    "core_sa": {"id": "CUSR0000SA0L1E", "name": "核心 CPI"},
    "core_nsa": {"id": "CUUR0000SA0L1E", "name": "核心 CPI（未季调）"},
    "shelter_sa": {"id": "CUSR0000SAH1", "name": "住房"},
    "energy_sa": {"id": "CUSR0000SA0E", "name": "能源"},
    "food_sa": {"id": "CUSR0000SAF1", "name": "食品"},
    "gasoline_sa": {"id": "CUSR0000SETB01", "name": "汽油"},
    "rent_sa": {"id": "CUSR0000SEHA", "name": "主要居所租金"},
    "used_vehicles_sa": {"id": "CUSR0000SETA02", "name": "二手车"},
}


class BlsDataError(RuntimeError):
    """Raised when the BLS response cannot produce a consistent snapshot."""


def _request_json(payload: dict[str, Any], timeout: int = 30, attempts: int = 3) -> dict[str, Any]:
    request = Request(
        BLS_API_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "User-Agent": "xingjian-liepan/0.1"},
        method="POST",
    )
    last_error: Exception | None = None
    for attempt in range(attempts):
        try:
            with urlopen(request, timeout=timeout) as response:
                return json.load(response)
        except HTTPError as error:
            if 400 <= error.code < 500 and error.code != 429:
                raise BlsDataError(f"BLS API returned HTTP {error.code}") from error
            last_error = error
        except (URLError, TimeoutError, json.JSONDecodeError) as error:
            last_error = error
        if attempt + 1 < attempts:
            time.sleep(2**attempt)
    raise BlsDataError(f"Unable to read BLS API response after {attempts} attempts: {last_error}") from last_error


def fetch_bls_series(
    start_year: int,
    end_year: int,
    registration_key: str | None = None,
    timeout: int = 30,
) -> dict[str, list[dict[str, Any]]]:
    """Fetch configured monthly CPI series from the official BLS API."""
    payload: dict[str, Any] = {
        "seriesid": [config["id"] for config in SERIES.values()],
        "startyear": str(start_year),
        "endyear": str(end_year),
    }
    if registration_key:
        payload["registrationkey"] = registration_key

    response = _request_json(payload, timeout=timeout)
    if response.get("status") != "REQUEST_SUCCEEDED":
        messages = "; ".join(response.get("message") or ["unknown BLS error"])
        raise BlsDataError(f"BLS request failed: {messages}")

    raw_series = response.get("Results", {}).get("series")
    if not isinstance(raw_series, list):
        raise BlsDataError("BLS response does not contain a series list")

    by_id = {item.get("seriesID"): item.get("data", []) for item in raw_series}
    result: dict[str, list[dict[str, Any]]] = {}
    for key, config in SERIES.items():
        observations = []
        for item in by_id.get(config["id"], []):
            period = item.get("period", "")
            if not period.startswith("M") or period == "M13":
                continue
            try:
                month = int(period[1:])
                value = float(item["value"])
                year = int(item["year"])
            except (KeyError, TypeError, ValueError) as error:
                raise BlsDataError(f"Invalid observation in {config['id']}") from error
            observations.append({"date": f"{year:04d}-{month:02d}", "value": value})
        observations.sort(key=lambda item: item["date"])
        if len(observations) < 13:
            raise BlsDataError(f"Series {config['id']} has fewer than 13 monthly observations")
        result[key] = observations
    return result


def _percent_change(current: float, previous: float) -> float:
    if not math.isfinite(current) or not math.isfinite(previous) or previous == 0:
        raise BlsDataError("CPI index values must be finite and previous must be non-zero")
    return (current / previous - 1) * 100


def _value_at(observations: list[dict[str, Any]], date: str) -> float:
    values = {item["date"]: item["value"] for item in observations}
    try:
        return float(values[date])
    except KeyError as error:
        raise BlsDataError(f"Series is missing the common release month {date}") from error


def _previous_month(date: str, months: int = 1) -> str:
    year, month = map(int, date.split("-"))
    ordinal = year * 12 + month - 1 - months
    return f"{ordinal // 12:04d}-{ordinal % 12 + 1:02d}"


def _metric(series: dict[str, list[dict[str, Any]]], key: str, date: str, months: int = 1) -> float:
    return _percent_change(
        _value_at(series[key], date),
        _value_at(series[key], _previous_month(date, months)),
    )


def _round(value: float) -> float:
    return round(value, 2)


def _release_label(date: str) -> str:
    year, month = date.split("-")
    return f"{year}年{int(month)}月"


def _build_report(series: dict[str, list[dict[str, Any]]], date: str) -> dict[str, Any]:
    headline_mom = _metric(series, "headline_sa", date)
    headline_yoy = _metric(series, "headline_nsa", date, 12)
    core_mom = _metric(series, "core_sa", date)
    core_yoy = _metric(series, "core_nsa", date, 12)
    shelter_mom = _metric(series, "shelter_sa", date)
    energy_mom = _metric(series, "energy_sa", date)
    food_mom = _metric(series, "food_sa", date)
    gasoline_mom = _metric(series, "gasoline_sa", date)
    rent_mom = _metric(series, "rent_sa", date)
    used_vehicles_mom = _metric(series, "used_vehicles_sa", date)

    cooling = core_mom < 0.25 and core_yoy < 3.0
    headline = (
        "核心通胀延续温和区间，市场可继续观察降温的连续性"
        if cooling
        else "核心通胀仍有粘性，利率路径需要更多数据确认"
    )
    summary = (
        f"BLS 最新数据显示，总 CPI 环比 {_round(headline_mom):+.2f}%，同比 {_round(headline_yoy):+.2f}%；"
        f"核心 CPI 环比 {_round(core_mom):+.2f}%，同比 {_round(core_yoy):+.2f}%。"
        f"住房环比 {_round(shelter_mom):+.2f}%，能源环比 {_round(energy_mom):+.2f}%。"
    )
    confidence = max(55, min(90, round(75 - abs(core_mom - 0.2) * 20)))
    core_level = "cooling" if cooling else "watch"
    shelter_level = "cooling" if shelter_mom < 0.3 else "watch"

    return {
        "releaseMonth": _release_label(date),
        "headline": headline,
        "summary": summary,
        "confidence": confidence,
        "metrics": [
            {"label": "总 CPI 环比", "value": _round(headline_mom), "note": f"同比 {_round(headline_yoy):+.2f}%"},
            {"label": "核心 CPI 环比", "value": _round(core_mom), "note": "季调指数计算"},
            {"label": "核心 CPI 同比", "value": _round(core_yoy), "note": "未季调指数计算"},
            {"label": "住房环比", "value": _round(shelter_mom), "note": "通胀粘性观察项"},
            {"label": "能源环比", "value": _round(energy_mom), "note": "总项波动来源"},
        ],
        "components": [
            {"name": "汽油", "mom": _round(gasoline_mom)},
            {"name": "能源", "mom": _round(energy_mom)},
            {"name": "二手车", "mom": _round(used_vehicles_mom)},
            {"name": "CPI 总项", "mom": _round(headline_mom)},
            {"name": "核心 CPI", "mom": _round(core_mom)},
            {"name": "住房", "mom": _round(shelter_mom)},
            {"name": "主要居所租金", "mom": _round(rent_mom)},
            {"name": "食品", "mom": _round(food_mom)},
        ],
        "signals": [
            {
                "title": "核心通胀趋势",
                "evidence": f"核心 CPI 环比 {_round(core_mom):+.2f}%，同比 {_round(core_yoy):+.2f}%。",
                "level": core_level,
                "tag": "降温" if cooling else "观察",
            },
            {
                "title": "住房粘性",
                "evidence": f"住房环比 {_round(shelter_mom):+.2f}%，主要居所租金环比 {_round(rent_mom):+.2f}%。",
                "level": shelter_level,
                "tag": "改善" if shelter_level == "cooling" else "粘性",
            },
            {
                "title": "能源波动",
                "evidence": f"能源环比 {_round(energy_mom):+.2f}%，汽油环比 {_round(gasoline_mom):+.2f}%。",
                "level": "watch",
                "tag": "观察",
            },
        ],
        "focus": [
            {"name": "核心 CPI", "value": _round(core_mom), "meaning": "决定通胀趋势与短端利率预期的核心读数。"},
            {"name": "住房", "value": _round(shelter_mom), "meaning": "权重大、调整慢，需要连续数月确认方向。"},
            {"name": "主要居所租金", "value": _round(rent_mom), "meaning": "观察住房通胀向官方指数传导的速度。"},
            {"name": "二手车", "value": _round(used_vehicles_mom), "meaning": "商品通胀中波动较大的领先观察项。"},
            {"name": "能源 / 汽油", "value": _round(energy_mom), "meaning": "影响总项 CPI 与短期通胀预期，但月度波动较大。"},
        ],
        "assets": [
            {"name": "美债利率", "bias": "核心降温利多前端" if cooling else "粘性限制下行", "reason": "核心环比和同比共同影响政策利率预期。"},
            {"name": "美元", "bias": "关注相对利差", "reason": "美国核心通胀会通过利率路径改变美元利差优势。"},
            {"name": "权益 / 黄金", "bias": "关注实际利率", "reason": "通胀与名义利率共同决定估值和黄金持有成本。"},
            {"name": "下一验证点", "bias": "等待下一期数据", "reason": "单月读数需结合 PPI、就业和后续 CPI 交叉验证。"},
        ],
    }


def build_snapshot(
    series: dict[str, list[dict[str, Any]]],
    generated_at: datetime | None = None,
) -> dict[str, Any]:
    """Build a consistent, deterministic frontend snapshot."""
    common_dates = set.intersection(*(set(item["date"] for item in values) for values in series.values()))
    if not common_dates:
        raise BlsDataError("Configured series do not share a common release month")
    release_month = max(common_dates)
    generated_at = generated_at or datetime.now(timezone.utc)

    normalized_series = {}
    for key, config in SERIES.items():
        values = [item for item in series[key] if item["date"] <= release_month][-15:]
        normalized_series[key] = {
            "seriesId": config["id"],
            "name": config["name"],
            "observations": values,
        }

    return {
        "schemaVersion": 1,
        "source": "U.S. Bureau of Labor Statistics Public Data API",
        "sourceUrl": BLS_API_URL,
        "releaseMonth": release_month,
        "updatedAt": generated_at.astimezone(timezone.utc).isoformat().replace("+00:00", "Z"),
        "report": _build_report(series, release_month),
        "series": normalized_series,
    }


def _comparable(snapshot: dict[str, Any]) -> dict[str, Any]:
    return {key: value for key, value in snapshot.items() if key != "updatedAt"}


def update_snapshot(
    output: Path,
    registration_key: str | None = None,
    now: datetime | None = None,
) -> bool:
    """Fetch and atomically update the snapshot. Return True only on data changes."""
    now = now or datetime.now(timezone.utc)
    series = fetch_bls_series(now.year - 2, now.year, registration_key=registration_key)
    snapshot = build_snapshot(series, generated_at=now)

    if output.exists():
        try:
            current = json.loads(output.read_text(encoding="utf-8"))
        except json.JSONDecodeError as error:
            raise BlsDataError(f"Existing snapshot is invalid JSON: {output}") from error
        if _comparable(current) == _comparable(snapshot):
            return False

    output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", encoding="utf-8", dir=output.parent, delete=False) as handle:
        json.dump(snapshot, handle, ensure_ascii=False, indent=2)
        handle.write("\n")
        temporary = Path(handle.name)
    os.replace(temporary, output)
    return True
