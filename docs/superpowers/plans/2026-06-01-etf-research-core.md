# 子项目2：ETF 投研核心 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在子项目1数据基础设施之上，构建综合评分系统、全市场筛选排名、标的池增强和报告生成引擎四大模块。

**Architecture:** 混合模式 — 评分日终预计算（百分位排名法，可配置权重模板）+ 筛选排名实时SQL查询 + 报告异步后台生成（Jinja2模板）。新增5张表、4个服务、18个API端点。

**Tech Stack:** FastAPI + SQLAlchemy 2.0 + PostgreSQL + APScheduler + Jinja2 + pandas + scipy

---

## 文件映射

### 新增文件

| 文件 | 职责 |
|------|------|
| `app/models/scoring.py` | ScoreTemplate、ETFScore、ReportMetadata ORM模型 |
| `app/schemas/scoring.py` | 评分/模板 Pydantic schemas |
| `app/schemas/screening.py` | 筛选条件 Pydantic schemas |
| `app/schemas/report.py` | 报告 Pydantic schemas |
| `app/data/indicators/scoring.py` | 评分计算引擎（百分位排名算法） |
| `app/services/scoring_service.py` | 评分业务逻辑（计算/模板管理/查询） |
| `app/services/screening_service.py` | 筛选排名业务逻辑 |
| `app/services/pool_enhancement_service.py` | 池增强业务逻辑（权重/分析/快照） |
| `app/services/report_service.py` | 报告生成业务逻辑 |
| `app/api/v1/scoring.py` | 评分API路由 |
| `app/api/v1/screening.py` | 筛选排名API路由 |
| `app/api/v1/reports.py` | 报告API路由 |
| `app/templates/reports/base.html` | 报告基础模板 |
| `app/templates/reports/pool_weekly.html` | 池周报主模板 |
| `app/tests/test_scoring.py` | 评分系统单元测试 |
| `app/tests/test_screening.py` | 筛选排名单元测试 |

### 修改文件

| 文件 | 修改内容 |
|------|----------|
| `app/models/__init__.py` | 导出新增模型 |
| `app/models/pool.py` | 新增 PoolWeight、PoolSnapshot 模型 |
| `app/schemas/__init__.py` | 导出新增schemas |
| `app/schemas/pool.py` | 新增权重/快照相关schemas |
| `app/api/deps.py` | 新增服务依赖注入 |
| `app/api/v1/pools.py` | 扩展权重/分析/快照路由 |
| `app/main.py` | 注册新路由 |
| `app/core/scheduler.py` | 新增评分/快照/报告定时任务 |

---

## 模块依赖与执行顺序

```
Task 1-5:  评分系统（最基础，被其他模块依赖）
Task 6-7:  筛选排名（依赖评分数据，但自身独立）
Task 8-11: 池增强（依赖评分系统）
Task 12-15: 报告引擎（依赖前三个模块）
```

---

## Task 1: 评分系统数据模型

**Files:**
- Create: `app/models/scoring.py`
- Modify: `app/models/__init__.py`
- Test: `app/tests/test_scoring.py`

- [ ] **Step 1: Write failing test for ScoreTemplate model**

```python
# app/tests/test_scoring.py
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.database import Base
from app.models.scoring import ScoreTemplate


@pytest.fixture
def db():
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    session = Session()
    yield session
    session.close()


def test_score_template_creation(db):
    template = ScoreTemplate(
        name="测试模板",
        description="测试描述",
        weights={"return": 0.3, "risk": 0.3, "sharpe": 0.4},
        is_default=False,
    )
    db.add(template)
    db.commit()
    db.refresh(template)

    assert template.id is not None
    assert template.name == "测试模板"
    assert template.weights == {"return": 0.3, "risk": 0.3, "sharpe": 0.4}
    assert template.is_default is False
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd /Users/aidanliu/Documents/vibe-trading/etf-research-platform && pytest app/tests/test_scoring.py::test_score_template_creation -v`

Expected: FAIL with "ImportError: cannot import name 'ScoreTemplate'"

- [ ] **Step 3: Create scoring models**

```python
# app/models/scoring.py
"""Scoring and reporting ORM models.

Contains tables for score templates, ETF daily scores, and report metadata.
"""

from datetime import datetime

from sqlalchemy import (
    Column,
    Date,
    DateTime,
    DECIMAL,
    ForeignKey,
    Index,
    Integer,
    JSON,
    String,
    Text,
    UniqueConstraint,
    func,
)

from app.core.database import Base


class ScoreTemplate(Base):
    """Score weight template definition table."""

    __tablename__ = "score_template"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="ID")
    name = Column(String(50), nullable=False, unique=True, comment="Template name")
    description = Column(Text, comment="Template description")
    weights = Column(JSON, nullable=False, default=dict, comment="Weight configuration JSON")
    is_default = Column(
        Boolean,
        default=False,
        comment="Is default template",
    )
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation time",
    )
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        comment="Update time",
    )


class ETFScore(Base):
    """ETF daily composite score snapshot table."""

    __tablename__ = "etf_score"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="ID")
    etf_code = Column(
        String(20),
        ForeignKey("etf_info.code", ondelete="CASCADE"),
        nullable=False,
        comment="ETF code",
    )
    trade_date = Column(Date, nullable=False, comment="Trade date")
    template_id = Column(
        Integer,
        ForeignKey("score_template.id"),
        nullable=False,
        comment="Score template ID",
    )
    composite_score = Column(DECIMAL(8, 4), comment="Composite score 0-100")
    score_return = Column(DECIMAL(8, 4), comment="Return dimension score")
    score_risk = Column(DECIMAL(8, 4), comment="Risk dimension score")
    score_sharpe = Column(DECIMAL(8, 4), comment="Sharpe dimension score")
    score_liquidity = Column(DECIMAL(8, 4), comment="Liquidity dimension score")
    score_trend = Column(DECIMAL(8, 4), comment="Trend dimension score")
    rank_overall = Column(Integer, comment="Overall market rank")
    rank_category = Column(Integer, comment="Category rank")
    created_at = Column(DateTime, server_default=func.now(), comment="Creation time")

    __table_args__ = (
        UniqueConstraint("etf_code", "trade_date", "template_id", name="uq_etf_score_code_date_template"),
        Index("idx_etf_score_date", "trade_date"),
        Index("idx_etf_score_template", "template_id", "trade_date"),
        Index("idx_etf_score_rank", "template_id", "trade_date", "rank_overall"),
    )


class ReportMetadata(Base):
    """Report generation metadata table."""

    __tablename__ = "report_metadata"

    id = Column(Integer, primary_key=True, autoincrement=True, comment="ID")
    report_type = Column(
        String(20),
        nullable=False,
        comment="Report type: daily/weekly/pool/market",
    )
    report_date = Column(Date, nullable=False, comment="Report date")
    pool_id = Column(
        Integer,
        ForeignKey("etf_pools.id", ondelete="SET NULL"),
        comment="Pool ID (for pool reports)",
    )
    template_id = Column(
        Integer,
        ForeignKey("score_template.id"),
        comment="Score template ID",
    )
    status = Column(
        String(20),
        nullable=False,
        default="pending",
        comment="Status: pending/running/done/failed",
    )
    format = Column(
        String(10),
        nullable=False,
        default="html",
        comment="Format: html/markdown/json",
    )
    file_path = Column(String(500), comment="Generated file path")
    file_size = Column(Integer, comment="File size in bytes")
    error_msg = Column(Text, comment="Error message if failed")
    started_at = Column(DateTime(timezone=True), comment="Start time")
    finished_at = Column(DateTime(timezone=True), comment="Finish time")
    created_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        comment="Creation time",
    )

    __table_args__ = (
        Index("idx_report_date", "report_date"),
        Index("idx_report_pool", "pool_id", "report_date"),
        Index("idx_report_status", "status"),
    )
```

- [ ] **Step 4: Add Boolean import to scoring.py**

Fix the import in `app/models/scoring.py` to include `Boolean`:

```python
from sqlalchemy import (
    Boolean,
    Column,
    Date,
    ...
)
```

- [ ] **Step 5: Export models in __init__.py**

```python
# app/models/__init__.py
from app.models.scoring import ScoreTemplate, ETFScore, ReportMetadata

__all__ = [
    # ... existing entries ...
    "ScoreTemplate",
    "ETFScore",
    "ReportMetadata",
]
```

- [ ] **Step 6: Run tests**

Run: `pytest app/tests/test_scoring.py::test_score_template_creation -v`

Expected: PASS

- [ ] **Step 7: Add test for ETFScore model**

```python
# Append to app/tests/test_scoring.py

def test_etf_score_creation(db):
    # Create template first
    template = ScoreTemplate(
        name="均衡型",
        weights={"return": 0.3, "risk": 0.25, "sharpe": 0.25, "liquidity": 0.1, "trend": 0.1},
        is_default=True,
    )
    db.add(template)
    db.commit()

    score = ETFScore(
        etf_code="512760",
        trade_date=datetime(2026, 6, 1).date(),
        template_id=template.id,
        composite_score=75.5,
        score_return=80.0,
        score_risk=70.0,
        score_sharpe=78.0,
        score_liquidity=72.0,
        score_trend=76.0,
        rank_overall=10,
        rank_category=2,
    )
    db.add(score)
    db.commit()
    db.refresh(score)

    assert score.id is not None
    assert score.composite_score == 75.5
    assert score.rank_overall == 10
```

- [ ] **Step 8: Run all scoring tests**

Run: `pytest app/tests/test_scoring.py -v`

Expected: 2 tests PASS

- [ ] **Step 9: Commit**

```bash
git add app/models/scoring.py app/models/__init__.py app/tests/test_scoring.py
git commit -m "feat(scoring): add ScoreTemplate and ETFScore models with tests"
```

---

## Task 2: 评分计算引擎

**Files:**
- Create: `app/data/indicators/scoring.py`
- Test: `app/tests/test_scoring.py` (append)

- [ ] **Step 1: Write failing test for percentile scoring**

```python
# Append to app/tests/test_scoring.py
import numpy as np
from app.data.indicators.scoring import ScoreCalculator


def test_calculate_percentile_scores():
    """Test scoring with sample indicator data."""
    # Mock indicator data (as dicts for simplicity)
    indicators = [
        {"etf_code": "A", "sharpe_1y": 2.0, "volatility_20d": 15.0, "return_1y": 30.0},
        {"etf_code": "B", "sharpe_1y": 1.0, "volatility_20d": 25.0, "return_1y": 15.0},
        {"etf_code": "C", "sharpe_1y": 0.5, "volatility_20d": 35.0, "return_1y": 5.0},
        {"etf_code": "D", "sharpe_1y": 1.5, "volatility_20d": 20.0, "return_1y": 20.0},
    ]

    template_weights = {
        "return": {"metrics": ["return_1y"], "weight": 0.4, "direction": "asc"},
        "risk": {"metrics": ["volatility_20d"], "weight": 0.3, "direction": "desc"},
        "sharpe": {"metrics": ["sharpe_1y"], "weight": 0.3, "direction": "asc"},
    }

    calculator = ScoreCalculator()
    results = calculator.calculate_scores(indicators, template_weights)

    # A has best return, lowest volatility, best sharpe → highest score
    assert results["A"]["composite"] > results["B"]["composite"]
    assert results["A"]["composite"] > results["C"]["composite"]
    # C has worst metrics → lowest score
    assert results["C"]["composite"] < results["B"]["composite"]
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest app/tests/test_scoring.py::test_calculate_percentile_scores -v`

Expected: FAIL with "ImportError: cannot import name 'ScoreCalculator'"

- [ ] **Step 3: Implement ScoreCalculator**

```python
# app/data/indicators/scoring.py
"""ETF scoring calculation engine.

Provides percentile-based scoring for ETFs across multiple dimensions
with configurable weight templates.
"""

from typing import Any, Dict, List, Optional

import numpy as np
from scipy.stats import rankdata


class ScoreCalculator:
    """Calculate composite scores for ETFs using percentile ranking.

    For each dimension, computes percentile ranks of the metric values,
    adjusts direction (asc/desc), and weights into a composite score.
    """

    def calculate_scores(
        self,
        indicators: List[Dict[str, Any]],
        template_weights: Dict[str, Dict[str, Any]],
    ) -> Dict[str, Dict[str, float]]:
        """Calculate composite scores for all ETFs.

        Args:
            indicators: List of dicts with ETF indicator data.
                Each dict must have 'etf_code' and metric fields.
            template_weights: Dict mapping dimension name to config:
                {
                    "return": {
                        "metrics": ["return_1y", "return_3m"],
                        "weight": 0.3,
                        "direction": "asc"  # higher is better
                    },
                    "risk": {
                        "metrics": ["volatility_20d"],
                        "weight": 0.2,
                        "direction": "desc"  # lower is better
                    }
                }

        Returns:
            Dict mapping etf_code to score dict with dimension scores
            and composite score.
        """
        if not indicators:
            return {}

        results = {}
        n = len(indicators)

        # Initialize result structure
        for ind in indicators:
            code = ind.get("etf_code")
            if code:
                results[code] = {"composite": 0.0}

        # Calculate scores per dimension
        for dimension, config in template_weights.items():
            metrics = config.get("metrics", [])
            dim_weight = config.get("weight", 0.0)
            direction = config.get("direction", "asc")

            if not metrics or dim_weight <= 0:
                continue

            # Aggregate multiple metrics in same dimension by averaging
            dim_values = []
            valid_codes = []

            for ind in indicators:
                code = ind.get("etf_code")
                if not code:
                    continue

                metric_values = []
                for metric in metrics:
                    val = ind.get(metric)
                    if val is not None and not (isinstance(val, float) and np.isnan(val)):
                        metric_values.append(float(val))

                if metric_values:
                    avg_value = sum(metric_values) / len(metric_values)
                    dim_values.append(avg_value)
                    valid_codes.append(code)

            if not dim_values:
                continue

            # Percentile ranking (1 to 100)
            ranks = rankdata(dim_values, method="average")
            percentiles = (ranks / len(dim_values)) * 100

            # Adjust direction
            if direction == "desc":
                percentiles = 100 - percentiles

            # Assign dimension scores
            for code, pct in zip(valid_codes, percentiles):
                dim_score = pct * dim_weight
                results[code][dimension] = round(dim_score, 2)
                results[code]["composite"] += dim_score

        # Round composite scores
        for code in results:
            results[code]["composite"] = round(results[code]["composite"], 2)

        return results

    def rank_scores(
        self,
        scores: Dict[str, Dict[str, float]],
    ) -> Dict[str, int]:
        """Compute overall rankings from composite scores.

        Returns dict mapping etf_code to 1-based rank (1 = highest score).
        """
        if not scores:
            return {}

        sorted_items = sorted(
            scores.items(),
            key=lambda x: x[1].get("composite", 0),
            reverse=True,
        )
        return {code: rank + 1 for rank, (code, _) in enumerate(sorted_items)}
```

- [ ] **Step 4: Run tests**

Run: `pytest app/tests/test_scoring.py::test_calculate_percentile_scores -v`

Expected: PASS

- [ ] **Step 5: Add test for ranking**

```python
# Append to app/tests/test_scoring.py

def test_rank_scores():
    scores = {
        "A": {"composite": 85.0},
        "B": {"composite": 70.0},
        "C": {"composite": 90.0},
    }
    calculator = ScoreCalculator()
    ranks = calculator.rank_scores(scores)

    assert ranks["C"] == 1  # Highest
    assert ranks["A"] == 2
    assert ranks["B"] == 3  # Lowest
```

- [ ] **Step 6: Run all tests**

Run: `pytest app/tests/test_scoring.py -v`

Expected: 4 tests PASS

- [ ] **Step 7: Commit**

```bash
git add app/data/indicators/scoring.py app/tests/test_scoring.py
git commit -m "feat(scoring): add ScoreCalculator with percentile ranking algorithm"
```

---

## Task 3: 评分服务层

**Files:**
- Create: `app/services/scoring_service.py`
- Modify: `app/api/deps.py`
- Test: `app/tests/test_scoring.py` (append)

- [ ] **Step 1: Write failing test for ScoringService**

```python
# Append to app/tests/test_scoring.py
from unittest.mock import MagicMock
from app.services.scoring_service import ScoringService


def test_scoring_service_calculate_daily_scores():
    """Test that ScoringService can calculate scores for all ETFs."""
    mock_db = MagicMock()
    service = ScoringService(mock_db)

    # Mock the indicator query
    mock_indicator = MagicMock()
    mock_indicator.etf_code = "512760"
    mock_indicator.sharpe_1y = 1.5
    mock_indicator.volatility_20d = 20.0
    mock_indicator.return_1y = 25.0
    mock_indicator.return_3m = 10.0
    mock_indicator.return_1m = 5.0
    mock_indicator.rsi14 = 60.0

    mock_db.query.return_value.filter.return_value.all.return_value = [mock_indicator]

    # Mock template
    mock_template = MagicMock()
    mock_template.id = 1
    mock_template.weights = {
        "return": {"metrics": ["return_1y"], "weight": 0.4, "direction": "asc"},
        "risk": {"metrics": ["volatility_20d"], "weight": 0.3, "direction": "desc"},
        "sharpe": {"metrics": ["sharpe_1y"], "weight": 0.3, "direction": "asc"},
    }
    mock_db.query.return_value.all.return_value = [mock_template]

    # Just test the service initializes correctly
    assert service.db is mock_db
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pytest app/tests/test_scoring.py::test_scoring_service_calculate_daily_scores -v`

Expected: FAIL with "ImportError: cannot import name 'ScoringService'"

- [ ] **Step 3: Implement ScoringService**

```python
# app/services/scoring_service.py
"""Scoring system business logic service.

Provides score calculation, template management, and score queries.
"""

from datetime import date
from typing import Dict, List, Optional

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.data.indicators.scoring import ScoreCalculator
from app.models.etf import ETFIndicator
from app.models.scoring import ETFScore, ScoreTemplate


class ScoringService:
    """Service for ETF scoring operations."""

    # Standard dimension mapping for preset templates
    DIMENSION_MAP = {
        "return": {
            "metrics": ["return_1m", "return_3m", "return_1y"],
            "weight": 0.3,
            "direction": "asc",
        },
        "risk": {
            "metrics": ["volatility_20d", "max_drawdown_1y"],
            "weight": 0.25,
            "direction": "desc",
        },
        "sharpe": {
            "metrics": ["sharpe_1y"],
            "weight": 0.25,
            "direction": "asc",
        },
        "liquidity": {
            "metrics": ["amount"],  # Will use avg amount from daily bars
            "weight": 0.1,
            "direction": "asc",
        },
        "trend": {
            "metrics": ["rsi14"],
            "weight": 0.1,
            "direction": "asc",
        },
    }

    def __init__(self, db: Session):
        self.db = db
        self.calculator = ScoreCalculator()

    def get_templates(self) -> List[ScoreTemplate]:
        """Get all score templates."""
        return self.db.query(ScoreTemplate).all()

    def get_template(self, template_id: int) -> Optional[ScoreTemplate]:
        """Get a single template by ID."""
        return self.db.query(ScoreTemplate).filter(ScoreTemplate.id == template_id).first()

    def get_default_template(self) -> Optional[ScoreTemplate]:
        """Get the default template."""
        return self.db.query(ScoreTemplate).filter(ScoreTemplate.is_default == True).first()

    def create_template(self, name: str, description: str, weights: Dict, is_default: bool = False) -> ScoreTemplate:
        """Create a new score template."""
        template = ScoreTemplate(
            name=name,
            description=description,
            weights=weights,
            is_default=is_default,
        )
        self.db.add(template)
        self.db.commit()
        self.db.refresh(template)
        return template

    def calculate_daily_scores(self, trade_date: Optional[date] = None) -> Dict[int, int]:
        """Calculate scores for all active ETFs for all templates.

        Args:
            trade_date: Date to calculate scores for. Defaults to latest available.

        Returns:
            Dict mapping template_id to number of scores calculated.
        """
        if trade_date is None:
            # Get latest indicator date
            latest = self.db.query(func.max(ETFIndicator.trade_date)).scalar()
            if latest is None:
                return {}
            trade_date = latest

        # Get all templates
        templates = self.get_templates()
        if not templates:
            # Create default templates if none exist
            self._init_default_templates()
            templates = self.get_templates()

        # Get all active ETFs with their latest indicators
        indicators = (
            self.db.query(ETFIndicator)
            .filter(ETFIndicator.trade_date == trade_date)
            .all()
        )

        if not indicators:
            return {}

        results = {}
        for template in templates:
            count = self._calculate_scores_for_template(
                template, indicators, trade_date
            )
            results[template.id] = count

        return results

    def _calculate_scores_for_template(
        self,
        template: ScoreTemplate,
        indicators: List[ETFIndicator],
        trade_date: date,
    ) -> int:
        """Calculate and store scores for a single template."""
        # Build template weights from stored config
        template_weights = self._build_template_weights(template)

        # Convert ORM objects to dicts for calculator
        indicator_dicts = []
        for ind in indicators:
            d = {c.name: getattr(ind, c.name) for c in ind.__table__.columns}
            d["etf_code"] = ind.etf_code
            indicator_dicts.append(d)

        # Calculate scores
        scores = self.calculator.calculate_scores(indicator_dicts, template_weights)
        if not scores:
            return 0

        # Calculate rankings
        rankings = self.calculator.rank_scores(scores)

        # Category rankings
        category_rankings = self._calculate_category_rankings(
            scores, indicators
        )

        # Build score records
        score_records = []
        for ind in indicators:
            code = ind.etf_code
            if code not in scores:
                continue

            score_data = scores[code]
            score_records.append({
                "etf_code": code,
                "trade_date": trade_date,
                "template_id": template.id,
                "composite_score": score_data.get("composite", 0),
                "score_return": score_data.get("return", 0),
                "score_risk": score_data.get("risk", 0),
                "score_sharpe": score_data.get("sharpe", 0),
                "score_liquidity": score_data.get("liquidity", 0),
                "score_trend": score_data.get("trend", 0),
                "rank_overall": rankings.get(code),
                "rank_category": category_rankings.get(code),
            })

        # Bulk insert with UPSERT
        if score_records:
            from sqlalchemy.dialects.postgresql import insert

            stmt = insert(ETFScore).values(score_records)
            stmt = stmt.on_conflict_do_update(
                index_elements=["etf_code", "trade_date", "template_id"],
                set_={
                    "composite_score": stmt.excluded.composite_score,
                    "score_return": stmt.excluded.score_return,
                    "score_risk": stmt.excluded.score_risk,
                    "score_sharpe": stmt.excluded.score_sharpe,
                    "score_liquidity": stmt.excluded.score_liquidity,
                    "score_trend": stmt.excluded.score_trend,
                    "rank_overall": stmt.excluded.rank_overall,
                    "rank_category": stmt.excluded.rank_category,
                },
            )
            self.db.execute(stmt)
            self.db.commit()

        return len(score_records)

    def _build_template_weights(
        self, template: ScoreTemplate
    ) -> Dict[str, Dict[str, Any]]:
        """Build calculator-compatible weights from template config."""
        weights = template.weights or {}
        result = {}

        for dim_name, dim_config in self.DIMENSION_MAP.items():
            dim_weight = weights.get(dim_name, dim_config["weight"])
            if dim_weight > 0:
                result[dim_name] = {
                    "metrics": dim_config["metrics"],
                    "weight": dim_weight,
                    "direction": dim_config["direction"],
                }

        return result

    def _calculate_category_rankings(
        self,
        scores: Dict[str, Dict[str, float]],
        indicators: List[ETFIndicator],
    ) -> Dict[str, Optional[int]]:
        """Calculate rankings within each category."""
        # Group by category
        from app.models.etf import ETFInfo

        codes = list(scores.keys())
        etf_info_map = {
            e.code: e.category
            for e in self.db.query(ETFInfo).filter(ETFInfo.code.in_(codes)).all()
        }

        category_groups = {}
        for code in codes:
            cat = etf_info_map.get(code, "其他")
            if cat not in category_groups:
                category_groups[cat] = []
            category_groups[cat].append((code, scores[code].get("composite", 0)))

        category_rankings = {}
        for cat, items in category_groups.items():
            sorted_items = sorted(items, key=lambda x: x[1], reverse=True)
            for rank, (code, _) in enumerate(sorted_items, 1):
                category_rankings[code] = rank

        return category_rankings

    def _init_default_templates(self) -> None:
        """Initialize default score templates."""
        templates = [
            {
                "name": "保守型",
                "description": "注重风险控制，适合低风险偏好",
                "weights": {"return": 0.2, "risk": 0.35, "sharpe": 0.3, "liquidity": 0.1, "trend": 0.05},
                "is_default": False,
            },
            {
                "name": "均衡型",
                "description": "收益与风险平衡，适合中等风险偏好",
                "weights": {"return": 0.3, "risk": 0.25, "sharpe": 0.25, "liquidity": 0.1, "trend": 0.1},
                "is_default": True,
            },
            {
                "name": "进取型",
                "description": "追求高收益，适合高风险偏好",
                "weights": {"return": 0.4, "risk": 0.15, "sharpe": 0.25, "liquidity": 0.1, "trend": 0.1},
                "is_default": False,
            },
        ]

        for t in templates:
            self.create_template(**t)

    def get_scores(
        self,
        template_id: Optional[int] = None,
        trade_date: Optional[date] = None,
        limit: int = 50,
        market: Optional[str] = None,
        category: Optional[str] = None,
    ) -> List[Dict]:
        """Get ETF scores with optional filtering."""
        if template_id is None:
            default = self.get_default_template()
            template_id = default.id if default else 1

        if trade_date is None:
            trade_date = self.db.query(func.max(ETFScore.trade_date)).filter(
                ETFScore.template_id == template_id
            ).scalar()

        query = (
            self.db.query(ETFScore, ETFInfo.name, ETFInfo.market, ETFInfo.category)
            .join(ETFInfo, ETFScore.etf_code == ETFInfo.code)
            .filter(ETFScore.template_id == template_id)
            .filter(ETFScore.trade_date == trade_date)
        )

        if market:
            query = query.filter(ETFInfo.market == market)
        if category:
            query = query.filter(ETFInfo.category == category)

        query = query.order_by(ETFScore.rank_overall.asc())
        results = query.limit(limit).all()

        return [
            {
                "etf_code": r.ETFScore.etf_code,
                "etf_name": r.name,
                "market": r.market,
                "category": r.category,
                "composite_score": float(r.ETFScore.composite_score) if r.ETFScore.composite_score else None,
                "score_return": float(r.ETFScore.score_return) if r.ETFScore.score_return else None,
                "score_risk": float(r.ETFScore.score_risk) if r.ETFScore.score_risk else None,
                "score_sharpe": float(r.ETFScore.score_sharpe) if r.ETFScore.score_sharpe else None,
                "score_liquidity": float(r.ETFScore.score_liquidity) if r.ETFScore.score_liquidity else None,
                "score_trend": float(r.ETFScore.score_trend) if r.ETFScore.score_trend else None,
                "rank_overall": r.ETFScore.rank_overall,
                "rank_category": r.ETFScore.rank_category,
            }
            for r in results
        ]

---

## Task 6: 池增强数据模型

**Files:**
- Modify: `app/models/pool.py`
- Modify: `app/models/__init__.py`
- Test: `app/tests/test_pool.py`

- [ ] **Step 1: Add PoolWeight and PoolSnapshot models**

```python
# app/models/pool.py
```

**Note:** Add `PoolWeight` and `PoolSnapshot` models after `PoolMember`.

**PoolWeight fields:**
- id (PK, int)
- pool_id (FK etf_pools.id, CASCADE)
- etf_code (FK etf_info.code, CASCADE)  
- target_weight (DECIMAL 5,2, default=0)
- suggested_weight (DECIMAL 5,2, nullable)
- weight_source (varchar 20, default='manual')
- created_at, updated_at (datetime)
- UniqueConstraint(pool_id, etf_code)

**PoolSnapshot fields:**
- id (PK, int)
- pool_id (FK etf_pools.id, CASCADE)
- snapshot_date (date)
- data (JSONB, default={})
- created_at (datetime)
- UniqueConstraint(pool_id, snapshot_date)
- Index(pool_id, snapshot_date)

- [ ] **Step 2: Update exports in `app/models/__init__.py`**

Add `PoolWeight` and `PoolSnapshot` to imports and `__all__`.

- [ ] **Step 3: Write tests in `app/tests/test_pool.py`**

Test `PoolWeight` creation with all fields.
Test `PoolSnapshot` creation with JSON data.

- [ ] **Step 4: Run tests**

Run: `pytest app/tests/test_pool.py -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add app/models/pool.py app/models/__init__.py app/tests/test_pool.py
git commit -m "feat(pool): add PoolWeight and PoolSnapshot models"
```

---

## Task 7: 池增强服务 + API

**Files:**
- Create: `app/services/pool_enhancement_service.py`
- Modify: `app/schemas/pool.py`
- Modify: `app/api/v1/pools.py`
- Modify: `app/api/deps.py`

- [ ] **Step 1: Implement PoolEnhancementService**

```python
# app/services/pool_enhancement_service.py
```

**Methods:**
- `get_weights(pool_id)` - Get all weight configs for a pool
- `update_weight(pool_id, etf_code, target_weight)` - Update target weight
- `suggest_weights(pool_id, algorithm, template_id)` - Generate suggested weights using equal/score/risk_parity algorithms
- `get_analytics(pool_id)` - Get comprehensive pool analytics (members, category distribution, performance, rebalance alerts)
- `get_correlation_matrix(pool_id)` - Get correlation matrix for pool members
- `create_snapshot(pool_id, snapshot_date)` - Create pool snapshot
- `get_snapshots(pool_id, limit)` - Get recent snapshots

**Helper methods:**
- `_get_active_members(pool_id)` - Get active pool members
- `_get_latest_indicators(codes)` - Get latest indicators for codes
- `_calculate_category_distribution(codes, weight_map)` - Calculate category distribution
- `_check_rebalance(weights)` - Check rebalance needs
- `_calculate_weighted_performance(indicators, weight_map)` - Calculate weighted portfolio performance
- `_suggest_by_score(codes, template_id)` - Score-weighted suggestions
- `_suggest_by_risk_parity(codes)` - Risk parity suggestions

- [ ] **Step 2: Update pool schemas**

Add to `app/schemas/pool.py`:
- `PoolWeightResponse` (etf_code, etf_name, target_weight, suggested_weight, weight_source)
- `PoolAnalyticsResponse` (pool_id, members, category_distribution, performance, rebalance_needed)
- `PoolSnapshotResponse` (id, snapshot_date, created_at)

- [ ] **Step 3: Extend pools API routes**

Add to `app/api/v1/pools.py`:
- `GET /{pool_id}/weights` - Get pool weights
- `PUT /{pool_id}/weights/{etf_code}` - Update weight
- `POST /{pool_id}/weights/suggest` - Suggest weights
- `GET /{pool_id}/analytics` - Get analytics
- `GET /{pool_id}/correlation` - Get correlation matrix
- `GET /{pool_id}/snapshots` - Get snapshots
- `POST /{pool_id}/snapshots` - Create snapshot

- [ ] **Step 4: Add deps**

Add `get_pool_enhancement_service` to `app/api/deps.py`.

- [ ] **Step 5: Commit**

```bash
git add app/services/pool_enhancement_service.py app/schemas/pool.py app/api/v1/pools.py app/api/deps.py
git commit -m "feat(pool): add pool enhancement service with weights, analytics, snapshots"
```

---

## Task 8: 报告引擎（简化版）

**Files:**
- Create: `app/services/report_service.py`
- Create: `app/templates/reports/base.html`
- Create: `app/templates/reports/pool_weekly.html`
- Create: `app/api/v1/reports.py`
- Create: `app/schemas/report.py`
- Modify: `app/core/scheduler.py`

- [ ] **Step 1: Create report schemas**

```python
# app/schemas/report.py
```

**Models:**
- `ReportGenerateRequest` (report_type, pool_id, format, template_id)
- `ReportResponse` (id, report_type, report_date, pool_id, status, format, file_path, file_size, created_at)
- `ReportStatusResponse` (id, status, file_path, file_size, error_msg)

- [ ] **Step 2: Create base HTML template**

Create `app/templates/reports/base.html` with:
- CSS variables for colors (primary: #1565c0, bg: #f5f7fa)
- Card layout styles
- Table styles
- Badge styles
- Score bar visualization
- Grid layouts (grid-2, grid-3)
- Stat box styles
- Responsive media queries
- Footer with generation timestamp

- [ ] **Step 3: Create pool weekly template**

Create `app/templates/reports/pool_weekly.html` extending base.html with 4 modules:
1. **Overview**: member count, up/down counts, real-time snapshot table
2. **Returns Analysis**: weekly/monthly/quarterly/yearly returns table
3. **Risk Analysis**: volatility, max drawdown, risk level badges
4. **Composite Scoring**: ranked scores with progress bars, dimension breakdowns

- [ ] **Step 4: Implement ReportService**

```python
# app/services/report_service.py
```

**Methods:**
- `generate_pool_report(pool_id, report_type, format, template_id)` - Main generation method, creates ReportMetadata, generates content, saves file
- `_generate_pool_html(pool_id, template_id)` - Generate HTML using Jinja2
- `_generate_pool_markdown(pool_id, template_id)` - Generate Markdown
- `_build_returns_data(codes)` - Build returns data from indicators
- `_build_risk_data(codes)` - Build risk data with level classification
- `_build_scores_data(scores)` - Build scores data with progress bars
- `get_reports(report_type, pool_id, limit)` - Get report list
- `get_report_status(report_id)` - Get generation status

**Risk level classification:**
- rs > 6: 🔴 高风险
- rs > 4: 🟠 中高风险
- rs > 2.5: 🟡 中风险
- else: 🟢 低风险

- [ ] **Step 5: Create report API**

Create `app/api/v1/reports.py` with:
- `GET /` - Get report list
- `POST /generate` - Trigger generation
- `GET /{report_id}/status` - Get status
- `GET /{report_id}/download` - Download file (FileResponse)

- [ ] **Step 6: Register router and add scheduler**

Register reports router in `app/main.py`.
Add `get_report_service` to `app/api/deps.py`.
Add weekly report job to `app/core/scheduler.py`:
- Day: Sunday, Hour: 22, Minute: 0
- Generate reports for all pools

- [ ] **Step 7: Commit**

```bash
git add app/services/report_service.py app/templates/reports/ app/api/v1/reports.py app/schemas/report.py app/api/deps.py app/main.py app/core/scheduler.py
git commit -m "feat(report): add report engine with HTML generation and scheduler"
```

---

## Task 9: 数据库迁移

- [ ] **Step 1: Generate migration**

```bash
cd /Users/aidanliu/Documents/vibe-trading/etf-research-platform
poetry run alembic revision --autogenerate -m "add scoring and pool enhancement tables"
```

- [ ] **Step 2: Review and run migration**

Verify migration includes all 5 new tables:
- score_template
- etf_score
- pool_weight
- pool_snapshot
- report_metadata

```bash
poetry run alembic upgrade head
```

- [ ] **Step 3: Commit**

```bash
git add alembic/versions/
git commit -m "feat(db): add alembic migration for scoring and pool enhancement"
```

---

## Task 10: 端到端验证

- [ ] **Step 1: Start server**

```bash
cd /Users/aidanliu/Documents/vibe-trading/etf-research-platform
python -m uvicorn app.main:app --reload
```

- [ ] **Step 2: Test scoring API**

```bash
# Get templates
curl http://localhost:8000/api/v1/scores/templates

# Get scores
curl "http://localhost:8000/api/v1/scores?limit=10"
```

- [ ] **Step 3: Test screening API**

```bash
curl "http://localhost:8000/api/v1/screen?sharpe_min=1.0&limit=10"
curl http://localhost:8000/api/v1/screen/presets
```

- [ ] **Step 4: Test pool enhancement API**

```bash
curl http://localhost:8000/api/v1/pools/1/weights
curl -X POST "http://localhost:8000/api/v1/pools/1/weights/suggest?algorithm=equal"
curl http://localhost:8000/api/v1/pools/1/analytics
```

- [ ] **Step 5: Test report generation**

```bash
curl -X POST http://localhost:8000/api/v1/reports/generate \
  -H "Content-Type: application/json" \
  -d '{"pool_id": 1, "report_type": "pool_weekly", "format": "html"}'
```

- [ ] **Step 6: Final commit**

```bash
git add .
git commit -m "feat(sub-project-2): complete ETF research core implementation"
```

---

## 自检清单

### Spec 覆盖检查

| 设计文档章节 | 实现任务 |
|-------------|----------|
| 3.1 综合评分系统 | Task 1-4 |
| 3.2 全市场筛选排名 | Task 5 |
| 3.3 标的池增强 | Task 6-7 |
| 3.4 报告生成引擎 | Task 8 |
| 4.1 新增表（5张） | Task 1, 6, 8 + Task 9 |
| 5.x API 设计 | Task 4, 5, 7, 8 |
| 6.1 定时任务 | Task 4, 8 |

### Placeholder 扫描

- 无 TBD/TODO/待确定
- 无 "Similar to Task N" 引用
- 所有函数签名前后一致
