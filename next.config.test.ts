import { describe, it, expect } from 'vitest';
import nextConfig from './next.config';

describe('next.config.ts security configuration', () => {
  it('restricts image remotePatterns to trusted domains without wildcards (AC-1)', () => {
    const remotePatterns = nextConfig.images?.remotePatterns;
    expect(remotePatterns).toBeDefined();
    expect(Array.isArray(remotePatterns)).toBe(true);

    const patterns = remotePatterns as Array<{ protocol: string; hostname: string }>;
    
    // Pastikan tidak ada wildcard
    patterns.forEach((pattern) => {
      expect(pattern.hostname).not.toBe('**');
      expect(pattern.hostname).not.toBe('*');
      expect(pattern.protocol).toBe('https');
    });

    const hostnames = patterns.map((p) => p.hostname);
    expect(hostnames).toContain('cdn1.codashop.com');
    expect(hostnames).toContain('asetto.nawalakarsa.id');
    expect(hostnames).toContain('hybrid.co.id');
  });

  it('restricts CSP img-src directive to trusted origins without open https: wildcard (AC-2)', async () => {
    expect(typeof nextConfig.headers).toBe('function');

    const headersList = await nextConfig.headers!();
    const globalRoute = headersList.find((h) => h.source === '/(.*)');
    expect(globalRoute).toBeDefined();

    const cspHeader = globalRoute?.headers.find((header) => header.key === 'Content-Security-Policy');
    expect(cspHeader).toBeDefined();
    expect(cspHeader?.value).toBeDefined();

    const csp = cspHeader!.value;

    // Pastikan img-src ada dan tidak mengizinkan open wildcard https:
    const imgSrcMatch = csp.match(/img-src ([^;]+);/);
    expect(imgSrcMatch).not.toBeNull();

    const imgSrcSources = imgSrcMatch![1].split(/\s+/);

    // img-src tidak boleh memiliki https: berdiri sendiri sebagai wildcard
    expect(imgSrcSources).not.toContain('https:');

    // img-src harus mengizinkan self, data:, dan domain aset yang sah
    expect(imgSrcSources).toContain("'self'");
    expect(imgSrcSources).toContain('data:');
    expect(imgSrcSources).toContain('https://cdn1.codashop.com');
    expect(imgSrcSources).toContain('https://asetto.nawalakarsa.id');
    expect(imgSrcSources).toContain('https://hybrid.co.id');
    expect(imgSrcSources).toContain('https://app.sandbox.midtrans.com');
    expect(imgSrcSources).toContain('https://app.midtrans.com');
  });
});
