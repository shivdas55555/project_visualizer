import { useEffect, useRef } from 'react';
import type { ExecutionTraceStep } from '../../engine/types';

export default function ExplanationPanel({ stepsSoFar }: { stepsSoFar: ExecutionTraceStep[] }) {
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight });
  }, [stepsSoFar.length]);

  const current = stepsSoFar[stepsSoFar.length - 1];

  return (
    <div className="flex flex-col gap-2">
      <p className="rounded-md border border-sky-500/30 bg-sky-950/30 p-3 text-sm text-sky-100">
        {current?.note ?? 'Parse a problem and press play to begin.'}
      </p>
      <div ref={logRef} className="max-h-40 overflow-auto rounded-md border border-slate-800 bg-slate-950/60 p-2 text-xs text-slate-500">
        {stepsSoFar.map((s, i) => (
          <p key={i} className={i === stepsSoFar.length - 1 ? 'text-slate-300' : ''}>
            <span className="mr-1.5 text-slate-600">{s.step}.</span>
            {s.note}
          </p>
        ))}
      </div>
    </div>
  );
}
