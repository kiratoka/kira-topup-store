import { describe, it, expect } from 'vitest';
import { apiError } from './errors';

describe('lib/errors - apiError helper', () => {
  it('returns response with success: false and message and correct HTTP status', async () => {
    const res = apiError('Terjadi kesalahan', 400);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Terjadi kesalahan',
    });
  });

  it('includes optional code when provided', async () => {
    const res = apiError('Akses ditolak', 403, 'FORBIDDEN');
    const data = await res.json();

    expect(res.status).toBe(403);
    expect(data).toEqual({
      success: false,
      message: 'Akses ditolak',
      code: 'FORBIDDEN',
    });
  });

  it('includes extra fields when provided', async () => {
    const res = apiError('Data tidak valid', 400, undefined, {
      errors: { 'customer.email': 'Format email tidak valid' },
    });
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data).toEqual({
      success: false,
      message: 'Data tidak valid',
      errors: { 'customer.email': 'Format email tidak valid' },
    });
  });

  it('does not leak internal error properties', async () => {
    const res = apiError('Terjadi kesalahan internal pada server', 500);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBeUndefined();
    expect(data.stack).toBeUndefined();
    expect(data.exception).toBeUndefined();
  });

  it('sets application/json content-type header', () => {
    const res = apiError('Kesalahan', 400);
    expect(res.headers.get('content-type')).toContain('application/json');
  });

  it.each([
    { status: 400, name: 'Bad Request' },
    { status: 401, name: 'Unauthorized' },
    { status: 403, name: 'Forbidden' },
    { status: 404, name: 'Not Found' },
    { status: 429, name: 'Too Many Requests' },
    { status: 500, name: 'Internal Server Error' },
  ])('supports HTTP status $status ($name)', async ({ status }) => {
    const res = apiError(`Error ${status}`, status);
    const data = await res.json();

    expect(res.status).toBe(status);
    expect(data.success).toBe(false);
    expect(data.message).toBe(`Error ${status}`);
  });

  it('omits code property when code is undefined', async () => {
    const res = apiError('Pesan kesalahan', 400);
    const data = await res.json();

    expect('code' in data).toBe(false);
  });

  it('handles empty message string gracefully', async () => {
    const res = apiError('', 400);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.success).toBe(false);
    expect(data.message).toBe('');
  });

  it('merges multiple extra fields without dropping success: false', async () => {
    const res = apiError('Multi extra', 422, 'UNPROCESSABLE', {
      fieldA: 'errorA',
      fieldB: 123,
      nested: { detail: 'nested info' },
    });
    const data = await res.json();

    expect(data).toEqual({
      success: false,
      message: 'Multi extra',
      code: 'UNPROCESSABLE',
      fieldA: 'errorA',
      fieldB: 123,
      nested: { detail: 'nested info' },
    });
  });

  describe('reserved keys protection', () => {
    it('prevents extra from overwriting success: false', async () => {
      const res = apiError('Terjadi kesalahan', 400, undefined, {
        success: true,
      });
      const data = await res.json();

      expect(data.success).toBe(false);
      expect(data.message).toBe('Terjadi kesalahan');
    });

    it('prevents extra from overwriting message', async () => {
      const res = apiError('Pesan asli', 400, undefined, {
        message: 'Pesan palsu',
      });
      const data = await res.json();

      expect(data.message).toBe('Pesan asli');
    });

    it('prevents extra from overwriting canonical code', async () => {
      const res = apiError('Akses ditolak', 403, 'CANONICAL_CODE', {
        code: 'OVERWRITTEN_CODE',
      });
      const data = await res.json();

      expect(data.code).toBe('CANONICAL_CODE');
    });

    it('prevents extra from injecting code when code parameter is omitted', async () => {
      const res = apiError('Terjadi kesalahan', 400, undefined, {
        code: 'INJECTED_CODE',
      });
      const data = await res.json();

      expect('code' in data).toBe(false);
    });

    it('strips reserved keys while preserving valid extra fields', async () => {
      const res = apiError('Validasi gagal', 422, 'VALIDATION_ERROR', {
        success: true,
        message: 'Diabaikan',
        code: 'DIABAIKAN',
        errors: { field: 'Field tidak valid' },
        meta: { timestamp: 123456 },
      });
      const data = await res.json();

      expect(data).toEqual({
        success: false,
        message: 'Validasi gagal',
        code: 'VALIDATION_ERROR',
        errors: { field: 'Field tidak valid' },
        meta: { timestamp: 123456 },
      });
    });
  });
});


