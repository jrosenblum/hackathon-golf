import { createRedirectUrl } from '@/lib/utils';

// Mock NextRequest
class MockRequest {
  nextUrl: URL;
  headers: Map<string, string>;

  constructor(url: string, headers: Record<string, string> = {}) {
    this.nextUrl = new URL(url);
    this.headers = new Map(Object.entries(headers));
  }
}

describe('Utility Functions', () => {
  describe('createRedirectUrl', () => {
    test('creates absolute URL with path using origin from request', () => {
      const request = new MockRequest('https://app.hackathon.golf/current-page', {
        'host': 'app.hackathon.golf',
      }) as any; // Cast to any to satisfy TypeScript

      const redirectUrl = createRedirectUrl('/new-path', request);
      expect(redirectUrl.toString()).toBe('https://app.hackathon.golf/new-path');
    });

    test('creates absolute URL with query parameters', () => {
      const request = new MockRequest('https://app.hackathon.golf/current-page', {
        'host': 'app.hackathon.golf',
      }) as any;

      const redirectUrl = createRedirectUrl('/new-path?param1=value1&param2=value2', request);
      expect(redirectUrl.toString()).toBe('https://app.hackathon.golf/new-path?param1=value1&param2=value2');
    });

    test('uses x-forwarded-host when available', () => {
      const request = new MockRequest('https://internal-url.com/current-page', {
        'host': 'internal-url.com',
        'x-forwarded-host': 'external-url.com',
      }) as any;

      const redirectUrl = createRedirectUrl('/new-path', request);
      expect(redirectUrl.toString()).toBe('https://external-url.com/new-path');
    });

    test('uses x-forwarded-proto when available', () => {
      const request = new MockRequest('http://app.hackathon.golf/current-page', {
        'host': 'app.hackathon.golf',
        'x-forwarded-proto': 'https',
      }) as any;

      const redirectUrl = createRedirectUrl('/new-path', request);
      expect(redirectUrl.toString()).toBe('https://app.hackathon.golf/new-path');
    });

    test('handles absolute URLs correctly', () => {
      const request = new MockRequest('https://app.hackathon.golf/current-page') as any;
      const absoluteUrl = 'https://different-domain.com/path';
      
      const redirectUrl = createRedirectUrl(absoluteUrl, request);
      expect(redirectUrl.toString()).toBe(absoluteUrl);
    });
  });
});