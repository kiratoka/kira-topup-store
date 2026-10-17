import { describe, it, expect, afterEach } from 'vitest';
import { getMidtransSnapUrl, MIDTRANS_SNAP_URL } from './midtrans';

describe('lib/payment/midtrans - getMidtransSnapUrl', () => {
  const originalEnv = process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION;

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = originalEnv;
    } else {
      delete process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION;
    }
  });

  it('returns production URL when NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION is "true"', () => {
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'true';
    expect(getMidtransSnapUrl()).toBe(MIDTRANS_SNAP_URL.production);
    expect(getMidtransSnapUrl()).toBe('https://app.midtrans.com/snap/snap.js');
  });

  it('returns sandbox URL when NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION is "false"', () => {
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'false';
    expect(getMidtransSnapUrl()).toBe(MIDTRANS_SNAP_URL.sandbox);
    expect(getMidtransSnapUrl()).toBe('https://app.sandbox.midtrans.com/snap/snap.js');
  });

  it('returns sandbox URL when NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION is undefined', () => {
    delete process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION;
    expect(getMidtransSnapUrl()).toBe(MIDTRANS_SNAP_URL.sandbox);
  });

  it('returns sandbox URL when NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION is an unexpected string', () => {
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = '1';
    expect(getMidtransSnapUrl()).toBe(MIDTRANS_SNAP_URL.sandbox);

    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'yes';
    expect(getMidtransSnapUrl()).toBe(MIDTRANS_SNAP_URL.sandbox);
  });

  it('supports explicit boolean argument override', () => {
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'false';
    expect(getMidtransSnapUrl(true)).toBe(MIDTRANS_SNAP_URL.production);

    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION = 'true';
    expect(getMidtransSnapUrl(false)).toBe(MIDTRANS_SNAP_URL.sandbox);
  });
});
