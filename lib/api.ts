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
      data = textResponse ? JSON.parse(textResponse) : {};
    } catch (error) {
      console.error('API Error (parse failure):', error);
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
      throw new Error(JSON.stringify(enhancedError));
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      // Check if this is already our formatted error
      try {
        JSON.parse(error.message);
        // If we can parse it, it's already formatted, so just rethrow
      } catch {
        // Otherwise, it's an unexpected error, so log it
        console.error('API request failed:', {
          url,
          message: error.message,
          stack: error.stack
        });
      }
    } else {
      // Handle non-Error objects
      console.error('API request failed with non-Error:', {
        url,
        error: String(error)
      });
    }
    throw error;
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
    return fetchAPI(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(profileData),
    });
  },

  uploadProfileImage: async (userId: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);

    // Use the correct endpoint format that matches our API structure
    return fetch(`/api/users/${userId}/image`, {
      method: 'PUT',
      body: formData,
    }).then(res => res.json());
  },
};

/**
 * Project Status API functions
 */
export const projectStatusApi = {
  getProjectStatuses: async () => {
    return fetchAPI('/api/project-statuses');
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

    return fetchAPI(`/api/projects?${params.toString()}`);
  },

  getProject: async (id: string) => {
    return fetchAPI(`/api/projects/${id}`);
  },

  createProject: async (project: any) => {
    return fetchAPI('/api/projects', {
      method: 'POST',
      body: JSON.stringify(project),
    });
  },

  updateProject: async (id: string, project: any) => {
    return fetchAPI(`/api/projects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(project),
    });
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
  getTeamMembers: async (projectId?: string, page = 1, limit = 10) => {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    return fetchAPI(`/api/team?${params.toString()}`);
  },

  getTeamMember: async (id: string) => {
    return fetchAPI(`/api/team/${id}`);
  },

  addTeamMember: async (teamMember: any) => {
    return fetchAPI('/api/team', {
      method: 'POST',
      body: JSON.stringify(teamMember),
    });
  },

  updateTeamMember: async (id: string, teamMember: any) => {
    return fetchAPI(`/api/team/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(teamMember),
    });
  },

  removeTeamMember: async (id: string) => {
    return fetchAPI(`/api/team/${id}`, {
      method: 'DELETE',
    });
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

/**
 * Resource API functions
 */
export const resourceApi = {
  getResources: async (page = 1, limit = 10, filters: Record<string, any> = {}) => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // Add any additional filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value.toString());
    });

    return fetchAPI(`/api/resources?${params.toString()}`);
  },

  getResource: async (id: string) => {
    return fetchAPI(`/api/resources/${id}`);
  },

  createResource: async (resource: any) => {
    return fetchAPI('/api/resources', {
      method: 'POST',
      body: JSON.stringify(resource),
    });
  },

  updateResource: async (id: string, resource: any) => {
    return fetchAPI(`/api/resources/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(resource),
    });
  },

  deleteResource: async (id: string) => {
    return fetchAPI(`/api/resources/${id}`, {
      method: 'DELETE',
    });
  },
};
