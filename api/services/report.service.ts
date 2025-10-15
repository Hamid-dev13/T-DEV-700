
export enum ReportType {
  LATENESS = "lateness"
}

export async function getReportsForUser(user_id: string, team_id: string, report: ReportType, from: Date, to: Date): Promise<any> {
  return {
    user_id,
    team_id,
    report,
    from,
    to
  }
}