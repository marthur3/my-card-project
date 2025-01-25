import OpenAI from "openai"
import { OpenAIStream, StreamingTextResponse } from "ai"

// Create an OpenAI API client (that's edge friendly!)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
})

export const runtime = "edge"

export async function POST(req: Request) {
  const { noteType, occasion, recipient, details } = await req.json()

  const prompt = `Write a ${noteType.toLowerCase()} note to ${recipient} regarding ${occasion}.
    ${details ? `\nAdditional context: ${details}` : ""}
    
    Guidelines:
    1. Write in first person ("I") directly to the recipient
    2. Keep the tone appropriate for the occasion
    3. Include specific details when provided
    4. Keep it personal but do not use any formal closings
    5. Do not add signatures or names
    6. Keep it concise but meaningful`

  // Ask OpenAI for a streaming chat completion given the prompt
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    stream: true,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250,
    temperature: 0.7,
  })

  // Convert the response into a friendly text-stream
  const stream = OpenAIStream(response)
  // Respond with the stream
  return new StreamingTextResponse(stream)
}

