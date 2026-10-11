import type { AlgorithmModule, ExecutionTrace, Strategy } from '../../engine/types';

const CODE: Record<string, string> = {
  tabulation: `function knapsack(weights, values, capacity) {
  const n = weights.length;
  const dp = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));

  for (let i = 1; i <= n; i++) {
    for (let w = 0; w <= capacity; w++) {
      if (weights[i - 1] <= w) {
        dp[i][w] = Math.max(
          dp[i - 1][w],
          values[i - 1] + dp[i - 1][w - weights[i - 1]]
        );
      } else {
        dp[i][w] = dp[i - 1][w];
      }
    }
  }
  return dp[n][capacity];
}`,
};

// x = w (capacity used), y = i (item index), z = 0 — matches the spec's 3D convention.
const coords = (i: number, w: number): [number, number, number] => [w, i, 0];

function traceTabulation(weights: number[], values: number[], capacity: number): ExecutionTrace {
  const trace: ExecutionTrace = [];
  const n = weights.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => Array(capacity + 1).fill(0));
  let step = 0;

  for (let w = 0; w <= capacity; w++) {
    trace.push({
      step: step++,
      type: 'base-case',
      state: { id: `dp_0_${w}`, coordinates: coords(0, w), value: 0, meaning: 'dp[0][w] = 0 items available' },
      codeLine: 3,
      note: `dp[0][${w}] = 0 — with zero items, no value is possible`,
    });
  }

  for (let i = 1; i <= n; i++) {
    const w_i = weights[i - 1];
    const v_i = values[i - 1];

    for (let w = 0; w <= capacity; w++) {
      if (w_i <= w) {
        const skip = dp[i - 1][w];
        const take = v_i + dp[i - 1][w - w_i];
        const value = Math.max(skip, take);
        dp[i][w] = value;

        trace.push({
          step: step++,
          type: 'table-update',
          state: { id: `dp_${i}_${w}`, coordinates: coords(i, w), value },
          dependencies: [
            { id: `dp_${i - 1}_${w}`, coordinates: coords(i - 1, w) },
            { id: `dp_${i - 1}_${w - w_i}`, coordinates: coords(i - 1, w - w_i) },
          ],
          operation: 'max',
          formula: `max(skip: dp[${i - 1}][${w}]=${skip}, take: ${v_i}+dp[${i - 1}][${w - w_i}]=${take}) = ${value}`,
          codeLine: 8,
          note: `dp[${i}][${w}] = ${value} — ${take > skip ? `take item ${i} (w=${w_i}, v=${v_i})` : `skip item ${i}`}`,
        });
      } else {
        dp[i][w] = dp[i - 1][w];
        trace.push({
          step: step++,
          type: 'table-update',
          state: { id: `dp_${i}_${w}`, coordinates: coords(i, w), value: dp[i][w] },
          dependencies: [{ id: `dp_${i - 1}_${w}`, coordinates: coords(i - 1, w) }],
          operation: 'copy',
          formula: `item ${i} weighs ${w_i} > capacity ${w} here, so dp[${i}][${w}] = dp[${i - 1}][${w}] = ${dp[i][w]}`,
          codeLine: 12,
          note: `dp[${i}][${w}] = ${dp[i][w]} — item ${i} doesn't fit, carry forward`,
        });
      }
    }
  }

  trace.push({
    step: step++,
    type: 'completed',
    state: { id: `dp_${n}_${capacity}`, coordinates: coords(n, capacity), value: dp[n][capacity] },
    codeLine: 16,
    note: `Done — maximum value within capacity ${capacity} = ${dp[n][capacity]}`,
  });

  return trace;
}

function recognize(text: string) {
  const lower = text.toLowerCase();
  if (!/weight|knapsack/.test(lower)) return null;

  const weightsMatch = text.match(/weights?\s*[:\-]?\s*\[([\d,\s]+)\]/i);
  const valuesMatch = text.match(/values?\s*[:\-]?\s*\[([\d,\s]+)\]/i);
  const capacityMatch =
    lower.match(/capacity\s*(?:of|is|=|:)?\s*(\d+)/) || lower.match(/weight limit\s*(?:of|is|=|:)?\s*(\d+)/);

  if (!weightsMatch || !valuesMatch || !capacityMatch) return null;

  const weights = weightsMatch[1].split(',').map((s) => Number(s.trim()));
  const values = valuesMatch[1].split(',').map((s) => Number(s.trim()));
  const capacity = Number(capacityMatch[1]);

  if (weights.length === 0 || weights.length !== values.length || !Number.isFinite(capacity)) return null;

  return { input: { weights, values, capacity }, confidence: 'high' as const };
}

export const knapsackModule: AlgorithmModule = {
  id: 'knapsack',
  code: CODE as Partial<Record<Strategy, string>>,
  generateTrace: (input) => {
    const weights = (input.weights as number[]).map(Number);
    const values = (input.values as number[]).map(Number);
    const capacity = Number(input.capacity);
    return traceTabulation(weights, values, capacity);
  },
  recognize,
};
