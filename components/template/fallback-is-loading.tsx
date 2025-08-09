import { cn } from "@/lib/utils";
import { icons } from "@/utils/icons";

export function FallBackIsLoading({
  fullPage,
  className = "",
  classNameIcon = "",
}: {
  fullPage?: boolean;
  className?: string;
  classNameIcon?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center h-full grow flex-1",
        fullPage && "absolute inset-0 bg-black  z-50",
        className
      )}
    >
      {icons.loader2(
        `animate-spin ${fullPage ? "w-10 h-10" : "w-5 h-5"} ${classNameIcon}`
      )}
    </div>
  );
}
