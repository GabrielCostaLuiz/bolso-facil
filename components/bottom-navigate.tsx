import { getCurrentUser } from "@/lib/supabase/get-user";
import { cn } from "@/lib/utils";
import type { IconKeys } from "@/utils/icons";
import { Link } from "./common/link";
import { DialogTransaction } from "./dialog-transaction";

export async function BottomNavigation() {
  const user = await getCurrentUser();

  const urlBase = user ? `/dashboard/${user.sub}` : "/dashboard";

  const navItems: {
    id: string;
    icon: IconKeys;
    label: string;
    href: string;
  }[] = [
    {
      id: "inicio",
      icon: "home",
      label: "Início",
      href: urlBase,
    },
    {
      id: "transacoes",
      icon: "arrowUpDown",
      label: "Transações",
      href: `${urlBase}/transactions`,
    },
    {
      id: "actions",
      icon: "plusIcon",
      label: "Ação",
      href: "",
    },
    {
      id: "contas",
      icon: "creditCard",
      label: "Contas",
      href: `${urlBase}/bills`,
    },
    {
      id: "categorias",
      icon: "tag",
      label: "Categorias",
      href: `${urlBase}/categories`,
    },
  ];
  return (
    <div className="fixed bottom-2 left-0 right-0 bg-card px-2 border w-fit mx-auto rounded-full z-50">
      <div className="flex justify-around items-center gap-3">
        {navItems.map((item) => {
          if (item.id === "actions") {
            return <DialogTransaction key={item.id} user={user} />;
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              icon={item.icon}
              showLabel={false}
              className={cn(
                "flex flex-col items-center justify-center w-full py-2 transition-colors"
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
