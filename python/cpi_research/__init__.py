"""CPI Research data update package."""

from .updater import build_snapshot, fetch_bls_series, update_snapshot

__all__ = ["build_snapshot", "fetch_bls_series", "update_snapshot"]
