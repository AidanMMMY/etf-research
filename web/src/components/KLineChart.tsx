import { useEffect, useRef } from 'react';
import { createChart, IChartApi, ISeriesApi, CandlestickData, HistogramData, Time } from 'lightweight-charts';
import type { OHLCV } from '@/types/etf';

interface KLineChartProps {
  data: OHLCV[];
}

export default function KLineChart({ data }: KLineChartProps) {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candlestickRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeRef = useRef<ISeriesApi<'Histogram'> | null>(null);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { color: '#ffffff' },
        textColor: '#333',
      },
      grid: {
        vertLines: { color: '#f0f0f0' },
        horzLines: { color: '#f0f0f0' },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: '#d9d9d9' },
      timeScale: { borderColor: '#d9d9d9' },
      height: 400,
    });

    chartRef.current = chart;

    const candlestick = chart.addCandlestickSeries({
      upColor: '#cf1322',
      downColor: '#3f8600',
      borderUpColor: '#cf1322',
      borderDownColor: '#3f8600',
      wickUpColor: '#cf1322',
      wickDownColor: '#3f8600',
    });
    candlestickRef.current = candlestick;

    const volume = chart.addHistogramSeries({
      color: '#1890ff',
      priceFormat: { type: 'volume' },
      priceScaleId: '',
    });
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });
    volumeRef.current = volume;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
    };
  }, []);

  useEffect(() => {
    if (!data.length || !candlestickRef.current || !volumeRef.current) return;

    const candleData: CandlestickData[] = data.map((d) => ({
      time: d.trade_date.replace(/-/g, '/') as Time,
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }));

    const volumeData: HistogramData[] = data.map((d) => ({
      time: d.trade_date.replace(/-/g, '/') as Time,
      value: d.volume,
      color: d.close >= d.open ? '#cf1322' : '#3f8600',
    }));

    candlestickRef.current.setData(candleData);
    volumeRef.current.setData(volumeData);
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  return <div ref={chartContainerRef} style={{ width: '100%', height: 400 }} />;
}
