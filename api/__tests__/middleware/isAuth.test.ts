import { Request, Response, NextFunction } from 'express';
import { isAuth } from '../../middleware/isAuth';
import jwt from 'jsonwebtoken';
import * as cookieUtils from '../../utils/cookies';
import { except } from 'drizzle-orm/mysql-core';

jest.mock('jsonwebtoken');
jest.mock('../../utils/cookies');

describe('isAuth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendErrorMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    sendErrorMock = jest.fn();
    mockNext = jest.fn();

    mockRequest = {
      headers: {},
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      sendError: sendErrorMock,
    };

    jest.clearAllMocks();
  });

  describe('Token from Authorization header', () => {
    it('should authenticate with valid bearer token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      const mockPayload = {
        user_id: 'user-1',
        admin: false,
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockPayload);
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user_id).toBe('user-1');
      expect(mockRequest.admin).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should return 401 for invalid token', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid-token',
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(new Error('Invalid token'), null);
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendErrorMock).toHaveBeenCalledWith("Invalid Token", 401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should handle token with admin user', async () => {
      mockRequest.headers = {
        authorization: 'Bearer admin-token',
      };

      const mockPayload = {
        user_id: 'admin-1',
        admin: true,
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockPayload);
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.user_id).toBe('admin-1');
      expect(mockRequest.admin).toBe(true);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Token from cookies', () => {
    it('should authenticate with token from cookie', async () => {
      mockRequest.headers = {
        cookie: 'token=cookie-token; session=abc',
      };

      (cookieUtils.getCookie as jest.Mock).mockReturnValue('cookie-token');

      const mockPayload = {
        user_id: 'user-2',
        admin: false,
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        callback(null, mockPayload);
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(cookieUtils.getCookie).toHaveBeenCalledWith('token=cookie-token; session=abc', cookieUtils.COOKIE_ACCESS_TOKEN_KEY);
      expect(mockRequest.user_id).toBe('user-2');
      expect(mockRequest.admin).toBe(false);
      expect(mockNext).toHaveBeenCalled();
    });

    it('should prioritize Authorization header over cookie', async () => {
      mockRequest.headers = {
        authorization: 'Bearer header-token',
        cookie: 'token=cookie-token',
      };

      const mockPayload = {
        user_id: 'user-from-header',
        admin: false,
      };

      (jwt.verify as jest.Mock).mockImplementation((token, secret, callback) => {
        if (token === 'header-token') {
          callback(null, mockPayload);
        }
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(cookieUtils.getCookie).not.toHaveBeenCalled();
      expect(mockRequest.user_id).toBe('user-from-header');
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('Missing or invalid token', () => {
    it('should return 401 when no token provided', async () => {
      mockRequest.headers = {};

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendErrorMock).toHaveBeenCalledWith("Invalid Token", 401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when authorization header does not start with Bearer', async () => {
      mockRequest.headers = {
        authorization: 'Basic some-credentials',
      };

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendErrorMock).toHaveBeenCalledWith("Invalid Token", 401);
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should return 401 when cookie token is null', async () => {
      mockRequest.headers = {
        cookie: 'session=abc',
      };

      (cookieUtils.getCookie as jest.Mock).mockReturnValue(null);

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendErrorMock).toHaveBeenCalledWith("Invalid Token", 401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 401 on unexpected error', async () => {
      mockRequest.headers = {
        authorization: 'Bearer valid-token',
      };

      (jwt.verify as jest.Mock).mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      await isAuth(mockRequest as Request, mockResponse as Response, mockNext);

      expect(sendErrorMock).toHaveBeenCalledWith(expect.any(Object), 401);
      expect(mockNext).not.toHaveBeenCalled();
    });
  });
});
