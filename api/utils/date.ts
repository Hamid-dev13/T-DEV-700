import { and, gte, lte } from "drizzle-orm";
import { PgColumn } from "drizzle-orm/pg-core";

/**
 * set hours, minutes, seconds and milliseconds to 0, keep only the date component
 */
export function zeroOutTime(date: Date) {
  date.setHours(0); date.setMinutes(0); date.setSeconds(0); date.setMilliseconds(0);
}

/**
 * Builds a query condition for the timestamp column "col".
 * If both date and days are defined, the timestamp must be between date and date + days.
 * If only date is defined, the timestamp must be between date and now.
 * If only days are defined, the timestamp must be between now - days and now.
 * If none are defined, return null.
 */
// export function getPeriodQueryCondition(col: PgColumn, now: Date, date?: Date, days?: number) {
//   if (date && days) {
//     const offset = new Date(0);
//     offset.setDate(days+1);
//     const end = new Date(date.getTime() + offset.getTime());

//     return and(
//       gte(col, date),
//       lte(col, end)
//     );
//   } else if (date && !days) {
//     return and(
//       gte(col, date),
//       lte(col, now)
//     );
//   } else if (!date && days) {
//     const offset = new Date(0);
//     offset.setDate(days+1);
//     const start = new Date(now.getTime() - offset.getTime());

//     return and(
//       gte(col, start),
//       lte(col, now)
//     );
//   }

//   return null;
// }