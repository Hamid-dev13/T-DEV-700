import {
  convertToLocalTime,
  convertToUTC,
  formatWithTimezone,
  getLocalHour,
} from "../../utils/timezone";

const PARIS = "Europe/Paris";
const NEW_YORK = "America/New_York";

describe("timezone utils", () => {
  describe("convertToLocalTime", () => {
    it("converts UTC to local time in Paris", () => {
      const utcDate = new Date("2025-07-01T12:00:00.000Z");
      const local = convertToLocalTime(utcDate, PARIS);

      expect(local.getFullYear()).toBe(2025);
      expect(local.getMonth()).toBe(6); // July
      expect(local.getDate()).toBe(1);
      expect(local.getHours()).toBe(14); // UTC+2 in July
      expect(local.getMinutes()).toBe(0);
    });

    it("converts UTC to local time in New York", () => {
      const utcDate = new Date("2025-07-01T12:00:00.000Z");
      const local = convertToLocalTime(utcDate, NEW_YORK);

      expect(local.getHours()).toBe(8); // UTC-4 in July
    });
  });

  describe("convertToUTC", () => {
    it("converts Paris local time back to UTC (round-trip test)", () => {
      // Start with a known UTC time
      const originalUTC = new Date("2025-07-01T12:00:00.000Z");
      // Convert to Paris local time (should be 14:00 in July, UTC+2)
      const parisLocal = convertToLocalTime(originalUTC, PARIS);
      // Convert back to UTC
      const backToUTC = convertToUTC(parisLocal, PARIS);

      expect(backToUTC.toISOString()).toBe("2025-07-01T12:00:00.000Z");
    });

    it("converts New York local time back to UTC (round-trip test)", () => {
      // Start with a known UTC time
      const originalUTC = new Date("2025-07-01T12:00:00.000Z");
      // Convert to New York local time (should be 08:00 in July, UTC-4)
      const nyLocal = convertToLocalTime(originalUTC, NEW_YORK);
      // Convert back to UTC
      const backToUTC = convertToUTC(nyLocal, NEW_YORK);

      expect(backToUTC.toISOString()).toBe("2025-07-01T12:00:00.000Z");
    });
  });

  describe("formatWithTimezone", () => {
    it("formats ISO string with timezone offset", () => {
      const utcDate = new Date("2025-07-01T12:34:56.789Z");
      const formatted = formatWithTimezone(utcDate, PARIS);

      expect(formatted).toBe("2025-07-01T14:34:56.789+02:00");
    });
  });

  describe("getLocalHour", () => {
    it("returns decimal hour for the specified timezone", () => {
      const utcDate = new Date("2025-07-01T12:30:00.000Z");
      const hour = getLocalHour(utcDate, PARIS);

      expect(hour).toBeCloseTo(14.5, 3);
    });

    it("handles another timezone", () => {
      const utcDate = new Date("2025-07-01T12:30:00.000Z");
      const hour = getLocalHour(utcDate, NEW_YORK);

      expect(hour).toBeCloseTo(8.5, 3);
    });
  });
});
