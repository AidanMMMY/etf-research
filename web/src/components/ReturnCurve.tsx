import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface SeriesData {
  name: string;
  dates: string[];
  values: number[];
}

interface ReturnCurveProps {
  series: SeriesData[];
}

export default function ReturnCurve({ series }: ReturnCurveProps) {
  const option: EChartsOption = {
    tooltip: { trigger: 'axis' },
    legend: { top: 0 },
    grid: { left: 50, right: 20, top: 40, bottom: 30 },
    xAxis: {
      type: 'category',
      data: series[0]?.dates || [],
      axisLabel: { fontSize: 10 },
    },
    yAxis: {
      type: 'value',
      axisLabel: { formatter: '{value}%', fontSize: 10 },
    },
    series: series.map((s) => ({
      name: s.name,
      type: 'line',
      data: s.values,
      smooth: true,
      symbol: 'none',
    })),
  };

  return <ReactECharts option={option} style={{ height: 320 }} />;
}
