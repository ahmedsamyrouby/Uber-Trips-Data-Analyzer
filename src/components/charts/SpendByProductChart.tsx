import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import type { TripRow } from '../../types';
import { CHART_COLORS } from '../../constants';

interface SpendByProductChartProps {
  data: TripRow[];
  currency: string;
}

export default function SpendByProductChart({ data, currency }: SpendByProductChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, number>();
    for (const d of data) {
      map.set(d.product_type_name, (map.get(d.product_type_name) ?? 0) + d.fare_amount);
    }
    return [...map.entries()]
      .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
      .sort((a, b) => b.value - a.value);
  }, [data]);

  if (chartData.length === 0) return null;

  const total = chartData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-surface rounded-2xl border border-border p-5 flex flex-col">
      <h3 className="text-sm font-semibold text-text mb-4">Spend by Product Type</h3>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height={280}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius="55%"
              outerRadius="80%"
              paddingAngle={2}
              dataKey="value"
              stroke="none"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.[0]) return null;
                const d = payload[0].payload as (typeof chartData)[number];
                const pct = ((d.value / total) * 100).toFixed(1);
                return (
                  <div className="bg-surface rounded-xl border border-border shadow-lg p-3 text-sm">
                    <p className="font-semibold text-text mb-1">{d.name}</p>
                    <p className="text-text-secondary">
                      {d.value.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}
                      <span className="text-text-muted ml-1">({pct}%)</span>
                    </p>
                  </div>
                );
              }}
            />
            <Legend
              verticalAlign="bottom"
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-text-secondary">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
