import { BottomNavigation } from "@/components/bottom-navigate";
import { QueryClientContext } from "@/components/provider/query-provider";
import { Header } from "@/components/template/header";
import { Toaster } from "@/components/ui/sonner";
import { InfoDashboardProvider } from "@/context/info-dashboard-context";

export default async function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
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
