"use client"

import { Shield, ShieldCheck, ShieldAlert, User, Users } from "lucide-react"
import { Badge, BadgeProps } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

type RoleType = "system" | "project"

interface RoleBadgeProps extends Omit<BadgeProps, "children"> {
  role: string
  type: RoleType
  showIcon?: boolean
  showTooltip?: boolean
}

export function RoleBadge({ 
  role, 
  type, 
  showIcon = true, 
  showTooltip = true,
  className,
  ...props 
}: RoleBadgeProps) {
  // Get the appropriate icon and style based on role and type
  const getIconAndVariant = () => {
    // System roles
    if (type === "system") {
      switch (role) {
        case "admin":
          return { 
            icon: <ShieldAlert className="mr-1 h-3 w-3" />, 
            variant: "destructive" as const,
            tooltip: "System-wide administrator with full access to all features"
          }
        case "manager":
          return { 
            icon: <ShieldCheck className="mr-1 h-3 w-3" />, 
            variant: "default" as const,
            tooltip: "System-wide manager with access to manage users and projects"
          }
        default:
          return { 
            icon: <User className="mr-1 h-3 w-3" />, 
            variant: "outline" as const,
            tooltip: "Regular system user with standard permissions"
          }
      }
    }
    
    // Project roles
    switch (role) {
      case "owner":
        return { 
          icon: <ShieldAlert className="mr-1 h-3 w-3" />, 
          variant: "secondary" as const,
          tooltip: "Project owner with full control over this project"
        }
      case "admin":
        return { 
          icon: <ShieldCheck className="mr-1 h-3 w-3" />, 
          variant: "secondary" as const,
          tooltip: "Project administrator with management permissions"
        }
      case "manager":
        return { 
          icon: <Shield className="mr-1 h-3 w-3" />, 
          variant: "secondary" as const,
          tooltip: "Project manager with team management permissions"
        }
      default:
        return { 
          icon: <Users className="mr-1 h-3 w-3" />, 
          variant: "outline" as const,
          tooltip: "Project team member with basic project access"
        }
    }
  }

  const { icon, variant, tooltip } = getIconAndVariant()
  
  const badge = (
    <Badge 
      variant={variant} 
      className={`capitalize ${type === "project" ? "border-dashed" : ""} ${className}`}
      {...props}
    >
      {showIcon && icon}
      {type === "system" ? role : `${role} (project)`}
    </Badge>
  )
  
  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {badge}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }
  
  return badge
}
