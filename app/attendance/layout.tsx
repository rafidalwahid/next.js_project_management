import { Metadata } from "next"

export const metadata: Metadata = {
  title: "Attendance | ProjectPro",
  description: "Track and manage your work hours",
}

export default function AttendanceLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
