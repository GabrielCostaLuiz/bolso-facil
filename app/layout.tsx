// import { StackProvider, StackTheme } from "@stackframe/stack";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
// import { stackServerApp } from "../stack";
import "./globals.css";
import { ThemeProvider } from "@/components/provider/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bolso Fácil – Controle de Gastos Pessoais",
  description:
    "Gerencie suas receitas e despesas de forma simples e prática. O Bolso Fácil ajuda você a manter suas finanças organizadas sem complicação.",
  authors: [
    { name: "Gabriel Costa", url: "https://www.gabrielcostaluiz.com.br" },
  ],
  creator: "Gabriel Costa",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen  `}
      >
        {/* <StackProvider app={stackServerApp}>
          <StackTheme>{children}</StackTheme>
        </StackProvider> */}
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <footer className="w-full py-6 flex items-center justify-start px-4 border-t">
            <a
              href="https://gabrielcostaluiz.com.br"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Desenvolvido por{" "}
              <span className="font-medium">Gabriel Costa Luiz</span>
            </a>
          </footer>{" "}
        </ThemeProvider>
      </body>
    </html>
  );
}
