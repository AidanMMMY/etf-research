import { Card, Statistic } from 'antd';
import { ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';

interface IndicatorCardProps {
  title: string;
  value?: number | null;
  suffix?: string;
  precision?: number;
  prefix?: React.ReactNode;
}

export default function IndicatorCard({ title, value, suffix, precision = 2, prefix }: IndicatorCardProps) {
  const isPositive = value !== undefined && value !== null && value >= 0;
  return (
    <Card size="small">
      <Statistic
        title={title}
        value={value ?? 0}
        precision={precision}
        suffix={suffix}
        prefix={prefix || (isPositive ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
        valueStyle={{ color: isPositive ? '#cf1322' : '#3f8600', fontSize: 20 }}
      />
    </Card>
  );
}
