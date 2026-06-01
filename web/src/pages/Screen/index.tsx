import { useNavigate } from 'react-router-dom';
import { Table, Card, Space, Select, InputNumber, Button, Tag, Row, Col } from 'antd';
import { useScreenResults, useScreenPresets, useScreenCategories } from '@/hooks/useScreenResults';
import { useScreenStore } from '@/stores/screen';
import ETFCodeTag from '@/components/ETFCodeTag';
import ReturnTag from '@/components/ReturnTag';

export default function Screen() {
  const navigate = useNavigate();
  const { filters, preset, setFilter, resetFilters, applyPreset } = useScreenStore();
  const { data: results, isLoading } = useScreenResults(filters);
  const { data: presets } = useScreenPresets();
  const { data: categories } = useScreenCategories();

  const columns = [
    { title: '代码', dataIndex: 'code', width: 90, render: (v: string, r: any) => <ETFCodeTag code={v} name={r.name} /> },
    { title: '分类', dataIndex: 'category', width: 100 },
    { title: '评分', dataIndex: 'composite_score', width: 80 },
    { title: 'RSI', dataIndex: 'rsi14', width: 70, render: (v: number) => v?.toFixed(1) },
    { title: '夏普', dataIndex: 'sharpe_1y', width: 80, render: (v: number) => v?.toFixed(2) },
    { title: '1月', dataIndex: 'return_1m', width: 90, render: (v: number) => <ReturnTag value={v} /> },
    { title: '3月', dataIndex: 'return_3m', width: 90, render: (v: number) => <ReturnTag value={v} /> },
    { title: '1年', dataIndex: 'return_1y', width: 90, render: (v: number) => <ReturnTag value={v} /> },
    { title: '波动率', dataIndex: 'volatility_20d', width: 90, render: (v: number) => v ? `${v.toFixed(1)}%` : '-' },
  ];

  return (
    <div>
      <Card size="small" style={{ marginBottom: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <span style={{ marginRight: 8 }}>快速筛选:</span>
          {presets?.map((p) => (
            <Tag
              key={p.key}
              color={preset === p.key ? 'blue' : 'default'}
              style={{ cursor: 'pointer' }}
              onClick={() => applyPreset(preset === p.key ? null : p.key)}
            >
              {p.name}
            </Tag>
          ))}
        </div>

        <Row gutter={[16, 8]}>
          <Col xs={12} sm={8} md={6}>
            <Select
              placeholder="市场"
              allowClear
              style={{ width: '100%' }}
              value={filters.market}
              options={[{ label: '上海', value: 'SH' }, { label: '深圳', value: 'SZ' }]}
              onChange={(v) => setFilter('market', v)}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <Select
              placeholder="分类"
              allowClear
              style={{ width: '100%' }}
              value={filters.category}
              options={categories?.map((c: any) => ({ label: `${c.category} (${c.count})`, value: c.category }))}
              onChange={(v) => setFilter('category', v)}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <InputNumber
              placeholder="评分最小"
              style={{ width: '100%' }}
              min={0} max={100}
              value={filters.score_min}
              onChange={(v) => setFilter('score_min', v || undefined)}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <InputNumber
              placeholder="RSI最小"
              style={{ width: '100%' }}
              min={0} max={100}
              value={filters.rsi_min}
              onChange={(v) => setFilter('rsi_min', v || undefined)}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <InputNumber
              placeholder="夏普最小"
              style={{ width: '100%' }}
              value={filters.sharpe_min}
              onChange={(v) => setFilter('sharpe_min', v || undefined)}
            />
          </Col>
          <Col xs={12} sm={8} md={6}>
            <InputNumber
              placeholder="波动率最大"
              style={{ width: '100%' }}
              value={filters.volatility_max}
              onChange={(v) => setFilter('volatility_max', v || undefined)}
            />
          </Col>
        </Row>

        <Space style={{ marginTop: 12 }}>
          <Button onClick={resetFilters}>重置条件</Button>
          <span style={{ color: '#888' }}>共 {results?.count || 0} 只</span>
        </Space>
      </Card>

      <Table
        dataSource={results?.items || []}
        columns={columns}
        rowKey="code"
        loading={isLoading}
        pagination={{ pageSize: 50 }}
        scroll={{ x: 900 }}
        onRow={(record) => ({
          onClick: () => navigate(`/etfs/${record.code}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
}
