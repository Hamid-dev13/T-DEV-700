import { reportTime, retrieveReportTimeSummary } from '../../services/clock.service';
import { db } from '../../db/client';
import * as dateUtils from '../../utils/date';

// Mock dependencies
jest.mock('../../db/client', () => ({
  db: {
    insert: jest.fn(),
    select: jest.fn(),
  },
}));

jest.mock('../../utils/date');

describe('Clock Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('reportTime', () => {
    it('should create a time log for user', async () => {
      const mockLog = {
        id: 'log-1',
        user_id: 'user-1',
        at: new Date('2024-01-15T10:00:00Z'),
      };

      (db.insert as jest.Mock).mockReturnValue({
        values: jest.fn().mockReturnValue({
          returning: jest.fn().mockResolvedValue([mockLog]),
        }),
      });

      const result = await reportTime('user-1');

      expect(result).toEqual(mockLog);
      expect(db.insert).toHaveBeenCalled();
    });
  });

  describe('retrieveReportTimeSummary', () => {
    it('should retrieve logs with date and days', async () => {
      const mockLogs = [
        { at: new Date('2024-01-10T10:00:00Z') },
        { at: new Date('2024-01-11T10:00:00Z') },
      ];

      const mockCondition = { mock: 'condition' };
      (dateUtils.getPeriodQueryCondition as jest.Mock).mockReturnValue(mockCondition);

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await retrieveReportTimeSummary('user-1', {
        date: new Date('2024-01-10T00:00:00Z'),
        days: 7,
      });

      expect(result).toEqual([
        new Date('2024-01-10T10:00:00Z'),
        new Date('2024-01-11T10:00:00Z'),
      ]);
      expect(dateUtils.getPeriodQueryCondition).toHaveBeenCalled();
    });

    it('should retrieve logs with only date', async () => {
      const mockLogs = [
        { at: new Date('2024-01-10T10:00:00Z') },
      ];

      const mockCondition = { mock: 'condition' };
      (dateUtils.getPeriodQueryCondition as jest.Mock).mockReturnValue(mockCondition);

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await retrieveReportTimeSummary('user-1', {
        date: new Date('2024-01-10T00:00:00Z'),
      });

      expect(result).toEqual([new Date('2024-01-10T10:00:00Z')]);
    });

    it('should retrieve logs with only days', async () => {
      const mockLogs = [
        { at: new Date('2024-01-10T10:00:00Z') },
      ];

      const mockCondition = { mock: 'condition' };
      (dateUtils.getPeriodQueryCondition as jest.Mock).mockReturnValue(mockCondition);

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await retrieveReportTimeSummary('user-1', {
        days: 7,
      });

      expect(result).toEqual([new Date('2024-01-10T10:00:00Z')]);
    });

    it('should retrieve all logs when no filters provided', async () => {
      const mockLogs = [
        { at: new Date('2024-01-10T10:00:00Z') },
        { at: new Date('2024-01-11T10:00:00Z') },
        { at: new Date('2024-01-12T10:00:00Z') },
      ];

      (dateUtils.getPeriodQueryCondition as jest.Mock).mockReturnValue(null);

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue(mockLogs),
          }),
        }),
      });

      const result = await retrieveReportTimeSummary('user-1', {});

      expect(result).toEqual([
        new Date('2024-01-10T10:00:00Z'),
        new Date('2024-01-11T10:00:00Z'),
        new Date('2024-01-12T10:00:00Z'),
      ]);
    });

    it('should return empty array when no logs found', async () => {
      (dateUtils.getPeriodQueryCondition as jest.Mock).mockReturnValue(null);

      (db.select as jest.Mock).mockReturnValue({
        from: jest.fn().mockReturnValue({
          where: jest.fn().mockReturnValue({
            orderBy: jest.fn().mockResolvedValue([]),
          }),
        }),
      });

      const result = await retrieveReportTimeSummary('user-1', {});

      expect(result).toEqual([]);
    });
  });
});
