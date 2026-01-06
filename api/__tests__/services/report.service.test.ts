import * as reportService from "../../services/report.service";
import { db } from "../../db/client";
import { getClocksForUserFiltered } from "../../services/clock.service";
import { getLocalHour } from "../../utils/timezone";

jest.mock("../../db/client", () => ({
  db: {
    select: jest.fn(),
  },
}));

jest.mock("../../services/clock.service", () => ({
  getClocksForUserFiltered: jest.fn(),
}));

jest.mock("../../utils/timezone", () => ({
  getLocalHour: jest.fn(),
}));

describe("report.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const mockTeam = { startHour: 9, endHour: 17 };

  function setupTeamSelect() {
    (db.select as jest.Mock).mockReturnValue({
      from: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTeam]),
          }),
        }),
      }),
    });
  }

  it("throws for invalid report type", async () => {
    setupTeamSelect();
    (getClocksForUserFiltered as jest.Mock).mockResolvedValue([]);

    await expect(reportService.getReportForUser("u1", "invalid", new Date(), new Date()))
      .rejects.toThrow(/Invalid report type/);
  });

  it("computes lateness in minutes", async () => {
    setupTeamSelect();
    const day = new Date("2024-01-02T10:00:00Z");
    (getClocksForUserFiltered as jest.Mock).mockResolvedValue([day]);
    (getLocalHour as jest.Mock).mockImplementation((d: Date) => d.getUTCHours());

    const result = await reportService.getReportForUser("u1", "lateness", new Date("2024-01-01"), new Date("2024-01-03"));

    expect(result).toEqual([{ day: "2024-01-02", lateness: 60 }]);
  });

  it("computes earlyness in minutes", async () => {
    setupTeamSelect();
    const day = new Date("2024-01-02T07:00:00Z");
    (getClocksForUserFiltered as jest.Mock).mockResolvedValue([day]);
    (getLocalHour as jest.Mock).mockImplementation((d: Date) => d.getUTCHours());

    const result = await reportService.getReportForUser("u1", "earlyness", new Date("2024-01-01"), new Date("2024-01-03"));

    expect(result).toEqual([{ day: "2024-01-02", earlyness: 120 }]);
  });

  it("computes pause times", async () => {
    setupTeamSelect();
    const entries = [
      new Date("2024-01-02T09:00:00Z"),
      new Date("2024-01-02T10:00:00Z"),
      new Date("2024-01-02T12:00:00Z"),
      new Date("2024-01-02T13:00:00Z"),
    ];
    (getClocksForUserFiltered as jest.Mock).mockResolvedValue(entries);
    (getLocalHour as jest.Mock).mockImplementation((d: Date) => d.getUTCHours());

    const result = await reportService.getReportForUser("u1", "pause_times", new Date("2024-01-01"), new Date("2024-01-03"));

    expect(result).toEqual([{ day: "2024-01-02", pause: 120 }]);
  });

  it("computes presence", async () => {
    setupTeamSelect();
    const entries = [
      new Date("2024-01-02T09:00:00Z"),
      new Date("2024-01-02T11:00:00Z"),
    ];
    (getClocksForUserFiltered as jest.Mock).mockResolvedValue(entries);
    (getLocalHour as jest.Mock).mockImplementation((d: Date) => d.getUTCHours());

    const result = await reportService.getReportForUser("u1", "presence", new Date("2024-01-01"), new Date("2024-01-03"));

    expect(result).toEqual([{ day: "2024-01-02", time: 120 }]);
  });
});
