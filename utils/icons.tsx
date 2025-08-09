import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  ArrowUpDown,
  BadgeCheck,
  Banknote,
  Book,
  Box,
  Bus,
  CheckSquare,
  CircleX,
  CreditCard,
  Dices,
  Edit,
  ForkKnife,
  Gamepad2,
  Heart,
  Home,
  Info,
  Loader2,
  MessageSquareText,
  Moon,
  MoreVertical,
  Plus,
  PlusCircle,
  PlusIcon,
  Receipt,
  School2,
  Search,
  Settings,
  Sun,
  Tag,
  Trash,
  TriangleAlert,
} from "lucide-react";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

type IconFn = (className?: string | null, size?: number) => ReactElement;

const makeIcon =
  (IconComponent: React.FC<any>): IconFn =>
  (className, size) =>
    <IconComponent className={cn("", className)} size={size} />;

/**
 * Ícones.
 *
 * @param className Classe CSS opcional para customização.
 * @param size Tamanho opcional do ícone.
 * @returns JSX.Element do ícone.
 */
export const icons = {
  arrowUpDown: makeIcon(ArrowUpDown),
  arrowUp: makeIcon(ArrowUp),
  arrowDown: makeIcon(ArrowDown),
  arrowRight: makeIcon(ArrowRight),
  creditCard: makeIcon(CreditCard),
  home: makeIcon(Home),
  plus: makeIcon(Plus),
  plusIcon: makeIcon(PlusIcon),
  plusCircle: makeIcon(PlusCircle),
  settings: makeIcon(Settings),
  box: makeIcon(Box),
  banknote: makeIcon(Banknote),
  book: makeIcon(Book),
  bus: makeIcon(Bus),
  dices: makeIcon(Dices),
  tag: makeIcon(Tag),
  forkKnife: makeIcon(ForkKnife),
  gamepad2: makeIcon(Gamepad2),
  heart: makeIcon(Heart),
  school2: makeIcon(School2),
  sun: makeIcon(Sun),
  moon: makeIcon(Moon),
  loader2: makeIcon(Loader2),
  badgeCheck: makeIcon(BadgeCheck),
  circleX: makeIcon(CircleX),
  info: makeIcon(Info),
  warning: makeIcon(TriangleAlert),
  messageSquareText: makeIcon(MessageSquareText),
  moreVertical: makeIcon(MoreVertical),
  edit: makeIcon(Edit),
  trash: makeIcon(Trash),
  search: makeIcon(Search),
  receipt: makeIcon(Receipt),
  checkSquare: makeIcon(CheckSquare),
} satisfies Record<string, IconFn>;

export type IconKeys = keyof typeof icons;
