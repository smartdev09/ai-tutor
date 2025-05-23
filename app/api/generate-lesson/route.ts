import { streamText } from 'ai';
import { createGroq } from "@ai-sdk/groq"
import { tokenUsageService } from '@/lib/services/tokenUsage';

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192")

export async function POST(req: Request) {
  try {
    const { moduleTitle, lessonTitle, userPrompt = null, difficulty = 'beginner', userTokens, userId } = await req.json();

    if (userTokens <= 0) {
      return new Response(
        JSON.stringify({ error: 'You are out of daily token usage' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!moduleTitle || !lessonTitle) {
      return new Response(
        JSON.stringify({ error: 'Module title and lesson title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const systemPrompt = `You are an expert educator creating SEO-optimized content for a course titled "${moduleTitle}"
    at ${difficulty} difficulty level.
    Create detailed, search-engine optimized lesson content for "${lessonTitle}"
    which is part of the module "${moduleTitle}".
    ${userPrompt ? `Most importantly, ${userPrompt}.` : ""}
    The content should be comprehensive, educational, well-structured, and optimized for search engines. Format in Markdown and include:
    1. A compelling H1 heading that includes the main keyword "${lessonTitle}"
    2. A brief introduction (250-300 words) explaining the importance of this topic and including the main keyword naturally
    3. Use H2 and H3 headings with relevant keywords throughout the lesson
    4. Clear explanations of key concepts with relevant keywords naturally incorporated
    5. Examples, case studies, or scenarios to illustrate the concepts
    6. Code snippets if applicable (properly formatted)
    7. Practice exercises or activities with clear instructions
    8. A summary of key points that reinforces the main concepts
    9. A "Further Reading" section with suggested topics (these will be internal links)
    10. 3-5 FAQ questions with answers that target common search queries related to "${lessonTitle}"
    Make sure the content is at least 1,500 words long for better SEO performance.
    Use varied paragraph lengths, bullet points, numbered lists, and other formatting to improve readability.
    Include transition words and phrases to improve content flow.
    Naturally incorporate the primary keyword "${lessonTitle}" 5-7 times throughout the content.`;

    const userMessage = `Create detailed content for the lesson "${lessonTitle}" in module "${moduleTitle}.`;

    let maxTokens = 4000;
    if(userTokens < 3000) {
      maxTokens = userTokens;
    }

    if (userTokens < (userMessage.length + 2000)) {
      return new Response(
        JSON.stringify({ error: 'You are out of daily token usage' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const result = streamText({
      model: model,
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
      maxTokens: maxTokens
    });

    (async () => {
          try {
            const usage = await result.usage;
            if (usage) {
              console.log('Token usage:', {
                userTokens,
                promptTokens: usage.promptTokens,
                completionTokens: usage.completionTokens,
                totalTokens: usage.totalTokens
              });
              try {
                await tokenUsageService.updateUsage(userId, usage.totalTokens);
              } catch (error) {
                console.error("Token update failed:", error instanceof Error ? error.message : error);
              }
            }
          } catch (error) {
            console.error('Error logging token usage:', error);
          }
        })();

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error in lesson generation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate lesson content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}