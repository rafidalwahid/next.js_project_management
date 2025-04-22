import prisma from '../prisma';
import { Prisma, User } from '../prisma-client';
import { hash } from 'bcrypt';

// User types for API operations
export type UserCreateInput = {
  name: string;
  email: string;
  password?: string;
  image?: string;
  role?: string;
};

export type UserUpdateInput = Partial<UserCreateInput>;

// Get all users with optional filters
export async function getUsers(args: {
  skip?: number;
  take?: number;
  orderBy?: Prisma.UserOrderByWithRelationInput;
  where?: Prisma.UserWhereInput;
  includeProjects?: boolean;
  includeTasks?: boolean;
} = {}) {
  const {
    skip = 0,
    take = 50,
    orderBy = { createdAt: 'desc' },
    where = {},
    includeProjects = false,
    includeTasks = false
  } = args;

  const select: Prisma.UserSelect = {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    // Never return the password
    password: false,
  };

  // Conditionally include relations
  if (includeProjects) {
    select.projects = {
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        startDate: true,
        endDate: true,
      }
    };
  }

  if (includeTasks) {
    select.tasks = {
      select: {
        id: true,
        title: true,
        description: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    };
  }

  return prisma.user.findMany({
    skip,
    take,
    where,
    orderBy,
    select,
  });
}

// Get user by ID with option to include relations
export async function getUserById(id: string, includeRelations: boolean = false) {
  const select: Prisma.UserSelect = {
    id: true,
    name: true,
    email: true,
    image: true,
    role: true,
    createdAt: true,
    updatedAt: true,
    emailVerified: true,
    // Never return the password
    password: false,
  };

  if (includeRelations) {
    select.projects = {
      select: {
        id: true,
        title: true,
        status: true,
        startDate: true,
        endDate: true,
        createdAt: true,
      }
    };
    // Get tasks directly assigned to the user (via assignedToId)
    select.tasks = {
      select: {
        id: true,
        title: true,
        priority: true,
        dueDate: true,
        project: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    };

    // Get tasks assigned via TaskAssignee table (multiple assignees)
    select.taskAssignments = {
      select: {
        id: true,
        task: {
          select: {
            id: true,
            title: true,
            priority: true,
            dueDate: true,
            project: {
              select: {
                id: true,
                title: true,
              }
            }
          }
        }
      }
    };
    select.activities = {
      take: 10,
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        action: true,
        entityType: true,
        description: true,
        createdAt: true,
        project: {
          select: {
            id: true,
            title: true,
          }
        },
        task: {
          select: {
            id: true,
            title: true,
          }
        }
      }
    };
  }

  return prisma.user.findUnique({
    where: { id },
    select,
  });
}

// Get user profile with stats
export async function getUserProfile(id: string) {
  const user = await getUserById(id, true);

  if (!user) {
    return null;
  }

  // Calculate user stats
  const stats = await getUserStats(id);

  // Combine tasks from both direct assignments and TaskAssignee table
  let allTasks = [...(user.tasks || [])];

  // Add tasks from taskAssignments if they exist
  if (user.taskAssignments && Array.isArray(user.taskAssignments)) {
    const tasksFromAssignments = user.taskAssignments
      .filter(assignment => assignment.task) // Filter out any null tasks
      .map(assignment => assignment.task);

    // Add tasks that aren't already in the allTasks array
    for (const task of tasksFromAssignments) {
      if (!allTasks.some(t => t.id === task.id)) {
        allTasks.push(task);
      }
    }
  }

  return {
    ...user,
    tasks: allTasks,
    stats
  };
}

// Calculate user statistics
export async function getUserStats(userId: string) {
  // Get project count
  const projectCount = await prisma.project.count({
    where: {
      teamMembers: {
        some: {
          userId,
        }
      }
    }
  });

  // Get task count (both direct assignments and via TaskAssignee table)
  const directTaskCount = await prisma.task.count({
    where: {
      assignedToId: userId
    }
  });

  const taskAssigneeCount = await prisma.taskAssignee.count({
    where: {
      userId
    }
  });

  const taskCount = directTaskCount + taskAssigneeCount;

  // Get team count (unique projects user is part of)
  const teamCount = await prisma.teamMember.count({
    where: {
      userId,
    }
  });

  // Calculate completion rate
  // We'll use the taskCount we already calculated above
  const totalTasks = taskCount;

  // Since we no longer have a status field, we'll use a placeholder value for now
  // In a real implementation, you might want to add a 'completed' boolean field to the Task model
  const completedTasks = 0;

  const completionRate = totalTasks > 0
    ? `${Math.round((completedTasks / totalTasks) * 100)}%`
    : '0%';

  return {
    projectCount,
    taskCount,
    teamCount,
    completionRate
  };
}

// Create a new user
export async function createUser(data: UserCreateInput) {
  const { password, ...userData } = data;

  // Hash password if provided
  const userToCreate: Prisma.UserCreateInput = {
    ...userData,
  };

  if (password) {
    userToCreate.password = await hash(password, 10);
  }

  const user = await prisma.user.create({
    data: userToCreate,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
    }
  });

  return user;
}

// Update user details
export async function updateUser(id: string, data: UserUpdateInput) {
  const { password, ...userData } = data;

  // Create update object
  const userToUpdate: Prisma.UserUpdateInput = {
    ...userData,
  };

  // Hash password if provided
  if (password) {
    userToUpdate.password = await hash(password, 10);
  }

  const user = await prisma.user.update({
    where: { id },
    data: userToUpdate,
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    }
  });

  return user;
}

// Delete a user
export async function deleteUser(id: string) {
  return prisma.user.delete({
    where: { id },
  });
}

// Update user profile image
export async function updateUserImage(id: string, imageUrl: string) {
  return prisma.user.update({
    where: { id },
    data: {
      image: imageUrl
    },
    select: {
      id: true,
      image: true
    }
  });
}

// Log user activity
export async function logUserActivity(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  description?: string,
  projectId?: string,
  taskId?: string,
) {
  return prisma.activity.create({
    data: {
      action,
      entityType,
      entityId,
      description,
      userId,
      projectId,
      taskId,
    }
  });
}