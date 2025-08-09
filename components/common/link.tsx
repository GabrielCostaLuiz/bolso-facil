"use client";

import LinkNext from "next/link";
import { usePathname } from "next/navigation";
import { useInfoDashboard } from "@/context/info-dashboard-context";
import { cn } from "@/lib/utils";
import { type IconKeys, icons } from "@/utils/icons";

export function Link({
  href,
  className = "",
  children,
  icon,
  showLabel = true,
  hrefComplement = false,
  ...props
}: {
  href: string;
  hrefComplement?: boolean;
  className?: string;
  icon?: IconKeys;
  children: React.ReactNode;
  showLabel?: boolean;
}) {
  const { urlBase } = useInfoDashboard();
  const pathname = usePathname();
  const isActive = pathname === href || (pathname === "/" && href === "/");
  const LinkIcon = icons[icon as IconKeys];

  return (
    <LinkNext
      href={hrefComplement ? urlBase + href : href}
      className={cn("", className)}
      {...props}
    >
      {icon && (
        <div
          className={cn("p-2 rounded-full", isActive ? "bg-primary/10" : "")}
        >
          {LinkIcon("h-5 w-5")}
        </div>
      )}

      {showLabel && (
        <span
          className={cn(
            "text-xs mt-1",
            isActive ? "font-medium" : "text-gray-500"
          )}
        >
          {children}
        </span>
      )}
    </LinkNext>
  );
}
