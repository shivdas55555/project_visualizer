import type { ProblemRepresentation } from '../engine/types';
import { algorithmRegistry } from '../metadata/algorithmRegistry';

/**
 * Builds the structured ProblemRepresentation (see spec section 4) from a
 * recognized algorithm id + extracted input. Pulling family/strategy/state
 * metadata from the registry (rather than letting the parser invent it) is
 * what keeps the parser's output always valid against known algorithms.
 */
export function buildProblemRepresentation(
  algorithmId: string,
  input: Record<string, any>,
  confidence: 'high' | 'low'
): ProblemRepresentation | null {
  const meta = algorithmRegistry[algorithmId];
  if (!meta || !meta.implemented) return null;

  const defaultStrategy = meta.strategies[0];

  return {
    problemType: algorithmId,
    algorithmFamily: meta.family,
    strategy: defaultStrategy,
    input,
    state: {
      name: meta.stateDimensions === 2 ? 'dp[i][w]' : meta.stateDimensions === 1 ? 'dp[i]' : 'selection',
      dimensions: (meta.stateDimensions === 2 ? 2 : 1) as 1 | 2,
      meaning: meta.stateMeaning,
    },
    transition: '', // filled in per-step by the execution trace's `formula` field instead
    baseCases: [],
    visualizationType: meta.visualization,
    canCompareWithGreedy: meta.supportsGreedyComparison,
    confidence,
  };
}
