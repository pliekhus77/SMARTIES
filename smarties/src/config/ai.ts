/**
 * AI service configuration
 * OpenAI and Anthropic API settings
 */

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  timeout: number;
}

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  timeout: number;
}

export interface AIConfig {
  openai: OpenAIConfig;
  anthropic: AnthropicConfig;
  fallbackEnabled: boolean;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * Get OpenAI configuration from environment variables
 */
export function getOpenAIConfig(): OpenAIConfig {
  return {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4',
    maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '1000'),
    temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.1'),
    timeout: parseInt(process.env.OPENAI_TIMEOUT || '30000'),
  };
}

/**
 * Get Anthropic configuration from environment variables
 */
export function getAnthropicConfig(): AnthropicConfig {
  return {
    apiKey: process.env.ANTHROPIC_API_KEY || '',
    model: process.env.ANTHROPIC_MODEL || 'claude-3-sonnet-20240229',
    maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '1000'),
    timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '30000'),
  };
}

/**
 * Get complete AI configuration
 */
export function getAIConfig(): AIConfig {
  return {
    openai: getOpenAIConfig(),
    anthropic: getAnthropicConfig(),
    fallbackEnabled: process.env.AI_FALLBACK_ENABLED !== 'false',
    retryAttempts: parseInt(process.env.AI_RETRY_ATTEMPTS || '2'),
    retryDelay: parseInt(process.env.AI_RETRY_DELAY || '1000'),
  };
}

/**
 * Validate AI configuration
 */
export function validateAIConfig(config: AIConfig): {
  openaiValid: boolean;
  anthropicValid: boolean;
  hasValidService: boolean;
} {
  const openaiValid = Boolean(config.openai.apiKey && config.openai.apiKey !== '');
  const anthropicValid = Boolean(config.anthropic.apiKey && config.anthropic.apiKey !== '');
  const hasValidService = openaiValid || anthropicValid;
  
  if (!hasValidService) {
    console.error('No valid AI service configured. Please set OPENAI_API_KEY or ANTHROPIC_API_KEY');
  }
  
  return {
    openaiValid,
    anthropicValid,
    hasValidService,
  };
}

/**
 * Get dietary analysis prompt template
 */
export function getDietaryAnalysisPrompt(): string {
  return `You are a dietary safety assistant. Analyze the following product for dietary compliance.

Product Information:
- Name: {productName}
- Ingredients: {ingredients}

User Dietary Restrictions:
{userRestrictions}

Please analyze this product and provide:
1. Safety assessment (safe/unsafe)
2. Any violations found
3. Any warnings or concerns
4. Confidence level (0-1)
5. Brief explanation

Respond in JSON format:
{
  "safe": boolean,
  "violations": ["list of violations"],
  "warnings": ["list of warnings"],
  "confidence": number,
  "explanation": "brief explanation"
}

Be extremely cautious with allergens and medical restrictions. When in doubt, err on the side of safety.`;
}

/**
 * Get rate limiting configuration
 */
export function getRateLimitConfig() {
  return {
    openai: {
      requestsPerMinute: parseInt(process.env.OPENAI_RPM || '60'),
      tokensPerMinute: parseInt(process.env.OPENAI_TPM || '10000'),
    },
    anthropic: {
      requestsPerMinute: parseInt(process.env.ANTHROPIC_RPM || '50'),
      tokensPerMinute: parseInt(process.env.ANTHROPIC_TPM || '8000'),
    },
  };
}