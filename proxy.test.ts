import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { proxy, config } from './proxy';

describe('Security Proxy', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('has matcher for /api/:path*', () => {
    expect(config.matcher).toBe('/api/:path*');
  });

  it('injects x-request-id (21 chars nanoid) on request and returns it on response (AC-1)', () => {
    const request = new NextRequest('http://localhost:3000/api/invoice?orderId=ORD-123', {
      method: 'GET',
    });

    const response = proxy(request);
    const requestId = response.headers.get('x-request-id');

    expect(requestId).toBeDefined();
    expect(typeof requestId).toBe('string');
    expect(requestId?.length).toBe(21);
  });

  it('rejects POST request without application/json Content-Type with 415 (AC-2)', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'content-type': 'text/plain',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(415);
    expect(response.headers.get('x-request-id')).toBeDefined();

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Content-Type harus application/json');
  });

  it('rejects POST request missing Content-Type header with 415 (AC-2)', async () => {
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
    });

    const response = proxy(request);
    expect(response.status).toBe(415);

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Content-Type harus application/json');
  });

  it('allows POST request with application/json Content-Type (AC-2)', () => {
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBeDefined();
  });

  it('allows POST webhook endpoint even without application/json (AC-2 bypass)', () => {
    const request = new NextRequest('http://localhost:3000/api/payment/notification', {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
    expect(response.headers.get('x-request-id')).toBeDefined();
  });

  it('allows POST requests when ALLOWED_ORIGINS contains wildcard * (AC-3)', () => {
    process.env.ALLOWED_ORIGINS = '*';
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://any-external-domain.com',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
  });

  it('rejects POST request when origin is not in ALLOWED_ORIGINS with 403 (AC-3)', async () => {
    process.env.ALLOWED_ORIGINS = 'https://kiratopup.com,https://www.kiratopup.com';
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil-site.com',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(403);
    expect(response.headers.get('x-request-id')).toBeDefined();

    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.message).toBe('Origin tidak diizinkan');
  });

  it('allows POST request when origin matches one of ALLOWED_ORIGINS (AC-3)', () => {
    process.env.ALLOWED_ORIGINS = 'https://kiratopup.com,https://www.kiratopup.com';
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://www.kiratopup.com',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
  });

  it('allows POST request when referer matches ALLOWED_ORIGINS if origin header is omitted (AC-3)', () => {
    process.env.ALLOWED_ORIGINS = 'https://kiratopup.com';
    const request = new NextRequest('http://localhost:3000/api/payment', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        referer: 'https://kiratopup.com/topup/mobile-legends',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
  });

  it('bypasses origin check for webhook notification endpoint (AC-3 bypass)', () => {
    process.env.ALLOWED_ORIGINS = 'https://kiratopup.com';
    const request = new NextRequest('http://localhost:3000/api/payment/notification', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://api.midtrans.com',
      },
    });

    const response = proxy(request);
    expect(response.status).toBe(200);
  });
});
