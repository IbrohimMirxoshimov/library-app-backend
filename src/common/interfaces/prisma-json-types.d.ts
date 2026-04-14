/** Library working schedule — stored as JSON in Library.schedule */
interface LibrarySchedule {
  /** Day names that are weekends: ["friday", "sunday"] */
  weekends: string[];
  /** ISO date strings that are holidays: ["2026-01-01", "2026-03-21"] */
  holidays: string[];
}

declare namespace PrismaJson {
  type LibrarySchedule = globalThis.LibrarySchedule;
}
