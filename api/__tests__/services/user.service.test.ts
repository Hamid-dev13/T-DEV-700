import * as userService from "../../services/user.service";
import { db } from "../../db/client";
import * as passwordUtils from "../../utils/password";
import jwt from "jsonwebtoken";
import { safeUserSelect } from "../../models/user.model";

jest.mock("../../db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

jest.mock("../../utils/password");
jest.mock("jsonwebtoken");

describe("user.service", () => {
  const baseUser = {
    id: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "test@example.com",
    password: "hashed-password",
    admin: false,
    phone: null,
    refreshToken: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ACCESS_TOKEN_SECRET = "access-secret";
    process.env.REFRESH_TOKEN_SECRET = "refresh-secret";
    process.env.ACCESS_TOKEN_EXPIRES_IN = "1h";
    process.env.REFRESH_TOKEN_EXPIRES_IN = "7d";
  });

  describe("loginUser", () => {
    it("returns tokens and safe user on success", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([baseUser]) }),
        }),
      });
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock)
        .mockReturnValueOnce("access-token")
        .mockReturnValueOnce("refresh-token");
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(undefined) }),
      });

      const result = await userService.loginUser({ email: baseUser.email, password: "plain" });

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user).toMatchObject({ id: baseUser.id, email: baseUser.email });
      expect(result.user).not.toHaveProperty("password");
    });

    it("throws when email or password missing", async () => {
      await expect(userService.loginUser({ email: "", password: "x" }))
        .rejects.toThrow("Missing required fields: email, password");
      await expect(userService.loginUser({ email: "a@b", password: "" }))
        .rejects.toThrow("Missing required fields: email, password");
    });

    it("throws when user not found", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([]) }),
        }),
      });

      await expect(userService.loginUser({ email: baseUser.email, password: "plain" }))
        .rejects.toThrow("Invalid credentials");
    });

    it("throws when password is invalid", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([baseUser]) }),
        }),
      });
      (passwordUtils.verifyPassword as jest.Mock).mockResolvedValue(false);

      await expect(userService.loginUser({ email: baseUser.email, password: "bad" }))
        .rejects.toThrow("Invalid credentials");
    });
  });

  describe("retrieveUserSafe / retrieveUsersSafe", () => {
    it("retrieveUserSafe must use safeUserSelect", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue([baseUser]) }),
        }),
      });

      const user = await userService.retrieveUserSafe(baseUser.id);
      expect(db.select).toHaveBeenCalledWith(safeUserSelect);
    });

    it("retrieveUsersSafe must use safeUserSelect", async () => {
      const users = [baseUser, { ...baseUser, id: "user-2", email: "second@example.com" }];
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockResolvedValue(users) });

      const result = await userService.retrieveUsersSafe();
      expect(result).toHaveLength(2);
      expect(db.select).toHaveBeenCalledWith(safeUserSelect);
    });
  });

  describe("addUser", () => {
    it("hashes password and returns safe user", async () => {
      (passwordUtils.verifyPasswordRequirements as jest.Mock).mockReturnValue(true);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue("hashed");
      const created = { ...baseUser, password: "hashed" };
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([created]) }),
      });

      const result = await userService.addUser({
        first_name: baseUser.firstName,
        last_name: baseUser.lastName,
        email: baseUser.email,
        password: "plain",
      });

      expect(passwordUtils.hashPassword).toHaveBeenCalledWith("plain");
      expect(result).not.toHaveProperty("password");
    });

    it("rejects missing required fields", async () => {
      await expect(userService.addUser({ first_name: "", last_name: "Doe", email: "a@b", password: "p" }))
        .rejects.toThrow("Missing required fields: first_name, last_name, email, password");
    });

    it("rejects when password does not meet requirements", async () => {
      (passwordUtils.verifyPasswordRequirements as jest.Mock).mockReturnValue(false);
      await expect(userService.addUser({ first_name: "J", last_name: "D", email: "a@b", password: "weak" }))
        .rejects.toThrow("Password doesn't meet the minimum security requirements");
    });
  });

  describe("updateUser", () => {
    it("hashes password when provided", async () => {
      (passwordUtils.verifyPasswordRequirements as jest.Mock).mockReturnValue(true);
      (passwordUtils.hashPassword as jest.Mock).mockResolvedValue("new-hashed");
      const updated = { ...baseUser, password: "new-hashed" };
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([updated]) }),
        }),
      });

      const result = await userService.updateUser(baseUser.id, { password: "new" });
      expect(passwordUtils.hashPassword).toHaveBeenCalledWith("new");
      expect(result).not.toHaveProperty("password");
    });

    it("rejects weak password", async () => {
      (passwordUtils.verifyPasswordRequirements as jest.Mock).mockReturnValue(false);
      await expect(userService.updateUser(baseUser.id, { password: "weak" }))
        .rejects.toThrow("Password doesn't meet the minimum security requirements");
    });

    it("updates without password", async () => {
      const updated = { ...baseUser, email: "new@example.com" };
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([updated]) }),
        }),
      });

      const result = await userService.updateUser(baseUser.id, { email: "new@example.com" });
      expect(result.email).toBe("new@example.com");
    });
  });

  describe("deleteUser", () => {
    it("returns true when deletion succeeds", async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: baseUser.id }]) }),
      });

      await expect(userService.deleteUser(baseUser.id)).resolves.toBe(true);
    });
  });
});
