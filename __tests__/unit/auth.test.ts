import { login, signup } from '@/lib/auth';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';

jest.mock('@/lib/db', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn()
    }
  }
}));

describe('Auth Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully log in with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValueOnce({
        id: 'test-id',
        email: 'test@example.com',
        password: hashedPassword
      });

      const result = await login('test@example.com', 'password123');
      expect(result.success).toBeTruthy();
    });

    it('should fail with invalid credentials', async () => {
      const result = await login('test@example.com', 'wrong');
      expect(result.success).toBeFalsy();
    });
  });

  describe('signup', () => {
    it('should create new user account', async () => {
      const result = await signup('new@example.com', 'password123');
      expect(result.userId).toBeDefined();
    });
  });
});
