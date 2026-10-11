import { useMemo, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import type { ExecutionTrace, ExecutionTraceStep } from '../../engine/types';
import { deriveSnapshot, statusBorder, type SnapshotCell } from '../../utils/deriveSnapshot';

interface Props {
  trace: ExecutionTrace;
  stepsSoFar: ExecutionTraceStep[];
}

const SPACING = 1.4;

function Block({
  cell,
  isActive,
  isDependency,
  onSelect,
}: {
  cell: SnapshotCell;
  isActive: boolean;
  isDependency: boolean;
  onSelect: () => void;
}) {
  const [x, y] = cell.coordinates;
  const numeric = typeof cell.value === 'number' ? cell.value : 0;
  const height = cell.status === 'pending' ? 0.15 : 0.3 + Math.min(1.6, Math.abs(numeric) * 0.08);
  const color = isDependency ? '#F2A33D' : statusBorder[cell.status];

  return (
    <group position={[x * SPACING, height / 2, y * SPACING]}>
      <mesh onClick={onSelect} castShadow>
        <boxGeometry args={[1, height, 1]} />
        <meshStandardMaterial color={color} emissive={isActive ? color : '#000000'} emissiveIntensity={isActive ? 0.5 : 0} />
      </mesh>
      {cell.value !== undefined && (
        <Html position={[0, height / 2 + 0.25, 0]} center distanceFactor={10} style={{ pointerEvents: 'none' }}>
          <div className="whitespace-nowrap rounded bg-slate-900/90 px-1.5 py-0.5 font-mono text-[10px] text-slate-100">
            {cell.value}
          </div>
        </Html>
      )}
    </group>
  );
}

export default function DPGrid3D({ trace, stepsSoFar }: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const snapshot = useMemo(() => deriveSnapshot(stepsSoFar), [stepsSoFar]);
  const current = stepsSoFar[stepsSoFar.length - 1];
  const activeDeps = new Set((current?.dependencies ?? []).map((d) => d.id));

  const selectedStep = useMemo(() => {
    if (!selectedId) return null;
    for (let i = stepsSoFar.length - 1; i >= 0; i--) {
      if (stepsSoFar[i].state?.id === selectedId) return stepsSoFar[i];
    }
    return null;
  }, [selectedId, stepsSoFar]);

  const cells = Array.from(snapshot.values());

  return (
    <div className="relative h-full w-full">
      <Canvas camera={{ position: [8, 8, 10], fov: 45 }} shadows>
        <ambientLight intensity={0.6} />
        <directionalLight position={[6, 10, 6]} intensity={0.8} castShadow />
        <gridHelper args={[30, 30, '#2A3442', '#1C2430']} />
        {cells.map((cell) => (
          <Block
            key={cell.id}
            cell={cell}
            isActive={cell.id === current?.state?.id}
            isDependency={activeDeps.has(cell.id)}
            onSelect={() => setSelectedId(cell.id)}
          />
        ))}
        <OrbitControls makeDefault />
      </Canvas>

      {selectedStep && (
        <div className="absolute bottom-3 left-3 max-w-sm rounded-md border border-slate-700 bg-slate-900/95 p-3 text-xs text-slate-200">
          <p className="font-mono text-sky-300">{selectedStep.state?.id}</p>
          <p className="mt-1">value: {String(selectedStep.state?.value)}</p>
          {selectedStep.formula && <p className="mt-1 text-slate-400">{selectedStep.formula}</p>}
          <button className="mt-2 text-slate-500 underline" onClick={() => setSelectedId(null)}>
            close
          </button>
        </div>
      )}

      <p className="pointer-events-none absolute right-3 top-3 text-[11px] text-slate-500">
        drag to rotate · scroll to zoom · click a block to inspect
      </p>
    </div>
  );
}
