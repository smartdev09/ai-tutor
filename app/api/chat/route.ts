import { tokenUsageService } from "@/lib/services/tokenUsage";
import { createGroq } from "@ai-sdk/groq"
import { streamText } from 'ai';

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192")

export async function POST(req: Request) {
    const { messages, content, tokens, userid } = await req.json();

    console.log(tokens, userid)

    if (tokens <= 0) {
        return new Response(
            JSON.stringify({ error: 'You are out of daily token usage' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    let maxTokens = 700;
    if (tokens < 700) {
        maxTokens = tokens;
    }

    if (tokens < 1000) {
        return new Response(
            JSON.stringify({ error: 'You are out of daily token usage' }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
    }

    const result = streamText({
        model: model,
        system: `You are a helpful assistant. Only answer questions based on the lesson content below.
                Lesson Content:
                """${content}"""
                If the question cannot be answered using this lesson content, respond: "Sorry, I don't know.
                `,
        messages,
        maxTokens: maxTokens
    });

    (async () => {
        try {
          const usage = await result.usage;
          if (usage) {
            console.log('Token usage:', {
              tokens,
              promptTokens: usage.promptTokens,
              completionTokens: usage.completionTokens,
              totalTokens: usage.totalTokens
            });
            try {
              await tokenUsageService.updateUsage(userid, usage.totalTokens);
            } catch (error) {
              console.error("Token update failed:", error instanceof Error ? error.message : error);
            }
          }
        } catch (error) {
          console.error('Error logging token usage:', error);
        }
      })();

    return result.toDataStreamResponse();
}