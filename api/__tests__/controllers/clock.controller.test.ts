import { Request, Response } from 'express';
import {
  reportTimeController,
  retrieveReportTimeSummaryController,
} from '../../controllers/clock.controller';
import * as clockService from '../../services/clock.service';
import { formatWithTimezone } from '../../utils/timezone';

jest.mock('../../services/clock.service');

describe('Clock Controller', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;
  let sendStatusMock: jest.Mock;
  let sendErrorMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnThis();
    sendStatusMock = jest.fn();
    sendErrorMock = jest.fn();

    mockRequest = {
      body: {},
      user_id: undefined,
    };

    mockResponse = {
      json: jsonMock,
      status: statusMock,
      sendStatus: sendStatusMock,
      sendError: sendErrorMock,
    };

    jest.clearAllMocks();
  });

  describe('reportTimeController', () => {
    it('should report time successfully', async () => {
      const mockAt = new Date('2024-01-15T10:00:00Z');
      const mockLog = {
        id: 'log-1',
        user_id: 'user-1',
        at: mockAt,
      };
      const mockLogFormatted = {
        ...mockLog,
        at: formatWithTimezone(mockAt)
      }

      mockRequest.user_id = 'user-1';

      (clockService.addClock as jest.Mock).mockResolvedValue(mockLog);

      await reportTimeController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalledWith(mockLogFormatted);
    });

    it('should return 500 on error', async () => {
      mockRequest.user_id = 'user-1';

      (clockService.addClock as jest.Mock).mockRejectedValue(new Error('Error'));

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

      mockRequest.params = { id: 'user-1' };
      mockRequest.query = { from: '2024-01-10T00:00:00Z', to: '2024-01-11T00:00:00Z'};

      (clockService.getClocksForUserFiltered as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
    });

    it('should return error when from is missing', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.query = { to: '2024-01-10T00:00:00Z' };

      const sendErrorMock = jest.fn();
      mockResponse.sendError = sendErrorMock;

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith("Missing required fields 'from', 'to'", 400);
    });

    it('should return error when date is invalid', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.query = { from: 'invalid-date', to: '2024-01-10' };

      const sendErrorMock = jest.fn();
      mockResponse.sendError = sendErrorMock;

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(sendErrorMock).toHaveBeenCalledWith('Invalid Date "from"', 400);
    });

    it('should normalize dates to midnight', async () => {
      const mockResults = [new Date('2024-01-10T10:00:00Z')];

      mockRequest.params = { id: 'user-1' };
      mockRequest.query = { from: '2024-01-10T15:30:45.123Z', to: '2024-01-11T20:00:00Z' };

      (clockService.getClocksForUserFiltered as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      const callArgs = (clockService.getClocksForUserFiltered as jest.Mock).mock.calls[0];
      const fromDate = callArgs[1].from;
      const toDate = callArgs[1].to;

      expect(fromDate.getHours()).toBe(0);
      expect(fromDate.getMinutes()).toBe(0);
      expect(toDate.getHours()).toBe(0);
      expect(toDate.getMinutes()).toBe(0);
    });

    it('should format results with timezone', async () => {
      const mockResults = [
        new Date('2024-01-10T10:00:00Z'),
        new Date('2024-01-11T15:00:00Z'),
      ];

      mockRequest.params = { id: 'user-1' };
      mockRequest.query = { from: '2024-01-10', to: '2024-01-12' };

      (clockService.getClocksForUserFiltered as jest.Mock).mockResolvedValue(mockResults);

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(statusMock).toHaveBeenCalledWith(200);
      expect(jsonMock).toHaveBeenCalled();
      const result = jsonMock.mock.calls[0][0];
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
    });

    it('should return 500 on error', async () => {
      mockRequest.params = { id: 'user-1' };
      mockRequest.query = { from: '2024-01-10', to: '2024-01-12' };

      (clockService.getClocksForUserFiltered as jest.Mock).mockRejectedValue(new Error('Error'));

      await retrieveReportTimeSummaryController(mockRequest as Request, mockResponse as Response);

      expect(sendStatusMock).toHaveBeenCalledWith(500);
    });
  });
});
