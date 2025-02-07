import { test, expect } from '@playwright/test';

test.describe('Complete User Journey', () => {
  test('should signup, login, buy credits and use them', async ({ page }) => {
    // Signup
    await page.goto('/signup');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'password123');
    await page.click('[data-testid="signup-button"]');
    await expect(page).toHaveURL('/dashboard');

    // Buy credits
    await page.click('[data-testid="buy-credits"]');
    await page.fill('[data-testid="credit-amount"]', '100');
    await page.click('[data-testid="confirm-purchase"]');
    
    // Verify credits
    const balance = await page.textContent('[data-testid="credit-balance"]');
    expect(balance).toBe('100');

    // Use credits
    await page.click('[data-testid="use-credits"]');
    const newBalance = await page.textContent('[data-testid="credit-balance"]');
    expect(parseInt(newBalance)).toBeLessThan(100);
  });
});
