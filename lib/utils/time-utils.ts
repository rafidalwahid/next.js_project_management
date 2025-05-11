/**
 * Utility functions for time and date operations
 */
import { WORK_DAY } from '@/lib/constants/attendance';

/**
 * Calculates total hours between two timestamps with a maximum cap
 * 
 * @param checkInTime The check-in timestamp
 * @param checkOutTime The check-out timestamp
 * @param maxHours Maximum allowed hours (defaults to MAX_HOURS_PER_DAY from constants)
 * @returns Total hours as a number with 2 decimal places
 */
export function calculateTotalHours(
  checkInTime: Date,
  checkOutTime: Date,
  maxHours: number = WORK_DAY.MAX_HOURS_PER_DAY
): number {
  // Ensure we're working with Date objects
  const startTime = new Date(checkInTime);
  const endTime = new Date(checkOutTime);

  // Basic validation
  if (startTime >= endTime) {
    return 0; // Invalid time range
  }

  // Calculate duration in milliseconds
  const durationMs = endTime.getTime() - startTime.getTime();

  // Convert to hours (decimal)
  const hours = durationMs / (1000 * 60 * 60);

  // Apply maximum hours constraint
  const cappedHours = Math.min(hours, maxHours);

  // Return with 2 decimal precision
  return Math.round(cappedHours * 100) / 100;
}

/**
 * Formats a duration in milliseconds to a human-readable string
 * 
 * @param durationMs Duration in milliseconds
 * @returns Formatted duration string (e.g., "2h 30m")
 */
export function formatDuration(durationMs: number): string {
  if (durationMs <= 0) {
    return '0m';
  }

  const hours = Math.floor(durationMs / (1000 * 60 * 60));
  const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));

  if (hours === 0) {
    return `${minutes}m`;
  } else if (minutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Formats a time string (HH:MM) to a 12-hour format with AM/PM
 * 
 * @param timeString Time string in 24-hour format (HH:MM)
 * @returns Formatted time string in 12-hour format
 */
export function formatTimeString(timeString: string): string {
  if (!timeString || !timeString.includes(':')) {
    return timeString || '';
  }

  const [hoursStr, minutesStr] = timeString.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10);

  if (isNaN(hours) || isNaN(minutes)) {
    return timeString;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  const displayMinutes = minutes.toString().padStart(2, '0');

  return `${displayHours}:${displayMinutes} ${period}`;
}

/**
 * Calculates the time difference between two dates in a human-readable format
 * 
 * @param startDate The start date
 * @param endDate The end date
 * @returns Formatted time difference
 */
export function getTimeDifference(startDate: Date, endDate: Date): string {
  const diffMs = endDate.getTime() - startDate.getTime();
  return formatDuration(diffMs);
}

/**
 * Checks if a date is today
 * 
 * @param date The date to check
 * @returns Boolean indicating if the date is today
 */
export function isToday(date: Date): boolean {
  const today = new Date();
  return date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();
}

/**
 * Gets the relative time description (e.g., "2 days ago", "in 3 hours")
 * 
 * @param date The date to get relative time for
 * @returns Relative time description
 */
export function getRelativeTimeDescription(date: Date): string {
  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.floor(Math.abs(diffMs) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  const isPast = diffMs < 0;
  
  if (diffDays > 30) {
    // For dates more than a month ago/ahead, return the actual date
    return date.toLocaleDateString();
  } else if (diffDays > 0) {
    return isPast ? `${diffDays} day${diffDays > 1 ? 's' : ''} ago` : `in ${diffDays} day${diffDays > 1 ? 's' : ''}`;
  } else if (diffHours > 0) {
    return isPast ? `${diffHours} hour${diffHours > 1 ? 's' : ''} ago` : `in ${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  } else if (diffMinutes > 0) {
    return isPast ? `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago` : `in ${diffMinutes} minute${diffMinutes > 1 ? 's' : ''}`;
  } else {
    return isPast ? 'just now' : 'now';
  }
}
