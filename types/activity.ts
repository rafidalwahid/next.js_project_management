/**
 * Activity and Event Types
 * 
 * This file contains all type definitions related to activities and events in the application.
 * Following Next.js 15 documentation standards for type definitions.
 */

/**
 * Base Activity interface representing the core activity data
 */
export interface Activity {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  description?: string | null;
  userId: string;
  projectId?: string | null;
  taskId?: string | null;
  createdAt: string | Date;
}

/**
 * Activity with related entities
 */
export interface ActivityWithRelations extends Activity {
  user: {
    id: string;
    name?: string | null;
    email: string;
    image?: string | null;
  };
  project?: {
    id: string;
    title: string;
  } | null;
  task?: {
    id: string;
    title: string;
  } | null;
}

/**
 * Activity Filter Options
 */
export interface ActivityFilterOptions {
  userId?: string;
  projectId?: string;
  taskId?: string;
  entityType?: string;
  action?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'createdAt' | 'action' | 'entityType';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Activity API Response
 */
export interface ActivityResponse {
  activity: ActivityWithRelations;
}

/**
 * Activities List API Response
 */
export interface ActivitiesListResponse {
  activities: ActivityWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Base Event interface representing the core event data
 */
export interface Event {
  id: string;
  title: string;
  description?: string | null;
  date: string | Date;
  projectId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

/**
 * Event with related entities
 */
export interface EventWithRelations extends Event {
  project: {
    id: string;
    title: string;
  };
}

/**
 * Event Creation DTO
 */
export interface CreateEventDTO {
  title: string;
  description?: string;
  date: string;
  projectId: string;
}

/**
 * Event Update DTO
 */
export interface UpdateEventDTO {
  title?: string;
  description?: string | null;
  date?: string;
}

/**
 * Event Filter Options
 */
export interface EventFilterOptions {
  projectId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: 'title' | 'date' | 'createdAt';
  sortDirection?: 'asc' | 'desc';
}

/**
 * Event API Response
 */
export interface EventResponse {
  event: EventWithRelations;
}

/**
 * Events List API Response
 */
export interface EventsListResponse {
  events: EventWithRelations[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

/**
 * Calendar Event interface (for calendar display)
 */
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay?: boolean;
  description?: string;
  projectId?: string;
  projectTitle?: string;
  color?: string;
}
