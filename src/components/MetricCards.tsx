import { useMemo, useEffect, useRef } from 'react';
import { DollarSign, TrendingUp, MapPin } from 'lucide-react';
import type { TripRow } from '../types';

interface MetricCardsProps {
  data: TripRow[];
}

// Animate a number counting up
function useAnimatedNumber(target: number, duration = 600) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const start = prevTarget.current;
    const diff = target - start;
    const startTime = performance.now();

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + diff * eased;
      if (el) el.textContent = formatNumber(current);
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    prevTarget.current = target;
  }, [target, duration]);

  return ref;
}

function formatNumber(n: number): string {
  return n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function AnimatedValue({ value }: { value: number }) {
  const ref = useAnimatedNumber(value);
  return <span ref={ref}>{formatNumber(value)}</span>;
}

export default function MetricCards({ data }: MetricCardsProps) {
  const { totalSpend, avgSpend, totalTrips, currency } = useMemo(() => {
    const totalSpend = data.reduce((sum, d) => sum + d.fare_amount, 0);
    const totalTrips = data.length;
    const avgSpend = totalTrips > 0 ? totalSpend / totalTrips : 0;

    // Detect most common currency
    const currencyCounts: Record<string, number> = {};
    for (const d of data) {
      const c = d.currency_code || 'USD';
      currencyCounts[c] = (currencyCounts[c] || 0) + 1;
    }
    const currency =
      Object.entries(currencyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'USD';

    return { totalSpend, avgSpend, totalTrips, currency };
  }, [data]);

  const cards = [
    {
      label: 'Total Spending',
      value: totalSpend,
      suffix: ` ${currency}`,
      icon: DollarSign,
      color: 'bg-primary-light text-primary',
    },
    {
      label: 'Average / Trip',
      value: avgSpend,
      suffix: ` ${currency}`,
      icon: TrendingUp,
      color: 'bg-accent-light text-accent',
    },
    {
      label: 'Total Trips',
      value: totalTrips,
      suffix: '',
      icon: MapPin,
      color: 'bg-warning-light text-warning',
      isInt: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map(card => (
        <div
          key={card.label}
          className="bg-surface rounded-2xl border border-border p-5 flex items-start gap-4 hover:shadow-md hover:shadow-black/5 transition-shadow"
        >
          <div className={`shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${card.color}`}>
            <card.icon className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <p className="text-text-muted text-xs font-medium uppercase tracking-wide mb-1">
              {card.label}
            </p>
            <p className="text-2xl font-bold text-text truncate">
              {card.isInt ? (
                <AnimatedIntValue value={card.value} />
              ) : (
                <AnimatedValue value={card.value} />
              )}
              <span className="text-base font-semibold text-text-secondary">{card.suffix}</span>
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function AnimatedIntValue({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prevTarget = useRef(0);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = prevTarget.current;
    const diff = value - start;
    const startTime = performance.now();
    const duration = 600;

    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + diff * eased);
      if (el) el.textContent = current.toLocaleString();
      if (progress < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
    prevTarget.current = value;
  }, [value]);

  return <span ref={ref}>{value.toLocaleString()}</span>;
}
