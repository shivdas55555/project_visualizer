import type { ExecutionTraceStep } from '../../engine/types';

/**
 * Renders a greedy algorithm's trace as a left-to-right decision path:
 * each coin tried is shown as a chip, selected ones solid, rejected ones
 * crossed out. Works for any trace using greedy-selection/greedy-rejection
 * event types, not just Coin Change.
 */
export default function GreedyPath({ stepsSoFar }: { stepsSoFar: ExecutionTraceStep[] }) {
  const relevant = stepsSoFar.filter((s) => s.type === 'greedy-selection' || s.type === 'greedy-rejection' || s.type === 'completed');

  if (relevant.length === 0) {
    return <p className="text-sm text-slate-500">Press play to start the greedy walk.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {relevant.map((step, i) => {
        if (step.type === 'completed') {
          return (
            <div key={i} className="rounded-md border border-sky-400 bg-sky-950/40 px-3 py-1.5 font-mono text-xs text-sky-200">
              result: {String(step.state?.value)}
            </div>
          );
        }
        const selected = step.type === 'greedy-selection';
        return (
          <div
            key={i}
            className={`rounded-md border px-3 py-1.5 font-mono text-xs ${
              selected
                ? 'border-emerald-400 bg-emerald-950/40 text-emerald-200'
                : 'border-rose-500/60 bg-rose-950/30 text-rose-300 line-through'
            }`}
            title={step.note}
          >
            {step.state?.id.replace(/_\d+$/, '')}
          </div>
        );
      })}
    </div>
  );
}
