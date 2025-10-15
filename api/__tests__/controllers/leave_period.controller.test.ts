import { Request, Response } from "express";
import * as leaveController from "../../controllers/leave_period.controller";
import * as leaveService from "../../services/leave_period.service";
import * as teamService from "../../services/team.service";

jest.mock("../../services/leave_period.service");
jest.mock("../../services/team.service");

describe("leave_period.controller", () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let json: jest.Mock;
  let status: jest.Mock;
  let sendError: jest.Mock;
  let sendStatus: jest.Mock;

  beforeEach(() => {
    json = jest.fn();
    status = jest.fn().mockReturnThis();
    sendError = jest.fn();
    sendStatus = jest.fn();

    req = { body: {}, params: {}, user_id: undefined, admin: false };
    res = { json, status, sendError, sendStatus } as any;

    jest.clearAllMocks();
  });

  it("retrieves leave periods for current user", async () => {
    req.user_id = "u1";
    (leaveService.retrieveLeavePeriods as jest.Mock).mockResolvedValue([1, 2]);

    await leaveController.retrieveLeavePeriodsForMyUserController(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith([1, 2]);
  });

  it("adds leave period for current user with validation", async () => {
    req.user_id = "u1";
    req.body = { start_date: "2024-01-01", end_date: "2024-01-03" };
    (leaveService.retrieveLeavePeriods as jest.Mock).mockResolvedValue([]);
    const created = { id: "lp1" };
    (leaveService.addLeavePeriod as jest.Mock).mockResolvedValue(created);

    await leaveController.addLeavePeriodForMyUserController(req as Request, res as Response);

    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith(created);
  });

  it("rejects overlapping leave period", async () => {
    req.user_id = "u1";
    req.body = { start_date: "2024-01-02", end_date: "2024-01-04" };
    (leaveService.retrieveLeavePeriods as jest.Mock).mockResolvedValue([
      { startDate: new Date("2024-01-01"), endDate: new Date("2024-01-03") },
    ]);

    await leaveController.addLeavePeriodForMyUserController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalledWith("Specified dates overlap with an existing leave period", 400);
  });

  it("rejects invalid date input", async () => {
    req.user_id = "u1";
    req.body = { start_date: "bad", end_date: "2024-01-03" };

    await leaveController.addLeavePeriodForMyUserController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalledWith('Invalid Date "start_date"', 400);
  });

  it("adds leave period for another user when manager", async () => {
    req.user_id = "manager";
    req.admin = false;
    req.params = { id: "u2" } as any;
    req.body = { start_date: "2024-01-01", end_date: "2024-01-02", accepted: true };
    (teamService.isManagerOfUser as jest.Mock).mockResolvedValue(true);
    const created = { id: "lp2" };
    (leaveService.addLeavePeriod as jest.Mock).mockResolvedValue(created);

    await leaveController.addLeavePeriodForUserController(req as Request, res as Response);

    expect(json).toHaveBeenCalledWith(created);
  });

  it("denies add when not manager or admin", async () => {
    req.user_id = "sender";
    req.params = { id: "u2" } as any;
    req.body = { start_date: "2024-01-01", end_date: "2024-01-02" };
    (teamService.isManagerOfUser as jest.Mock).mockResolvedValue(false);

    await leaveController.addLeavePeriodForUserController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalledWith("Insufficient permissions", 401);
  });

  it("updates leave period as admin with dates", async () => {
    req.user_id = "admin";
    req.admin = true;
    req.params = { user_id: "u1", leave_id: "lp1" } as any;
    req.body = { start_date: "2024-01-01", end_date: "2024-01-02", accepted: true };
    (teamService.isManagerOfUser as jest.Mock).mockResolvedValue(true);
    const updated = { id: "lp1", accepted: true };
    (leaveService.updateLeavePeriod as jest.Mock).mockResolvedValue(updated);

    await leaveController.updateLeavePeriodForUserController(req as Request, res as Response);

    expect(json).toHaveBeenCalledWith(updated);
  });

  it("updates leave period as manager without dates", async () => {
    req.user_id = "manager";
    req.admin = false;
    req.params = { user_id: "u1", leave_id: "lp1" } as any;
    req.body = { accepted: false };
    (teamService.isManagerOfUser as jest.Mock).mockResolvedValue(true);
    const updated = { id: "lp1", accepted: false };
    (leaveService.updateLeavePeriod as jest.Mock).mockResolvedValue(updated);

    await leaveController.updateLeavePeriodForUserController(req as Request, res as Response);

    expect(json).toHaveBeenCalledWith(updated);
  });

  it("denies update when not manager or admin", async () => {
    req.user_id = "sender";
    req.admin = false;
    req.params = { user_id: "u1", leave_id: "lp1" } as any;
    req.body = { accepted: true };
    (teamService.isManagerOfUser as jest.Mock).mockResolvedValue(false);

    await leaveController.updateLeavePeriodForUserController(req as Request, res as Response);

    expect(sendError).toHaveBeenCalledWith("Insufficient permissions", 401);
  });

  it("deletes leave period of current user", async () => {
    req.user_id = "u1";
    req.params = { id: "lp1" } as any;
    (leaveService.deleteLeavePeriodOfMyUser as jest.Mock).mockResolvedValue(true);

    await leaveController.deleteLeavePeriodForMyUserController(req as Request, res as Response);

    expect(json).toHaveBeenCalledWith({ result: true });
  });

  it("deletes leave period for another user when manager", async () => {
    req.user_id = "manager";
    req.admin = false;
    req.params = { user_id: "u1", leave_id: "lp1" } as any;
    (teamService.isManagerOfUser as jest.Mock).mockResolvedValue(true);
    (leaveService.deleteLeavePeriod as jest.Mock).mockResolvedValue(true);

    await leaveController.deleteLeavePeriodForUserController(req as Request, res as Response);

    expect(json).toHaveBeenCalledWith({ result: true });
  });
});
