import { icons } from "../utils/icons";

export const expenseCategories = [
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
    name: "Outros",
    value: "other_expense",
    icon: icons.dices,
    bgColor: "bg-[#C0C0C0]",
  },
] as const;

export const incomeCategories = [
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
    value: "other_income",
    icon: icons.dices,
    bgColor: "bg-[#C0C0C0]",
  },
] as const;

export const billCategories = [
  {
    name: "Moradia",
    value: "housing",
    icon: icons.home,
    bgColor: "bg-[#6A5ACD]",
  },
  {
    name: "Contas de serviços",
    value: "utilities",
    icon: icons.lightbulb,
    bgColor: "bg-[#FFA500]",
  },
  {
    name: "Transporte",
    value: "transport",
    icon: icons.bus,
    bgColor: "bg-[#4DA6FF]",
  },
  {
    name: "Assinaturas",
    value: "subscriptions",
    icon: icons.creditCard,
    bgColor: "bg-[#FF69B4]",
  },
  {
    name: "Seguros",
    value: "insurance",
    icon: icons.shieldCheck,
    bgColor: "bg-[#20B2AA]",
  },
  {
    name: "Outros",
    value: "others",
    icon: icons.dices,
    bgColor: "bg-[#C0C0C0]",
  },
] as const;

export type ExpenseCategoryKeys = (typeof expenseCategories)[number]["value"];
export type IncomeCategoryKeys = (typeof incomeCategories)[number]["value"];
export type BillCategoryKeys = (typeof billCategories)[number]["value"];

export type TransactionCategoryKeys = ExpenseCategoryKeys | IncomeCategoryKeys;
