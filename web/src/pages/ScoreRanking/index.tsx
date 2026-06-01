import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Card, Tabs } from 'antd';
import { useScores, useScoreTemplates } from '@/hooks/useScores';
import ETFCodeTag from '@/components/ETFCodeTag';
import ScoreBar from '@/components/ScoreBar';

export default function ScoreRanking() {
  const navigate = useNavigate();
  const [templateId, setTemplateId] = useState<number | undefined>();
  const { data: scoresData } = useScores({ template_id: templateId, limit: 50 });
  const { data: templates } = useScoreTemplates();

  const columns = [
    { title: '全市场排名', dataIndex: 'rank_overall', width: 90 },
    { title: '分类排名', dataIndex: 'rank_category', width: 90 },
    {
      title: 'ETF',
      render: (_: unknown, record: any) => <ETFCodeTag code={record.etf_code} name={record.etf_name} />,
    },
    {
      title: '综合评分',
      render: (_: unknown, record: any) => <ScoreBar score={record.composite_score} />,
      width: 150,
    },
    { title: '收益', dataIndex: 'score_return', width: 80 },
    { title: '风险', dataIndex: 'score_risk', width: 80 },
    { title: '夏普', dataIndex: 'score_sharpe', width: 80 },
    { title: '流动性', dataIndex: 'score_liquidity', width: 90 },
    { title: '趋势', dataIndex: 'score_trend', width: 80 },
  ];

  const tabItems = templates?.map((t) => ({
    key: String(t.id),
    label: t.name,
  })) || [];

  return (
    <div>
      <Card style={{ marginBottom: 16 }}>
        <Tabs
          activeKey={String(templateId || templates?.find((t) => t.is_default)?.id || '')}
          onChange={(key) => setTemplateId(Number(key))}
          items={tabItems}
        />
      </Card>

      <Card title={`综合评分 Top ${scoresData?.items.length || 0}`}>
        <Table
          dataSource={scoresData?.items || []}
          columns={columns}
          rowKey="etf_code"
          size="small"
          pagination={false}
          onRow={(record) => ({
            onClick: () => navigate(`/etfs/${record.etf_code}`),
            style: { cursor: 'pointer' },
          })}
        />
      </Card>
    </div>
  );
}
