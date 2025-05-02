/**
 * Utility functions for handling date and time operations in the attendance system
 * These functions provide consistent date manipulation across the application
 */
import { format, parse, isWeekend, startOfDay, endOfDay, addMinutes, setHours, setMinutes, parseISO } from 'date-fns';
import { GRACE_PERIODS, WORK_DAY, DATE_FORMATS } from '@/lib/constants/attendance';

/**
 * Gets the start time of the workday for a specific date
 * @param date The reference date
 * @returns Date object representing the workday start time
 */
export function getWorkdayStart(date: Date): Date {
  return setMinutes(setHours(new Date(date), WORK_DAY.START_HOUR), WORK_DAY.START_MINUTE);
}

/**
 * Gets the end time of the workday for a specific date
 * @param date The reference date
 * @returns Date object representing the workday end time
 */
export function getWorkdayEnd(date: Date): Date {
  return setMinutes(setHours(new Date(date), WORK_DAY.END_HOUR), WORK_DAY.END_MINUTE);
}

/**
 * Gets the late threshold time for a specific date
 * @param date The reference date
 * @returns Date object representing the late threshold time
 */
export function getLateThreshold(date: Date): Date {
  const workdayStart = getWorkdayStart(date);
  return addMinutes(workdayStart, GRACE_PERIODS.LATE_ARRIVAL);
}

/**
 * Checks if a check-in time is considered late based on configured thresholds
 * @param checkInTime The check-in time to evaluate
 * @returns Boolean indicating if the check-in is considered late
 */
export function isLateCheckIn(checkInTime: Date): boolean {
  const lateThreshold = getLateThreshold(checkInTime);
  return checkInTime > lateThreshold;
}

/**
 * Gets the beginning and end of a day for database queries
 * @param date The reference date
 * @returns Object with start and end Date objects for the day
 */
export function getDayBoundaries(date: Date): { start: Date; end: Date } {
  return {
    start: startOfDay(date),
    end: endOfDay(date)
  };
}

/**
 * Formats a date string consistently for display
 * @param dateString Date string to format
 * @param formatStr Format string to use
 * @returns Formatted date string
 */
export function formatDate(dateString: string, formatStr: string = DATE_FORMATS.DISPLAY_DATE): string {
  try {
    // First try parsing as ISO string
    const date = new Date(dateString);
    if (!isNaN(date.getTime())) {
      return format(date, formatStr);
    }

    // Fallback to parsing as YYYY-MM-DD
    return format(parse(dateString, DATE_FORMATS.API_DATE, new Date()), formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return dateString; // Return original string if parsing fails
  }
}

/**
 * Formats time from a date object
 * @param date The date containing the time to format
 * @returns Formatted time string
 */
export function formatTime(date: Date): string {
  return format(date, DATE_FORMATS.DISPLAY_TIME);
}

/**
 * Creates URL parameters for date range queries
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns URL parameter string
 */
export function formatDateRangeParams(startDate: string, endDate: string): string {
  const params = new URLSearchParams();
  params.set('startDate', startDate);
  params.set('endDate', endDate);
  return params.toString();
}

/**
 * Checks if a date is a weekend
 * @param date The date to check
 * @returns Boolean indicating if the date is a weekend
 */
export function isWeekendDay(date: Date): boolean {
  return WORK_DAY.WEEKEND_DAYS.includes(date.getDay());
}

/**
 * Calculates work duration in hours
 * @param checkInTime Check-in time
 * @param checkOutTime Check-out time
 * @returns Hours worked (decimal)
 */
export function calculateWorkHours(checkInTime: Date, checkOutTime: Date): number {
  const durationMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.max(0, durationMs / (60 * 60 * 1000)); // Convert ms to hours
}

/**
 * Calculates work duration as percentage of standard workday
 * @param checkInTime Check-in time
 * @param checkOutTime Check-out time
 * @returns Percentage of standard workday (0-100)
 */
export function calculateWorkPercentage(checkInTime: Date, checkOutTime: Date): number {
  const durationMs = checkOutTime.getTime() - checkInTime.getTime();
  return Math.min(100, Math.round((durationMs / WORK_DAY.WORKING_HOURS_MS) * 100));
}

/**
 * Safely parses an ISO date string to a Date object
 * @param dateString ISO date string to parse
 * @returns Date object or current date if parsing fails
 */
export function safeParseISO(dateString: string): Date {
  try {
    if (!dateString) return new Date();

    const parsedDate = parseISO(dateString);

    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      console.warn(`Invalid date string: ${dateString}`);
      return new Date();
    }

    return parsedDate;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return new Date();
  }
}