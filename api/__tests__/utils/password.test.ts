import { hashPassword, verifyPassword } from '../../utils/password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('should hash a password and return a string with salt and hash', async () => {
      const password = 'mySecurePassword123';
      const hashed = await hashPassword(password);

      expect(hashed).toBeDefined();
      expect(typeof hashed).toBe('string');
      expect(hashed).toContain(':');

      const parts = hashed.split(':');
      expect(parts).toHaveLength(2);
      expect(parts[0]).toHaveLength(32); // 16 bytes = 32 hex chars
      expect(parts[1]).toHaveLength(128); // 64 bytes = 128 hex chars
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'samePassword';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty password', async () => {
      const hashed = await hashPassword('');
      expect(hashed).toBeDefined();
      expect(hashed).toContain(':');
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'correctPassword';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'correctPassword';
      const wrongPassword = 'wrongPassword';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(wrongPassword, hashed);
      expect(isValid).toBe(false);
    });

    it('should return false for invalid hash format', async () => {
      const password = 'password';
      const invalidHash = 'invalidhashformat';

      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('should return false for hash without colon', async () => {
      const password = 'password';
      const invalidHash = 'abcdef1234567890';

      const isValid = await verifyPassword(password, invalidHash);
      expect(isValid).toBe(false);
    });

    it('should return false for empty hash', async () => {
      const password = 'password';
      const emptyHash = '';

      const isValid = await verifyPassword(password, emptyHash);
      expect(isValid).toBe(false);
    });

    it('should return false for hash with only salt', async () => {
      const password = 'password';
      const hashWithOnlySalt = 'abcdef:';

      const isValid = await verifyPassword(password, hashWithOnlySalt);
      expect(isValid).toBe(false);
    });

    it('should handle empty password verification', async () => {
      const password = '';
      const hashed = await hashPassword(password);

      const isValid = await verifyPassword(password, hashed);
      expect(isValid).toBe(true);
    });
  });
});
