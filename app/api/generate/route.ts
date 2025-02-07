import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { prisma } from '@/lib/prisma';

// Initialize OpenAI client with better error handling
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || '',
    maxRetries: 3,
    timeout: 30000, // 30 second timeout
});

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { prompt, contactId } = body;

        if (!prompt) {
            return NextResponse.json(
                { error: 'Prompt is required' },
                { status: 400 }
            );
        }

        // Make contactId optional and validate it if present
        let contact = null;
        if (contactId) {
            try {
                contact = await prisma.contact.findFirst({
                    where: { 
                        OR: [
                            { id: contactId },
                            { id: contactId.toString() }
                        ]
                    }
                });
            } catch (error) {
                console.warn('Error finding contact:', error);
                // Continue without contact
            }
        }

        try {
            // Check API key before making request
            if (!process.env.OPENAI_API_KEY) {
                throw new Error('OpenAI API key is not configured');
            }

            console.log('Sending request to OpenAI...');
            const completion = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful assistant that improves card messages. When asked to make messages longer, add more detail and expression while maintaining the original sentiment. When asked to make messages shorter, maintain the core message while being more concise."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.7,
                max_tokens: 500
            });

            console.log('Received response from OpenAI');
            const message = completion.choices[0]?.message?.content;
            if (!message) {
                throw new Error('No message content received from OpenAI');
            }

            // Only try to save if we have both a contact and message
            if (contact && message) {
                try {
                    const card = await prisma.card.create({
                        data: {
                            content: message,
                            contactId: contact.id,
                            status: 'DRAFT',
                            createdAt: new Date(),
                        }
                    });
                    return NextResponse.json({ message, cardId: card.id });
                } catch (error) {
                    console.warn('Failed to save card:', error);
                    return NextResponse.json({ message });
                }
            }

            return NextResponse.json({ message });
        } catch (error) {
            console.error('OpenAI API Error:', error);
            
            // Handle specific API errors
            if (error instanceof OpenAI.APIError) {
                const status = error.status || 500;
                return NextResponse.json(
                    { 
                        error: 'OpenAI API error',
                        message: error.message,
                        type: error.type,
                        code: error.code 
                    },
                    { status }
                );
            }
            
            // Handle other errors
            return NextResponse.json(
                { error: 'Failed to generate message', details: error instanceof Error ? error.message : 'Unknown error' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('Request processing error:', error);
        return NextResponse.json(
            { error: 'Failed to process request', details: error instanceof Error ? error.message : 'Unknown error' },
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