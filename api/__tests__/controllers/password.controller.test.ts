import { Request, Response } from "express";
import * as passwordController from "../../controllers/password.controller";
import * as mailService from "../../services/mail.service";
import * as passwordService from "../../services/password.service";

jest.mock("../../services/mail.service");
jest.mock("../../services/password.service");

describe("password.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let status: jest.Mock;
  let sendStatus: jest.Mock;
  let sendError: jest.Mock;

  beforeEach(() => {
    status = jest.fn().mockReturnThis();
    sendStatus = jest.fn();
    sendError = jest.fn();
    req = { body: {} } as any;
    res = { status, sendStatus, sendError } as any;
    jest.clearAllMocks();
  });

  it("requests password reset token", async () => {
    req.body = { email: "user@test" };
    await passwordController.requestPasswordResetTokenController(req as Request, res as Response);

    expect(mailService.sendPasswordResetToken).toHaveBeenCalledWith("user@test");
    expect(sendStatus).toHaveBeenCalledWith(200);
  });

  it("returns 500 when email missing", async () => {
    req.body = {};
    await passwordController.requestPasswordResetTokenController(req as Request, res as Response);

    expect(sendStatus).toHaveBeenCalledWith(500);
  });

  it("resets password with token", async () => {
    req.body = { password: "new", token: "tok" };

    await passwordController.resetPasswordController(req as Request, res as Response);

    expect(passwordService.changePasswordWithToken).toHaveBeenCalledWith("new", "tok");
    expect(sendStatus).toHaveBeenCalledWith(200);
  });

  it("returns error via sendError on failure", async () => {
    req.body = { password: "new", token: "tok" };
    (passwordService.changePasswordWithToken as jest.Mock).mockRejectedValue(new Error("boom"));

    await passwordController.resetPasswordController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalled();
  });
});
