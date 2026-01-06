import { hashPassword, verifyPassword, verifyPasswordRequirements } from "../../utils/password";

describe("password utils", () => {
  describe("hashPassword", () => {
    it("hashes a password and returns salt + hash", async () => {
      const hashed = await hashPassword("MySecure#123");
      const parts = hashed.split(":");

      expect(parts).toHaveLength(2);
      expect(parts[0]).toMatch(/^[a-f0-9]{32}$/); // 16 bytes salt
      expect(parts[1]).toMatch(/^[a-f0-9]{128}$/); // 64 bytes derived key
    });

    it("generates different salts for identical inputs", async () => {
      const password = "Repeat#123";
      const first = await hashPassword(password);
      const second = await hashPassword(password);

      expect(first).not.toBe(second);
      await expect(verifyPassword(password, first)).resolves.toBe(true);
      await expect(verifyPassword(password, second)).resolves.toBe(true);
    });
  });

  describe("verifyPassword", () => {
    it("returns true for the correct password", async () => {
      const password = "Secur3#Pass";
      const hashed = await hashPassword(password);

      await expect(verifyPassword(password, hashed)).resolves.toBe(true);
    });

    it("returns false for a wrong password", async () => {
      const hashed = await hashPassword("Secur3#Pass");

      await expect(verifyPassword("Wrong#123", hashed)).resolves.toBe(false);
    });

    it("returns false for malformed hashes", async () => {
      await expect(verifyPassword("any", "invalid-hash"))
        .resolves.toBe(false);
      await expect(verifyPassword("any", "salt-only:"))
        .resolves.toBe(false);
      await expect(verifyPassword("any", ""))
        .resolves.toBe(false);
    });
  });

  describe("verifyPasswordRequirements", () => {
    it("accepts passwords meeting all rules", () => {
      expect(verifyPasswordRequirements("Abc1#"))
        .toBe(true);
    });

    it("rejects passwords missing an uppercase letter", () => {
      expect(verifyPasswordRequirements("abc1#"))
        .toBe(false);
    });

    it("rejects passwords missing a lowercase letter", () => {
      expect(verifyPasswordRequirements("ABC1#"))
        .toBe(false);
    });

    it("rejects passwords missing a digit", () => {
      expect(verifyPasswordRequirements("Abcde#"))
        .toBe(false);
    });

    it("rejects passwords missing a special character", () => {
      expect(verifyPasswordRequirements("Abc12"))
        .toBe(false);
    });

    it("rejects passwords that are too short", () => {
      expect(verifyPasswordRequirements("A1#"))
        .toBe(false);
    });
  });
});
