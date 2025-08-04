import { QueryClientContext } from "@/components/provider/query-provider";
import { Header } from "@/components/template/header";

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="max-w-2xl mx-auto">
      <QueryClientContext>
        <>
          <Header />
          {children}
        </>
      </QueryClientContext>
    </div>
  );
}
