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

describe('GET /api/invoice', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRateLimit.mockResolvedValue(false);
    mockGetClientIp.mockReturnValue('203.0.113.1');
  });

  function makeRequest(url: string = 'http://localhost:3000/api/invoice'): Request {
    return new Request(url, {
      method: 'GET',
    });
  }

  it('enforces rate limiting and calls rateLimit with 30 req/min and rate-limit:invoice prefix', async () => {
    mockGetClientIp.mockReturnValue('198.51.100.42');
    mockFindUnique.mockResolvedValue({
      orderId: 'ORDER-123',
      status: 'pending',
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:05:00Z'),
      paymentTime: null,
    });

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-123');
    await GET(req);

    expect(mockGetClientIp).toHaveBeenCalledWith(req);
    expect(mockRateLimit).toHaveBeenCalledWith('198.51.100.42', 30, 60000, 'rate-limit:invoice');
  });

  it('returns 429 when rate limit is exceeded', async () => {
    mockRateLimit.mockResolvedValue(true);

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-123');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(429);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Terlalu banyak permintaan, silakan coba beberapa saat lagi');
    expect(mockFindUnique).not.toHaveBeenCalled();
  });

  it('returns 400 with Indonesian message when orderId is missing without query params (AC-1, AC-3)', async () => {
    const req = makeRequest();
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Order ID wajib diisi');
    expect(data.error).toBeUndefined();
  });

  it('returns 400 with Indonesian message when orderId query param is empty (AC-1, AC-3)', async () => {
    const req = makeRequest('http://localhost:3000/api/invoice?orderId=');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Order ID wajib diisi');
    expect(data.error).toBeUndefined();
  });

  it('returns 404 with Indonesian message when invoice is not found (AC-1, AC-3)', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-NONEXISTENT');
    const response = await GET(req);
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
        userId: 'USER-99',
        gameId: 'mobile-legends',
      },
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:05:00Z'),
      paymentTime: null,
    };
    mockFindUnique.mockResolvedValue(mockInvoice);

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-123');
    const response = await GET(req);
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
      orderId: 'ORDER-456',
      status: 'success',
      token: 'snap-token-settled',
      customer: {
        email: 'customer@yahoo.com',
        userId: 'USER-100',
      },
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:05:00Z'),
      paymentTime: new Date('2026-09-26T10:05:00Z'),
    };
    mockFindUnique.mockResolvedValue(mockInvoice);

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-456');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoice.token).toBeNull();
    expect(data.invoice.customer.email).toBe('c***@yahoo.com');
  });

  it('returns 500 without leaking error details when database query fails (AC-1, AC-2, AC-3)', async () => {
    const loggerSpy = vi.spyOn(invoiceLogger, 'error').mockImplementation(() => {});
    mockFindUnique.mockRejectedValue(new Error('Sensitive database connection string or table error'));

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-ERR');
    const response = await GET(req);
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

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-NOT-FOUND');
    const response = await GET(req);
    const data = await response.json();

    expect(response.headers.get('content-type')).toContain('application/json');
    expect(data.error).toBeUndefined();
    expect(data.stack).toBeUndefined();
    expect(data.cause).toBeUndefined();
  });

  it('converts paymentTime to ISO string when not null (AC-1)', async () => {
    const paymentDate = new Date('2026-09-26T11:30:00Z');
    const mockInvoice = {
      orderId: 'ORDER-PAID',
      status: 'success',
      token: 'tok-paid',
      customer: { email: 'paid@example.com', userId: 'U-9' },
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T11:30:00Z'),
      paymentTime: paymentDate,
    };
    mockFindUnique.mockResolvedValue(mockInvoice);

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-PAID');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoice.paymentTime).toBe(paymentDate.toISOString());
    expect(data.invoice.paymentTime).toBe('2026-09-26T11:30:00.000Z');
  });

  it('returns paymentTime as null when not set in invoice (AC-1)', async () => {
    mockFindUnique.mockResolvedValue({
      orderId: 'ORDER-PEND',
      status: 'pending',
      token: 'tok-pend',
      customer: { email: 'pend@example.com', userId: 'U-10' },
      createdAt: new Date('2026-09-26T10:00:00Z'),
      updatedAt: new Date('2026-09-26T10:01:00Z'),
      paymentTime: null,
    });

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-PEND');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.invoice.paymentTime).toBeNull();
  });

  it('does not expose any raw database error message in 500 response (security)', async () => {
    const loggerSpy = vi.spyOn(invoiceLogger, 'error').mockImplementation(() => {});
    mockFindUnique.mockRejectedValue(new Error('PrismaClientKnownRequestError: table not found'));

    const req = makeRequest('http://localhost:3000/api/invoice?orderId=ORDER-DB-ERR');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(500);
    // Raw DB error must NOT be in the response body
    expect(JSON.stringify(data)).not.toContain('PrismaClientKnownRequestError');
    expect(JSON.stringify(data)).not.toContain('table not found');
    loggerSpy.mockRestore();
  });
});
