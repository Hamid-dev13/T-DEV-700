import { Request, Response } from 'express';
import {
  retrieveTeamController,
  retrieveTeamsController,
  addTeamController,
  updateTeamController,
  deleteTeamController,
  retrieveTeamUsersController,
  addTeamUserController,
  removeTeamUserController,
} from '../../controllers/team.controller';
import * as teamService from '../../services/team.service';

jest.mock('../../services/team.service');

describe('Team Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendStatusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    sendStatusMock = jest.fn();

    mockRequest = {
      body: {},
      params: {},
      user_id: undefined,
      admin: undefined,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      sendStatus: sendStatusMock,
    };

    jest.clearAllMocks();
  });

  describe('retrieveTeamController', () => {
    it('should retrieve team by id', async () => {
      const mockTeam = { id: 'team-1', name: 'Engineering' };
      mockRequest.params = { id: 'team-1' };

      (teamService.retrieveTeam as jest.Mock).mockResolvedValue(mockTeam);

      await retrieveTeamController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'team-1' };

      (teamService.retrieveTeam as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveTeamController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('retrieveTeamsController', () => {
    it('should retrieve all teams', async () => {
      const mockTeams = [
        { id: 'team-1', name: 'Engineering' },
        { id: 'team-2', name: 'Marketing' },
      ];

      (teamService.retrieveTeams as jest.Mock).mockResolvedValue(mockTeams);

      await retrieveTeamsController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTeams);
    });

    it('should return 500 on error', async () => {
      (teamService.retrieveTeams as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveTeamsController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('addTeamController', () => {
    it('should add team successfully', async () => {
      const mockTeam = { id: 'team-1', name: 'Engineering' };
      mockRequest.body = {
        name: 'Engineering',
        description: 'Engineering team',
        start_hour: 9,
        end_hour: 17,
        manager: 'manager-1',
      };

      (teamService.addTeam as jest.Mock).mockResolvedValue(mockTeam);

      await addTeamController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
    });

    it('should return 400 when required fields are missing', async () => {
      mockRequest.body = { name: 'Engineering' };

      await addTeamController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    it('should return 400 when start_hour > end_hour', async () => {
      mockRequest.body = {
        name: 'Engineering',
        description: 'Engineering team',
        start_hour: 17,
        end_hour: 9,
      };

      await addTeamController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(400);
    });

    it('should return 500 on error', async () => {
      mockRequest.body = {
        name: 'Engineering',
        description: 'Engineering team',
        start_hour: 9,
        end_hour: 17,
        manager: 'manager-1',
      };

      (teamService.addTeam as jest.Mock).mockRejectedValue(new Error('Error'));

      await addTeamController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('updateTeamController', () => {
    it('should update team when user is admin', async () => {
      const mockTeam = { id: 'team-1', name: 'Updated Team' };
      mockRequest.params = { id: 'team-1' };
      mockRequest.user_id = 'user-1';
      mockRequest.admin = true;
      mockRequest.body = { name: 'Updated Team' };

      (teamService.updateTeam as jest.Mock).mockResolvedValue(mockTeam);

      await updateTeamController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
    });

    it('should update team when user is manager', async () => {
      const mockTeam = { id: 'team-1', name: 'Updated Team' };
      mockRequest.params = { id: 'team-1' };
      mockRequest.user_id = 'user-1';
      mockRequest.admin = false;
      mockRequest.body = { name: 'Updated Team' };

      (teamService.isTeamManager as jest.Mock).mockResolvedValue(true);
      (teamService.updateTeam as jest.Mock).mockResolvedValue(mockTeam);

      await updateTeamController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockTeam);
    });

    it('should return 401 when user is not admin or manager', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.user_id = 'user-1';
      mockRequest.admin = false;
      mockRequest.body = { name: 'Updated Team' };

      (teamService.isTeamManager as jest.Mock).mockResolvedValue(false);

      await updateTeamController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.user_id = 'user-1';
      mockRequest.admin = true;
      mockRequest.body = { name: 'Updated Team' };

      (teamService.updateTeam as jest.Mock).mockRejectedValue(new Error('Error'));

      await updateTeamController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteTeamController', () => {
    it('should delete team successfully', async () => {
      mockRequest.params = { id: 'team-1' };

      (teamService.deleteTeam as jest.Mock).mockResolvedValue(true);

      await deleteTeamController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(200);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'team-1' };

      (teamService.deleteTeam as jest.Mock).mockRejectedValue(new Error('Error'));

      await deleteTeamController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('retrieveTeamUsersController', () => {
    it('should retrieve team users', async () => {
      const mockUsers = {
        manager: { id: 'manager-1' },
        members: [{ id: 'user-1' }, { id: 'user-2' }],
      };
      mockRequest.params = { id: 'team-1' };

      (teamService.retrieveTeamUsers as jest.Mock).mockResolvedValue(mockUsers);

      await retrieveTeamUsersController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUsers);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'team-1' };

      (teamService.retrieveTeamUsers as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveTeamUsersController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('addTeamUserController', () => {
    it('should add user to team successfully', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.body = { user: 'user-1' };

      (teamService.addTeamUser as jest.Mock).mockResolvedValue(undefined);

      await addTeamUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(200);
    });

    it('should return 400 when user field is missing', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.body = {};

      await addTeamUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing required field "user"' });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.body = { user: 'user-1' };

      (teamService.addTeamUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await addTeamUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('removeTeamUserController', () => {
    it('should remove user from team successfully', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.body = { user: 'user-1' };

      (teamService.removeTeamUser as jest.Mock).mockResolvedValue(true);

      await removeTeamUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(200);
    });

    it('should return 400 when user field is missing', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.body = {};

      await removeTeamUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(400);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Missing required field "user"' });
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'team-1' };
      mockRequest.body = { user: 'user-1' };

      (teamService.removeTeamUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await removeTeamUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });
});
