import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, Tabs, Table, Button, Slider, message, Row, Col, Statistic } from 'antd';
import { usePoolDetail, usePoolWeights, usePoolAnalytics, usePoolCorrelation, useUpdateWeight } from '@/hooks/usePoolDetail';
import CategoryPie from '@/components/CategoryPie';
import CorrelationHeatmap from '@/components/CorrelationHeatmap';
import ETFCodeTag from '@/components/ETFCodeTag';

export default function PoolDetail() {
  const { id } = useParams<{ id: string }>();
  const poolId = Number(id);
  const [editing, setEditing] = useState(false);
  const [localWeights, setLocalWeights] = useState<Record<string, number>>({});

  const { data: pool } = usePoolDetail(poolId);
  const { data: weights } = usePoolWeights(poolId);
  const { data: analytics } = usePoolAnalytics(poolId);
  const { data: correlation } = usePoolCorrelation(poolId);
  const updateWeight = useUpdateWeight();

  const handleWeightChange = (code: string, value: number) => {
    setLocalWeights((prev) => ({ ...prev, [code]: value }));
  };

  const handleSaveWeights = async () => {
    for (const [code, weight] of Object.entries(localWeights)) {
      await updateWeight.mutateAsync({ poolId, code, weight });
    }
    message.success('权重已更新');
    setEditing(false);
    setLocalWeights({});
  };

  const weightColumns = [
    {
      title: 'ETF',
      render: (_: unknown, record: any) => <ETFCodeTag code={record.etf_code} name={record.etf_name} />,
    },
    {
      title: '目标权重',
      render: (_: unknown, record: any) => (
        editing ? (
          <Slider
            min={0} max={100} step={1}
            value={localWeights[record.etf_code] ?? record.target_weight}
            onChange={(v) => handleWeightChange(record.etf_code, v)}
            style={{ width: 120 }}
          />
        ) : `${record.target_weight}%`
      ),
    },
    { title: '建议权重', dataIndex: 'suggested_weight', render: (v: number) => v ? `${v.toFixed(1)}%` : '-' },
    { title: '来源', dataIndex: 'weight_source' },
  ];

  const tabItems = [
    {
      key: 'weights',
      label: '成员与权重',
      children: (
        <div>
          <div style={{ marginBottom: 16 }}>
            {editing ? (
              <>
                <Button type="primary" onClick={handleSaveWeights} style={{ marginRight: 8 }}>保存</Button>
                <Button onClick={() => { setEditing(false); setLocalWeights({}); }}>取消</Button>
              </>
            ) : (
              <Button onClick={() => setEditing(true)}>编辑权重</Button>
            )}
          </div>
          <Table dataSource={weights || []} columns={weightColumns} rowKey="etf_code" pagination={false} />
        </div>
      ),
    },
    {
      key: 'distribution',
      label: '持仓分布',
      children: analytics?.category_distribution ? (
        <Row gutter={[16, 16]}>
          <Col xs={24} md={12}>
            <Card title="分类分布"><CategoryPie data={analytics.category_distribution} mode="count" /></Card>
          </Col>
          <Col xs={24} md={12}>
            <Card title="权重分布"><CategoryPie data={analytics.category_distribution} mode="weight" /></Card>
          </Col>
          <Col xs={24}>
            <Card title="池整体表现">
              <Row gutter={16}>
                <Col span={6}><Statistic title="1月收益" value={analytics.performance?.return_1m} suffix="%" precision={2} /></Col>
                <Col span={6}><Statistic title="3月收益" value={analytics.performance?.return_3m} suffix="%" precision={2} /></Col>
                <Col span={6}><Statistic title="夏普" value={analytics.performance?.sharpe_1y} precision={2} /></Col>
                <Col span={6}><Statistic title="最大回撤" value={analytics.performance?.max_drawdown} suffix="%" precision={2} /></Col>
              </Row>
            </Card>
          </Col>
        </Row>
      ) : <div>暂无分析数据</div>,
    },
    {
      key: 'correlation',
      label: '相关性热力图',
      children: correlation ? (
        <CorrelationHeatmap codes={correlation.codes} matrix={correlation.matrix} />
      ) : <div>暂无数据</div>,
    },
  ];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>{pool?.name}</h2>
        <div style={{ color: '#888' }}>{pool?.description} | {pool?.members?.length || 0} 只ETF</div>
      </Card>
      <Tabs items={tabItems} />
    </div>
  );
}
