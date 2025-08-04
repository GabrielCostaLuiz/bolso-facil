import { url } from "inspector";
import { cn } from "@/lib/utils";
import { getGreetingByTime } from "@/utils/getGreetingByTime";
import { AvatarFallback, AvatarImage, Avatar as AvatarUI } from "../ui/avatar";

export function Avatar({
  avatar,
  name,
  isFallback = "initial",
  showName = false,
  size = "sm",
  className = "",
  classNameAvatar = "",
  classNameText = "",
}: {
  avatar?: string;
  name?: string;
  isFallback?: "initial" | "image";
  showName?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  classNameAvatar?: string;
  classNameText?: string;
}) {
  const defaultInitials = "default";
  const defaultAvatar = "https://github.com/shadcn.png";

  const getInitials = (): string => {
    if (!name) {
      return defaultInitials
        .split(" ")
        .map((part) => part[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();
    }
    return name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase();
  };

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <AvatarUI
        className={cn(
          "rounded-full  object-cover m-0",
          size === "xs" && "w-6 h-6",
          size === "sm" && "w-8 h-8",
          size === "md" && "w-10 h-10",
          size === "lg" && "w-12 h-12",
          classNameAvatar
        )}
      >
        <AvatarImage
          src={avatar ? avatar : isFallback === "image" ? defaultAvatar : ""}
          alt={`Imagem de ${name}`}
        />
        <AvatarFallback
          className={cn(
            "w-full h-full bg-blue-500 flex items-center justify-center  text-white font-medium",
            size === "xs" && "text-xs",
            size === "sm" && "text-sm",
            size === "md" && "text-base",
            size === "lg" && "text-lg"
          )}
        >
          {getInitials()}
        </AvatarFallback>
      </AvatarUI>
      {showName && (
        <div className="flex flex-col ">
          <span className="text-xs font-semibold text-black/50 dark:text-gray-500/90">
            Olá, {getGreetingByTime()}
          </span>
          <span
            title={name}
            className={cn(
              " truncate capitalize  text-md font-bold",
              classNameText
            )}
          >
            {name}
          </span>
        </div>
      )}
    </div>
  );
}
