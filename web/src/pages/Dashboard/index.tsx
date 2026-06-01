import { Row, Col, Card, Table, List, Statistic } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useScores } from '@/hooks/useScores';
import { useETFList } from '@/hooks/useETFList';
import { statsApi } from '@/api/stats';
import ETFCodeTag from '@/components/ETFCodeTag';
import ReturnTag from '@/components/ReturnTag';
import ScoreBar from '@/components/ScoreBar';

export default function Dashboard() {
  const navigate = useNavigate();
  const { data: scoresData } = useScores({ limit: 10 });
  const { data: etfList } = useETFList({ page_size: 5 });
  const { data: stats } = useQuery({
    queryKey: ['stats-overview'],
    queryFn: () => statsApi.overview().then((r) => r.data),
    staleTime: 60_000,
  });

  const scoreColumns = [
    { title: '排名', dataIndex: 'rank_overall', width: 60 },
    {
      title: 'ETF',
      render: (_: unknown, record: any) => (
        <ETFCodeTag code={record.etf_code} name={record.etf_name} />
      ),
    },
    {
      title: '评分',
      render: (_: unknown, record: any) => <ScoreBar score={record.composite_score} size="small" />,
      width: 120,
    },
    {
      title: '1月收益',
      render: (_: unknown, record: any) => <ReturnTag value={record.return_1m} />,
      width: 100,
    },
  ];

  return (
    <div>
      <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="ETF总数"
              value={stats?.etf_count ?? 0}
              loading={!stats}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="评分覆盖"
              value={stats?.score_count ?? 0}
              suffix={`/ ${stats?.etf_count ?? 0}`}
              loading={!stats}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="分类数"
              value={stats?.category_count ?? 0}
              loading={!stats}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title="评分模板"
              value={stats?.template_count ?? 0}
              loading={!stats}
            />
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card title="综合评分 Top 10">
            <Table
              dataSource={scoresData?.items || []}
              columns={scoreColumns}
              rowKey="etf_code"
              size="small"
              pagination={false}
              onRow={(record) => ({
                onClick: () => navigate(`/etfs/${record.etf_code}`),
                style: { cursor: 'pointer' },
              })}
            />
          </Card>
        </Col>
        <Col xs={24} lg={8}>
          <Card title="最近关注">
            <List
              dataSource={etfList?.items.slice(0, 5) || []}
              renderItem={(item: any) => (
                <List.Item
                  onClick={() => navigate(`/etfs/${item.code}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <List.Item.Meta
                    title={`${item.code} ${item.name}`}
                    description={item.category}
                  />
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
}
