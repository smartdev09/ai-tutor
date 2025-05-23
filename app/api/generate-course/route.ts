import { streamText } from 'ai';
import { createGroq } from "@ai-sdk/groq"
import { tokenUsageService } from '@/lib/services/tokenUsage';

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192")

export async function POST(req: Request) {
  try {
    const { term = "ML", difficulty = "beginner", instructions, goal, about, prompt, lang, tokens, userid } = await req.json();

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

    if (!term || !difficulty) {
      return new Response(
        JSON.stringify({ error: 'Term and difficulty are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    let systemPrompt = `You are an expert curriculum designer and SEO content strategist.

      Create a **complete, structured, and strictly formatted** course in Markdown on the topic: "${term}", suitable for a "${difficulty}" level learner. Your output must follow this **exact format**, with no deviations.

      ---

      1. Begin with a **commented HTML Course Schema** (use the exact structure shown):

      <!--
      <script type="application/ld+json">
      {
        "@context": "https://schema.org",
        "@type": "Course",
        "name": "Course Title",
        "description": "Meta description here.",
        "provider": {
          "@type": "Organization",
          "name": "Your Organization Name",
          "sameAs": "https://yourwebsite.com"
        }
      }
      </script>
      -->

      ---

      2. Write the course title as a main heading:
      # [SEO-Optimized Course Title including the keyword "${term}"]

      ---

      3. Add a brief meta description below:
      **Meta Description:** Write a compelling summary (150–160 characters) that contains the keyword "${term}" naturally and encourages clicks.

      ---

      4. Course Content:

      Structure the course into **5–8 modules**, using this format:

      ## Module 1: [Module Title with Keywords]
      - **[Lesson 1 Title]** — Include relevant terms and logical progression.
      - **[Lesson 2 Title]**
      - ...
      - **[Lesson 6 Title]** (Max)

      Repeat for Module 2 to Module 8 (max). Keep titles SEO-relevant and educational.

      ---

      5. FAQs Section:

      **FAQs**
      1. **[SEO-Relevant Question 1]?**
        Clear and concise answer with helpful context.
      2. **[Question 2]?**
        Answer...
      (Include 5–8 questions total.)

      ---

      6. Call-to-Action:

      End the course with an inspiring statement encouraging users to begin learning and taking action.

      ---

      Strict Guidelines:
      - **Never generate duplicate completions** in a single stream. The response should only include one complete course.
      - Do **not** wrap the course content in extra Markdown code blocks or characters.
      - Use consistent formatting and indentation.
      - Use natural language but embed LSI (Latent Semantic Indexing) keywords to improve SEO.
      - Avoid vague or overly generic module/lesson names.

      Ensure the response is a single, clean, parsable Markdown string with no extraneous output before or after.

      Do not explain or justify anything — only return the formatted content.`;


    if (goal) {
      systemPrompt += `\n\nThe goal of this course is: ${goal}`;
    }

    if (about) {
      systemPrompt += `\n\nBackground information about the learner: ${about}`;
    }

    if (instructions) {
      systemPrompt += `\n\nAdditional instructions: ${instructions}`;
    }

    const userMessage = prompt || `Create a course on ${term} at ${difficulty} difficulty level in ${language} language.`;

    let maxTokens = 2000;
    if(tokens < 3000) {
      maxTokens = tokens;
    }

    if (tokens < (userMessage.length + 1500)) {
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

  } catch (error) {
    console.error('Error in course generation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate course' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}