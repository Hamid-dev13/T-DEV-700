import * as teamService from "../../services/team.service";
import { db } from "../../db/client";

jest.mock("../../db/client", () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    transaction: jest.fn(),
  },
}));

describe("team.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("checkWorkHours", () => {
    it("returns true for valid ranges", () => {
      expect(teamService.checkWorkHours(9, 17)).toBe(true);
      expect(teamService.checkWorkHours(0, 23)).toBe(true);
    });

    it("rejects invalid ranges", () => {
      expect(teamService.checkWorkHours(9, 9)).toBe(false);
      expect(teamService.checkWorkHours(18, 9)).toBe(false);
      expect(teamService.checkWorkHours(-1, 10)).toBe(false);
      expect(teamService.checkWorkHours(9, 24)).toBe(false);
    });
  });

  describe("isTeamManager", () => {
    it("returns true when user manages the team", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: "team-1" }]),
          }),
        }),
      });

      const result = await teamService.isTeamManager("u1", "team-1");
      expect(result).toBe(true);
    });

    it("returns false otherwise", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await teamService.isTeamManager("u1", "team-1");
      expect(result).toBe(false);
    });
  });

  describe("retrieveTeam / retrieveTeams", () => {
    it("returns a team by id", async () => {
      const mockTeam = { id: "team-1", name: "Eng", description: "Dev", startHour: 9, endHour: 17, managerId: "m1" };
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTeam]),
          }),
        }),
      });

      const result = await teamService.retrieveTeam("team-1");
      expect(result).toEqual(mockTeam);
    });

    it("returns all teams", async () => {
      const mockTeams = [{ id: "t1" }, { id: "t2" }];
      (db.select as jest.Mock).mockReturnValue({ from: jest.fn().mockResolvedValue(mockTeams) });

      const result = await teamService.retrieveTeams();
      expect(result).toEqual(mockTeams);
    });
  });

  describe("addTeam", () => {
    it("creates a team and links manager", async () => {
      const input = { name: "Eng", description: "Dev", start_hour: 9, end_hour: 17, manager_id: "m1" };
      const created = { id: "team-1", name: "Eng", description: "Dev", startHour: 9, endHour: 17, managerId: "m1" };

      const txInsert = jest.fn().mockReturnValue({
        values: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([created]) }),
      });
      const tx = { insert: txInsert } as any;
      (db.transaction as jest.Mock).mockImplementation(async (cb) => cb(tx));

      const result = await teamService.addTeam(input);

      expect(result).toEqual(created);
      expect(txInsert).toHaveBeenCalled();
    });

    it("throws for missing required fields", async () => {
      await expect(teamService.addTeam({ name: "", description: "", start_hour: 9, end_hour: 17, manager_id: "m1" }))
        .rejects.toThrow("Missing required fields: name, description, start_hour, end_hour, manager_id");
    });

    it("throws for invalid hours", async () => {
      await expect(teamService.addTeam({ name: "Eng", description: "Dev", start_hour: 18, end_hour: 9, manager_id: "m1" }))
        .rejects.toThrow("Invalid Work Hour Range");
    });
  });

  describe("updateTeam", () => {
    it("updates fields when data is valid", async () => {
      const updated = { id: "team-1", name: "New", description: "New desc", startHour: 10, endHour: 18 };
      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([updated]) }),
        }),
      });

      const result = await teamService.updateTeam("team-1", { name: "New", description: "New desc", start_hour: 10, end_hour: 18 });
      expect(result).toEqual(updated);
    });

    it("rejects when only start_hour is provided", async () => {
      await expect(teamService.updateTeam("team-1", { start_hour: 9 }))
        .rejects.toThrow("Invalid Work Hour Range");
    });

    it("rejects when only end_hour is provided", async () => {
      await expect(teamService.updateTeam("team-1", { end_hour: 17 }))
        .rejects.toThrow("Invalid Work Hour Range");
    });

    it("rejects invalid hour ranges", async () => {
      await expect(teamService.updateTeam("team-1", { start_hour: 18, end_hour: 9 }))
        .rejects.toThrow("Invalid Work Hour Range");
    });
  });

  describe("deleteTeam", () => {
    it("returns true after deletion", async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ id: "team-1" }]) }),
      });

      await expect(teamService.deleteTeam("team-1")).resolves.toBe(true);
    });
  });

  describe("retrieveTeamUsers", () => {
    it("returns manager and members", async () => {
      const manager = { id: "m1", firstName: "M", lastName: "One", email: "m@x", password: "p", admin: false, phone: null, refreshToken: null, createdAt: new Date(), updatedAt: new Date() };
      const memberUser = { id: "u1", firstName: "U", lastName: "One", email: "u@x", password: "p", admin: false, phone: null, refreshToken: null, createdAt: new Date(), updatedAt: new Date() };

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({ where: jest.fn().mockResolvedValue([{ manager }]) }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue(Promise.resolve([{ users: memberUser }])),
            }),
          }),
        });

      const result = await teamService.retrieveTeamUsers("team-1");

      expect(result.manager.id).toBe("m1");
      expect(result.members).toHaveLength(1);
      expect(result.members[0].id).toBe("u1");
    });
  });

  describe("addTeamMember", () => {
    it("adds a member when user has no main team", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });
      (db.insert as jest.Mock).mockReturnValue({ values: jest.fn().mockResolvedValue({}) });

      const result = await teamService.addTeamMember("team-1", "user-1");

      expect(result).toBeDefined();
      expect(db.insert).toHaveBeenCalled();
    });

    it("throws when user already has a team", async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ team: { id: "team-x" } }]),
          }),
        }),
      });
      await expect(teamService.addTeamMember("team-1", "user-1")).rejects.toThrow("User is already a member of a team !");
    });
  });

  describe("removeTeamMember", () => {
    it("deletes membership and returns true", async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({ returning: jest.fn().mockResolvedValue([{ user_id: "user-1" }]) }),
      });

      await expect(teamService.removeTeamMember("team-1", "user-1")).resolves.toBe(true);
    });
  });

  describe("retreiveTeamsForUserWithManager", () => {
    it("aggregates teams with manager and members", async () => {
      const rows = [
        {
          team: { id: "t1", name: "Eng", description: "Dev", startHour: 9, endHour: 17, managerId: "m1" },
          manager: { id: "m1", firstName: "M", lastName: "One", email: "m@x", password: "p", admin: false, phone: null, refreshToken: null, createdAt: new Date(), updatedAt: new Date() },
          member: { id: "u1", firstName: "U", lastName: "One", email: "u@x", password: "p", admin: false, phone: null, refreshToken: null, createdAt: new Date(), updatedAt: new Date() },
        },
        {
          team: { id: "t1", name: "Eng", description: "Dev", startHour: 9, endHour: 17, managerId: "m1" },
          manager: { id: "m1", firstName: "M", lastName: "One", email: "m@x", password: "p", admin: false, phone: null, refreshToken: null, createdAt: new Date(), updatedAt: new Date() },
          member: { id: "u2", firstName: "V", lastName: "Two", email: "v@x", password: "p", admin: false, phone: null, refreshToken: null, createdAt: new Date(), updatedAt: new Date() },
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              innerJoin: jest.fn().mockReturnValue({
                where: jest.fn().mockReturnValue({
                  execute: jest.fn().mockResolvedValue(rows),
                })
              }),
            }),
          }),
          where: jest.fn().mockReturnValue(null),
        }),
      });

      const result = await teamService.retreiveTeamsForUserWithManager("u1");

      expect(result).toHaveLength(1);
      expect(result[0].team.id).toBe("t1");
      expect(result[0].members.map((m) => m.id)).toEqual(["u1", "u2"]);
      expect(result[0].manager.id).toBe("m1");
    });
  });
});
