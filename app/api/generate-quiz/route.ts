import { tokenUsageService } from "@/lib/services/tokenUsage";
import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192");

export async function POST(req: Request) {
  const { content, lang, tokens, userid } = await req.json();

  if (tokens <= 0) {
    return new Response(
      JSON.stringify({ error: 'You are out of daily token usage' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  let language = 'English';
  if (lang === 'de') {
    language = 'German';
  } else if (lang === 'ar') {
    language = 'Arabic';
  } else if (lang === 'en') {
    language = 'English';
  }

  const systemPrompt = `
      You are a helpful assistant. Based on the lesson content below, generate a structured quiz with **exactly 15** multiple choice questions (MCQs), in the \${language} language.

      Lesson Content:
      ${content}

      Instructions:
      1. Your output **must strictly start with**:
        Here is a quiz with 15 multiple-choice questions based on the lesson content:

      2. Each question must follow this **exact** format:

        Question 1: [Question text]?
        A) [Option A text]
        B) [Option B text]
        C) [Option C text]
        D) [Option D text]
        CORRECT: [Correct option letter]) [Correct option text]
        Explanation: [Short explanation relevant to the correct option]

      3. Rules you MUST follow:
        - There must be **exactly 15 questions** (not fewer, not more).
        - Each question should have exactly 4 options
        - Every question must have **four options**, labeled A), B), C), and D), in that order.
        - You must always **include all four options**, even if some seem less relevant.
        - The correct option must always be labeled clearly as shown, starting with **CORRECT:**, followed by the correct letter and the option text.
        - Provide a **short explanation** after each question.
        - **Do not include extra headings, markdown, or lists** — just the quiz content in the exact format shown above.
        - Leave **one line of space** between each question block (i.e., between explanations and the next question).

      4. Only create questions based on information **explicitly mentioned in the lesson content**. Do not invent any new information or add external context.

      5. Be consistent, clear, and precise.

      Any deviation from the required format will be considered invalid.
      `;


  const userPrompt = `Generate a structured quiz with multiple choice questions based on this lesson content, in ${language} language.`;

  let maxTokens = 2000;
  if (tokens < 2000) {
    maxTokens = tokens;
  }

  if (tokens < (userPrompt.length + 2000)) {
    return new Response(
      JSON.stringify({ error: 'You are out of daily token usage' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const result = streamText({
    model,
    system: systemPrompt,
    prompt: userPrompt,
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
