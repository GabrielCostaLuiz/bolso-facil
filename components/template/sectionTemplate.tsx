import type React from "react";
import { cn } from "@/lib/utils";

export function SectionTemplate({
  children,
  className = "",
  ...props
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section {...props} className={cn("container px-3 mx-auto ", className)}>
      {children}
    </section>
  );
}
