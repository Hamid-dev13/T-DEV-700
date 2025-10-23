import { and, eq, gte, lt } from "drizzle-orm";
import { db } from "../db/client";
import { clocks } from "../models/clock.model";
import { getLocalHour } from "../utils/timezone";
import { retrieveMainTeamForUser } from "./team.service";

/**
 * Calcule le retard pour un jour donné
 * @param user_id - ID de l'utilisateur
 * @param date - Date du jour (ex: new Date("2025-10-13"))
 * @returns Retard en minutes (positif = retard, négatif = avance)
 */
export async function calculateDelay(user_id: string, date: Date): Promise<number | null> {
  // 1. Récupérer l'heure de début de l'équipe
  const userTeam = await retrieveMainTeamForUser(user_id);

  if (!userTeam) {
    throw new Error("L'employé n'appartient à aucune équipe");
  }

  // 2. Récupérer le premier pointage du jour (stocké en UTC)
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);

  const [firstClock] = await db
    .select({
      at: clocks.at,
    })
    .from(clocks)
    .where(
      and(
        eq(clocks.user_id, user_id),
        gte(clocks.at, startOfDay),
        lt(clocks.at, endOfDay)
      )
    )
    .orderBy(clocks.at)
    .limit(1);

  // 3. Si pas de pointage ce jour-là
  if (!firstClock) {
    return null;
  }

  // 4. Calculer le retard avec date-fns-tz
  const arrivalHour = getLocalHour(firstClock.at);
  const expectedHour = userTeam.startHour;
  
  const delayInHours = arrivalHour - expectedHour;
  const delayInMinutes = Math.round(delayInHours * 60);

  return delayInMinutes;
}