import { BottomNavigation } from "@/components/bottom-navigate";
import { QueryClientContext } from "@/components/provider/query-provider";
import { Header } from "@/components/template/header";
import { Toaster } from "@/components/ui/sonner";
import { InfoDashboardProvider } from "@/context/info-dashboard-context";
import { getCurrentUser } from "@/lib/supabase/get-user";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await getCurrentUser();

  return (
    <div className="max-w-2xl mx-auto  min-h-screen flex flex-col relative">
      <QueryClientContext>
        <InfoDashboardProvider>
          <Header />

          {children}

          <BottomNavigation />
        </InfoDashboardProvider>
      </QueryClientContext>
      <Toaster />
    </div>
  );
}
