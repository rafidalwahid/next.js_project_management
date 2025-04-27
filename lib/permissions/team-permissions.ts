import { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { RolePermissionService } from "@/lib/services/role-permission-service";
import { logActivity } from "@/lib/activity-logger";

/**
 * Check if a user has permission to access a team member
 * @param teamMemberId The ID of the team member to check
 * @param session The user's session
 * @param action The action being performed (view, update, delete)
 * @returns An object with hasPermission and teamMember properties
 */
export async function checkTeamMemberPermission(
  teamMemberId: string,
  session: Session | null,
  action: 'view' | 'update' | 'delete' = 'view'
) {
  // If no session, no permission
  if (!session || !session.user.id) {
    return { hasPermission: false, teamMember: null, error: "Unauthorized" };
  }

  // Get the team member with project and user details
  const teamMember = await prisma.teamMember.findUnique({
    where: { id: teamMemberId },
    include: {
      project: {
        select: {
          id: true,
          title: true,
          createdById: true,
        },
      },
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!teamMember) {
    return { hasPermission: false, teamMember: null, error: "Team member not found" };
  }

  // Check if user is part of the same project
  const userTeamMember = await prisma.teamMember.findUnique({
    where: {
      projectId_userId: {
        projectId: teamMember.projectId,
        userId: session.user.id,
      },
    },
  });

  // Check if user is admin
  const isAdmin = session.user.role === 'admin';

  // Check if user is the project creator
  const isProjectCreator = teamMember.project.createdById === session.user.id;

  // Check if user is manager
  const isManager = session.user.role === 'manager';

  // Check if user is the team member themselves
  const isSelf = teamMember.userId === session.user.id;

  let hasPermission = false;
  let permissionName = '';

  // Map action to permission name
  switch (action) {
    case 'view':
      permissionName = 'team_view';
      break;
    case 'update':
      permissionName = 'team_edit';
      break;
    case 'delete':
      permissionName = 'team_remove';
      break;
  }

  // Determine permission based on action and user role
  if (action === 'view') {
    // Admins, managers, project creators, and team members can view
    hasPermission = isAdmin || isManager || isProjectCreator || !!userTeamMember || isSelf;
  } else if (action === 'update') {
    // Only admins, managers, and project creators can update team members
    hasPermission = isAdmin || isManager || isProjectCreator;

    // Special case: can't update project creator's membership
    if (teamMember.project.createdById === teamMember.userId) {
      return {
        hasPermission: false,
        teamMember,
        error: "Cannot update the project creator's membership"
      };
    }
  } else if (action === 'delete') {
    // Admins, managers, and project creators can remove team members, users can remove themselves
    hasPermission = isAdmin || isManager || isProjectCreator || isSelf;

    // Special case: can't remove project creator
    if (teamMember.project.createdById === teamMember.userId) {
      return {
        hasPermission: false,
        teamMember,
        error: "Cannot remove the project creator from the team"
      };
    }
  }

  // Log the permission check
  const result = {
    hasPermission,
    teamMember,
    error: hasPermission ? null : `You don't have permission to ${action} this team member`
  };

  // Log permission checks for audit purposes (only log failures)
  if (!hasPermission) {
    console.warn(`Permission denied: User ${session.user.id} attempted to ${action} team member ${teamMemberId}`);

    try {
      await logActivity({
        userId: session.user.id,
        action: 'permission_denied',
        entityType: 'TeamMember',
        entityId: teamMemberId,
        description: `Permission denied: User attempted to ${action} team member ${teamMember.user.name || teamMember.user.email}`,
        projectId: teamMember.projectId
      });
    } catch (error) {
      console.error('Failed to log permission denial:', error);
    }
  }

  return result;
}

/**
 * Check if a user has permission to manage team members in a project
 * @param projectId The ID of the project to check
 * @param session The user's session
 * @param action The action being performed (view, add, manage)
 * @returns An object with hasPermission and project properties
 */
export async function checkProjectTeamPermission(
  projectId: string,
  session: Session | null,
  action: 'view' | 'add' | 'manage' = 'view'
) {
  // If no session, no permission
  if (!session || !session.user.id) {
    return { hasPermission: false, project: null, error: "Unauthorized" };
  }

  // Get the project with team members
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      teamMembers: {
        where: {
          userId: session.user.id,
        },
        select: {
          role: true,
        },
      },
    },
  });

  if (!project) {
    return { hasPermission: false, project: null, error: "Project not found" };
  }

  // Check if user is admin
  const isAdmin = session.user.role === 'admin';

  // Check if user is the project creator
  const isProjectCreator = project.createdById === session.user.id;

  // Check if user is manager
  const isManager = session.user.role === 'manager';

  // Check if user is any team member
  const isTeamMember = project.teamMembers.length > 0;

  let hasPermission = false;

  // For view actions, any team member can view the team
  if (action === 'view') {
    hasPermission = isAdmin || isManager || isProjectCreator || isTeamMember;
  }
  // For add/manage actions, need admin or manager permissions
  else if (action === 'add' || action === 'manage') {
    hasPermission = isAdmin || isManager || isProjectCreator;
  }

  return {
    hasPermission,
    project,
    error: hasPermission ? null : `You don't have permission to ${action} team members in this project`
  };
}
