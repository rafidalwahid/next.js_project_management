import { ComponentType } from "react"
import { RoleGuard } from "@/components/role-guard"

/**
 * Higher Order Component that wraps a component with a role guard
 * @param Component The component to wrap
 * @param roles The roles required to render the component
 * @param fallback Optional fallback component to render if role check fails
 */
export function withRole<P extends object>(
  Component: ComponentType<P>,
  roles: string[],
  fallback: React.ReactNode = null
) {
  return function WithRoleComponent(props: P) {
    return (
      <RoleGuard roles={roles} fallback={fallback}>
        <Component {...props} />
      </RoleGuard>
    )
  }
}
