import { createClient } from "@/lib/supabase/server";
import { ShieldCheck } from "lucide-react";
import { Sidebar } from "@/components/admin/Sidebar";
import { LogoutButton } from "@/components/LogoutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden sm:block">
        <Sidebar />
      </div>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 sm:hidden">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
              <ShieldCheck className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="font-bold text-gray-900">TUVA Admin</span>
          </div>
          <LogoutButton />
        </header>
        <div className="hidden items-center justify-end border-b border-gray-200 bg-white px-8 py-2.5 sm:flex">
          <p className="text-xs text-gray-400">{user?.email}</p>
        </div>
        <main className="flex-1 px-4 py-6 sm:px-8 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
