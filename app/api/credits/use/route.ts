import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { amount = 1, description = 'AI generation' } = await request.json();

    const user = await prisma.user.findUnique({
      where: { id: session.user.id }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.tier !== 'premium' && user.credits < amount) {
      return NextResponse.json({ error: 'Insufficient credits' }, { status: 402 });
    }

    // Don't deduct credits for premium users
    if (user.tier !== 'premium') {
      await prisma.user.update({
        where: { id: user.id },
        data: { credits: { decrement: amount } }
      });

      await prisma.creditTransaction.create({
        data: {
          userId: user.id,
          amount: -amount,
          type: 'usage',
          description
        }
      });
    }

    return NextResponse.json({ 
      success: true, 
      remainingCredits: user.tier === 'premium' ? 'unlimited' : user.credits - amount 
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to use credits' },
      { status: 500 }
    );
  }
}
