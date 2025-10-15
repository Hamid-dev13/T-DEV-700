import { getCookie } from '../../utils/cookies';

describe('Cookie Utils', () => {
  describe('getCookie', () => {
    it('should extract cookie value from cookie string', () => {
      const cookies = 'token=abc123; session=xyz789; user=john';
      const value = getCookie(cookies, 'token');

      expect(value).toBe('abc123');
    });

    it('should extract cookie value from middle of string', () => {
      const cookies = 'first=value1; token=abc123; last=value3';
      const value = getCookie(cookies, 'token');

      expect(value).toBe('abc123');
    });

    it('should extract cookie value from end of string', () => {
      const cookies = 'first=value1; second=value2; token=abc123';
      const value = getCookie(cookies, 'token');

      expect(value).toBe('abc123');
    });

    it('should return null when cookie not found', () => {
      const cookies = 'session=xyz789; user=john';
      const value = getCookie(cookies, 'token');

      expect(value).toBeNull();
    });

    it('should return null when cookie string is empty', () => {
      const cookies = '';
      const value = getCookie(cookies, 'token');

      expect(value).toBeNull();
    });

    it('should handle cookie with semicolon in value', () => {
      const cookies = 'token=abc;123';
      const value = getCookie(cookies, 'token');

      expect(value).toBe('abc');
    });

    it('should handle cookies with spaces', () => {
      const cookies = 'token=abc123; session=xyz789';
      const value = getCookie(cookies, 'session');

      expect(value).toBe('xyz789');
    });

    it('should handle single cookie', () => {
      const cookies = 'token=singleValue';
      const value = getCookie(cookies, 'token');

      expect(value).toBe('singleValue');
    });

    it('should not match partial cookie names', () => {
      const cookies = 'mytoken=value1; token=value2';
      const value = getCookie(cookies, 'token');

      expect(value).toBe('value2');
    });
  });
});
