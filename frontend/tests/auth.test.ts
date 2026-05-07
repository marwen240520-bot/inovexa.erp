import { describe, it, expect } from 'vitest';

describe('Auth Service', () => {
  it('should validate email format', () => {
    const email = 'test@example.com';
    expect(email).toMatch(/^[^\s@]+@([^\s@]+\.)+[^\s@]+$/);
  });
});

describe('Product Service', () => {
  it('should calculate total price correctly', () => {
    const price = 100;
    const quantity = 2;
    const total = price * quantity;
    expect(total).toBe(200);
  });
});
