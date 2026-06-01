import ReactECharts from 'echarts-for-react';
import type { EChartsOption } from 'echarts';

interface CorrelationHeatmapProps {
  codes: string[];
  matrix: number[][];
}

export default function CorrelationHeatmap({ codes, matrix }: CorrelationHeatmapProps) {
  const data: [number, number, number][] = [];
  matrix.forEach((row, i) => {
    row.forEach((val, j) => {
      data.push([i, j, parseFloat(val.toFixed(2))]);
    });
  });

  const option: EChartsOption = {
    tooltip: {
      position: 'top',
      formatter: (params: any) => {
        const i = params.data[0];
        const j = params.data[1];
        const v = params.data[2];
        return `${codes[i]} vs ${codes[j]}: ${v}`;
      },
    },
    grid: { top: 40, bottom: 60, left: 60, right: 20 },
    xAxis: {
      type: 'category',
      data: codes,
      splitArea: { show: true },
      axisLabel: { rotate: 45, fontSize: 10 },
    },
    yAxis: {
      type: 'category',
      data: codes,
      splitArea: { show: true },
      axisLabel: { fontSize: 10 },
    },
    visualMap: {
      min: -1,
      max: 1,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: 0,
      inRange: { color: ['#3f8600', '#fff', '#cf1322'] },
    },
    series: [{
      type: 'heatmap',
      data,
      label: { show: true, fontSize: 10 },
      emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
    }],
  };

  return <ReactECharts option={option} style={{ height: 400 }} />;
}
