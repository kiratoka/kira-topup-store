import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn(),
}));

vi.mock('@/lib/prisma', () => ({
  prisma: {
    invoice: {
      findUnique: mockFindUnique,
    },
  },
}));

import { GET } from './route';

describe('GET /api/invoice/[orderId]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  function makeRequest(orderId: string): Request {
    return new Request(`http://localhost:3000/api/invoice/${orderId}`, {
      method: 'GET',
    });
  }

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

  it('returns 200 with formatted invoice when found', async () => {
    const mockInvoice = {
      orderId: 'ORDER-123',
      status: 'pending',
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
    expect(data.invoice.createdAt).toBe('2026-09-26T10:00:00.000Z');
  });

  it('returns 500 without leaking error details when database query fails (AC-1, AC-2, AC-3)', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockFindUnique.mockRejectedValue(new Error('Sensitive database connection string or table error'));

    const req = makeRequest('ORDER-ERR');
    const params = Promise.resolve({ orderId: 'ORDER-ERR' });
    const response = await GET(req, { params });
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.success).toBe(false);
    expect(data.message).toBe('Gagal mengambil data invoice');
    // AC-2: Field `error` MUST NOT be present in response
    expect(data.error).toBeUndefined();
    expect(data.stack).toBeUndefined();
    // AC-2: Internal error logged to console.error
    expect(consoleSpy).toHaveBeenCalledWith(
      'Error fetching invoice:',
      expect.any(Error)
    );

    consoleSpy.mockRestore();
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
});

