import type { ProblemRepresentation } from '../engine/types';
import { algorithmRegistry } from '../metadata/algorithmRegistry';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Runtime guardrail between the parser and the algorithm engine (spec section 17).
 * The parser never hands raw, unchecked input straight to an algorithm module —
 * it always passes through here first.
 */
export function validateProblemRepresentation(rep: ProblemRepresentation | null): ValidationResult {
  const errors: string[] = [];

  if (!rep) {
    return { valid: false, errors: ['Unable to confidently identify a supported algorithm.'] };
  }

  const meta = algorithmRegistry[rep.problemType];
  if (!meta) {
    errors.push(`Unknown problem type "${rep.problemType}".`);
    return { valid: false, errors };
  }
  if (!meta.implemented) {
    errors.push(`"${meta.label}" is registered but not implemented yet.`);
    return { valid: false, errors };
  }

  switch (rep.problemType) {
    case 'fibonacci': {
      const n = Number(rep.input.n);
      if (!Number.isInteger(n) || n < 0) errors.push('Fibonacci needs a non-negative integer n.');
      if (n > 15) errors.push('Pick n ≤ 15 so the recursion tree stays readable.');
      break;
    }
    case 'coin-change': {
      const coins = rep.input.coins as number[];
      const target = Number(rep.input.target);
      if (!Array.isArray(coins) || coins.length === 0) errors.push('Coin Change needs a non-empty coins array.');
      if (!Number.isInteger(target) || target < 0) errors.push('Coin Change needs a non-negative integer target.');
      if (target > 60) errors.push('Pick a target ≤ 60 so the DP row stays readable.');
      break;
    }
    case 'knapsack': {
      const weights = rep.input.weights as number[];
      const values = rep.input.values as number[];
      const capacity = Number(rep.input.capacity);
      if (!Array.isArray(weights) || weights.length === 0) errors.push('Knapsack needs a non-empty weights array.');
      if (!Array.isArray(values) || values.length !== weights?.length)
        errors.push('Knapsack needs one value per weight.');
      if (!Number.isInteger(capacity) || capacity < 0) errors.push('Knapsack needs a non-negative integer capacity.');
      if (capacity > 30 || (weights?.length ?? 0) > 10)
        errors.push('Keep capacity ≤ 30 and items ≤ 10 so the 3D grid stays readable.');
      break;
    }
  }

  return { valid: errors.length === 0, errors };
}
