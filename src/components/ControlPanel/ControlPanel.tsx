import type { Strategy } from '../../engine/types';
import type { StepPlayer, PlaybackSpeed } from '../../engine/stepManager';

interface Props {
  player: StepPlayer;
  strategies: Strategy[];
  strategy: Strategy;
  onStrategyChange: (s: Strategy) => void;
  supports3D: boolean;
  viewMode: '2d' | '3d';
  onViewModeChange: (v: '2d' | '3d') => void;
  supportsGreedyComparison: boolean;
  compareMode: boolean;
  onCompareModeChange: (v: boolean) => void;
}

const SPEEDS: PlaybackSpeed[] = [0.5, 1, 2];

export default function ControlPanel({
  player,
  strategies,
  strategy,
  onStrategyChange,
  supports3D,
  viewMode,
  onViewModeChange,
  supportsGreedyComparison,
  compareMode,
  onCompareModeChange,
}: Props) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-t border-slate-800 bg-slate-900/80 px-4 py-3">
      <div className="flex items-center gap-1.5">
        <button onClick={player.restart} title="Restart" className="control-btn">
          ↺
        </button>
        <button onClick={player.prev} title="Previous" className="control-btn">
          ⏮
        </button>
        {player.isPlaying ? (
          <button onClick={player.pause} title="Pause" className="control-btn">
            ⏸
          </button>
        ) : (
          <button onClick={player.play} title="Play" className="control-btn">
            ▶
          </button>
        )}
        <button onClick={player.next} title="Next" className="control-btn">
          ⏭
        </button>
      </div>

      <input
        type="range"
        min={0}
        max={Math.max(0, player.total - 1)}
        value={Math.max(0, player.currentIndex)}
        onChange={(e) => player.seek(Number(e.target.value))}
        className="h-1 w-40 accent-sky-400"
      />
      <span className="font-mono text-xs text-slate-500">
        {player.total === 0 ? '0 / 0' : `${player.currentIndex + 1} / ${player.total}`}
      </span>

      <div className="flex items-center gap-1 text-xs text-slate-400">
        speed:
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => player.setSpeed(s)}
            className={`rounded px-1.5 py-0.5 ${player.speed === s ? 'bg-sky-500/20 text-sky-200' : 'hover:text-slate-200'}`}
          >
            {s}x
          </button>
        ))}
      </div>

      {strategies.length > 1 && (
        <select
          value={strategy}
          onChange={(e) => onStrategyChange(e.target.value as Strategy)}
          className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-xs text-slate-200"
        >
          {strategies.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      )}

      {supports3D && (
        <div className="flex gap-1 rounded bg-slate-800/60 p-0.5 text-xs">
          {(['2d', '3d'] as const).map((v) => (
            <button
              key={v}
              onClick={() => onViewModeChange(v)}
              className={`rounded px-2 py-1 ${viewMode === v ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400'}`}
            >
              {v.toUpperCase()}
            </button>
          ))}
        </div>
      )}

      {supportsGreedyComparison && (
        <label className="flex items-center gap-1.5 text-xs text-slate-400">
          <input type="checkbox" checked={compareMode} onChange={(e) => onCompareModeChange(e.target.checked)} />
          DP vs Greedy
        </label>
      )}
    </div>
  );
}
