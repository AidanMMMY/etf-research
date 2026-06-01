import { Progress } from 'antd';
import { getScoreColor } from '@/utils/color';

interface ScoreBarProps {
  score: number;
  size?: 'small' | 'default';
}

export default function ScoreBar({ score, size = 'default' }: ScoreBarProps) {
  return (
    <Progress
      percent={score}
      size={size === 'small' ? ['100%', 12] : ['100%', 16]}
      strokeColor={getScoreColor(score)}
      showInfo={size !== 'small'}
      format={(p) => `${p?.toFixed(1)}`}
    />
  );
}
