import { createGroq } from "@ai-sdk/groq"
import { streamText } from 'ai';

const model = createGroq({ apiKey: process.env.GROQ_API_KEY! })("llama3-70b-8192")

export async function POST(req: Request) {
    const { messages, content } = await req.json();

    const result = streamText({
        model: model,
        system: `You are a helpful assistant. Only answer questions based on the lesson content below.
                Lesson Content:
                """${content}"""
                If the question cannot be answered using this lesson content, respond: "Sorry, I don't know.
                `,
        messages,
    });

    return result.toDataStreamResponse();
}