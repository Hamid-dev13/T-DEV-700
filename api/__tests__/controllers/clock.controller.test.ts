import { Request, Response } from 'express';
import {
  reportTimeController,
  retrieveReportTimeSummaryController,
} from '../../controllers/clock.controller';
import * as clockService from '../../services/clock.service';

jest.mock('../../services/clock.service');

describe('Clock Controller', () => {
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
      user_id: undefined,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      sendStatus: sendStatusMock,
    };

    jest.clearAllMocks();
  });

  describe('reportTimeController', () => {
    it('should report time successfully', async () => {
      const mockLog = {
        id: 'log-1',
        user_id: 'user-1',
        at: new Date('2024-01-15T10:00:00Z'),
      };

      mockRequest.user_id = 'user-1';

      (clockService.reportTime as jest.Mock).mockResolvedValue(mockLog);

      await reportTimeController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockLog);
    });

    it('should return 500 on error', async () => {
      mockRequest.user_id = 'user-1';

      (clockService.reportTime as jest.Mock).mockRejectedValue(new Error('Error'));

      await reportTimeController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });

  describe('retrieveReportTimeSummaryController', () => {
    it('should retrieve report time summary successfully', async () => {
      const mockResults = [
        new Date('2024-01-10T10:00:00Z'),
        new Date('2024-01-11T10:00:00Z'),
      ];

      mockRequest.user_id = 'user-1';
      mockRequest.body = {};

      (clockService.retrieveReportTimeSummary as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResults);
    });

    it('should handle date parameter', async () => {
      const mockResults = [new Date('2024-01-10T10:00:00Z')];

      mockRequest.user_id = 'user-1';
      mockRequest.body = {
        date: '2024-01-10T00:00:00Z',
        days: 7,
      };

      (clockService.retrieveReportTimeSummary as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResults);
    });

    it('should normalize date to midnight', async () => {
      const mockResults = [new Date('2024-01-10T10:00:00Z')];

      mockRequest.user_id = 'user-1';
      mockRequest.body = {
        date: '2024-01-10T15:30:45.123Z',
      };

      (clockService.retrieveReportTimeSummary as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(clockService.retrieveReportTimeSummary).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({
          date: expect.any(Date),
        })
      );

      const callArgs = (clockService.retrieveReportTimeSummary as jest.Mock).mock.calls[0];
      const normalizedDate = callArgs[1].date;

      expect(normalizedDate.getHours()).toBe(0);
      expect(normalizedDate.getMinutes()).toBe(0);
      expect(normalizedDate.getSeconds()).toBe(0);
      expect(normalizedDate.getMilliseconds()).toBe(0);
    });

    it('should handle days parameter only', async () => {
      const mockResults = [new Date('2024-01-10T10:00:00Z')];

      mockRequest.user_id = 'user-1';
      mockRequest.body = {
        days: 7,
      };

      (clockService.retrieveReportTimeSummary as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResults);
    });

    it('should handle empty body', async () => {
      const mockResults = [new Date('2024-01-10T10:00:00Z')];

      mockRequest.user_id = 'user-1';
      mockRequest.body = {};

      (clockService.retrieveReportTimeSummary as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockResults);
    });

    it('should return 500 on error', async () => {
      mockRequest.user_id = 'user-1';
      mockRequest.body = {};

      (clockService.retrieveReportTimeSummary as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });
});
