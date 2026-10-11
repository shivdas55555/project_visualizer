import type { AlgorithmModule, ExecutionTrace, Strategy } from '../../engine/types';

const CODE: Record<string, string> = {
  recursion: `function fib(n) {
  if (n <= 1) return n;
  return fib(n - 1) + fib(n - 2);
}`,
  memoization: `function fib(n, memo = {}) {
  if (n <= 1) return n;
  if (memo[n] !== undefined) return memo[n];
  memo[n] = fib(n - 1, memo) + fib(n - 2, memo);
  return memo[n];
}`,
  tabulation: `function fib(n) {
  const dp = [0, 1];
  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
  }
  return dp[n];
}`,
};

const id3 = (k: number): [number, number, number] => [k, 0, 0];

function traceRecursion(n: number): ExecutionTrace {
  const trace: ExecutionTrace = [];
  let step = 0;

  function solve(k: number): number {
    trace.push({
      step: step++,
      type: 'recursion-call',
      state: { id: `fib_${k}`, coordinates: id3(k) },
      codeLine: 1,
      note: `Call fib(${k})`,
    });

    if (k <= 1) {
      trace.push({
        step: step++,
        type: 'base-case',
        state: { id: `fib_${k}`, coordinates: id3(k), value: k },
        codeLine: 2,
        note: `Base case: fib(${k}) = ${k}`,
      });
      return k;
    }

    const left = solve(k - 1);
    const right = solve(k - 2);
    const value = left + right;

    trace.push({
      step: step++,
      type: 'recursion-return',
      state: { id: `fib_${k}`, coordinates: id3(k), value },
      dependencies: [
        { id: `fib_${k - 1}`, coordinates: id3(k - 1) },
        { id: `fib_${k - 2}`, coordinates: id3(k - 2) },
      ],
      operation: '+',
      formula: `fib(${k - 1}) + fib(${k - 2}) = ${left} + ${right} = ${value}`,
      codeLine: 3,
      note: `fib(${k}) returns ${value}`,
    });

    return value;
  }

  solve(n);
  return trace;
}

function traceMemoization(n: number): ExecutionTrace {
  const trace: ExecutionTrace = [];
  const memo = new Map<number, number>();
  let step = 0;

  function solve(k: number): number {
    trace.push({
      step: step++,
      type: 'recursion-call',
      state: { id: `fib_${k}`, coordinates: id3(k) },
      codeLine: 1,
      note: `Call fib(${k})`,
    });

    if (k <= 1) {
      trace.push({
        step: step++,
        type: 'base-case',
        state: { id: `fib_${k}`, coordinates: id3(k), value: k },
        codeLine: 2,
        note: `Base case: fib(${k}) = ${k}`,
      });
      return k;
    }

    if (memo.has(k)) {
      const cached = memo.get(k)!;
      trace.push({
        step: step++,
        type: 'cache-hit',
        state: { id: `fib_${k}`, coordinates: id3(k), value: cached },
        codeLine: 3,
        note: `fib(${k}) already in cache — return ${cached} without recomputing`,
      });
      return cached;
    }

    trace.push({
      step: step++,
      type: 'cache-miss',
      state: { id: `fib_${k}`, coordinates: id3(k) },
      codeLine: 4,
      note: `fib(${k}) not cached yet — computing it`,
    });

    const left = solve(k - 1);
    const right = solve(k - 2);
    const value = left + right;
    memo.set(k, value);

    trace.push({
      step: step++,
      type: 'table-update',
      state: { id: `fib_${k}`, coordinates: id3(k), value },
      dependencies: [
        { id: `fib_${k - 1}`, coordinates: id3(k - 1) },
        { id: `fib_${k - 2}`, coordinates: id3(k - 2) },
      ],
      operation: '+',
      formula: `fib(${k - 1}) + fib(${k - 2}) = ${left} + ${right} = ${value}`,
      codeLine: 4,
      note: `Store fib(${k}) = ${value} in cache`,
    });

    return value;
  }

  solve(n);
  return trace;
}

function traceTabulation(n: number): ExecutionTrace {
  const trace: ExecutionTrace = [];
  const dp: number[] = [];
  let step = 0;

  dp[0] = 0;
  trace.push({
    step: step++,
    type: 'base-case',
    state: { id: 'fib_0', coordinates: id3(0), value: 0 },
    codeLine: 2,
    note: 'Base case: dp[0] = 0',
  });

  if (n >= 1) {
    dp[1] = 1;
    trace.push({
      step: step++,
      type: 'base-case',
      state: { id: 'fib_1', coordinates: id3(1), value: 1 },
      codeLine: 2,
      note: 'Base case: dp[1] = 1',
    });
  }

  for (let i = 2; i <= n; i++) {
    dp[i] = dp[i - 1] + dp[i - 2];
    trace.push({
      step: step++,
      type: 'table-update',
      state: { id: `fib_${i}`, coordinates: id3(i), value: dp[i] },
      dependencies: [
        { id: `fib_${i - 1}`, coordinates: id3(i - 1) },
        { id: `fib_${i - 2}`, coordinates: id3(i - 2) },
      ],
      operation: '+',
      formula: `dp[${i - 1}] + dp[${i - 2}] = ${dp[i - 1]} + ${dp[i - 2]} = ${dp[i]}`,
      codeLine: 4,
      note: `dp[${i}] = ${dp[i]}`,
    });
  }

  trace.push({
    step: step++,
    type: 'completed',
    state: { id: `fib_${n}`, coordinates: id3(n), value: dp[n] },
    codeLine: 6,
    note: `Done — fib(${n}) = ${dp[n]}`,
  });

  return trace;
}

function recognize(text: string) {
  const lower = text.toLowerCase();
  const mentionsFib = /fibonacci/.test(lower);
  const fibCallMatch = lower.match(/fib\s*\(\s*(\d+)\s*\)/);
  const nMatch = lower.match(/\bn\s*=\s*(\d+)/) || text.match(/(\d+)(?:st|nd|rd|th)/) || text.match(/\b(\d{1,3})\b/);

  if (fibCallMatch) {
    return { input: { n: Number(fibCallMatch[1]) }, confidence: 'high' as const };
  }
  if (mentionsFib && nMatch) {
    return { input: { n: Number(nMatch[1]) }, confidence: 'high' as const };
  }
  return null;
}

export const fibonacciModule: AlgorithmModule = {
  id: 'fibonacci',
  code: CODE as Partial<Record<Strategy, string>>,
  generateTrace: (input, strategy) => {
    const n = Number(input.n);
    if (strategy === 'memoization') return traceMemoization(n);
    if (strategy === 'tabulation') return traceTabulation(n);
    return traceRecursion(n);
  },
  recognize,
};
