'use client';

import { Heading, Stack } from '@bonterratech/stitch-extension';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LineChartData {
  categories: string[];
  data: number[];
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  seriesName: string;
}

interface BarChartData {
  categories: string[];
  data: number[];
  title: string;
  xAxisLabel: string;
  yAxisLabel: string;
  seriesName: string;
}

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ margin: '0 0 4px 0', fontWeight: '600', color: '#1a1a1a' }}>{label}</p>
        <p style={{ margin: 0, color: '#7C3AED', fontWeight: '500' }}>
          {payload[0].name}: {payload[0].value}
        </p>
      </div>
    );
  }
  return null;
};

export function ClientLineChart({ categories, data, title, seriesName }: LineChartData) {
  const chartData = categories.map((category, index) => ({
    name: category,
    [seriesName]: data[index],
  }));

  return (
    <Stack space="300">
      <Heading level={3}>{title}</Heading>
      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#666' }}
            iconType="circle"
          />
          <Line
            type="monotone"
            dataKey={seriesName}
            stroke="#7C3AED"
            strokeWidth={3}
            dot={{ fill: '#7C3AED', r: 5, strokeWidth: 2, stroke: '#ffffff' }}
            activeDot={{ r: 6, strokeWidth: 2 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Stack>
  );
}

export function ClientBarChart({ categories, data, title, seriesName }: BarChartData) {
  const chartData = categories.map((category, index) => ({
    name: category,
    [seriesName]: data[index],
  }));

  return (
    <Stack space="300">
      <Heading level={3}>{title}</Heading>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#666' }}
            iconType="rect"
          />
          <Bar dataKey={seriesName} fill="#7C3AED" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </Stack>
  );
}

interface StackedBarChartData {
  categories: string[];
  series: Array<{
    name: string;
    data: number[];
    color: string;
  }>;
  title: string;
  yAxisLabel?: string;
  onBarClick?: (index: number, categoryName: string) => void;
}

// Custom tooltip for stacked bar chart
const StackedTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #e5e5e5',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
        }}
      >
        <p style={{ margin: '0 0 8px 0', fontWeight: '600', color: '#1a1a1a' }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} style={{ margin: '4px 0', color: entry.color, fontWeight: '500' }}>
            {entry.name}: ${(entry.value / 1000).toFixed(1)}k
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export function ClientStackedBarChart({ categories, series, title, yAxisLabel, onBarClick }: StackedBarChartData) {
  const chartData = categories.map((category, index) => {
    const dataPoint: any = { name: category, index };
    series.forEach(s => {
      dataPoint[s.name] = s.data[index];
    });
    return dataPoint;
  });

  const handleClick = (data: any) => {
    if (onBarClick && data && data.index !== undefined) {
      onBarClick(data.index, data.name);
    }
  };

  return (
    <Stack space="300">
      <Heading level={3}>
        {title}
        {onBarClick && (
          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#6b7280', marginLeft: '8px' }}>
            (Click bar to drill down)
          </span>
        )}
      </Heading>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="name"
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
          />
          <YAxis
            tick={{ fill: '#666', fontSize: 12 }}
            axisLine={{ stroke: '#e5e5e5' }}
            tickLine={{ stroke: '#e5e5e5' }}
            label={yAxisLabel ? { value: yAxisLabel, angle: -90, position: 'insideLeft', style: { fill: '#666', fontSize: 12 } } : undefined}
          />
          <Tooltip content={<StackedTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '12px', color: '#666' }}
            iconType="rect"
          />
          {series.map((s, index) => (
            <Bar
              key={s.name}
              dataKey={s.name}
              stackId="a"
              fill={s.color}
              radius={index === series.length - 1 ? [6, 6, 0, 0] : [0, 0, 0, 0]}
              cursor={onBarClick ? 'pointer' : 'default'}
              onClick={handleClick}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Stack>
  );
}
