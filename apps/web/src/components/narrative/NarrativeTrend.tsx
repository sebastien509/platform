export type TrendDirection = 'up' | 'steady' | 'down';

const CONFIG: Record<TrendDirection, { symbol: string; className: string }> = {
  up: { symbol: '↗', className: 'trend--up' },
  steady: { symbol: '→', className: 'trend--steady' },
  down: { symbol: '↘', className: 'trend--down' },
};

export function NarrativeTrend({ direction }: { direction: TrendDirection }) {
  const { symbol, className } = CONFIG[direction];
  return (
    <span className={`narrative-trend ${className}`} aria-hidden="true">
      {symbol}
    </span>
  );
}
