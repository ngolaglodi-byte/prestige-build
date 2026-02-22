import type { ComplexityLevel } from "./complexity";

type TokenRule = {
  maxTokens: number;
  creditCost: number;
};

export const tokenRules: Record<ComplexityLevel, TokenRule> = {
  small: {
    maxTokens: 2000,
    creditCost: 1,
  },
  medium: {
    maxTokens: 8000,
    creditCost: 3,
  },
  large: {
    maxTokens: 20000,
    creditCost: 7,
  },
  xl: {
    maxTokens: 65000, // ton maximum
    creditCost: 15,
  },
};
