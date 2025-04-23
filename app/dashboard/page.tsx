'use client';

import { RoleDashboard } from "./role-dashboard"

export default function DashboardPage() {
  return (
    <div className="flex flex-col space-y-6">
      <div className="flex-1 space-y-4">
        <RoleDashboard />
      </div>
    </div>
  )
}
