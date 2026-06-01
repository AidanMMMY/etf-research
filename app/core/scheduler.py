"""APScheduler background task scheduler.

Provides scheduled execution of daily ETL and indicator calculation jobs.
"""

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger

from app.core.database import SessionLocal
from app.data.pipelines.a_share import AShareETLPipeline
from app.data.indicators.calculator import batch_calculate_indicators
from app.services.scoring_service import ScoringService
from app.services.report_service import ReportService
from app.models.pool import ETFPools

scheduler = BackgroundScheduler()


def run_a_share_etl():
    """Run the A-share ETF daily ETL pipeline."""
    db = SessionLocal()
    try:
        pipeline = AShareETLPipeline(db)
        result = pipeline.run_with_retry(max_attempts=3)
        print(
            f"[Scheduler] A-share ETL: success={result.success}, records={result.records}"
        )
    finally:
        db.close()


def run_indicator_calculation():
    """Run the batch indicator calculation for all active ETFs."""
    db = SessionLocal()
    try:
        count = batch_calculate_indicators(db)
        print(f"[Scheduler] Indicator calculation: {count} records updated")
    finally:
        db.close()


def run_score_calculation():
    """Run the daily ETF composite score calculation for all templates."""
    db = SessionLocal()
    try:
        service = ScoringService(db)
        results = service.calculate_daily_scores()
        total = sum(results.values())
        print(f"[Scheduler] Score calculation: {total} scores across {len(results)} templates")
    finally:
        db.close()


def init_scheduler():
    """Initialize and start the background scheduler.

    Registers two cron jobs:
      - A-share ETL at 15:30 daily
      - Indicator calculation at 08:00 daily
    """
    scheduler.add_job(
        run_a_share_etl,
        trigger=CronTrigger(hour=15, minute=30),
        id="a_share_daily_etl",
        name="A股ETF日终采集",
        replace_existing=True,
    )
    scheduler.add_job(
        run_indicator_calculation,
        trigger=CronTrigger(hour=8, minute=0),
        id="indicator_calculation",
        name="指标批量计算",
        replace_existing=True,
    )
    scheduler.add_job(
        run_score_calculation,
        trigger=CronTrigger(hour=8, minute=30),
        id="score_calculation",
        name="评分日终计算",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Started")


def run_weekly_pool_reports():
    """Generate weekly reports for all ETF pools (Sunday 22:00)."""
    db = SessionLocal()
    try:
        service = ReportService(db)
        pools = db.query(ETFPools).all()
        for pool in pools:
            try:
                metadata = service.generate_pool_report(
                    pool_id=pool.id,
                    report_type="pool_weekly",
                    format="html",
                )
                print(
                    f"[Scheduler] Weekly report for pool {pool.id}: {metadata.status}"
                )
            except Exception as e:
                print(f"[Scheduler] Failed to generate report for pool {pool.id}: {e}")
    finally:
        db.close()


def init_scheduler():
    """Initialize and start the background scheduler.

    Registers cron jobs:
      - A-share ETL at 15:30 daily
      - Indicator calculation at 08:00 daily
      - Score calculation at 08:30 daily
      - Weekly pool reports on Sunday at 22:00
    """
    scheduler.add_job(
        run_a_share_etl,
        trigger=CronTrigger(hour=15, minute=30),
        id="a_share_daily_etl",
        name="A股ETF日终采集",
        replace_existing=True,
    )
    scheduler.add_job(
        run_indicator_calculation,
        trigger=CronTrigger(hour=8, minute=0),
        id="indicator_calculation",
        name="指标批量计算",
        replace_existing=True,
    )
    scheduler.add_job(
        run_score_calculation,
        trigger=CronTrigger(hour=8, minute=30),
        id="score_calculation",
        name="评分日终计算",
        replace_existing=True,
    )
    scheduler.add_job(
        run_weekly_pool_reports,
        trigger=CronTrigger(day_of_week="sun", hour=22, minute=0),
        id="weekly_pool_reports",
        name="池周报生成",
        replace_existing=True,
    )
    scheduler.start()
    print("[Scheduler] Started")


def shutdown_scheduler():
    """Shut down the background scheduler if it is running."""
    if scheduler.running:
        scheduler.shutdown()
        print("[Scheduler] Shutdown")
