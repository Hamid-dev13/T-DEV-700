import { toZonedTime, fromZonedTime, formatInTimeZone } from 'date-fns-tz';

/**
 * Convertit une date UTC en date locale pour un timezone donné
 * @param date - Date en UTC
 * @param timezone - Timezone IANA (ex: 'Europe/Paris')
 * @returns Date convertie dans le timezone local
 */
export function convertToLocalTime(date: Date, timezone: string = 'Europe/Paris'): Date {
  return toZonedTime(date, timezone);
}

/**
 * Convertit une date locale en UTC
 * @param date - Date locale
 * @param timezone - Timezone IANA (ex: 'Europe/Paris')
 * @returns Date en UTC
 */
export function convertToUTC(date: Date, timezone: string = 'Europe/Paris'): Date {
  return fromZonedTime(date, timezone);
}

/**
 * Formate une date UTC en string ISO avec le timezone
 * @param date - Date en UTC
 * @param timezone - Timezone IANA (ex: 'Europe/Paris')
 * @returns String au format ISO avec timezone (ex: "2025-10-13T15:41:00+02:00")
 */
export function formatWithTimezone(date: Date, timezone: string = 'Europe/Paris'): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX");
}

/**
 * Extrait l'heure décimale d'une date dans un timezone donné
 * @param date - Date en UTC
 * @param timezone - Timezone IANA
 * @returns Heure en décimal (ex: 15.5 pour 15h30)
 */
export function getLocalHour(date: Date, timezone: string = 'Europe/Paris'): number {
  const localDate = toZonedTime(date, timezone);
  return localDate.getHours() + localDate.getMinutes() / 60;
}