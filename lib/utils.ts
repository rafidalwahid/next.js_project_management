import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format } from "date-fns"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date for display
 * @param date Date to format
 * @param formatString Optional format string (defaults to "MMM d, yyyy h:mm a")
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | null | undefined, formatString = "MMM d, yyyy h:mm a"): string {
  if (!date) {
    return "Not available";
  }

  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;

    if (!dateObj || isNaN(dateObj.getTime())) {
      return "Invalid date";
    }

    return format(dateObj, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return "Error formatting date";
  }
}

