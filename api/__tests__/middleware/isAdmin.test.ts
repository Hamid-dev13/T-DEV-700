import { Request, Response, NextFunction } from 'express';
import { isAdmin } from '../../middleware/isAdmin';

describe('isAdmin Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendStatusMock: jest.Mock;
  let sendErrorMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    sendStatusMock = jest.fn();
    mockNext = jest.fn();
    sendErrorMock = jest.fn();

    mockRequest = {
      admin: undefined,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      sendStatus: sendStatusMock,
      sendError: sendErrorMock,
    };

    jest.clearAllMocks();
  });

  describe('Authorization checks', () => {
    it('should allow access when user is admin', async () => {
      mockRequest.admin = true;

      await isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(statusMock).not.toHaveBeenCalled();
      expect(jsonMock).not.toHaveBeenCalled();
    });

    it('should deny access when user is not admin', async () => {
      mockRequest.admin = false;

      await isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when admin is undefined', async () => {
      mockRequest.admin = undefined;

      await isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('should deny access when admin is null', async () => {
      mockRequest.admin = null as any;

      await isAdmin(mockRequest as Request, mockResponse as Response, mockNext);

      expect(statusMock).toHaveBeenCalledWith(403);
      expect(jsonMock).toHaveBeenCalledWith({ error: 'Insufficient permissions' });
      expect(mockNext).not.toHaveBeenCalled();
    });
  });

  describe('Error handling', () => {
    it('should return 500 on unexpected error', async () => {
      // Force an error by making mockNext throw
      const errorNext = jest.fn(() => {
        throw new Error('Unexpected error');
      }) as unknown as NextFunction;

      mockRequest.admin = true;

      await isAdmin(mockRequest as Request, mockResponse as Response, errorNext);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });
});
