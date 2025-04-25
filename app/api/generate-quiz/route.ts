import { createGroq } from "@ai-sdk/groq";
import { streamText } from "ai";

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192");

export async function POST(req: Request) {
    const { content } = await req.json();

    const systemPrompt = `
        You are a helpful assistant. Based on the lesson content below, generate a 
        structured quiz with exactly 15, not lesser or more than 15 multiple choice questions (MCQs).

        Lesson Content:
        """${content}"""

        Instructions:
        1. Format each question exactly like this example:
           Question 1: What is a compiler?
           A) A program that translates code into machine code
           B) A text editor for writing code
           C) An integrated development environment
           D) A debugging tool
           CORRECT: A) A program that translates code into machine code
           Explanation: A compiler translates high-level code into machine code that computers can execute directly.

        2. Always use the format above with:
           - Question number followed by the question text
           - Four options labeled A), B), C), D)
           - Mark the correct answer with [CORRECT] at the end
           - Include a brief explanation after the options
           - Use line breaks between questions
           
        3. Only create questions based on information explicitly mentioned in the lesson.
    `;
    
    const userPrompt = `Generate a structured quiz with multiple choice questions based on this lesson content.`;

    const result = streamText({
        model,
        system: systemPrompt,
        prompt: userPrompt,
    });

    return result.toDataStreamResponse();
}
