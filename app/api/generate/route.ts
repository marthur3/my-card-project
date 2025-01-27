import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'No prompt provided' },
                { status: 400 }
            );
        }

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that writes personalized card messages. Your responses should be warm, genuine, and appropriately formatted for handwritten cards."
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.7,
            max_tokens: 500
        });

        const message = completion.choices[0].message.content;

        return NextResponse.json(
            { message },
            { status: 200 }
        );
    } catch (error) {
        console.error('OpenAI API error:', error);
        return NextResponse.json(
            { error: 'Error generating message' },
            { status: 500 }
        );
    }
}

export async function GET() {
    return NextResponse.json(
        { message: 'API endpoint ready' },
        { status: 200 }
    );
}