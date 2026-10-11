import type { ExecutionTraceStep, TraceEventType } from '../engine/types';

export type CellStatus = 'pending' | 'visiting' | 'settled' | 'rejected' | 'active';

export interface SnapshotCell {
  id: string;
  coordinates: [number, number, number];
  value?: number | string;
  status: CellStatus;
}

const SETTLED_TYPES: TraceEventType[] = ['base-case', 'table-update', 'recursion-return', 'cache-hit', 'greedy-selection', 'completed'];
const VISITING_TYPES: TraceEventType[] = ['recursion-call', 'cache-miss', 'comparison', 'decision', 'init'];

function statusForType(type: TraceEventType): CellStatus {
  if (SETTLED_TYPES.includes(type)) return 'settled';
  if (type === 'greedy-rejection') return 'rejected';
  if (VISITING_TYPES.includes(type)) return 'visiting';
  return 'pending';
}

/**
 * Folds every step up to and including the current one into a single
 * id -> cell map. This is the "current state of the world" that every
 * visualizer (2D grid, 3D grid, recursion tree) renders from — it's derived,
 * never stored separately, so it can never drift out of sync with the trace.
 */
export function deriveSnapshot(stepsSoFar: ExecutionTraceStep[]): Map<string, SnapshotCell> {
  const map = new Map<string, SnapshotCell>();

  for (const step of stepsSoFar) {
    if (!step.state) continue;
    const existing = map.get(step.state.id);
    map.set(step.state.id, {
      id: step.state.id,
      coordinates: step.state.coordinates,
      value: step.state.value ?? existing?.value,
      status: statusForType(step.type),
    });
  }

  const last = stepsSoFar[stepsSoFar.length - 1];
  if (last?.state) {
    const cell = map.get(last.state.id);
    if (cell) cell.status = 'active';
  }

  return map;
}

export const statusColor: Record<CellStatus, string> = {
  pending: '#1C2430',
  visiting: '#2A3B4D',
  settled: '#1E3A2E',
  rejected: '#3B1F1F',
  active: '#0E3B47',
};

export const statusBorder: Record<CellStatus, string> = {
  pending: '#2A3442',
  visiting: '#5CC8FF',
  settled: '#4ADE80',
  rejected: '#E2574C',
  active: '#5CC8FF',
};

export const statusText: Record<CellStatus, string> = {
  pending: '#54637A',
  visiting: '#9FE3FF',
  settled: '#8FE3B4',
  rejected: '#F2A39B',
  active: '#BDEFFF',
};
