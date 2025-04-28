import { streamText } from 'ai';
import { deepseek } from '@ai-sdk/deepseek';

// You would configure your Deepseek model access here
const DEEPSEEK_MODEL = process.env.DEEPSEEK_MODEL || 'deepseek-chat';

export async function POST(req: Request) {
  try {
    // Get request body
    let {  moduleTitle, lessonTitle, userPrompt = null } = await req.json();
    lessonTitle = 'what is machine learnig'
    moduleTitle = 'Intro to machine learning'

    // Validate required fields
    if ( !moduleTitle || !lessonTitle) {
      return new Response(
        JSON.stringify({ error: 'Module title and lesson title are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Build our prompt for the AI model
    const systemPrompt = `You are an expert educator creating content for a course titled "${moduleTitle}" 
    at begineer difficulty level.
    
    You need to create detailed lesson content for the lesson "${lessonTitle}" 
    which is part of the module "${moduleTitle}".
    
    ${userPrompt ? `Most importantly, ${userPrompt}.` : "" }
    
    The content should be comprehensive, educational, and well-structured in Markdown format.
    Include:
    
    1. A brief introduction explaining the importance of this topic
    2. Clear explanations of key concepts
    3. Examples to illustrate the concepts
    4. Code snippets if applicable
    5. Practice exercises or activities
    6. A summary of key points
    
    Format the content with appropriate headings, bullet points, and code blocks as needed.`;

    // User message
    const userMessage = `Create detailed content for the lesson "${lessonTitle}" in module "${moduleTitle}".`;

    // Generate lesson content with streaming
    const result = streamText({
      model: deepseek(DEEPSEEK_MODEL),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.7,
      maxTokens: 4000
    });
    
    // Return streaming response
    return result.toDataStreamResponse();
    
  } catch (error) {
    console.error('Error in lesson generation:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to generate lesson content' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}