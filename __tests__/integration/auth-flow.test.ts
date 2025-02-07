import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { login, signup } from "@/lib/auth";
import { getUserData } from "@/lib/user";
import { prisma } from '@/lib/db';

jest.mock('next-auth/next', () => ({
  getServerSession: jest.fn()
}));

describe('Authentication Flow', () => {
  beforeEach(async () => {
    await prisma.$transaction([
      prisma.user.deleteMany()
    ]);
    (getServerSession as jest.Mock).mockResolvedValue({
      user: { id: 'test-id', email: 'test@example.com' }
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it('should complete signup and login flow', async () => {
    // Test signup
    const signupResult = await signup('test@example.com', 'password123');
    expect(signupResult.success).toBeTruthy();
    expect(signupResult.userId).toBeDefined();

    // Test login
    const loginResult = await login('test@example.com', 'password123');
    expect(loginResult.success).toBeTruthy();

    // Test session
    const session = await getServerSession(authOptions);
    expect(session).toBeDefined();
    
    // Test user data
    const userData = await getUserData(session?.user?.id);
    expect(userData).toBeDefined();
  });
});
