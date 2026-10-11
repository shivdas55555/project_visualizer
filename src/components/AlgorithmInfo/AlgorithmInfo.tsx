import type { ReactNode } from 'react';
import type { AlgorithmMeta } from '../../metadata/algorithmRegistry';
import type { ExecutionTraceStep, ProblemRepresentation, Strategy } from '../../engine/types';

interface Props {
  meta: AlgorithmMeta;
  representation: ProblemRepresentation;
  strategy: Strategy;
  currentStep: ExecutionTraceStep | null;
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-[11px] uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="text-sm text-slate-200">{value}</dd>
    </div>
  );
}

export default function AlgorithmInfo({ meta, representation, strategy, currentStep }: Props) {
  return (
    <dl className="flex flex-col gap-3">
      <Row label="Algorithm" value={meta.family === 'dynamic-programming' ? 'Dynamic Programming' : meta.family === 'greedy' ? 'Greedy' : 'Recursion'} />
      <Row label="Problem" value={meta.label} />
      <Row label="Strategy" value={strategy} />
      <Row label="State" value={<span className="font-mono">{representation.state.name}</span>} />
      <Row label="Dimensions" value={`${representation.state.dimensions}D`} />
      <Row label="State meaning" value={meta.stateMeaning} />

      <div className="h-px bg-slate-800" />

      <Row label="Current state" value={currentStep?.state ? <span className="font-mono">{currentStep.state.id}</span> : '—'} />
      <Row label="Current value" value={currentStep?.state?.value ?? '—'} />
      <Row label="Formula" value={<span className="break-words text-xs">{currentStep?.formula ?? '—'}</span>} />

      <div className="h-px bg-slate-800" />

      <Row label="Time complexity" value={<span className="font-mono text-xs">{meta.timeComplexity}</span>} />
      <Row label="Space complexity" value={<span className="font-mono text-xs">{meta.spaceComplexity}</span>} />
    </dl>
  );
}
