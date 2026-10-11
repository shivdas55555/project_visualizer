// ============================================================================
// Shared types for the whole pipeline:
//   AI Parser -> ProblemRepresentation -> Algorithm Engine -> ExecutionTrace
//   -> Visualization layer
//
// Every algorithm module (src/algorithms/*) produces an ExecutionTraceStep[]
// in this exact shape. Visualizers only ever read this shape — they never
// know which specific algorithm produced it. That's what lets one DPGrid2D
// component render Fibonacci, Coin Change, *and* Knapsack without any
// per-problem branching.
// ============================================================================

export type AlgorithmFamily = 'dynamic-programming' | 'greedy' | 'recursion';

export type Strategy = 'recursion' | 'memoization' | 'tabulation' | 'greedy';

export type VisualizationType = '1d-dp' | '2d-dp' | 'recursion-tree' | 'greedy-path';

// ---- Structured problem representation (the AI parser's output) ----------

export interface ProblemRepresentation {
  problemType: string; // e.g. "coin-change"
  algorithmFamily: AlgorithmFamily;
  strategy: Strategy;
  input: Record<string, number | number[] | string>;
  state: {
    name: string;
    dimensions: 1 | 2;
    meaning: string;
  };
  transition: string;
  baseCases: string[];
  visualizationType: VisualizationType;
  canCompareWithGreedy: boolean;
  /** How the parser arrived at this — surfaced in the UI so nothing is silently guessed. */
  confidence: 'high' | 'low';
}

// ---- Execution trace --------------------------------------------------

export type TraceEventType =
  | 'init'
  | 'base-case'
  | 'recursion-call'
  | 'recursion-return'
  | 'cache-hit'
  | 'cache-miss'
  | 'compute'
  | 'table-update'
  | 'comparison'
  | 'decision'
  | 'greedy-selection'
  | 'greedy-rejection'
  | 'completed';

export interface TraceState {
  id: string; // e.g. "dp_3_5" or "dp_3"
  coordinates: [number, number, number];
  value?: number | string;
  meaning?: string;
}

export interface TraceDependency {
  id: string;
  coordinates: [number, number, number];
}

export interface ExecutionTraceStep {
  step: number;
  type: TraceEventType;
  state?: TraceState;
  dependencies?: TraceDependency[];
  operation?: string;
  formula?: string;
  /** 1-indexed line number in the algorithm's source, for CodeViewer sync. */
  codeLine?: number;
  /** Plain-English sentence for the ExplanationPanel. */
  note: string;
}

export type ExecutionTrace = ExecutionTraceStep[];

// ---- Algorithm module contract ----------------------------------------
// Every file under src/algorithms/<name>/index.ts implements this.
// This is the single seam you extend to add LCS, Activity Selection, etc.

export interface AlgorithmModule {
  id: string;
  /** Source snippets per strategy, shown in CodeViewer. Keys are line-number-stable. */
  code: Partial<Record<Strategy, string>>;
  /** Builds the full execution trace for the given input + strategy. */
  generateTrace: (input: Record<string, any>, strategy: Strategy) => ExecutionTrace;
  /**
   * Heuristic natural-language recognizer. Returns a parsed input + confidence
   * if this module believes the free-text problem belongs to it, or null if not.
   * This is intentionally NOT a general NLP model — see src/ai/parser.ts for why.
   */
  recognize: (text: string) => { input: Record<string, any>; confidence: 'high' | 'low' } | null;
}
