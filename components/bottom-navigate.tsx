"use client";

import {
  ArrowUpDown,
  CreditCard,
  Home,
  Plus,
  PlusCircle,
  PlusIcon,
  Settings,
  Tag,
} from "lucide-react";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { DialogTransaction } from "./dialog-transaction";
import { Button } from "./ui/button";

const navItems = [
  {
    id: "inicio",
    icon: Home,
    label: "Início",
    href: "/",
  },
  {
    id: "transacoes",
    icon: ArrowUpDown,
    label: "Transações",
    href: "/transactions",
  },
  {
    id: "actions",
    icon: PlusIcon,
    label: "Ação",
    href: "",
  },
  {
    id: "contas",
    icon: CreditCard,
    label: "Contas",
    href: "/bills",
  },
  {
    id: "categorias",
    icon: Tag,
    label: "Categorias",
    href: "/categories",
  },
];

export function BottomNavigation() {
  const pathname = usePathname();
  const isActive = (path: string) =>
    pathname === path || (pathname === "/" && path === "/");

  return (
    <div className="fixed bottom-2 left-0 right-0 bg-card px-2 border w-fit mx-auto rounded-full">
      <div className="flex justify-around items-center gap-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const itemIsActive = isActive(item.href);

          if (item.id === "actions") {
            return <DialogTransaction key={item.id} />;
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-full py-2 transition-colors",
                itemIsActive
                  ? "text-primary"
                  : "text-gray-500 hover:text-primary"
              )}
            >
              <div
                className={cn(
                  "p-2 rounded-full",
                  itemIsActive ? "bg-primary/10" : ""
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              {/* <span className={cn(
                "text-xs mt-1",
                itemIsActive ? "font-medium" : ""
              )}>
                {item.label}
              </span> */}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
