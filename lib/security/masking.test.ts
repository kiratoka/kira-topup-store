import { describe, it, expect } from 'vitest';
import { maskEmail, sanitizeInvoice } from './masking';

describe('maskEmail', () => {
  it('masks normal email address correctly', () => {
    expect(maskEmail('customer@gmail.com')).toBe('c***@gmail.com');
    expect(maskEmail('john.doe@example.org')).toBe('j***@example.org');
  });

  it('handles single character username email', () => {
    expect(maskEmail('a@domain.com')).toBe('a***@domain.com');
  });

  it('handles empty or non-string inputs gracefully', () => {
    expect(maskEmail('')).toBe('');
    expect(maskEmail(null)).toBe('');
    expect(maskEmail(undefined)).toBe('');
  });

  it('returns raw text if no at symbol is found', () => {
    expect(maskEmail('invalid-email')).toBe('invalid-email');
  });

  it('returns raw text when at symbol is the very first character (atIndex === 0)', () => {
    // atIndex <= 0 branch: the local part would be empty, return trimmed as-is
    expect(maskEmail('@domain.com')).toBe('@domain.com');
  });

  it('trims leading and trailing whitespace', () => {
    expect(maskEmail('  user@test.com  ')).toBe('u***@test.com');
  });

  it('preserves subdomain and plus-addressing correctly', () => {
    // covers AC-2: masking still exposes only first char, domain kept intact
    expect(maskEmail('alice+promo@mail.example.co.id')).toBe('a***@mail.example.co.id');
  });
});

describe('sanitizeInvoice', () => {
  it('masks customer email and retains token when status is pending', () => {
    const rawInvoice = {
      orderId: 'ORDER-001',
      status: 'pending',
      token: 'snap-token-123',
      customer: {
        email: 'user@example.com',
        userId: '123456',
        gameId: 'mobile-legends',
      },
    };

    const sanitized = sanitizeInvoice(rawInvoice);

    expect(sanitized.token).toBe('snap-token-123');
    expect(sanitized.customer).toEqual({
      email: 'u***@example.com',
      userId: '123456',
      gameId: 'mobile-legends',
    });
  });

  it('nullifies token when status is success', () => {
    const rawInvoice = {
      orderId: 'ORDER-002',
      status: 'success',
      token: 'snap-token-settled',
      customer: {
        email: 'paid@example.com',
        userId: '987654',
      },
    };

    const sanitized = sanitizeInvoice(rawInvoice);

    expect(sanitized.token).toBeNull();
    expect(sanitized.customer.email).toBe('p***@example.com');
  });

  it('nullifies token when status is failed or expired', () => {
    const failedInvoice = sanitizeInvoice({
      status: 'failed',
      token: 'failed-token',
      customer: { email: 'fail@example.com' },
    });
    expect(failedInvoice.token).toBeNull();

    const expiredInvoice = sanitizeInvoice({
      status: 'expired',
      token: 'expired-token',
      customer: { email: 'expire@example.com' },
    });
    expect(expiredInvoice.token).toBeNull();
  });

  it('handles invoice with no token field (undefined) without throwing (AC-3)', () => {
    // token is optional — must not crash or produce unexpected value
    const invoice = sanitizeInvoice({
      status: 'success',
      token: undefined,
      customer: { email: 'notoken@example.com' },
    });
    // non-pending status: token must be null regardless
    expect(invoice.token).toBeNull();
    expect(invoice.customer.email).toBe('n***@example.com');
  });

  it('handles invoice with no customer field at all (AC-2)', () => {
    // customer is undefined — sanitizeInvoice must not throw
    const invoice = sanitizeInvoice({
      status: 'pending',
      token: 'tok-abc',
      customer: undefined,
    });
    expect(invoice.token).toBe('tok-abc');
    expect(invoice.customer).toBeUndefined();
  });

  it('leaves customer unchanged when customer is not a plain object (AC-2)', () => {
    // customer typed as unknown but runtime value is a string — must not crash
    const invoice = sanitizeInvoice({
      status: 'pending',
      token: 'tok-xyz',
      customer: 'raw-string-value' as unknown,
    });
    // Non-object customer: sanitizeInvoice skips the masking branch
    expect(invoice.customer).toBe('raw-string-value');
  });

  it('leaves customer.email unchanged when it is not a string (AC-2)', () => {
    // customer.email might be null from a DB row
    const invoice = sanitizeInvoice({
      status: 'pending',
      token: 'tok-def',
      customer: { email: null, userId: 'U-1' },
    });
    // non-string email is passed through as-is, no crash
    expect(invoice.customer.email).toBeNull();
  });

  it('preserves all non-PII customer fields after sanitization (AC-2)', () => {
    const raw = {
      status: 'success',
      token: 'tok-settled',
      customer: {
        email: 'test@domain.id',
        userId: 'U-42',
        gameId: 'free-fire',
        serverId: '1234',
      },
    };
    const result = sanitizeInvoice(raw);
    // email masked, token nulled, but other fields intact
    expect(result.customer.email).toBe('t***@domain.id');
    expect(result.customer.userId).toBe('U-42');
    expect(result.customer.gameId).toBe('free-fire');
    expect(result.customer.serverId).toBe('1234');
    expect(result.token).toBeNull();
  });
});
