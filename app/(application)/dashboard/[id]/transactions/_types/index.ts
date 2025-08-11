import type { TransactionCategoryKeys } from "@/constants/categories-defaults";

export interface ITransactions {
  id: string;
  created_at: string;
  title: string;
  amount: number;
  category: TransactionCategoryKeys;
  description: string;
  type: "income" | "expense";
  user_id: string;
  date: Date;
  month: number;
  year: number;
}