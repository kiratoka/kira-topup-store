import { NextRequest, NextResponse } from 'next/server';
import { nanoid } from 'nanoid';
import { apiError } from '@/lib/security/errors';

const WEBHOOK_PATH = '/api/payment/notification';

export function proxy(request: NextRequest) {
  const requestId = nanoid();
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const isPost = request.method === 'POST';
  const isWebhook = request.nextUrl.pathname === WEBHOOK_PATH;

  // AC-2: Content-Type check for POST (exclude webhook)
  if (isPost && !isWebhook) {
    const contentType = request.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const response = apiError('Content-Type harus application/json', 415);
      response.headers.set('x-request-id', requestId);
      return response;
    }
  }

  // AC-3: Origin check for POST (exclude webhook)
  if (isPost && !isWebhook) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
      : (process.env.NODE_ENV === 'production' ? [] : ['*']);

    if (!allowedOrigins.includes('*')) {
      const origin =
        request.headers.get('origin') ||
        request.headers.get('referer') ||
        '';
      const isAllowed =
        origin !== '' &&
        allowedOrigins.some((allowed) => origin.startsWith(allowed));

      if (!isAllowed) {
        const response = apiError('Origin tidak diizinkan', 403);
        response.headers.set('x-request-id', requestId);
        return response;
      }
    }
  }

  // AC-1: Forward request with injected header and attach to response
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });
  response.headers.set('x-request-id', requestId);
  return response;
}

export const config = {
  matcher: '/api/:path*',
};
