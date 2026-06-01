import { Tag } from 'antd';
import { getReturnColor, getReturnBgColor } from '@/utils/color';
import { formatPercent } from '@/utils/format';

interface ReturnTagProps {
  value?: number | null;
}

export default function ReturnTag({ value }: ReturnTagProps) {
  if (value === undefined || value === null) return <Tag>-</Tag>;
  const color = getReturnColor(value);
  const bg = getReturnBgColor(value);
  return (
    <Tag style={{ color, backgroundColor: bg, borderColor: color }}>
      {formatPercent(value)}
    </Tag>
  );
}
