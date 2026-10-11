import { useState } from 'react';
import { parseProblem } from '../../ai/parser';
import { buildProblemRepresentation } from '../../ai/schema';
import { validateProblemRepresentation } from '../../ai/validator';
import { algorithmRegistry, implementedAlgorithmIds } from '../../metadata/algorithmRegistry';
import type { ProblemRepresentation } from '../../engine/types';

interface Props {
  onParsed: (rep: ProblemRepresentation) => void;
}

const EXAMPLES = [
  { label: 'Coin Change', text: 'Given coins [1,3,4] and target 6, find the minimum number of coins.' },
  { label: '0/1 Knapsack', text: 'Given weights [2,3,4], values [3,4,5] and capacity 5, find maximum value.' },
  { label: 'Fibonacci', text: 'Find the fibonacci number for n = 10.' },
];

export default function ProblemInput({ onParsed }: Props) {
  const [mode, setMode] = useState<'text' | 'code'>('text');
  const [text, setText] = useState('');
  const [errors, setErrors] = useState<string[] | null>(null);
  const [manualAlgo, setManualAlgo] = useState<string>('');
  const [manualFields, setManualFields] = useState<Record<string, string>>({});

  const handleParse = () => {
    const { representation, validation } = parseProblem(text);
    if (validation.valid && representation) {
      setErrors(null);
      onParsed(representation);
    } else {
      setErrors(validation.errors);
    }
  };

  const handleManualSubmit = () => {
    if (!manualAlgo) return;
    let input: Record<string, any> = {};

    if (manualAlgo === 'fibonacci') {
      input = { n: Number(manualFields.n) };
    } else if (manualAlgo === 'coin-change') {
      input = {
        coins: (manualFields.coins ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)),
        target: Number(manualFields.target),
      };
    } else if (manualAlgo === 'knapsack') {
      input = {
        weights: (manualFields.weights ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)),
        values: (manualFields.values ?? '').split(',').map((s) => Number(s.trim())).filter((n) => Number.isFinite(n)),
        capacity: Number(manualFields.capacity),
      };
    }

    const representation = buildProblemRepresentation(manualAlgo, input, 'high');
    const validation = validateProblemRepresentation(representation);
    if (validation.valid && representation) {
      setErrors(null);
      onParsed(representation);
    } else {
      setErrors(validation.errors);
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-1 rounded-md bg-slate-800/60 p-1 text-xs">
        {(['text', 'code'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 rounded px-2 py-1.5 transition-colors ${
              mode === m ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {m === 'text' ? 'Problem Statement' : 'Source Code'}
          </button>
        ))}
      </div>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={5}
        placeholder={
          mode === 'text'
            ? 'e.g. Given coins [1,3,4] and target 6, find the minimum number of coins.'
            : 'Paste source code here. The parser will look for recognizable arrays/keywords in it.'
        }
        className="w-full resize-none rounded-md border border-slate-700 bg-slate-900 px-3 py-2 font-mono text-xs text-slate-200 focus:border-sky-400 focus:outline-none"
      />

      <div className="flex flex-wrap gap-1.5">
        {EXAMPLES.map((ex) => (
          <button
            key={ex.label}
            onClick={() => setText(ex.text)}
            className="rounded border border-slate-700 px-2 py-1 text-[11px] text-slate-400 hover:border-sky-400 hover:text-sky-200"
          >
            {ex.label}
          </button>
        ))}
      </div>

      <button
        onClick={handleParse}
        className="rounded-md bg-sky-500 px-3 py-2 text-sm font-medium text-slate-950 hover:bg-sky-400"
      >
        Parse &amp; Visualize
      </button>

      {errors && (
        <div className="rounded-md border border-amber-500/40 bg-amber-950/30 p-3 text-xs text-amber-200">
          {errors.map((e, i) => (
            <p key={i}>{e}</p>
          ))}

          <div className="mt-3 border-t border-amber-500/20 pt-3">
            <p className="mb-1.5 text-amber-100">Or pick the algorithm manually:</p>
            <select
              value={manualAlgo}
              onChange={(e) => setManualAlgo(e.target.value)}
              className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
            >
              <option value="">Select algorithm…</option>
              {implementedAlgorithmIds.map((id) => (
                <option key={id} value={id}>
                  {algorithmRegistry[id].label}
                </option>
              ))}
            </select>

            {manualAlgo === 'fibonacci' && (
              <input
                placeholder="n"
                onChange={(e) => setManualFields({ n: e.target.value })}
                className="mt-2 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
              />
            )}
            {manualAlgo === 'coin-change' && (
              <div className="mt-2 flex gap-2">
                <input
                  placeholder="coins, e.g. 1,3,4"
                  onChange={(e) => setManualFields((f) => ({ ...f, coins: e.target.value }))}
                  className="w-1/2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                />
                <input
                  placeholder="target"
                  onChange={(e) => setManualFields((f) => ({ ...f, target: e.target.value }))}
                  className="w-1/2 rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                />
              </div>
            )}
            {manualAlgo === 'knapsack' && (
              <div className="mt-2 flex flex-col gap-2">
                <input
                  placeholder="weights, e.g. 2,3,4"
                  onChange={(e) => setManualFields((f) => ({ ...f, weights: e.target.value }))}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                />
                <input
                  placeholder="values, e.g. 3,4,5"
                  onChange={(e) => setManualFields((f) => ({ ...f, values: e.target.value }))}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                />
                <input
                  placeholder="capacity"
                  onChange={(e) => setManualFields((f) => ({ ...f, capacity: e.target.value }))}
                  className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-slate-200"
                />
              </div>
            )}

            {manualAlgo && (
              <button
                onClick={handleManualSubmit}
                className="mt-2 w-full rounded bg-amber-500 px-2 py-1.5 text-xs font-medium text-slate-950 hover:bg-amber-400"
              >
                Use this input
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
