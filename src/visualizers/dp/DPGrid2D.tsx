import { useMemo } from 'react';
import type { ExecutionTrace, ExecutionTraceStep } from '../../engine/types';
import { deriveSnapshot, statusColor, statusBorder, statusText, type SnapshotCell } from '../../utils/deriveSnapshot';

interface Props {
  trace: ExecutionTrace;
  stepsSoFar: ExecutionTraceStep[];
  dimensions: 1 | 2;
}

/**
 * Renders a 1D row or 2D grid purely from the execution trace. It has no
 * idea whether it's looking at Fibonacci, Coin Change, or Knapsack — it just
 * knows "here are cells with coordinates, values, and statuses."
 */
export default function DPGrid2D({ trace, stepsSoFar, dimensions }: Props) {
  const { maxX, maxY } = useMemo(() => {
    let mx = 0;
    let my = 0;
    for (const step of trace) {
      if (step.state) {
        mx = Math.max(mx, step.state.coordinates[0]);
        my = Math.max(my, step.state.coordinates[1]);
      }
      for (const dep of step.dependencies ?? []) {
        mx = Math.max(mx, dep.coordinates[0]);
        my = Math.max(my, dep.coordinates[1]);
      }
    }
    return { maxX: mx, maxY: my };
  }, [trace]);

  const snapshot = useMemo(() => deriveSnapshot(stepsSoFar), [stepsSoFar]);

  const byCoord = useMemo(() => {
    const map = new Map<string, SnapshotCell>();
    for (const cell of snapshot.values()) {
      map.set(`${cell.coordinates[0]},${cell.coordinates[1]}`, cell);
    }
    return map;
  }, [snapshot]);

  const current = stepsSoFar[stepsSoFar.length - 1];
  const activeDeps = new Set((current?.dependencies ?? []).map((d) => `${d.coordinates[0]},${d.coordinates[1]}`));

  const rows = dimensions === 2 ? maxY + 1 : 1;
  const cols = maxX + 1;

  return (
    <div className="overflow-auto">
      <div className="inline-flex flex-col gap-1">
        {Array.from({ length: rows }).map((_, y) => (
          <div key={y} className="flex gap-1">
            {Array.from({ length: cols }).map((_, x) => {
              const key = `${x},${y}`;
              const cell = byCoord.get(key);
              const isDep = activeDeps.has(key);
              const status = cell?.status ?? 'pending';

              return (
                <div
                  key={key}
                  className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md border text-[11px] transition-colors duration-200"
                  style={{
                    backgroundColor: statusColor[status],
                    borderColor: isDep ? '#F2A33D' : statusBorder[status],
                    borderWidth: isDep ? 2 : 1,
                    color: statusText[status],
                  }}
                  title={`(${x}${dimensions === 2 ? `, ${y}` : ''})`}
                >
                  <span className="opacity-60">
                    {dimensions === 2 ? `[${y}][${x}]` : `[${x}]`}
                  </span>
                  <span className="font-mono text-sm font-semibold">{cell?.value ?? '·'}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
