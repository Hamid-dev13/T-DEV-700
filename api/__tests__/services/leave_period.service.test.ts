import {
  retrieveLeavePeriods,
  addLeavePeriod,
  updateLeavePeriod,
  deleteLeavePeriod,
  deleteLeavePeriodOfMyUser,
} from "../../services/leave_period.service";
import { db } from "../../db/client";

jest.mock("../../db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("leave_period.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("retrieves leave periods for a user", async () => {
    const periods = [{ id: "lp1" }, { id: "lp2" }];
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue(periods) }),
    });

    const result = await retrieveLeavePeriods("user-1");
    expect(result).toEqual(periods);
  });

  it("adds a leave period", async () => {
    const created = { id: "lp1", user_id: "u1" };
    (db.insert as jest.Mock).mockReturnValue({
      values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([created]) }),
    });

    const result = await addLeavePeriod("u1", new Date(), new Date(), true);
    expect(result).toEqual(created);
  });

  it("updates a leave period", async () => {
    const updated = { id: "lp1", accepted: true };
    (db.update as jest.Mock).mockReturnValue({
      set: jest.fn().mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([updated]) }),
      }),
    });

    const result = await updateLeavePeriod("lp1", { accepted: true });
    expect(result).toEqual(updated);
  });

  it("deletes a leave period and returns true when removed", async () => {
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: "lp1" }]) }),
    });

    await expect(deleteLeavePeriod("lp1")).resolves.toBe(true);
  });

  it("deleteLeavePeriod returns false when nothing removed", async () => {
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
    });

    await expect(deleteLeavePeriod("lp-missing")).resolves.toBe(false);
  });

  it("deletes a leave period of current user when not accepted", async () => {
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: "lp1" }]) }),
    });

    await expect(deleteLeavePeriodOfMyUser("u1", "lp1")).resolves.toBe(true);
  });

  it("returns false when user leave is not removed", async () => {
    (db.delete as jest.Mock).mockReturnValue({
      where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([]) }),
    });

    await expect(deleteLeavePeriodOfMyUser("u1", "lp-missing")).resolves.toBe(false);
  });
});
