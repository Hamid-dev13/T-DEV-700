import nodemailer from "nodemailer";
import * as passwordService from "../../services/password.service";

jest.mock("nodemailer", () => ({
  createTransport: jest.fn(),
}));

jest.mock("../../services/password.service", () => ({
  generatePasswordResetToken: jest.fn(),
}));

describe("mail.service", () => {
  const mockSendMail = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SMTP_HOST = "localhost";
    process.env.SMTP_PORT = "587";
    process.env.SMTP_USE_SSL = "false";
    process.env.SMTP_USERNAME = "user";
    process.env.SMTP_PASSWORD = "pass";
    process.env.SMTP_FROM = "noreply@test";
    process.env.WEBSITE_URL = "https://example.com";

    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: mockSendMail,
    });
  });

  it("sends a basic mail", async () => {
    mockSendMail.mockImplementation((_opts, cb) => cb(null, "ok"));

    const mailService = await import("../../services/mail.service");

    await mailService.sendMail("to@test", "Subject", "Body");

    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const callArgs = mockSendMail.mock.calls[0][0];
    expect(callArgs.from).toBe("noreply@test");
    expect(callArgs.to).toBe("to@test");
  });

  it("sends password reset token email", async () => {
    mockSendMail.mockImplementation((_opts, cb) => cb(null, "ok"));
    (passwordService.generatePasswordResetToken as jest.Mock).mockResolvedValue("token-123");

    const mailService = await import("../../services/mail.service");

    await mailService.sendPasswordResetToken("user@test");

    expect(passwordService.generatePasswordResetToken).toHaveBeenCalledWith("user@test");
    expect(mockSendMail).toHaveBeenCalledTimes(1);
    const { text } = mockSendMail.mock.calls[0][0];
    expect(text).toContain("token-123");
  });
});
