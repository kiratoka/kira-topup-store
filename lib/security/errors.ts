import { NextResponse } from 'next/server';

/**
 * Standardized API error response helper.
 * Returns { success: false, message: string, code?: string, ...extra } with the given HTTP status.
 *
 * Reserved canonical keys ('success', 'message', 'code') cannot be overwritten via `extra`.
 * Any reserved keys passed in `extra` will be stripped.
 */
export function apiError(
  message: string,
  status: number,
  code?: string,
  extra?: Record<string, unknown>
): NextResponse {
  const safeExtra = extra ? { ...extra } : undefined;
  if (safeExtra) {
    delete safeExtra.success;
    delete safeExtra.message;
    delete safeExtra.code;
  }

  return NextResponse.json(
    {
      success: false,
      message,
      ...(code ? { code } : {}),
      ...(safeExtra ? safeExtra : {}),
    },
    { status }
  );
}
