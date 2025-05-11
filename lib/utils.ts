import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

// Re-export date utility functions
export { formatDate, formatDateLegacy, formatDateForInput, formatDateTimeForInput, toDate, calculateDuration } from "./utils/date"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

