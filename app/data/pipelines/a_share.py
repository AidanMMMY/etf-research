"""A-share ETF daily ETL pipeline.

Fetches daily OHLCV bars for all active China A-share ETFs and
upserts them into the ``etf_daily_bar`` table.
"""

from datetime import date, timedelta

import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy.dialects.postgresql import insert

from app.data.pipelines.base import ETLPipeline
from app.data.providers.akshare_provider import AkshareProvider
from app.models.etf import ETFDailyBar, ETFInfo


class AShareETLPipeline(ETLPipeline):
    """ETL pipeline for China A-share ETF daily bars."""

    job_name = "a_share_daily_etl"

    def __init__(self, db: Session) -> None:
        provider = AkshareProvider()
        super().__init__(provider=provider, db=db)

    def extract(self) -> pd.DataFrame:
        """Fetch yesterday's daily bars for active A-share ETFs."""
        # 1. Query active A-share ETFs from DB
        etfs = (
            self.db.query(ETFInfo)
            .filter(ETFInfo.market == "china_a")
            .filter(ETFInfo.status == "active")
            .all()
        )

        if not etfs:
            return pd.DataFrame()

        codes = [etf.code for etf in etfs]

        # 2. Determine yesterday's trade date
        yesterday = date.today() - timedelta(days=1)

        # 3. Fetch daily bars (fetch a small window to cover weekends/holidays)
        start_date = yesterday - timedelta(days=7)
        end_date = yesterday

        df = self.provider.fetch_daily_bars(codes, start_date, end_date)

        if df.empty:
            return df

        # 4. Keep only yesterday's data
        df = df[df["trade_date"] == yesterday].copy()

        return df

    def load(self, data: pd.DataFrame) -> int:
        """Upsert daily bar records into ``etf_daily_bar``.

        Uses PostgreSQL ON CONFLICT DO UPDATE for idempotent writes.
        The unique key is (etf_code, trade_date).
        """
        if data.empty:
            return 0

        records = []
        for _, row in data.iterrows():
            record = {
                "etf_code": row.get("etf_code"),
                "trade_date": row.get("trade_date"),
                "open": row.get("open"),
                "high": row.get("high"),
                "low": row.get("low"),
                "close": row.get("close"),
                "volume": row.get("volume"),
                "amount": row.get("amount"),
                "pre_close": row.get("pre_close"),
                "change_pct": row.get("change_pct"),
                "turnover_rate": row.get("turnover_rate"),
            }
            # Drop None values so they don't overwrite existing data on conflict
            record = {k: v for k, v in record.items() if v is not None}
            records.append(record)

        if not records:
            return 0

        stmt = (
            insert(ETFDailyBar)
            .values(records)
            .on_conflict_do_update(
                index_elements=["etf_code", "trade_date"],
                set_={
                    "open": insert(ETFDailyBar).excluded.open,
                    "high": insert(ETFDailyBar).excluded.high,
                    "low": insert(ETFDailyBar).excluded.low,
                    "close": insert(ETFDailyBar).excluded.close,
                    "volume": insert(ETFDailyBar).excluded.volume,
                    "amount": insert(ETFDailyBar).excluded.amount,
                    "pre_close": insert(ETFDailyBar).excluded.pre_close,
                    "change_pct": insert(ETFDailyBar).excluded.change_pct,
                    "turnover_rate": insert(ETFDailyBar).excluded.turnover_rate,
                },
            )
        )

        self.db.execute(stmt)
        self.db.commit()

        return len(records)
