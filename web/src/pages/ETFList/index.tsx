import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Table, Input, Select, Space } from 'antd';
import { useETFList, useETFCategories, useETFMarkets } from '@/hooks/useETFList';
import ETFCodeTag from '@/components/ETFCodeTag';

export default function ETFList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [market, setMarket] = useState<string | undefined>();
  const [category, setCategory] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data, isLoading } = useETFList({ search: search || undefined, market, category, page, page_size: 50 });
  const { data: categories } = useETFCategories();
  const { data: markets } = useETFMarkets();

  const columns = [
    {
      title: 'ETF',
      render: (_: unknown, record: any) => <ETFCodeTag code={record.code} name={record.name} />,
    },
    { title: '分类', dataIndex: 'category' },
    { title: '市场', dataIndex: 'market', width: 80 },
    { title: '管理公司', dataIndex: 'fund_manager' },
    {
      title: '规模',
      dataIndex: 'fund_size',
      render: (v: number) => v ? `${(v / 1e8).toFixed(1)}亿` : '-',
      width: 100,
    },
    {
      title: '操作',
      width: 80,
      render: (_: unknown, record: any) => (
        <a onClick={() => navigate(`/etfs/${record.code}`)}>详情</a>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input.Search
          placeholder="搜索ETF代码或名称"
          allowClear
          onSearch={(v) => { setSearch(v); setPage(1); }}
          style={{ width: 250 }}
        />
        <Select
          placeholder="市场"
          allowClear
          style={{ width: 120 }}
          options={markets?.map((m: string) => ({ label: m, value: m }))}
          onChange={(v) => { setMarket(v); setPage(1); }}
        />
        <Select
          placeholder="分类"
          allowClear
          style={{ width: 150 }}
          options={categories?.map((c: string) => ({ label: c, value: c }))}
          onChange={(v) => { setCategory(v); setPage(1); }}
        />
      </Space>

      <Table
        dataSource={data?.items || []}
        columns={columns}
        rowKey="code"
        loading={isLoading}
        pagination={{
          current: page,
          pageSize: 50,
          total: data?.total || 0,
          onChange: setPage,
        }}
        onRow={(record) => ({
          onClick: () => navigate(`/etfs/${record.code}`),
          style: { cursor: 'pointer' },
        })}
      />
    </div>
  );
}
