/**
 * Date Utilities
 *
 * This file re-exports all date utility functions from date.ts for backward compatibility.
 * New code should import directly from '@/lib/utils/date' instead.
 */

// Import formatDate function explicitly
import { formatDate } from './date';

// Re-export everything from date.ts
export * from './date';

/**
 * Safely format a date with a fallback value
 * This is a convenience function used in several components
 */
export function safeFormat(
  date: Date | string | null | undefined,
  formatString: string = "MMM d, yyyy",
  fallback: string = "N/A"
): string {
  // Use the formatDate function from date.ts
  return formatDate(date, formatString, fallback);
}
