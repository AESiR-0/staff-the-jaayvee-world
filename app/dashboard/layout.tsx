import Sidebar from "@/components/Sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-primary-bg text-primary-fg">
      <Sidebar />
      <main className="lg:ml-64">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}
