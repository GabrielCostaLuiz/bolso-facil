import { icons } from "../utils/icons";

export const categoriesDefaults = [
  {
    name: "Alimentação",
    value: "food",
    icon: icons.forkKnife,
    bgColor: "bg-[#FFB347]",
  },
  {
    name: "Transporte",
    value: "transport",
    icon: icons.bus,
    bgColor: "bg-[#4DA6FF]",
  },
  {
    name: "Entretenimento",
    value: "entertainment",
    icon: icons.gamepad2,
    bgColor: "bg-[#B19CD9]",
  },
  {
    name: "Saúde",
    value: "health",
    icon: icons.heart,
    bgColor: "bg-[#FF6961]",
  },
  {
    name: "Educação",
    value: "education",
    icon: icons.school2,
    bgColor: "bg-[#77DD77]",
  },
  {
    name: "Salário",
    value: "salary",
    icon: icons.banknote,
    bgColor: "bg-[#FFD700]",
  },
  {
    name: "Freelance",
    value: "freelance",
    icon: icons.book,
    bgColor: "bg-[#FFB6C1]",
  },
  {
    name: "Outros",
    value: "other",
    icon: icons.dices,
    bgColor: "bg-[#C0C0C0]",
  },
] as const;

export type CategoriesDefaultKeys =
  (typeof categoriesDefaults)[number]["value"];
