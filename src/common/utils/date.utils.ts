/** Day name mapping for Date.getDay() */
const DAY_NAMES = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const;

/**
 * Calculates the due date by adding working days to a start date.
 * Skips weekends and holidays defined in the library's schedule.
 *
 * @param startDate - The rental issue date
 * @param days - Number of working days to add
 * @param schedule - Library schedule (weekends + holidays)
 * @returns The calculated due date
 */
export function addWorkingDays(
  startDate: Date,
  days: number,
  schedule: LibrarySchedule | null,
): Date {
  const result = new Date(startDate);
  let remaining = days;

  const weekends = schedule?.weekends ?? [];
  const holidays = new Set(schedule?.holidays ?? []);

  while (remaining > 0) {
    result.setDate(result.getDate() + 1);

    const dayName = DAY_NAMES[result.getDay()];
    const dateStr = result.toISOString().split('T')[0];

    // Skip weekends and holidays
    if (weekends.includes(dayName) || holidays.has(dateStr)) {
      continue;
    }

    remaining--;
  }

  // If the final date lands on a weekend/holiday, advance to next working day
  let dayName = DAY_NAMES[result.getDay()];
  let dateStr = result.toISOString().split('T')[0];
  while (weekends.includes(dayName) || holidays.has(dateStr)) {
    result.setDate(result.getDate() + 1);
    dayName = DAY_NAMES[result.getDay()];
    dateStr = result.toISOString().split('T')[0];
  }

  return result;
}

/**
 * Calculates the number of days between two dates.
 */
export function daysBetween(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.floor((date2.getTime() - date1.getTime()) / msPerDay);
}
