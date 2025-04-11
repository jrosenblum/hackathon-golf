import { isAllowedEmailDomain, ALLOWED_EMAIL_DOMAINS } from '@/lib/auth';

describe('Authentication Utils', () => {
  describe('isAllowedEmailDomain', () => {
    test('returns true for allowed email domains', () => {
      // Test each allowed domain
      ALLOWED_EMAIL_DOMAINS.forEach(domain => {
        const email = `test@${domain}`;
        expect(isAllowedEmailDomain(email)).toBe(true);
      });
    });

    test('returns false for non-allowed email domains', () => {
      const nonAllowedEmails = [
        'user@gmail.com',
        'user@hotmail.com', 
        'user@yahoo.com',
        'user@outlook.com',
        'user@example.com'
      ];
      
      nonAllowedEmails.forEach(email => {
        expect(isAllowedEmailDomain(email)).toBe(false);
      });
    });

    test('handles empty input safely', () => {
      expect(isAllowedEmailDomain('')).toBe(false);
    });

    test('handles null input safely', () => {
      // @ts-ignore - Testing null input explicitly
      expect(isAllowedEmailDomain(null)).toBe(false);
    });
    
    test('handles undefined input safely', () => {
      // @ts-ignore - Testing undefined input explicitly
      expect(isAllowedEmailDomain(undefined)).toBe(false);
    });
    
    test('handles malformed emails safely', () => {
      const malformedEmails = [
        'not-an-email',
        'missing-at-symbol.com',
        '@missing-local-part.com',
        'spaces in email@domain.com',
        'multiple@at@symbols.com'
      ];
      
      malformedEmails.forEach(email => {
        expect(isAllowedEmailDomain(email)).toBe(false);
      });
    });
  });
});