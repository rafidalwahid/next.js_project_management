# Attendance System

The Project Management System includes a comprehensive attendance tracking system that allows users to record their work hours with geolocation data, manage attendance settings, and view attendance statistics.

## Check-in/Check-out

The attendance system provides a simple check-in/check-out mechanism for tracking work hours.

### Check-in Process

1. Users can check in from the dashboard or the attendance widget
2. The system records:
   - Check-in time
   - Geolocation (latitude, longitude)
   - Location name (reverse geocoded from coordinates)
   - IP address
   - Device information

### Check-out Process

1. Users can check out from the dashboard or the attendance widget
2. The system records:
   - Check-out time
   - Geolocation (latitude, longitude)
   - Location name (reverse geocoded from coordinates)
   - IP address
   - Device information
   - Total hours worked (calculated automatically)

### Auto-checkout

The system supports automatic checkout for users who forget to check out:

1. Users can enable auto-checkout in their attendance settings
2. Users can set a specific time for auto-checkout
3. The system will automatically check out users at the specified time
4. Auto-checkout records are flagged in the system for reporting purposes

## Geolocation Tracking

The attendance system uses the browser's Geolocation API to track user locations:

1. Location data is captured during check-in and check-out
2. Coordinates are reverse geocoded to human-readable location names
3. Location accuracy is configurable through system settings
4. Location data is displayed on maps in the attendance history

## Offline Support

The attendance system works even when users are offline:

1. Service Worker caches essential resources for offline use
2. Background Sync API queues check-in/check-out actions when offline
3. Actions are synchronized when the user comes back online
4. Users receive notifications when offline actions are synchronized

### Offline Check-in

When a user checks in while offline:

1. The check-in data is stored in IndexedDB
2. A Background Sync task is registered
3. The UI updates to show the user as checked in
4. When the user comes back online, the service worker syncs the data with the server

### Offline Check-out

When a user checks out while offline:

1. The check-out data is stored in IndexedDB
2. A Background Sync task is registered
3. The UI updates to show the user as checked out
4. When the user comes back online, the service worker syncs the data with the server

## Attendance Analytics

The system provides comprehensive attendance analytics:

1. Daily, weekly, and monthly summaries
2. Working hours statistics
3. Attendance patterns and trends
4. Late arrivals and early departures
5. Overtime calculations

### Attendance Dashboard

The attendance dashboard provides an overview of:

1. Current attendance status
2. Today's working hours
3. Weekly and monthly summaries
4. Recent attendance history
5. Attendance statistics

### Attendance History

The attendance history page shows:

1. Detailed attendance records
2. Check-in and check-out times
3. Location information
4. Total hours worked
5. Filtering and search capabilities

## Attendance Settings

Users can customize their attendance settings:

1. Working hours per day
2. Working days of the week
3. Reminder notifications
4. Auto-checkout configuration

### Working Hours

Users can set their standard working hours:

1. Number of hours per day (default: 8)
2. Working days of the week (default: Monday-Friday)

### Reminders

Users can configure reminder notifications:

1. Enable/disable reminders
2. Set reminder time

### Auto-checkout

Users can configure automatic checkout:

1. Enable/disable auto-checkout
2. Set auto-checkout time

## Attendance Administration

Administrators have additional capabilities:

1. View team attendance records
2. Generate attendance reports
3. Manage attendance correction requests
4. Configure system-wide attendance settings

### Correction Requests

Users can request corrections to their attendance records:

1. Submit correction requests with justification
2. Administrators can approve or reject requests
3. Approved corrections update the attendance records
4. Correction history is maintained for auditing

### Team Attendance

Managers and administrators can view team attendance:

1. Daily attendance status for team members
2. Attendance statistics by team or department
3. Attendance reports for specific periods
4. Export attendance data for reporting

## API Integration

The attendance system provides a comprehensive API for integration:

1. Check-in and check-out endpoints
2. Attendance history and statistics
3. Settings management
4. Administration functions

## Mobile Compatibility

The attendance system is fully compatible with mobile devices:

1. Responsive design for mobile screens
2. Mobile-optimized geolocation
3. Offline support for mobile users
4. Push notifications for reminders
