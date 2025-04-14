import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

// You would configure your Deepseek model access here
const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export async function POST(req: Request) {
  try {
    // Get request body
    let { term = "ML", difficulty = "beginner", instructions, goal, about, prompt } = await req.json();

    term = "ML"
    difficulty = "beginner"

    // Validate required fields
    if (!term || !difficulty) {
      return new Response(
        JSON.stringify({ error: 'Term and difficulty are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build our prompt for the AI model
    let systemPrompt = `You are an expert educator and curriculum developer. 
    Create a comprehensive, well-structured course on "${term}" at ${difficulty} difficulty level.

    Format the course in Markdown with the following structure:
    - Start with a # Title for the course
    - Use ## Module Title for each module
    - Use - Lesson Title for each lesson within a module
    
    The course should have 5-10 modules, each with 3-8 lessons. 
    Make sure the lessons follow a logical progression from basic to more advanced concepts.`;

    // Add optional customizations if provided
    if (goal) {
      systemPrompt += `\n\nThe goal of this course is: ${goal}`;
    }
    
    if (about) {
      systemPrompt += `\n\nBackground information about the learner: ${about}`;
    }
    
    if (instructions) {
      systemPrompt += `\n\nAdditional instructions: ${instructions}`;
    }

    // User message is either the custom prompt or a generic one
    const userMessage = prompt || `Create a course on ${term} at ${difficulty} difficulty level.`;

    // Generate course content with streaming
    const result = streamText({
      model: deepseek(DEEPSEEK_MODEL, {
        apiKey: DEEPSEEK_API_KEY,
      }),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
      maxTokens: 2000
    });

    console.log(result)
    
    // Return streaming response
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Error in course generation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate course' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}