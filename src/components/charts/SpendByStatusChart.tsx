import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import type { TripRow } from '../../types';
import { STATUS_COLORS, CHART_COLORS } from '../../constants';

interface SpendByStatusChartProps {
  data: TripRow[];
  currency: string;
}

export default function SpendByStatusChart({ data, currency }: SpendByStatusChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(d.status, (map.get(d.status) ?? 0) + d.fare_amount);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-text mb-4">Spend by Trip Status</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: string) => v.replace('_', ' ')}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#9CA3AF' }}
              axisLine={false}
              tickLine={false}
              tickFormatter={v => `${(v as number).toLocaleString()}`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as (typeof chartData)[number];
                return (
                  <div className="bg-surface rounded-xl border border-border shadow-lg p-3 text-sm">
                    <p className="font-semibold text-text mb-1 capitalize">
                      {d.name.replace('_', ' ')}
                    </p>
                    <p className="text-text-secondary">
                      {d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                    </p>
                  </div>
                );
              }}
            />
            <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={60}>
              {chartData.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={STATUS_COLORS[entry.name] ?? CHART_COLORS[i % CHART_COLORS.length]}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
