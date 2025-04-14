// lib/ai/client.ts
import { deepseek } from '@ai-sdk/deepseek';
import { streamText } from 'ai';

type MessageRole = 'system' | 'user' | 'assistant' | 'data';

// Interface for unified model parameters
export interface ModelParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  system?: string;
}

// Default parameters for different contexts
const DEFAULT_PARAMS: Record<string, ModelParams> = {
  courseGeneration: {
    temperature: 0.7,
    maxTokens: 1500,
    topP: 0.9,
  },
  contentGeneration: {
    temperature: 0.8,
    maxTokens: 3000,
    topP: 0.9,
  },
  chat: {
    temperature: 0.9,
    maxTokens: 1000,
    topP: 0.95,
  },
  assignment: {
    temperature: 0.6,
    maxTokens: 2000,
    topP: 0.85,
  },
};

// Unified function to stream text from any model
export async function streamTextResponse(
  prompt: string,
  context: keyof typeof DEFAULT_PARAMS = 'chat',
  customParams: Partial<ModelParams> = {}
) {
  const params = { ...DEFAULT_PARAMS[context], ...customParams };
  
  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: [
      ...(params.system ? [{ role: 'system' as MessageRole, content: params.system }] : []),
      { role: 'user' as MessageRole, content: prompt }
    ],
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    topP: params.topP,
  });

  return result.toDataStreamResponse({
    sendReasoning: false,
  });
}

