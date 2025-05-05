# Task Detail View Documentation

## Overview

The task detail view is a comprehensive interface for viewing and managing individual tasks in the project management system. It provides a rich user experience with support for subtasks, comments, and attachments.

## Implementation

The task detail view is implemented in two versions:

1. **Global Task View** (`/app/tasks/[taskId]/page.tsx`) - A standalone view for any task
2. **Project-Specific Task View** (`/app/projects/[projectId]/tasks/[taskId]/page.tsx`) - A view within a project context

## Key Components and Features

### 1. Task Header Section

The header section includes:
- A completion toggle button (circle/check circle)
- Status badge showing the current task status
- Edit and Delete buttons (with delete in a dropdown menu)
- Task title with conditional styling for completed tasks
- Priority badge and due date information
- Assignees display with avatars
- Time tracking summary

### 2. Breadcrumb Navigation

The breadcrumb navigation provides:
- A back button to return to the tasks list
- Links to navigate to the parent project
- Parent task link (if the current task is a subtask)

### 3. Description Section

The description section:
- Displays the task description with proper formatting
- Shows a placeholder when no description is provided
- Includes an edit/add button to modify the description

### 4. Tabbed Content

The tabbed content includes:
- **Subtasks Tab**: For managing nested subtasks
- **Comments Tab**: For discussion and communication
- **Attachments Tab**: For file uploads and management
- Each tab shows a count badge when there are items

### 5. Subtasks Management

The subtasks management includes:
- An inline form for creating new subtasks
- A list of existing subtasks with completion toggles
- Support for nested subtasks with expand/collapse functionality
- Ability to add nested subtasks at any level
- Delete functionality for subtasks

### 6. Comments System

The comments system includes:
- A textarea for adding new comments
- A list of existing comments with user avatars and timestamps
- Delete functionality for comments
- Responsive design for different screen sizes

### 7. Attachments System

The attachments system includes:
- A file upload button that triggers a hidden file input
- A preview of the selected file before uploading
- A list of existing attachments with file type icons
- Download and delete functionality for attachments
- File size formatting and file type detection

## Key Functionality

### Task Data Fetching

- The page fetches task data from the API when it loads
- It includes subtasks, comments, and attachments in the request
- Error handling with toast notifications

### Task Completion Toggle

- Users can mark tasks as complete or incomplete
- Optimistic UI updates before API confirmation
- Visual feedback with color changes and checkmarks

### Subtask Management

- Create new subtasks directly from the task view
- Toggle subtask completion status
- Support for nested subtasks with expand/collapse functionality
- Delete subtasks with confirmation

### Comments Management

- Add new comments with a textarea
- View existing comments with user information and timestamps
- Delete comments with optimistic UI updates

### Attachments Management

- Upload files with preview before submission
- View existing attachments with file type icons
- Download attachments by opening the file URL
- Delete attachments with confirmation

### Task Editing

- Edit task details through a responsive dialog
- Update task title, description, dates, priority, etc.
- Refresh task data after edits
- Native HTML date pickers for improved usability

### Task Deletion

- Delete tasks with confirmation
- Navigate back to the tasks list after deletion

## Responsive Design

The task detail view is fully responsive with:
- Different layouts for mobile and desktop
- Collapsible elements for smaller screens
- Adaptive button sizes and text
- Hidden elements on mobile with alternative compact designs
- Flexible grid layouts that adjust to screen size

## API Integration

The task detail view integrates with several API endpoints:
- `/api/tasks/${taskId}` - Get task details, update task, delete task
- `/api/tasks/${taskId}/comments` - Get, add, and delete comments
- `/api/tasks/${taskId}/attachments` - Get, add, and delete attachments
- `/api/tasks` - Create new subtasks

## Recent Improvements

- Replaced custom date picker with native HTML date inputs for better compatibility
- Made the edit task dialog fully responsive for all screen sizes
- Improved button layout on mobile devices
- Enhanced form grid layouts for better responsiveness
- Added proper overflow handling for long content

## Future Enhancements

- Real-time updates using WebSockets
- Drag-and-drop for subtask reordering
- Rich text editor for task descriptions and comments
- Image preview for image attachments
- Collaborative editing with presence indicators
