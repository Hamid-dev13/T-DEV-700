import jwt from "jsonwebtoken";
import { hasValidRefreshToken } from "../../middleware/hasValidRefreshToken";
import { COOKIE_REFRESH_TOKEN_KEY } from "../../utils/cookies";

jest.mock("jsonwebtoken", () => ({
  verify: jest.fn(),
}));

describe("hasValidRefreshToken middleware", () => {
  const next = jest.fn();
  const sendError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.REFRESH_TOKEN_SECRET = "test-refresh-secret";
  });

  it("returns 401 when no refresh token is provided", async () => {
    const req: any = { headers: {} };
    const res: any = { sendError };

    await hasValidRefreshToken(req, res, next);

    expect(sendError).toHaveBeenCalledWith("No refresh token provided", 401);
    expect(next).not.toHaveBeenCalled();
  });

  it("returns 401 when token verification throws", async () => {
    const req: any = {
      headers: { cookie: `${COOKIE_REFRESH_TOKEN_KEY}=invalid` },
    };
    const res: any = { sendError };

    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error("bad token");
    });

    await hasValidRefreshToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "invalid",
      process.env.REFRESH_TOKEN_SECRET
    );
    expect(sendError).toHaveBeenCalledTimes(1);
    expect(sendError.mock.calls[0][1]).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });

  it("populates req.user_id and calls next on valid token", async () => {
    const req: any = {
      headers: { cookie: `${COOKIE_REFRESH_TOKEN_KEY}=valid-token` },
    };
    const res: any = { sendError };

    (jwt.verify as jest.Mock).mockReturnValue({ user_id: "user-123" });

    await hasValidRefreshToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "valid-token",
      process.env.REFRESH_TOKEN_SECRET
    );
    expect(req.user_id).toBe("user-123");
    expect(sendError).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
