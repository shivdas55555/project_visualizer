import type { AlgorithmModule, ExecutionTrace, Strategy } from '../../engine/types';

const CODE: Record<string, string> = {
  tabulation: `function minCoins(coins, target) {
  const dp = Array(target + 1).fill(Infinity);
  dp[0] = 0;
  for (let i = 1; i <= target; i++) {
    for (const coin of coins) {
      if (coin <= i && dp[i - coin] + 1 < dp[i]) {
        dp[i] = dp[i - coin] + 1;
      }
    }
  }
  return dp[target];
}`,
  greedy: `function minCoinsGreedy(coins, target) {
  const sorted = [...coins].sort((a, b) => b - a);
  let remaining = target;
  let count = 0;
  for (const coin of sorted) {
    while (coin <= remaining) {
      remaining -= coin;
      count++;
    }
  }
  return remaining === 0 ? count : -1; // may be WRONG — greedy isn't always optimal
}`,
};

const id3 = (i: number): [number, number, number] => [i, 0, 0];

function traceTabulation(coins: number[], target: number): ExecutionTrace {
  const trace: ExecutionTrace = [];
  const dp: number[] = Array(target + 1).fill(Infinity);
  const chosenCoin: number[] = Array(target + 1).fill(-1);
  dp[0] = 0;
  let step = 0;

  trace.push({
    step: step++,
    type: 'base-case',
    state: { id: 'dp_0', coordinates: id3(0), value: 0 },
    codeLine: 3,
    note: 'Base case: dp[0] = 0 (zero coins needed to make amount 0)',
  });

  for (let i = 1; i <= target; i++) {
    let best = Infinity;
    let bestCoin = -1;
    const tried: string[] = [];

    for (const coin of coins) {
      if (coin > i) continue;
      const candidate = dp[i - coin] + 1;
      tried.push(`dp[${i - coin}]+1=${Number.isFinite(candidate) ? candidate : '∞'}`);
      trace.push({
        step: step++,
        type: 'comparison',
        state: { id: `dp_${i}`, coordinates: id3(i) },
        dependencies: [{ id: `dp_${i - coin}`, coordinates: id3(i - coin) }],
        operation: 'min',
        formula: `try coin ${coin}: dp[${i - coin}] + 1 = ${Number.isFinite(candidate) ? candidate : '∞'}`,
        codeLine: 6,
        note: `Trying coin ${coin} for amount ${i}`,
      });
      if (candidate < best) {
        best = candidate;
        bestCoin = coin;
      }
    }

    dp[i] = best;
    chosenCoin[i] = bestCoin;

    trace.push({
      step: step++,
      type: 'table-update',
      state: { id: `dp_${i}`, coordinates: id3(i), value: Number.isFinite(best) ? best : '∞' },
      dependencies: bestCoin >= 0 ? [{ id: `dp_${i - bestCoin}`, coordinates: id3(i - bestCoin) }] : [],
      operation: 'min',
      formula: `dp[${i}] = min(${tried.join(', ')}) = ${Number.isFinite(best) ? best : '∞'}`,
      codeLine: 7,
      note:
        bestCoin >= 0
          ? `dp[${i}] = ${best}, using coin ${bestCoin}`
          : `dp[${i}] is unreachable with the given coins`,
    });
  }

  trace.push({
    step: step++,
    type: 'completed',
    state: { id: `dp_${target}`, coordinates: id3(target), value: Number.isFinite(dp[target]) ? dp[target] : '∞' },
    codeLine: 9,
    note: Number.isFinite(dp[target])
      ? `Done — minimum coins for ${target} = ${dp[target]}`
      : `Done — ${target} cannot be made with these coins`,
  });

  return trace;
}

function traceGreedy(coins: number[], target: number): ExecutionTrace {
  const trace: ExecutionTrace = [];
  const sorted = [...coins].sort((a, b) => b - a);
  let remaining = target;
  let count = 0;
  let step = 0;

  trace.push({
    step: step++,
    type: 'init',
    state: { id: 'remaining', coordinates: [target, 0, 0], value: target },
    codeLine: 2,
    note: `Coins sorted largest-first: [${sorted.join(', ')}]`,
  });

  for (const coin of sorted) {
    if (coin > remaining) {
      trace.push({
        step: step++,
        type: 'greedy-rejection',
        state: { id: `coin_${coin}`, coordinates: [coin, 0, 0] },
        codeLine: 6,
        note: `Coin ${coin} is larger than the remaining amount (${remaining}) — skip`,
      });
      continue;
    }
    while (coin <= remaining) {
      remaining -= coin;
      count++;
      trace.push({
        step: step++,
        type: 'greedy-selection',
        state: { id: `coin_${coin}_${count}`, coordinates: [coin, count, 0], value: remaining },
        operation: '-',
        formula: `remaining = ${remaining + coin} - ${coin} = ${remaining}`,
        codeLine: 7,
        note: `Take coin ${coin} — remaining amount is now ${remaining} (coins used so far: ${count})`,
      });
    }
  }

  trace.push({
    step: step++,
    type: 'completed',
    state: { id: 'result', coordinates: [target, 0, 0], value: remaining === 0 ? count : -1 },
    codeLine: 10,
    note:
      remaining === 0
        ? `Done — greedy used ${count} coins`
        : `Done — greedy got stuck with ${remaining} left over. This is a case where greedy is NOT optimal (or impossible) even though tabulation finds the true answer.`,
  });

  return trace;
}

function recognize(text: string) {
  const lower = text.toLowerCase();
  if (!/coin/.test(lower)) return null;

  const coinsMatch = text.match(/\[([\d,\s]+)\]/);
  const targetMatch =
    lower.match(/target\s*(?:of|is|=|:)?\s*(\d+)/) ||
    lower.match(/amount\s*(?:of|is|=|:)?\s*(\d+)/) ||
    lower.match(/sum\s*(?:of|is|=|:)?\s*(\d+)/);

  if (!coinsMatch || !targetMatch) return null;

  const coins = coinsMatch[1]
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n) && n > 0);

  const target = Number(targetMatch[1]);
  if (coins.length === 0 || !Number.isFinite(target)) return null;

  return { input: { coins, target }, confidence: 'high' as const };
}

export const coinChangeModule: AlgorithmModule = {
  id: 'coin-change',
  code: CODE as Partial<Record<Strategy, string>>,
  generateTrace: (input, strategy) => {
    const coins = (input.coins as number[]).map(Number);
    const target = Number(input.target);
    if (strategy === 'greedy') return traceGreedy(coins, target);
    return traceTabulation(coins, target);
  },
  recognize,
};
