import {
  addClock,
  updateClock,
  removeClock,
  getClocksForUser,
  getClocksForUserFiltered,
  getDaysOffForUser,
} from "../../services/clock.service";
import { db } from "../../db/client";

jest.mock("../../db/client", () => ({
  db: {
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    select: jest.fn(),
  },
}));

describe("clock.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("addClock", () => {
    it("inserts a clock and returns the created row", async () => {
      const mockClock = { id: "1", user_id: "u1", at: new Date("2024-01-15T10:00:00Z") };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockClock]),
        }),
      });

      const result = await addClock("u1", mockClock.at);

      expect(result).toEqual(mockClock);
      expect(db.insert).toHaveBeenCalledTimes(1);
    });
  });

  describe("updateClock", () => {
    it("updates both arrival and departure clocks", async () => {
      const oldFrom = new Date("2024-01-15T10:00:00Z");
      const oldTo = new Date("2024-01-15T18:00:00Z");
      const newFrom = new Date("2024-01-15T09:00:00Z");
      const newTo = new Date("2024-01-15T17:00:00Z");

      const updatedFrom = { id: "1", user_id: "u1", at: newFrom };
      const updatedTo = { id: "2", user_id: "u1", at: newTo };

      // mock the 2 db.update() calls
      (db.update as jest.Mock)
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([updatedFrom]),
            }),
          }),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([updatedTo]),
            }),
          }),
        });

      const result = await updateClock("u1", oldFrom, oldTo, newFrom, newTo);

      expect(result).toEqual([updatedFrom, updatedTo]);
      expect(db.update).toHaveBeenCalledTimes(2);
    });

    it("filters out undefined values when only one clock is updated", async () => {
      const oldFrom = new Date("2024-01-15T10:00:00Z");
      const oldTo = new Date("2024-01-15T18:00:00Z");
      const newFrom = new Date("2024-01-15T09:00:00Z");
      const newTo = new Date("2024-01-15T17:00:00Z");

      const updatedFrom = { id: "1", user_id: "u1", at: newFrom };

      // mock the 2 db.update() calls
      (db.update as jest.Mock)
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([updatedFrom]),
            }),
          }),
        })
        .mockReturnValueOnce({
          set: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue({
              returning: jest.fn().mockResolvedValue([]),
            }),
          }),
        });

      const result = await updateClock("u1", oldFrom, oldTo, newFrom, newTo);

      expect(result).toEqual([updatedFrom]);
      expect(db.update).toHaveBeenCalledTimes(2);
    });
  });

  describe("removeClock", () => {
    it("removes a clock near the provided timestamp", async () => {
      const at = new Date("2024-01-15T10:00:00Z");
      const removed = [{ id: "1", user_id: "u1", at }];

      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue(removed),
        }),
      });

      const result = await removeClock("u1", at);

      expect(result).toEqual(removed);
      expect(db.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe("getClocksForUser", () => {
    it("returns clocks ordered by date", async () => {
      const rows = [
        { at: new Date("2024-01-10T10:00:00Z") },
        { at: new Date("2024-01-11T10:00:00Z") },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(rows),
          }),
        }),
      });

      const result = await getClocksForUser("u1", {
        from: new Date("2024-01-10T00:00:00Z"),
        to: new Date("2024-01-11T00:00:00Z"),
      });

      expect(result).toEqual(rows.map((r) => r.at));
    });
  });

  describe("getClocksForUserFiltered", () => {
    it("returns clocks excluding leave periods and holidays", async () => {
      const rows = [
        { at: new Date("2024-01-10T10:00:00Z") },
        { at: new Date("2024-01-11T10:00:00Z") },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(rows),
          }),
        }),
      });

      const result = await getClocksForUserFiltered("u1", {
        from: new Date("2024-01-10T00:00:00Z"),
        to: new Date("2024-01-11T00:00:00Z"),
      });

      expect(result).toEqual(rows.map((r) => r.at));
    });
  });

  describe("getDaysOffForUser", () => {
    it("returns merged holidays and leave days without duplicates", async () => {
      const from = new Date("2024-05-01T00:00:00Z");
      const to = new Date("2024-05-03T00:00:00Z");

      // First select call -> holidays
      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockReturnValue(Promise.resolve([
              { date: "2024-05-01" },
            ])),
          }),
        })
        // Second select call -> leave periods
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue([
              { startDate: new Date("2024-05-02T00:00:00Z"), endDate: new Date("2024-05-04T00:00:00Z") },
            ]),
          }),
        });

      const result = await getDaysOffForUser("u1", { from, to });

      expect(result).toEqual(["2024-05-01", "2024-05-02", "2024-05-03"]);
    });
  });
});
