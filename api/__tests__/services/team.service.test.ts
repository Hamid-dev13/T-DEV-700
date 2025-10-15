import {
  checkWorkHours,
  isTeamManager,
  retrieveTeam,
  retrieveTeams,
  addTeam,
  updateTeam,
  deleteTeam,
  retrieveTeamUsers,
  addTeamUser,
  removeTeamUser,
  retreiveTeamsForUser,
  retreiveTeamsForUserWithManager,
} from '../../services/team.service';
import { db } from '../../db/client';

// Mock dependencies
jest.mock('../../db/client', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('Team Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('checkWorkHours', () => {
    it('should return true for valid work hours', () => {
      expect(checkWorkHours(9, 17)).toBe(true);
      expect(checkWorkHours(0, 23)).toBe(true);
      expect(checkWorkHours(8, 16)).toBe(true);
    });

    it('should return false when start equals end', () => {
      expect(checkWorkHours(9, 9)).toBe(false);
    });

    it('should return false when start is greater than end', () => {
      expect(checkWorkHours(17, 9)).toBe(false);
    });

    it('should return false when start is negative', () => {
      expect(checkWorkHours(-1, 9)).toBe(false);
    });

    it('should return false when end is >= 24', () => {
      expect(checkWorkHours(9, 24)).toBe(false);
      expect(checkWorkHours(9, 25)).toBe(false);
    });

    it('should return true for edge case 0 to 23', () => {
      expect(checkWorkHours(0, 23)).toBe(true);
    });
  });

  describe('isTeamManager', () => {
    it('should return true when user is manager of team', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([{ id: 'team-1' }]),
          }),
        }),
      });

      const result = await isTeamManager('user-1', 'team-1');

      expect(result).toBe(true);
    });

    it('should return false when user is not manager of team', async () => {
      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await isTeamManager('user-1', 'team-1');

      expect(result).toBe(false);
    });
  });

  describe('retrieveTeam', () => {
    it('should retrieve team by id', async () => {
      const mockTeam = {
        id: 'team-1',
        name: 'Engineering',
        description: 'Engineering team',
      };

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            limit: jest.fn().mockResolvedValue([mockTeam]),
          }),
        }),
      });

      const result = await retrieveTeam('team-1');

      expect(result).toEqual(mockTeam);
    });
  });

  describe('retrieveTeams', () => {
    it('should retrieve all teams', async () => {
      const mockTeams = [
        { id: 'team-1', name: 'Engineering' },
        { id: 'team-2', name: 'Marketing' },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockResolvedValue(mockTeams),
      });

      const result = await retrieveTeams();

      expect(result).toEqual(mockTeams);
    });
  });

  describe('addTeam', () => {
    it('should successfully add a new team', async () => {
      const newTeam = {
        name: 'Engineering',
        description: 'Engineering team',
        start_hour: 9,
        end_hour: 17,
        manager_id: 'manager-1',
      };

      const mockCreatedTeam = {
        id: 'team-1',
        ...newTeam,
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockCreatedTeam]),
        }),
      });

      const result = await addTeam(newTeam);

      expect(result).toEqual(mockCreatedTeam);
    });

    it('should throw error when required fields are missing', async () => {
      await expect(
        addTeam({
          name: '',
          description: 'Test',
          start_hour: 9,
          end_hour: 17,
          manager_id: 'manager-1',
        })
      ).rejects.toThrow('Missing required fields: name, description, start_hour, end_hour, manager_id');
    });

    it('should throw error for invalid work hours', async () => {
      await expect(
        addTeam({
          name: 'Team',
          description: 'Test',
          start_hour: 17,
          end_hour: 9,
          manager_id: 'manager-1',
        })
      ).rejects.toThrow('Invalid Work Hour Range');
    });
  });

  describe('updateTeam', () => {
    it('should update team successfully', async () => {
      const updateData = {
        name: 'Updated Team',
        description: 'Updated description',
      };

      const mockUpdatedTeam = {
        id: 'team-1',
        ...updateData,
      };

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedTeam]),
          }),
        }),
      });

      const result = await updateTeam('team-1', updateData);

      expect(result).toEqual(mockUpdatedTeam);
    });

    it('should throw error when only start_hour is provided', async () => {
      await expect(
        updateTeam('team-1', { start_hour: 9 })
      ).rejects.toThrow('Invalid Work Hour Range');
    });

    it('should throw error when only end_hour is provided', async () => {
      await expect(
        updateTeam('team-1', { end_hour: 17 })
      ).rejects.toThrow('Invalid Work Hour Range');
    });

    it('should throw error for invalid work hour range', async () => {
      await expect(
        updateTeam('team-1', { start_hour: 17, end_hour: 9 })
      ).rejects.toThrow('Invalid Work Hour Range');
    });

    it('should update successfully with valid work hours', async () => {
      const mockUpdatedTeam = {
        id: 'team-1',
        startHour: 8,
        endHour: 16,
      };

      (db.update as jest.Mock).mockReturnValue({
        set: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            returning: jest.fn().mockResolvedValue([mockUpdatedTeam]),
          }),
        }),
      });

      const result = await updateTeam('team-1', { start_hour: 8, end_hour: 16 });

      expect(result).toEqual(mockUpdatedTeam);
    });
  });

  describe('deleteTeam', () => {
    it('should delete team and return true', async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ id: 'team-1' }]),
        }),
      });

      const result = await deleteTeam('team-1');

      expect(result).toBe(true);
    });
  });

  describe('retrieveTeamUsers', () => {
    it('should retrieve team manager and members', async () => {
      const mockManager = {
        id: 'manager-1',
        email: 'manager@example.com',
      };

      const mockMembers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      (db.select as jest.Mock)
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue([{ manager: mockManager }]),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockReturnValue({
                then: jest.fn((callback) =>
                  Promise.resolve(
                    callback(mockMembers.map((user) => ({ users: user })))
                  )
                ),
              }),
            }),
          }),
        });

      const result = await retrieveTeamUsers('team-1');

      expect(result.manager).toEqual(mockManager);
      expect(result.members).toEqual(mockMembers);
    });
  });

  describe('addTeamUser', () => {
    it('should add user to team', async () => {
      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockResolvedValue(undefined),
      });

      await expect(addTeamUser('team-1', 'user-1')).resolves.toBeUndefined();
    });
  });

  describe('removeTeamUser', () => {
    it('should remove user from team and return true', async () => {
      (db.delete as jest.Mock).mockReturnValue({
        where: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([{ user_id: 'user-1' }]),
        }),
      });

      const result = await removeTeamUser('team-1', 'user-1');

      expect(result).toBe(true);
    });
  });

  describe('retreiveTeamsForUser', () => {
    it('should retrieve all teams for a user', async () => {
      const mockTeams = [
        { team: { id: 'team-1', name: 'Engineering' } },
        { team: { id: 'team-2', name: 'Marketing' } },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            where: jest.fn().mockResolvedValue(mockTeams),
          }),
        }),
      });

      const result = await retreiveTeamsForUser('user-1');

      expect(result).toEqual([
        { id: 'team-1', name: 'Engineering' },
        { id: 'team-2', name: 'Marketing' },
      ]);
    });
  });

  describe('retreiveTeamsForUserWithManager', () => {
    it('should retrieve teams with manager info for a user', async () => {
      const mockData = [
        {
          team: { id: 'team-1', name: 'Engineering' },
          manager: { id: 'manager-1', email: 'manager@example.com' },
        },
      ];

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          innerJoin: jest.fn().mockReturnValue({
            innerJoin: jest.fn().mockReturnValue({
              where: jest.fn().mockResolvedValue(mockData),
            }),
          }),
        }),
      });

      const result = await retreiveTeamsForUserWithManager('user-1');

      expect(result).toEqual(mockData);
    });
  });
});
