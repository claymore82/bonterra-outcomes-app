/**
 * AWS Bedrock Configuration
 * Centralized configuration for all AI agent endpoints
 */

/**
 * Claude Sonnet 4.5 model ID for AWS Bedrock
 * This is the same model used in Claude Code conversations
 */
export const BEDROCK_MODEL_ID =
  process.env.BEDROCK_MODEL_ID || 'us.anthropic.claude-sonnet-4-5-20250929-v1:0';

/**
 * AWS Region for Bedrock API calls
 */
export const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
