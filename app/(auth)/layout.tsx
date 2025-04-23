export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="h-14 flex items-center px-4 border-b">
        <div className="font-semibold">Project Management</div>
      </header>
      <main className="flex-1 flex items-center justify-center">
        {children}
      </main>
    </div>
  )
}