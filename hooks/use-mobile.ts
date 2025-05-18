'use client';

import { useBreakpoints } from './use-breakpoints';

/**
 * Legacy hook for backward compatibility
 * @deprecated Use useBreakpoints().isMobile instead
 */
export function useIsMobile() {
  const { isMobile } = useBreakpoints();
  return isMobile;
}
