export const POINT_VALUES: Record<string, number> = {
  bagel: -1,
  early_bird: 1,
  night_owl: 1,
  qualified_appt: 1,
  sit: 2,
  close: 5,
}

export const EVENT_LABELS: Record<string, string> = {
  bagel: 'Bagel',
  early_bird: 'Early Bird',
  night_owl: 'Night Owl',
  qualified_appt: 'Qualified Appt',
  sit: 'Sit',
  close: 'Close',
}

export function getPoints(eventType: string): number {
  const val = POINT_VALUES[eventType]
  if (val === undefined) throw new Error(`Unknown event type: ${eventType}`)
  return val
}
