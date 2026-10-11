import type { AlgorithmFamily, Strategy, VisualizationType } from '../engine/types';

export interface AlgorithmMeta {
  id: string;
  label: string;
  family: AlgorithmFamily;
  strategies: Strategy[];
  stateDimensions: 0 | 1 | 2;
  stateMeaning: string;
  visualization: VisualizationType;
  supports3D: boolean;
  supportsGreedyComparison: boolean;
  timeComplexity: string;
  spaceComplexity: string;
  /** Modules that are registered (for the UI/extensibility story) but not yet built. */
  implemented: boolean;
}

// This registry is the single source of truth the UI reads from — nothing
// about complexity, dimensions, or which visualizer to use is hardcoded into
// a component. To add a new algorithm: write src/algorithms/<id>/index.ts
// implementing AlgorithmModule, then add one entry here.
export const algorithmRegistry: Record<string, AlgorithmMeta> = {
  fibonacci: {
    id: 'fibonacci',
    label: 'Fibonacci',
    family: 'dynamic-programming',
    strategies: ['recursion', 'memoization', 'tabulation'],
    stateDimensions: 1,
    stateMeaning: 'fib(i) = the i-th Fibonacci number',
    visualization: 'recursion-tree',
    supports3D: false,
    supportsGreedyComparison: false,
    timeComplexity: 'O(n) memoized/tabulated, O(2^n) naive recursion',
    spaceComplexity: 'O(n)',
    implemented: true,
  },
  'coin-change': {
    id: 'coin-change',
    label: 'Coin Change (minimum coins)',
    family: 'dynamic-programming',
    strategies: ['tabulation', 'greedy'],
    stateDimensions: 1,
    stateMeaning: 'dp[i] = minimum coins required to make amount i',
    visualization: '1d-dp',
    supports3D: true,
    supportsGreedyComparison: true,
    timeComplexity: 'O(target * coins.length)',
    spaceComplexity: 'O(target)',
    implemented: true,
  },
  knapsack: {
    id: 'knapsack',
    label: '0/1 Knapsack',
    family: 'dynamic-programming',
    strategies: ['tabulation'],
    stateDimensions: 2,
    stateMeaning: 'dp[i][w] = max value using first i items within capacity w',
    visualization: '2d-dp',
    supports3D: true,
    supportsGreedyComparison: false,
    timeComplexity: 'O(n * capacity)',
    spaceComplexity: 'O(n * capacity)',
    implemented: true,
  },

  // --- Registered for the extensibility story, not yet built. ---
  // The UI lists these as "coming soon" rather than pretending they work.
  lcs: {
    id: 'lcs',
    label: 'Longest Common Subsequence',
    family: 'dynamic-programming',
    strategies: ['tabulation'],
    stateDimensions: 2,
    stateMeaning: 'dp[i][j] = LCS length of first i chars of A and first j chars of B',
    visualization: '2d-dp',
    supports3D: true,
    supportsGreedyComparison: false,
    timeComplexity: 'O(n * m)',
    spaceComplexity: 'O(n * m)',
    implemented: false,
  },
  'activity-selection': {
    id: 'activity-selection',
    label: 'Activity Selection',
    family: 'greedy',
    strategies: ['greedy'],
    stateDimensions: 0,
    stateMeaning: 'selected set of non-overlapping activities',
    visualization: 'greedy-path',
    supports3D: false,
    supportsGreedyComparison: false,
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    implemented: false,
  },
  'fractional-knapsack': {
    id: 'fractional-knapsack',
    label: 'Fractional Knapsack',
    family: 'greedy',
    strategies: ['greedy'],
    stateDimensions: 0,
    stateMeaning: 'items taken (possibly partially), by value/weight ratio',
    visualization: 'greedy-path',
    supports3D: false,
    supportsGreedyComparison: false,
    timeComplexity: 'O(n log n)',
    spaceComplexity: 'O(n)',
    implemented: false,
  },
};

export const implementedAlgorithmIds = Object.values(algorithmRegistry)
  .filter((a) => a.implemented)
  .map((a) => a.id);
