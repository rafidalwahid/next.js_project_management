import { Session } from "next-auth";
import prisma from "@/lib/prisma";

/**
 * Check if a user has permission to access a project
 * @param projectId The ID of the project to check
 * @param session The user's session
 * @param action The action being performed (view, update, delete, create)
 * @returns An object with hasPermission and project properties
 */
export async function checkProjectPermission(
  projectId: string,
  session: Session | null,
  action: 'view' | 'update' | 'delete' | 'create' = 'view'
) {
  // If no session, no permission
  if (!session || !session.user.id) {
    return { hasPermission: false, project: null, error: "Unauthorized" };
  }

  // Get the project with related data needed for permission checks
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      teamMembers: {
        where: {
          userId: session.user.id
        }
      }
    }
  });

  // If project doesn't exist, no permission
  if (!project) {
    return { hasPermission: false, project: null, error: "Project not found" };
  }

  // Check if user is admin
  const isAdmin = session.user.role === 'admin';
  
  // Check if user is manager
  const isManager = session.user.role === 'manager';
  
  // Check if user is the project creator
  const isProjectCreator = project.createdById === session.user.id;
  
  // Check if user is a team member of the project
  const isTeamMember = project.teamMembers.length > 0;

  let hasPermission = false;
  
  // Determine permission based on action and user role
  if (action === 'view') {
    // Anyone who is a team member can view
    hasPermission = isAdmin || isManager || isProjectCreator || isTeamMember;
  } else if (action === 'update') {
    // Only admins, managers, and project creators can update
    hasPermission = isAdmin || isManager || isProjectCreator;
  } else if (action === 'delete') {
    // Only admins and project creators can delete
    hasPermission = isAdmin || isProjectCreator;
  } else if (action === 'create') {
    // Only admins and managers can create projects
    hasPermission = isAdmin || isManager;
  }

  return { 
    hasPermission, 
    project,
    error: hasPermission ? null : "You don't have permission to " + action + " this project"
  };
}
