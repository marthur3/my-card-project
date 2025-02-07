import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { credits: true, tier: true }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({
      credits: user.credits,
      tier: user.tier,
      canUseAI: user.credits > 0 || user.tier === 'premium',
      canExport: user.tier === 'premium'
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check credits' },
      { status: 500 }
    );
  }
}
