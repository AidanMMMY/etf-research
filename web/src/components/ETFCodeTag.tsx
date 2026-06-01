import { Tag, Tooltip } from 'antd';

interface ETFCodeTagProps {
  code: string;
  name?: string;
}

export default function ETFCodeTag({ code, name }: ETFCodeTagProps) {
  return (
    <Tooltip title={name || code}>
      <Tag color="blue">{code}</Tag>
      {name && <span style={{ marginLeft: 4, fontSize: 12, color: '#666' }}>{name}</span>}
    </Tooltip>
  );
}
