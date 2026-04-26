import Sidebar from "./Sidebar";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <Sidebar />
      <div className="flex-1 min-w-0 lg:ml-60">
        <main className="px-4 sm:px-8 py-6 sm:py-10 max-w-6xl mx-auto">{children}</main>
      </div>
    </div>
  );
}
