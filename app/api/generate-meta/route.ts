import { NextRequest, NextResponse } from 'next/server';
//import { generateMetadataFromPrompt } from '../../../../lib/generateCourseMetadata';
//import { saveMetadata } from '../../lib/saveMetadata';
//import { updateSitemap } from '../../lib/updateSitemap';

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();
    const metadata = await generateMetadataFromPrompt(prompt);

   // await saveMetadata(metadata);
   // await updateSitemap(metadata.slug);

    return NextResponse.json({ metadata });
  } catch (err: any) {
    console.error('Error generating metadata:', err);
    return NextResponse.json({ error: 'Failed to generate course' }, { status: 500 });
  }
}
import Groq from 'groq-sdk';

const groq = new Groq({
  apiKey:  process.env.GROQ_API_KEY,
});

async function generateMetadataFromPrompt(prompt: string) {
const systemPrompt = `
You are an expert AI course generator.

Given a prompt like "Learn TypeScript", return a single JSON object containing metadata for a full-length AI-powered course with the following structure:

{
  "title": "Learn TypeScript",
  "slug": "learn-typescript",
  "keywords": [ "typescript", "javascript", "type safety", "frontend development", "typescript tutorial" ],
  "description": "A comprehensive TypeScript course covering basic to advanced concepts for beginner to intermediate developers, enabling learners to progress from JavaScript to building robust, type-safe applications using frameworks like React, Angular, and Node.js. This course prepares users to meet prerequisites in full-stack TypeScript-based development workflows.",
  "difficulty": "Beginner to Intermediate",
  "modules": [
    {
      "title": "Introduction to TypeScript",
      "lessons": [
        { "title": "What is TypeScript?", "content": "An overview of TypeScript, its purpose, and advantages over JavaScript." },
        { "title": "Setting up the Environment", "content": "Installing TypeScript compiler, configuring tsconfig.json, and integrating with editors." }
      ]
    },
    {
      "title": "Type System and Annotations",
      "lessons": [
        { "title": "Basic Types", "content": "Working with strings, numbers, booleans, arrays, and tuples." },
        { "title": "Type Inference", "content": "Understanding how TypeScript infers types automatically." }
      ]
    }
    // Additional modules...
  ]
}

Guidelines:
- Generate relevant SEO keywords based on the prompt and course content.
- Fill in the description with proper difficulty level, frameworks, and technologies that match the topic.
- Each module should have at least 2 relevant lesson objects, each with a title and content(which will be a one liner summary of the lesson).
- Output only the raw JSON — no explanations, no code fences, and no extra text.
`;


  const chatCompletion = await groq.chat.completions.create({
    model: 'llama3-8b-8192',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: prompt },
    ],
    temperature: 0.7,
  });

let content = chatCompletion.choices[0]?.message?.content || '{}';
console.log(`content from llm:${content}`)
// Remove triple backticks and optional ```json language tag
content = content.trim().replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');

let json;
try {
  json = JSON.parse(content);
} catch (e) {
  console.error('❌ Failed to parse JSON:', content);
  throw e;
}


  // Ensure slug exists
  if (!json.slug) {
    json.slug = json.title?.toLowerCase().replace(/\s+/g, '-') ?? 'course-' + Date.now();
  }

  return json;
}