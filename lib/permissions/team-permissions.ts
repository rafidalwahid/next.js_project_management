import { Session } from "next-auth";
import prisma from "@/lib/prisma";
import { PermissionService } from "@/lib/permissions/unified-permission-service";
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

  // Get user role
  const userRole = session.user.role;

  // Check if user is the project creator
  const isProjectCreator = teamMember.project.createdById === session.user.id;

  // Check if user is the team member themselves
  const isSelf = teamMember.userId === session.user.id;

  let hasPermission = false;

  // Determine permission based on action
  if (action === 'view') {
    // For view actions, check team_view permission or direct involvement
    const hasViewPermission = await PermissionService.hasPermission(userRole, "team_view");
    hasPermission = hasViewPermission || isProjectCreator || !!userTeamMember || isSelf;
  }
  else if (action === 'update') {
    // For update actions, check team_management permission or project creator status
    const hasManagementPermission = await PermissionService.hasPermission(userRole, "team_management");
    hasPermission = hasManagementPermission || isProjectCreator;

    // Special case: can't update project creator's membership
    if (teamMember.project.createdById === teamMember.userId) {
      return {
        hasPermission: false,
        teamMember,
        error: "Cannot update the project creator's membership"
      };
    }
  }
  else if (action === 'delete') {
    // For delete actions, check team_remove permission or project creator status or self
    const hasRemovePermission = await PermissionService.hasPermission(userRole, "team_remove");
    hasPermission = hasRemovePermission || isProjectCreator || isSelf;

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

  // Get user role
  const userRole = session.user.role;

  // Check if user is the project creator
  const isProjectCreator = project.createdById === session.user.id;

  // Check if user is any team member
  const isTeamMember = project.teamMembers.length > 0;

  let hasPermission = false;

  // Determine permission based on action
  if (action === 'view') {
    // For view actions, check team_view permission or direct involvement
    const hasViewPermission = await PermissionService.hasPermission(userRole, "team_view");
    hasPermission = hasViewPermission || isProjectCreator || isTeamMember;
  }
  else if (action === 'add') {
    // For add actions, check team_add permission or project creator status
    const hasAddPermission = await PermissionService.hasPermission(userRole, "team_add");
    hasPermission = hasAddPermission || isProjectCreator;
  }
  else if (action === 'manage') {
    // For manage actions, check team_management permission or project creator status
    const hasManagementPermission = await PermissionService.hasPermission(userRole, "team_management");
    hasPermission = hasManagementPermission || isProjectCreator;
  }

  return {
    hasPermission,
    project,
    error: hasPermission ? null : `You don't have permission to ${action} team members in this project`
  };
}
