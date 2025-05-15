import { streamText } from 'ai';
import { createGroq } from "@ai-sdk/groq"

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192")

export async function POST(req: Request) {
  try {
    const { term = "ML", difficulty = "beginner", instructions, goal, about, prompt, lang } = await req.json();

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

    let systemPrompt = `You are an expert educator and curriculum developer specializing in SEO-optimized educational content.

      Create a detailed and structured course on the topic: "${term}", tailored for the ${difficulty} difficulty level. The course must be optimized for search engine visibility and learner clarity.

      Follow this exact Markdown structure:

      1. Add a semantic HTML Course schema (commented at the top)
        - Example:
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

      2. Begin with:
        # [Course Title] — Must include the keyword "${term}" in an SEO-optimized, engaging way

      3. Followed by:
        **Meta Description:** A compelling 150–160 character summary containing the keyword "${term}"

      4. Course Content:
        - Use ## [Module Title] for each module
          - Each course must have **5 to 8 modules**
          - Module titles should contain relevant and semantically related keywords
        - Use - [Lesson Title] under each module
          - Each module must include **3 to 6 lessons**
          - Lesson titles must include keywords and build up logically from basic to advanced

      5. FAQs Section:
        - Begin with **FAQs**
        - Then list 5 to 8 frequently asked questions and answers related to "${term}" in this format:
          1. **[Question]?**
              Answer text...

      6. End the course with a clear call-to-action encouraging students to begin learning.

      Additional Guidelines:
      - Use LSI (Latent Semantic Indexing) keywords naturally throughout the content for better relevance
      - Maintain a clear, educational tone throughout
      - Ensure the structure and formatting are consistent and follow this template strictly
    `;


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

    const result = streamText({
      model: model,
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
      maxTokens: 2000
    });

    return result.toDataStreamResponse();

  } catch (error) {
    console.error('Error in course generation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate course' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}