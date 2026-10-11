import type { ProblemRepresentation } from '../engine/types';
import { fibonacciModule } from '../algorithms/fibonacci';
import { coinChangeModule } from '../algorithms/coinChange';
import { knapsackModule } from '../algorithms/knapsack';
import { buildProblemRepresentation } from './schema';
import { validateProblemRepresentation, type ValidationResult } from './validator';

// ----------------------------------------------------------------------------
// HONESTY NOTE (read this before mistaking this for a general NLP system):
//
// This is a deliberately small, deterministic, regex-based extractor. It
// recognizes the specific phrasings this project's own spec uses
// ("coins [1,3,4] and target 6", "weights [2,3,4], values [3,4,5], capacity
// 5", "fibonacci ... n = 10"). It does NOT understand arbitrary natural
// language or arbitrary source code — that would require a real LLM call,
// which this frontend-only project doesn't have a backend/API key for.
//
// The seam is intentional: swap the body of `parseProblem` for a call to an
// LLM that returns the same ProblemRepresentation shape, run it through the
// same validateProblemRepresentation() guardrail below, and nothing else in
// the app needs to change. That's the whole point of keeping "parser" and
// "algorithm engine" as separate layers.
// ----------------------------------------------------------------------------

const recognizers = [
  { id: 'fibonacci', module: fibonacciModule },
  { id: 'coin-change', module: coinChangeModule },
  { id: 'knapsack', module: knapsackModule },
];

export interface ParseResult {
  representation: ProblemRepresentation | null;
  validation: ValidationResult;
}

export function parseProblem(text: string): ParseResult {
  const trimmed = text.trim();
  if (!trimmed) {
    return { representation: null, validation: { valid: false, errors: ['Enter a problem statement or source code first.'] } };
  }

  for (const { id, module } of recognizers) {
    const match = module.recognize(trimmed);
    if (match) {
      const representation = buildProblemRepresentation(id, match.input, match.confidence);
      const validation = validateProblemRepresentation(representation);
      return { representation, validation };
    }
  }

  return {
    representation: null,
    validation: {
      valid: false,
      errors: [
        'Unable to confidently identify a supported algorithm from this text.',
        'Try one of the example problems, or select the algorithm manually below.',
      ],
    },
  };
}
