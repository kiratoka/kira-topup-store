/**
 * Midtrans Snap script URLs for sandbox and production environments.
 */
export const MIDTRANS_SNAP_URL = {
  sandbox: 'https://app.sandbox.midtrans.com/snap/snap.js',
  production: 'https://app.midtrans.com/snap/snap.js',
} as const;

/**
 * Returns the appropriate Midtrans Snap script URL based on NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION.
 * Defaults to sandbox if the environment variable is not explicitly set to 'true'.
 *
 * @param isProduction Optional explicit boolean override (primarily for testing).
 * @returns Full URL to snap.js script.
 */
export function getMidtransSnapUrl(isProduction?: boolean): string {
  const isProd =
    isProduction !== undefined
      ? isProduction
      : process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true';

  return isProd ? MIDTRANS_SNAP_URL.production : MIDTRANS_SNAP_URL.sandbox;
}
