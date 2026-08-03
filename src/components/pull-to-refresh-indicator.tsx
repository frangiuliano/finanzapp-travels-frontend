import { glassPill } from '@/lib/glass';
import { cn } from '@/lib/utils';

const SIZE = 22;
const STROKE_WIDTH = 2.5;
const RADIUS = (SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

interface PullToRefreshIndicatorProps {
  /** 0 to 1+, how far through the pull gesture the user is. */
  progress: number;
  isRefreshing: boolean;
  isReady: boolean;
  /** True while the finger is actively dragging; disables the dashoffset transition. */
  isDragging: boolean;
}

export function PullToRefreshIndicator({
  progress,
  isRefreshing,
  isReady,
  isDragging,
}: PullToRefreshIndicatorProps) {
  const clampedProgress = Math.min(1, Math.max(0, progress));
  const dashOffset = isRefreshing
    ? CIRCUMFERENCE * 0.3
    : CIRCUMFERENCE * (1 - clampedProgress);

  return (
    <div
      className={cn(
        glassPill,
        'flex size-9 items-center justify-center transition-transform duration-150',
        isReady && !isRefreshing && 'scale-110',
      )}
    >
      <svg
        width={SIZE}
        height={SIZE}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className={cn(isRefreshing && 'animate-spin')}
      >
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--border)"
          strokeWidth={STROKE_WIDTH}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--primary)"
          strokeWidth={STROKE_WIDTH}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          className={cn(
            !isDragging && 'transition-[stroke-dashoffset] duration-150',
          )}
        />
      </svg>
    </div>
  );
}
