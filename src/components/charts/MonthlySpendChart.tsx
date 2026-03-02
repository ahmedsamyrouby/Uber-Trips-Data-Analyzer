import { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { format, parse } from 'date-fns';
import type { TripRow } from '../../types';

interface MonthlySpendChartProps {
  data: TripRow[];
  currency: string;
}

export default function MonthlySpendChart({ data, currency }: MonthlySpendChartProps) {
  const chartData = useMemo(() => {
    const map = new Map<string, { spend: number; trips: number }>();

    for (const d of data) {
      const key = format(d.request_timestamp_local, 'yyyy-MM');
      const entry = map.get(key) ?? { spend: 0, trips: 0 };
      entry.spend += d.fare_amount;
      entry.trips += 1;
      map.set(key, entry);
    }

    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, { spend, trips }]) => ({
        month,
        label: format(parse(month, 'yyyy-MM', new Date()), 'MMM yyyy'),
        spend: Math.round(spend * 100) / 100,
        trips,
      }));
  }, [data]);

  if (chartData.length === 0) return null;

  return (
    <div className="bg-surface rounded-2xl border border-border p-5">
      <h3 className="text-sm font-semibold text-text mb-4">Monthly Spending Trend</h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#276EF1" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#276EF1" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#E2E5EA" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
            axisLine={false}
            tickLine={false}
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
                  <p className="font-semibold text-text mb-1">{d.label}</p>
                  <p className="text-text-secondary">
                    Spent: <span className="font-medium text-primary">{d.spend.toLocaleString(undefined, { minimumFractionDigits: 2 })} {currency}</span>
                  </p>
                  <p className="text-text-secondary">
                    Trips: <span className="font-medium text-text">{d.trips}</span>
                  </p>
                </div>
              );
            }}
          />
          <Area
            type="monotone"
            dataKey="spend"
            stroke="#276EF1"
            strokeWidth={2.5}
            fill="url(#spendGradient)"
            dot={false}
            activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
