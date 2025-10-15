import { getPeriodQueryCondition } from '../../utils/date';
import { pgTable, timestamp, text } from 'drizzle-orm/pg-core';

// Create a mock table for testing
const testTable = pgTable('test', {
  id: text('id'),
  at: timestamp('at'),
});

describe('Date Utils', () => {
  describe('getPeriodQueryCondition', () => {
    const now = new Date('2024-01-15T12:00:00Z');
    const col = testTable.at;

    it('should return condition for both date and days', () => {
      const date = new Date('2024-01-10T00:00:00Z');
      const days = 5;

      const condition = getPeriodQueryCondition(col, now, date, days);

      expect(condition).toBeDefined();
      expect(condition).not.toBeNull();
    });

    it('should return condition for only date (between date and now)', () => {
      const date = new Date('2024-01-10T00:00:00Z');

      const condition = getPeriodQueryCondition(col, now, date, undefined);

      expect(condition).toBeDefined();
      expect(condition).not.toBeNull();
    });

    it('should return condition for only days (between now - days and now)', () => {
      const days = 7;

      const condition = getPeriodQueryCondition(col, now, undefined, days);

      expect(condition).toBeDefined();
      expect(condition).not.toBeNull();
    });

    it('should return null when neither date nor days provided', () => {
      const condition = getPeriodQueryCondition(col, now, undefined, undefined);

      expect(condition).toBeNull();
    });

    it('should handle date with days = 0', () => {
      const date = new Date('2024-01-10T00:00:00Z');
      const days = 0;

      const condition = getPeriodQueryCondition(col, now, date, days);

      expect(condition).toBeDefined();
      expect(condition).not.toBeNull();
    });

    it('should handle large number of days', () => {
      const days = 365;

      const condition = getPeriodQueryCondition(col, now, undefined, days);

      expect(condition).toBeDefined();
      expect(condition).not.toBeNull();
    });

    it('should handle date in the past with days', () => {
      const date = new Date('2023-12-01T00:00:00Z');
      const days = 30;

      const condition = getPeriodQueryCondition(col, now, date, days);

      expect(condition).toBeDefined();
      expect(condition).not.toBeNull();
    });
  });
});
