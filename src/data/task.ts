import type { Role } from '../types/experiment.ts'

export const roleLabels: Record<Role, string> = {
  traveler: 'Caller · Thompson',
  employee: 'Receiver · British Rail travel service',
}

export interface GapField {
  id: string
  label: string
  kind: 'text' | 'time' | 'number' | 'select' | 'discussion'
  options?: string[]
}

export const task = {
  id: 'p805-scenario-1',
  version: 1,
  title: 'Scenario 1: British Rail Travel Information',
  route: "London King's Cross → Inverness",
  source: 'Adapted from ITU-T P.805 (04/2007), Appendix V, pp. 57–58.',
  names: { traveler: 'Thompson', employee: 'British Rail travel service' },
  travelerConditions: ['Date: July 20th', 'Night train connection, sleeper', 'Through train if possible'],
  reservation: ['One berth in a sleeping-car', 'First class', 'Non-smoker'],
  question: 'What time does the buffet car start serving breakfast?',
  // Columns follow the source worksheet; an em dash indicates no change at York.
  timetable: [
    { label: 'Train number', values: ['IC 1127', 'IC 829', 'IC 1511'] },
    { label: "London King's Cross · Dep.", values: ['19:18 h', '20:50 h', '22:09 h'] },
    { label: 'York · Arr.', values: ['—', '21:49 h', '—'] },
    { label: 'Connecting train number', values: ['—', 'EN 225', '—'] },
    { label: 'York · Dep.', values: ['—', '22:44 h', '—'] },
    { label: 'Inverness · Arr. (next day)', values: ['04:39 h', '06:30 h', '07:16 h'] },
    { label: 'Sleeper', values: ['Only 2nd class', 'Only 2nd class', '1st and 2nd class'] },
  ],
}

export const gapFields: Record<Role, GapField[]> = {
  traveler: [
    { id: 'departureTime', label: 'Departure time', kind: 'time' },
    { id: 'arrivalTime', label: 'Arrival time (next day)', kind: 'time' },
    { id: 'trainNumber', label: 'Train number', kind: 'text' },
    { id: 'discussion', label: 'Agreed answer to the additional question', kind: 'discussion' },
  ],
  employee: [
    { id: 'reservationName', label: 'Name', kind: 'text' },
    { id: 'berthCount', label: 'Number of berths', kind: 'number' },
    { id: 'travelClass', label: 'Class', kind: 'select', options: ['First class', 'Second class'] },
    { id: 'smokingPreference', label: 'Smoking preference', kind: 'select', options: ['Smoker', 'Non-smoker'] },
    { id: 'discussion', label: 'Agreed answer to the caller’s additional question', kind: 'discussion' },
  ],
}
