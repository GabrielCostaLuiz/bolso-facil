import type { ReactNode } from "react";
import { toast as sonnerToast } from "sonner";
import { type IconKeys, icons } from "./icons";

type ToastType = "success" | "error" | "info" | "warning" | "default";

interface ToastOptions {
  idUpdate?: string | number;
  id?: string;
  description?: string;
  duration?: number;
  type?: ToastType;
  icon?: ReactNode;
}

const toastColors: Record<ToastType, string> = {
  success: "green",
  error: "red",
  info: "blue",
  warning: "yellow",
  default: "gray",
};

function getTypeConfig(type?: ToastType) {
  switch (type) {
    case "success":
      return {
        fn: sonnerToast.success,
        defaultIcon: icons.badgeCheck("h-4 w-4"),
      };
    case "error":
      return { fn: sonnerToast.error, defaultIcon: icons.circleX("h-4 w-4") };
    case "info":
      return { fn: sonnerToast.info, defaultIcon: icons.info("h-4 w-4") };
    case "warning":
      return { fn: sonnerToast.warning, defaultIcon: icons.warning("h-4 w-4") };
    default:
      return {
        fn: sonnerToast,
        defaultIcon: icons.messageSquareText("h-4 w-4"),
      };
  }
}

export function toast(title: string, options?: Omit<ToastOptions, "idUpdate">) {
  const {
    id,
    description,
    duration = 3000,
    type = "default",
    icon,
  } = options || {};
  const { fn, defaultIcon } = getTypeConfig(type);

  return fn(title, {
    id,
    description,
    duration,
    style: {
      backgroundColor: toastColors[type],
      alignItems: "center",
    },
    icon: icon ?? defaultIcon,
  });
}

// toast.success = (title: string, options?: Omit<ToastOptions, "idUpdate">) =>
//   toast(title, { ...options, type: "success" });

// toast.error = (title: string, options?: Omit<ToastOptions, "idUpdate">) =>
//   toast(title, { ...options, type: "error" });

// toast.info = (title: string, options?: Omit<ToastOptions, "idUpdate">) =>
//   toast(title, { ...options, type: "info" });

// toast.warning = (title: string, options?: Omit<ToastOptions, "idUpdate">) =>
//   toast(title, { ...options, type: "warning" });

toast.update = (title: string, options?: Omit<ToastOptions, "id">) => {
  const {
    description,
    duration = 3000,
    type = "default",
    idUpdate,
    icon,
  } = options || {};
  const { fn, defaultIcon } = getTypeConfig(type);

  return fn(title, {
    id: idUpdate,
    description,
    duration,
    className: toastColors[type],
    icon: icon ?? defaultIcon,
  });
};
