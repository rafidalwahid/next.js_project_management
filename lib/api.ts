/**
 * API client utility for making requests to our backend API
 */

/**
 * Fetches data from the API with proper error handling
 */
export async function fetchAPI(url: string, options: RequestInit = {}) {
  // Set default headers for JSON requests if not provided
  options.headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  console.log(`API Request: ${options.method || 'GET'} ${url}`);

  try {
    const response = await fetch(url, options);
    console.log(`API Response status: ${response.status} ${response.statusText}`);

    // Try to parse JSON response
    let data;
    try {
      const textResponse = await response.text();
      console.log(`API Raw response: ${textResponse.substring(0, 200)}${textResponse.length > 200 ? '...' : ''}`);

      // Handle empty responses
      if (!textResponse || textResponse.trim() === '') {
        console.warn('Empty response received from API');
        data = {};
      } else if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
        // Handle HTML responses (likely an error page)
        console.error('Received HTML response instead of JSON:', textResponse.substring(0, 200));

        // For profile endpoints, return a default empty structure
        if (url.includes('/api/users/') && url.includes('profile=true')) {
          return {
            user: { id: 'unknown', name: 'Unknown User', email: 'unknown@example.com' },
            projects: [],
            tasks: [],
            activities: [],
            stats: { projectCount: 0, taskCount: 0, teamCount: 0, completionRate: '0%' }
          };
        } else if (url.includes('/api/team/user/')) {
          // For team memberships, return an empty array
          return [];
        }

        throw new Error(`Received HTML response instead of JSON. The API endpoint may not exist or returned an error page.`);
      } else {
        data = JSON.parse(textResponse);
      }

      // Check if data is empty or null
      if (!data || (typeof data === 'object' && Object.keys(data).length === 0)) {
        console.warn('API Warning: Empty response data');
      }
    } catch (error) {
      console.error('API Error (parse failure):', error);

      // For specific endpoints, return default values instead of throwing
      if (url.includes('/api/team/user/')) {
        console.warn('Returning empty array for team memberships due to parse error');
        return [];
      }

      throw new Error(`Failed to parse API response: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
      // Enhanced error handling
      const error = {
        status: response.status,
        statusText: response.statusText,
        message: data?.error || `Request failed with status ${response.status}`,
        details: data?.details || {}
      };

      console.error('API Error:', error);

      // Include more context in the error
      const enhancedError = {
        ...error,
        url,
        requestMethod: options.method || 'GET',
        timestamp: new Date().toISOString()
      };

      // Use a more descriptive error message that includes the status code
      throw new Error(`API request failed: ${response.status} ${response.statusText} - ${error.message}`);
    }

    return data;
  } catch (error) {
    // Create a more descriptive error message
    let errorMessage = 'API request failed';

    if (error instanceof Error) {
      console.error('API request failed:', {
        url,
        message: error.message,
        stack: error.stack
      });

      // Use the original error message
      errorMessage = `${errorMessage}: ${error.message}`;
    } else {
      // Handle non-Error objects
      console.error('API request failed with non-Error:', {
        url,
        error: String(error)
      });

      errorMessage = `${errorMessage}: ${String(error)}`;
    }

    // Create a new error with a more descriptive message
    const apiError = new Error(errorMessage);

    // Add the original error as a cause if supported
    if (error instanceof Error) {
      // @ts-ignore - cause property might not be recognized by TypeScript
      apiError.cause = error;
    }

    throw apiError;
  }
}

/**
 * User API functions
 */
export const userApi = {
  getUsers: async (search?: string, limit = 10) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (limit) params.append('limit', limit.toString());

    return fetchAPI(`/api/users?${params.toString()}`);
  },

  getUsersInProject: async (projectId: string, limit = 10) => {
    const params = new URLSearchParams();
    params.append('projectId', projectId);
    if (limit) params.append('limit', limit.toString());

    return fetchAPI(`/api/users?${params.toString()}`);
  },

  getUserProfile: async (userId: string) => {
    try {
      return fetchAPI(`/api/users/${userId}?profile=true`);
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  updateUserProfile: async (userId: string, profileData: any) => {
    console.log('Updating user profile:', userId, profileData);
    try {
      const result = await fetchAPI(`/api/users/${userId}`, {
        method: 'PATCH',
        body: JSON.stringify(profileData),
      });
      console.log('Update profile result:', result);
      return result;
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      throw error;
    }
  },

  uploadProfileImage: async (userId: string, file: File) => {
    console.log('Uploading profile image for user:', userId, 'File:', file.name, file.type, file.size);
    const formData = new FormData();
    formData.append('image', file);

    try {
      // Use the correct endpoint format that matches our API structure
      const response = await fetch(`/api/users/${userId}/image`, {
        method: 'PUT',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Profile image upload failed:', response.status, errorText);
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      console.log('Profile image upload result:', result);
      return result;
    } catch (error) {
      console.error('Error in uploadProfileImage:', error);
      throw error;
    }
  },
};

/**
 * Project Status API functions
 */
export const projectStatusApi = {
  getProjectStatuses: async () => {
    return fetchAPI('/api/project-statuses');
  },

  createStatus: async (status: any) => {
    return fetchAPI('/api/project-statuses', {
      method: 'POST',
      body: JSON.stringify(status),
    });
  },
};

/**
 * Project API functions
 */
export const projectApi = {
  getProjects: async (page = 1, limit = 10, filters?: Record<string, string>) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Add filters if valid
    if (filters && typeof filters === 'object') {
      Object.entries(filters).forEach(([key, value]) => {
        if (value && typeof value === 'string' && value !== '[object Object]') {
          params.append(key, value);
        }
      });
    }

    console.log("Fetching projects with URL:", `/api/projects?${params.toString()}`);
    try {
      const result = await fetchAPI(`/api/projects?${params.toString()}`);
      console.log("Projects API response:", result);
      return result;
    } catch (error) {
      console.error("Error fetching projects:", error);
      throw error;
    }
  },

  getProject: async (id: string) => {
    console.log('API client: Getting project with ID:', id);
    try {
      const result = await fetchAPI(`/api/projects/${id}`);
      console.log('API client: Get project response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error getting project:', error);
      throw error;
    }
  },

  createProject: async (project: any) => {
    return fetchAPI('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  updateProject: async (id: string, project: any) => {
    console.log('API client: Updating project with ID:', id, 'Data:', project);
    try {
      const result = await fetchAPI(`/api/projects/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(project),
      });
      console.log('API client: Update project response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error updating project:', error);
      throw error;
    }
  },

  deleteProject: async (id: string) => {
    return fetchAPI(`/api/projects/${id}`, {
      method: 'DELETE',
    });
  },
};

/**
 * Task API functions
 */
export const taskApi = {
  getTasks: async (page = 1, limit = 20, filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Add any additional filters with better validation
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== null &&
          value !== undefined &&
          value !== '[object Object]' &&
          String(value).trim() !== '') {
        params.append(key, value.toString());
      }
    });

    console.log('API getTasks params:', params.toString());
    return fetchAPI(`/api/tasks?${params.toString()}`);
  },

  getTask: async (id: string) => {
    console.log('API client: Getting task with ID:', id);
    try {
      const result = await fetchAPI(`/api/tasks/${id}`);
      console.log('API client: Get task response:', JSON.stringify({
        id: result.task.id,
        title: result.task.title,
        dueDate: result.task.dueDate
      }, null, 2));
      return result;
    } catch (error) {
      console.error('API client: Error getting task:', error);
      throw error;
    }
  },

  createTask: async (task: any) => {
    // Remove status if present
    const { status, ...taskWithoutStatus } = task;
    return fetchAPI('/api/tasks', {
      method: 'POST',
      body: JSON.stringify(taskWithoutStatus),
    });
  },

  updateTask: async (id: string, task: any) => {
    console.log('API client: Updating task with ID:', id, 'Data:', task);
    try {
      // Remove status if present
      const { status, ...taskWithoutStatus } = task;
      const result = await fetchAPI(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(taskWithoutStatus),
      });
      console.log('API client: Update task response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error updating task:', error);
      throw error;
    }
  },

  deleteTask: async (id: string) => {
    console.log('API client: Deleting task with ID:', id);
    try {
      const result = await fetchAPI(`/api/tasks/${id}`, {
        method: 'DELETE',
      });
      console.log('API client: Delete task response:', result);
      return result;
    } catch (error) {
      console.error('API client: Error deleting task:', error);
      throw error;
    }
  },

  reorderTask: async (taskId: string, newParentId: string | null, oldParentId: string | null, targetTaskId?: string, isSameParentReorder?: boolean) => {
    console.log('Calling reorderTask API with:', { taskId, newParentId, oldParentId, targetTaskId, isSameParentReorder });
    try {
      const result = await fetchAPI('/api/tasks/reorder', {
        method: 'POST',
        body: JSON.stringify({ taskId, newParentId, oldParentId, targetTaskId, isSameParentReorder }),
      });
      console.log('reorderTask API response:', result);
      return result;
    } catch (error) {
      console.error('reorderTask API error:', error);
      throw error;
    }
  },
};

/**
 * Team API functions
 */
export const teamApi = {
  // Generic fetcher for SWR
  fetcher: async (url: string) => {
    return fetchAPI(url);
  },

  getTeamMembers: async (projectId?: string, page = 1, limit = 10, search?: string) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    return fetchAPI(`/api/team?${params.toString()}`);
  },

  getTeamMember: async (id: string) => {
    return fetchAPI(`/api/team/${id}`);
  },

  getUserTeamMemberships: async (userId: string) => {
    try {
      console.log(`Fetching team memberships for user: ${userId}`);
      const response = await fetchAPI(`/api/team/user/${userId}`);
      console.log(`Team memberships response:`, response);

      // Handle different response formats
      if (Array.isArray(response)) {
        return response;
      } else if (response && typeof response === 'object') {
        // Try to extract array data if it exists
        const possibleArrays = Object.values(response).filter(val => Array.isArray(val));
        if (possibleArrays.length > 0) {
          return possibleArrays[0];
        }
      }

      // If we can't determine the format, return the response as is
      return response || [];
    } catch (error) {
      console.error(`Error fetching team memberships for user ${userId}:`, error);
      // Return empty array on error to prevent UI crashes
      return [];
    }
  },

  addTeamMember: async (teamMember: any) => {
    return fetchAPI('/api/team', {
      method: 'POST',
      body: JSON.stringify(teamMember),
    });
  },

  // updateTeamMember function removed as we no longer need to update team member roles

  removeTeamMember: async (id: string) => {
    return fetchAPI(`/api/team/${id}`, {
      method: 'DELETE',
    });
  },

  checkProjectMembership: async (projectId: string) => {
    return fetchAPI(`/api/projects/${projectId}/membership`);
  },
};

/**
 * Event API functions
 */
export const eventApi = {
  getEvents: async (projectId?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return fetchAPI(`/api/events?${params.toString()}`);
  },

  getEvent: async (id: string) => {
    return fetchAPI(`/api/events/${id}`);
  },

  createEvent: async (event: any) => {
    return fetchAPI('/api/events', {
      method: 'POST',
      body: JSON.stringify(event),
    });
  },

  updateEvent: async (id: string, event: any) => {
    return fetchAPI(`/api/events/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(event),
    });
  },

  deleteEvent: async (id: string) => {
    return fetchAPI(`/api/events/${id}`, {
      method: 'DELETE',
    });
  },
};


