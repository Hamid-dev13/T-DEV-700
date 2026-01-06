import * as passwordService from "../../services/password.service";
import { db } from "../../db/client";
import * as passwordUtils from "../../utils/password";

jest.mock("../../db/client", () => ({
  db: {
    transaction: jest.fn(),
    select: jest.fn(),
  },
}));

jest.mock("../../utils/password");

describe("password.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.PASSWORD_RESET_TOKEN_EXPIRATION = "30";
  });

  it("generates a password reset token", async () => {
    const mockToken = { id: "tok-1" };
    const tx = {
      select: jest.fn().mockReturnValue({
        from: jest.fn().mockReturnValue({ where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([{ id: "user-1" }]) }) }),
      }),
      delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      insert: jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([mockToken]) }),
      }),
    } as any;

    (db.transaction as jest.Mock).mockImplementation(async (cb) => cb(tx));

    const result = await passwordService.generatePasswordResetToken("user@example.com");

    expect(tx.select).toHaveBeenCalled();
    expect(tx.delete).toHaveBeenCalled();
    expect(tx.insert).toHaveBeenCalled();
    expect(result).toBe("tok-1");
  });

  it("changes password with valid token", async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: "tok-1", user_id: "u1", expiresAt: new Date(Date.now() + 10000) }]),
        }),
      }),
    });

    const tx = {
      update: jest.fn().mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      }),
      delete: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
    } as any;

    (passwordUtils.hashPassword as jest.Mock).mockResolvedValue("hashed");
    (db.transaction as jest.Mock).mockImplementation(async (cb) => cb(tx));

    await passwordService.changePasswordWithToken("new-pass", "tok-1");

    expect(passwordUtils.hashPassword).toHaveBeenCalledWith("new-pass");
    expect(tx.update).toHaveBeenCalled();
    expect(tx.delete).toHaveBeenCalled();
  });

  it("throws when token is expired", async () => {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({
          limit: jest.fn().mockResolvedValue([{ id: "tok-1", user_id: "u1", expiresAt: new Date(Date.now() - 1000) }]),
        }),
      }),
    });

    await expect(passwordService.changePasswordWithToken("new-pass", "tok-1"))
      .rejects.toThrow("Token has expired");
  });
});
