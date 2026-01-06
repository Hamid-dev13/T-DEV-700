import { Request, Response } from 'express';
import {
  loginUserController,
  refreshTokenController,
  logoutUserController,
  retrieveMyUserController,
  retrieveOtherUserController,
  retrieveUsersController,
  addUserController,
  updateMyUserController,
  updateOtherUserController,
  deleteMyUserController,
  deleteOtherUserController,
} from '../../controllers/user.controller';
import * as userService from '../../services/user.service';
import * as cookies from '../../utils/cookies';
import { COOKIE_ACCESS_TOKEN_KEY, COOKIE_REFRESH_TOKEN_KEY } from '../../utils/cookies';
import { refreshToken } from '../../models/user.model';

jest.mock('../../services/user.service');

describe('User Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let cookieMock: jest.Mock;
  let clearCookieMock: jest.Mock;
  let sendStatusMock: jest.Mock;
  let sendErrorMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    cookieMock = jest.fn().mockReturnThis();
    clearCookieMock = jest.fn().mockReturnThis();
    sendStatusMock = jest.fn();
    sendErrorMock = jest.fn();

    mockRequest = {
      body: {},
      params: {},
      user_id: undefined,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      cookie: cookieMock,
      clearCookie: clearCookieMock,
      sendStatus: sendStatusMock,
      sendError: sendErrorMock,
    };

    jest.clearAllMocks();
  });

  describe('loginUserController', () => {
    it('should login user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockAccessToken = 'jwt-access-token';
      const mockRefreshToken = 'jwt-refresh-token';

      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      (userService.loginUser as jest.Mock).mockResolvedValue({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: mockUser,
      });

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenNthCalledWith(1, COOKIE_ACCESS_TOKEN_KEY, mockAccessToken, expect.any(Object));
      expect(cookieMock).toHaveBeenNthCalledWith(2, COOKIE_REFRESH_TOKEN_KEY, mockRefreshToken, expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = { password: 'password123' };

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Missing required fields", 400);
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Missing required fields", 400);
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrong' };

      (userService.loginUser as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 500 for server errors', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password' };

      (userService.loginUser as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('refreshTokenController', () => {
    it('should refresh the user\'s token successfully', async () => {
      const mockRefreshToken = 'jwt-refresh-token';
      const mockNewAccessToken = 'jwt-new-access-token';
      const mockUser = { id: 'user-1', email: 'test@example.com', refreshToken: mockRefreshToken };

      mockRequest.headers = {cookie: `${COOKIE_REFRESH_TOKEN_KEY}=${mockRefreshToken}`};
      mockRequest.user_id = 'user-1';

      (userService.retrieveUser as jest.Mock).mockResolvedValue(mockUser);
      (userService.generateAccessToken as jest.Mock).mockReturnValue(mockNewAccessToken);

      await refreshTokenController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenCalledWith(COOKIE_ACCESS_TOKEN_KEY, mockNewAccessToken, expect.any(Object));
    });

    it('should return 401 when refresh token is invalid', async () => {
      const mockRefreshToken = 'jwt-refresh-token';
      const mockInvalidRefreshToken = 'jwt-invalid-refresh-token';
      const mockUser = { id: 'user-1', email: 'test@example.com', refreshToken: mockRefreshToken };

      mockRequest.headers = {cookie: `${COOKIE_REFRESH_TOKEN_KEY}=${mockInvalidRefreshToken}`};
      mockRequest.user_id = 'user-1';

      (userService.retrieveUser as jest.Mock).mockResolvedValue(mockUser);
      (userService.generateAccessToken as jest.Mock).mockReturnValue(null);

      await refreshTokenController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Invalid refresh token", 401);
    });

    it('should return 401 when refresh token is missing from user', async () => {
      const mockRefreshToken = 'jwt-refresh-token';
      const mockUser = { id: 'user-1', email: 'test@example.com', refreshToken: null };

      mockRequest.headers = {cookie: `${COOKIE_REFRESH_TOKEN_KEY}=${mockRefreshToken}`};
      mockRequest.user_id = 'user-1';

      (userService.retrieveUser as jest.Mock).mockResolvedValue(mockUser);
      (userService.generateAccessToken as jest.Mock).mockReturnValue(null);

      await refreshTokenController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Refresh token not found", 401);
    });

    it('should return 500 for server errors', async () => {
      mockRequest.headers = {};

      (userService.generateAccessToken as jest.Mock).mockReturnValue(null);
      (userService.retrieveUser as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await refreshTokenController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith(expect.any(Object));
    });
  });

  describe('logoutUserController', () => {
    it('should clear the user\'s token successfully', async () => {
      mockRequest.user_id = 'user-1';

      (userService.clearRefreshTokenForUser as jest.Mock).mockImplementation(() => Promise.resolve());

      await logoutUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(200);
      expect(clearCookieMock).toHaveBeenNthCalledWith(1, COOKIE_ACCESS_TOKEN_KEY);
      expect(clearCookieMock).toHaveBeenNthCalledWith(2, COOKIE_REFRESH_TOKEN_KEY);
    });

    it('should return 200 even if user not found', async () => {
      mockRequest.user_id = 'user-1';

      (userService.clearRefreshTokenForUser as jest.Mock).mockImplementation(() => Promise.reject());

      await logoutUserController(mockRequest as Request, mockResponse as Response);

      expect(clearCookieMock).toHaveBeenNthCalledWith(1, COOKIE_ACCESS_TOKEN_KEY);
      expect(clearCookieMock).toHaveBeenNthCalledWith(2, COOKIE_REFRESH_TOKEN_KEY);
    });

    it('should return 500 if user id is undefined', async () => {
      (userService.clearRefreshTokenForUser as jest.Mock).mockImplementation(() => Promise.reject());

      await logoutUserController(mockRequest as Request, mockResponse as Response);

      expect(clearCookieMock).not.toHaveBeenCalled();
    });
  });

  describe('loginUserController', () => {
    it('should login user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      const mockAccessToken = 'jwt-access-token';
      const mockRefreshToken = 'jwt-refresh-token';

      mockRequest.body = { email: 'test@example.com', password: 'password123' };

      (userService.loginUser as jest.Mock).mockResolvedValue({
        accessToken: mockAccessToken,
        refreshToken: mockRefreshToken,
        user: mockUser,
      });

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(cookieMock).toHaveBeenNthCalledWith(1, COOKIE_ACCESS_TOKEN_KEY, mockAccessToken, expect.any(Object));
      expect(cookieMock).toHaveBeenNthCalledWith(2, COOKIE_REFRESH_TOKEN_KEY, mockRefreshToken, expect.any(Object));
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 when email is missing', async () => {
      mockRequest.body = { password: 'password123' };

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Missing required fields", 400);
    });

    it('should return 400 when password is missing', async () => {
      mockRequest.body = { email: 'test@example.com' };

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Missing required fields", 400);
    });

    it('should return 401 for invalid credentials', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'wrong' };

      (userService.loginUser as jest.Mock).mockRejectedValue(
        new Error('Invalid credentials')
      );

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(401);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid credentials' });
    });

    it('should return 500 for server errors', async () => {
      mockRequest.body = { email: 'test@example.com', password: 'password' };

      (userService.loginUser as jest.Mock).mockRejectedValue(
        new Error('Database error')
      );

      await loginUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(500);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('retrieveMyUserController', () => {
    it('should retrieve current user', async () => {
      const mockUser = { id: 'user-1', email: 'test@example.com' };
      mockRequest.user_id = 'user-1';

      (userService.retrieveUserSafe as jest.Mock).mockResolvedValue(mockUser);

      await retrieveMyUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on error', async () => {
      mockRequest.user_id = 'user-1';

      (userService.retrieveUserSafe as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveMyUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('retrieveOtherUserController', () => {
    it('should retrieve other user by id', async () => {
      const mockUser = { id: 'user-2', email: 'other@example.com' };
      mockRequest.params = { id: 'user-2' };

      (userService.retrieveUserSafe as jest.Mock).mockResolvedValue(mockUser);

      await retrieveOtherUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'user-2' };

      (userService.retrieveUserSafe as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveOtherUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('retrieveUsersController', () => {
    it('should retrieve all users', async () => {
      const mockUsers = [
        { id: 'user-1', email: 'user1@example.com' },
        { id: 'user-2', email: 'user2@example.com' },
      ];

      (userService.retrieveUsersSafe as jest.Mock).mockResolvedValue(mockUsers);

      await retrieveUsersController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUsers);
    });

    it('should return 500 on error', async () => {
      (userService.retrieveUsersSafe as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveUsersController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('addUserController', () => {
    it('should add user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'new@example.com' };
      mockRequest.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'new@example.com',
        password: 'password123',
      };

      (userService.addUser as jest.Mock).mockResolvedValue(mockUser);

      await addUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 400 when required fields are missing', async () => {
      mockRequest.body = { first_name: 'John' };

      await addUserController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Missing required fields", 400);
    });

    it('should return 500 on error', async () => {
      mockRequest.body = {
        first_name: 'John',
        last_name: 'Doe',
        email: 'new@example.com',
        password: 'password123',
      };

      (userService.addUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await addUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('updateMyUserController', () => {
    it('should update user successfully', async () => {
      const mockUser = { id: 'user-1', email: 'updated@example.com' };
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = { email: 'updated@example.com' };

      (userService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      await updateMyUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.body = { email: 'updated@example.com' };

      (userService.updateUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await updateMyUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('updateOtherUserController', () => {
    it('should update other user successfully', async () => {
      const mockUser = { id: 'user-2', email: 'updated@example.com' };
      mockRequest.params = { id: 'user-2' };
      mockRequest.body = { email: 'updated@example.com' };

      (userService.updateUser as jest.Mock).mockResolvedValue(mockUser);

      await updateOtherUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockUser);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'user-2' };
      mockRequest.body = { email: 'updated@example.com' };

      (userService.updateUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await updateOtherUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteMyUserController', () => {
    it('should delete current user successfully', async () => {
      mockRequest.user_id = 'user-1';

      (userService.deleteUser as jest.Mock).mockResolvedValue(true);

      await deleteMyUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(true);
    });

    it('should return 500 on error', async () => {
      mockRequest.user_id = 'user-1';

      (userService.deleteUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await deleteMyUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('deleteOtherUserController', () => {
    it('should delete other user successfully', async () => {
      mockRequest.params = { id: 'user-2' };

      (userService.deleteUser as jest.Mock).mockResolvedValue(true);

      await deleteOtherUserController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(true);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'user-2' };

      (userService.deleteUser as jest.Mock).mockRejectedValue(new Error('Error'));

      await deleteOtherUserController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });
});
