// lib/ai/client.ts
import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

// Interface for unified model parameters
export interface ModelParams {
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
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

// Unified function to stream text from DeepSeek
export async function streamResponse(
  prompt: string,
  context: keyof typeof DEFAULT_PARAMS = 'chat',
  customParams: Partial<ModelParams> = {}
) {
  const params = { ...DEFAULT_PARAMS[context], ...customParams };
  
  const result = streamText({
    model: deepseek('deepseek-chat'),
    messages: [{ role: 'user', content: prompt }],
    temperature: params.temperature,
    maxTokens: params.maxTokens,
    topP: params.topP,
  });

  return result.toDataStreamResponse();
}

// Function to generate text without streaming (for cases where we need the full response)
export async function generateText(
  prompt: string,
  context: keyof typeof DEFAULT_PARAMS = 'chat',
  customParams: Partial<ModelParams> = {}
): Promise<string> {
  const params = { ...DEFAULT_PARAMS[context], ...customParams };
  
  try {
    const response = await deepseek('deepseek-chat').chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      temperature: params.temperature,
      max_tokens: params.maxTokens,
      top_p: params.topP,
      stream: false,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error generating text:', error);
    throw new Error('Failed to generate text');
  }
}

// Process markdown content from LLM output
export function processMarkdown(content: string): string {
  // Sanitize and process markdown content
  // This could include fixing formatting, ensuring safe content, etc.
  return content;
}