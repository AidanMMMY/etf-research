import { useParams } from 'react-router-dom';
import { Card, Tabs, Row, Col, Statistic, Spin, Descriptions } from 'antd';
import { useETFDetail } from '@/hooks/useETFList';
import { useETFScore } from '@/hooks/useScores';
import { marketApi } from '@/api';
import { useQuery } from '@tanstack/react-query';
import KLineChart from '@/components/KLineChart';
import ScoreRadar from '@/components/ScoreRadar';
import { formatPercent } from '@/utils/format';

export default function ETFDetail() {
  const { code } = useParams<{ code: string }>();
  const { data: etf, isLoading: etfLoading } = useETFDetail(code || '');
  const { data: score } = useETFScore(code || '');

  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['etf-history', code],
    queryFn: () => marketApi.history(code || '', { limit: 120 }).then((r) => r.data),
    enabled: !!code,
  });

  const { data: indicator } = useQuery({
    queryKey: ['etf-indicator', code],
    queryFn: () => marketApi.indicators(code || '').then((r) => r.data),
    enabled: !!code,
  });

  if (etfLoading) return <Spin size="large" style={{ display: 'block', margin: '100px auto' }} />;
  if (!etf) return <div>ETF not found</div>;

  const tabItems = [
    {
      key: 'kline',
      label: 'K线行情',
      children: (
        <div>
          {historyLoading ? <Spin /> : (
            <KLineChart data={historyData?.items || []} />
          )}
        </div>
      ),
    },
    {
      key: 'indicators',
      label: '指标数据',
      children: (
        <Row gutter={[16, 16]}>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="RSI14" value={indicator?.rsi14} precision={1} /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="夏普1年" value={indicator?.sharpe_1y} precision={2} /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="波动率20日" value={indicator?.volatility_20d} precision={2} suffix="%" /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="最大回撤" value={indicator?.max_drawdown_1y} precision={2} suffix="%" /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="1月收益" value={indicator?.return_1m} precision={2} suffix="%" /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="3月收益" value={indicator?.return_3m} precision={2} suffix="%" /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="1年收益" value={indicator?.return_1y} precision={2} suffix="%" /></Card>
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Card><Statistic title="MA5" value={indicator?.ma5} precision={2} /></Card>
          </Col>
        </Row>
      ),
    },
    {
      key: 'score',
      label: '综合评分',
      children: score ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <ScoreRadar data={score} />
          </Col>
          <Col xs={24} md={12}>
            <Card title="评分详情">
              <Descriptions column={1}>
                <Descriptions.Item label="综合评分">{score.composite_score}</Descriptions.Item>
                <Descriptions.Item label="全市场排名">{score.rank_overall}</Descriptions.Item>
                <Descriptions.Item label="分类排名">{score.rank_category}</Descriptions.Item>
                <Descriptions.Item label="收益得分">{score.score_return}</Descriptions.Item>
                <Descriptions.Item label="风险得分">{score.score_risk}</Descriptions.Item>
                <Descriptions.Item label="夏普得分">{score.score_sharpe}</Descriptions.Item>
                <Descriptions.Item label="流动性得分">{score.score_liquidity}</Descriptions.Item>
                <Descriptions.Item label="趋势得分">{score.score_trend}</Descriptions.Item>
              </Descriptions>
            </Card>
          </Col>
        </Row>
      ) : (
        <div>暂无评分数据</div>
      ),
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h2 style={{ margin: 0 }}>{etf.code} {etf.name}</h2>
            <div style={{ color: '#888', fontSize: 14 }}>
              {etf.category} | {etf.market} | {etf.fund_manager}
              {etf.fund_size && ` | 规模: ${(etf.fund_size / 1e8).toFixed(1)}亿`}
            </div>
          </div>
          {indicator?.return_1m !== undefined && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 28, fontWeight: 'bold', color: indicator.return_1m >= 0 ? '#cf1322' : '#3f8600' }}>
                {formatPercent(indicator.return_1m)}
              </div>
              <div style={{ color: '#888', fontSize: 12 }}>1月收益</div>
            </div>
          )}
        </div>
      </Card>

      <Tabs items={tabItems} defaultActiveKey="kline" />
    </div>
  );
}
