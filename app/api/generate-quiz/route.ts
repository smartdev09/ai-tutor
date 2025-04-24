import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192");

export async function POST(req: Request) {
    const { content } = await req.json();

    const systemPrompt = `
        You are a helpful assistant. Based on the lesson content below, generate a 
        MCQs quiz having 11-15 multiple choice questions (MCQs).

        Lesson Content:
        """${content}"""

        Guidelines:
        - Only use the information from the lesson content.
        - For MCQs, each question should have 4 options and clearly mark the correct one.
        - For subjective questions, ensure each one encourages critical thinking based on the lesson.
        - Also give solutions for the questions.
        - Format the questions and answers clearly.
    `;
    const userPrompt = `Create a well structured MCQs based quiz/assignment from this lesson ${content}".`;

    const result = streamText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
    });

    return result.toDataStreamResponse();
}
