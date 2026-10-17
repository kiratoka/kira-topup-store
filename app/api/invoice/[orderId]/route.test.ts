import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindUnique, mockRateLimit, mockGetClientIp } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
  mockRateLimit: vi.fn(),
  mockGetClientIp: vi.fn(),
}));

vi.mock('@/lib/db/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: mockFindUnique,
    },
  },
}));

vi.mock('@/lib/cache/rate-limit', () => ({
  rateLimit: mockRateLimit,
  getClientIp: mockGetClientIp,
}));

import { GET } from './route';
import { invoiceLogger } from '@/lib/logging/logger';

describe('GET /api/invoice/[orderId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(false);
    mockGetClientIp.mockReturnValue('203.0.113.1');
  });

  function makeRequest(orderId: string): Request {
    return new Request(`http://localhost:3000/api/invoice/${orderId}`, {
      method: 'GET',
    });
  }

  it('enforces rate limiting and calls rateLimit with 30 req/min and rate-limit:invoice prefix', async () => {
    mockGetClientIp.mockReturnValue('198.51.100.99');
    mockFindUnique.mockResolvedValue({
      orderId: 'ORDER-123',
      status: 'pending',
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:05:00Z'),
      paymentTime: null,
    });

    const req = makeRequest('ORDER-123');
    const params = Promise.resolve({ orderId: 'ORDER-123' });
    await GET(req, { params });

    expect(mockGetClientIp).toHaveBeenCalledWith(req);
    expect(mockRateLimit).toHaveBeenCalledWith('198.51.100.99', 30, 60000, 'rate-limit:invoice');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockResolvedValue(true);

    const req = makeRequest('ORDER-123');
    const params = Promise.resolve({ orderId: 'ORDER-123' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Terlalu banyak permintaan, silakan coba beberapa saat lagi');
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns 400 with Indonesian message when orderId is empty (AC-1, AC-3)', async () => {
    const req = makeRequest('');
    const params = Promise.resolve({ orderId: '' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Order ID wajib diisi');
    expect(data.error).toBeUndefined();
  });

  it('returns 404 with Indonesian message when invoice is not found (AC-1, AC-3)', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = makeRequest('ORDER-NONEXISTENT');
    const params = Promise.resolve({ orderId: 'ORDER-NONEXISTENT' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Invoice tidak ditemukan');
    expect(data.error).toBeUndefined();
  });

  it('returns 200 with formatted invoice, masked email, and token for pending invoice', async () => {
    const mockInvoice = {
      orderId: 'ORDER-123',
      status: 'pending',
      token: 'snap-token-pending',
      customer: {
        email: 'customer@gmail.com',
        userId: 'USER-123',
        gameId: 'genshin-impact',
      },
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:05:00Z'),
      paymentTime: null,
    };
    mockFindUnique.mockResolvedValue(mockInvoice);

    const req = makeRequest('ORDER-123');
    const params = Promise.resolve({ orderId: 'ORDER-123' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.invoice.orderId).toBe('ORDER-123');
    expect(data.invoice.token).toBe('snap-token-pending');
    expect(data.invoice.customer.email).toBe('c***@gmail.com');
    expect(data.invoice.createdAt).toBe('2026-09-26T10:00:00.000Z');
  });

  it('nullifies token when invoice status is settled (success)', async () => {
    const mockInvoice = {
      orderId: 'ORDER-789',
      status: 'success',
      token: 'snap-token-settled',
      customer: {
        email: 'buyer@example.org',
        userId: 'USER-789',
      },
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:05:00Z'),
      paymentTime: new Date('2026-09-26T10:05:00Z'),
    };
    mockFindUnique.mockResolvedValue(mockInvoice);

    const req = makeRequest('ORDER-789');
    const params = Promise.resolve({ orderId: 'ORDER-789' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoice.token).toBeNull();
    expect(data.invoice.customer.email).toBe('b***@example.org');
  });

  it('returns 500 without leaking error details when database query fails (AC-1, AC-2, AC-3)', async () => {
    const loggerSpy = vi.spyOn(invoiceLogger, 'error').mockImplementation(() => {});
    mockFindUnique.mockRejectedValue(new Error('Sensitive database connection string or table error'));

    const req = makeRequest('ORDER-ERR');
    const params = Promise.resolve({ orderId: 'ORDER-ERR' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Gagal mengambil data invoice');
    expect(data.error).toBeUndefined();
    expect(data.stack).toBeUndefined();
    expect(loggerSpy).toHaveBeenCalledWith(
      expect.objectContaining({ err: expect.any(Error) }),
      'Error fetching invoice'
    );

    loggerSpy.mockRestore();
  });

  it('ensures all error responses return application/json and omit sensitive fields', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = makeRequest('ORDER-NOT-EXIST');
    const params = Promise.resolve({ orderId: 'ORDER-NOT-EXIST' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(data.error).toBeUndefined();
    expect(data.stack).toBeUndefined();
    expect(data.cause).toBeUndefined();
  });

  it('converts paymentTime to ISO string when not null (AC-1)', async () => {
    const paymentDate = new Date('2026-09-27T08:00:00Z');
    mockFindUnique.mockResolvedValue({
      orderId: 'ORDER-PAID-2',
      status: 'success',
      token: 'tok-paid-2',
      customer: { email: 'buyer@example.id', userId: 'U-99' },
      createdAt: new Date('2026-09-27T07:00:00Z'),
      updatedAt: new Date('2026-09-27T08:00:00Z'),
      paymentTime: paymentDate,
    });

    const req = makeRequest('ORDER-PAID-2');
    const params = Promise.resolve({ orderId: 'ORDER-PAID-2' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoice.paymentTime).toBe(paymentDate.toISOString());
    expect(data.invoice.paymentTime).toBe('2026-09-27T08:00:00.000Z');
  });

  it('returns paymentTime as null when not set in invoice (AC-1)', async () => {
    mockFindUnique.mockResolvedValue({
      orderId: 'ORDER-PEND-2',
      status: 'pending',
      token: 'tok-pend-2',
      customer: { email: 'pending2@example.id', userId: 'U-100' },
      createdAt: new Date('2026-09-27T07:00:00Z'),
      updatedAt: new Date('2026-09-27T07:01:00Z'),
      paymentTime: null,
    });

    const req = makeRequest('ORDER-PEND-2');
    const params = Promise.resolve({ orderId: 'ORDER-PEND-2' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoice.paymentTime).toBeNull();
  });

  it('does not expose any raw database error message in 500 response (security)', async () => {
    const loggerSpy = vi.spyOn(invoiceLogger, 'error').mockImplementation(() => {});
    mockFindUnique.mockRejectedValue(new Error('PrismaClientKnownRequestError: table not found'));

    const req = makeRequest('ORDER-DB-ERR-2');
    const params = Promise.resolve({ orderId: 'ORDER-DB-ERR-2' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(JSON.stringify(data)).not.toContain('PrismaClientKnownRequestError');
    expect(JSON.stringify(data)).not.toContain('table not found');
    loggerSpy.mockRestore();
  });
});
