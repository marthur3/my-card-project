import { purchaseCredits, useCredits } from '@/lib/credits';
import { prisma } from '@/lib/db';

describe('Credits Unit Tests', () => {
  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany(),
      prisma.user.create({
        data: {
          id: 'test-user-123',
          email: 'test@example.com',
          credits: 0
        }
      })
    ]);
  });

  afterEach(async () => {
    await prisma.user.deleteMany();
  });

  it('should purchase credits successfully', async () => {
    const result = await purchaseCredits('test-user-123', 100);
    expect(result.success).toBeTruthy();
    expect(result.newBalance).toBe(100);

    const user = await prisma.user.findUnique({
      where: { id: 'test-user-123' }
    });
    expect(user?.credits).toBe(100);
  });

  it('should deduct credits when used', async () => {
    // Setup initial credits
    await prisma.user.update({
      where: { id: 'test-user-123' },
      data: { credits: 100 }
    });

    const result = await useCredits('test-user-123', 50);
    expect(result.success).toBeTruthy();
    expect(result.remainingCredits).toBe(50);

    const user = await prisma.user.findUnique({
      where: { id: 'test-user-123' }
    });
    expect(user?.credits).toBe(50);
  });
});
