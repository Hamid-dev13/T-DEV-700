import { Request, Response } from "express";
import * as reportController from "../../controllers/report.controller";
import * as reportService from "../../services/report.service";
import * as teamService from "../../services/team.service";

jest.mock("../../services/report.service");
jest.mock("../../services/team.service");

describe("report.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let sendError: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnThis();
    sendError = jest.fn();
    req = { query: {}, user_id: "u1", admin: false } as any;
    res = { json, status, sendError } as any;
    jest.clearAllMocks();
  });

  it("validates required query params", async () => {
    await reportController.getReportsForUserController(req as Request, res as Response);
    expect(sendError).toHaveBeenCalled();
  });

  it("rejects invalid dates", async () => {
    req.query = { user: "u1", report: "lateness", from: "bad", to: "2024-01-02" };
    await reportController.getReportsForUserController(req as Request, res as Response);
    expect(sendError).toHaveBeenCalledWith('Invalid Date "from"', 400);
  });

  it("denies when not admin/manager of other user", async () => {
    req.user_id = "manager";
    req.admin = false;
    req.query = { user: "u2", report: "lateness", from: "2024-01-01", to: "2024-01-02" };
    (teamService.retrieveMainTeamForUser as jest.Mock).mockResolvedValue({ managerId: "someone-else" });

    await reportController.getReportsForUserController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalledWith("Insufficient permissions", 403);
  });

  it("returns reports for self", async () => {
    req.user_id = "u1";
    req.query = { user: "u1", report: "lateness", from: "2024-01-01", to: "2024-01-02" };
    (reportService.getReportForUser as jest.Mock).mockResolvedValue([1]);

    await reportController.getReportsForUserController(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([1]);
  });

  it("returns reports when manager of target user", async () => {
    req.user_id = "manager";
    req.admin = false;
    req.query = { user: "u2", report: "lateness", from: "2024-01-01", to: "2024-01-02" };
    (teamService.retrieveMainTeamForUser as jest.Mock).mockResolvedValue({ managerId: "manager" });
    (reportService.getReportForUser as jest.Mock).mockResolvedValue([2]);

    await reportController.getReportsForUserController(req as Request, res as Response);

    expect(json).toHaveBeenCalledWith([2]);
  });

  it("returns 404 when target user has no team", async () => {
    req.user_id = "manager";
    req.query = { user: "u2", report: "lateness", from: "2024-01-01", to: "2024-01-02" };
    (teamService.retrieveMainTeamForUser as jest.Mock).mockResolvedValue(null);

    await reportController.getReportsForUserController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalledWith("User is not in any team", 404);
  });
});
